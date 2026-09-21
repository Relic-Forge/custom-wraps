# Exact vehicle preview: release requirement

Current product baseline: 2D only. The broken 3D path has been disconnected from
the editor; its safe-rectangle crops and unrelated patch proportions omit and
stretch artwork. Do not re-enable it under an experimental label.

A replacement may be independently constructed; Tesla's original mesh is not a
prerequisite. Faithful full-panel mapping is the prerequisite. A 2D template alone
does not uniquely specify the corresponding 3D surface geometry.

Checked 2026-09-20: Tesla's public custom-wraps tree contains PNG templates and
examples, but no GLB, glTF, OBJ, FBX, or Blender mesh. The community's request for
official mapping/model metadata remains open:
https://github.com/teslamotors/custom-wraps/issues/80

Required asset: the correct model/year/trim exterior mesh, UV coordinates matching
the official PNG atlas, separate glass/trim/wheel materials, and provenance and
permission suitable for the intended distribution. A visually similar commercial
model without Tesla-compatible UVs does not satisfy this requirement. An extracted
app asset is not automatically cleared for redistribution.

Acceptance before calling a vehicle exact:

- Compare silhouette, body lines, lights, wheels and trim against corresponding
  Tesla mobile and in-car views. Record software versions and reference captures;
  do not assume both renderers use identical assets or lighting.
- Use numbered, directional calibration art on every paintable island. Compare
  placement, rotation, scale, seams and distortion in our viewer and Tesla's app.
- Raycast only the nearest visible body surface. Glass, tires and trim occlude
  painting. Never connect texture strokes across unrelated UV islands.
- Both views edit one layer document and the same texture coordinates. A stroke
  drawn in either view survives view switching, undo/redo, reload and PNG export.
- Verify all body surfaces, not just hood/door/rear rectangles. Check seams,
  grazing angles, stylus input and orbit-versus-paint gesture separation.

Until full-panel coverage, orientation, scale and calibration checks pass, keep
the product 2D-only. Do not substitute safe rectangles for complete panel geometry.
Do not publish or purchase assets as part of a read-only model search.
