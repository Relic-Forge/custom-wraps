import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { validateWrap } from "../scripts/validate-wrap.mjs";
import { finishDrawing } from "../scripts/finish-drawing.mjs";
const root = path.resolve(import.meta.dirname, "..");
test("portable snapshot includes exact runtime sources and all template bytes", async () => {
  const runtime = path.join(root, "skills/tesla-wrap-designer/runtime");
  const manifest = JSON.parse(
    await fs.readFile(path.join(runtime, "manifest.json")),
  );
  for (const file of Object.keys(manifest.files))
    assert.deepEqual(
      await fs.readFile(path.join(runtime, file)),
      await fs.readFile(path.join(root, file)),
    );
  const bundled = JSON.parse(
    await fs.readFile(path.join(runtime, "studio/vehicles.json")),
  );
  const original = JSON.parse(
    await fs.readFile(path.join(root, "studio/vehicles.json")),
  );
  assert.deepEqual(
    bundled,
    original.map(({ thumbnail, ...v }) => v),
  );
});
test("drawing finalizer restores flattened mask and validator rejects invalid formats", async () => {
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "wrap-finalizer-"));
  const input = await sharp({
    create: { width: 2048, height: 2048, channels: 3, background: "#83b6ff" },
  })
    .png()
    .toBuffer();
  const report = await finishDrawing(
    input,
    "modely-2025-premium",
    out,
    "Child_Drawing",
  );
  assert.equal(report.passed, true);
  assert.equal(report.width, 1024);
  assert.equal(report.alphaDifferences, 0);
  await assert.rejects(
    finishDrawing(input, "modely-2025-premium", out, "Child_Drawing"),
    /EEXIST/,
  );
  const bad = path.join(out, "flattened.png");
  await sharp(report.output).flatten({ background: "white" }).png().toFile(bad);
  assert.equal((await validateWrap(bad, "modely-2025-premium")).passed, false);
  const jpeg = path.join(out, "pretend.png");
  await sharp(report.output).jpeg().toFile(jpeg);
  assert.equal(
    (await validateWrap(jpeg, "modely-2025-premium")).checks.png,
    false,
  );
  const named = path.join(out, "bad!name.png");
  await fs.copyFile(report.output, named);
  assert.equal(
    (await validateWrap(named, "modely-2025-premium")).checks.filename,
    false,
  );
  const cropped = await sharp(input).resize(1000, 800).png().toBuffer();
  await assert.rejects(
    finishDrawing(cropped, "modely-2025-premium", out),
    /aspect ratio/,
  );
  const oversized = path.join(out, "Oversized.png");
  await fs.writeFile(
    oversized,
    Buffer.concat([await fs.readFile(report.output), Buffer.alloc(1_000_001)]),
  );
  assert.equal(
    (await validateWrap(oversized, "modely-2025-premium")).checks.size,
    false,
  );
});
