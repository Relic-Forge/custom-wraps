import { pinchView } from "./view-gesture.js";
import {
  SIZE,
  MAX_BYTES,
  safeName,
  fitInPanel,
  validateProject,
  exportSizes,
  upgradeProject,
} from "./core.js?v=0.3.0";
const $ = (id) => document.getElementById(id);
// Put everyday drawing controls first; vehicle setup and imports remain below.
document.querySelector(".left").prepend($("tools").closest("section"));
document.querySelector(".right").prepend($("layerList").closest("section"));
$("addDialog").append($("artUpload").closest("section"));
// Keep the drawing desk quiet. Existing controls retain their handlers and IDs
// inside on-demand drawers; no artwork or document format changes are needed.
const settingsDialog = $("settingsDialog"),
  layersDialog = $("layersDialog");
for (const id of ["vehicle", "baseColor", "idea", "fileName"])
  settingsDialog.append($(id).closest("section"));
const projectActions = document.createElement("div");
projectActions.className = "row";
for (const el of [
  $("saveProject"),
  document.querySelector('[for="projectUpload"]'),
  $("projectUpload"),
  $("openHelp"),
])
  projectActions.append(el);
settingsDialog.append(projectActions);
layersDialog.append($("layerList").closest("section"));
const addPhotoLayer = document.createElement("button");
addPhotoLayer.textContent = "＋ Photo or image";
addPhotoLayer.className = "wide";
addPhotoLayer.onclick = () => {
  layersDialog.close();
  $("addDialog").showModal();
};
$("addPaintLayer").after(addPhotoLayer);
const layerOptions = document.createElement("details");
layerOptions.innerHTML = "<summary>Adjust this layer</summary>";
$("transformControls").before(layerOptions);
layerOptions.append($("transformControls"));
const partPicker = $("partPicker");
partPicker.append($("panel"));
$("panel").setAttribute("aria-label", "Draw on a car part");
$("panel").options[0].text = "Whole car";
const placement = $("placePanel").closest("section");
layersDialog.append(placement);
placement.querySelector("h2").textContent = "Place a photo or words";
placement.querySelector('label[for="panel"]').remove();
$("focusPanel").hidden = true;
$("showGuide").checked = false;
document.querySelector(".right").remove();
for (const [id, text, dialog] of [
  ["openLayers", "Layers", layersDialog],
  ["openSettings", "Project", settingsDialog],
]) {
  const b = document.createElement("button");
  b.id = id;
  b.textContent = text;
  b.onclick = () =>
    dialog === layersDialog ? openFlyout(dialog) : dialog.showModal();
  $("exportButton").before(b);
}
$("exportButton").textContent = "Finish ↗";
$("openAdd").textContent = "+ Add";
const brushDetails = document.createElement("details");
brushDetails.innerHTML = "<summary>More brushes</summary>";
$("brushOptions").append(brushDetails);
for (const el of [
  document.querySelector('[for="brushPreset"]'),
  $("brushPreset"),
  document.querySelector('[data-tool="picker"]'),
  document.querySelector(".color-code"),
  document.querySelector('[for="brushOpacity"]'),
  $("brushOpacity"),
])
  brushDetails.append(el);
