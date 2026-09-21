import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  analyzeMask,
  fitInPanel,
  safeName,
  validateProject,
  exportSizes,
} from "../studio/core.js";
import { compose } from "../scripts/compose-wrap.mjs";
const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await fs.readFile(path.join(root, "studio/vehicles.json"), "utf8"),
);
test("all official templates present and safe areas exclude transparent pixels", async () => {
  const dirs = (await fs.readdir(root)).filter((x) =>
    /^(model|cybertruck)/.test(x),
  );
  assert.equal(catalog.length, dirs.length);
  for (const v of catalog) {
    const a = await sharp(path.join(root, v.id, "template.png"))
      .resize(1024, 1024, { fit: "fill" })
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    assert.ok(v.panels.length);
    for (const p of v.panels) {
      const [x, y, w, h] = p.safe;
      assert.ok(w > 0 && h > 0);
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++)
          assert.ok(a[yy * 1024 + xx] >= 250, `${v.id} ${p.id} crosses a gap`);
      const fit = fitInPanel(700, 1100, p);
      const turn = Math.abs(fit.rotation) % 180 === 90;
      assert.ok((turn ? 1100 : 700) * fit.scale < w);
      assert.ok((turn ? 700 : 1100) * fit.scale < h);
    }
  }
});
test("safe area does not bridge disconnected panels", () => {
  const a = new Uint8Array(80 * 60);
  for (let y = 5; y < 50; y++)
    for (let x = 5; x < 70; x++) if (x < 30 || x > 35) a[y * 80 + x] = 255;
  const p = analyzeMask(a, 80, 60);
  assert.equal(p.length, 2);
  assert.equal(p[0].safe[2], 25);
});
test("filenames and project validation reject invalid documents", () => {
  assert.equal(safeName("🐈 <script>/hello"), " scripthello.png".trim());
  assert.ok(safeName("x".repeat(100)).length <= 30);
  assert.throws(() =>
    validateProject(
      { version: 2, vehicle: "unknown", layers: [] },
      catalog.map((v) => v.id),
    ),
  );
});
test("end-to-end composition exports every car with exact alpha and editable layers", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wrap-studio-test-"));
  const cutout = path.join(
    root,
    "studio/artwork/generated/bfdi-flower-cutout.png",
  );
  for (const v of catalog) {
    const recipe = path.join(dir, v.id + ".json");
    await fs.writeFile(
      recipe,
      JSON.stringify({
        vehicle: v.id,
        name: v.id,
        baseColor: "#443366",
        artwork: [{ file: cutout, panel: v.panels[0].id }],
      }),
    );
    const r = await compose(recipe, dir);
    assert.ok(r.bytes <= 1_000_000);
    const m = await sharp(r.png).metadata();
    assert.equal(m.width, 1024);
    assert.equal(m.height, v.height);
    const a = await sharp(r.png).extractChannel(3).raw().toBuffer(),
      b = await sharp(path.join(root, v.id, "template.png"))
        .resize(v.width, v.height, { fit: "fill" })
        .ensureAlpha()
        .extractChannel(3)
        .raw()
        .toBuffer();
    assert.ok(a.equals(b));
    const project = JSON.parse(await fs.readFile(r.project, "utf8"));
    validateProject(
      project,
      catalog.map((v) => v.id),
    );
    assert.equal(project.layers.length, 1);
  }
});
test("export fallback preserves aspect and minimum dimensions", () => {
  assert.deepEqual(exportSizes(1024, 1024), [
    [1024, 1024],
    [768, 768],
    [512, 512],
  ]);
  for (const [w, h] of exportSizes(1024, 768)) {
    assert.ok(h >= 512);
    assert.ok(Math.abs(h / w - 0.75) < 0.002);
  }
});
