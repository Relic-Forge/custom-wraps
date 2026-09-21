# Whole-car art direction

Use this standard when creating or revising a wrap. The customer supplies the imagination; the designer owns composition, orientation, and visual coherence. Do not make a child troubleshoot the template.

## Translate intent into a design

Extract the emotional tone, main subjects, their relationships or action, and meaningful details from the request and references. Distinguish essentials from creative choices you can make. Preserve recognizable character traits, requested accessories, and the original idea through revisions. Ask only when an unresolved choice would materially change that idea.

Write a short working design brief: what the car should communicate, the primary focal point, the supporting story beats, and the palette/style. A story can be an atmosphere or pattern, not necessarily a literal sequence of characters. Avoid adding unrelated visual filler simply because a panel has room.

Compose in physical front, left, right, rear, and hood views before packing the flat texture. Each view should work on its own and belong to the same car. Use body lines, wheel arches, and panel proportions to guide flow; leave breathing room. Establish a readable hierarchy at car-viewing distance before adding close-up details. Avoid uniformly sized stickers scattered across every available island.

## Establish the physical frame

Keep a compact placement map alongside the recipe or working notes. For each occupied surface record:

- Intended vehicle view and viewing direction, including the hood's chosen reading direction.
- Local up, ground edge, and front/rear direction on the vehicle.
- Subject or scene, focal point, safe area, and relationship to neighboring surfaces.
- Export rotation and any reflection, with the evidence for the mapping and its verification status.

These are design notes, not additional fields to assume the recipe helper supports. Catalog rotations on unverified models are starting hypotheses, not proof. Use official examples or a verified mapped model when available. Upright panel crops help inspect composition but cannot establish an unknown mapping by themselves. The studio's simplified 3D shape is not proof of exact Tesla placement.

Design each directional scene upright in its intended vehicle view, then transform the complete scene into texture coordinates deterministically. Sky, ground, characters, shadows, motion, and lettering must agree on that frame. Do not ask the image generator repeatedly to rotate the whole template. Keep reusable foreground assets separate where practical; apply matching transforms to their environment.

Opposite sides require deliberate layouts, not blind mirroring: text, asymmetric accessories, handedness, light direction, and the subject's direction of travel may need different treatment. Use rotation for orientation; reflection is a separate creative decision.

## Make the scene believable

- Clouds and sky belong above their local horizon; trees and grass grow from their local ground. Rotate scenery with the scene, not independently from it.
- Standing characters have plausible footing and scale. Contact shadows belong at contact points; falling objects, rain, hanging objects, and smoke follow the scene's chosen physical rules.
- Share a coherent light source and perspective across connected scenes. Stylized artwork may simplify physics, but accidental contradictions are not a style.
- Respect intentional fantasy: floating islands or a zero-gravity scene may depart from ordinary physics when that serves the request. Make the exception visually purposeful, not an excuse for sideways subjects.
- Give faces, hands, signature accessories, and important words safe space away from window gaps, wheel openings, hard seams, and strong distortions. Backgrounds can bleed intentionally; essential features must remain legible.
- Continue colors, motifs, and narrative across views. Only promise exact cross-panel continuity where the mapping supports it; otherwise use an intentional visual transition instead of a visibly broken horizon.

For example, a meadow scene on a side panel is composed with flowers and characters standing on the same ground and clouds above them. Rotate that entire coordinate frame into the side island. Rotating the character while leaving the meadow upright on the flat sheet fails this standard.

## Designer's acceptance pass

Inspect the actual exported file, not only generated source art. Review normalized upright views of each occupied surface, the whole-car composition, and a mapped preview where available. Check both thumbnail scale (hierarchy and readability) and close detail (faces, seams, text, and masking).

Before calling the design ready, answer:

1. Does it express the person's original idea and preserve the details they cared about?
2. Does every physical view feel intentionally composed, with clear focal points and a shared visual language?
3. Are all directional elements upright in their intended view, including scenery, text, accessories, shadows, and motion cues?
4. Do grounding, gravity, scale, perspective, and lighting make sense within the intended world?
5. Do essential silhouettes and words survive the actual mask without relying on windows or missing regions?
6. Are there awkward tangencies, accidental crops, crowding, mirrored lettering, or broken scene transitions?
7. Which mapping checks are verified, and which still need an actual vehicle or authoritative model check?

Fix observable failures before presenting the result; do not transfer routine design QA to the user. Reinspect after corrections. If a mapping cannot be verified with available evidence, identify the affected surface and provide an explicitly unverified preview rather than claiming vehicle-ready orientation. Separate technical PNG validation from visual design acceptance. A valid file alone does not pass this standard.
