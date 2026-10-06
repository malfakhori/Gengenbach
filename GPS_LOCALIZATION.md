# GPS localization and manual calibration

## Runtime behavior

The app starts GPS sampling after the user starts the existing WebXR session. It uses `watchPosition()` to collect fixes and uses `coords.accuracy` to weight the candidate location. A fix must have finite coordinates and positive accuracy; samples worse than the configured maximum are excluded from the stable cluster. The app selects the largest cluster whose samples are within the configured horizontal radius, rejecting isolated outliers.

The current settings are in `public/ar_geolocation.js`:

| Setting | Current value | Meaning |
| --- | ---: | --- |
| `targetAccuracyMeters` | 15 m | Maximum weighted cluster accuracy for a stable result |
| `maximumAccuracyMeters` | 35 m | Worst accuracy admitted to the cluster |
| `stableClusterRadiusMeters` | 12 m | Maximum distance between clustered fixes; also caps reported spread |
| `requiredStableSamples` | 4 | Minimum consistent fixes before accepting a stable result |
| `maximumWaitMs` | 18 s | Maximum acquisition time before using a fallback or reporting failure |
| `maximumAgeMs` | 1.5 s | Browser cache age requested for each watch reading |

Each accepted sample retains its coordinates, accuracy, and browser timestamp during selection. The chosen `geoLocation` keeps the full calculated floating-point latitude/longitude precision internally and includes accuracy, newest sample timestamp, sample count, spread, source (`stable cluster` or `timeout fallback`), and status (`STABLE` or `APPROXIMATE`). The existing coordinate conversion functions are unchanged. Diagnostics format coordinates to seven decimal places for display only; that formatting does not change the internal origin or increase GPS accuracy.

At timeout, the app uses the best available in-range cluster (or the best usable fix) and labels it approximate. With no usable fix, the app leaves the scene unloaded, reports the failure, and offers **Erneut versuchen**. Once a location is selected, the watch is cleared. Later GPS updates never move models or change the map origin; movement is then owned by WebXR local tracking.

## Manual calibration

Open **Optionen → Position kalibrieren**. Choose a translation step from 0.10 m to 1.00 m, then adjust the model group along X or Z. Rotate the group around vertical Y with the left/right rotation buttons in 5° increments. Translation and rotation can be interleaved; each action reapplies the current complete transform to the model root. The root pivot is the geographic tangent-plane origin at local `(0, 0, 0)`. Models move and rotate together; the reticle, lights, and XR tracking remain in their existing coordinate space. **Kalibrierung zurücksetzen** restores zero translation and rotation. **Kalibrierung übernehmen** marks the current session transform as accepted. Calibration remains in memory for this XR session and is not written into source or predefined scene JSON.

When a scene is downloaded, each model's final world-space position is converted through the existing `threeToLeaflet()` function, and its world-space orientation is saved in the existing rotation fields. The saved model `lat`/`lng` therefore reflect the calibrated placement. The JSON fields and coordinate equations are unchanged. Reloading places the calibrated positions and orientations without reapplying the session transform. The overview map also uses final world-space model positions.

## Optional device diagnostics

In `public/ar_diagnostics.js`, set `XR_DIAGNOSTICS_ENABLED` to `true` for a temporary validation build and return it to `false` afterward. With the flag enabled, the panel refreshes once per second and includes XR/WebXR support, session and reference-space state, hit-test and reticle state, renderer activity/FPS, model count, camera, GPS status/accuracy/sample count/spread/source/timestamp/base coordinates, calibration base/final X/Z, JavaScript errors, and unhandled promise rejections. It does not write a console entry for each XR frame. With the flag false, the panel, timer, and diagnostic event listeners are not created.

## Android Chrome validation

Use an ARCore-capable Android phone, current Chrome, an HTTPS deployment, and a textured horizontal surface. Grant camera and location access. Keep the phone stationary while GPS is acquiring, then test:

1. **Stable acquisition:** Start AR outdoors with good satellite reception. Expected: the status shows acquisition progress, then `Standort stabil` after at least four consistent fixes. Diagnostics show `GPS STATUS: STABLE`, a sample count of at least four, finite accuracy/spread, source `stable cluster`, and a timestamp.
2. **Outlier rejection:** While acquiring, briefly move between open sky and a location-obstructed area, or compare runs with inconsistent readings. Expected: isolated fixes outside the 12 m cluster do not count toward the accepted cluster; the app waits for four consistent samples or uses the labeled fallback at 18 seconds.
3. **Timeout fallback:** Test where GPS readings are slow but at least one usable fix arrives. Expected: acquisition ends by 18 seconds, the status says `Standort angenähert`, diagnostics report `APPROXIMATE` and `timeout fallback`, and scene models load once.
4. **Permission denied / unavailable:** Deny location permission and start AR. Expected: no scene is loaded from an unknown origin, the user sees a localized error and retry button, and diagnostics show GPS error without stopping the XR render loop.
5. **No GPS-driven drift:** After localization, walk several meters while viewing an existing model. Expected: the model remains fixed in the room as the phone moves; `GPS BASE` and saved origin do not change during that session.
6. **Translation and rotation controls:** Open calibration and adjust X+, X−, Z+, and Z− independently at 0.25 m; then rotate left and right in 5° steps. Expected: all placed models translate together and rotate together around the geographic root origin on Y only; the reticle behavior is unchanged. A newly placed model remains at the reticle. Diagnostics show signed X/Y/Z and Y rotation in degrees. Reset returns translation and rotation to zero; confirm retains the current transform for the session.
7. **Map and saved scene:** Open the overview map after applying translation and rotation, then download and reload the scene. Expected: the marker matches the displayed calibrated model; downloaded `lat`/`lng` and model rotations represent final world positions/orientations, and reloading does not apply the previous session transform a second time.
8. **Diagnostics off:** Set the flag to `false` and reload. Expected: no diagnostic panel, polling timer, or diagnostic listeners; localization, calibration, and the existing UI still work.

Record the phone model, Android and Chrome versions, site URL, GPS status/accuracy/spread, and pass/fail for each run. This checklist is preparation only; no physical-device result should be inferred from desktop/static checks.
