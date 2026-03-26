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

export default {
	data() {},
	methods: {},
	mounted() {
        const parser = new WMTSCapabilities();

        fetch('https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr')
        .then(response => {
        return response.text();
        })
        .then(text => {
            const result = parser.read(text);

            proj4.defs(
                "EPSG:2056",
                "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000" +
                " +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
            );
            register(proj4);

            const extent = [2496595, 1067184, 2837805, 1291771]

            const projection = new Projection({
                code: "EPSG:2056",
                extent: extent,
                units: "m"
            })

            new Map({
                target: this.$refs.map2D,
                layers: [
                    new TileLayer({
                        opacity: 1,
                        source: new WMTS(optionsFromCapabilities(result, {
                        layer: 'ch.swisstopo.swisssurface3d-reliefschattierung-multidirektional',
                        matrixSet: 'EPSG:2056',
                        })),
                    })
                ],
                view: new View({
                    projection: projection,
                    extent: extent,
                    center: getCenter(extent),
                    zoom: 1,
                }),
                controls: [],
            });
        });
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
