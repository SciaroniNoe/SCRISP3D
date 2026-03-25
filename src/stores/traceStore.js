import { defineStore } from 'pinia'

export const useTraceStore = defineStore('trace', {
  state: () => ({

    traces: [
      {
        id: 1,
        name: 'Trace TEST 1',
        geometry: [
          [2533000, 1152000],
          [2534000, 1153000],
          [2535000, 1152500]
        ],
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
        geometry: [
          [2533000, 1152000],
          [2534000, 1153000],
          [2535000, 1152500]
        ],
        h_start_m: 450.5,
        h_end_m: 510.2,
        length_m: 1540,
        elevation_difference_m: 59.7,
        positive_elevation_m: 75.0,
        negative_elevation_m: 15.3
      }
    ],

    selectedTraceId: null,

    //(false = 2D, true = 3D)
    is3dMode: false,

    isSidebarOpen: false
  }),

  getters: {
    // Retourne l'objet complet du tracé actuellement sélectionné
    selectedTrace: (state) => {
      return state.traces.find(t => t.id === state.selectedTraceId)
    }
  },

  actions: {
    // Ajoute un nouveau tracé (par exemple après la fin du dessin)
    addTrace(newTrace) {
      this.traces.push({
        id: Date.now(), // Génère un identifiant unique temporaire basé sur le timestamp
        ...newTrace
      })
    },

    // Définit le tracé sélectionné à partir de son ID
    selectTrace(id) {
      this.selectedTraceId = id
    }
  }
})