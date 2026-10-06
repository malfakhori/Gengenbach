# GPS localization and calibration implementation plan

## Audited baseline

- The active app is bootstrapped from `public/ar_app.js`; XR startup and the renderer loop live in `public/ar_main.js`.
- `activateXR()` requests the existing `immersive-ar` session with required `hit-test`, creates `local` and `viewer` reference spaces, creates a hit-test source, then starts the renderer animation loop.
- Geolocation currently uses one `getCurrentPosition()` call with high accuracy, a 2-second cache age, and a 5-second timeout. Its rounded latitude/longitude become `geoLocation`.
- `public/ar_overviewmap.js` owns the local tangent-plane equations used by `leafletToThree()` and `threeToLeaflet()`. Those equations are to remain unchanged.
- Loaded models use each saved model's `lat`/`lng` through `leafletToThree()`, preserving its saved Y, rotation, and scale. The predefined scene JSON files use the existing `{lat, lng, models}` schema.
- Models are currently direct `scene` children, alongside lights and the reticle. The reticle is positioned by the existing XR hit-test loop.
- `public/ar_download.js` serializes each model position through `threeToLeaflet()` and preserves the current scene JSON fields.
- `public/ar_diagnostics.js` already contains an `XR_DIAGNOSTICS_ENABLED` switch, error and unhandled-rejection listeners, FPS sampling, and a one-second panel refresh. In the audited working tree the flag is currently `true`; the requested default-off behavior will be restored while extending its data.
- The current app menu and edit controls are built in `public/index.html` and `public/ar_main.js`; no scene-specific calibration persistence exists.

## Implementation steps

1. Add a small GPS localization module that samples with `watchPosition()`, rejects fixes outside configurable accuracy bounds, evaluates spatial consistency, and resolves to a stable fix or a time-bounded best available fix. Record the chosen fix's timestamp, accuracy, count, spread, and selection source. Clear the watch on completion. Never use later fixes to reposition the scene.
2. Integrate the bounded localization step after the existing XR session/reference-space/hit-source setup. Keep the current XR startup gesture and render loop. Show short-lived localization progress and outcomes in a small transient status element; do not repurpose or replace the existing app menus.
3. Add one model-only group with an absolute X/Z calibration offset initialized to zero. Keep the reticle and lights in the existing scene. Adapt model enumeration, ray selection, deletion, and saving so existing model edit behavior continues to work. Do not modify model source positions when applying calibration.
4. Add manual calibration controls in the existing Options/dynamic-menu flow. Adjust the model-group offset in small X/Z increments, support reset and confirm, and keep the setting session-only. The source and predefined scene JSON remain unchanged. For downloads, derive geographic locations from each model's final world position, while retaining the current schema and conversion equations.
5. Extend optional diagnostics through the existing single flag. Show GPS acquisition/quality and calibration/base/final offsets alongside current XR, frame, camera, model, and error state. Preserve throttled panel updates and avoid per-frame console output.
6. Write `GPS_LOCALIZATION.md` describing the implemented sampling/fallback behavior, tuning configuration, calibration controls, and Android device-validation steps.
7. Run syntax/static checks and inspect the final diff. Confirm scene JSON, model URLs/catalog, coordinate equations, Leaflet code/behavior, and WebXR session/render architecture remain unchanged except for the localized hooks described above.

## Guardrails

- No continuous GPS-driven scene movement after initial localization.
- No schema, model URL/catalog, coordinate-equation, Leaflet, or XR architecture changes.
- No calibration baked into the original model position or JSON files.
- No per-frame diagnostic console logging.
- Manual Android/iOS device testing will be reported as unperformed unless actually carried out.

## Rotation calibration addendum (audited 2026-10-06)

### Current transform and pivot

- `public/ar_main.js` creates `placedModelsRoot` as a child of the Three.js scene. It has no explicit transform, so its pivot and position are `(0, 0, 0)`.
- Scene model X/Z coordinates are produced by `leafletToThree()` relative to `geoLocation`; that makes the root origin the geographic tangent-plane origin.
- The reticle, lights, camera, and WebXR render loop remain outside `placedModelsRoot`. All catalog models are placed beneath it.
- Root translation is assigned absolutely from `calibrationOffset`, and the map/download paths already use model world positions to account for that translation.
- Newly placed models currently compensate only for root translation before parenting, so adding rotation also requires inverse rotation of the reticle position.
- Scene downloads currently write world position but local Euler rotation. To retain the visible scene after reload, downloads must serialize each model's world-space Euler orientation as well as world position; the existing JSON field names stay the same.

### Rotation implementation steps

1. Extend the session calibration state with `rotationY` in radians and a configurable 5-degree button increment. Every adjustment assigns the root's Y rotation from state; never rotate models individually or accumulate edits in their coordinates.
2. Preserve the pivot at the existing geographic root origin. Apply the root transform deterministically as translation `(x, 0, z)` and Y rotation `rotationY`; keep the reticle, lights, camera, and XR session unchanged.
3. Add accessible, touch-sized left/right rotation controls to the current dynamic calibration menu. Keep existing translation, confirm, and reset controls. Reset assigns all calibration state and root transforms to zero; confirm remains session-only.
4. For new hit-test placements, inverse-transform the reticle's scene position through the full root transform before parenting so the model's resulting world position still equals the reticle.
5. Keep map and download positions based on world coordinates. Serialize world orientation for download using a world quaternion converted to an Euler using the existing model order, preserving the scene JSON schema and leaving calibration out of JSON.
6. Extend the current diagnostic calibration section with X/Y/Z and Y rotation in degrees. Keep the existing diagnostics flag and one-second display refresh.
7. Run JavaScript syntax checks and `git diff --check`; review that scene JSON, coordinate equations, model URLs/catalog, and WebXR session/render code remain untouched.
