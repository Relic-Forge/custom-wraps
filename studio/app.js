const SIZE = 1024;
const MAX_BYTES = 1024 * 1024;
const templateUrl = "../modely-2025-premium/template.png";

const canvas = document.querySelector("#designCanvas");
const ctx = canvas.getContext("2d");
const template = new Image();
const state = {
  baseColor: "#3f2f68",
  accentColor: "#ffcf56",
  pattern: "solid",
  showGuide: true,
  layers: [],
  selectedId: null,
};

const els = Object.fromEntries([
  "baseColor", "accentColor", "pattern", "artUpload", "textInput", "addText",
  "layerList", "emptyLayers", "layerCount", "transformControls", "scale",
  "scaleValue", "rotation", "rotationValue", "opacity", "opacityValue",
  "fitLayer", "centerLayer", "duplicateLayer", "deleteLayer", "showGuide",
  "fileName", "exportButton", "validation", "saveProject", "projectUpload", "toast"
].map(id => [id, document.querySelector(`#${id}`)]));

const swatchColors = ["#ffcf56", "#ff6b8a", "#6ed6ff", "#6ee7a8", "#9b7bff", "#f36f32", "#17171d"];
const swatches = document.querySelector("#swatches");
swatchColors.forEach(color => {
  const button = document.createElement("button");
  button.className = "swatch";
  button.type = "button";
  button.style.background = color;
  button.title = `Use ${color}`;
  button.addEventListener("click", () => {
    state.baseColor = color;
    els.baseColor.value = color;
    render();
  });
  swatches.appendChild(button);
});

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function selectedLayer() {
  return state.layers.find(layer => layer.id === state.selectedId) || null;
}

function drawPattern(target, scale = 1) {
  const width = SIZE * scale;
  target.fillStyle = state.baseColor;
  target.fillRect(0, 0, width, width);
  target.fillStyle = state.accentColor;
  target.strokeStyle = state.accentColor;

  if (state.pattern === "stripes") {
    target.save();
    target.lineWidth = 110 * scale;
    for (let x = -width; x < width * 2; x += 260 * scale) {
      target.beginPath();
      target.moveTo(x, 0);
      target.lineTo(x - width, width);
      target.stroke();
    }
    target.restore();
  } else if (state.pattern === "dots") {
    for (let y = 55; y < SIZE; y += 115) {
      for (let x = 55; x < SIZE; x += 115) {
        target.globalAlpha = ((x + y) / 115) % 2 ? 0.9 : 0.5;
        target.beginPath();
        target.arc(x * scale, y * scale, (18 + ((x + y) % 29)) * scale, 0, Math.PI * 2);
        target.fill();
      }
    }
    target.globalAlpha = 1;
  } else if (state.pattern === "checker") {
    const cell = 128 * scale;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) target.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  } else if (state.pattern === "sunburst") {
    target.save();
    target.translate(width / 2, width / 2);
    for (let i = 0; i < 24; i += 2) {
      const a = (Math.PI * 2 * i) / 24;
      const b = (Math.PI * 2 * (i + 1)) / 24;
      target.beginPath();
      target.moveTo(0, 0);
      target.lineTo(Math.cos(a) * width, Math.sin(a) * width);
      target.lineTo(Math.cos(b) * width, Math.sin(b) * width);
      target.closePath();
      target.fill();
    }
    target.restore();
  }
}

