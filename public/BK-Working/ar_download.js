function downloadScene() {
    const placedModels = getAllPlacedModels().map(model => {
      const { lat, lng } = threeToLeaflet(model.position.x, model.position.z);
      return {
        name: model.modelConfig.name,
        position: model.position,
        rotation: model.rotation,
        scale: model.scale,
        lat: lat,
        lng: lng,
      }
    });

    console.log("Modelle: " + placedModels.length)
    if (placedModels.length === 0) {
      showInfoDialog("Szene ist leer");
      return;
    }

    if (!geoLocation) {
      console.log("Standort nicht geladen");
      showInfoDialog("Ihr Standort wurde noch nicht geladen");
      return;
    }

    const data = {
      lat: geoLocation.latitude,
      lng: geoLocation.longitude,
      models: placedModels,
    }

    const sceneData = JSON.stringify(data, null, 1);
    const blob = new Blob([sceneData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.json";
    a.style.display = "none";
  
    document.body.appendChild(a);
    a.click();
  
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function loadSceneFromFile(loadedData) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json';

  fileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      const fileName = file ? file.name : "Keine Datei ausgewählt"
      if (!file) {
          console.log("Keine Datei ausgewählt");
          return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
          try {
              const sceneData = JSON.parse(e.target.result);
              loadedData(sceneData, fileName);
          } catch (error) {
              console.error("Fehler beim Verarbeiten der Datei:", error);
          }
      };

      reader.readAsText(file);
  });
  fileInput.click();
}