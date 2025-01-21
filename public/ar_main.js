/* ========================= */
/*    GLOBALE VARIABLEN      */
/* ========================= */
let selectedPlacedModel = null;
let currentSession = null;
let reticle = null;
let scene, camera;
let geoLocation;
const menus = ['menu-bar', 'add-menu', 'edit-menu', 'options-menu', 'map-window'];

/* ========================= */
/*          MODELLE          */
/* ========================= */
let models = {
    bench: {
        name: "Bench",
        image: "assets/previewImages/bench.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/bench_model/scene.gltf",
        scale: { x: 0.1, y: 0.1, z: 0.1 },
        minScale: 0.05,
        maxScale: 0.5
    },
    trashbin: {
        name: "Trash bin",
        image: "assets/previewImages/trash_can.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/trash_model/scene.gltf",
        scale: { x: 0.03, y: 0.03, z: 0.03 },
        minScale: 0.01,
        maxScale: 0.1
    },
    lantern: {
        name: "Lantern",
        image: "assets/previewImages/park_light.png",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/park_light_model/scene.gltf",
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        minScale: 0.2,
        maxScale: 5
    },
    telephone_box: {
        name: "Telephone Box",
        image: "assets/previewImages/telephone_box.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/telephone_box_model/scene.gltf",
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        minScale: 0.05,
        maxScale: 1
    },
    fire_hydrant_model: {
        name: "Fire Hydrant",
        image: "assets/previewImages/hydrant.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/fire_hydrant_model/scene.gltf",
        scale: { x: 0.3, y: 0.3, z: 0.3 },
        minScale: 0.1,
        maxScale: 1
    },
    statue: {
        name: "Statue",
        image: "assets/previewImages/statue.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/statue_model/scene.gltf",
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        minScale: 0.05,
        maxScale: 2
    },
    fountain: {
        name: "Fountain",
        image: "assets/previewImages/fountain.PNG",
        file: "https://transfer.hft-stuttgart.de/gitlab/geovistoogsi/ar/-/raw/master/public/assets/models/fountain_model/scene.gltf",
        scale: { x: 0.001, y: 0.001, z: 0.001 },
        minScale: 0.0005,
        maxScale: 0.005
    }
};

/* ========================= */
/*     INITIALISIERUNG       */
/* ========================= */
window.onload = () => {
    initializeAddMenu();

    // Allen Buttons den Sound hinzufügen
    const buttons = document.querySelectorAll("button, .menu-item");
    buttons.forEach(button => {
        button.addEventListener("click", playButtonSound);
    });
};

function initializeAddMenu() {
    const addMenu = document.getElementById('add-menu');
    addMenu.innerHTML = Object.entries(models)
        .map(
            ([key, model]) => `
            <div class="menu-item" id="${key}-item" onclick="selectModel('${key}')">
              <img src="${model.image}" alt="${model.name}" />
            </div>
          `
        )
        .join('') +
        `
        <div class="menu-item" onclick="showMenu('menu-bar')">
          <img src="assets/icons/back-icon.png" alt="Zurück" />
        </div>
      `;
}

/* ========================= */
/*     MENÜ-STEUERUNG        */
/* ========================= */
function showMenu(menuId) {
    const isMapWindow = menuId === 'map-window';
    if (isMapWindow && !geoLocation) {
        console.log("Standort nicht geladen");
        showInfoDialog("Ihr Standort wurde noch nicht geladen");
        return;
    }

    menus.forEach(id => {
        document.getElementById(id).style.display = id === menuId ? 'flex' : 'none';
    });
    closeDynamicMenu();
    if (menuId === 'menu-bar') clearSelectedModel();
    else if (isMapWindow) init_map();
}

function closeDynamicMenu() {
    const dynamicMenu = document.getElementById("dynamic-menu");
    dynamicMenu.style.display = "none";
}

/* ========================= */
/*     MODELL-HANDLING       */
/* ========================= */
function getAllPlacedModels() {
    return scene.children.filter(child => child.isPlacedModel === true);
}

function loadModel(filePath) {
    placeModel(filePath, reticle.position, (model) => {
        selectedPlacedModel = model;
        highlightSelectedModel();
        showMenu('edit-menu');
    });
}