document.querySelector('[data-tool="select"]').textContent = "↖ Move art";
document.querySelector('[data-tool="pan"]').textContent = "✋ Move paper";
document.querySelector(".stage-label").hidden = true;
$("activePaintLayer").hidden = true;
// Picture-led tools with accessible names and hover hints.
const icons = {
  draw: '<path d="m4 16 12-12 4 4-12 12-5 1zM14 6l4 4"/>',
  erase: '<path d="m3 14 10-10 8 8-8 8H9zM8 9l8 8M12 20h9"/>',
  move: '<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/>',
  add: '<path d="M12 4v16M4 12h16"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  project: '<path d="M3 6h7l2 3h9v11H3z"/>',
  left: '<path d="M5 10a8 8 0 1 1 0 7M5 3v7h7"/>',
  right: '<path d="M19 10a8 8 0 1 0 0 7M19 3v7h-7"/>',
};
function iconButton(el, icon, name) {
  el.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg>`;
  el.setAttribute("aria-label", name);
  el.title = name;
}
for (const [selector, icon, name] of [
  ['[data-tool="brush"]', "draw", "Draw"],
  ['[data-tool="eraser"]', "erase", "Erase"],
  ['[data-tool="pan"]', "move", "Move canvas"],
  ["#openAdd", "add", "Add a photo or words"],
  ["#openLayers", "layers", "Layers"],
  ["#openSettings", "project", "Project"],
  ["#turnCanvasLeft", "left", "Turn canvas left"],
  ["#turnCanvasRight", "right", "Turn canvas right"],
])
  iconButton(document.querySelector(selector), icon, name);
// The main Move tool moves the paper, not a layer. Object movement belongs
// with layers so dragging never unexpectedly rearranges the child's design.
$("tools").prepend(document.querySelector('[data-tool="pan"]'));
const moveArtworkButton = document.querySelector('[data-tool="select"]');
moveArtworkButton.textContent = "↖ Move artwork";
moveArtworkButton.title = "Move a photo or words";
layersDialog.append(moveArtworkButton);
moveArtworkButton.addEventListener("click", () => layersDialog.close());
const colorsDialog = document.createElement("dialog");
colorsDialog.id = "colorsDialog";
colorsDialog.setAttribute("aria-label", "Colors and brushes");
colorsDialog.innerHTML =
  '<form method="dialog"><button class="close-help" aria-label="Close colors">Done</button></form><h2>Colors & brushes</h2>';
document.body.append(colorsDialog);
colorsDialog.append($("brushOptions"));
document.querySelector('[data-tool="picker"]').remove();
// Keep the native color input as the real touch/keyboard target so its picker
// opens directly on Safari too, without a synthetic click or hidden input.
const customColor = document.createElement("label");
customColor.className = "custom-color-control";
customColor.innerHTML =
  '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M16 5h8v7h-8zM13 12h14l4 6v24H9V18z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M13 23h14v13H13z" fill="currentColor" opacity=".8"/><path d="M27 6h5M29 2l4-1M29 10l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Any color</span>';
$("brushColor").before(customColor);
customColor.append($("brushColor"));
$("brushColor").setAttribute("aria-label", "Choose any color");
$("brushColor").title = "Choose any color";
const colorButton = document.createElement("button");
colorButton.id = "openColors";
colorButton.setAttribute("aria-label", "Choose color and brush");
colorButton.title = "Choose color and brush";
colorButton.innerHTML = '<span class="current-color"></span>';
colorButton.onclick = () => openFlyout(colorsDialog);
function openFlyout(dialog) {
  for (const other of [layersDialog, colorsDialog])
    if (other.open) other.close();
  dialog.show();
}
for (const drawer of [layersDialog, colorsDialog])
  drawer.querySelector(".close-help").textContent = "Close ›";
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    for (const drawer of [layersDialog, colorsDialog])
      if (drawer.open) drawer.close();
  }
});
for (const drawer of [layersDialog, colorsDialog])
  drawer.classList.add("editor-flyout");
addPhotoLayer.hidden = true;
$("layerCount").hidden = true;
placement.hidden = true;
moveArtworkButton.hidden = true;
layerOptions.replaceWith($("transformControls"));
$("duplicateLayer").parentElement.hidden = true;
$("tools").append(colorButton);
$("tools").append($("openLayers"));
// A view-only shortcut palette: reuse the real controls so shortcuts cannot
// drift from the left rail or create duplicate editing behavior.
const quickTools = document.createElement("div");
quickTools.id = "quickTools";
quickTools.setAttribute("role", "toolbar");
quickTools.setAttribute("aria-label", "Canvas quick tools");
quickTools.hidden = true;
document.body.append(quickTools);
const quickSources = [
  $("openAdd"),
  document.querySelector('[data-tool="pan"]'),
  document.querySelector('[data-tool="brush"]'),
  document.querySelector('[data-tool="eraser"]'),
  colorButton,
];
for (const source of quickSources) {
  const shortcut = document.createElement("button");
  shortcut.innerHTML = source.innerHTML;
  shortcut.title = source.title;
  shortcut.setAttribute("aria-label", source.getAttribute("aria-label"));
  shortcut.onclick = () => {
    quickTools.hidden = true;
    source.click();
  };
  quickTools.append(shortcut);
}
$("stage").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  quickTools.hidden = false;
  [...quickTools.children].forEach((b, i) => {
    const pressed = quickSources[i].getAttribute("aria-pressed");
    if (pressed !== null) b.setAttribute("aria-pressed", pressed);
  });
  quickTools.style.setProperty("--ink", $("brushColor").value);
  const bounds = quickTools.getBoundingClientRect();
  const stage = $("stage").getBoundingClientRect();
  quickTools.style.left =
    Math.max(
      stage.left + 6,
      Math.min(
        e.clientX - bounds.width / 2,
        stage.right - bounds.width - 6,
        innerWidth - bounds.width - 8,
      ),
    ) + "px";
  quickTools.style.top =
    Math.max(
      stage.top + 6,
      Math.min(
        e.clientY - bounds.height / 2,
        stage.bottom - bounds.height - 6,
        innerHeight - bounds.height - 8,
      ),
    ) + "px";
  quickTools.firstElementChild.focus();
});
document.addEventListener("pointerdown", (e) => {
  if (!quickTools.contains(e.target)) quickTools.hidden = true;
});
quickTools.addEventListener("keydown", (e) => {
  const buttons = [...quickTools.children],
    index = buttons.indexOf(document.activeElement);
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    buttons[
      (index + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) %
        buttons.length
    ].focus();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    quickTools.hidden = true;
    $("stage").focus();
  }
});
$("stage").tabIndex = 0;
window.addEventListener("resize", () => (quickTools.hidden = true));
$("swatches").addEventListener("click", () =>
  colorButton.style.setProperty("--ink", $("brushColor").value),
);
$("brushColor").addEventListener("input", () =>
  colorButton.style.setProperty("--ink", $("brushColor").value),
);
// All models get a spatial index: each choice shows its exact template region.
const partsDialog = document.createElement("dialog");
partsDialog.id = "partsDialog";
partsDialog.setAttribute("aria-label", "Choose where to draw");
partsDialog.innerHTML =
  '<form method="dialog"><button class="close-help">Done</button></form><h2>Where shall we draw?</h2><div id="partCards"></div>';
document.body.append(partsDialog);
const choosePart = document.createElement("button");
choosePart.id = "choosePart";
choosePart.textContent = "Focus area ▾";
choosePart.onclick = () => partsDialog.showModal();
$("panel").hidden = true;
partPicker.append(choosePart);
function partName(p, i) {
  if (!p.label.startsWith("Detail ")) return p.label;
  const [x, y, w, h] = p.bounds;
  const vertical =
    y + h / 2 < 340 ? "Upper" : y + h / 2 > 684 ? "Lower" : "Middle";
  const horizontal =
    x + w / 2 < 400 ? "left" : x + w / 2 > 624 ? "right" : "center";
  return `${vertical} ${horizontal} piece ${i + 1}`;
}
function buildPartCards() {
  $("partCards").replaceChildren();
  [null, ...vehicle.panels].forEach((p, index) => {
    const b = document.createElement("button");
    b.className = "part-card";
    const name = p ? partName(p, index - 1) : "Whole car";
    const preview = document.createElement("canvas");
    preview.width = 100;
    preview.height = 100;
    const c = preview.getContext("2d");
    c.globalAlpha = 0.35;
    c.drawImage(template, 0, 0, 100, 100);
    c.globalAlpha = 1;
    if (p) {
      const [x, y, w, h] = p.bounds.map((v) => (v * 100) / SIZE);
      c.save();
      c.beginPath();
      c.rect(x, y, w, h);
      c.clip();
      c.drawImage(template, 0, 0, 100, 100);
      c.restore();
      c.strokeStyle = "#ffbd69";
      c.lineWidth = 2;
      c.strokeRect(x, y, w, h);
    }
    const label = document.createElement("span");
    label.textContent = name;
    b.append(preview, label);
    b.onclick = () => {
      $("panel").value = p?.id || "";
      $("panel").dispatchEvent(new Event("change"));
      choosePart.textContent = "Focus: " + name + " ▾";
      partsDialog.close();
    };
    $("partCards").append(b);
  });
}
const brushChoices = document.createElement("div");
brushChoices.className = "brush-choices";
for (const [value, name, symbol] of [
  ["pencil", "Pencil", "✏️"],
  ["pen", "Pen", "🖊️"],
  ["marker", "Marker", "🖍️"],
  ["spray", "Spray", "🎨"],
]) {
  const b = document.createElement("button");
  b.dataset.preset = value;
  b.innerHTML = `<span aria-hidden="true">${symbol}</span>${name}`;
  if (value === "spray")
    b.querySelector("span").innerHTML =
      customColor.querySelector("svg").outerHTML;
  b.setAttribute("aria-pressed", value === "pen");
  b.onclick = () => {
    $("brushPreset").value = value;
    $("brushPreset").dispatchEvent(new Event("change"));
    brushChoices
      .querySelectorAll("button")
      .forEach((el) => el.setAttribute("aria-pressed", el === b));
  };
  brushChoices.append(b);
}
$("brushOptions").prepend(brushChoices);
$("brushPreset").append(new Option("Spray paint", "spray"));
let customBrushSize = false,
  customBrushStrength = false;
const resetBrush = document.createElement("button");
resetBrush.textContent = "Reset brush defaults";
resetBrush.onclick = () => {
  customBrushSize = false;
  customBrushStrength = false;
  $("brushPreset").onchange();
};
$("brushOptions").append(resetBrush);
$("brushPreset").hidden = true;
document.querySelector('[for="brushPreset"]').hidden = true;
// Everyday brush controls stay visible; custom color values live together.
const customColorArea = document.createElement("div");
customColorArea.className = "custom-color-area";
customColor.before(customColorArea);
customColorArea.append(customColor);
$("brushOptions").append(
  $("brushPreset"),
  document.querySelector('[for="brushOpacity"]'),
  $("brushOpacity"),
);
brushDetails.remove();
const canvas = $("designCanvas"),
  ctx = canvas.getContext("2d"),
  overlay = $("overlayCanvas"),
  ox = overlay.getContext("2d");
const makeCanvas = (n = SIZE) =>
  Object.assign(document.createElement("canvas"), { width: n, height: n });
// Retain vector strokes and render a 4K working surface for close-up drawing.
// Tesla's downloadable PNG is deliberately reduced to its supported resolution.
canvas.width = canvas.height = 4096;
ctx.scale(4, 4);
const ink = makeCanvas(4096),
  inkCtx = ink.getContext("2d");
inkCtx.scale(4, 4);
let vehicles = [],
  vehicle,
  template,
  mask,
  selected = null,
  tool = "brush",
  space = false,
  gesture = null,
  busy = false;
let state = {
  version: 3,
  vehicle: "modely-2025-premium",
  baseColor: "#7562dc",
  accentColor: "#ffbd69",
  pattern: "solid",
  layers: [],
};
let history = [],
  future = [],
  zoom = 1,
  pan = { x: 0, y: 0 },
  viewAngle = 0,
  saveTimer,
  toastTimer,
  db;
const images = new Map();
const uid = () => crypto.randomUUID();
const layer = () => state.layers.find((l) => l.id === selected);
const panel = () => vehicle?.panels.find((p) => p.id === $("panel").value);
const aspect = () => (vehicle ? vehicle.height / vehicle.width : 1);
const snapshot = () => JSON.stringify(state);
function toast(s) {
  $("toast").textContent = s;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 4500);
}
function status(s) {
  $("status").textContent = s;
}
function checkpoint() {
  history.push(snapshot());
  if (history.length > 40) history.shift();
  future = [];
}
function change(fn) {
  if (busy) return;
  checkpoint();
  fn();
  changed();
}
function changed() {
  render();
  updateUI();
  scheduleSave();
}
async function undo(redo = false) {
  if (busy) return;
  const previousView = {
    vehicle: state.vehicle,
    zoom,
    pan: { ...pan },
    angle: viewAngle,
    panel: $("panel").value,
  };
  const from = redo ? future : history,
    to = redo ? history : future;
  if (!from.length) return;
  to.push(snapshot());
  state = JSON.parse(from.pop());
  selected = state.layers.at(-1)?.id;
  await hydrate();
  await selectVehicle(state.vehicle, false);
  if (state.vehicle === previousView.vehicle) {
    zoom = previousView.zoom;
    pan = previousView.pan;
    viewAngle = previousView.angle;
    $("panel").value = previousView.panel;
    view();
  }
  changed();
}
function scheduleSave() {
  clearTimeout(saveTimer);
  $("saveStatus").textContent = "Saving…";
  saveTimer = setTimeout(async () => {
    try {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put(snapshot(), state.vehicle);
      tx.oncomplete = () => {
        $("saveStatus").textContent = "Saved here ✓";
      };
      tx.onerror = () => {
        $("saveStatus").textContent = "Save project to keep your work";
      };
    } catch {
      $("saveStatus").textContent = "Save project to keep your work";
    }
  }, 500);
}
async function storage() {
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open(
      new URLSearchParams(location.search).has("test")
        ? "wrap-studio-test"
        : "wrap-studio",
      1,
    );
    r.onupgradeneeded = () => r.result.createObjectStore("projects");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function readDraft(id) {
  if (!db) return null;
  return new Promise((resolve) => {
    const r = db.transaction("projects").objectStore("projects").get(id);
    r.onsuccess = () => {
      try {
        resolve(r.result ? JSON.parse(r.result) : null);
      } catch {
        resolve(null);
      }
    };
    r.onerror = () => resolve(null);
  });
}
async function loadImage(src) {
  if (images.has(src)) return images.get(src);
  const im = new Image();
  await new Promise((r, j) => {
    im.onload = r;
    im.onerror = () =>
      j(Error("This image could not be opened. Try PNG, JPEG, or WebP."));
    im.src = src;
  });
  images.set(src, im);
  return im;
}
async function hydrate() {
  upgradeProject(state);
  await Promise.all(
    state.layers.filter((l) => l.type === "image").map((l) => loadImage(l.src)),
  );
}
async function selectVehicle(id, restore = true) {
  if (busy) return;
  busy = true;
  $("vehicle").disabled = true;
  $("exportButton").disabled = true;
  try {
    const next = vehicles.find((v) => v.id === id);
    if (!next) throw Error("Unknown vehicle.");
    const nextTemplate = await loadImage(next.template);
    if (restore && vehicle && vehicle.id !== id) {
      clearTimeout(saveTimer);
      if (db) {
        const tx = db.transaction("projects", "readwrite");
        tx.objectStore("projects").put(snapshot(), vehicle.id);
      }
      const draft = await readDraft(id);
      state = draft
        ? validateProject(
            draft,
            vehicles.map((v) => v.id),
          )
        : { ...state, vehicle: id, layers: [] };
      history = [];
      future = [];
      selected = null;
      await hydrate();
    }
    vehicle = next;
    template = nextTemplate;
    state.vehicle = id;
    $("vehicle").value = id;
    $("vehiclePhoto").src = vehicle.thumbnail;
    if (db)
      db.transaction("projects", "readwrite")
        .objectStore("projects")
        .put(JSON.stringify(id), "_active");
    $("validation").textContent = "";
    $("panelHint").textContent = "· All panels";
    const mc = makeCanvas();
    mc.getContext("2d").drawImage(template, 0, 0, SIZE, SIZE);
    mask = mc.getContext("2d").getImageData(0, 0, SIZE, SIZE).data;
    $("panel").replaceChildren(
      new Option("Whole car", ""),
      ...vehicle.panels.map((p) => new Option(p.label, p.id)),
    );
    buildPartCards();
    resetView();
    updateUI();
    render();
    status(vehicle.label);
  } catch (e) {
    toast(e.message);
    if (vehicle) $("vehicle").value = vehicle.id;
  } finally {
    busy = false;
    $("vehicle").disabled = false;
    $("exportButton").disabled = !template;
  }
}
function pattern(c) {
  c.fillStyle = state.baseColor;
  c.fillRect(0, 0, SIZE, SIZE);
  c.fillStyle = state.accentColor;
  c.strokeStyle = state.accentColor;
  if (state.pattern === "stripes") {
    c.lineWidth = 90;
    for (let x = -SIZE; x < SIZE * 2; x += 220) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x - SIZE, SIZE);
      c.stroke();
    }
  }
  if (state.pattern === "dots")
    for (let y = 35; y < SIZE; y += 95)
      for (let x = 35; x < SIZE; x += 95) {
        c.beginPath();
        c.arc(x + (y % 2) * 20, y, 14, 0, Math.PI * 2);
        c.fill();
      }
  if (state.pattern === "checker")
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        if ((x + y) % 2) c.fillRect(x * 128, y * 128, 128, 128);
}
function drawLayer(c, l) {
  if (l.visible === false) return;
  c.save();
  c.globalAlpha = l.opacity;
  c.translate(l.x, l.y);
  c.scale(1, 1 / aspect());
  c.rotate((l.rotation * Math.PI) / 180);
  c.scale(l.scale * (l.flip ? -1 : 1), l.scale);
  c.filter = `brightness(${l.brightness ?? 100}%) saturate(${l.saturation ?? 100}%)`;
  if (l.type === "image") {
    const im = images.get(l.src);
    if (im) c.drawImage(im, -l.width / 2, -l.height / 2, l.width, l.height);
  } else if (l.type === "text") {
    c.font = `900 ${l.fontSize || 100}px "Avenir Next", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = 3;
    c.strokeStyle = "#1a142d";
    c.strokeText(l.text, 0, 0);
    c.fillStyle = l.color || "#ffffff";
    c.fillText(l.text, 0, 0);
  } else {
    c.filter = "none";
    c.globalCompositeOperation = l.erase ? "destination-out" : "source-over";
    c.strokeStyle = l.color;
    c.fillStyle = l.color;
    c.lineCap = "round";
    c.lineJoin = "round";
    // One filled path per stroke keeps translucent brushes from darkening at
    // every sampled point while retaining pressure-dependent widths.
    c.beginPath();
    for (let i = 0; i < l.points.length; i++) {
      const p = l.points[i],
        prev = l.points[Math.max(0, i - 1)];
      const radius = l.size * (p[2] || 0.5),
        dx = p[0] - prev[0],
        dy = (p[1] - prev[1]) * aspect(),
        distance = Math.hypot(dx, dy);
      c.moveTo(p[0] + radius, p[1] * aspect());
      c.arc(p[0], p[1] * aspect(), radius, 0, Math.PI * 2);
      if (distance) {
        const nx = -dy / distance,
          ny = dx / distance,
          previousRadius = l.size * (prev[2] || 0.5);
        c.moveTo(
          prev[0] + nx * previousRadius,
          prev[1] * aspect() + ny * previousRadius,
        );
        c.lineTo(
          prev[0] - nx * previousRadius,
          prev[1] * aspect() - ny * previousRadius,
        );
        c.lineTo(p[0] - nx * radius, p[1] * aspect() - ny * radius);
        c.lineTo(p[0] + nx * radius, p[1] * aspect() + ny * radius);
        c.closePath();
      }
    }
    c.fill();
  }
  c.restore();
}
function render() {
  if (!template) return;
  ctx.clearRect(0, 0, SIZE, SIZE);
  pattern(ctx);
  for (const l of state.layers) {
    if (l.visible === false) continue;
    if (l.type === "paint") {
      inkCtx.clearRect(0, 0, SIZE, SIZE);
      for (const stroke of l.strokes) drawLayer(inkCtx, stroke);
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(ink, 0, 0, SIZE, SIZE);
      ctx.restore();
    } else drawLayer(ctx, l);
  }
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(template, 0, 0, SIZE, SIZE);
  ctx.restore();
  drawOverlay();
}
let locator = null,
  locatorStart = 0,
  locatorFrame = 0;
