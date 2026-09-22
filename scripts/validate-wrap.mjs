import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { MAX_BYTES } from "../studio/core.js";
const root = path.resolve(import.meta.dirname, "..");
export async function validateWrap(file, vehicleId) {
  const catalog = JSON.parse(
    await fs.readFile(path.join(root, "studio/vehicles.json"), "utf8"),
  );
  const vehicle = catalog.find((v) => v.id === vehicleId);
  if (!vehicle) throw Error("Unknown vehicle ID.");
  const data = await fs.readFile(file);
  const m = await sharp(data, { failOn: "warning" }).metadata();
  const name = path.basename(file);
  const checks = {
    png: m.format === "png",
    dimensions:
      m.width >= 512 && m.height >= 512 && m.width <= 1024 && m.height <= 1024,
    aspect:
      Math.abs(m.height - (m.width * vehicle.height) / vehicle.width) <= 0.5,
    size: data.length <= MAX_BYTES,
    filename: /^[a-zA-Z0-9 _-]+\.png$/.test(name) && name.length <= 30,
    singleFrame: (m.pages || 1) === 1,
    rgba8:
      m.space === "srgb" &&
      m.channels === 4 &&
      m.depth === "uchar" &&
      m.hasAlpha,
  };
  let alphaDifferences = null;
  if (checks.png && checks.dimensions && checks.singleFrame && m.hasAlpha) {
    const actual = await sharp(data)
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    const expected = await sharp(path.join(root, vehicleId, "template.png"))
      .resize(m.width, m.height, { fit: "fill" })
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    alphaDifferences = actual.reduce(
      (n, a, i) => n + (a !== expected[i] ? 1 : 0),
      0,
    );
  }
  checks.exactTemplateAlpha = alphaDifferences === 0;
  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    file: name,
    vehicle: vehicleId,
    width: m.width,
    height: m.height,
    bytes: data.length,
    alphaDifferences,
    sha256: createHash("sha256").update(data).digest("hex"),
    scope:
      "File-format and template-mask validation only; not visual orientation or acceptance by a vehicle.",
  };
}
if (
  process.argv[1] &&
  (await fs.realpath(process.argv[1])) ===
    (await fs.realpath(import.meta.filename))
) {
  try {
    if (!process.argv[2] || !process.argv[3])
      throw Error("Usage: node scripts/validate-wrap.mjs image.png vehicle-id");
    const report = await validateWrap(process.argv[2], process.argv[3]);
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
