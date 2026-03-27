<template>
  <div ref="map2D" class="map2D"></div>
</template>

<script>
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS.js';
import Projection from 'ol/proj/Projection.js'
import { getCenter } from 'ol/extent';
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { usestore } from '@/stores/store';


export default {
  data() {
    return {
      store: usestore()
    }
  },
  mounted() {
    this.initialiserCarte();
  },
  watch: {
    // Check les changements de couches dans le store
    'store.backgroundLayers': {
      handler() { this.mettreAJourCouches(); },
      deep: true
    },
    'store.extraLayers': {
      handler() { this.mettreAJourCouches(); },
      deep: true
    }
  },
  methods: {
    initialiserCarte() {
      const parser = new WMTSCapabilities();

      proj4.defs(
        "EPSG:2056",
        "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000" +
        " +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
      );
      register(proj4);

      const mapExtent = [2432475, 1040850, 2922503, 1325225];

      const projectionSuisse = new Projection({
        code: "EPSG:2056",
        extent: mapExtent,
        units: "m"
      });

      // Récupération des WMTS de Swisstopo
      fetch('https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr')
        .then(reponse => reponse.text())
        .then(texteXml => {
          this.donneesCapabilities = parser.read(texteXml);

          // Création de l'instance de la carte
          this.instanceCarte = new Map({
            target: this.$refs.map2D,
            layers: [],
            view: new View({
              projection: projectionSuisse,
              extent: mapExtent,
              center: getCenter(mapExtent),
              zoom: 1,
            }),
            controls: [],
          });

          // Premier affichage des couches
          this.mettreAJourCouches();
        });
    },

    mettreAJourCouches() {

      if (!this.instanceCarte || !this.donneesCapabilities) return;
      this.instanceCarte.getLayers().clear();
      // Couche d'arrière plan
      const coucheFondActive = this.store.backgroundLayers.find(couche => couche.active);
      if (coucheFondActive) {
        this.ajouterCoucheWMTSTile(coucheFondActive.wmts, 1);
      }
      //Couches supplémentaires
      this.store.extraLayers.forEach(coucheExtra => {
        if (coucheExtra.active) {
        const opacite = coucheExtra.opacity !== undefined ? coucheExtra.opacity : 1;
          this.ajouterCoucheWMTSTile(coucheExtra.wmts,opacite);
        }
      });
    },

    ajouterCoucheWMTSTile(identifiantWmts, valeurOpacite) {
        const optionsSource = optionsFromCapabilities(this.donneesCapabilities, {
        layer: identifiantWmts,
        matrixSet: 'EPSG:2056',
      });
      const nouvelleCouche = new TileLayer({
        source: new WMTS(optionsSource),
        opacity: valeurOpacite
      });
      this.instanceCarte.addLayer(nouvelleCouche);
    }
  }
}
</script>

<style scoped>

.map2D {
  width: 100%;
  height: 100%;
  background-color: #bbffc1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e7d32;
  font-weight: bold;
}

</style>