function locateLayer(l) {
  cancelAnimationFrame(locatorFrame);
  locator = makeCanvas();
  const c = locator.getContext("2d");
  if (l.type === "paint") l.strokes.forEach((s) => drawLayer(c, s));
  else drawLayer(c, l);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = "#ffe69a";
  c.fillRect(0, 0, SIZE, SIZE);
  c.globalCompositeOperation = "destination-in";
  c.drawImage(template, 0, 0, SIZE, SIZE);
  locatorStart = performance.now();
  function pulse() {
    if (performance.now() - locatorStart > 900) {
      locator = null;
      drawOverlay();
      return;
    }
    drawOverlay();
    locatorFrame = requestAnimationFrame(pulse);
  }
  pulse();
}
function drawOverlay() {
  ox.clearRect(0, 0, SIZE, SIZE);
  if (locator) {
    ox.save();
    ox.globalAlpha =
      Math.max(0, 1 - (performance.now() - locatorStart) / 900) * 0.85;
    ox.drawImage(locator, 0, 0);
    ox.restore();
  }
  const p = panel();
  if ($("showGuide").checked && p) {
    const [x, y, w, h] = p.safe;
    ox.lineWidth = 2 / Math.max(zoom, 0.5);
    ox.strokeStyle = "#ffe0a2";
    ox.setLineDash([8, 6]);
    ox.strokeRect(x + 4, y + 4, w - 8, h - 8);
    ox.setLineDash([]);
    ox.fillStyle = "#15101ee0";
    ox.fillRect(x, y - 24, Math.min(w, 180), 22);
    ox.fillStyle = "#ffe0a2";
    ox.font = "13px sans-serif";
    ox.fillText(p.label, x + 5, y - 8);
  }
  const l = layer();
  if (l && l.visible !== false && !["stroke", "paint"].includes(l.type)) {
    const [w, h] = dimensions(l);
    ox.save();
    ox.translate(l.x, l.y);
    ox.scale(1, 1 / aspect());
    ox.rotate((l.rotation * Math.PI) / 180);
    ox.strokeStyle = l.locked ? "#999" : "#cbbbff";
    ox.lineWidth = 2 / Math.max(zoom, 0.5);
    ox.strokeRect(
      (-w * l.scale) / 2,
      (-h * l.scale) / 2,
      w * l.scale,
      h * l.scale,
    );
    ox.restore();
  }
}
function dimensions(l) {
  if (l.type === "image") return [l.width, l.height];
  return [
    l.text.length * (l.fontSize || 100) * 0.67,
    (l.fontSize || 100) * 1.35,
  ];
}
function updateUI() {
  for (const k of ["baseColor", "accentColor", "pattern"])
    $(k).value = state[k];
  $("fileName").value = state.name || "My_Family_Wrap";
  $("layerList").replaceChildren();
  $("layerCount").textContent = state.layers.length;
  $("emptyLayers").hidden = !!state.layers.length;
  for (const l of [...state.layers].reverse()) {
    const b = document.createElement("button");
    b.className = `layer ${l.id === selected ? "active" : ""} ${l.visible === false ? "hidden-layer" : ""}`;
    const t = document.createElement(l.type === "image" ? "img" : "span");
    t.className = "thumb";
    if (l.type === "image") {
      t.src = l.src;
      t.alt = "";
    } else t.textContent = l.type === "text" ? "T" : l.erase ? "⌫" : "✎";
    const n = document.createElement("span");
    n.className = "name";
    n.textContent = l.name;
    const kind = document.createElement("small");
    kind.textContent =
      l.type === "paint" ? "Drawing" : l.type === "image" ? "Photo" : "Text";
    n.append(kind);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = l.locked ? "🔒" : l.visible === false ? "○" : "";
    b.append(t, n, badge);
    b.onclick = () => {
      selected = l.id;
      setTool(l.type === "paint" ? "brush" : "select");
      updateUI();
      locateLayer(l);
    };
    const row = document.createElement("div");
    row.className = "layer-row";
    const visibility = document.createElement("button");
    visibility.className = "layer-eye";
    visibility.textContent = l.visible === false ? "○" : "◉";
    visibility.setAttribute(
      "aria-label",
      `${l.visible === false ? "Show" : "Hide"} ${l.name}`,
    );
    visibility.setAttribute("aria-pressed", String(l.visible !== false));
    visibility.title = l.visible === false ? "Show layer" : "Hide layer";
    visibility.onclick = () =>
      change(() => {
        l.visible = l.visible === false;
      });
    row.dataset.layerId = l.id;
    const actions = document.createElement("div");
    actions.className = "layer-actions";
    actions.append(visibility);
    for (const [symbol, label, action] of [
      [
        l.locked ? "🔒" : "🔓",
        l.locked ? "Unlock" : "Lock",
        () => $("toggleLock").onclick(),
      ],
      ["⧉", "Duplicate", () => $("duplicateLayer").onclick()],
      ["↑", "Forward", () => $("raiseLayer").onclick()],
      ["↓", "Backward", () => $("lowerLayer").onclick()],
      ["×", "Delete", () => $("deleteLayer").onclick()],
    ]) {
      const button = document.createElement("button");
      button.textContent = symbol;
      button.title = label;
      button.setAttribute("aria-label", `${label} ${l.name}`);
      button.onclick = () => {
        selected = l.id;
        action();
      };
      actions.append(button);
    }
    const handle = document.createElement("button");
    handle.textContent = "⠿";
    handle.className = "layer-grip";
    handle.title = "Drag to reorder";
    handle.setAttribute("aria-label", `Reorder ${l.name}`);
    handle.disabled = !!l.locked;
    let destination = null;
    handle.onpointerdown = (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      row.classList.add("reordering");
    };
    handle.onpointermove = (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest(".layer-row");
      document
        .querySelectorAll(".drop-target")
        .forEach((el) => el.classList.remove("drop-target"));
      destination = target?.dataset.layerId;
      if (target && target !== row) target.classList.add("drop-target");
    };
    handle.onpointerup = () => {
      row.classList.remove("reordering");
      document
        .querySelectorAll(".drop-target")
        .forEach((el) => el.classList.remove("drop-target"));
      if (destination && destination !== l.id)
        change(() => {
          const from = state.layers.findIndex((x) => x.id === l.id),
            to = state.layers.findIndex((x) => x.id === destination);
          state.layers.splice(from, 1);
          state.layers.splice(to, 0, l);
        });
      destination = null;
    };
    handle.onpointercancel = () => {
      destination = null;
      row.classList.remove("reordering");
      document
        .querySelectorAll(".drop-target")
        .forEach((el) => el.classList.remove("drop-target"));
    };
    row.append(handle, b, actions);
    $("layerList").append(row);
  }
  const l = layer();
  $("transformControls").hidden = !l;
  if (l) {
    l.referenceScale ||= l.scale;
    $("layerName").value = l.name;
    $("textEditControls").hidden = l.type !== "text";
    $("photoAdjustments").hidden = l.type !== "image";
    $("toggleVisible").textContent = l.visible === false ? "Show" : "Hide";
    $("toggleLock").textContent = l.locked ? "Unlock" : "Lock";
    $("opacity").disabled = !!l.locked;
    $("layerName").disabled = !!l.locked;
    if (l.type === "text") {
      $("editText").value = l.text;
      $("textColor").value = l.color || "#ffffff";
    }
    for (const [id, value] of [
      ["scale", (l.scale / l.referenceScale) * 100],
      ["rotation", l.rotation],
      ["opacity", l.opacity * 100],
      ["brightness", l.brightness ?? 100],
      ["saturation", l.saturation ?? 100],
    ]) {
      $(id).value = value;
      if ($(id + "Value"))
        $(id + "Value").textContent =
          Math.round(value) + (id === "rotation" ? "°" : "%");
    }
    for (const id of [
      "scale",
      "rotation",
      "rotateLeft",
      "rotateRight",
      "brightness",
      "saturation",
      "flipLayer",
    ]) {
      $(id).disabled = l.locked || ["stroke", "paint"].includes(l.type);
      $(id).hidden = l.type === "paint";
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) label.hidden = l.type === "paint";
    }
  }
  $("undo").disabled = !history.length;
  $("redo").disabled = !future.length;
  syncTools();
}
function setTool(value) {
  tool = value;
  syncTools();
}
function syncTools() {
  const l = layer();
  $("activePaintLayer").textContent = l?.locked
    ? `Locked: ${l.name}`
    : l?.visible === false
      ? `Hidden: ${l.name}`
      : tool === "brush" || tool === "eraser"
        ? l?.type === "paint"
          ? `Drawing on: ${l.name}`
          : tool === "eraser"
            ? "Choose a drawing layer"
            : "Draw to start a new layer"
        : tool === "pan"
          ? "Moving the view, not the art"
          : l
            ? `Selected: ${l.name}`
            : "Pick a tool";
  const drawing = ["brush", "eraser", "picker"].includes(tool);
  $("brushOptions").hidden = !drawing;
  const hints = {
    brush: "Draw on the colored shapes",
    eraser: "Erase this drawing layer",
    picker: "Tap a color to use it",
    select: "Drag a photo or words",
    pan: "Drag to move your view",
  };
  $("canvasHint").textContent = hints[tool];
  $("toolHint").textContent = hints[tool];
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => b.setAttribute("aria-pressed", b.dataset.tool === tool));
  const preset = $("brushPreset").value;
  const glyph =
    tool === "eraser"
      ? icons.erase
      : preset === "spray"
        ? '<path d="M3 22h10V9H3zM6 5h4v4M15 7h2M19 4h2M19 10h2M23 2h1M23 12h1"/>'
        : icons.draw;
  const cursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28"><g stroke="white" stroke-width="4" fill="none">${glyph}</g><g stroke="black" stroke-width="1.8" fill="none">${glyph}</g><text x="18" y="27" font-size="9" fill="white" stroke="black" stroke-width=".3">${tool === "eraser" ? "E" : preset === "pencil" ? "✎" : preset === "marker" ? "M" : preset === "spray" ? "S" : "P"}</text></svg>`;
  $("stage").style.cursor =
    tool === "pan"
      ? "grab"
      : tool === "select"
        ? "move"
        : `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 3 22, crosshair`;
}
function baseSize() {
  return Math.max(
    100,
    Math.min(
      $("stage").clientWidth - 70,
      ($("stage").clientHeight - 90) / aspect(),
    ),
  );
}
let focusFrame = 0;
function stopFocus() {
  cancelAnimationFrame(focusFrame);
  focusFrame = 0;
}
function animateFocus(target) {
  stopFocus();
  const start = { zoom, angle: viewAngle, pan: { ...pan } },
    startTime = performance.now();
  const angleDelta = ((target.angle - start.angle + 540) % 360) - 180;
  const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 420;
  function step(now) {
    const t = duration ? Math.min(1, (now - startTime) / duration) : 1;
    const eased = t * t * (3 - 2 * t);
    zoom = start.zoom + (target.zoom - start.zoom) * eased;
    viewAngle = start.angle + angleDelta * eased;
    pan = {
      x: start.pan.x + (target.pan.x - start.pan.x) * eased,
      y: start.pan.y + (target.pan.y - start.pan.y) * eased,
    };
    view();
    if (t < 1) focusFrame = requestAnimationFrame(step);
    else focusFrame = 0;
  }
  focusFrame = requestAnimationFrame(step);
}
function view() {
  const size = baseSize() * zoom;
  for (const c of [canvas, overlay]) {
    c.style.width = size + "px";
    c.style.height = size * aspect() + "px";
    c.style.transform = `translate(calc(-50% + ${pan.x}px),calc(-50% + ${pan.y}px)) rotate(${viewAngle}deg)`;
  }
  $("zoomValue").textContent = Math.round(zoom * 100) + "%";
  $("canvasAngle").value = viewAngle;
  $("canvasAngleValue").textContent = viewAngle + "°";
}
function turnCanvas(angle) {
  stopFocus();
  // Rotate around the point currently at the center of the viewport, not the
  // template origin. Only CSS view transforms change; exported pixels do not.
  const delta = ((angle - viewAngle) * Math.PI) / 180;
  pan = {
    x: pan.x * Math.cos(delta) - pan.y * Math.sin(delta),
    y: pan.x * Math.sin(delta) + pan.y * Math.cos(delta),
  };
  viewAngle = ((((angle + 180) % 360) + 360) % 360) - 180;
  view();
}
function resetView() {
  stopFocus();
  zoom = 1;
  pan = { x: 0, y: 0 };
  viewAngle = 0;
  $("panel").value = "";
  $("panelHint").textContent = "· All panels";
  choosePart.textContent = "Focus area ▾";
  view();
  drawOverlay();
}
function point(e) {
  const r = $("stage").getBoundingClientRect(),
    s = (baseSize() * zoom) / SIZE,
    a = (-viewAngle * Math.PI) / 180,
    x = e.clientX - r.left - r.width / 2 - pan.x,
    y = e.clientY - r.top - r.height / 2 - pan.y;
  return {
    x: (x * Math.cos(a) - y * Math.sin(a)) / s + 512,
    y: (x * Math.sin(a) + y * Math.cos(a)) / s / aspect() + 512,
  };
}
function zoomAt(factor, e) {
  stopFocus();
  const old = zoom;
  zoom = Math.max(0.3, Math.min(24, zoom * factor));
  if (e) {
    const r = $("stage").getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    pan = {
      x: x - ((x - pan.x) * zoom) / old,
      y: y - ((y - pan.y) * zoom) / old,
    };
  }
  view();
  drawOverlay();
}
function hit(p) {
  return [...state.layers].reverse().find((l) => {
    if (["stroke", "paint"].includes(l.type) || l.visible === false || l.locked)
      return false;
    const a = (-l.rotation * Math.PI) / 180,
      x = p.x - l.x,
      y = (p.y - l.y) * aspect(),
      [w, h] = dimensions(l);
    return (
      Math.abs(x * Math.cos(a) - y * Math.sin(a)) < (w * l.scale) / 2 &&
      Math.abs(x * Math.sin(a) + y * Math.cos(a)) < (h * l.scale) / 2
    );
  });
}
function makePaintLayer() {
  return {
    id: uid(),
    type: "paint",
    name: `Drawing ${state.layers.filter((l) => l.type === "paint").length + 1}`,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    strokes: [],
  };
}
function pickColor(p) {
  if (p.x < 0 || p.y < 0 || p.x >= SIZE || p.y >= SIZE) return;
  const pixel = ctx.getImageData(
    Math.floor(p.x * 4),
    Math.floor(p.y * 4),
    1,
    1,
  ).data;
  if (!pixel[3]) return toast("Pick a color from a painted body panel.");
  setBrushColor(
    "#" +
      [...pixel]
        .slice(0, 3)
        .map((n) => n.toString(16).padStart(2, "0"))
        .join(""),
  );
  setTool("brush");
}
function strokeStart(p, e) {
  if (busy || gesture) return false;
  if (tool === "picker") {
    pickColor(p);
    return false;
  }
  let target = layer();
  if (target?.locked || target?.visible === false) {
    toast("Unlock and show this layer before drawing.");
    return false;
  }
  if (target?.type !== "paint" && tool === "eraser") {
    toast("Choose a paint layer to erase.");
    return false;
  }
  checkpoint();
  if (target?.type !== "paint") {
    target = makePaintLayer();
    state.layers.push(target);
  }
  const l = {
    id: uid(),
    type: "stroke",
    name: tool === "eraser" ? "Erase drawing" : "Drawing",
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: +$("brushOpacity").value / 100,
    size: +$("brushSize").value,
    color: $("brushColor").value,
    erase: tool === "eraser",
    points: [
      [p.x, p.y, e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5],
    ],
  };
  const spray = tool === "brush" && $("brushPreset").value === "spray";
  if (!spray) target.strokes.push(l);
  selected = target.id;
  gesture = { type: "draw", id: e.pointerId, layer: l, spray, target };
  if (spray) sprayAt(p);
  render();
  return true;
}
function strokeMove(p, e) {
  if (gesture?.type !== "draw") return;
  if (gesture.spray) {
    sprayAt(p);
    requestRender();
    return;
  }
  gesture.layer.points.push([
    p.x,
    p.y,
    e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5,
  ]);
  requestRender();
}
function sprayAt(p) {
  const g = gesture,
    radius = g.layer.size / 2;
  if (
    g.lastSpray &&
    Math.hypot(p.x - g.lastSpray.x, (p.y - g.lastSpray.y) * aspect()) <
      Math.max(1, radius / 5)
  )
    return;
  g.lastSpray = p;
  // Bake individual dots into ordinary strokes: exports, undo and saved
  // projects reproduce the same spray without rerandomizing on each render.
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2,
      r = Math.sqrt(Math.random()) * radius;
    g.target.strokes.push({
      ...g.layer,
      id: uid(),
      size: Math.max(0.6, radius * 0.06),
      points: [
        [p.x + Math.cos(a) * r, p.y + (Math.sin(a) * r) / aspect(), 0.5],
      ],
    });
  }
}
let framePending = false;
function requestRender() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => {
    framePending = false;
    render();
  });
}
function finish() {
  if (!gesture) return;
  const changedArt = gesture.type !== "pan";
  gesture = null;
  if (changedArt) changed();
}
const touches = new Map();
let touchView = null,
  touchBefore = null;
