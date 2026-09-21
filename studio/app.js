import {
  SIZE,
  MAX_BYTES,
  safeName,
  fitInPanel,
  validateProject,
  exportSizes,
} from "./core.js";
const $ = (id) => document.getElementById(id);
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
  tool = "select",
  preview = null,
  space = false,
  gesture = null,
  busy = false;
let state = {
  version: 2,
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
  const from = redo ? future : history,
    to = redo ? history : future;
  if (!from.length) return;
  to.push(snapshot());
  state = JSON.parse(from.pop());
  selected = state.layers.at(-1)?.id;
  await hydrate();
  await selectVehicle(state.vehicle, false);
  changed();
}
function scheduleSave() {
  clearTimeout(saveTimer);
  $("saveStatus").textContent = "Saving on this device…";
  saveTimer = setTimeout(async () => {
    try {
      const tx = db.transaction("projects", "readwrite");
      tx.objectStore("projects").put(snapshot(), state.vehicle);
      tx.oncomplete = () => {
        $("saveStatus").textContent = "Saved on this device";
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
    $("validation").textContent =
      "Export checks size, name, PNG format, and the official template mask.";
    $("panelHint").textContent = "· All panels";
    const mc = makeCanvas();
    mc.getContext("2d").drawImage(template, 0, 0, SIZE, SIZE);
    mask = mc.getContext("2d").getImageData(0, 0, SIZE, SIZE).data;
    $("panel").replaceChildren(
      new Option("Whole template", ""),
      ...vehicle.panels.map((p) => new Option(p.label, p.id)),
    );
    $("paint3d").disabled = vehicle.preview === "unmapped";
    preview?.setVehicle(vehicle);
    resetView();
    updateUI();
    render();
    status(`${vehicle.label} · ${vehicle.panels.length} paintable panels`);
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
    for (let i = 0; i < l.points.length; i++) {
      const p = l.points[i],
        prev = l.points[Math.max(0, i - 1)];
      c.lineWidth = l.size * (p[2] || 0.5) * 2;
      c.beginPath();
      c.moveTo(prev[0], prev[1] * aspect());
      c.lineTo(p[0], p[1] * aspect());
      c.stroke();
      if (i === 0) {
        c.beginPath();
        c.arc(p[0], p[1] * aspect(), c.lineWidth / 2, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  c.restore();
}
function render() {
  if (!template) return;
  ctx.clearRect(0, 0, SIZE, SIZE);
  pattern(ctx);
  inkCtx.clearRect(0, 0, SIZE, SIZE);
  // Drawings share an erasable ink stack above the independent image/text stack.
  for (const l of state.layers)
    drawLayer(l.type === "stroke" ? inkCtx : ctx, l);
  ctx.drawImage(ink, 0, 0, SIZE, SIZE);
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(template, 0, 0, SIZE, SIZE);
  ctx.restore();
  drawOverlay();
  preview?.update();
}
function drawOverlay() {
  ox.clearRect(0, 0, SIZE, SIZE);
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
  if (l && l.visible !== false && l.type !== "stroke") {
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
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = l.locked ? "🔒" : l.visible === false ? "○" : "";
    b.append(t, n, badge);
    b.onclick = () => {
      selected = l.id;
      setTool("select");
      updateUI();
      drawOverlay();
    };
    $("layerList").append(b);
  }
  const l = layer();
  $("transformControls").hidden = !l;
  if (l) {
    l.referenceScale ||= l.scale;
    $("layerName").value = l.name;
    $("textEditControls").hidden = l.type !== "text";
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
    ])
      $(id).disabled = l.locked || l.type === "stroke";
  }
  $("undo").disabled = !history.length;
  $("redo").disabled = !future.length;
}
function setTool(value) {
  tool = value;
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => b.setAttribute("aria-pressed", b.dataset.tool === value));
  $("stage").style.cursor =
    tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair";
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
function view() {
  const size = baseSize() * zoom;
  for (const c of [canvas, overlay]) {
    c.style.width = size + "px";
    c.style.height = size * aspect() + "px";
    c.style.transform = `translate(calc(-50% + ${pan.x}px),calc(-50% + ${pan.y}px)) rotate(${viewAngle}deg)`;
  }
  $("zoomValue").textContent = Math.round(zoom * 100) + "%";
}
function resetView() {
  zoom = 1;
  pan = { x: 0, y: 0 };
  viewAngle = 0;
  view();
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
    if (l.type === "stroke" || l.visible === false || l.locked) return false;
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
function strokeStart(p, e) {
  checkpoint();
  const l = {
    id: uid(),
    type: "stroke",
    name: tool === "eraser" ? "Erase drawing" : "Drawing",
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    size: +$("brushSize").value,
    color: $("brushColor").value,
    erase: tool === "eraser",
    points: [
      [p.x, p.y, e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5],
    ],
  };
  state.layers.push(l);
  selected = l.id;
  gesture = { type: "draw", id: e.pointerId, layer: l };
  render();
}
function strokeMove(p, e) {
  if (gesture?.type !== "draw") return;
  gesture.layer.points.push([
    p.x,
    p.y,
    e.pointerType === "pen" ? Math.max(0.05, e.pressure) : 0.5,
  ]);
  requestRender();
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
$("stage").onpointerdown = (e) => {
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
  else if (["brush", "eraser"].includes(tool)) strokeStart(p, e);
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
  if (!gesture || gesture.id !== e.pointerId) return;
  if (gesture.type === "pan") {
    pan = {
      x: gesture.pan.x + e.clientX - gesture.x,
      y: gesture.pan.y + e.clientY - gesture.y,
    };
    view();
  } else if (gesture.type === "draw") {
    for (const sample of e.getCoalescedEvents?.() || [e])
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
  $("stage").addEventListener(type, finish);
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
]) {
  const b = document.createElement("button");
  b.style.background = color;
  b.title = `Brush ${color}`;
  b.setAttribute("aria-label", b.title);
  b.onclick = () => {
    $("brushColor").value = color;
  };
  $("swatches").append(b);
}
$("brushSize").oninput = () => {
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
      copy.x += 12;
      copy.y += 12;
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
  if (l.type === "stroke") return toast("Drawings stay where you drew them.");
  editLayer((l) => {
    Object.assign(l, fitInPanel(...dimensions(l), p));
    l.referenceScale = l.scale;
  });
};
$("focusPanel").onclick = () => {
  const p = panel();
  if (!p) return resetView();
  const [x, y, w, h] = p.safe;
  viewAngle = -p.rotation;
  const rotated = Math.abs(p.rotation) === 90;
  zoom = Math.min(
    24,
    (Math.min(
      ($("stage").clientWidth - 90) / (rotated ? h * aspect() : w),
      ($("stage").clientHeight - 110) / (rotated ? w : h * aspect()),
    ) *
      SIZE) /
      baseSize(),
  );
  const a = (viewAngle * Math.PI) / 180,
    s = (baseSize() * zoom) / SIZE,
    dx = x + w / 2 - 512,
    dy = (y + h / 2 - 512) * aspect();
  pan = {
    x: -(dx * Math.cos(a) - dy * Math.sin(a)) * s,
    y: -(dx * Math.sin(a) + dy * Math.cos(a)) * s,
  };
  view();
  drawOverlay();
};
$("showGuide").onchange = drawOverlay;
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
  } else if ({ b: 1, e: 1, h: 1, v: 1 }[e.key])
    setTool({ b: "brush", e: "eraser", h: "pan", v: "select" }[e.key]);
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
    state = p;
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
async function setView(mode) {
  $("stage").hidden = mode === "three";
  $("preview").hidden = mode === "flat";
  $("canvases").classList.toggle("split", mode === "split");
  for (const [id, m] of [
    ["flatView", "flat"],
    ["splitView", "split"],
    ["threeView", "three"],
  ])
    $(id).setAttribute("aria-pressed", m === mode);
  view();
  if (mode !== "flat" && !preview) {
    try {
      const { createPreview } = await import("./preview.js");
      preview = createPreview($("previewCanvas"), canvas, {
        start: (p, e) => {
          if (tool !== "eraser") setTool("brush");
          strokeStart(p, e);
        },
        move: strokeMove,
        end: finish,
      });
      preview.setVehicle(vehicle);
    } catch (e) {
      $("previewNotice").textContent =
        "3D is unavailable on this browser. Top-down editing and export still work.";
      toast(e.message);
    }
  }
  preview?.resize();
}
$("flatView").onclick = () => setView("flat");
$("splitView").onclick = () => setView("split");
$("threeView").onclick = () => setView("three");
$("resetCamera").onclick = () => preview?.reset();
$("paint3d").onclick = () => {
  const enabled = $("paint3d").getAttribute("aria-pressed") !== "true";
  $("paint3d").setAttribute("aria-pressed", enabled);
  preview?.setPainting(enabled);
  if (enabled) setTool("brush");
};
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
    state = p;
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
