import test from "node:test";
import assert from "node:assert/strict";
import { pinchView } from "../studio/view-gesture.js";
test("two fingers pan, zoom and turn around their midpoint without changing input", () => {
  const view = { zoom: 1, angle: 0, pan: { x: 0, y: 0 } };
  const original = JSON.stringify(view);
  const result = pinchView(
    [
      { x: -10, y: 0 },
      { x: 10, y: 0 },
    ],
    [
      { x: 5, y: -20 },
      { x: 5, y: 20 },
    ],
    view,
  );
  assert.equal(result.zoom, 2);
  assert.equal(result.angle, 90);
  assert.ok(Math.abs(result.pan.x - 5) < 1e-8);
  assert.ok(Math.abs(result.pan.y) < 1e-8);
  assert.equal(JSON.stringify(view), original);
});
test("pinch limits magnification and remains finite for coincident fingers", () => {
  const result = pinchView(
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
    ],
    { zoom: 1, angle: 0, pan: { x: 0, y: 0 } },
  );
  assert.equal(result.zoom, 24);
  assert.ok(Number.isFinite(result.pan.x));
});
