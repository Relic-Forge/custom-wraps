import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
// An original low-poly shape study, not a verified Tesla mesh.
// Each paint surface maps a conservative rectangle of one real template island.
export function createPreview(host, source, paint) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#21202a");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(6, 4, 7);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  controls.minDistance = 3;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.49;
  scene.add(new THREE.HemisphereLight(0xece5ff, 0x45404e, 2.3));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(4, 7, 4);
  scene.add(light);
  const car = new THREE.Group();
  scene.add(car);
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  const paintMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.47,
    metalness: 0.15,
    side: THREE.DoubleSide,
    transparent: false,
  });
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x7562dc,
    roughness: 0.5,
    metalness: 0.25,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x171e2b,
    roughness: 0.23,
    metalness: 0.5,
  });
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x141419,
    roughness: 0.8,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x949aaa,
    metalness: 0.8,
    roughness: 0.3,
  });
  let surfaces = [],
    painting = false,
    active = false,
    lastPanel = null;
  function box(w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    car.add(mesh);
    return mesh;
  }
  function quad(points, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points.flat(), 3),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    car.add(m);
    return m;
  }
  function body() {
    const vertices = [],
      indices = [];
    const rings = [
      [-2.19, 0.84, 0.98],
      [-1.75, 0.99, 1.08],
      [-0.7, 1, 1.1],
      [0.7, 1, 1.1],
      [1.6, 0.98, 1.1],
      [2.19, 0.8, 0.94],
    ];
    for (const [z, w, h] of rings)
      for (const [x, y] of [
        [-0.8, 0.39],
        [-0.99, 0.55],
        [-0.96, h],
        [0.96, h],
        [0.99, 0.55],
        [0.8, 0.39],
      ])
        vertices.push(x * w, y, z);
    for (let r = 0; r < rings.length - 1; r++)
      for (let i = 0; i < 6; i++) {
        const a = r * 6 + i,
          b = r * 6 + ((i + 1) % 6),
          c = b + 6,
          d = a + 6;
        indices.push(a, b, c, a, c, d);
      }
    indices.push(
      0,
      2,
      1,
      0,
      3,
      2,
      0,
      4,
      3,
      0,
      5,
      4,
      30,
      31,
      32,
      30,
      32,
      33,
      30,
      33,
      34,
      30,
      34,
      35,
    );
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    car.add(new THREE.Mesh(g, shellMaterial));
  }
  function surface(points, p) {
    if (!p) return;
    const [x, y, w, h] = p.safe;
    let uv;
    // points: bottom-left, bottom-right, top-right, top-left as viewed outside.
    if (p.rotation === 90)
      uv = [
        [x, y + h],
        [x, y],
        [x + w, y],
        [x + w, y + h],
      ];
    else if (p.rotation === -90)
      uv = [
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
        [x, y],
      ];
    else
      uv = [
        [x, y + h],
        [x + w, y + h],
        [x + w, y],
        [x, y],
      ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points.flat(), 3),
    );
    geo.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        uv.flatMap(([a, b]) => [a / 1024, 1 - b / 1024]),
        2,
      ),
    );
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, paintMaterial);
    mesh.userData.panel = p.id;
    car.add(mesh);
    surfaces.push(mesh);
  }
  function setVehicle(v) {
    for (const child of [...car.children]) {
      child.geometry?.dispose();
      car.remove(child);
    }
    surfaces = [];
    active = false;
    lastPanel = null;
    painting = false;
    controls.enabled = true;
    const truck = v.id === "cybertruck",
      sedan = /model[3s]/.test(v.id),
      roof = truck ? 1.65 : sedan ? 1.5 : 1.72;
    body();
    glass.side = THREE.DoubleSide;
    quad(
      [
        [-0.84, 1.11, 1.11],
        [0.84, 1.11, 1.11],
        [0.7, roof, 0.42],
        [-0.7, roof, 0.42],
      ],
      glass,
    );
    quad(
      [
        [0.84, 1.11, -1.55],
        [-0.84, 1.11, -1.55],
        [-0.7, roof, -0.7],
        [0.7, roof, -0.7],
      ],
      glass,
    );
    quad(
      [
        [-0.7, roof, 0.42],
        [0.7, roof, 0.42],
        [0.7, roof, -0.7],
        [-0.7, roof, -0.7],
      ],
      glass,
    );
    for (const s of [-1, 1]) {
      quad(
        [
          [s * 0.85, 1.12, -1.48],
          [s * 0.85, 1.12, 1.08],
          [s * 0.71, roof - 0.035, 0.39],
          [s * 0.71, roof - 0.035, -0.69],
        ],
        glass,
      );
      box(0.04, 0.45, 0.055, s * 0.79, 1.32, -0.18, shellMaterial);
      const mirror = box(0.19, 0.11, 0.23, s * 1.01, 1.16, 0.92, shellMaterial);
      mirror.rotation.y = s * 0.2;
    }
    for (const x of [-0.99, 0.99])
      for (const z of [-1.42, 1.42]) {
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.39, 0.39, 0.22, 32),
          wheelMaterial,
        );
        tire.rotation.z = Math.PI / 2;
        tire.position.set(x, 0.4, z);
        car.add(tire);
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.245, 0.245, 0.235, 12),
          rimMaterial,
        );
        rim.rotation.z = Math.PI / 2;
        rim.position.copy(tire.position);
        car.add(rim);
      }
    box(
      1.5,
      0.045,
      0.04,
      0,
      0.87,
      2.2,
      new THREE.MeshBasicMaterial({ color: 0xd9f3ff }),
    );
    box(
      1.5,
      0.045,
      0.04,
      0,
      0.89,
      -2.2,
      new THREE.MeshBasicMaterial({ color: 0xff4c60 }),
    );
    if (v.preview !== "unmapped") {
      const hood = v.panels.find((p) => p.role === "hood");
      surface(
        [
          [-0.82, 1.03, 2.05],
          [0.82, 1.03, 2.05],
          [0.88, 1.13, 1.1],
          [-0.88, 1.13, 1.1],
        ],
        hood,
      );
      const rear = v.panels.find((p) => p.role === "rear");
      surface(
        [
          [0.94, 0.48, -2.185],
          [-0.94, 0.48, -2.185],
          [-0.94, 1.02, -2.185],
          [0.94, 1.02, -2.185],
        ],
        rear,
      );
      const left = v.panels.filter((p) => p.role === "left").slice(0, 2),
        right = v.panels.filter((p) => p.role === "right").slice(0, 2);
      for (let i = 0; i < 2; i++) {
        const front = 1.27 - i * 1.22,
          back = front - 1.18;
        surface(
          [
            [-1.005, 0.43, back],
            [-1.005, 0.43, front],
            [-1.005, 1.095, front],
            [-1.005, 1.095, back],
          ],
          left[i],
        );
        surface(
          [
            [1.005, 0.43, front],
            [1.005, 0.43, back],
            [1.005, 1.095, back],
            [1.005, 1.095, front],
          ],
          right[i],
        );
      }
    }
    document.getElementById("paint3d").setAttribute("aria-pressed", "false");
    document.getElementById("previewNotice").textContent =
      v.preview === "unmapped"
        ? "View only · Draw in Flat."
        : "Placement unverified · Check in Flat.";
    update();
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.zoom = Math.min(1, (w / h) * 1.5);
    camera.updateProjectionMatrix();
  }
  function reset() {
    camera.position.set(6, 4, 7);
    controls.target.set(0, 0.85, 0);
    controls.update();
  }
  function update() {
    texture.needsUpdate = true;
  }
  const homeDistance = Math.hypot(6, 4 - 0.85, 7);
  function getZoom() {
    return Math.round(
      (homeDistance / camera.position.distanceTo(controls.target)) * 100,
    );
  }
  function zoomBy(factor) {
    const direction = camera.position.clone().sub(controls.target);
    direction.setLength(
      THREE.MathUtils.clamp(
        direction.length() / factor,
        controls.minDistance,
        controls.maxDistance,
      ),
    );
    camera.position.copy(controls.target).add(direction);
    controls.update();
    paint.viewChanged?.();
  }
  controls.addEventListener("change", () => paint.viewChanged?.());
  const ray = new THREE.Raycaster();
  function at(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        1 - ((e.clientY - r.top) / r.height) * 2,
      ),
      camera,
    );
    // Respect glass/body occlusion: never paint a far-side patch through windows.
    const hit = ray.intersectObjects(car.children, true)[0];
    return hit && surfaces.includes(hit.object)
      ? {
          x: hit.uv.x * 1024,
          y: (1 - hit.uv.y) * 1024,
          id: hit.object.userData.panel,
        }
      : null;
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (!painting || active || e.button !== 0) return;
    const p = at(e);
    if (p) {
      active = paint.start(p, e) !== false;
      if (!active) return;
      lastPanel = p.id;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!active) return;
    const p = at(e);
    if (!p || p.id !== lastPanel) {
      paint.end();
      active = false;
      return;
    }
    paint.move(p, e);
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    renderer.domElement.addEventListener(event, () => {
      if (active) paint.end();
      active = false;
    });
  new ResizeObserver(resize).observe(host);
  renderer.setAnimationLoop(() => {
    if (!host.clientWidth || !host.clientHeight) return;
    controls.update();
    renderer.render(scene, camera);
  });
  resize();
  return {
    setVehicle,
    resize,
    reset,
    update,
    zoomBy,
    getZoom,
    setPainting(value) {
      if (painting && !value && active) {
        paint.end();
        active = false;
      }
      painting = value;
      controls.enabled = !value;
    },
  };
}
