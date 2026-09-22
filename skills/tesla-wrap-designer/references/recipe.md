# Recipe and export

Resolve the package root from `SKILL.md`. Run `npm ci` inside its `runtime/` directory once to install the pinned dependency. Run the commands below from that directory, or use absolute paths resolved from the package location. All templates and catalog data are already bundled; no repository clone or catalog generation is needed.

Read panel IDs or labels from `studio/vehicles.json`; do not invent IDs. The exporter uses precomputed safe rectangles from the template's white paintable islands. Preserving alpha alone is not proof of correct placement. A rectangle with 88% fit leaves breathing room.

Example (asset paths resolve relative to the recipe file):

```json
{
  "vehicle": "modely-2025-premium",
  "name": "Space_Cats",
  "baseColor": "#30205e",
  "background": "star-background.png",
  "artwork": [
    { "file": "astronaut.png", "name": "Moon explorer", "panel": "Hood" },
    { "file": "cat.png", "name": "Rainbow cat", "panel": "Left side 1" }
  ]
}
```

`background` is optional. Use an orientation-neutral full texture here, such as abstract color or scattered star points, not a directional sky/ground scene or a template-shaped image with opaque windows. Place directional scenery as upright per-panel artwork, with the same export transform as its subjects. A scene asset can group its environment and characters for consistent rotation; preserve separate source assets for later edits. Each cutout should have transparent padding and a complete subject. `rotation` optionally overrides panel rotation (0, 90, -90, 180). Do not override from intuition alone for unfamiliar templates.

The helper safe-fits artwork to rectangles; it does not art-direct scenes, provide arbitrary panel-edge bleed, or guarantee seamless cross-panel landscapes. Inspect its result and refine the editable project when needed. Keep the design brief and placement/orientation map in companion notes, not unsupported recipe fields. Follow the [art-direction acceptance pass](art-direction.md) after export.

For subject images add `kind: "cutout"` to reject fully opaque rectangles. Omit it for an intentional scene/background. At most 100 artwork assets are allowed. Assets are local files relative to the recipe, never automatically downloaded.

Optional `reduceColors: true` tries 256, 192 and 128-color artwork reduction before shrinking resolution, then expands to truecolor RGBA with exact template alpha. The report records `colorReduction`; inspect faces and gradients for banding. Default is lossless color with resolution fallback. The embedded project preserves original asset colors.

The compositor also writes a `.previews` directory with upright occupied-panel crops and an evidence index. Inspect every crop. Counter-rotation is not independent verification of vehicle mapping. Use a fresh output name/directory; existing outputs are not overwritten.

```sh
node scripts/compose-wrap.mjs /absolute/path/recipe.json /absolute/path/output
```

Output: PNG, `.wrap-project.json`, `.validation.json`. PNG uses a 1024-pixel width where possible and smaller sizes only if needed to stay below a conservative 1,000,000-byte limit. Preserve native aspect ratio: Cybertruck is 1024×768; the other current templates are 1024×1024. Both dimensions remain between 512 and 1024 at every fallback size. Alpha is copied from the selected template at that output size. Truecolor PNG is retained; excessive complexity fails rather than silently emitting an oversized file. Name including `.png` is at most 30 characters.

The report must have `passed: true`, all `checks` true, `alphaDifferences: 0`, and a SHA-256 identifying the delivered file. To check a final file independently:

```sh
node scripts/validate-wrap.mjs /absolute/path/My_Wrap.png modely-2025-premium
```

For a child's drawing on the full flat canvas, preserve the canvas frame and orientation. Do not crop, add borders, or rotate the saved image. The child may rotate their drawing app's view while drawing. The finished source can be larger than the export size or have flattened gaps; finalize it with:

```sh
node scripts/finish-drawing.mjs /absolute/path/drawing.png modely-2025-premium /absolute/path/output My_Drawing
```

This removes gap artwork using the official mask, converts to sRGB PNG, resizes proportionally, and validates the file. It cannot repair misaligned/cropped artwork or remove guide labels painted into a body panel. A mismatched aspect ratio is rejected, not stretched. It produces a PNG and validation report, not reconstructed editable layers. Preserve the original drawing separately.

Tesla's published requirements were checked on 2026-09-20 against [the official repository](https://github.com/teslamotors/custom-wraps#requirements--setup). Transfer using Tesla mobile app 4.59.0+ → Creations → Wrap → Upload, or a `Wraps` folder on a supported USB drive; apply in Toybox → Paint Shop → Wraps. Verify current instructions if the user reports a changed interface or before updating the packaged format contract. File-format validation does not test account, app, firmware, or vehicle compatibility.

The editor accepts versions 1–3 with `vehicle`, `baseColor`, `accentColor`, `pattern`, `layers`. The compositor produces version 2 image/text projects; the editor upgrades them on load. Image layers contain embedded PNG data URLs, intrinsic width/height, x/y center, scale, degree rotation, and opacity. Text layers have `text`, `fontSize`, `color` and transforms. Version 3 paint layers have `type: "paint"`, `strokes`, opacity, visibility, lock and name; their transforms remain x/y 0, scale 1, rotation 0. Each stroke has `type: "stroke"`, `points` of [x,y,pressure], `size`, `color`, `erase`, opacity and transforms. Erasing is isolated to that paint layer. Legacy top-level strokes migrate together into one paint layer above image/text layers to preserve the old appearance.

Use the helper's editable output rather than flattening the entire design into one image layer. Keep the source cutouts and recipe so later character replacements need only a local revision.
