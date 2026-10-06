import * as THREE from "three";

let init = false;
let mymap;
let userIcon;
let intervalId;
let modeMarkers = [];
let getCamera = () => null;
let getGeoLocation = () => null;
let getPlacedModels = () => [];

// PERFORMANCE: Reuse one Vector3 instead of allocating a new
// Vector3 every time updateMap() runs.
let cameraPosition = new THREE.Vector3();

// PERFORMANCE: Cache the map window element once.
let mapWindow = document.getElementById("map-window");

// PERFORMANCE: Remember the last mapped camera position so Leaflet
// is updated only after the user has actually moved.
let lastMapX = null;
let lastMapZ = null;

// ============================================================
// Proposed plan overlay
// ============================================================

let planOverlay = null;
let planVisible = false;

// Proposed plan geographic bounds
// DHDN / Gauss-Krüger Zone 3
// Converted to WGS84
//
// Southwest:
// Latitude  = 48.405858385
// Longitude = 7.997080070
//
// Northeast:
// Latitude  = 48.414966828
// Longitude = 8.010410216

const planBounds = [
  [48.405858385, 7.99708007],
  [48.414966828, 8.010410216],
];

const earthRadius = 6378137;

export function configureMap(dependencies) {
  getCamera = dependencies.getCamera;
  getGeoLocation = dependencies.getGeoLocation;
  getPlacedModels = dependencies.getPlacedModels;
}

// ============================================================
// Initialize map
// ============================================================

export function init_map() {
  const mapContainer = document.getElementById("map-container");
  const geoLocation = getGeoLocation();

  if (mapContainer) {
    if (!init) {
      mymap = L.map(mapContainer);

      var OpenStreetMap_DE = L.tileLayer(
        "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
        {
          maxZoom: 25,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      );

      OpenStreetMap_DE.addTo(mymap);

      userIcon = L.icon({
        iconUrl: "assets/previewImages/map-user.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      mymap.fitBounds(planBounds, {
        padding: [20, 20],
      });

      userIcon = L.marker([geoLocation.latitude, geoLocation.longitude], {
        icon: userIcon,
      })
        .bindPopup("Ihre Position")
        .addTo(mymap);

      init = true;
    }

    // ========================================================
    // Remove old model markers
    // ========================================================

    modeMarkers.forEach((marker) => {
      marker.remove();
    });

    modeMarkers = [];

    // ========================================================
    // Add currently placed models to map
    // ========================================================

    const models = getPlacedModels();

    models.forEach((model) => {
      const { lat, lng } = threeToLeaflet(model.position.x, model.position.z);

      const modelMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: model.modelConfig.image,
          iconSize: [16, 16],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        }),
      })
        .addTo(mymap)
        .bindPopup(model.modelConfig?.name || "Unbenannt");

      modeMarkers.push(modelMarker);
    });

    // ========================================================
    // Add proposed plan
    // ========================================================

    addPlanOverlay();

    // ========================================================
    // Make sure Leaflet knows the map container dimensions
    // ========================================================

    setTimeout(() => {
      centerOnPlan();
    }, 100);

    // ========================================================
    // Update map position continuously
    // ========================================================

    // PERFORMANCE: Start only one map update interval.
    if (!intervalId) {
      intervalId = setInterval(updateMap, 500);
    }
  }
}

export function stopMapUpdates() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// ============================================================
// Center map on proposed plan
// ============================================================

export function centerOnPlan() {
  if (!mymap) {
    console.error("Map ist noch nicht initialisiert.");

    return;
  }

  mymap.invalidateSize();

  mymap.fitBounds(planBounds, {
    padding: [20, 20],
  });
}

// ============================================================
// Add georeferenced proposed plan
// ============================================================

export function addPlanOverlay() {
  if (!mymap) {
    console.error("Map ist noch nicht initialisiert.");

    return;
  }

  if (planOverlay) {
    planOverlay.addTo(mymap);

    planVisible = true;

    return;
  }

  planOverlay = L.imageOverlay("assets/plans/proposed-plan8k.png", planBounds, {
    opacity: 0.7,
    interactive: false,
  });

  planOverlay.addTo(mymap);

  planVisible = true;
}

// ============================================================
// Update map
// ============================================================

export function updateMap() {
  // The interval is normally stopped by closeMap().
  // This guard also handles cases where the map is hidden
  // by another UI action.
  if (mapWindow && mapWindow.style.display === "none" && intervalId) {
    clearInterval(intervalId);

    intervalId = null;

    return;
  }

  const camera = getCamera();

  if (!camera || !userIcon) {
    return;
  }

  // PERFORMANCE: Reuse the same Vector3 object.
  camera.getWorldPosition(cameraPosition);

  // PERFORMANCE: Do not update Leaflet if the user
  // has not moved.
  if (
    lastMapX !== null &&
    Math.abs(cameraPosition.x - lastMapX) < 0.1 &&
    Math.abs(cameraPosition.z - lastMapZ) < 0.1
  ) {
    return;
  }

  lastMapX = cameraPosition.x;
  lastMapZ = cameraPosition.z;

  const { lat, lng } = threeToLeaflet(cameraPosition.x, cameraPosition.z);

  userIcon.setLatLng([lat, lng]);
}

// ============================================================
// Convert Three.js coordinates to Leaflet coordinates
// ============================================================

export function threeToLeaflet(threeX, threeZ) {
  const geoLocation = getGeoLocation();

  if (!geoLocation) {
    console.error("GeoLocation ist noch nicht verfügbar");

    return;
  }

  const originLat = geoLocation.latitude;

  const originLng = geoLocation.longitude;

  const deltaLat = (threeZ / earthRadius) * (180 / Math.PI);

  const deltaLng =
    (threeX / (earthRadius * Math.cos((Math.PI * originLat) / 180))) *
    (180 / Math.PI);

  const globalLat = originLat + deltaLat;

  const globalLng = originLng + deltaLng;

  return {
    lat: globalLat,
    lng: globalLng,
  };
}

// ============================================================
// Convert Leaflet coordinates to Three.js coordinates
// ============================================================

export function leafletToThree(lat, lng) {
  const geoLocation = getGeoLocation();

  if (!geoLocation) {
    console.error("GeoLocation ist noch nicht verfügbar");

    return;
  }

  const originLat = geoLocation.latitude;

  const originLng = geoLocation.longitude;

  const deltaLat = lat - originLat;

  const deltaLng = lng - originLng;

  const threeZ = deltaLat * (Math.PI / 180) * earthRadius;

  const threeX =
    deltaLng *
    (Math.PI / 180) *
    earthRadius *
    Math.cos((Math.PI * originLat) / 180);

  return {
    x: threeX,
    z: threeZ,
  };
}

// ============================================================
// Round number
// ============================================================

export function roundTo(n, digits) {
  var negative = false;

  if (digits === undefined) {
    digits = 0;
  }

  if (n < 0) {
    negative = true;

    n = n * -1;
  }

  var multiplicator = Math.pow(10, digits);

  n = parseFloat((n * multiplicator).toFixed(11));

  n = (Math.round(n) / multiplicator).toFixed(digits);

  if (negative) {
    n = (n * -1).toFixed(digits);
  }

  return parseFloat(n);
}
