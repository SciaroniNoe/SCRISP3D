<template>
  <div id="map3d" ref="map3d"></div>
</template>

<script>
import * as Cesium from 'cesium';
import "cesium/Source/Widgets/widgets.css";
import proj4 from 'proj4';
import { usestore } from '@/stores/store';

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';

export default {
  name: 'map3D',
  data() {
    return {
      viewer: null,
      store: usestore(),
      swissBounds: [5.9559, 45.8179, 10.4921, 47.8084]
    };
  },
  watch: {
    // Surveille les changements de couches dans le store
    'store.backgroundLayers': {
      handler() { this.updateLayerMap(); },
      deep: true
    },
    'store.extraLayers': {
      handler() { this.updateLayerMap(); },
      deep: true
    },
    'store.extraLayers_3D': {
      handler() { this.update3DBuildings(); },
      deep: true
    },
    'store.traces': {
      handler() { this.renderTraces(); },
      deep: true
    },
    'store.selectedTraceId': {
      handler(newId) {
        if (newId) {
          this.flyToTrace(newId);
        }
      }
    }
  },
  mounted() {
    this.setupCesium();
  },
  methods: {

    renderTraces() {
      if (!this.viewer) return;

      this.viewer.entities.removeAll();

      this.store.traces.forEach(trace => {
        // EPSG:2056 -> WGS84
        const degreesCoords = [];
        trace.geometry.forEach(point => {
          const [lon, lat] = proj4("EPSG:2056", "EPSG:4326", [point[0], point[1]]);
          degreesCoords.push(lon, lat);
        });

        // Creazione della linea proiettata sul terreno
        this.viewer.entities.add({
          id: `trace-${trace.id}`,
          name: trace.name,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(degreesCoords),
            width: 5,
            material: Cesium.Color.RED,
            clampToGround: true,
            classificationType: Cesium.ClassificationType.TERRAIN
          }
        });
      });
    },

    flyToTrace(traceId) {
      const trace = this.store.traces.find(t => t.id === traceId);
      if (!trace || !trace.geometry.length) return;

      // Calcule de la moyen des coo
      const sum = trace.geometry.reduce((acc, coord) => {
        return [acc[0] + coord[0], acc[1] + coord[1]];
      }, [0, 0]);

      const center2056 = [
        sum[0] / trace.geometry.length,
        sum[1] / trace.geometry.length
      ];

      const [lon, lat] = proj4("EPSG:2056", "EPSG:4326", center2056);

      // Move camera
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          trace.length_m * 1.5
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        },
        duration: 2.0
      });
    },

    async setupCesium() {
      const {
        Viewer, CesiumTerrainProvider, Cesium3DTileset,
        Cartesian3, Math: CesiumMath, Rectangle
      } = Cesium;

      proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");

      const pos = this.store.cameraPosition;
      const [lon, lat] = proj4("EPSG:2056", "EPSG:4326", pos.center);

      try {
        this.viewer = new Viewer(this.$refs.map3d, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          infoBox: false,
          selectionIndicator: false,
          fullscreenButton: false,
          navigationHelpButton: false,
          homeButton: false,
          sceneModePicker: false,
          geocoder: false,
          terrainProvider: await CesiumTerrainProvider.fromUrl(
            "https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/"
          ),
        });

        this.viewer.scene.globe.depthTestAgainstTerrain = true;

        // Limites de zoom et caméra
        this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 150;
        this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000;
        this.viewer.scene.globe.cartographicLimitRectangle = Rectangle.fromDegrees(...this.swissBounds);


        this.viewer.camera.setView({
          destination: Cartesian3.fromDegrees(lon, lat, pos.height),
          orientation: {
            heading: 0,
            pitch: CesiumMath.toRadians(pos.pitch),
            roll: 0
          },
        });

        // Mise a jour du store avec les valeur de la camera
        this.viewer.camera.moveEnd.addEventListener(() => {
          const camera = this.viewer.camera;
          const cartographic = camera.positionCartographic;

          const coords2056 = proj4("EPSG:4326", "EPSG:2056", [
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude)
          ]);

          this.store.updateCamera({
            center: coords2056,
            height: cartographic.height,
            // pitch: CesiumMath.toDegrees(camera.pitch)
          });
        });

        // Initialisation des couches
        this.updateLayerMap();
        this.update3DBuildings();

      } catch (error) {
        console.error("Erreur de configuration Cesium:", error);
      };

      this.renderTraces();
    },

    updateLayerMap() {
      if (!this.viewer) return;

      // Supprimer toutes les couches d'imagerie existantes
      this.viewer.imageryLayers.removeAll();

      // Layer Background
      const coucheFondActive = this.store.backgroundLayers.find(c => c.active);
      if (coucheFondActive) {
        if (coucheFondActive.in3dModeTypeLayer === 'wms') {
          this.addLayerWMS(coucheFondActive.wmts, 1.0);
        } else {
          this.addLayerWMTS(coucheFondActive.wmts, 1.0);
        }
      }

      // Layer Extra
      this.store.extraLayers.forEach(coucheExtra => {
        if (coucheExtra.active) {
          const opacite = coucheExtra.opacity !== undefined ? coucheExtra.opacity : 1.0;
          this.addLayerWMS(coucheExtra.wmts, opacite);
        }
      });
    },

    addLayerWMTS(identifiantLayer, valeurOpacite) {
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: `https://wmts.geo.admin.ch/1.0.0/${identifiantLayer}/default/current/3857/{z}/{x}/{y}.jpeg`,
        minimumLevel: 8,
        maximumLevel: 19,
        rectangle: Cesium.Rectangle.fromDegrees(...this.swissBounds),
      });
      const layer = this.viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = valeurOpacite;
    },

    addLayerWMS(identifiantLayer, valeurOpacite) {
      const provider = new Cesium.WebMapServiceImageryProvider({
        url: 'https://wms.geo.admin.ch/',
        layers: identifiantLayer,
        parameters: {
          transparent: 'true',
          format: 'image/png'
        },
        rectangle: Cesium.Rectangle.fromDegrees(...this.swissBounds),
      });
      const layer = this.viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = valeurOpacite;
    },
    async update3DBuildings() {
      if (!this.viewer) return;

      // On cherche si l'ID 'batiments' est active ou non
      const layerBatiment = this.store.extraLayers_3D.find(l => l.id === 'batiments');
      const isActive = layerBatiment ? layerBatiment.active : false;

      // Si c'est actif mais le tileset n'existe pas encore:
      if (isActive && !this.swissBuildings) {
        try {
          console.log("Chargement initial des bâtiments 3D...");
          this.swissBuildings = await Cesium.Cesium3DTileset.fromUrl(
            "https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json"
          );
          this.viewer.scene.primitives.add(this.swissBuildings);
        } catch (error) {
          console.error("Erreur lors du chargement des bâtiments:", error);
        }
      }

      // Si le tileset existe déjà, on change juste sa visibilité:
      if (this.swissBuildings) {
        this.swissBuildings.show = isActive;
      }
    }
  },
  beforeUnmount() {
    if (this.viewer) this.viewer.destroy();
  }
};
</script>

<style scoped>
#map3d {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>