function drawLayer(target, layer, outputScale = 1) {
  target.save();
  target.globalAlpha = layer.opacity;
  target.translate(layer.x * outputScale, layer.y * outputScale);
  target.rotate(layer.rotation * Math.PI / 180);
  target.scale(layer.scale * outputScale, layer.scale * outputScale);

  if (layer.type === "image" && layer.image) {
    target.drawImage(layer.image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
  } else if (layer.type === "text") {
    target.font = `900 ${layer.fontSize}px "Avenir Next", system-ui, sans-serif`;
    target.textAlign = "center";
    target.textBaseline = "middle";
    target.lineWidth = 10;
    target.strokeStyle = "rgba(0,0,0,.48)";
    target.strokeText(layer.text, 0, 0);
    target.fillStyle = layer.color;
    target.fillText(layer.text, 0, 0);
  }
  target.restore();
}

function renderDesign(targetCanvas, outputSize = SIZE, guide = false) {
  const target = targetCanvas.getContext("2d");
  const outputScale = outputSize / SIZE;
  target.clearRect(0, 0, outputSize, outputSize);
  drawPattern(target, outputScale);
  state.layers.forEach(layer => drawLayer(target, layer, outputScale));

  target.save();
  target.globalCompositeOperation = "destination-in";
  target.drawImage(template, 0, 0, outputSize, outputSize);
  target.restore();

  if (guide) {
    target.save();
    target.globalAlpha = 0.16;
    target.globalCompositeOperation = "source-atop";
    target.drawImage(template, 0, 0, outputSize, outputSize);
    target.restore();
  }
}

function render() {
  if (!template.complete) return;
  renderDesign(canvas, SIZE, state.showGuide);
  updateLayerUI();
}

function updateLayerUI() {
  els.layerList.innerHTML = "";
  els.layerCount.textContent = state.layers.length;
  els.emptyLayers.hidden = state.layers.length > 0;

  [...state.layers].reverse().forEach(layer => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `layer-item${layer.id === state.selectedId ? " selected" : ""}`;
    const thumb = document.createElement("span");
    thumb.className = "layer-thumb";
    if (layer.type === "image") {
      const image = document.createElement("img");
      image.src = layer.src;
      image.alt = "";
      thumb.appendChild(image);
    } else {
      thumb.textContent = "T";
    }
    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layer.name;
    button.append(thumb, name);
    button.addEventListener("click", () => selectLayer(layer.id));
    els.layerList.appendChild(button);
  });

  const layer = selectedLayer();
  els.transformControls.hidden = !layer;
  if (layer) {
    els.scale.value = Math.round(layer.scale * 100);
    els.scaleValue.textContent = `${Math.round(layer.scale * 100)}%`;
    els.rotation.value = layer.rotation;
    els.rotationValue.textContent = `${Math.round(layer.rotation)}°`;
    els.opacity.value = Math.round(layer.opacity * 100);
    els.opacityValue.textContent = `${Math.round(layer.opacity * 100)}%`;
  }
}

function selectLayer(id) {
  state.selectedId = id;
  render();
}

function addImageFile(file) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const longest = Math.max(image.naturalWidth, image.naturalHeight);
      const fit = 760 / longest;
      const layer = {
        id: uid(), type: "image", name: file.name.replace(/\.[^.]+$/, ""), src: reader.result,
        image, width: image.naturalWidth, height: image.naturalHeight, x: 512, y: 512,
        scale: fit, rotation: 0, opacity: 1,
      };
      state.layers.push(layer);
      state.selectedId = layer.id;
      render();
      toast(`${layer.name} added — drag it on the wrap.`);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function addTextLayer() {
  const text = els.textInput.value.trim();
  if (!text) return;
  const layer = {
    id: uid(), type: "text", name: text, text, color: state.accentColor,
    fontSize: 118, x: 512, y: 512, scale: 1, rotation: 0, opacity: 1,
  };
  state.layers.push(layer);
  state.selectedId = layer.id;
  els.textInput.value = "";
  render();
}

function fitSelected() {
  const layer = selectedLayer();
  if (!layer) return;
  layer.x = 512;
  layer.y = 512;
  layer.rotation = 0;
  layer.scale = layer.type === "image" ? 760 / Math.max(layer.width, layer.height) : 1;
  render();
}

function duplicateSelected() {
  const layer = selectedLayer();
  if (!layer) return;
  const copy = { ...layer, id: uid(), name: `${layer.name} copy`, x: layer.x + 35, y: layer.y + 35 };
  state.layers.push(copy);
  state.selectedId = copy.id;
  render();
}

function deleteSelected() {
  const index = state.layers.findIndex(layer => layer.id === state.selectedId);
  if (index < 0) return;
  state.layers.splice(index, 1);
  state.selectedId = state.layers.at(-1)?.id || null;
  render();
}

function safeStem() {
  return els.fileName.value.replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 26) || "Family_Wrap";
}

function canvasBlob(targetCanvas) {
  return new Promise(resolve => targetCanvas.toBlob(resolve, "image/png"));
}

async function buildExport() {
  for (const outputSize of [1024, 768, 512]) {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outputSize;
    exportCanvas.height = outputSize;
    renderDesign(exportCanvas, outputSize, false);
    const blob = await canvasBlob(exportCanvas);
    if (blob && blob.size <= MAX_BYTES) return { blob, outputSize };
  }
  return null;
}

async function exportWrap() {
  els.exportButton.disabled = true;
  els.exportButton.textContent = "Preparing PNG…";
  const result = await buildExport();
  els.exportButton.disabled = false;
  els.exportButton.textContent = "Download Tesla PNG";

  if (!result) {
    setValidationError("Artwork is still over 1 MB at 512×512. Try a simpler image or pattern.");
    return;
  }

  const fileName = `${safeStem()}.png`;
  els.fileName.value = safeStem();
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  setValidationSuccess(result.outputSize, result.blob.size, fileName);
  toast(`${fileName} is ready for your Tesla.`);
}

