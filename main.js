import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import TileLayer from 'ol/layer/Tile.js';

// URL per le capacità WMTS di Swisstopo
const capabilitiesUrl = 'https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=it';

async function initMap() {
  const response = await fetch(capabilitiesUrl);
  const text = await response.text();
  const result = new WMTSCapabilities().read(text);

  // Configurazione del layer Swisstopo richiesto: ch.swisstopo.landeskarte-farbe-10
  const options = optionsFromCapabilities(result, {
    layer: 'ch.swisstopo.landeskarte-farbe-10',
    matrixSet: 'EPSG:3857',
  });

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new WMTS(options),
      })
    ],
    view: new View({
      center: [917900, 5906000], // Centrato sulla Svizzera
      zoom: 8,
    }),
  });


  let is3D = false; // Stato iniziale: siamo in 2D

  const btn3D = document.getElementById('switch-3d');

  btn3D.addEventListener('click', () => {
    if (is3D) {
      // Se è già in 3D, torniamo al 2D
      console.log("Passaggio alla modalità 2D...");
      btn3D.innerText = "3D";
      // Qui andrà la logica per disattivare Cesium
    } else {
      // Se siamo in 2D, passiamo al 3D
      console.log("Passaggio alla modalità 3D...");
      btn3D.innerText = "2D";
      // Qui andrà la logica per attivare Cesium
    }

    // Invertiamo lo stato
    is3D = !is3D;
  });
}

initMap().catch(err => console.error("Errore nel caricamento della mappa:", err));