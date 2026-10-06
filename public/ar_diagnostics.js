import * as THREE from "three";

export const XR_DIAGNOSTICS_ENABLED = true; // Set to false to disable the diagnostics panel

const SESSION_END_KEY = "gengenbach.xrDiagnostics.sessionEnded";
const REFRESH_INTERVAL_MS = 1000;
const MAX_EVENTS = 5;

const state = {
  webxr: "CHECKING",
  immersiveAr: "CHECKING",
  xr: "CHECKING",
  session: "IDLE",
  localSpace: "WAITING",
  viewerSpace: "WAITING",
  hitSource: "WAITING",
  hitTest: "WAITING",
  hitResultCount: null,
  reticle: "HIDDEN",
  animation: "IDLE",
  fps: null,
  modelCount: 0,
  camera: "NOT INITIALIZED",
  geolocation: "WAITING",
  events: [],
};

let panel = null;
let refreshTimer = null;
let frameCount = 0;
let fpsWindowStarted = 0;
let lastFrameAt = 0;
let cameraWorldPosition = null;

function addEvent(type, detail) {
  if (!XR_DIAGNOSTICS_ENABLED) return;

  const message = String(detail || "Unknown error")
    .replace(/\s+/g, " ")
    .slice(0, 180);
  state.events.unshift(type + ": " + message);
  state.events.length = Math.min(state.events.length, MAX_EVENTS);
  renderPanel();
}

function renderPanel(now = performance.now()) {
  if (!panel) return;

  const animationIsActive = lastFrameAt > 0 && now - lastFrameAt < 1500;
  state.animation = animationIsActive ? "ACTIVE" : "IDLE";

  const eventText = state.events.length
    ? state.events.map((event) => "- " + event).join("\n")
    : "none";

  const fpsText = state.fps === null ? "--" : String(state.fps);
  const hitCountText =
    state.hitResultCount === null ? "--" : String(state.hitResultCount);

  panel.textContent = [
    "XR DEVICE DIAGNOSTICS",
    "XR: " + state.xr,
    "WEBXR: " + state.webxr,
    "IMMERSIVE-AR: " + state.immersiveAr,
    "SESSION: " + state.session,
    "LOCAL SPACE: " + state.localSpace,
    "VIEWER SPACE: " + state.viewerSpace,
    "HIT SOURCE: " + state.hitSource,
    "HIT TEST: " + state.hitTest + " (results: " + hitCountText + ")",
    "RETICLE: " + state.reticle,
    "ANIMATION: " + state.animation + " | FPS: " + fpsText,
    "MODELS: " + state.modelCount,
    "CAMERA: " + state.camera,
    "GEOLOCATION: " + state.geolocation,
    "ERRORS / REJECTIONS:",
    eventText,
  ].join("\n");
}

