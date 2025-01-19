/* ========================= */
/*   DEBUGGING UND START     */
/* ========================= */
if (navigator.xr) {
    let sceneData;
    const startButton = document.createElement('button');
    startButton.textContent = 'Start AR';
    startButton.style.cssText = "position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%); padding: 15px; font-size: 18px;";
    document.body.appendChild(startButton);
    startButton.onclick = () => {
        startButton.remove();
        loadButton.remove();
        activateXR(sceneData);
    };

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Umgebung Laden';
    loadButton.style.cssText = "position: fixed; top: 55%; left: 50%; transform: translate(-50%, -50%); padding: 15px; font-size: 18px;";
    document.body.appendChild(loadButton);
    loadButton.onclick = () => {
        loadSceneFromFile((data, fileName) => {
            if (data && fileName) {
                loadButton.textContent = fileName;
                sceneData = data
            } else {
                loadButton.textContent = 'Umgebung Laden';
            }
        });
    };
  } else {
    alert('WebXR wird nicht unterstützt.');
  }