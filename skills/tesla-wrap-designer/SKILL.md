---
name: tesla-wrap-designer
description: Turn a child's imagined scene, photos, drawings, or AI artwork into a panel-aware Tesla Paint Shop wrap and editable Wrap Studio project. Use for digital Tesla vehicle wraps, character placement, and template exports.
---

# Tesla Wrap Designer

Create delight through clear character silhouettes and intentional placement on the car. This is the digital Tesla Paint Shop wrap workflow, not a production vinyl print/cut system.

## Start with the imagination

If the idea is missing, ask “What would you like to see on your car?” Accept a child's dictated description. Reuse known vehicle details; otherwise ask for model, year, and trim. Preserve meaningful details and reference characters. Keep questions short and make stylistic decisions on their behalf when the idea is already clear.

The repository normally lives at `/Users/jeffdarcy/Projects/custom-wraps`. Resolve it from current workspace or this skill's link if installed elsewhere. Read `studio/vehicles.json` for supported IDs, panel bounds, safe rectangles, rotations, and verification state. All 12 currently supplied Tesla templates are included. Use the exact trim; 2026 Model Y Premium uses `modely-2025-premium`.

## Compose for the car

- Propose a visual hierarchy: one hood subject, one or two characters per side, and a simple rear title. Adapt it to the user's idea instead of forcing that layout on patterns or landscapes.
- Generate a cohesive background and separate transparent full-body character cutouts using the available image-generation workflow. Ask for complete silhouettes, room around limbs, clear faces and few tiny details. Do not ask AI to redraw the Tesla template geometry.
- Inspect cutouts and their alpha. Trim transparent padding before placement. A giant face hidden by window gaps is a failed composition even if the PNG passes technical checks.
- Use a panel's largest safe rectangle to fit the complete rotated silhouette with a margin. The official alpha mask defines paintable islands; empty regions are windows or gaps and are never essential parts of the composition.
- On the tested Model Y Premium layout, left-side characters rotate +90° in the flat file; right-side characters rotate -90°. They look sideways on the sheet and upright on the vehicle. Hood art stays at 0°. Other catalog orientations are provisional heuristics; inspect the template and examples, and disclose the need for an in-car check. Cybertruck has a distinct layout; do not reuse the sedan orientation assumption.
- Keep text readable and deterministic; use editor text layers for names and titles. Avoid mirroring lettering. For panel focus the editor rotates the viewing canvas so the artist can draw upright while export remains correctly oriented.

## Reliable delivery

Read [the recipe guide](references/recipe.md), then use the repository's `scripts/compose-wrap.mjs`. It creates the exact masked PNG, an editable project with embedded artwork, and a validation report. It uses the shared panel catalog and safe-fit calculations used by the editor.

Create recipes and assets inside the project or task output directory. Preserve prior versions. The helper validates PNG dimensions and size, copies the official alpha exactly once, and uses a Tesla-safe filename. Technical success does not validate character likeness or physical orientation: inspect the final image separately and check that every subject is complete, correctly rotated, legible and visually balanced.

Show the final PNG and provide its editable `.wrap-project.json` companion. Open the project in the local editor when useful. Describe any actual limitation: the current 3D preview is an original simplified shape study, with conservative hood/door/rear patches, not Tesla's official mesh. Do not claim perfect 3D placement or verified orientations for every model. Files are for a parent to import to Tesla; only AirDrop or publish when requested.

## Available surfaces

This installed package is a Codex skill. ChatGPT can use the same instructions when the user supplies them and image/file tools are available, but do not claim installing this folder adds a native ChatGPT integration. The browser app copies a concise skill-ready brief; it does not call paid image APIs or upload family photos.
