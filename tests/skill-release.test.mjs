import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { compose } from "../scripts/compose-wrap.mjs";
import { exportImage } from "../scripts/export-image.mjs";
const root = path.resolve(import.meta.dirname, "..");

test("directional hood uses corrected rotation, real alpha, and exact final-file preview", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wrap-release-"));
  const source = path.join(dir, "arrow.svg");
  await fs.writeFile(
    source,
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M50 5 L90 50 H65 V95 H35 V50 H10Z" fill="red"/><circle cx="50" cy="25" r="7" fill="blue"/></svg>',
  );
  const recipe = path.join(dir, "recipe.json");
  await fs.writeFile(
    recipe,
    JSON.stringify({
      vehicle: "modely-2025-premium",
      name: "Orientation",
      artwork: [{ file: "arrow.svg", panel: "Hood", kind: "cutout" }],
    }),
  );
  const report = await compose(recipe, dir);
  assert.equal(report.passed, true);
  assert.equal(report.placements[0].rotation, 180);
  assert.equal(report.placements[0].orientationVerified, false);
  const index = JSON.parse(
    await fs.readFile(path.join(report.previews, "index.json")),
  );
  assert.equal(index.panels[0].rotation, 180);
  const v = JSON.parse(
    await fs.readFile(path.join(root, "studio/vehicles.json")),
  ).find((v) => v.id === "modely-2025-premium");
  const p = v.panels.find((p) => p.role === "hood");
  const [left, top, width, height] = p.bounds;
  const crop = await sharp(report.png)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
  assert.deepEqual(
    await sharp(crop).rotate(180).raw().toBuffer(),
    await sharp(path.join(report.previews, index.panels[0].file))
      .raw()
      .toBuffer(),
  );
  const opaque = path.join(dir, "opaque.png");
  await sharp({
    create: { width: 100, height: 100, channels: 4, background: "red" },
  })
    .png()
    .toFile(opaque);
  await fs.writeFile(
    recipe,
    JSON.stringify({
      vehicle: v.id,
      name: "Opaque",
      artwork: [{ file: "opaque.png", panel: "Hood", kind: "cutout" }],
    }),
  );
  await assert.rejects(compose(recipe, dir), /real transparency/);
  const link = path.join(dir, "runtime-link");
  await fs.symlink(root, link, "dir");
  const cli = spawnSync(
    process.execPath,
    [path.join(link, "scripts/validate-wrap.mjs"), report.png, v.id],
    { encoding: "utf8" },
  );
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).passed, true);
  const invalid = spawnSync(
    process.execPath,
    [path.join(link, "scripts/validate-wrap.mjs"), opaque, v.id],
    { encoding: "utf8" },
  );
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stdout).passed, false);
});

test("opt-in color reduction retains native size, truecolor, and template alpha", async () => {
  let seed = 42;
  const rgb = Buffer.alloc(1024 * 1024 * 3);
  for (let i = 0; i < rgb.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    rgb[i] = seed >>> 24;
  }
  const source = await sharp(rgb, {
    raw: { width: 1024, height: 1024, channels: 3 },
  })
    .png()
    .toBuffer();
  const template = path.join(root, "modely-2025-premium/template.png");
  const r = await exportImage(
    source,
    template,
    { width: 1024, height: 1024 },
    { reduceColors: true },
  );
  assert.equal(r.width, 1024);
  assert.ok(r.colorReduction);
  assert.ok(r.png.length <= 1_000_000);
  const m = await sharp(r.png).metadata();
  assert.equal(m.channels, 4);
  assert.equal(m.isPalette, false);
  assert.deepEqual(
    await sharp(r.png).extractChannel(3).raw().toBuffer(),
    r.mask,
  );
});
