# Recipe and export

From the `custom-wraps` repository, run `npm install` and `npm run prepare:studio` if dependencies/catalog are missing.

Read panel IDs or labels from `studio/vehicles.json`; do not invent IDs. The generator derives safe rectangles from the alpha channel, not guessed bounding boxes. A rectangle with 88% fit leaves breathing room.

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

`background` is optional. Use a full texture here, not a template-shaped image with opaque windows. Each artwork file should have transparent padding and a complete subject. `rotation` optionally overrides panel rotation (0, 90, -90, 180). Do not override from intuition alone for unfamiliar templates.

```sh
node scripts/compose-wrap.mjs /absolute/path/recipe.json /absolute/path/output
```

Output: PNG, `.wrap-project.json`, `.validation.json`. PNG uses a 1024-pixel width where possible and smaller sizes only if needed to stay below a conservative 1,000,000-byte limit. Preserve native aspect ratio: Cybertruck is 1024×768; the other current templates are 1024×1024. Both dimensions remain between 512 and 1024 at every fallback size. Alpha is copied from the selected template at that output size. Truecolor PNG is retained; excessive complexity fails rather than silently emitting an oversized file. Name including `.png` is at most 30 characters.

The editor accepts version 2 projects with `vehicle`, `baseColor`, `accentColor`, `pattern`, `layers`. Image layers contain embedded PNG data URLs, intrinsic width/height, x/y center, scale, degree rotation, and opacity. Text layers have `text`, `fontSize`, `color` and transforms. Drawing layers have `points` of [x,y,pressure], `size`, `color` and `erase`; drawing remains in its own erasable stack above photo/text layers.

Use the helper's editable output rather than flattening the entire design into one image layer. Keep the source cutouts and recipe so later character replacements need only a local revision.