function touchPosition(e) {
  const r = $("stage").getBoundingClientRect();
  return {
    x: e.clientX - r.left - r.width / 2,
    y: e.clientY - r.top - r.height / 2,
  };
}
$("stage").onpointerdown = (e) => {
  // Choices apply immediately. Closing the drawer does not consume the stroke.
  for (const drawer of [layersDialog, colorsDialog])
    if (drawer.open) drawer.close();
  stopFocus();
  if (e.pointerType === "touch" && !busy) {
    touches.set(e.pointerId, touchPosition(e));
    $("stage").setPointerCapture(e.pointerId);
    if (touches.size === 1)
      touchBefore = {
        state: snapshot(),
        history: history.length,
        future: [...future],
        selected,
      };
    if (touches.size === 2) {
      // A second finger means move the paper. Discard the tentative first
      // finger mark, including its undo entry, rather than leaving stray ink.
      if (gesture && touchBefore) {
        state = JSON.parse(touchBefore.state);
        history.length = touchBefore.history;
        future = touchBefore.future;
        selected = touchBefore.selected;
        gesture = null;
        render();
        updateUI();
      }
      touchView = {
        points: [...touches.values()],
        view: { zoom, angle: viewAngle, pan: { ...pan } },
      };
    }
    if (touches.size > 1 || touchView) {
      e.preventDefault();
      return;
    }
  }
  if (busy || e.button > 1 || gesture) return;
  e.preventDefault();
  $("stage").setPointerCapture(e.pointerId);
  const p = point(e);
  if (tool === "pan" || space || e.button === 1)
    gesture = {
      type: "pan",
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      pan: { ...pan },
    };
  else if (["brush", "eraser", "picker"].includes(tool)) strokeStart(p, e);
  else {
    const l = hit(p);
    selected = l?.id || null;
    if (l) {
      checkpoint();
      gesture = { type: "move", id: e.pointerId, dx: p.x - l.x, dy: p.y - l.y };
    }
    updateUI();
    drawOverlay();
  }
};
$("stage").onpointermove = (e) => {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, touchPosition(e));
  if (touchView) {
    if (touches.size === 2) {
      const next = pinchView(
        touchView.points,
        [...touches.values()],
        touchView.view,
      );
      zoom = next.zoom;
      pan = next.pan;
      viewAngle = next.angle;
      view();
    }
    return;
  }
  if (!gesture || gesture.id !== e.pointerId) return;
  if (gesture.type === "pan") {
    pan = {
      x: gesture.pan.x + e.clientX - gesture.x,
      y: gesture.pan.y + e.clientY - gesture.y,
    };
    view();
  } else if (gesture.type === "draw") {
    for (const sample of e.getCoalescedEvents?.().length
      ? e.getCoalescedEvents()
      : [e])
      strokeMove(point(sample), sample);
  } else {
    const l = layer(),
      p = point(e);
    l.x = p.x - gesture.dx;
    l.y = p.y - gesture.dy;
    render();
  }
};
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  $("stage").addEventListener(type, (e) => {
    touches.delete(e.pointerId);
    if (touchView) {
      if (!touches.size) {
        touchView = null;
        touchBefore = null;
      }
      return;
    }
    if (gesture?.id === e.pointerId) finish();
    if (!touches.size) touchBefore = null;
  });
