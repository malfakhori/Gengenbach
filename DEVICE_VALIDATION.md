# Android Chrome / WebXR device validation

## Current implementation audit

The active app uses the Three.js renderer.xr session path in public/ar_main.js: it requests immersive-ar with required hit-test and optional dom-overlay, sets the session on the renderer, requests local and viewer reference spaces, creates a hit-test source, and processes each XR frame from one renderer.setAnimationLoop. The start screen and app bootstrap are in ar_start.js and ar_app.js. The existing debug console captures JavaScript errors and unhandled promise rejections, but there is no structured XR readiness/status panel.

## Diagnostic-mode plan

- Add public/ar_diagnostics.js with one switch, XR_DIAGNOSTICS_ENABLED = false.
- When enabled, show a small, non-interactive status panel and collect XR/session/hit-test/reticle/model/FPS/camera/geolocation/error state.
- Update the panel at most once per second. Count frames inside the XR loop, but do not log per frame.
- Call the diagnostics hooks from existing XR lifecycle points. Hooks are no-ops while the flag is false.
- Preserve the existing session, render loop, UI controls, scene data, model catalog/URLs, coordinate conversion, and Leaflet behavior.
- The diagnostic switch is the only switch required to turn this panel and its listeners/timer on or off.

## Android Chrome test setup

Use a physical ARCore-capable Android phone in Chrome with network access, install/update Google Play Services for AR if the device requires it, and open the deployed site over HTTPS. Grant the browser camera permission for the AR session and location permission when prompted. Use a well-lit area with a textured horizontal surface; glossy, featureless, or very dark surfaces can make surface discovery difficult. Avoid testing from a desktop browser or a normal file:// URL.

Turn diagnostics on temporarily by changing XR_DIAGNOSTICS_ENABLED to true in public/ar_diagnostics.js, deploy that change, and reload the page. Restore it to false after testing.

## Manual checklist

| Test | Steps | Expected behavior |
| --- | --- | --- |
| 1. Secure page and feature detection | Open the HTTPS site in Android Chrome, reload, and inspect the diagnostic panel before starting AR. | WEBXR: AVAILABLE; IMMERSIVE-AR: READY when the device/browser reports support. The session line is IDLE. If unsupported, the panel says UNAVAILABLE or UNSUPPORTED without a JavaScript exception. |
| 2. Start screen | Confirm the start screen appears. Select each predefined scene and verify its selection state, then reload to test the empty-scene start path. | Existing buttons and labels remain unchanged. Selecting a predefined scene marks only that scene selected; no XR session starts until Start AR is tapped. |
| 3. Start AR and permissions | Tap Start AR, accept the camera/session prompt, and accept location permission when prompted. | Camera passthrough appears, the menu overlay remains visible, diagnostic state becomes XR: SESSION, and no duplicate renderer or canvas appears. Geolocation changes from WAITING to READY (lat, lng) or reports an error. |
| 4. Reference spaces and hit source | Wait after the session begins and inspect the panel. | LOCAL: READY, VIEWER: READY, and HIT SOURCE: READY appear only after each corresponding promise succeeds. Failure remains visible as ERROR with details in the diagnostic error list. |
| 5. Hit-test search and reticle | Slowly move the phone over a textured floor/table, then point it at empty space. | A detected surface shows HIT TEST: FOUND and RETICLE: VISIBLE; empty space shows HIT TEST: SEARCHING and RETICLE: HIDDEN. The reticle tracks the detected position without creating models. |
| 6. Frame loop and FPS | Keep the session open and watch the indicator while moving the device gently. | ANIMATION: ACTIVE and a changing, nonzero FPS value appear. FPS and status refresh at about one-second intervals; the console does not receive a line for every XR frame. |
| 7. Place one model | Wait until the reticle is visible, open Add, and tap one model item once. | Selecting the model item places it immediately at the current reticle position. The count becomes MODELS: 1 after loading; it remains anchored as the phone moves. No second tap on the scene is needed and no extra copy appears. |
| 8. Place multiple models | Place another model and then a second copy of the first model. | Counts advance once per placement (for example, 1, 2, 3). Each copy renders independently and the earlier copies remain in place. |
| 9. Select and transform | Tap a placed model, test Move on X and Z, Rotate, and Scale controls, then finish editing. | The selected model is highlighted and only that model changes. The selected model returns to its prior appearance when editing finishes. Other models remain unchanged. |
| 10. Delete confirmation | Select a model, choose Delete, test No, then repeat and choose Yes. | No keeps the model and its count unchanged. Yes removes only the selected model and decrements the count by one. |
| 11. Overview map and coordinates | With geolocation ready, open the map and walk several steps while it is visible. | Leaflet tiles, the plan overlay, user marker, and placed-model markers appear at their existing locations. The user marker follows movement at the existing roughly 500 ms cadence. Camera and geolocation diagnostic lines remain populated. |
| 12. Save scene | Place and transform at least one model, open Options, and download the scene. Inspect the JSON file. | A file downloads. It retains top-level lat, lng, and models; each model has name, position, rotation, scale, lat, and lng. |
| 13. Reload saved and predefined scenes | Reload the downloaded file through the start screen. Repeat with each predefined scene. | Each supported model loads once with its saved geographic placement, vertical position, rotation, and scale. Both predefined scenes still load. Model count matches the placed models. |
| 14. Error reporting | If an error or rejected promise occurs during the above steps, inspect the diagnostic panel and existing debug console. | JavaScript errors and unhandled rejections are shown with their message. They are not emitted repeatedly per frame. A clean run shows no such entries. |
| 15. Exit AR | Open Options, choose Exit AR, confirm Yes, and wait for the app reload. | The session ends and the current app reload behavior remains intact. In diagnostic mode the panel records XR: ENDED across that reload. Confirm No once; the session continues. |
| 16. Disable diagnostics | Set XR_DIAGNOSTICS_ENABLED back to false, redeploy, and reload. | No diagnostic panel, timer, or diagnostic error listeners are created. The existing page/debug console and app behavior remain as before. |

## Result recording

For each test, record pass/fail, device model, Android version, Chrome version, site URL, and the final diagnostic lines. A failed hit-test should include whether the source was created, whether results were empty or found, and whether the reticle became visible.


