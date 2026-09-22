# Public skill readiness — 2026-09-22

Status: release candidate for controlled testing, not approved for unrestricted public distribution.

## Scope

Portable `skills/tesla-wrap-designer/` runs without this editor, GitHub credentials, personal paths or an iCloud account. Host must provide Node 22+, file execution, dependency installation and an image generator (or supplied artwork). This is a digital Tesla visualization workflow, not production vinyl cutting or Tesla-certified placement.

## Release gates

- Technical: all repository tests, independent fresh-install exports for all 12 templates, symlinked CLI validation, invalid-input rejection, preview generation and exact alpha checks must pass.
- Visual: inspect final outputs at thumbnail/detail scale, check real transparency, subject identities, exact logos, physical directions and integrated edges. File tests cannot certify art quality.
- Vehicle: Model Y Premium side mappings have project-level checks; hood 180-degree correction is owner-reported and remains unverified in-car. Rear and other models need vehicle-view calibration. Do not advertise universal orientation accuracy.
- Rights: upstream currently has no detected license (GitHub API `license: null`, 2026-09-22). Tesla provides templates for creating wraps, but bundled redistribution clearance is unresolved. Choose a license for our original code/instructions and resolve third-party template rights before a public skill release. Do not silently assign a license to Tesla assets.
- Packaging: exclude node_modules, output/, customer artwork, local paths, credentials and generated celebrity assets. Publish a reviewed allowlisted package only, not the whole working folder. No marketplace submission has been made.

## Maintainer checks

Verified locally on 2026-09-22: all 14 automated tests passed; a relocated skill with a fresh `npm ci` exported all 12 vehicle templates and finalized a freehand drawing without the source repository. Skill frontmatter validation and `git diff --check` passed. Regression coverage includes corrected hood rotation, opaque-cutout rejection, exact final-file panel crops, symlinked CLI success/failure, native-resolution color reduction and preserved template alpha. These results establish technical portability, not generative-art quality or in-car calibration. CI repeats repository and relocated-package tests on pushes and pull requests.

Run `node scripts/bundle-skill.mjs`, `npm test`, `node scripts/test-skill-standalone.mjs`, and the skill-creator frontmatter validator. Test CLI invocation through both direct and symlinked package paths. Review the generated panel-preview index for unverified mappings.

Official format source: https://github.com/teslamotors/custom-wraps — checked 2026-09-22: PNG, 512–1024 dimensions, max 1 MB, filename max 30 characters. Mobile app 4.59.0+: Creations → Wrap → Upload. Requirements are distinct from the stricter internal exact-mask/truecolor contract.
