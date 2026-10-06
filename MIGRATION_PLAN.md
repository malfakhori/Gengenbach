# Gengenbach AR migration plan

## Audit baseline (2026-10-06)

Audited `D:\OneDrive\0_Projects\Gengenbach\Gengenbach\public` before application edits.

- The active app consists of `index.html`, `style.css`, and five classic scripts: `ar_start.js`, `ar_main.js`, `ar_overviewmap.js`, `ar_download.js`, and `ar_debug_console.js`.
- The tracked `public/new/` directory is deleted in the current working tree. `public/BK-Working/` is untracked and its seven files are byte-identical to the current active HTML/CSS/scripts. Both states are pre-existing user work and must remain untouched.
- There is no package manifest or bundler in the repository. The GitLab Pages config publishes `public/`; keep browser-native modules and no build system.
- Current runtime: Three.js r126 global scripts plus global `THREE.GLTFLoader`; Leaflet CSS/JS from unpinned unpkg URLs; OSM DE tiles; model URLs point to the existing HFT GitLab raw URLs; the reticle is loaded from the WebXR samples URL.
- `assets/models/` has seven GLTF model directories plus a separate street-lamp GLB, textures, plans, UI images/icons, and button audio. Each of the seven catalog GLTFs contains one skin and one animation; use `SkeletonUtils.clone()` for independent model copies. The catalog exposes seven named models (bench, trash bin, lantern, telephone box, hydrant, statue, fountain). Preserve the unlisted asset too.
- There are two predefined scene JSON files. Both use top-level `lat`, `lng`, and `models`; each model stores `name`, `position`, `rotation`, `scale`, `lat`, and `lng`. The importer identifies models by display name and rebuilds X/Z from geographic coordinates relative to the current GPS position.
- Existing behavior includes the start screen, upload and predefined-scene selection, AR start/exit/reload, hit testing/reticle, model placement/cache/selection/highlight/delete, rotation/scale/move controls, map with OSM tiles, model markers and georeferenced plan overlay, 500 ms map updates, scene download/upload, geolocation, button sounds, and the console/error/rejection debug panel.
- Coordinate conversion uses Earth radius 6,378,137 m and the current local tangent-plane equations. Preserve the equations, origin behavior, names, URLs, model defaults, HTML controls, styling, and scene schema.
- Current public inline/dynamic-handler API: `showMenu`, `selectModel`, `openRotationMenu`, `openScaleMenu`, `openMoveMenu`, `deleteModel`, `completeEditing`, `exitAR`, `downloadScene`, `confirmDelete`, `confirmExit`, `closeInfoDialog`, `closeDynamicMenu`, `updateRotation`, `updateScale`, `updateMoveDelta`, and `moveModelDynamic`. Export and attach only these required functions to `window`.
- Existing XR is a manual WebGL path: an XR-compatible canvas/context, explicit `XRWebGLLayer`, manual single-view camera matrices, and a session-owned `requestAnimationFrame` loop. The UI requests `immersive-ar`, requires `hit-test`, and requests `dom-overlay`. A modern renderer migration must replace these pieces together; retaining the old layer/matrix loop alongside `renderer.xr` would create two incompatible owners. Keep the features and hit-test source, while assigning rendering/camera/frame-loop ownership to Three.js WebXRManager.
- The current miss path leaves the reticle at its previous visible pose. Hide it when a frame has no hit, as required by the supplied migration acceptance criteria.

## Dependency outline

`index.html` loads Leaflet and the app entry point. The app entry imports the debug console, AR controller, start screen, map, and scene I/O. `ar_start.js` calls AR start and scene-file loading. `ar_main.js` owns AR/model/UI state and calls the map. The map reads the AR scene/camera/geolocation and serves coordinate conversion to the AR and scene-I/O code. Scene download reads placed models and map conversions. Keep Leaflet as its existing global dependency, with one Three.js import map shared by every module.

## Migration steps and checkpoints

1. Save this audit/plan before code edits; keep the existing user worktree changes and backup intact.
2. Establish a browser-native ES module entry and one import map pinned to Three.js r186 (`0.186.0`, the latest published stable release found during this audit); import addons with `three/addons/`. Keep Leaflet and its UI unchanged.
3. Convert the active app scripts to modules with explicit imports/exports. Preserve current function behavior and HTML; expose only the listed inline/dynamic handler API on `window`. Load the debug console before app initialization.
4. Replace global GLTFLoader usage with one imported shared loader and preserve model cache and external model/reticle URLs. All seven current catalog assets are skinned and animated, so clone each instance with `SkeletonUtils.clone()`.
5. Migrate XR as one coherent change: `renderer.xr.enabled`, `renderer.xr.setSession(session)`, one `renderer.setAnimationLoop`, frame-scoped hit-test processing from the supplied XRFrame, and Three.js-managed XR camera/rendering. Keep immersive AR, required hit-test, optional DOM overlay, viewer/local reference spaces, reticle placement, pointer selection, session end behavior, and DOM overlay.
6. Wire module dependencies for the start screen, map, geolocation, dialogs, debug console, and scene load/download; keep existing coordinate calculations and serialized JSON fields/values.
7. After each major phase, run targeted static checks for syntax/import resolution, old Three.js references, unresolved HTML/dynamic handler names, duplicate script/loop registration, asset/URL/schema preservation, and coordinate formula changes. Compare the feature/API inventory from this audit against the result.
8. Optimize only after functional parity: reuse frame objects, retain the 500 ms map cadence, and avoid unvalidated rendering changes.
9. Report checks separately from device-only behavior. A real mobile WebXR browser/device is required to claim camera passthrough, hit testing, actual placement/manipulation, Leaflet runtime, download/upload, and session exit verified.

## Guardrails

- Do not edit `public/new/` or `public/BK-Working/`, stage/commit them, or remove either working-tree state.
- Keep asset paths, model URLs, UI, map, equations, and JSON scene structure.
- If implementation requires changing a discovered behavior or schema, stop and explain it before doing so.
- Do not claim mobile WebXR acceptance criteria verified without an available device/browser run.


## Static checkpoint results

- The six active JS files pass Node syntax checks and local import/export resolution checks.
- The local module graph is acyclic. The app has one module entry and one Three.js import map; the active app path contains one `renderer.setAnimationLoop` and no explicit `XRWebGLLayer`, session-owned animation loop, or manual camera matrix overwrite.
- All 17 HTML/dynamically generated function-handler names resolve through the compatibility bridge. `moveDelta` is exposed through a read-only `window` accessor only because generated movement-button handlers refer to it.
- Both predefined JSON scenes parse and retain the expected fields. Original named functions, HTML IDs/inline handlers, model URLs/catalog, and coordinate equations remain present.
- The existing `BK-Working/` snapshot still matches the committed classic-script baseline. Existing `public/new/` deletions and the untracked backup were not changed.
- No real mobile WebXR device/browser was available for runtime validation. Camera passthrough, hit-test behavior, placement/manipulation, map behavior on-device, downloads/uploads, and XR exit remain to be checked manually.
