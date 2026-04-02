import { swisstopoService } from '@/services/swisstopo'
import { defineStore } from 'pinia'

export const usestore = defineStore('trace', {
  state: () => {
    // Prova a recuperare i tracciati salvati nel browser
    const savedTraces = localStorage.getItem('my_traces')

    return {
      // Se esistono li carichiamo (convertendoli da testo a oggetto),
      // altrimenti usiamo l'array con i test
      traces: savedTraces ? JSON.parse(savedTraces) : [
        {
          id: 1,
          name: 'Trace TEST 1',
          geometry: [[2533000, 1152000], [2534000, 1153000], [2535000, 1152500]],
          h_start_m: 450.5,
          h_end_m: 510.2,
          length_m: 1540,
          elevation_difference_m: 59.7,
          positive_elevation_m: 75.0,
          negative_elevation_m: 15.3
        },
        {
          id: 2,
          name: 'Trace TEST 2',
          geometry: [[2533000, 1152000,0], [2534000, 1153000,100], [2535000, 1152500,50]],
          h_start_m: 450.5,
          h_end_m: 510.2,
          length_m: 1540,
          elevation_difference_m: 59.7,
          positive_elevation_m: 75.0,
          negative_elevation_m: 15.3
        }
      ],

      selectedTraceId: null,

      isSidebarOpen: false,
      isSidebarInfoOpen: false,
      isCreatePopupOpen: false,

      is3dMode: false,

      backgroundLayers: [
        { id: 'layerOrtho', label: 'Orthophoto', wmts: 'ch.swisstopo.swissimage', active: false },
        { id: 'layerCN', label: 'Carte Nationale', wmts: 'ch.swisstopo.pixelkarte-farbe', active: true },
        { id: 'layerRelief', label: 'Relief multidirectionnel', wmts: 'ch.swisstopo.swisssurface3d-reliefschattierung-multidirektional', active: false },
        { id: 'layerMO', label: 'Mensuration Officielle', wmts: 'ch.kantone.cadastralwebmap-farbe', active: false }
      ],

      extraLayers: [
        { id: 'layerPente', label: 'Pentes (>30°)', wmts: 'ch.swisstopo-karto.hangneigung', active: false, opacity: 0.4}, // Theo tu prefer ch.swisstopo.hangneigung-ueber_30?
        { id: 'layerRandonnee', label: 'Chemins de randonnée', wmts: 'ch.swisstopo.swisstlm3d-wanderwege', active: false, opacity: 1.0}
      ]

    }
  },

  getters: {
    selectedBackground: (state) => state.backgroundLayers.find(l => l.active),
    selectedTrace: (state) => state.traces.find(t => t.id === state.selectedTraceId)
  },

  actions: {
    // Modifichiamo l'azione per salvare ogni volta che aggiungiamo un tracciato
    addTrace(newTrace) {
      const traceToAdd = {
        id: Date.now(),
        ...newTrace
      }

      this.traces.push(traceToAdd)
      this.saveToBrowser() // <--- Chiamiamo la funzione di salvataggio
    },

    // Funzione interna per scrivere nel localStorage
    saveToBrowser() {
      localStorage.setItem('my_traces', JSON.stringify(this.traces))
    },

    // Se vuoi anche poterli cancellare, aggiungi questa:
    deleteTrace(id) {
      this.traces = this.traces.filter(t => t.id !== id)
      this.saveToBrowser() // Aggiorna il salvataggio dopo la cancellazione
    },

    selectTrace(id) {
      this.selectedTraceId = id
      this.isSidebarInfoOpen = true
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
    }
  }
})
