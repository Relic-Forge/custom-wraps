export const SIZE = 1024;
export const MAX_BYTES = 1_000_000;
export function exportSizes(width = 1024, height = 1024) {
  return [1024, 768, Math.ceil((512 * width) / height)]
    .filter((w, i, a) => w <= 1024 && a.indexOf(w) === i)
    .map((w) => [w, Math.round((w * height) / width)])
    .filter(([w, h]) => Math.min(w, h) >= 512 && Math.max(w, h) <= 1024);
}
export function safeName(value) {
  return (
    (value
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .slice(0, 26) || "My_Wrap") + ".png"
  );
}
export function fitInPanel(width, height, panel, margin = 0.88) {
  const [x, y, w, h] = panel.safe;
  const rotated = Math.abs(panel.rotation) % 180 === 90;
  return {
    x: x + w / 2,
    y: y + h / 2,
    rotation: panel.rotation,
    scale:
      margin *
      Math.min(
        w / (rotated ? height : width),
        (h * (panel.aspect || 1)) / (rotated ? width : height),
      ),
    panel: panel.id,
  };
}
// Four-neighbour islands and the largest rectangle entirely inside each island.
// This is computed from official alpha, never from an AI-drawn template outline.
export function analyzeMask(alpha, width, height) {
  const labels = new Int32Array(width * height),
    panels = [];
  let id = 0;
  for (let start = 0; start < alpha.length; start++) {
    if (alpha[start] < 250 || labels[start]) continue;
    id++;
    const queue = [start];
    labels[start] = id;
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    for (let k = 0; k < queue.length; k++) {
      const p = queue[k],
        x = p % width,
        y = Math.floor(p / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (!labels[n] && alpha[n] >= 250) {
          labels[n] = id;
          queue.push(n);
        }
      }
    }
    if (queue.length < 500) continue;
    let best = [0, 0, 0, 0],
      area = 0;
    const hist = new Int32Array(maxX - minX + 2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++)
        hist[x - minX] = labels[y * width + x] === id ? hist[x - minX] + 1 : 0;
      const stack = [];
      for (let i = 0; i < hist.length; i++) {
        while (stack.length && hist[stack.at(-1)] > hist[i]) {
          const h = hist[stack.pop()],
            left = stack.length ? stack.at(-1) + 1 : 0,
            w = i - left;
          if (w * h > area) {
            area = w * h;
            best = [minX + left, y - h + 1, w, h];
          }
        }
        stack.push(i);
      }
    }
    panels.push({
      id: `panel-${id}`,
      area: queue.length,
      bounds: [minX, minY, maxX - minX + 1, maxY - minY + 1],
      safe: best,
    });
  }
  return panels.sort(
    (a, b) => a.bounds[1] - b.bounds[1] || a.bounds[0] - b.bounds[0],
  );
}
export function validateProject(p, ids) {
  if (
    !p ||
    ![1, 2].includes(p.version) ||
    !ids.includes(p.vehicle) ||
    !Array.isArray(p.layers) ||
    p.layers.length > 10000 ||
    p.layers.filter((l) => l.type !== "stroke").length > 150
  )
    throw Error(
      "Choose a Wrap Studio project with a supported vehicle (up to 150 artwork layers and 10,000 strokes).",
    );
  if (!/^#[a-f\d]{6}$/i.test(p.baseColor))
    throw Error("Invalid project background.");
  for (const l of p.layers) {
    if (!["image", "text", "stroke"].includes(l.type))
      throw Error("Unsupported layer type.");
    if (
      !["x", "y", "scale", "rotation", "opacity"].every((k) =>
        Number.isFinite(l[k]),
      )
    )
      throw Error("Invalid layer position.");
    if (l.scale <= 0 || l.scale > 100 || l.opacity < 0 || l.opacity > 1)
      throw Error("Invalid layer size or opacity.");
    if (
      l.type === "image" &&
      !/^data:image\/(png|jpeg|webp);base64,/.test(l.src)
    )
      throw Error("Projects must contain embedded PNG, JPEG, or WebP images.");
    if (
      l.type === "image" &&
      (!Number.isFinite(l.width) ||
        !Number.isFinite(l.height) ||
        l.width <= 0 ||
        l.height <= 0 ||
        l.width > 32768 ||
        l.height > 32768)
    )
      throw Error("Invalid image dimensions.");
    if (
      l.type === "text" &&
      (typeof l.text !== "string" || l.text.length > 200)
    )
      throw Error("Invalid text layer.");
    if (
      l.type === "stroke" &&
      (!Array.isArray(l.points) ||
        l.points.length > 100000 ||
        l.points.some((p) => p.length !== 3 || !p.every(Number.isFinite)))
    )
      throw Error("Invalid drawing data.");
    if (
      l.type === "stroke" &&
      (!Number.isFinite(l.size) ||
        l.size < 0.1 ||
        l.size > 200 ||
        !/^#[a-f\d]{6}$/i.test(l.color))
    )
      throw Error("Invalid brush.");
  }
  return p;
}
