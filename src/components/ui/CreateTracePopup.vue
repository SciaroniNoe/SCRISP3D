<template>
  <div class="popup-overlay"> @click.self="emit('close')">
    <div class="popup-content">
      <button class="close-btn" @click="emit('close')" aria-label="Fermer">✕</button>

      <header>
        <h3>Créer un tracé</h3>
      </header>

      <div class="form-group">
        <label for="trace-name">Nom :</label>
        <input
          id="trace-name"
          type="text"
          v-model="traceName"
          placeholder="Entrez le nom du tracé"
        />
      </div>

      <div class="import-zone">
        <p>Optionnel : importez un fichier GPX pour créer le tracé</p>
        <div class="drop-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#4A90E2">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <span>GPX</span>
        </div>
      </div>

      <footer class="popup-actions">
        <button class="btn-create" @click="submitTrace">Créer</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const traceName = ref('TEST'); // Valeur par défaut visible sur le schéma [cite: 12]
const emit = defineEmits(['close', 'confirm']);

const submitTrace = () => {
  if (traceName.value.trim()) {
    emit('confirm', traceName.value);
    // Logique pour passer à l'étape suivante (InfoBoxEndTrace)
  }
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.popup-content {
  background: white;
  width: 350px;
  border-radius: 20px;
  border: 2px solid #ff00ff; /* Bordure rose distinctive du schéma */
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

header h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex-grow: 1;
  border-radius: 15px;
  border: 1px solid #a0c4ff;
  padding: 5px 15px;
  background-color: #eef4ff;
}

.import-zone {
  border: 1px solid #a0c4ff;
  border-radius: 15px;
  padding: 15px;
  background-color: #f8faff;
  margin-bottom: 20px;
}

.import-zone p {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 10px;
}

.drop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
  color: #4A90E2;
}

.btn-create {
  background-color: #ff9999; /* Couleur rosée/rouge du bouton "Créer" */
  border: none;
  border-radius: 15px;
  padding: 8px 30px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  float: right;
}

.btn-create:hover {
  background-color: #ff7777;
}

.popup-content {
  position: relative; /* Indispensable pour placer la croix par rapport au bord de la fenêtre */
  background: white;
  width: 350px;
  border-radius: 20px;
  border: 2px solid #ff00ff;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff00ff; /* Rappel de la couleur de ta bordure au survol */
}

</style>
