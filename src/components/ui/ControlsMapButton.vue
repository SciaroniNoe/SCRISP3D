<template>
  <div class="map-controls-wrapper">
    <div v-if="isLayerMenuOpen" class="layers-window">
      <h6 class="layer-title">Couches Swisstopo</h6>
      
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="layerOrtho">
        <label class="form-check-label" for="layerOrtho">Orthophoto</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="layerCN" checked>
        <label class="form-check-label" for="layerCN">Carte Nationale</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="layerPente">
        <label class="form-check-label" for="layerPente">Pentes (>30°)</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="layerRelief">
        <label class="form-check-label" for="layerRelief">Relief</label>
      </div>
    </div>

    <div class="buttons-stack">
      <button class="map-btn" @click="isLayerMenuOpen = !isLayerMenuOpen" title="Layers">
        <span class="btn-icon">L</span>
      </button>

      <button 
        class="map-btn" 
        :class="{ 'is-active-3d': store.is3dMode }"
        @click="store.is3dMode = !store.is3dMode"
      >
        3D
      </button>

      <button class="map-btn">+</button>
      <button class="map-btn">-</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usestore } from '@/stores/store'

const store = usestore()
const isLayerMenuOpen = ref(false)
</script>

<style scoped>
.map-controls-wrapper {
  position: absolute;
  bottom: 30px;
  right: 20px;
  display: flex;
  align-items: flex-end;
  z-index: 2000; /* Sopra la mappa */
}

/* Finestra celeste dei layer */
.layers-window {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 12px;
  padding: 15px;
  margin-right: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  min-width: 180px;
}

.layer-title {
  margin-bottom: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #1565c0;
}

.buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Classe Parente per tutti i bottoni */
.map-btn {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background-color: #e3f2fd; /* Celeste chiaro */
  color: #1976d2;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* Hover: scurisce lo sfondo */
.map-btn:hover {
  background-color: #bbdefb;
}

/* Quando il 3D è attivo, cambiamo colore per feedback visivo */
.is-active-3d {
  background-color: #1976d2 !important;
  color: white !important;
}

/* Checkbox stile Bootstrap (semplificato) */
.form-check {
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #333;
}
</style>