$("stage").addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e);
  },
  { passive: false },
);
new ResizeObserver(() => view()).observe($("stage"));
async function imageLayer(src, name) {
  const im = await loadImage(src);
  return {
    id: uid(),
    type: "image",
    name,
    src,
    width: im.naturalWidth,
    height: im.naturalHeight,
    x: 512,
    y: 512,
    scale: 800 / Math.max(im.width, im.height),
    rotation: 0,
    opacity: 1,
  };
}
async function importFiles(files) {
  for (const f of files) {
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type))
        throw Error("Choose PNG, JPEG, or WebP.");
      if (f.size > 25_000_000)
        throw Error("Please use a photo smaller than 25 MB.");
      const src = await new Promise((r, j) => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result);
        fr.onerror = j;
        fr.readAsDataURL(f);
      });
      const im = await loadImage(src);
      const c = makeCanvas();
      const ratio = Math.min(1, 2048 / Math.max(im.width, im.height));
      c.width = Math.round(im.width * ratio);
      c.height = Math.round(im.height * ratio);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      const l = await imageLayer(
        c.toDataURL("image/png"),
        f.name.replace(/\.[^.]+$/, ""),
      );
      if (panel()) Object.assign(l, fitInPanel(l.width, l.height, panel()));
      change(() => {
        state.layers.push(l);
        selected = l.id;
      });
      setTool("select");
    } catch (e) {
      toast(e.message);
    }
  }
}
$("artUpload").onchange = (e) => {
  importFiles([...e.target.files]);
  e.target.value = "";
};
$("stage").ondragover = (e) => {
  e.preventDefault();
};
$("stage").ondrop = (e) => {
  e.preventDefault();
  importFiles([...e.dataTransfer.files]);
};
$("addText").onclick = () => {
  const text = $("textInput").value.trim();
  if (!text) return;
  const l = {
    id: uid(),
    type: "text",
    name: text,
    text,
    color: $("brushColor").value,
    fontSize: 100,
    x: 512,
    y: 230,
    scale: 1,
    rotation: 0,
    opacity: 1,
  };
  if (panel()) Object.assign(l, fitInPanel(...dimensions(l), panel()));
  change(() => {
    state.layers.push(l);
    selected = l.id;
  });
  $("textInput").value = "";
  setTool("select");
};
$("textInput").onkeydown = (e) => {
  if (e.key === "Enter") $("addText").click();
};
document
  .querySelectorAll("[data-tool]")
  .forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
