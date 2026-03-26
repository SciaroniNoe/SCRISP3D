<template>
  <div class="app-wrapper">
    <button class="burger-btn" @click="store.isSidebarOpen = !store.isSidebarOpen">
      <span v-if="store.isSidebarOpen">✕</span>
      <span v-else>☰</span>
    </button>

    <SidebarList :class="{ 'is-closed': !store.isSidebarOpen }" />

    <main class="main-content">
      <MapContainer />
    </main>
  </div>
</template>

<script setup>
import { usestore } from '@/stores/store'
import SidebarList from './components/layout/SidebarList.vue'
import MapContainer from './components/map/MapContainer.vue'

const store = usestore()
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}


.burger-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.main-content {
  flex: 1;
  height: 100%;
  transition: all 0.3s ease; /* Animazione fluida quando la sidebar si sposta */
}
</style>
