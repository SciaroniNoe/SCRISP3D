<template>
  <div class="popup-overlay" @click.self="emit('close')">
    <div class="popup-content">
      <button class="close-btn" @click="emit('close')" aria-label="Fermer">✕</button>

      <header>
        <h3>Créer un tracé</h3>
      </header>

      <div class="form-group">
        <label for="trace-name">Nom :</label>
        <input id="trace-name" type="text" v-model="traceName" placeholder="Entrez le nom du tracé" />
      </div>

      <input type="file" ref="fileInput" style="display: none" accept=".gpx" @change="handleFileSelect" />

      <div class="import-zone">
        <p v-if="!selectedFile">Optionnel : importez un fichier GPX pour créer le tracé</p>
        <p v-else style="color: #2e7d32; font-weight: bold;">✅ {{ selectedFile.name }}</p>

        <div class="icon-container">
          <div class="drop-icon" @click="$refs.fileInput.click()">
            <svg width="40" height="40" viewBox="0 0 24 24" class="gpx-svg">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            <span>GPX</span>
          </div>
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
import { usestore } from '@/stores/store'
import { geoUtils } from '@/services/geoUtils'
import { swisstopoService } from '@/services/swisstopo'

const store = usestore();
const traceName = ref('TEST');
const selectedFile = ref(null);
const emit = defineEmits(['close']);

// Quand on sélectionne un fichier, on le stocke dans selectedFile
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) selectedFile.value = file;
};

// Quand on clique sur "Créer", on traite le fichier GPX s'il y en a un, sinon on passe en mode dessin manuel
const submitTrace = async () => {
  if (selectedFile.value) {
    // Si un fichier GPX est sélectionné :
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const coordinates = await geoUtils.parseGPX(text);

        const profileZValues = await swisstopoService.getLineProfile(coordinates);
        const totalLength = geoUtils.calculateTotalLength(coordinates);
        const gains = geoUtils.calculateElevationGains(profileZValues);

        if (!profileZValues || profileZValues.length === 0) {
          alert("Impossible de récupérer les données d'altitude pour ce tracé.");
          return;
        }

        const newTrace = {
          id: Date.now(),
          name: traceName.value,
          geometry: coordinates,
          h_start_m: profileZValues[0],
          h_end_m: profileZValues[profileZValues.length - 1],
          length_m: totalLength,
          elevation_difference_m: parseFloat((profileZValues[profileZValues.length - 1] - profileZValues[0]).toFixed(1)),
          positive_elevation_m: gains.positiveElevationGain,
          negative_elevation_m: gains.negativeElevationGain
        };
        store.addTrace(newTrace);
        store.selectedTraceId = newTrace.id;
        store.isSidebarInfoOpen = true;
        store.isSidebarOpen = true;

        emit('close');
      } catch (err) {
        alert("Erreur GPX");
      }
    };
    reader.readAsText(selectedFile.value);
  } else {
    // Sinon on passe en mode création manuelle (dessin sur la carte)
    store.triggerDraw(traceName.value);
    emit('close');
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
  position: relative;
  width: 350px;
  padding: 20px;
  border: 2px solid #1976d2;
  border-radius: 22.5px;
  background-color: #daeffde7;
  color: #1976d2;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  font-weight: 600;
}

header h3 {
  color: #1976d2;
  font-size: 24px;
  margin: 10px 0 20px 0;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex-grow: 1;
  padding: 5px 15px;
  border: 1px solid #a0c4ff;
  border-radius: 15px;
  background-color: #ffffff;
  outline: none;
}

.import-zone {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #a0c4ff;
  border-radius: 15px;
  background-color: #f8faff;
}

.import-zone p {
  font-size: 0.8rem;
  color: #8d8d8d;
  margin-bottom: 10px;
}

.icon-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.drop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;
  color: #a0c4ff;
  width: fit-content;
  padding: 5px 12px;
  border-radius: 10px;
}

.gpx-svg {
  fill: #a0c4ff;
  transition: fill 0.2s ease;
}

.drop-icon span {
  font-weight: bold;
  font-size: 0.8rem;
  transition: color 0.2s ease;
}

.drop-icon:hover {
  color: #1976d2;
}

.drop-icon:hover .gpx-svg {
  fill: #1976d2;
}

.popup-actions {
  display: flow-root;
  margin-top: 10px;
}

.btn-create {
  float: right;
  padding: 8px 30px;
  border: none;
  border-radius: 15px;
  background-color: #755edd;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-create:hover {
  background-color: #563cc7;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  padding: 5px;
  border: none;
  background: none;
  color: #666;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #ff0000;
}
</style>