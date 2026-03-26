<template>
  <div class="app-wrapper">
    <button class="burger-btn" @click="store.isSidebarOpen = !store.isSidebarOpen">
      <span v-if="store.isSidebarOpen">✕</span>
      <span v-else>☰</span>
    </button>

    <SidebarInfo :class="{ 'is-closed': !store.isSidebarOpen }" class="floating-sidebarinfo" />
    <SidebarList :class="{ 'is-closed': !store.isSidebarOpen }" class="floating-sidebar" />

    <main class="main-content">
      <MapContainer />
      <CreateTraceButton @trigger-create="store.isCreatePopupOpen = true" />
      <CreateTracePopup v-if="store.isCreatePopupOpen" @close="store.isCreatePopupOpen = false" />
    </main>
  </div>
</template>

<script setup>
import { usestore } from '@/stores/store'
import SidebarInfo from './components/layout/SidebarInfo.vue'
import SidebarList from './components/layout/SidebarList.vue'
import MapContainer from './components/map/MapContainer.vue'
import CreateTraceButton from './components/ui/CreateTraceButton.vue';
import CreateTracePopup from './components/ui/CreateTracePopup.vue';

const store = usestore()
const caca = 0
</script>

<style scoped>
.app-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.floating-sidebarinfo {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 300px;
  z-index: 498;
  background: white;
  box-shadow: 4px 0 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease-in-out;
}

.floating-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 300px;
  z-index: 499;
  background: #e3f2fd;
  box-shadow: 4px 0 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease-in-out;
}

/* Quando è chiusa, la sidebar scivola fuori dallo schermo a sinistra */
.floating-sidebar.is-closed {
  transform: translateX(-100%);
}
.floating-sidebarinfo.is-closed {
  transform: translateX(-100%);
}

.main-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* La mappa sta sotto tutto */
}

.burger-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000; /* Il livello più alto di tutti */
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
</style>
