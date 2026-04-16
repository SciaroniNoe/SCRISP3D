<template>
  <div id="map3d" ref="map3d"></div>
</template>

<script>
import * as Cesium from 'cesium';
import "cesium/Source/Widgets/widgets.css";
import proj4 from 'proj4';
import { usestore } from '@/stores/store';

//window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';

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
    'store.extraLayers3D': {
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
    },

    // Surveille le zoom de la caméra dans le store pour adapter la vue de la carte (ex. button + et -)
    'store.cameraPosition.height'(newHeight) {
      if (!this.viewer) return;

      const camera = this.viewer.camera;
      const cartographic = camera.positionCartographic;

      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, newHeight),
        orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll
        }
      });
    },

    'store.hoveredPointIndex'(mousePositionInProfile) {
      this.updateCursor3D(mousePositionInProfile);
    },
  },
  mounted() {
    this.setupCesium();
  },
  methods: {

    renderTraces() {
      if (!this.viewer) return;

      this.viewer.entities.removeAll();

      this.store.traces.forEach(trace => {
        // Conversion EPSG:2056 en WGS84
        const degreesCoords = [];
        trace.geometry.forEach(point => {
          const [lon, lat] = proj4("EPSG:2056", "EPSG:4326", [point[0], point[1]]);
          degreesCoords.push(lon, lat);
        });

        // Creation de la ligne sur la carte (projetée au sol)
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

      const coords4326 = trace.geometry.map(([x, y]) =>
        proj4("EPSG:2056", "EPSG:4326", [x, y])
      );
      const lons = coords4326.map(c => c[0]);
      const lats = coords4326.map(c => c[1]);
      const rectangle = Cesium.Rectangle.fromDegrees(
        Math.min(...lons),
        Math.min(...lats),
        Math.max(...lons),
        Math.max(...lats)
      );

      this.viewer.camera.flyTo({
        destination: rectangle,
        duration: 2.0
      });
    },

    async setupCesium() {
      const {
        Viewer, CesiumTerrainProvider,
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

        // Limites de zoom de la caméra
        this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100;
        this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 400000;
        this.viewer.scene.globe.cartographicLimitRectangle = Rectangle.fromDegrees(...this.swissBounds);

        // Positionnement initial de la caméra
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

      // Supprimer toutes les couches existantes (imageryLayers)
      this.viewer.imageryLayers.removeAll();

      // Layer Background
      const backgroundLayersActive = this.store.backgroundLayers.find(backgroundLayer => backgroundLayer.active);
      if (backgroundLayersActive) {
        if (backgroundLayersActive.in3dModeTypeLayer === 'wms') {
          this.addLayerWMS(backgroundLayersActive.wmts, 1.0);
        } else {
          this.addLayerWMTS(backgroundLayersActive.wmts, 1.0);
        }
      }

      // Layer Extra
      this.store.extraLayers.forEach(extraLayer => {
        if (extraLayer.active) {
          const opacity = extraLayer.opacity !== undefined ? extraLayer.opacity : 1.0;
          this.addLayerWMS(extraLayer.wmts, opacity);
        }
      });
    },

    addLayerWMTS(identifiantLayer, opacity) {
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: `https://wmts.geo.admin.ch/1.0.0/${identifiantLayer}/default/current/3857/{z}/{x}/{y}.jpeg`,
        minimumLevel: 8,
        maximumLevel: 19,
        rectangle: Cesium.Rectangle.fromDegrees(...this.swissBounds),
      });
      const layer = this.viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = opacity;
    },

    addLayerWMS(identifiantLayer, opacity) {
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
      layer.alpha = opacity;
    },

    async update3DBuildings() {
      if (!this.viewer) return;

      // On cherche si l'ID 'batiments' est active ou non
      const layerSwissBuildings = this.store.extraLayers3D.find(layer => layer.id === 'batiments');
      const isActive = layerSwissBuildings ? layerSwissBuildings.active : false;

      // Si c'est actif mais le tileset n'existe pas encore:
      if (isActive && !this.swissBuildings) {
        try {
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
    },

    // Permet de voir un point sur la carte si on a la souris sur le profil
    updateCursor3D(mousePositionInProfile) {
      if (!this.viewer) return;

      const cursorId = 'cursor-3d';
      const existingCursor = this.viewer.entities.getById(cursorId);

      if (mousePositionInProfile === null || mousePositionInProfile === undefined) {
        if (existingCursor) this.viewer.entities.remove(existingCursor);
        return;
      }

      const currentTrace = this.store.selectedTrace;
      if (!currentTrace || !currentTrace.geometry) return;

      const totalGraphPoints = this.store.currentProfileLength || currentTrace.geometry.length;
      const ratio = mousePositionInProfile / (totalGraphPoints - 1);

      const segmentIndex = Math.floor(ratio * (currentTrace.geometry.length - 1));
      const p1 = currentTrace.geometry[segmentIndex];
      const p2 = currentTrace.geometry[Math.min(segmentIndex + 1, currentTrace.geometry.length - 1)];

      const t = (ratio * (currentTrace.geometry.length - 1)) - segmentIndex;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const y = p1[1] + (p2[1] - p1[1]) * t;

      const [lon, lat] = proj4("EPSG:2056", "EPSG:4326", [x, y]);

      //const coneHeight = 40.0;
      //const coneRadius = 15.0;
      const cameraHeight = this.viewer.camera.positionCartographic.height;
      let dynamicHeight = cameraHeight * 0.04;
      dynamicHeight = Math.max(10, Math.min(dynamicHeight, 500));
      const coneRadius = dynamicHeight * 0.4;

      const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

      if (existingCursor) {
        existingCursor.position = position;
      } else {
        this.viewer.entities.add({
          id: cursorId,
          position: position,
          cylinder: {
            length: dynamicHeight,
            topRadius: coneRadius,
            bottomRadius: 0.0,
            material: Cesium.Color.RED.withAlpha(0.9),
            outline: false,
            numberOfVerticalLines: 0,
            slices: 32,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
          }
        });
      }
    }
  },
  // Libère les ressources et la mémoire du moteur 3D avant de détruire le composant.
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