function placeModel(filePath, position, onPlace = null) {
    const modelConfig = Object.values(models).find(model => model.file === filePath);
    const loader = new THREE.GLTFLoader();
    loader.load(
        filePath,
        (gltf) => {
            const model = gltf.scene;
            if (modelConfig && modelConfig.scale) {
                model.scale.set(modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z);
            }
            model.position.copy(position);
            model.isPlacedModel = true;
            model.modelConfig = modelConfig;
            scene.add(model);

            if (onPlace) {
                onPlace(model);
            }
        },
        undefined,
        (error) => {
            console.error("Fehler beim Laden des Modells:", error);
        }
    );
}

function selectModel(modelId) {
    const model = models[modelId];
    if (model && model.file) {
        loadModel(model.file);
        showMenu('menu-bar');
    }
}

function selectModelFromScene(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Prüfe Kollisionen mit Objekten in der Szene
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // Finde das Hauptobjekt (Root-Parent), falls Mesh ausgewählt wurde
        let selectedObject = intersects[0].object;
        while (selectedObject.parent && selectedObject.parent !== scene) {
            selectedObject = selectedObject.parent;
        }

        // Überprüfe, ob das ausgewählte Objekt das Reticle ist
        if (selectedObject === reticle) {
            console.log("Reticle kann nicht ausgewählt werden.");
            return;
        }

        // Markiere das gesamte Modell als ausgewählt
        selectedPlacedModel = selectedObject;
        highlightSelectedModel();
        showMenu("edit-menu");
    }
}

function clearSelectedModel() {
    if (selectedPlacedModel) {
        selectedPlacedModel.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive.setHex(0x000000); // Markierung entfernen
            }
        });
        selectedPlacedModel = null;
    }
}

function highlightSelectedModel() {
    if (selectedPlacedModel) {
        removeHighlightFromAllModels();
        selectedPlacedModel.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive.setHex(0xff0000); // Rote Hervorhebung
            }
        });
    }
}

function removeHighlightFromSelectedModel() {
    if (selectedPlacedModel) {
        selectedPlacedModel.traverse((child) => {
            if (child.isMesh) child.material.emissive.setHex(0x000000); // Markierung entfernen
        });
    }
}


function removeHighlightFromAllModels() {
    scene.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000); // Markierung entfernen
        }
    });
}

function deleteModel() {
    if (!selectedPlacedModel) {
        console.log("Kein Modell ausgewählt. Bitte wählen Sie ein Modell aus, bevor Sie es löschen.");
        return;
    }

    const deleteDialog = document.getElementById('delete-confirmation-dialog');
    deleteDialog.style.display = 'flex';
}

function confirmDelete(shouldDelete) {
    const deleteDialog = document.getElementById('delete-confirmation-dialog');
    deleteDialog.style.display = 'none';

    if (shouldDelete && selectedPlacedModel) {
        scene.remove(selectedPlacedModel);
        selectedPlacedModel = null;
        showMenu('menu-bar');
    }
}

function completeEditing() {
    removeHighlightFromSelectedModel();
    closeDynamicMenu();
    selectedPlacedModel = null;
    document.getElementById('edit-menu').style.display = 'none';
    document.getElementById('menu-bar').style.display = 'flex';
}

/* ========================= */
/*    BEARBEITUNGS-MENÜS     */
/* ========================= */
function openRotationMenu() {
    if (!selectedPlacedModel) {
        console.log("Kein Modell ausgewählt. Bitte wählen Sie ein Modell aus, bevor Sie es bearbeiten.");
        return;
    }

    const currentRotation = Math.round(THREE.MathUtils.radToDeg(selectedPlacedModel.rotation.y)); // Aktuelle Y-Rotation des Modells (in Grad)

    const dynamicMenu = document.getElementById("dynamic-menu");
    dynamicMenu.style.display = "flex";
    dynamicMenu.innerHTML = `
        <h3>Rotation anpassen</h3>
        <label>Y-Achse: <span id="current-rotation">${currentRotation}</span>°<input type="range" min="0" max="360" step="10" onchange="updateRotation('y', this.value)"></label>
        <button onclick="closeDynamicMenu()">Zurück</button>
      `;
}

