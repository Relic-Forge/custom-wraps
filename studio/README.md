# Relic Forge Wrap Studio — local family lab

A browser art editor and companion AI design skill for Tesla's digital Paint Shop wraps. All 12 templates in the repository are available. This creates digital vehicle artwork, not physical vinyl print/cut files.

## Run locally

Double-click `start-wrap-studio.command`. It installs locked dependencies if needed, prepares local Three.js assets, and opens http://localhost:4173/studio/. No cloud service or API key is required.

```sh
npm ci
npm run prepare:studio
python3 -m http.server 4173 --bind 127.0.0.1
```

Serve the repository root because template paths reference the sibling vehicle folders. All runtime dependencies are local; the editor does not call a CDN. The generated `studio/vendor` folder is rebuilt from pinned npm dependencies. No deployment has been configured or performed.

## Editor

- Photos, text, patterns, and editable freehand strokes; pressure-sensitive pointer drawing and an ink eraser.
- 4K working canvas with vector stroke storage, zoom to 24×, pan, and upright panel focus.
- Layer selection, drag, scale, quarter turns, mirror, opacity, brightness, saturation, ordering, visibility, locking, duplication, and deletion.
- Largest safe rectangles calculated from official template paint islands. Fitting uses panel orientation and preserves a margin around the subject.
- Undo/redo and local IndexedDB recovery per vehicle, plus portable JSON project save/open. One recovery draft per vehicle; save separate project files for the children.
- Top-down, split view, and rotatable Three.js shape preview. Raycast drawing on mapped 3D patches feeds the same editable ink stack.
- Exact-mask PNG export, sanitized filenames, conservative 1,000,000-byte maximum, native template aspect ratio, and smaller valid output sizes when necessary.
- Editable BFDI sample with separate Flower, Bubble, X, Grassy and title layers. Black Hole is part of the sample background.

The 3D preview is an **approximate composition study**. Tesla's repository contains PNG templates, not meshes. It uses an original low-poly body with safe-area hood/door/rear mappings, not a Tesla model. Cybertruck mapping is explicitly unavailable. Do not use it as evidence that every model's orientation or geometry is exact. See [the family test guide](FAMILY-TEST.md) for release gates.

## AI design skill

Source: `skills/tesla-wrap-designer/SKILL.md`. Installed locally through a link at `~/.codex/skills/tesla-wrap-designer`. Restart/open a new Codex task if needed for discovery. Invoke `$tesla-wrap-designer` with a vehicle and idea. The editor's **Copy AI design brief** button prepares that prompt.

The skill creates separate cutouts and a recipe, then uses the shared export helper:

```sh
node scripts/compose-wrap.mjs /absolute/path/recipe.json /absolute/path/output
```

It returns a PNG, editable project, and validation report. See `skills/tesla-wrap-designer/references/recipe.md`. Installing a Codex skill does not install a native ChatGPT integration; a ChatGPT-facing package is future work.

## Validation

```sh
npm test
npm audit
```

Tests cover every official template, safe-rectangle containment, rotated subject fitting, filename/project checks, export aspect ratios, and end-to-end CLI composition with pixel-exact alpha and reopenable project data.

Browser checks on 2026-09-20: editable BFDI sample; drawing/eraser undo and redo; upright panel focus; photo import; JSON save/reopen; local recovery; all 12 vehicle choices; live text editing; 3D hood drawing appearing on the flat template; PNG downloads. Downloaded Model Y (1024×1024) and Cybertruck (1024×768) alpha channels were compared byte-for-byte with official templates and matched. Tablet stylus pressure, palm rejection, Safari and real-device family testing are not yet verified.

Open `?test=1` to use a separate recovery database for development tests. Do not test by overwriting a child's live draft.

## Sources and future deployment

Templates and format constraints: repository root README and each Tesla vehicle folder. Preview uses [Three.js CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), and [Raycaster](https://threejs.org/docs/pages/Raycaster.html). The Three.js license is copied with the local vendor files.

The app is static HTML/CSS/modules and can later be packaged for Cloudflare static hosting. Before publication: agree on licensing and distribution of demo character artwork, acquire verified vehicle meshes and mappings, complete all-car orientation calibration, test mobile/touch/accessibility, and choose the ChatGPT-facing AI integration. No cloud account, deployment, telemetry, photo upload service, or paid generation backend was added.
