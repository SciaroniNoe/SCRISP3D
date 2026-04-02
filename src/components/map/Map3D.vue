<template>
  <div id="map3d" ref="map3d"></div>
</template>

<script>
import * as Cesium from 'cesium';
import "cesium/Source/Widgets/widgets.css";
import proj4 from 'proj4';

window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';

export default {
  name: 'map3D',
  mounted() {
    this.setupCesium();
  },
  methods: {
    async setupCesium() {
      const {
        Viewer, CesiumTerrainProvider, ImageryLayer, UrlTemplateImageryProvider,
        Rectangle, Cesium3DTileset, Cartesian3, Math: CesiumMath
      } = Cesium;


      proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");


      const E_MN95 = 2600000;
      const N_MN95 = 1200000;

      const [longitude, latitude] = proj4("EPSG:2056", "EPSG:4326", [E_MN95, N_MN95]);
      console.log(`Coordinate WGS84: Longitudine=${longitude}, Latitudine=${latitude}`);

      const swissBounds = [5.9559, 45.8179, 10.4921, 47.8084];

      try {
        const viewer = new Viewer(this.$refs.map3d, {
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
          baseLayer: new ImageryLayer(
            new UrlTemplateImageryProvider({
              // url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swisstlm3d-karte-farbe.3d/default/current/3857/{z}/{x}/{y}.jpeg",
              url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg",
              minimumLevel: 8,
              maximumLevel: 17,
              rectangle: Rectangle.fromDegrees(...swissBounds),
            })
          ),
        });

        const swissBuildings = await Cesium3DTileset.fromUrl(
          "https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json"
        );
        viewer.scene.primitives.add(swissBuildings);

        const pitchGradi = -35; 

        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(longitude, latitude, 2500), // 2500 metri di altitudine
          orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(pitchGradi),
            roll: 0.0
          },
        });

        this.viewer = viewer;

      } catch (error) {
        console.error("Cesium setup error:", error);
      }
    }
  },
  beforeUnmount() {
    if (this.viewer) {
      this.viewer.destroy();
    }
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