import test from "node:test";
import assert from "node:assert/strict";
import { mountArtWheel } from "../studio/art-wheel.js";
class Element {
  children = [];
  listeners = {};
  style = {};
  attrs = {};
  hidden = false;
  classList = { toggle() {} };
  append(...els) {
    this.children.push(...els);
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  addEventListener(k, f) {
    (this.listeners[k] ||= []).push(f);
  }
  contains(el) {
    return el === this || this.children.some((c) => c.contains?.(el));
  }
  getBoundingClientRect() {
    return { left: 900, top: 200 };
  }
  setPointerCapture() {}
  focus() {}
  emit(type, patch = {}) {
    const e = {
      currentTarget: this,
      button: 2,
      pointerId: 1,
      clientX: 400,
      clientY: 300,
      preventDefault() {},
      stopImmediatePropagation() {},
      ...patch,
    };
    for (const f of this.listeners[type] || []) f(e);
  }
}
test("wheel selects with a single right-button gesture, cancels in center, and supports tap alternative", () => {
  const saved = {
    document: globalThis.document,
    window: globalThis.window,
    innerWidth: globalThis.innerWidth,
    innerHeight: globalThis.innerHeight,
    localStorage: globalThis.localStorage,
  };
  try {
    const doc = new Element();
    doc.body = new Element();
    doc.createElement = () => new Element();
    globalThis.document = doc;
    globalThis.window = new Element();
    globalThis.innerWidth = 1200;
    globalThis.innerHeight = 900;
    globalThis.localStorage = { getItem: () => null, setItem() {} };
    const stage = new Element(),
      trigger = new Element(),
      selected = [];
    let size = 8;
    mountArtWheel({
      stage,
      trigger,
      getSize: () => size,
      setSize: (v) => (size = v),
      select: (v) => selected.push(v),
      current: () => "pen",
    });
    const wheel = doc.body.children[0];
    stage.emit("pointerdown");
    assert.equal(wheel.hidden, false);
    stage.emit("pointermove", { clientY: 200 });
    stage.emit("pointerup", { clientY: 200 });
    assert.deepEqual(selected, ["pencil"]);
    assert.equal(wheel.hidden, true);
    stage.emit("pointerdown");
    stage.emit("pointermove", { clientY: 200 });
    stage.emit("pointermove");
    stage.emit("pointerup");
    assert.deepEqual(selected, ["pencil"]);
    stage.emit("pointerdown");
    stage.emit("wheel", { deltaY: -1 });
    assert.equal(size, 9);
    stage.emit("pointercancel");
    assert.equal(wheel.hidden, true);
    trigger.emit("pointerdown", { button: 0 });
    trigger.emit("pointerup", { button: 0 });
    assert.equal(wheel.hidden, false);
    wheel.children.find((b) => b.attrs["aria-label"] === "Spray").onclick();
    assert.deepEqual(selected, ["pencil", "spray"]);
    trigger.emit("pointerdown", { button: 0 });
    trigger.emit("pointerup", { button: 0 });
    const slider = wheel.children.at(-1).children[1];
    slider.value = "50";
    slider.oninput();
    assert.equal(size, 21);
    slider.value = "100";
    slider.oninput();
    assert.equal(size, 80);
    slider.value = "0";
    slider.oninput();
    assert.equal(size, 1);
    // Crossing the Spray sector en route to sizing must not select Spray.
    const sizing = wheel.children.at(-1);
    sizing.getBoundingClientRect = () => ({
      left: 270,
      right: 530,
      top: 440,
      bottom: 560,
    });
    slider.getBoundingClientRect = () => ({
      left: 286,
      right: 514,
      top: 460,
      bottom: 504,
      width: 228,
    });
    const selectionsBefore = selected.length;
    stage.emit("pointerdown");
    stage.emit("pointermove", { clientY: 395 });
    stage.emit("pointermove", { clientX: 514, clientY: 480 });
    stage.emit("pointerup", { clientX: 514, clientY: 480 });
    assert.equal(size, 80);
    assert.equal(selected.length, selectionsBefore);
    assert.equal(wheel.hidden, true);
    trigger.emit("pointerdown", { button: 0 });
    trigger.emit("pointerup", { button: 0 });
    slider.emit("pointerup", { button: 0 });
    assert.equal(wheel.hidden, true);
    stage.emit("pointerdown");
    stage.emit("lostpointercapture");
    assert.equal(wheel.hidden, true);
  } finally {
    Object.assign(globalThis, saved);
  }
});
