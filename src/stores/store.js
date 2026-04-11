import { swisstopoService } from '@/services/swisstopo'
import { defineStore } from 'pinia'

export const usestore = defineStore('trace', {
  state: () => {

    const savedTraces = localStorage.getItem('my_traces')

    return {
      // Se esistono li carichiamo sennò usiamo l'array con i test
      traces: savedTraces ? JSON.parse(savedTraces) : [
        {
          id: 1,
          name: 'Trace TEST',
          geometry: [[2562260.410, 1206282.600], [2562117.386, 1208180.511], [2563120.505, 1210183.038]],
          h_start_m: 639.3,
          h_end_m: 833.9,
          length_m: 4140,
          elevation_difference_m: 194.6,
          positive_elevation_m: 511.8,
          negative_elevation_m: 317.2
        }
      ],

      selectedTraceId: null,
      hoveredPointIndex: null,

      isSidebarOpen: false,
      isSidebarInfoOpen: false,
      isCreatePopupOpen: false,

      isDrawingActive: false,
      drawingTrigger: 0,
      tempTraceName: '',

      is3dMode: false,

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

      extraLayers_3D: [
        { id: 'batiments', label: 'Bâtiments 3D', active: false }
      ]

    }
  },

  getters: {
    selectedBackground: (state) => state.backgroundLayers.find(l => l.active),
    selectedTrace: (state) => state.traces.find(t => t.id === state.selectedTraceId)
  },

  actions: {
    triggerDraw(name) {
      this.tempTraceName = name;
      this.isDrawingActive = true;
      this.drawingTrigger++; // Incrémenter force le "watch" à s'activer
      this.isCreatePopupOpen = false;
    },

    addTrace(newTrace) {
      const traceToAdd = {
        id: Date.now(),
        ...newTrace
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

        console.log(`Store: Trace ${id} updated and saved to localStorage.`);
      } else {
        console.warn(`Store: Trace with id ${id} not found.`);
      }
    },

    // Funzione per scrivere nel localStorage
    saveToBrowser() {
      localStorage.setItem('my_traces', JSON.stringify(this.traces))
    },

    // Se vuoi cancellare
    deleteTrace(id) {
      this.isSidebarInfoOpen = false
      this.traces = this.traces.filter(t => t.id !== id)
      this.saveToBrowser()
    },

    selectTrace(id) {
      // Se clicco lo stesso ID, lo resetto un istante per forzare il watcher 
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

    // Logique pour s'assurer qu'un seul arrière-plan est actif
    setBackground(layerId) {
      this.backgroundLayers.forEach(layer => {
        layer.active = (layer.id === layerId);
      });
    },

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
