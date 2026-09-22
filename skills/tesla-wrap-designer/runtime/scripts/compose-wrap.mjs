import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { validateWrap } from "./validate-wrap.mjs";
import { exportImage } from "./export-image.mjs";
import { panelPreviews } from "./panel-previews.mjs";
import { fitInPanel, safeName } from "../studio/core.js";
const root = path.resolve(import.meta.dirname, "..");
// JSON recipe: vehicle, name, baseColor, background? and artwork[{file,panel,rotation?}].
// Files resolve relative to the recipe. Panel IDs come from studio/vehicles.json.
export async function compose(recipePath, outputDirectory) {
  const recipe = JSON.parse(await fs.readFile(recipePath, "utf8")),
    catalog = JSON.parse(
      await fs.readFile(path.join(root, "studio/vehicles.json"), "utf8"),
    );
  const vehicle = catalog.find((v) => v.id === recipe.vehicle);
  if (!vehicle) throw Error("Choose a vehicle ID from studio/vehicles.json.");
  if (!/^#[a-f\d]{6}$/i.test(recipe.baseColor || "#7562dc"))
    throw Error("baseColor must be a hex color.");
  if (
    !Array.isArray(recipe.artwork || []) ||
    (recipe.artwork || []).length > 100
  )
    throw Error("artwork must be an array with at most 100 assets.");
  if (
    recipe.reduceColors !== undefined &&
    typeof recipe.reduceColors !== "boolean"
  )
    throw Error("reduceColors must be a boolean.");
  const layers = [],
    placements = [],
    composites = [],
    base = path.dirname(path.resolve(recipePath));
  if (recipe.background) {
    const b = await sharp(path.resolve(base, recipe.background))
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();
    composites.push({ input: b, left: 0, top: 0 });
    layers.push({
      id: "background",
      name: "Background",
      type: "image",
      src: "data:image/png;base64," + b.toString("base64"),
      width: 1024,
      height: 1024,
      x: 512,
      y: 512,
      scale: 1,
      rotation: 0,
      opacity: 1,
      locked: true,
    });
  }
  for (const [i, art] of (recipe.artwork || []).entries()) {
    const panel = vehicle.panels.find(
      (p) => p.id === art.panel || p.label === art.panel,
    );
    if (!panel) throw Error(`Unknown panel ${art.panel}.`);
    const rotation = art.rotation ?? panel.rotation;
    if (![0, 90, -90, 180].includes(rotation))
      throw Error("Use quarter-turn rotations for deterministic placement.");
    if (!art.file || typeof art.file !== "string")
      throw Error("Each asset needs a local file.");
    const input = await sharp(path.resolve(base, art.file))
        .ensureAlpha()
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
      m = await sharp(input).metadata();
    if (art.kind === "cutout") {
      const alpha = await sharp(input).extractChannel(3).raw().toBuffer();
      if (!alpha.some((a) => a < 250) || !alpha.some((a) => a > 0))
        throw Error(
          `Cutout ${art.file} must have real transparency and visible pixels; an opaque rectangle is not a cutout.`,
        );
    }
    placements.push({
      panel: panel.id,
      name: art.name || path.basename(art.file),
      rotation,
      orientationVerified: panel.orientationVerified === true,
      evidence: panel.orientationEvidence || null,
    });
    const placement = fitInPanel(m.width, m.height, { ...panel, rotation });
    const transformed = await sharp(input)
      .rotate(rotation)
      .resize(
        Math.max(
          1,
          Math.round(
            (Math.abs(rotation) % 180 === 90 ? m.height : m.width) *
              placement.scale,
          ),
        ),
        Math.max(
          1,
          Math.round(
            (Math.abs(rotation) % 180 === 90 ? m.width : m.height) *
              placement.scale,
          ),
        ),
      )
      .png()
      .toBuffer();
    const t = await sharp(transformed).metadata(),
      normalizedHeight = Math.round(
        t.height / (vehicle.height / vehicle.width),
      );
    const normalized = await sharp(transformed)
      .resize(t.width, normalizedHeight, { fit: "fill" })
      .png()
      .toBuffer();
    composites.push({
      input: normalized,
      left: Math.round(placement.x - t.width / 2),
      top: Math.round(placement.y - normalizedHeight / 2),
    });
    layers.push({
      id: `art-${i}`,
      name: art.name || path.basename(art.file),
      type: "image",
      src: "data:image/png;base64," + input.toString("base64"),
      width: m.width,
      height: m.height,
      ...placement,
      opacity: 1,
    });
  }
  const master = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: recipe.baseColor || "#7562dc",
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
  const result = await exportImage(
    master,
    path.join(root, vehicle.id, "template.png"),
    vehicle,
    { reduceColors: recipe.reduceColors === true },
  );
  const alpha = await sharp(result.png).extractChannel(3).raw().toBuffer();
  if (!alpha.equals(result.mask)) throw Error("Mask validation failed.");
  await fs.mkdir(outputDirectory, { recursive: true });
  const name = safeName(recipe.name || "My_Wrap");
  const pngPath = path.resolve(outputDirectory, name),
    projectPath = pngPath.replace(/\.png$/, ".wrap-project.json");
  await fs.writeFile(pngPath, result.png, { flag: "wx" });
  const validation = await validateWrap(pngPath, vehicle.id);
  if (!validation.passed)
    throw Error(
      "Export failed validation: " + JSON.stringify(validation.checks),
    );
  await fs.writeFile(
    projectPath,
    JSON.stringify({
      version: 2,
      vehicle: vehicle.id,
      baseColor: recipe.baseColor || "#7562dc",
      accentColor: "#ffbd69",
      pattern: "solid",
      layers,
    }),
    { flag: "wx" },
  );
  const report = {
    ...validation,
    png: pngPath,
    project: projectPath,
    vehicle: vehicle.id,
    width: result.width,
    height: result.height,
    bytes: result.png.length,
    alphaDifferences: 0,
    colorReduction: result.colorReduction,
    placements,
    orientation:
      "File validity is not orientation approval. Inspect panel previews and independently confirm unverified mappings, including Model Y Premium hood and rear.",
  };
  report.previews = pngPath.replace(/\.png$/, ".previews");
  await panelPreviews(result.png, vehicle, placements, report.previews);
  await fs.writeFile(
    pngPath.replace(/\.png$/, ".validation.json"),
    JSON.stringify(report, null, 2),
    { flag: "wx" },
  );
  return report;
}
if (
  process.argv[1] &&
  (await fs.realpath(process.argv[1])) ===
    (await fs.realpath(import.meta.filename))
) {
  if (!process.argv[2] || !process.argv[3]) {
    console.error(
      "Usage: node scripts/compose-wrap.mjs recipe.json output-directory",
    );
    process.exitCode = 1;
  } else
    try {
      console.log(
        JSON.stringify(
          await compose(
            path.resolve(process.argv[2]),
            path.resolve(process.argv[3]),
          ),
          null,
          2,
        ),
      );
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    }
}
