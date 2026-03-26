// Sidebar.vue
// Affiche la liste des tracés et les détails du tracé sélectionné
// Connecté au store Pinia pour lire les données globales
<!--  TEST  -->
<template>
  <aside class="sidebarInfo">
    <h2>Informations sur le tracé</h2>
  </aside>
</template>

<script setup>
import { usestore } from '@/stores/store'

const store = usestore()
</script>

<style scoped>
h2 {
  color: #1976d2;
  font-weight: 700;
  text-align: center;
  margin-top: 10px;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
}

.sidebarInfo {
  width: 200px;
  background-color: #cbe9ff;
  padding: 20px;
  padding-top: 60px;
  height: 100vh;
  transition: all 0.3s ease;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
</style>
