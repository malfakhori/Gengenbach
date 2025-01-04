


function init_map() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        var mymap = L.map(mapContainer);
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
 
        // Marker initialisieren
        var userIcon = L.icon({
            iconUrl: 'previewImages/map-user.png',  // Dein Männchen-Bild
            iconSize: [32, 32],               // Die Größe des Icons
            iconAnchor: [16, 32],             // Der Punkt des Markers, der auf der Position zeigt
            popupAnchor: [0, -32]             // Die Position des Popups relativ zum Marker
        });

        // Marker initialisieren
        var userMarker = L.marker([0, 0], { icon: userIcon }).bindPopup('Ihre Position').addTo(mymap);
        let initPosition = false;
        let lastPosition = { lat: 0, lng: 0 }; // Letzte bekannte Position
        const updateThreshold = 1.5; // Schwellenwert für den Abstand (in Metern)
        
        // Funktion, um die Position zu aktualisieren
        function updatePosition(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const currentPosition = L.latLng(userLat, userLng);
            const lastKnownPosition = L.latLng(lastPosition.lat, lastPosition.lng);
            const distance = currentPosition.distanceTo(lastKnownPosition);

            // Nur aktualisieren, wenn der Abstand größer als der Schwellenwert ist
            if (distance > updateThreshold || !initPosition) {
                if (!initPosition) {
                    mymap.setView([userLat, userLng], 20); // Zentrische Ansicht beim ersten Mal
                    initPosition = true;
                }

                // Marker auf die neue Position setzen
                userMarker.setLatLng([userLat, userLng]);
                console.log(`Setze Position auf lat=${userLat} lng=${userLng}, Abstand: ${distance}m`);
                lastPosition = { lat: userLat, lng: userLng };
            }
        }

        // Die Position alle 5 Sekunden aktualisieren
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updatePosition);
            navigator.geolocation.watchPosition(updatePosition, function(error) {
                console.error("Fehler bei der Geolokalisierung:", error);
            }, {enableHighAccuracy: true, maximumAge: 2000,timeout: 5000});
        } else {
            console.error("Geolocation wird nicht unterstützt.");
        }
    }
 }
 