function setValidationSuccess(size, bytes, fileName) {
  els.validation.innerHTML = `
    <div><span>✓</span> PNG format with transparent panel mask</div>
    <div><span>✓</span> ${size}×${size} pixels</div>
    <div><span>✓</span> ${formatBytes(bytes)} — under 1 MB</div>
    <div><span>✓</span> ${fileName.length} characters — Tesla-safe name</div>`;
}

function setValidationError(message) {
  els.validation.innerHTML = `<div class="error"><span>!</span> ${message}</div>`;
  toast(message);
}

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`;
}

function serializableState() {
  return {
    version: 1,
    vehicle: "modely-2025-premium",
    baseColor: state.baseColor,
    accentColor: state.accentColor,
    pattern: state.pattern,
    layers: state.layers.map(({ image, ...layer }) => layer),
  };
}

function saveProject() {
  const blob = new Blob([JSON.stringify(serializableState(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeStem()}.wrap-project.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function loadProject(file) {
  try {
    const project = JSON.parse(await file.text());
    if (project.version !== 1 || project.vehicle !== "modely-2025-premium" || !Array.isArray(project.layers)) {
      throw new Error("This is not a Model Y Premium Wrap Studio project.");
    }
    state.baseColor = project.baseColor;
    state.accentColor = project.accentColor;
    state.pattern = project.pattern;
    els.baseColor.value = state.baseColor;
    els.accentColor.value = state.accentColor;
    els.pattern.value = state.pattern;
    state.layers = [];
    for (const saved of project.layers) {
      const layer = { ...saved };
      if (layer.type === "image") {
        layer.image = await loadImage(layer.src);
      }
      state.layers.push(layer);
    }
    state.selectedId = state.layers.at(-1)?.id || null;
    render();
    toast("Editable project opened.");
  } catch (error) {
    setValidationError(error.message || "That project could not be opened.");
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3000);
}

els.baseColor.addEventListener("input", event => { state.baseColor = event.target.value; render(); });
els.accentColor.addEventListener("input", event => { state.accentColor = event.target.value; render(); });
els.pattern.addEventListener("change", event => { state.pattern = event.target.value; render(); });
els.showGuide.addEventListener("change", event => { state.showGuide = event.target.checked; render(); });
els.artUpload.addEventListener("change", event => [...event.target.files].forEach(addImageFile));
els.addText.addEventListener("click", addTextLayer);
els.textInput.addEventListener("keydown", event => { if (event.key === "Enter") addTextLayer(); });
els.scale.addEventListener("input", event => { const layer = selectedLayer(); if (layer) { layer.scale = +event.target.value / 100; render(); } });
els.rotation.addEventListener("input", event => { const layer = selectedLayer(); if (layer) { layer.rotation = +event.target.value; render(); } });
els.opacity.addEventListener("input", event => { const layer = selectedLayer(); if (layer) { layer.opacity = +event.target.value / 100; render(); } });
els.fitLayer.addEventListener("click", fitSelected);
els.centerLayer.addEventListener("click", () => { const layer = selectedLayer(); if (layer) { layer.x = 512; layer.y = 512; render(); } });
els.duplicateLayer.addEventListener("click", duplicateSelected);
els.deleteLayer.addEventListener("click", deleteSelected);
els.exportButton.addEventListener("click", exportWrap);
els.saveProject.addEventListener("click", saveProject);
els.projectUpload.addEventListener("change", event => event.target.files[0] && loadProject(event.target.files[0]));

let drag = null;
canvas.addEventListener("pointerdown", event => {
  const layer = selectedLayer();
  if (!layer) return;
  const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * SIZE / rect.width;
  const py = (event.clientY - rect.top) * SIZE / rect.height;
  drag = { pointerId: event.pointerId, offsetX: px - layer.x, offsetY: py - layer.y };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const layer = selectedLayer();
  if (!layer) return;
  const rect = canvas.getBoundingClientRect();
  layer.x = Math.max(-256, Math.min(1280, (event.clientX - rect.left) * SIZE / rect.width - drag.offsetX));
  layer.y = Math.max(-256, Math.min(1280, (event.clientY - rect.top) * SIZE / rect.height - drag.offsetY));
  render();
});
function endDrag(event) {
  if (drag?.pointerId === event.pointerId) {
    drag = null;
    canvas.classList.remove("dragging");
  }
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

template.onload = render;
template.onerror = () => setValidationError("The official Tesla template could not be loaded.");
template.src = templateUrl;
