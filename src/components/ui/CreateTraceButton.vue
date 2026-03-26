// CreateTraceButton.vue
// Popup Bootstrap pour créer un nouveau tracé
// L'utilisateur doit entrer un nom (obligatoire)
// Appelle une action du store pour créer un tracé vide


<template>
  <div class="button-container">
    <button class="create-trace-btn" @click="handleCreate">
      Créer un tracé
    </button>
  </div>
</template>

<script setup>
// Vous pouvez émettre un événement pour signaler au parent
// (comme MapContainer.vue) d'ouvrir la popup CreateTracePopup.vue
const emit = defineEmits(['trigger-create']);

const handleCreate = () => {
  console.log("Ouverture du formulaire de tracé...");
  emit('trigger-create');
};
</script>

<style scoped>
.button-container {
  /* Positionnement en bas à gauche comme sur l'image */
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  /* Transition fluide pour le mouvement */
  transition: left 0.2s ease-in-out;
}

/* Position décalée quand la sidebar est ouverte */
/* Ajustez '320px' selon la largeur réelle de votre SidebarList.vue */
.button-container.is-shifted {
  left: 1000px;
}

.create-trace-btn {
  /* Style visuel basé sur le schéma  */
  background-color: #a0c4ff; /* Bleu clair observé */
  color: #003366;           /* Texte foncé pour le contraste */
  border: 1px solid #7094db;
  border-radius: 20px;      /* Aspect très arrondi (pill button) */
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: background-color 0.3s ease;
}

.create-trace-btn:hover {
  background-color: #8db5f2;
}
</style>
