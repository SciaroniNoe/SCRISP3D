<template>
  <aside class="sidebarInfo">
    <h2>Informations sur le tracé</h2>

    <div v-if="store.selectedTrace" class="info-container">
      <div class="info-item">
        <span class="label">Nom</span>
        <span class="value">{{ store.selectedTrace.name }}</span>
      </div>

      <div class="info-item">
        <span class="label">Longueur</span>
        <span class="value">{{ (store.selectedTrace.length_m / 1000).toFixed(2) }} km</span>
      </div>

      <div class="info-item dual-row">
        <div class="dual-col">
          <span class="label">Altitude départ</span>
          <span class="value">{{ store.selectedTrace.h_start_m.toFixed(1) }} m</span>
        </div>

        <div class="dual-col">
          <span class="label">Altitude arrivée</span>
          <span class="value">{{ store.selectedTrace.h_end_m.toFixed(1) }} m</span>
        </div>
      </div>

      <div class="info-item">
        <span class="label">Différence d'altitude</span>
        <span class="value">{{ store.selectedTrace.elevation_difference_m.toFixed(1) }} m</span>
      </div>
      

      <div class="info-item dual-row">
        <div class="dual-col">
          <span class="label">Dénivelé positif</span>
          <span class="value">{{ store.selectedTrace.positive_elevation_m.toFixed(1) }} m</span>
        </div>

        <div class="dual-col">
          <span class="label">Dénivelé négatif</span>
          <span class="value">{{ store.selectedTrace.negative_elevation_m.toFixed(1) }} m</span>
        </div>
      </div>

      <div class="chart-section">
        <h3>Profil altimétrique</h3>
        <div class="chart-placeholder">
          <canvas></canvas>
        </div>
      </div>

      <div class="action-buttons">
        <button class="action-btn edit-btn">Modifier</button>
        <button class="action-btn delete-btn">Supprimer</button>

      </div>
    </div>

    <p v-else class="empty-message">Aucun tracé sélectionné.</p>
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

.info-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  background-color: white;
  border: 1px solid #1976d2;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.dual-row {
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
}

.dual-col {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 4px;
}

.value {
  font-size: 0.95rem;
  color: #333;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: white;
  transition: all 0.2s;
}

.delete-btn {
  background-color: #e53935;
}

.delete-btn:hover {
  background-color: #c62828;
}

.edit-btn {
  background-color: #1976d2;
}

.edit-btn:hover {
  background-color: #1259a7;
}

.empty-message {
  text-align: center;
  color: #555;
  margin-top: 20px;
}

.chart-placeholder canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-section {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-section h3 {
  color: #1976d2;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.chart-placeholder {
  width: 100%;
  height: 180px;
  background-color: white;
  border: 1px solid #1976d2;
  border-radius: 6px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}
</style>