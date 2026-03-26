<template>
  <div class="map-placeholder">
    <p>Zone Carte 2D (OpenLayers)</p>
  </div>
</template>

<style scoped>
.map-placeholder {
  width: 100%;
  height: 100%;
  background-color: #ffbbbb; /* Verde chiaro */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7d2e2e;
  font-weight: bold;
}
</style>

<!-- 
<template>
  <div ref="mapElement" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import TileLayer from 'ol/layer/Tile.js';

const mapElement = ref(null); // Référence au div HTML

onMounted(async () => {
  const capabilitiesUrl = 'https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=it';
  
  try {
    const response = await fetch(capabilitiesUrl);
    const text = await response.text();
    const result = new WMTSCapabilities().read(text);

    const options = optionsFromCapabilities(result, {
      layer: 'ch.swisstopo.landeskarte-farbe-10',
      matrixSet: 'EPSG:3857',
    });

    // On crée la carte OL
    new Map({
      target: mapElement.value, // On utilise la référence Vue
      layers: [
        new TileLayer({
          source: new WMTS(options),
        })
      ],
      view: new View({
        center: [917900, 5906000],
        zoom: 8,
      }),
    });
  } catch (err) {
    console.error("Erreur OpenLayers:", err);
  }
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background-color: #e8f5e9;
}
</style> -->