# Relic Forge Family Wrap Studio

A local, browser-based wrap editor configured for a **2026 Model Y Premium**, using Tesla's official `modely-2025-premium` UV template.

## Start it

Double-click `start-wrap-studio.command` at the repository root, or run:

```sh
python3 -m http.server 4173 --directory /Users/jeffdarcy/Projects/custom-wraps
```

Then open <http://localhost:4173/studio/>.

## Workflow

1. Choose a base color and optional pattern.
2. Add photos, scanned drawings, or AI-generated artwork.
3. Select a layer to resize, rotate, reposition, duplicate, or remove it.
4. Save an editable `.wrap-project.json` copy if you want to continue later.
5. Download the validated Tesla PNG.

The exporter uses the official transparent body-panel mask and automatically tries 1024, 768, and 512-pixel PNG output until the result fits Tesla's 1 MB limit.

This creates a wrap for Tesla's in-car 3D visualization. It is not a production file for cutting or printing a physical vinyl wrap.
