<template>
  <div class="info-box-container">
    <div class="info-box-content">
      <h3 class="info-title">Instructions</h3>
      <ul class="info-list">
        <li><strong>Clic gauche :</strong> Ajouter un sommet</li>
        <li><strong>Double-clic :</strong> Terminer le tracé</li>
        <li><strong>Delete :</strong> Annuler le dernier point</li>
        <hr class="separator" />
        <li><strong>Glisser un sommet :</strong> Modifier la position</li>
        <li><strong>Glisser le point milieu :</strong> Ajouter un nouveau sommet</li>
        <li><strong>Alt + Clic :</strong> Supprimer un sommet</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.info-box-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 350px;
  pointer-events: none; /* Permet de cliquer à travers si nécessaire */
}

.info-box-content {
  background-color: #daeffde7;
  padding: 15px;
  border-radius: 22.5px;
  box-shadow: 0 4px 12px #0000002a;
  border: 2px solid #1976d2;
}

.info-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #1976d2;
  font-weight: bold;
}

.info-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.6;
  color: #555;
}

.separator {
  margin: 8px 0;
  border: 0;
  border-top: 0px solid #ddd;
}
</style>