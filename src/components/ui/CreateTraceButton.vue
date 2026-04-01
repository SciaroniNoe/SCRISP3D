// CreateTraceButton.vue
// Popup Bootstrap pour créer un nouveau tracé
// L'utilisateur doit entrer un nom (obligatoire)
// Appelle une action du store pour créer un tracé vide

<template>
  <div class="button-container" :class="{ 'is-shifted': isShifted }">
    <button class="create-trace-btn" @click="handleCreate">
      Créer un tracé
    </button>
  </div>
</template>

<script setup>
// On définit la prop reçue du parent
defineProps({
  isShifted: Boolean
});

const emit = defineEmits(['trigger-create']);

const handleCreate = () => {
  emit('trigger-create');
};
</script>

<style scoped>
.button-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 500;
  /* Utilise transform pour une animation plus fluide que 'left' */
  transition: transform 0.3s ease-in-out;
}

.create-trace-btn {
  background-color: #a0c4ff;
  color: #003366;
  border: 1px solid #7094db;
  border-radius: 20px;
  padding: 8px 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
</style>
