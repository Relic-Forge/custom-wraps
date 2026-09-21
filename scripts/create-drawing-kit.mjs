// Exact template-derived drawing aids; no generated geometry or decorative artwork.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { finishDrawing } from "./finish-drawing.mjs";
const root = path.resolve(import.meta.dirname, "..");
const out = path.resolve(
  process.argv[2] || path.join(root, "dist/model-y-drawing-kit"),
);
await fs.mkdir(out, { recursive: true });
const template = path.join(root, "modely-2025-premium/template.png");
const alpha = await sharp(template)
  .ensureAlpha()
  .extractChannel(3)
  .raw()
  .toBuffer();
const white = Buffer.alloc(1024 * 1024 * 3, 255);
const masked = await sharp(white, {
  raw: { width: 1024, height: 1024, channels: 3 },
})
  .joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } })
  .png()
  .toBuffer();
const canvas = await sharp(masked)
  .flatten({ background: "#d5dce7" })
  .png()
  .toBuffer();
await fs.writeFile(path.join(out, "ModelY_Draw_Here.png"), canvas, {
  flag: "wx",
});
await finishDrawing(canvas, "modely-2025-premium", out, "ModelY_Blank_Upload");
const guide = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1480">
<rect width="1200" height="1480" fill="#f3f6fb"/>
<g font-family="Arial, sans-serif" fill="#22314a">
<text x="60" y="67" font-size="38" font-weight="bold">Make your Model Y a masterpiece!</text>
<text x="60" y="112" font-size="24">Model Y Premium (2025+) - drawing guide, not the drawing file</text>
<text x="60" y="150" font-size="24">Draw on WHITE. Skip GRAY. Use ModelY_Draw_Here.png.</text>
<image x="88" y="180" width="1024" height="1024" href="data:image/png;base64,${canvas.toString("base64")}"/>
<g fill="#415ca6" text-anchor="middle" font-size="23" font-weight="bold">
<text x="600" y="379">HOOD</text><text x="600" y="411" font-size="19">Heads toward top</text>
<path d="M600 350v-28m-8 10 8-10 8 10" fill="none" stroke="#415ca6" stroke-width="3"/>
<g transform="translate(252 650) rotate(90)"><text y="0">LEFT SIDE</text><text y="29" font-size="19">Heads toward center</text><path d="M0 -25v-35m-8 10 8-10 8 10" fill="none" stroke="#415ca6" stroke-width="3"/></g>
<g transform="translate(944 650) rotate(-90)"><text y="0">RIGHT SIDE</text><text y="29" font-size="19">Heads toward center</text><path d="M0 -25v-35m-8 10 8-10 8 10" fill="none" stroke="#415ca6" stroke-width="3"/></g>
</g>
<text x="60" y="1260" font-size="25" font-weight="bold">A little trick for the sides</text>
<text x="60" y="1300" font-size="23">Turn your view while you draw. Keep the saved canvas in this position.</text>
<text x="60" y="1340" font-size="23">Keep faces inside one white shape. Small pieces are great for patterns.</text>
<text x="60" y="1380" font-size="23">Save the whole picture as PNG - no cropping, screenshots, or borders.</text>
<text x="60" y="1420" font-size="23">Send the finished picture back to your parent for the upload check.</text>
</g></svg>`;
await sharp(Buffer.from(guide))
  .png()
  .toFile(path.join(out, "ModelY_Drawing_Guide.png"));
console.log(out);
