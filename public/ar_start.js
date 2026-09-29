/* ========================= */
/*   DEBUGGING UND START     */
/* ========================= */

let sceneData = null;
let sceneFileName = null;

let startButton = null;
let loadButton = null;

let predefinedButton1 = null;
let predefinedButton2 = null;

/* ========================= */
/*   PREDEFINED SCENE        */
/* ========================= */

async function loadPredefinedScene(filePath, fileName) {
  try {
    const response = await fetch(filePath);
    const data = await response.json();

    sceneData = data;
    sceneFileName = fileName;

    console.log("Vordefinierte Szene geladen:", fileName);

  } catch (error) {
    console.error(
      "Fehler beim Laden der vordefinierten Szene:",
      error
    );
  }
}

/* ============================================================ */
/* Create the Start AR / Load Scene buttons                     */
/* ============================================================ */

function showStartScreen() {
  // Prevent duplicate buttons
  if (startButton || loadButton || predefinedButton1 || predefinedButton2) {
    return;
  }

  /* ========================= */
  /*       START AR            */
  /* ========================= */

  startButton = document.createElement("button");

  startButton.textContent = "Start AR";

  startButton.style.cssText =
    "position: fixed; " +
    "top: 45%; " +
    "left: 50%; " +
    "transform: translate(-50%, -50%); " +
    "padding: 15px; " +
    "font-size: 18px;";

  document.body.appendChild(startButton);

  /* ========================= */
  /*      LOAD SCENE            */
  /* ========================= */

  loadButton = document.createElement("button");

  loadButton.textContent = sceneFileName || "Umgebung Laden";

  loadButton.style.cssText =
    "position: fixed; " +
    "top: 55%; " +
    "left: 50%; " +
    "transform: translate(-50%, -50%); " +
    "padding: 15px; " +
    "font-size: 18px;";

  document.body.appendChild(loadButton);

  /* ========================= */
  /*       START AR CLICK       */
  /* ========================= */

startButton.onclick = () => {
  // Remove start-page buttons
  startButton.remove();
  loadButton.remove();
  predefinedButton1.remove();
  predefinedButton2.remove();

  // Reset references
  startButton = null;
  loadButton = null;
  predefinedButton1 = null;
  predefinedButton2 = null;

  // Start AR
  activateXR(sceneData);
};

  /* ========================= */
  /*      LOAD SCENE CLICK     */
  /* ========================= */

  loadButton.onclick = () => {
    loadSceneFromFile((data, fileName) => {
      if (data && fileName) {
        sceneData = data;
        sceneFileName = fileName;

        loadButton.textContent = fileName;
      } else {
        loadButton.textContent = sceneFileName || "Umgebung Laden";
      }
    });
  };
  /* ========================= */
  /*   PREDEFINED SCENE 1      */
  /* ========================= */

  predefinedButton1 = document.createElement("button");

  predefinedButton1.textContent = "Gengenbach Plaza";

  predefinedButton1.style.cssText =
    "position: fixed; " +
    "top: 65%; " +
    "left: 50%; " +
    "transform: translate(-50%, -50%); " +
    "padding: 15px; " +
    "font-size: 18px;";

  document.body.appendChild(predefinedButton1);

  predefinedButton1.onclick = async () => {
    await loadPredefinedScene(
      "scenes/gengenbach-plaza.json",
      "Gengenbach Plaza",
    );

    predefinedButton1.textContent = sceneFileName;
  };

  /* ========================= */
  /*   PREDEFINED SCENE 2      */
  /* ========================= */

  predefinedButton2 = document.createElement("button");

  predefinedButton2.textContent = "Gengenbach Street";

  predefinedButton2.style.cssText =
    "position: fixed; " +
    "top: 75%; " +
    "left: 50%; " +
    "transform: translate(-50%, -50%); " +
    "padding: 15px; " +
    "font-size: 18px;";

  document.body.appendChild(predefinedButton2);

  predefinedButton2.onclick = async () => {
    await loadPredefinedScene(
      "scenes/gengenbach-street.json",
      "Gengenbach Street",
    );

    predefinedButton2.textContent = sceneFileName;
  };
}

/* ========================= */
/*       INITIAL START        */
/* ========================= */

if (navigator.xr) {
  showStartScreen();
} else {
  alert("WebXR wird nicht unterstützt.");
}
