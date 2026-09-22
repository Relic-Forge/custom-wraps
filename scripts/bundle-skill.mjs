// Reproducible portable snapshot. No family artwork, user paths, or app dependency.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = path.resolve(import.meta.dirname, "..");
const runtime = path.join(root, "skills/tesla-wrap-designer/runtime");
const catalog = JSON.parse(
  await fs.readFile(path.join(root, "studio/vehicles.json"), "utf8"),
);
const files = [
  "studio/core.js",
  "scripts/compose-wrap.mjs",
  "scripts/validate-wrap.mjs",
  "scripts/finish-drawing.mjs",
  "scripts/export-image.mjs",
  "scripts/panel-previews.mjs",
];
for (const v of catalog) files.push(`${v.id}/template.png`);
const hashes = {};
for (const file of files) {
  await fs.mkdir(path.dirname(path.join(runtime, file)), { recursive: true });
  await fs.copyFile(path.join(root, file), path.join(runtime, file));
  hashes[file] = createHash("sha256")
    .update(await fs.readFile(path.join(runtime, file)))
    .digest("hex");
}
// Thumbnails belong to the editor, not this portable exporter.
await fs.writeFile(
  path.join(runtime, "studio/vehicles.json"),
  JSON.stringify(
    catalog.map(({ thumbnail, ...v }) => v),
    null,
    2,
  ),
);
await fs.writeFile(
  path.join(runtime, "manifest.json"),
  JSON.stringify(
    {
      templateSource: "https://github.com/teslamotors/custom-wraps",
      templateRevision: "86c7d31454caf0f20af6f6af105f577643f13bce",
      requirementsChecked: "2026-09-22",
      files: hashes,
    },
    null,
    2,
  ),
);
console.log(`Bundled ${catalog.length} templates and standalone exporter.`);
