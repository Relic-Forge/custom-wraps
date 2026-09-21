import test from "node:test";
import assert from "node:assert/strict";
import { validateProject, upgradeProject } from "../studio/core.js";
const stroke = {
  id: "s",
  type: "stroke",
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 0.4,
  size: 8,
  color: "#ff0000",
  points: [[30, 50, 0.5]],
  erase: false,
};
const text = {
  id: "t",
  type: "text",
  text: "Hello",
  x: 50,
  y: 40,
  scale: 1,
  rotation: 0,
  opacity: 1,
};
const project = () => ({
  version: 2,
  vehicle: "modely-2025-premium",
  baseColor: "#ffffff",
  layers: [
    structuredClone(stroke),
    structuredClone(text),
    { ...structuredClone(stroke), id: "eraser", erase: true },
  ],
});
test("legacy drawing migrates to isolated paint layer without changing stroke order", () => {
  const p = upgradeProject(project());
  assert.equal(p.version, 3);
  assert.equal(p.layers[0].id, "t");
  assert.equal(p.layers[1].type, "paint");
  assert.deepEqual(
    p.layers[1].strokes.map((s) => s.id),
    ["s", "eraser"],
  );
  assert.equal(p.layers[1].strokes[0].opacity, 0.4);
  const before = JSON.stringify(p);
  upgradeProject(p);
  assert.equal(JSON.stringify(p), before);
  validateProject(JSON.parse(JSON.stringify(p)), [p.vehicle]);
});
test("paint projects reject malformed nested strokes and unsupported transforms", () => {
  const p = upgradeProject(project());
  p.layers[1].strokes.push({ type: "paint", strokes: [] });
  assert.throws(() => validateProject(p, [p.vehicle]), /paint layer/);
  p.layers[1].strokes.pop();
  p.layers[1].x = 12;
  assert.throws(() => validateProject(p, [p.vehicle]), /canvas coordinates/);
  p.layers[1].x = 0;
  p.layers[1].strokes[0].points = [[NaN, 5, 0.5]];
  assert.throws(() => validateProject(p, [p.vehicle]), /drawing data/);
});
