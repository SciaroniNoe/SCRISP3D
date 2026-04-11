<template>
  <aside class="sidebar">
    <h2>Liste des tracés</h2>

    <div class="trace-container">
      <div v-for="trace in store.traces" :key="trace.id" class="trace-item">
        <button class="trace-button" :class="{ active: store.selectedTraceId === trace.id }"
          @click="store.selectTrace(trace.id)">
          <span class="trace-name">{{ trace.name }}</span>
          <small>{{ (trace.length_m / 1000).toFixed(2) }} km</small>
        </button>
      </div>
    </div>

    <p v-if="store.traces.length === 0">Aucun tracé disponible.</p>
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

.sidebar {
  width: 200px;
  background-color: #bbdefb;
  padding: 20px;
  padding-top: 60px;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.sidebar.is-closed {
  margin-left: -240px;
  opacity: 0;
}

.trace-button {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 8px;
  background-color: white;
  border: 2px solid #1976d2;
  border-radius: 120px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
  color: #1976d2;
}

.trace-button:hover {
  background-color: #bbdefb;
}

.trace-button.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.trace-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 2px;
}

small {
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>