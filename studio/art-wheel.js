export function mountArtWheel({
  stage,
  trigger,
  getSize,
  setSize,
  select,
  current,
}) {
  const items = [
    ["pencil", "Pencil", "✏️"],
    ["pen", "Pen", "🖊️"],
    ["marker", "Marker", "🖍️"],
    ["spray", "Spray", "⁙"],
    ["eraser", "Eraser", "▱"],
    ["pan", "Move", "✥"],
  ];
  const wheel = document.createElement("div");
  wheel.className = "art-wheel";
  wheel.hidden = true;
  wheel.setAttribute("role", "toolbar");
  wheel.setAttribute("aria-label", "Brush wheel");
  const center = document.createElement("button");
  center.className = "wheel-center";
  center.textContent = "Cancel";
  center.onclick = close;
  wheel.append(center);
  let active = -1,
    held = null,
    origin = null,
    moved = false,
    audio = null,
    lastSound = 0;
  let soundEnabled = false;
  try {
    soundEnabled = localStorage.getItem("wrap-selection-sound") === "on";
  } catch {}
  function sound(confirm = false) {
    if (!soundEnabled || performance.now() - lastSound < 65) return;
    lastSound = performance.now();
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(),
        gain = audio.createGain(),
        now = audio.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(confirm ? 740 : 520, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    } catch {}
  }
  const buttons = items.map(([id, label, icon], i) => {
    const button = document.createElement("button");
    button.className = "wheel-item";
    button.setAttribute("aria-label", label);
    const angle = ((i * 60 - 90) * Math.PI) / 180;
    button.style.left = `calc(50% + ${Math.cos(angle) * 86}px)`;
    button.style.top = `calc(50% + ${Math.sin(angle) * 86}px)`;
    button.innerHTML = `<span aria-hidden="true">${icon}</span><small>${label}</small>`;
    button.onclick = () => commit(i);
    wheel.append(button);
    return button;
  });
  const sizing = document.createElement("div");
  sizing.className = "wheel-sizing";
  const label = document.createElement("label");
  label.textContent = "Size";
  const readout = document.createElement("output");
  label.append(readout);
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.setAttribute("aria-label", "Wheel brush size");
  slider.oninput = () => {
    setSize(Math.round(1 + 79 * (Number(slider.value) / 100) ** 2));
    readout.textContent = ` ${getSize()} px`;
  };
  const soundButton = document.createElement("button");
  soundButton.className = "wheel-sound";
  soundButton.setAttribute("aria-label", "Selection sounds");
  function syncSound() {
    soundButton.textContent = soundEnabled ? "♪ Sound on" : "♪ Sound off";
    soundButton.setAttribute("aria-pressed", soundEnabled);
  }
  soundButton.onclick = () => {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem("wrap-selection-sound", soundEnabled ? "on" : "off");
    } catch {}
    syncSound();
    sound(true);
  };
  syncSound();
  sizing.append(label, slider, soundButton);
  wheel.append(sizing);
  document.body.append(wheel);
  function syncSize() {
    const size = getSize();
    slider.value = 100 * Math.sqrt((size - 1) / 79);
    readout.textContent = ` ${size} px`;
  }
  function highlight(index) {
    if (active !== index && index >= 0) sound();
    active = index;
    buttons.forEach((b, i) => b.classList.toggle("aimed", i === index));
    center.textContent = index < 0 ? "Cancel" : items[index][1];
  }
  function commit(index) {
    if (index >= 0) {
      select(items[index][0]);
      sound(true);
    }
    close();
  }
  function close() {
    held = null;
    origin = null;
    wheel.hidden = true;
    highlight(-1);
  }
  function open(x, y) {
    const width = 260,
      height = 390;
    const left = Math.max(8, Math.min(x - width / 2, innerWidth - width - 8));
    const top = Math.max(8, Math.min(y - 130, innerHeight - height - 8));
    wheel.style.left = left + "px";
    wheel.style.top = top + "px";
    wheel.hidden = false;
    highlight(-1);
    syncSize();
    buttons.forEach((b, i) =>
      b.setAttribute("aria-pressed", items[i][0] === current()),
    );
    origin = { x: left + 130, y: top + 130 };
    moved = false;
  }
  function begin(e, rail = false) {
    if (!rail && e.button !== 2) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const r = trigger.getBoundingClientRect();
    open(rail ? r.left - 140 : e.clientX, rail ? r.top + 90 : e.clientY);
    held = { id: e.pointerId, rail, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!held || held.id !== e.pointerId) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (Math.hypot(e.clientX - held.startX, e.clientY - held.startY) > 8)
      moved = true;
    if (!moved) return;
    const x = e.clientX - origin.x,
      y = e.clientY - origin.y;
    highlight(
      Math.hypot(x, y) < 32
        ? -1
        : Math.floor(
            (((Math.atan2(y, x) * 180) / Math.PI + 90 + 360 + 30) % 360) / 60,
          ),
    );
  }
  function end(e) {
    if (!held || held.id !== e.pointerId) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const tap = held.rail && !moved;
    held = null;
    if (tap) {
      center.focus();
      return;
    }
    commit(active);
  }
  stage.addEventListener("pointerdown", (e) => begin(e), true);
  trigger.addEventListener("pointerdown", (e) => begin(e, true), true);
  for (const el of [stage, trigger]) {
    el.addEventListener("pointermove", move, true);
    el.addEventListener("pointerup", end, true);
    el.addEventListener("pointercancel", close, true);
    el.addEventListener("lostpointercapture", (e) => {
      if (held?.id === e.pointerId) close();
    });
  }
  trigger.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.detail === 0) {
        const r = trigger.getBoundingClientRect();
        open(r.left - 140, r.top + 90);
        center.focus();
      }
    },
    true,
  );
  stage.addEventListener("contextmenu", (e) => e.preventDefault());
  function scroll(e) {
    if (wheel.hidden) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setSize(Math.max(1, Math.min(80, getSize() + (e.deltaY > 0 ? -1 : 1))));
    syncSize();
  }
  stage.addEventListener("wheel", scroll, { capture: true, passive: false });
  wheel.addEventListener("wheel", scroll, { passive: false });
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (
        !wheel.contains(e.target) &&
        !trigger.contains(e.target) &&
        e.button !== 2
      )
        close();
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  window.addEventListener("resize", close);
  window.addEventListener("blur", close);
  return { close };
}
