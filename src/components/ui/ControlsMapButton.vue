<template>
    <div class="map-controls-wrapper">
        <div v-if="isLayerMenuOpen" class="layers-window">

            <h6 class="layer-group-title">Arrière-plan</h6>
            <div class="form-check form-switch" v-for="layer in store.backgroundLayers" :key="layer.id">
                <input class="form-check-input" type="radio" name="bgLayer" :id="layer.id" :checked="layer.active"
                    @change="store.setBackground(layer.id)">
                <label class="form-check-label" :for="layer.id">{{ layer.label }}</label>
            </div>

            <hr class="layer-divider">

            <h6 class="layer-group-title">Couches Swisstopo</h6>
            <div class="form-check form-switch" v-for="layer in store.extraLayers" :key="layer.id">
                <input class="form-check-input" type="checkbox" :id="layer.id" v-model="layer.active">
                <label class="form-check-label" :for="layer.id">{{ layer.label }}</label>
            </div>
        </div>

        <div class="buttons-stack">
            <button class="map-btn" :class="{ 'btn-active': isLayerMenuOpen }"
                @click="isLayerMenuOpen = !isLayerMenuOpen">
                <span class="btn-icon">L</span>
            </button>

            <button class="map-btn" :class="{ 'is-active-3d': store.is3dMode }"
                @click="store.is3dMode = !store.is3dMode">
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
    z-index: 2000;
}

.layers-window {
    background-color: #e3f2fdec;
    border: none;
    border-radius: 22.5px;
    padding-left: 22px;
    padding-top: 22px;
    padding-bottom: 14px;
    margin-right: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    height: 240px;
    min-width: 190px;
}

.layer-group-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 800;
    color: #1565c0;
    margin: 0px 0 8px 0;
}

.layer-divider {
    border: 0;
    border-top: 0px solid #bbdefb;
    margin: 12px 0;
}

.buttons-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
}


.map-btn {
    width: 45px;
    height: 45px;
    border-radius: 22.5px;
    border: none;
    background-color: #e3f2fd;
    color: #1976d2;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.map-btn:hover {
    background-color: #bbdefb;
}


.is-active-3d {
    background-color: #1976d2 !important;
    color: white !important;
}


.form-check {
    margin-bottom: 8px;
    font-size: 0.85rem;
    color: #333;
}

.btn-active {
    background-color: #1976d2 !important;
    color: white !important;
}

.form-check-input {
    cursor: pointer;
}
</style>