<template>
  <div class="button-container" :class="{ 'is-shifted': isShifted }">
    <button class="create-trace-btn" @click="handleCreate">
      Créer un tracé
    </button>
  </div>
</template>

<script setup>
import { usestore } from '@/stores/store'
const store = usestore()
// On définit la prop reçue du parent
defineProps({
  isShifted: Boolean
});

const emit = defineEmits(['trigger-create']);

const handleCreate = () => {
  store.is3dMode = false;
  emit('trigger-create');
};
</script>

<style scoped>
.button-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 500;
  transition: transform 0.3s ease-in-out;
}

.create-trace-btn {
  font-size: 16px;
  height: 45px;
  align-items: center;
  justify-content: center;
  border: 2px solid #1976d2;
  background-color: #daeffde7;
  color: #1976d2;
  font-weight: bold;
  border-radius: 22.5px;
  padding: 0 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.create-trace-btn:hover {
    background-color: #bbdefb;
}
</style>
