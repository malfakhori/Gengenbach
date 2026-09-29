/* ========================= */
/*   DEBUGGING UND START     */
/* ========================= */

let sceneData = null;
let sceneFileName = null;

let startButton = null;
let loadButton = null;

/* ============================================================ */
/* Create the Start AR / Load Scene buttons                     */
/* ============================================================ */

function showStartScreen() {
  // Prevent duplicate buttons
  if (startButton || loadButton) {
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

    // Reset references
    startButton = null;
    loadButton = null;

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
}

/* ========================= */
/*       INITIAL START        */
/* ========================= */

if (navigator.xr) {
  showStartScreen();
} else {
  alert("WebXR wird nicht unterstützt.");
}