for (const color of [
  "#ffbd69",
  "#fd728f",
  "#a995ff",
  "#53d9c4",
  "#69c5ff",
  "#ffffff",
  "#15151f",
  "#ef4444",
  "#facc15",
  "#22c55e",
  "#2563eb",
  "#d946ef",
]) {
  const b = document.createElement("button");
  b.style.background = color;
  b.dataset.color = color;
  b.title = `Brush ${color}`;
  b.setAttribute("aria-label", b.title);
  b.onclick = () => {
    setBrushColor(color);
  };
  $("swatches").append(b);
}
function setBrushColor(color) {
  $("brushColor").value = color;
  colorButton.style.setProperty("--ink", color);
  document.documentElement.style.setProperty("--selected-ink", color);
  $("swatches")
    .querySelectorAll("button")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        b.dataset.color.toLowerCase() === color.toLowerCase(),
      ),
    );
  customColor.classList.toggle(
    "custom-selected",
    ![...$("swatches").children].some(
      (b) => b.dataset.color === color.toLowerCase(),
    ),
  );
}
setBrushColor($("brushColor").value);
$("brushColor").oninput = () => setBrushColor($("brushColor").value);
$("brushOpacity").oninput = () => {
  customBrushStrength = true;
  $("brushOpacityValue").textContent = $("brushOpacity").value + "%";
};
$("brushPreset").onchange = () => {
  const presets = {
    pen: [8, 100],
    pencil: [2, 100],
    marker: [28, 40],
    spray: [48, 35],
  };
  const [size, opacity] = presets[$("brushPreset").value];
  if (!customBrushSize) $("brushSize").value = size;
  $("brushSizeValue").textContent = $("brushSize").value + " px";
  if (!customBrushStrength) $("brushOpacity").value = opacity;
  $("brushOpacityValue").textContent = $("brushOpacity").value + "%";
  setTool("brush");
};
$("addPaintLayer").onclick = () => {
  change(() => {
    const paint = makePaintLayer();
    state.layers.push(paint);
    selected = paint.id;
  });
  setTool("brush");
};
$("brushSize").oninput = () => {
  customBrushSize = true;
  $("brushSizeValue").textContent = $("brushSize").value + " px";
};
for (const k of ["baseColor", "accentColor", "pattern"]) {
  $(k).onfocus = () => checkpoint();
  $(k).oninput = () => {
    state[k] = $(k).value;
    render();
    scheduleSave();
  };
  $(k).onchange = updateUI;
}
for (const [id, key, mul] of [
  ["scale", "scale", 0.01],
  ["rotation", "rotation", 1],
  ["opacity", "opacity", 0.01],
  ["brightness", "brightness", 1],
  ["saturation", "saturation", 1],
]) {
  $(id).onpointerdown = () => checkpoint();
  $(id).onkeydown = (e) => {
    if (e.key.startsWith("Arrow")) checkpoint();
  };
  $(id).oninput = () => {
    const l = layer();
    if (!l || l.locked) return;
    l[key] = +$(id).value * mul * (key === "scale" ? l.referenceScale || 1 : 1);
    render();
    if ($(id + "Value"))
      $(id + "Value").textContent =
        $(id).value + (id === "rotation" ? "°" : "%");
    scheduleSave();
  };
  $(id).onchange = updateUI;
}
$("layerName").onchange = () =>
  change(() => {
    if (layer()) layer().name = $("layerName").value.slice(0, 100);
  });
