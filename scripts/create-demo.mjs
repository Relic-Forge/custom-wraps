import fs from "node:fs/promises";
import sharp from "sharp";
const root = new URL("../", import.meta.url),
  data = async (p) =>
    "data:image/png;base64," +
    (await fs.readFile(new URL(p, root))).toString("base64");
const layers = [];
const background = "studio/artwork/generated/bfdi-upright-background.png";
layers.push({
  id: "background",
  type: "image",
  name: "Dream Island sky",
  src: await data(background),
  width: 1024,
  height: 1024,
  x: 512,
  y: 512,
  scale: 1,
  rotation: 0,
  opacity: 1,
  locked: true,
});
for (const [id, rotation, w, h, x, y] of [
  ["flower", 90, 150, 105, 90, 410],
  ["bubble", -90, 140, 140, 785, 390],
  ["x", -90, 118, 154, 805, 610],
  ["grassy", 90, 140, 105, 84, 590],
]) {
  const buf = await sharp(
    new URL(
      `../studio/artwork/generated/bfdi-${id}-cutout.png`,
      import.meta.url,
    ).pathname,
  )
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const m = await sharp(buf).metadata(),
    scale = Math.min(w / m.height, h / m.width),
    rw = m.height * scale,
    rh = m.width * scale;
  layers.push({
    id,
    type: "image",
    name: id[0].toUpperCase() + id.slice(1),
    src: "data:image/png;base64," + buf.toString("base64"),
    width: m.width,
    height: m.height,
    x: x + rw / 2,
    y: y + rh / 2,
    scale,
    rotation,
    opacity: 1,
  });
}
layers.push({
  id: "tpot",
  type: "text",
  name: "TPOT rear title",
  text: "TPOT",
  fontSize: 48,
  color: "#62de59",
  x: 512,
  y: 978,
  scale: 0.85,
  rotation: 0,
  opacity: 1,
});
await fs.writeFile(
  new URL("studio/artwork/bfdi-demo.wrap-project.json", root),
  JSON.stringify({
    version: 2,
    vehicle: "modely-2025-premium",
    baseColor: "#6dd3f5",
    accentColor: "#ffdb67",
    pattern: "solid",
    layers,
  }),
);
console.log("Created editable BFDI starter.");
