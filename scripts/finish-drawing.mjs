import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { safeName } from "../studio/core.js";
import { exportImage } from "./export-image.mjs";
import { validateWrap } from "./validate-wrap.mjs";
const root = path.resolve(import.meta.dirname, "..");
export async function finishDrawing(
  input,
  vehicleId,
  outputDirectory,
  name = "My_Drawing",
) {
  const catalog = JSON.parse(
    await fs.readFile(path.join(root, "studio/vehicles.json"), "utf8"),
  );
  const vehicle = catalog.find((v) => v.id === vehicleId);
  if (!vehicle) throw Error("Unknown vehicle ID.");
  const source = await sharp(input)
    .rotate()
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .png()
    .toBuffer();
  const meta = await sharp(source).metadata();
  if (Math.abs(meta.height - (meta.width * vehicle.height) / vehicle.width) > 1)
    throw Error(
      "Drawing aspect ratio differs from the template. Restore the uncropped canvas; do not stretch it.",
    );
  const { png } = await exportImage(
    source,
    path.join(root, vehicle.id, "template.png"),
    vehicle,
  );
  await fs.mkdir(outputDirectory, { recursive: true });
  const file = path.resolve(outputDirectory, safeName(name));
  await fs.writeFile(file, png, { flag: "wx" });
  const report = await validateWrap(file, vehicleId);
  if (!report.passed)
    throw Error("Output failed validation: " + JSON.stringify(report.checks));
  await fs.writeFile(
    file.replace(/\.png$/, ".validation.json"),
    JSON.stringify(report, null, 2),
    { flag: "wx" },
  );
  return { ...report, output: file };
}
if (
  process.argv[1] &&
  (await fs.realpath(process.argv[1])) ===
    (await fs.realpath(import.meta.filename))
) {
  try {
    if (!process.argv[4])
      throw Error(
        "Usage: node scripts/finish-drawing.mjs drawing.png vehicle-id output-directory [name]",
      );
    console.log(
      JSON.stringify(await finishDrawing(...process.argv.slice(2, 6)), null, 2),
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
