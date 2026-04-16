import { defineStore } from 'pinia'

export const usestore = defineStore('trace', {
  state: () => {

    const savedTraces = localStorage.getItem('my_traces')

    return {
      traces: savedTraces ? JSON.parse(savedTraces) : [],

      selectedTraceId: null,
      hoveredPointIndex: null,

      isSidebarOpen: false,
      isSidebarInfoOpen: false,
      isCreatePopupOpen: false,

      isDrawingActive: false,
      drawingTrigger: 0,
      tempTraceName: '',

      is3dMode: false,

      currentProfileLength: 0,

      cameraPosition: {
        center: [2677489, 1184863],
        zoom: 2,      // OpenLayers
        height: 10000,  // Cesium [m]
        pitch: -90    // inclinaison [deg]
      },

      backgroundLayers: [
        { id: 'layerOrtho', label: 'Orthophoto', wmts: 'ch.swisstopo.swissimage', in3dModeTypeLayer: 'wmts', active: false },
        { id: 'layerCN', label: 'Carte Nationale', wmts: 'ch.swisstopo.pixelkarte-farbe', in3dModeTypeLayer: 'wmts', active: true },
        { id: 'layerRelief', label: 'Relief multidirectionnel', wmts: 'ch.swisstopo.swisssurface3d-reliefschattierung-multidirektional', in3dModeTypeLayer: 'wms', active: false },
        { id: 'layerMO', label: 'Mensuration Officielle', wmts: 'ch.kantone.cadastralwebmap-farbe', in3dModeTypeLayer: 'wms', active: false }
      ],

      extraLayers: [
        { id: 'layerPente', label: 'Pentes (>30°)', wmts: 'ch.swisstopo-karto.hangneigung', active: false, opacity: 0.4 }, // Theo tu prefer ch.swisstopo.hangneigung-ueber_30?
        { id: 'layerRandonnee', label: 'Chemins de randonnée', wmts: 'ch.swisstopo.swisstlm3d-wanderwege', active: false, opacity: 1.0 }
      ],

      extraLayers3D: [
        { id: 'batiments', label: 'Bâtiments 3D', active: false }
      ]

    }
  },

  getters: {
    // Récupère la couche de fond actuellement activée
    selectedBackground: (state) => state.backgroundLayers.find(layer => layer.active),

    // Trouve l'objet complet de la trace sélectionnée via son ID
    selectedTrace: (state) => state.traces.find(trace => trace.id === state.selectedTraceId)
  },

  actions: {
    triggerDraw(name) {
      this.tempTraceName = name;
      this.isDrawingActive = true;
      this.drawingTrigger++; // Incrémenter (fais +1 a chaque fois) force le "watch" à s'activer
      this.isCreatePopupOpen = false;
    },

    addTrace(newTrace) {
      const traceToAdd = {
        id: Date.now(), // Utilise le timestamp actuel comme identifiant unique
        ...newTrace //décomposition (...) pour copier toutes les propriétés de l'objet newTrace dans le nouvel objet traceToAdd
      }
      this.traces.push(traceToAdd)
      this.saveToBrowser()
    },

    updateTraceData(id, updatedFields) {
      const index = this.traces.findIndex(trace => trace.id === id);
      if (index !== -1) {
        this.traces[index] = {
          ...this.traces[index],
          ...updatedFields
        };
        this.saveToBrowser();
      } else {
        console.warn(`Store: Trace with id ${id} not found.`);
      }
    },

    // Enregistre la liste des traces dans le stockage local du navigateur
    saveToBrowser() {
      localStorage.setItem('my_traces', JSON.stringify(this.traces))
    },

    deleteTrace(id) {
      this.isSidebarInfoOpen = false
      this.traces = this.traces.filter(trace => trace.id !== id)
      this.saveToBrowser()
    },

    // Gère la sélection d'une trace et l'affichage de ses informations détaillées
    selectTrace(id) {
      // Si l'ID est identique, on réinitialise brièvement pour forcer la mise à jour de la carte 
      if (this.selectedTraceId === id) {
        this.selectedTraceId = null;
        setTimeout(() => {
          this.selectedTraceId = id;
        }, 10);
      } else {
        this.selectedTraceId = id;
      }
      this.isSidebarInfoOpen = true;
    },

    // Désactive tous les fonds de carte sauf celui sélectionné (sélection exclusive)
    setBackground(layerId) {
      this.backgroundLayers.forEach(layer => {
        layer.active = (layer.id === layerId);
      });
    },

    // Gère l'ouverture et la fermeture des Sidebar
    handleBurgerClick() {
      if (!this.isSidebarOpen) {
        this.isSidebarOpen = true
      } else {
        if (this.isSidebarInfoOpen) {
          this.isSidebarInfoOpen = false
        } else {
          this.isSidebarOpen = false
        }
      }
    },

    // Met à jour les coordonnées ou l'orientation de la caméra
    updateCamera(newValues) {
      this.cameraPosition = { ...this.cameraPosition, ...newValues };
    },

    changeZoom(plusOrMinus) {
      if (plusOrMinus === '+') {
        this.cameraPosition.height *= 0.7
        this.cameraPosition.zoom += 1
      } else if (plusOrMinus === '-') {
        this.cameraPosition.height *= 1.3
        this.cameraPosition.zoom -= 1
      }
    }
  }
})