function formatError(error) {
  if (error && error.stack) return error.stack;
  if (error && error.message) return error.name + ": " + error.message;
  return String(error);
}

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function initializeXRDiagnostics() {
  if (!XR_DIAGNOSTICS_ENABLED) return;

  panel = document.createElement("pre");
  panel.id = "xr-diagnostic-panel";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");
  panel.style.cssText = [
    "position:fixed",
    "top:38px",
    "left:8px",
    "z-index:9997",
    "box-sizing:border-box",
    "width:min(360px, calc(100vw - 16px))",
    "max-height:45vh",
    "overflow:auto",
    "margin:0",
    "padding:8px",
    "border:1px solid rgba(0,255,0,.55)",
    "border-radius:6px",
    "background:rgba(0,0,0,.82)",
    "color:#00ff00",
    "font:11px/1.35 monospace",
    "white-space:pre-wrap",
    "pointer-events:none",
  ].join(";");

  document.body.appendChild(panel);
  cameraWorldPosition = new THREE.Vector3();

  const storage = getSessionStorage();
  if (storage && storage.getItem(SESSION_END_KEY) === "ended") {
    state.session = "ENDED";
    state.xr = "ENDED";
    storage.removeItem(SESSION_END_KEY);
  }

  window.addEventListener("error", (event) => {
    const location =
      event.filename + ":" + event.lineno + ":" + event.colno;
    addEvent("ERROR", event.message + " (" + location + ")");
  });

  window.addEventListener("unhandledrejection", (event) => {
    addEvent("REJECTION", formatError(event.reason));
  });

  if (!navigator.xr) {
    state.webxr = "UNAVAILABLE";
    state.immersiveAr = "UNAVAILABLE";
    state.xr = state.session === "ENDED" ? "ENDED" : "UNAVAILABLE";
    renderPanel();
    refreshTimer = window.setInterval(renderPanel, REFRESH_INTERVAL_MS);
    return;
  }

  state.webxr = "AVAILABLE";
  state.immersiveAr = "CHECKING";
  renderPanel();

  if (typeof navigator.xr.isSessionSupported !== "function") {
    state.immersiveAr = "CHECK UNSUPPORTED";
    state.xr = state.session === "ENDED" ? "ENDED" : "UNKNOWN";
  } else {
    navigator.xr
      .isSessionSupported("immersive-ar")
      .then((supported) => {
        state.immersiveAr = supported ? "READY" : "UNSUPPORTED";
        if (state.session !== "STARTED" && state.session !== "ENDED") {
          state.xr = supported ? "READY" : "UNSUPPORTED";
        }
        renderPanel();
      })
      .catch((error) => {
        state.immersiveAr = "ERROR";
        if (state.session !== "STARTED" && state.session !== "ENDED") {
          state.xr = "ERROR";
        }
        addEvent("XR SUPPORT CHECK", formatError(error));
      });
  }

  refreshTimer = window.setInterval(renderPanel, REFRESH_INTERVAL_MS);
}

export function reportXRSessionStarted() {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  state.session = "STARTED";
  state.xr = "SESSION";
  renderPanel();
}

export function reportXRSessionEnded() {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  state.session = "ENDED";
  state.xr = "ENDED";
  const storage = getSessionStorage();
  if (storage) storage.setItem(SESSION_END_KEY, "ended");
  renderPanel();
}

export function reportReferenceSpaceCreated(name) {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  if (name === "local") state.localSpace = "READY";
  if (name === "viewer") state.viewerSpace = "READY";
  renderPanel();
}

export function reportHitTestSourceCreated() {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  state.hitSource = "READY";
  renderPanel();
}

export function reportGeolocationReady(location) {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  state.geolocation =
    location.latitude.toFixed(5) + ", " + location.longitude.toFixed(5);
  renderPanel();
}

export function reportGeolocationError(error) {
  if (!XR_DIAGNOSTICS_ENABLED) return;
  state.geolocation = "ERROR";
  addEvent("GEOLOCATION", formatError(error));
}

export function reportDiagnosticError(type, error) {
  addEvent(type, formatError(error));
}

export function recordXRFrame({
  hitResultCount,
  reticleVisible,
  modelCount,
  camera,
}) {
  if (!XR_DIAGNOSTICS_ENABLED || !panel) return;

  const now = performance.now();
  frameCount += 1;

  if (fpsWindowStarted === 0) fpsWindowStarted = now;
  const elapsed = now - fpsWindowStarted;
  if (elapsed >= REFRESH_INTERVAL_MS) {
    state.fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    fpsWindowStarted = now;
  }

  lastFrameAt = now;
  state.hitResultCount = hitResultCount;
  state.hitTest =
    hitResultCount === null
      ? "NO FRAME POSE"
      : hitResultCount > 0
        ? "FOUND"
        : state.hitSource === "READY"
          ? "SEARCHING"
          : "WAITING";
  state.reticle = reticleVisible ? "VISIBLE" : "HIDDEN";
  state.modelCount = modelCount;

  if (camera) {
    camera.getWorldPosition(cameraWorldPosition);
    state.camera =
      "READY (" +
      cameraWorldPosition.x.toFixed(1) +
      ", " +
      cameraWorldPosition.y.toFixed(1) +
      ", " +
      cameraWorldPosition.z.toFixed(1) +
      ")";
  } else {
    state.camera = "NOT INITIALIZED";
  }
}

