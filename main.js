import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import TileLayer from 'ol/layer/Tile.js';

// main.js
// Point d'entrée de l'application Vue
// - Initialise Vue
// - Configure Pinia
// - Charge Bootstrap


//TEST
import { swisstopoService } from './services/swisstopo.js';
// Test dell'API Height (Coordinate di Berna circa: 2600000, 1200000)
swisstopoService.getPointHeight(2600000, 1200000).then(height => {
  console.log("--- TEST SWISSTOPO ---");
  console.log("Altitude reçue:", height, "mètres");
});
const myTrace = [
  [2533000, 1152000], // Point A
  [2534000, 1153000], // Point B
  [2535000, 1152500]  // Point C
];
swisstopoService.getLineProfile(myTrace, 50).then(profileData => {
  if (profileData) {
    console.log("--- TEST PROFIL ALTIMÉTRIQUE ---");
    console.log(`Nombre de points reçus: ${profileData.length}`);
    console.log("Premier point:", profileData[0]);
    // Calcule le dénivelé total simple (max - min)
    const altitudes = profileData.map(p => p.alts.DTM25 || p.alts.DTM10);
    const maxAlt = Math.max(...altitudes);
    const minAlt = Math.min(...altitudes);
    console.log(`Dénivelé brut: ${maxAlt - minAlt}m`);
  }
});
const myTrace_4_export_test = [
  [2704381.020, 1117503.490],
  [2704325.100, 1118540.360],
  [2705053.800, 1119930.210]
];
//const url = swisstopoService.getCSVProfileURL(myTrace_4_export_test);
console.log("Clicca qui per scaricare il CSV:", url);
window.open(url, '_blank');


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