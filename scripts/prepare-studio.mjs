import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { analyzeMask } from "../studio/core.js";
const root = path.resolve(import.meta.dirname, "..");
const vehicles = [];
for (const id of (await fs.readdir(root))
  .filter((x) => /^(model|cybertruck)/.test(x))
  .sort()) {
  const file = path.join(root, id, "template.png");
  try {
    await fs.access(file);
  } catch {
    continue;
  }
  const metadata = await sharp(file).metadata();
  const rgba = await sharp(file)
    .resize(1024, 1024, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const safeAlpha = new Uint8Array(1024 * 1024);
  for (let i = 0; i < safeAlpha.length; i++)
    safeAlpha[i] = rgba[i * 4] > 245 && rgba[i * 4 + 3] >= 250 ? 255 : 0;
  const panels = analyzeMask(safeAlpha, 1024, 1024);
  const readme = await fs.readFile(path.join(root, id, "README.md"), "utf8");
  const label = readme
    .split("\n")[0]
    .replace(/^# /, "")
    .replace(/ Custom Wraps$/, "");
  let left = 0,
    right = 0,
    center = 0;
  for (const p of panels) {
    p.aspect = metadata.height / metadata.width;
    const [x, y, w, h] = p.bounds,
      cx = x + w / 2,
      cy = y + h / 2;
    p.rotation = id === "cybertruck" ? 0 : cx < 350 ? 90 : cx > 674 ? -90 : 0;
    p.role = "detail";
    p.label = `Detail ${++center}`;
    if (id !== "cybertruck") {
      if (
        cx < 280 &&
        cy > 360 &&
        cy < 810 &&
        w > 85 &&
        h < 360 &&
        p.area > 20000
      ) {
        p.role = "left";
        p.label = `Left side ${++left}`;
      } else if (
        cx > 744 &&
        cy > 360 &&
        cy < 810 &&
        w > 85 &&
        h < 360 &&
        p.area > 20000
      ) {
        p.role = "right";
        p.label = `Right side ${++right}`;
      } else if (
        cx > 360 &&
        cx < 660 &&
        cy > 140 &&
        cy < 360 &&
        p.area > 25000
      ) {
        p.role = "hood";
        p.label = "Hood";
      } else if (cx > 360 && cx < 660 && cy > 910) {
        p.role = "rear";
        p.label = "Rear center";
      }
    }
    if (id === "modely-2025-premium" && p.role === "hood") {
      p.rotation = 180;
      p.orientationEvidence = "Owner reported 0-degree hood art upside down, 2026-09-21; 180 degrees for viewer at front bumper facing windshield. Not Tesla-certified.";
    }
    p.orientationVerified =
      id === "modely-2025-premium" &&
      ["left", "right"].includes(p.role);
  }
  for (const role of ["hood", "rear"]) {
    const candidates = panels
      .filter((p) => p.role === role)
      .sort((a, b) => b.area - a.area);
    for (const p of candidates.slice(1)) {
      p.role = "detail";
      p.label = `Detail ${++center}`;
    }
  }
  vehicles.push({
    id,
    label,
    width: metadata.width,
    height: metadata.height,
    template: `../${id}/template.png`,
    thumbnail: `../${id}/vehicle_image.png`,
    panels,
    preview: id === "cybertruck" ? "unmapped" : "approximate",
  });
}
await fs.writeFile(
  path.join(root, "studio/vehicles.json"),
  JSON.stringify(vehicles, null, 2) + "\n",
);
await fs.mkdir(path.join(root, "studio/vendor"), { recursive: true });
for (const [src, dst] of [
  ["build/three.module.js", "three.module.js"],
  ["build/three.core.js", "three.core.js"],
  ["examples/jsm/controls/OrbitControls.js", "OrbitControls.js"],
  ["LICENSE", "THREE-LICENSE.txt"],
])
  await fs.copyFile(
    path.join(root, "node_modules/three", src),
    path.join(root, "studio/vendor", dst),
  );
console.log(
  `Prepared ${vehicles.length} official templates and local 3D dependencies.`,
);
