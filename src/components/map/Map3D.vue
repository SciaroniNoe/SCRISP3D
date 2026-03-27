<template>
    <div id="map3D"></div>
</template>

<script>
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import CoordinateSystem from "@giro3d/giro3d/core/geographic/CoordinateSystem.js";
import Extent from "@giro3d/giro3d/core/geographic/Extent.js";
import Instance from "@giro3d/giro3d/core/Instance.js";
import ColorLayer from "@giro3d/giro3d/core/layer/ColorLayer.js";
import Map from "@giro3d/giro3d/entities/Map.js";
import WmtsSource from "@giro3d/giro3d/sources/WmtsSource.js";

export default {
	data() {},
	methods: {},
	mounted() {
        const crs2056 = CoordinateSystem.register(
        "EPSG:2056",
        "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
        );

        const extent = new Extent(
            crs2056,
            2496595, 2837805, 1067184, 1291771
        );

        const instance = new Instance({
            target: 'map3D',
            crs: crs2056,
        });

        const map = new Map({ extent });

        instance.add(map);

        WmtsSource.fromCapabilities(
        "https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr",
        {
            layer: "ch.swisstopo.swisssurface3d-reliefschattierung-multidirektional",
            matrixSet: "EPSG:2056",
        },
        ).then((source) => {
            map.addLayer(new ColorLayer({ name: "wmts", source }));
        })

        const center = extent.centerAsVector2();
        instance.view.camera.position.set(center.x, center.y - 1, 500000);

        const controls = new MapControls(instance.view.camera, instance.domElement);
        controls.target.set(center.x, center.y, 0);

        instance.view.setControls(controls);
    }
}
</script>

<style scoped>
#map3D {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: bold;
}
</style>
