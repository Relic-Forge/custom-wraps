import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function panelPreviews(png, vehicle, placements, directory) {
  await fs.mkdir(directory, { recursive: true });
  const meta = await sharp(png).metadata();
  const entries = [];
  for (const id of [...new Set(placements.map((p) => p.panel))]) {
    const panel = vehicle.panels.find((p) => p.id === id);
    const rotations = [
      ...new Set(
        placements.filter((p) => p.panel === id).map((p) => p.rotation),
      ),
    ];
    const rotation = rotations.length === 1 ? rotations[0] : panel.rotation;
    const [x, y, w, h] = panel.bounds;
    const left = Math.floor((x * meta.width) / 1024),
      top = Math.floor((y * meta.height) / 1024);
    const width = Math.min(
      meta.width - left,
      Math.ceil((w * meta.width) / 1024),
    );
    const height = Math.min(
      meta.height - top,
      Math.ceil((h * meta.height) / 1024),
    );
    // Materialize the crop BEFORE rotating; libvips otherwise reorders operations.
    const crop = await sharp(png)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();
    const upright = await sharp(crop).rotate(-rotation).png().toBuffer();
    const file = `${id}.png`;
    await fs.writeFile(path.join(directory, file), upright, { flag: "wx" });
    entries.push({
      panel: id,
      label: panel.label,
      file,
      rotation,
      orientationVerified: panel.orientationVerified === true,
      evidence: panel.orientationEvidence || null,
      mixedRotations: rotations.length > 1,
    });
  }
  const report = {
    scope:
      "Composition inspection only. Counter-rotation does not independently verify vehicle mapping.",
    panels: entries,
  };
  await fs.writeFile(
    path.join(directory, "index.json"),
    JSON.stringify(report, null, 2),
    { flag: "wx" },
  );
  return report;
}