function editLayer(fn) {
  const l = layer();
  if (l && !l.locked) change(() => fn(l));
}
$("editText").oninput = () =>
  editLayer((l) => {
    l.text = $("editText").value.slice(0, 100);
    l.name = l.text;
  });
$("textColor").onchange = () =>
  editLayer((l) => {
    l.color = $("textColor").value;
  });
$("rotateLeft").onclick = () =>
  editLayer(
    (l) =>
      (l.rotation =
        (l.rotation + 270) % 360 > 180
          ? ((l.rotation + 270) % 360) - 360
          : (l.rotation + 270) % 360),
  );
$("rotateRight").onclick = () =>
  editLayer(
    (l) =>
      (l.rotation =
        (l.rotation + 90 + 360) % 360 > 180
          ? ((l.rotation + 450) % 360) - 360
          : (l.rotation + 450) % 360),
  );
$("flipLayer").onclick = () => editLayer((l) => (l.flip = !l.flip));
$("duplicateLayer").onclick = () => {
  const l = layer();
  if (l)
    change(() => {
      const copy = structuredClone(l);
      copy.id = uid();
      copy.name += " copy";
      if (copy.type !== "paint") {
        copy.x += 12;
        copy.y += 12;
      }
      state.layers.push(copy);
      selected = copy.id;
    });
};
$("deleteLayer").onclick = () =>
  editLayer((l) => {
    state.layers = state.layers.filter((x) => x.id !== l.id);
    selected = state.layers.at(-1)?.id;
  });
for (const [id, key] of [
  ["toggleVisible", "visible"],
  ["toggleLock", "locked"],
])
  $(id).onclick = () => {
    const l = layer();
    if (l)
      change(() => {
        l[key] = key === "visible" ? l.visible === false : !l.locked;
      });
  };
for (const [id, d] of [
  ["raiseLayer", 1],
  ["lowerLayer", -1],
])
  $(id).onclick = () =>
    editLayer((l) => {
      const i = state.layers.indexOf(l),
        j = i + d;
      if (j >= 0 && j < state.layers.length)
        [state.layers[i], state.layers[j]] = [state.layers[j], state.layers[i]];
    });
