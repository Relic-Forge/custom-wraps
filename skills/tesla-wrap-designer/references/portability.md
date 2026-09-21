# Runtime and distribution

This folder is the distributable unit. Keep `SKILL.md`, `references/`, and `runtime/` together. The runtime contains its own package manifest and lockfile, official template PNGs, vehicle catalog, composition/finalization helpers, and independent file checker. Paths resolve from the scripts, not the working directory. The embedded project output contains image data, not links to the original user's computer.

Requirements: a host with local file execution, Node.js 22 or newer, and permission to install the lockfile-pinned `sharp` dependency using `npm ci` in `runtime/`. Initial installation needs package-registry access; exporting afterward does not upload photos or call a service. AI image generation is supplied by the host, not secretly implemented by this package. If the installation directory is read-only, copy the package to a writable task directory before setup. Do not copy platform-specific `node_modules` into a distributable ZIP.

Use the caller's writable output directory and their chosen vehicle. No personal username, default owner, GitHub authentication, macOS feature, localhost address, or editor installation is required. Preserve existing output files by choosing a new name or directory.

The `runtime/manifest.json` records template provenance and SHA-256 checksums. Template data and interpretation are different: the templates are Tesla's; panel roles and orientations are this project's metadata. `orientationVerified` only reflects the project's recorded checks, not Tesla certification. Most mappings still require confirmation, and even Model Y Premium has unverified detail/rear panels.

The upstream template snapshot is from `teslamotors/custom-wraps`, revision `86c7d31454caf0f20af6f6af105f577643f13bce`. It was supplied for creating digital vehicle visualization wraps. No explicit license file was present in the checked snapshot; do not represent this bundle as cleared for public or commercial redistribution. Resolve template redistribution rights and the chosen store's packaging requirements before publication. This package does not assert Tesla affiliation or endorsement. It is not an Apple App Store app or an approved assistant-store listing.

Maintainers in the source repository can refresh the bundled runtime with `node scripts/bundle-skill.mjs`. The portable package itself does not need that repository or build step. After a refresh, test the package from an unrelated directory with a fresh dependency install and rerun the exporter and rejection tests.