function updateRotation(axis, value) {
    if (selectedPlacedModel) {
        const radians = (value / 180) * Math.PI;
        selectedPlacedModel.rotation[axis] = radians;

        // Anzeige der aktuellen Rotation im Dynamic-Menü aktualisieren
        const currentRotationDisplay = document.getElementById("current-rotation");
        if (currentRotationDisplay) {
            currentRotationDisplay.textContent = value; // Zeige den aktuellen Wert in Grad an
        }
    }
}

function openScaleMenu() {
    if (!selectedPlacedModel) {
        console.log("Kein Modell ausgewählt. Bitte wählen Sie ein Modell aus, bevor Sie es bearbeiten.");
        return;
    }

    // Aktuelle Skalierung und Grenzen bestimmen
    const currentScale = selectedPlacedModel.scale.x;
    const minScale = selectedPlacedModel.modelConfig.minScale;
    const maxScale = selectedPlacedModel.modelConfig.maxScale;
    const step = (maxScale - minScale) / 100; // Dynamische Schrittgröße basierend auf Grenzen

    const currentScalePercent = ((currentScale - minScale) / (maxScale - minScale)) * 100; // Umrechnung der Werte in Prozent

    const dynamicMenu = document.getElementById("dynamic-menu");
    dynamicMenu.style.display = "flex";
    dynamicMenu.innerHTML = `
        <h3>Skalierung anpassen</h3>
        <label>Größe: <span id="scale-value">${currentScalePercent.toFixed(0)}%</span>
        <input type="range" min="0" max="100" step=""${step}"" value="${currentScalePercent}" onchange="updateScale(this.value, ${minScale}, ${maxScale})"></label>
        <button onclick="closeDynamicMenu()">Zurück</button>
      `;
}

function updateScale(percentValue, minScale, maxScale) {
    if (selectedPlacedModel) {
        // Berechnung der Skalierung basierend auf dem Prozentwert
        const scale = minScale + (percentValue / 100) * (maxScale - minScale);
        selectedPlacedModel.scale.set(scale, scale, scale);

        // Anzeige des aktuellen Prozentsatzes im Dynamic-Menü aktualisieren
        const scaleValueDisplay = document.getElementById("scale-value");
        if (scaleValueDisplay) {
            scaleValueDisplay.textContent = `${parseInt(percentValue, 10)}%`;
        }
    }
}

let moveDelta = 0.1; // Standardwert für die Verschiebungsgröße, kann mit dem Slider geändert werden

function openMoveMenu() {
    if (!selectedPlacedModel) {
        console.log("Kein Modell ausgewählt. Bitte wählen Sie ein Modell aus, bevor Sie es bewegen.");
        return;
    }

    const dynamicMenu = document.getElementById("dynamic-menu");
    dynamicMenu.style.display = "flex";
    dynamicMenu.innerHTML = `
        <h3>Position anpassen</h3>
        <label>Verschiebungsgröße: <span id="move-delta-display">${moveDelta.toFixed(2)}</span>
        <input type="range" min="0.01" max="1.0" step="0.01" value="${moveDelta}" onchange="updateMoveDelta(this.value)"></label>
        <div id="button-controls">
            <button class="control-button" id="up" onclick="moveModelDynamic('z', -moveDelta)">↑</button>
            <div class="middle-row">
                <button class="control-button" id="left" onclick="moveModelDynamic('x', -moveDelta)">←</button>
                <div class="spacer"></div>
                <button class="control-button" id="right" onclick="moveModelDynamic('x', moveDelta)">→</button>
            </div>
            <button class="control-button" id="down" onclick="moveModelDynamic('z', moveDelta)">↓</button>
        </div>
        <button onclick="closeDynamicMenu()">Zurück</button>
      `;
}

function updateMoveDelta(value) {
    moveDelta = parseFloat(value);
    const moveDeltaDisplay = document.getElementById("move-delta-display");
    if (moveDeltaDisplay) {
        moveDeltaDisplay.textContent = moveDelta.toFixed(2);
    }
}

