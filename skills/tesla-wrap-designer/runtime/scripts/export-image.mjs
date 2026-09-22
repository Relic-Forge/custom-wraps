import sharp from "sharp";
import { exportSizes, MAX_BYTES } from "../studio/core.js";

// Geometry is deterministic. AI supplies artwork, never template boundaries.
export async function exportImage(
  source,
  template,
  vehicle,
  { reduceColors = false } = {},
) {
  for (const [width, height] of exportSizes(vehicle.width, vehicle.height)) {
    const mask = await sharp(template)
      .resize(width, height, { fit: "fill" })
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer();
    const rgb = await sharp(source)
      .resize(width, height, { fit: "fill" })
      .toColourspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer();
    // Tesla marks paintable regions white and non-paintable regions black.
    // Alpha alone does not describe those opaque black gaps.
    const islands = await sharp(template)
      .resize(width, height, { fit: "fill" })
      .removeAlpha()
      .greyscale()
      .raw()
      .toBuffer();
    for (let i = 0; i < islands.length; i++)
      for (let c = 0; c < 3; c++)
        rgb[i * 3 + c] =
          mask[i] === 0 ? 0 : Math.round((rgb[i * 3 + c] * islands[i]) / 255);
    for (const colors of reduceColors ? [0, 256, 192, 128] : [0]) {
      let pixels = rgb;
      if (colors) {
        const indexed = await sharp(rgb, {
          raw: { width, height, channels: 3 },
        })
          .png({ palette: true, colours: colors, dither: 0 })
          .toBuffer();
        pixels = await sharp(indexed)
          .toColourspace("srgb")
          .removeAlpha()
          .raw()
          .toBuffer();
      }
      // Expand back to truecolor RGBA; palette conversion must not alter alpha.
      const png = await sharp(pixels, { raw: { width, height, channels: 3 } })
        .joinChannel(mask, { raw: { width, height, channels: 1 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      if (png.length <= MAX_BYTES)
        return { png, width, height, mask, colorReduction: colors || null };
    }
  }
  throw Error(
    "PNG exceeds 1 MB at minimum dimensions. Simplify artwork and retry.",
  );
}
