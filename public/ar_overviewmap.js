let init = false;
let mymap;
let userIcon;
let intervalId;
let modeMarkers = []
const earthRadius = 6378137; // Erdradius in Metern (WGS84)

function init_map() {
    const mapContainer = document.getElementById("map-container");
    if (mapContainer) {
        if (!init) {
            mymap = L.map(mapContainer);
            var OpenStreetMap_DE = L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
                maxZoom: 30,
                minZoom: 15,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });
            // select one basemap from https://leaflet-extras.github.io/leaflet-providers/preview/
            var CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 30,
                minZoom: 15
            });
            CartoDB_Positron.addTo(mymap);
    
            userIcon = L.icon({
                iconUrl: 'assets/previewImages/map-user.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });

            mymap.setView([geoLocation.latitude, geoLocation.longitude], 20)
            userIcon = L.marker([geoLocation.latitude, geoLocation.longitude], { icon: userIcon }).bindPopup('Ihre Position').addTo(mymap);
            init = true;
        }

        modeMarkers.forEach(marker => {
            marker.remove();
        });
        const models = getAllPlacedModels();
        models.forEach(model => {
            const { lat, lng } = threeToLeaflet(model.position.x, model.position.z);
            const modelMarker = L.marker([lat, lng], { icon: L.icon({
                iconUrl: model.modelConfig.image,
                iconSize: [16, 16],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            })}).addTo(mymap).bindPopup(model.modelConfig?.name || "Unbenannt");
            modeMarkers.push(modelMarker);
        });
        intervalId = setInterval(updateMap, 500);
    }
 }

 function updateMap() {
    if (document.getElementById("map-window").style.display === 'none' && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        return;
    }

    let vec = new THREE.Vector3();
    const userPosition = camera.getWorldPosition(vec);
    const { lat, lng } = threeToLeaflet(userPosition.x, userPosition.z);

    if (userIcon) {
        userIcon.setLatLng([lat, lng]);
    }
 }



 function threeToLeaflet(threeX, threeZ) {
    if (!geoLocation) {
        console.error("GeoLocation ist noch nicht verfügbar");
        return;
    }

    const originLat = geoLocation.latitude;
    const originLng = geoLocation.longitude;

    const deltaLat = (threeZ / earthRadius) * (180 / Math.PI);
    const deltaLng = (threeX / (earthRadius * Math.cos(Math.PI * originLat / 180))) * (180 / Math.PI);

    const globalLat = originLat + deltaLat;
    const globalLng = originLng + deltaLng;
    return { lat: globalLat, lng: globalLng };
}

function leafletToThree(lat, lng) {
    if (!geoLocation) {
        console.error("GeoLocation ist noch nicht verfügbar");
        return;
    }

    const originLat = geoLocation.latitude;
    const originLng = geoLocation.longitude;

    const deltaLat = lat - originLat;
    const deltaLng = lng - originLng;

    const threeZ = deltaLat * (Math.PI / 180) * earthRadius;
    const threeX = deltaLng * (Math.PI / 180) * earthRadius * Math.cos(Math.PI * originLat / 180);

    return { x: threeX, z: threeZ };
}

function roundTo(n, digits) {
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
 