function moveModelDynamic(axis, value) {
    if (selectedPlacedModel) selectedPlacedModel.position[axis] += value;
}


/* ========================= */
/*      KARTENSTEUERUNG      */
/* ========================= */
function refreshMapDialog() {
    const mapDialog = document.getElementById('map-dialog');
    mapDialog.style.display = 'flex';
}

function closeMapDialog() {
    const mapDialog = document.getElementById('map-dialog');
    mapDialog.style.display = 'none';
}

/* ========================= */
/*        AR-HANDLING        */
/* ========================= */
async function activateXR(sceneData = null) {
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const gl = canvas.getContext('webgl', { xrCompatible: true });
    const renderer = new THREE.WebGLRenderer({ alpha: true, canvas, context: gl });
    renderer.autoClear = false;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    const loader = new THREE.GLTFLoader();
    loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", (gltf) => {
        reticle = gltf.scene;
        reticle.visible = false;
        scene.add(reticle);
    });

    currentSession = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body },
        requiredFeatures: ['hit-test']
    });

    currentSession.updateRenderState({ baseLayer: new XRWebGLLayer(currentSession, gl) });
    const referenceSpace = await currentSession.requestReferenceSpace('local');
    const viewerSpace = await currentSession.requestReferenceSpace('viewer');
    const hitTestSource = await currentSession.requestHitTestSource({ space: viewerSpace });

    document.getElementById('menu-bar').style.display = 'flex';

    currentSession.addEventListener("end", () => {
        currentSession = null;
        document.getElementById("dynamic-menu").style.display = "none";
        menus.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
    });

    canvas.addEventListener("pointerdown", selectModelFromScene);


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            geoLocation = {
                latitude: roundTo(position.coords.latitude, 5),
                longitude: roundTo(position.coords.longitude, 5),
            };
            console.log("GeoLocation: " + JSON.stringify(geoLocation));
            if (sceneData) {
                sceneData.models.forEach((model) => {
                    if (model.name) {
                        const filePath = Object.values(models).find(m => model.name === m.name).file;
                        const { x, z } = leafletToThree(model.lat, model.lng);
                        const positionVector = new THREE.Vector3(x, model.position.y, z);
                        placeModel(filePath, positionVector, (placed) => {
                            if (model.rotation) {
                                placed.rotation._x = model.rotation._x;
                                placed.rotation._y = model.rotation._y;
                                placed.rotation._z = model.rotation._z;
                            }
                            if (model.scale) {
                                placed.scale.x = model.scale.x;
                                placed.scale.y = model.scale.y;
                                placed.scale.z = model.scale.z;
                            }
                        });
                    }
                });
            }
        }, function (error) {
            console.error("Fehler bei der Geolokalisierung:", JSON.stringify(error));
        }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 });
    }

    currentSession.requestAnimationFrame(function onXRFrame(time, frame) {
        currentSession.requestAnimationFrame(onXRFrame);
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentSession.renderState.baseLayer.framebuffer);

        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
            const view = pose.views[0];
            const viewport = currentSession.renderState.baseLayer.getViewport(view);
            renderer.setSize(viewport.width, viewport.height);

            camera.matrix.fromArray(view.transform.matrix);
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.updateMatrixWorld(true);

            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hitPose = hitTestResults[0].getPose(referenceSpace);
                reticle.visible = true;
                reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
                reticle.updateMatrixWorld(true);
            }

            renderer.render(scene, camera);
        }
    });
}

function exitAR() {
    document.getElementById('confirmation-dialog').style.display = 'flex';
}

function confirmExit(shouldExit) {
    if (shouldExit && currentSession) currentSession.end();
    document.getElementById('confirmation-dialog').style.display = 'none';
}

/* ========================= */
/*   BENUTZERINTERAKTIONEN   */
/* ========================= */
let soundTimeout = false;
function playButtonSound() {
    if (!soundTimeout) {
        const sound = document.getElementById("button-sound");
        sound.currentTime = 0;
        sound.play();

        soundTimeout = true;
        setTimeout(() => {
            soundTimeout = false;
        }, 200); // Verzögerung von 200ms
    }
}
