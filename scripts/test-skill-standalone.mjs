// Explicit network-enabled packaging smoke test, kept separate from npm test.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "standalone-wrap-skill-"));
const skill = path.join(dir, "tesla-wrap-designer");
await fs.cp(path.join(root, "skills/tesla-wrap-designer"), skill, {
  recursive: true,
  filter: (p) => path.basename(p) !== "node_modules",
});
const runtime = path.join(skill, "runtime");
const install = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["ci", "--no-fund"],
  {
    cwd: runtime,
    encoding: "utf8",
    timeout: 120000,
  },
);
assert.equal(install.status, 0, install.stderr);
// Import exclusively from the relocated package, with dependencies installed there.
const { compose } = await import(
  pathToFileURL(path.join(runtime, "scripts/compose-wrap.mjs"))
);
const { validateWrap } = await import(
  pathToFileURL(path.join(runtime, "scripts/validate-wrap.mjs"))
);
const { finishDrawing } = await import(
  pathToFileURL(path.join(runtime, "scripts/finish-drawing.mjs"))
);
const catalog = JSON.parse(
  await fs.readFile(path.join(runtime, "studio/vehicles.json")),
);
const out = path.join(dir, "outputs");
await fs.writeFile(
  path.join(dir, "subject.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="140"><rect x="10" y="10" width="60" height="120" rx="20" fill="#f4a522"/></svg>',
);
for (const v of catalog) {
  const recipe = path.join(dir, v.id + ".json");
  await fs.writeFile(
    recipe,
    JSON.stringify({
      vehicle: v.id,
      name: v.id,
      artwork: [{ file: "subject.svg", panel: v.panels[0].id }],
    }),
  );
  const report = await compose(recipe, out);
  assert.equal(report.passed, true);
  assert.equal((await validateWrap(report.png, v.id)).sha256, report.sha256);
  const project = await fs.readFile(report.project, "utf8");
  assert.ok(!project.includes(root) && !project.includes(dir));
}
const drawing = await finishDrawing(
  path.join(runtime, "modely-2025-premium/template.png"),
  "modely-2025-premium",
  out,
  "Finalized_Drawing",
);
assert.equal(drawing.passed, true);
console.log(
  JSON.stringify(
    {
      passed: true,
      relocatedPackage: skill,
      vehiclesExported: catalog.length,
      drawingFinalizer: "passed",
      dependencyInstall: "fresh npm ci",
      originalRepositoryRequired: false,
    },
    null,
    2,
  ),
);
