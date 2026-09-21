let init = false;
let mymap;
let userIcon;
let intervalId;
let modeMarkers = [];

// ============================================================
// Proposed plan overlay
// ============================================================
let planOverlay = null;
let planVisible = false;

const earthRadius = 6378137; // Erdradius in Metern (WGS84)


// ============================================================
// Initialize map
// ============================================================
function init_map() {

    const mapContainer = document.getElementById("map-container");

    if (mapContainer) {

        if (!init) {

            mymap = L.map(mapContainer);

            var OpenStreetMap_DE = L.tileLayer(
                'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                {
                    maxZoom: 30,
                    //minZoom: 15,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            );

            // Select one basemap from:
            // https://leaflet-extras.github.io/leaflet-providers/preview/



            OpenStreetMap_DE.addTo(mymap);

            // ====================================================
            // User icon
            // ====================================================

            userIcon = L.icon({
                iconUrl: 'assets/previewImages/map-user.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });


            // ====================================================
            // Initial map position
            // ====================================================

            mymap.setView(
                [geoLocation.latitude, geoLocation.longitude],
                20
            );


            // ====================================================
            // User position marker
            // ====================================================

            userIcon = L.marker(
                [geoLocation.latitude, geoLocation.longitude],
                {
                    icon: userIcon
                }
            )
            .bindPopup('Ihre Position')
            .addTo(mymap);


            init = true;
        }


        // ========================================================
        // Remove old model markers
        // ========================================================

        modeMarkers.forEach(marker => {
            marker.remove();
        });


        // ========================================================
        // Add currently placed models to map
        // ========================================================

        const models = getAllPlacedModels();

        models.forEach(model => {

            const { lat, lng } = threeToLeaflet(
                model.position.x,
                model.position.z
            );

            const modelMarker = L.marker(
                [lat, lng],
                {
                    icon: L.icon({
                        iconUrl: model.modelConfig.image,
                        iconSize: [16, 16],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    })
                }
            )
            .addTo(mymap)
            .bindPopup(
                model.modelConfig?.name || "Unbenannt"
            );

            modeMarkers.push(modelMarker);
        });


        // ========================================================
        // Add proposed plan
        // ========================================================

        addPlanOverlay();


        // ========================================================
        // Update map position continuously
        // ========================================================

        intervalId = setInterval(updateMap, 500);
    }
}


// ============================================================
// Add georeferenced proposed plan
// ============================================================
//
// Original coordinate system:
// DHDN / Gauss-Krüger Zone 3
// EPSG:31467
//
// Image extent:
//
// Southwest:
// X = 3425822.00
// Y = 5363602.00
//
// Northeast:
// X = 3426822.00
// Y = 5364602.00
//
// Converted to WGS84:
//
// Southwest:
// Latitude  = 48.405858385
// Longitude = 7.997080070
//
// Northeast:
// Latitude  = 48.414966828
// Longitude = 8.010410216
// ============================================================

function addPlanOverlay() {

    if (!mymap) {
        console.error("Map ist noch nicht initialisiert.");
        return;
    }


    // If the overlay already exists,
    // simply make sure that it is visible.
    if (planOverlay) {

        planOverlay.addTo(mymap);
        planVisible = true;

        return;
    }


    // ========================================================
    // Geographic bounds of the plan
    // ========================================================

    const planBounds = [

        // Southwest / bottom-left
        [48.405858385, 7.997080070],

        // Northeast / top-right
        [48.414966828, 8.010410216]
    ];


    // ========================================================
    // Create image overlay
    // ========================================================

    planOverlay = L.imageOverlay(
        'assets/plans/proposed-plan.png',

        planBounds,

        {
            // Transparency of the plan
            opacity: 0.7,

            // Plan does not capture mouse/touch events
            interactive: false
        }
    );


    // ========================================================
    // Add overlay to map
    // ========================================================

    planOverlay.addTo(mymap);

    planVisible = true;
}


// ============================================================
// Update map
// ============================================================

function updateMap() {

    if (
        document.getElementById("map-window").style.display === 'none'
        && intervalId
    ) {

        clearInterval(intervalId);
        intervalId = null;

        return;
    }


    let vec = new THREE.Vector3();

    const userPosition = camera.getWorldPosition(vec);

    const { lat, lng } = threeToLeaflet(
        userPosition.x,
        userPosition.z
    );


    if (userIcon) {

        userIcon.setLatLng([
            lat,
            lng
        ]);
    }
}


// ============================================================
// Convert Three.js coordinates to Leaflet coordinates
// ============================================================

function threeToLeaflet(threeX, threeZ) {

    if (!geoLocation) {

        console.error(
            "GeoLocation ist noch nicht verfügbar"
        );

        return;
    }


    const originLat = geoLocation.latitude;
    const originLng = geoLocation.longitude;


    const deltaLat =
        (threeZ / earthRadius) *
        (180 / Math.PI);


    const deltaLng =
        (
            threeX /
            (
                earthRadius *
                Math.cos(Math.PI * originLat / 180)
            )
        ) *
        (180 / Math.PI);


    const globalLat =
        originLat + deltaLat;


    const globalLng =
        originLng + deltaLng;


    return {
        lat: globalLat,
        lng: globalLng
    };
}


// ============================================================
// Convert Leaflet coordinates to Three.js coordinates
// ============================================================

function leafletToThree(lat, lng) {

    if (!geoLocation) {

        console.error(
            "GeoLocation ist noch nicht verfügbar"
        );

        return;
    }


    const originLat = geoLocation.latitude;
    const originLng = geoLocation.longitude;


    const deltaLat =
        lat - originLat;


    const deltaLng =
        lng - originLng;


    const threeZ =
        deltaLat *
        (Math.PI / 180) *
        earthRadius;


    const threeX =
        deltaLng *
        (Math.PI / 180) *
        earthRadius *
        Math.cos(Math.PI * originLat / 180);


    return {
        x: threeX,
        z: threeZ
    };
}


// ============================================================
// Round number
// ============================================================

function roundTo(n, digits) {

    var negative = false;


    if (digits === undefined) {
        digits = 0;
    }


    if (n < 0) {

        negative = true;

        n = n * -1;
    }


    var multiplicator =
        Math.pow(10, digits);


    n = parseFloat(
        (n * multiplicator).toFixed(11)
    );


    n =
        (
            Math.round(n) /
            multiplicator
        ).toFixed(digits);


    if (negative) {

        n =
            (n * -1).toFixed(digits);
    }


    return parseFloat(n);
}