---
name: tesla-wrap-designer
description: Turn a child's imagined scene, photos, drawings, or AI artwork into a panel-aware Tesla Paint Shop wrap and editable Wrap Studio project. Use for digital Tesla vehicle wraps, character placement, and template exports.
---

# Tesla Wrap Designer

Approach the vehicle as a professional automotive mural designer: translate the person's imagination into one cohesive, intentional whole-car design, not a collage fitted into a template. Judge success on the assembled car, not the flat sheet. This is the digital Tesla Paint Shop wrap workflow, not a production vinyl print/cut system.

## Start with the imagination

If the idea is missing, ask “What would you like to see on your car?” Accept a child's dictated description. Reuse known vehicle details; otherwise ask for model, year, and trim. Preserve meaningful details and reference characters. Keep questions short and make stylistic decisions on their behalf when the idea is already clear.

Resolve all package paths relative to this `SKILL.md`, never a specific user's home directory, repository checkout, or local server. This package includes 12 official template snapshots, panel metadata, and a standalone exporter under `runtime/`. Read `runtime/studio/vehicles.json` for supported IDs, panel bounds, safe rectangles, rotations, and verification state. Ask for the user's own vehicle; do not assume a default owner or car. For example, a 2026 Model Y Premium uses `modely-2025-premium`.

Read [runtime and distribution requirements](references/portability.md) before setup. The host needs file access and Node.js 22+ with the declared image-processing dependency; artwork generation additionally needs an image tool or user-supplied art. No GitHub account, desktop app, local editor, or private repository is required. If execution is unavailable, explain that verified export cannot be completed in that host; do not label an unvalidated generated image upload-ready.

## Compose for the car

Before generating or placing artwork, read [the art-direction standard](references/art-direction.md). Establish the intended story, whole-car hierarchy, and physical viewing directions. Apply its visual acceptance checks before delivery and fix obvious design errors without making the user direct corrective rotations.

- Choose focal points and supporting scenes that express the request. A hood hero, side scenes, and rear closing beat are options, not a mandatory formula. Carry a shared palette, visual language, and narrative around the car without overcrowding every panel.
- Generate upright panel scenes or separate transparent full-body character cutouts using the available image-generation workflow. Ask for complete silhouettes, room around limbs, clear faces and few tiny details. Do not ask AI to redraw the Tesla template geometry.
- Treat directional scenery and subjects as one physical scene: clouds above the horizon, vegetation growing up, feet meeting the intended ground, and consistent gravity, perspective, and lighting unless the user's concept deliberately changes those rules. An all-over background must be orientation-neutral; do not spread one upright landscape across the flat template and rotate only its characters.
- Inspect cutouts and their alpha. Trim transparent padding before placement. A giant face hidden by window gaps is a failed composition even if the PNG passes technical checks.
- Use a panel's largest safe rectangle to fit the complete rotated silhouette with a margin, then judge its visual placement; geometric fit alone is not art direction. The official alpha mask defines paintable islands; empty regions are windows or gaps and are never essential parts of the composition.
- On the tested Model Y Premium layout, left-side upright scenes rotate +90° in the flat file; right-side upright scenes rotate -90°. They look sideways on the sheet and upright on the vehicle. Hood art stays at 0°. Apply the same transform to every directional element within each scene. Other catalog orientations are provisional heuristics; inspect the template and examples, and disclose the need for an in-car check. Cybertruck has a distinct layout; do not reuse the sedan orientation assumption.
- Keep text readable and deterministic; use editor text layers for names and titles. Avoid mirroring lettering. For panel focus the editor rotates the viewing canvas so the artist can draw upright while export remains correctly oriented.

## Reliable delivery

Read [the recipe guide](references/recipe.md), then use the bundled `runtime/scripts/compose-wrap.mjs`. It creates the exact masked PNG, an editable project with embedded artwork, and a validation report. For a drawing already placed on the flat template, use `runtime/scripts/finish-drawing.mjs` instead; it restores the official mask without treating the drawing as a new panel subject.

Create recipes and assets inside a user-selected or writable task output directory, outside the installed skill. Preserve prior versions. The exporter checks the file it actually wrote: PNG decoding, dimensions, native aspect, byte limit, filename, color/alpha format, and exact official mask. Deliver a passing `.validation.json` report tied to the final PNG's SHA-256. Rerun `runtime/scripts/validate-wrap.mjs` after any edit, rename, or conversion. Never call a failed or unexecuted check verified. Technical success does not validate character likeness, physical orientation, or acceptance by a particular vehicle: complete the visual acceptance pass separately.

Show the final PNG and provide its editable `.wrap-project.json` companion when composed from layers. An existing Wrap Studio installation is optional for editing this companion; it is not included or needed for exporting. If that editor's 3D preview is used, describe its limitation: it is an original simplified shape study, with conservative hood/door/rear patches, not Tesla's official mesh. Do not claim perfect 3D placement or verified orientations for every model. Give the current transfer instructions in the recipe guide. Files are for a parent to import to Tesla; only transfer or publish when requested.

## Available surfaces

This is a portable skill package, not a standalone mobile app or a marketplace submission. A compatible skill host can load it; another assistant can follow the instructions only if it can also access and run the bundled files. Uploading instructions alone does not install executable tools or create a native ChatGPT integration. Store-specific packaging, runtime support, licensing review, and approval remain separate release work. Do not promise universal store compatibility.