$("panel").onchange = () => {
  const p = panel();
  $("panelHint").textContent = p ? "· " + p.label : "· All panels";
  $("panelNote").textContent = p
    ? `${p.orientationVerified ? "Orientation tested on your Model Y." : "Orientation is a starting suggestion; confirm on your Tesla."} Fit keeps the full image inside this panel.`
    : "Choose a panel for automatic character placement.";
  drawOverlay();
};
$("placePanel").onclick = () => {
  const p = panel(),
    l = layer();
  if (!p || !l)
    return toast("Select an image or text layer and a panel first.");
  if (["stroke", "paint"].includes(l.type))
    return toast("Drawings stay where you drew them.");
  editLayer((l) => {
    Object.assign(l, fitInPanel(...dimensions(l), p));
    l.referenceScale = l.scale;
  });
};
$("focusPanel").onclick = () => {
  const p = panel();
  if (!p) return resetView();
  // Show the entire panel. Safe rectangles constrain object placement only.
  const [x, y, w, h] = p.bounds;
  const targetAngle = -p.rotation;
  const rotated = Math.abs(p.rotation) === 90;
  const targetZoom = Math.min(
    24,
    (Math.min(
      ($("stage").clientWidth * 0.72) / (rotated ? h * aspect() : w),
      ($("stage").clientHeight * 0.72) / (rotated ? w : h * aspect()),
    ) *
      SIZE) /
      baseSize(),
  );
  const a = (targetAngle * Math.PI) / 180,
    s = (baseSize() * targetZoom) / SIZE,
    dx = x + w / 2 - 512,
    dy = (y + h / 2 - 512) * aspect();
  const targetPan = {
    x: -(dx * Math.cos(a) - dy * Math.sin(a)) * s,
    y: -(dx * Math.sin(a) + dy * Math.cos(a)) * s,
  };
  animateFocus({ zoom: targetZoom, angle: targetAngle, pan: targetPan });
  drawOverlay();
};
$("showGuide").onchange = drawOverlay;
$("panel").addEventListener("change", () => $("focusPanel").onclick());
$("turnCanvasLeft").onclick = () => turnCanvas(viewAngle - 90);
$("turnCanvasRight").onclick = () => turnCanvas(viewAngle + 90);
$("canvasAngle").oninput = (e) => turnCanvas(Number(e.target.value));
$("fitView").onclick = resetView;
$("zoomIn").onclick = () => zoomAt(1.3);
$("zoomOut").onclick = () => zoomAt(1 / 1.3);
$("undo").onclick = () => undo();
$("redo").onclick = () => undo(true);
$("vehicle").onchange = () => selectVehicle($("vehicle").value);
document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if (e.code === "Space") {
    space = true;
    e.preventDefault();
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo(e.shiftKey);
  } else if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    $("deleteLayer").click();
  } else if (e.key === "[" || e.key === "]") {
    $("brushSize").value = Math.max(
      1,
      Math.min(80, +$("brushSize").value + (e.key === "[" ? -2 : 2)),
    );
    $("brushSizeValue").textContent = $("brushSize").value + " px";
  } else if (
    !e.metaKey &&
    !e.ctrlKey &&
    { b: 1, e: 1, h: 1, v: 1, i: 1 }[e.key]
  )
    setTool(
      { b: "brush", e: "eraser", h: "pan", v: "select", i: "picker" }[e.key],
    );
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") space = false;
});
window.addEventListener("blur", () => {
  space = false;
  finish();
});
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$("saveProject").onclick = () =>
  download(
    new Blob([snapshot()], { type: "application/json" }),
    safeName($("fileName").value).replace(".png", ".wrap-project.json"),
  );
$("fileName").oninput = () => {
  state.name = $("fileName").value;
  scheduleSave();
};
$("newProject").onclick = () => {
  change(() => {
    state.layers = [];
    state.name = "My_Family_Wrap";
    selected = null;
  });
  resetView();
  setTool("brush");
  toast("Fresh canvas. Undo brings back your previous artwork.");
};
$("projectUpload").onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try {
    if (f.size > 80_000_000) throw Error("Project exceeds 80 MB.");
    const p = validateProject(
      JSON.parse(await f.text()),
      vehicles.map((v) => v.id),
    );
    await Promise.all(
      p.layers.filter((l) => l.type === "image").map((l) => loadImage(l.src)),
    );
    checkpoint();
    state = upgradeProject(p);
    selected = p.layers.at(-1)?.id;
    await selectVehicle(p.vehicle, false);
    changed();
    toast("Editable project opened.");
  } catch (e) {
    toast(e.message);
  }
};
$("exportButton").onclick = async () => {
  if (!template || busy) return;
  $("exportButton").disabled = true;
  try {
    let result;
    for (const [w, h] of exportSizes(
      template.naturalWidth,
      template.naturalHeight,
    )) {
      const c = makeCanvas(w);
      c.height = h;
      const cx = c.getContext("2d");
      cx.drawImage(canvas, 0, 0, w, h);
      const m = makeCanvas(w);
      m.height = h;
      const mx = m.getContext("2d");
      mx.drawImage(template, 0, 0, w, h);
      const pixels = cx.getImageData(0, 0, w, h),
        alpha = mx.getImageData(0, 0, w, h);
      for (let i = 3; i < pixels.data.length; i += 4)
        pixels.data[i] = alpha.data[i];
      cx.putImageData(pixels, 0, 0);
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      if (blob && blob.size <= MAX_BYTES) {
        result = { blob, w, h };
        break;
      }
    }
    if (!result)
      throw Error(
        "This design is too detailed for 1 MB. Simplify a photo or hide a layer, then export again.",
      );
    const name = safeName($("fileName").value);
    download(result.blob, name);
    $("validation").textContent =
      `✓ ${name} · ${result.w} × ${result.h} · ${(result.blob.size / 1000).toFixed(0)} KB · official ${vehicle.label} mask`;
    toast("Your artwork is ready for your Tesla!");
  } catch (e) {
    toast(e.message);
  } finally {
    $("exportButton").disabled = false;
  }
};
$("openHelp").onclick = () => $("helpDialog").showModal();
$("openAdd").onclick = () => $("addDialog").showModal();
$("artUpload").addEventListener("change", () => $("addDialog").close());
for (const id of ["addText", "newProject", "demo"])
  $(id).addEventListener("click", () => $("addDialog").close());
$("demo").onclick = async () => {
  try {
    const p = await (
      await fetch("./artwork/bfdi-demo.wrap-project.json")
    ).json();
    validateProject(
      p,
      vehicles.map((v) => v.id),
    );
    await Promise.all(
      p.layers.filter((l) => l.type === "image").map((l) => loadImage(l.src)),
    );
    checkpoint();
    state = upgradeProject(p);
    selected = p.layers.at(-1)?.id;
    await selectVehicle(p.vehicle, false);
    changed();
    toast(
      "BFDI is open as editable layers. Undo returns to your previous design.",
    );
  } catch (e) {
    toast("Could not open the sample: " + e.message);
  }
};
$("copyBrief").onclick = async () => {
  const brief = `Use $tesla-wrap-designer. Vehicle: ${vehicle.label} (${vehicle.id}). My idea: ${$("idea").value.trim() || "Ask me what I want to create."} Create an editable Wrap Studio project and a validated Tesla PNG. Use separate character cutouts, panel-safe placement, correct side orientation, clean silhouettes, and untouched window gaps. Show the design before export.`;
  try {
    await navigator.clipboard.writeText(brief);
    toast("Design brief copied. Paste it into Codex.");
  } catch {
    $("idea").value = brief;
    toast("Your brief is in the text box; select and copy it.");
  }
};
try {
  vehicles = await (await fetch("./vehicles.json")).json();
  $("vehicle").replaceChildren(
    ...vehicles.map((v) => new Option(v.label, v.id)),
  );
  try {
    await storage();
    const active = await readDraft("_active");
    if (vehicles.some((v) => v.id === active)) state.vehicle = active;
    const draft = await readDraft(state.vehicle);
    if (draft)
      state = validateProject(
        draft,
        vehicles.map((v) => v.id),
      );
  } catch {
    toast("Local recovery unavailable. Use Save project to keep your artwork.");
  }
  await hydrate();
  await selectVehicle(state.vehicle, false);
  updateUI();
} catch (e) {
  status("Studio could not start: " + e.message);
  toast("Refresh to try again.");
}
