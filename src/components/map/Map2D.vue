<template>
    <div class="map-container">
        <div ref="map2D" class="map2D"></div>
    </div>
</template>

<script>
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import Projection from 'ol/proj/Projection.js'
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { usestore } from '@/stores/store';

// Imports pour le dessin
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import Draw from 'ol/interaction/Draw.js';
import Modify from 'ol/interaction/Modify.js';
import Snap from 'ol/interaction/Snap.js';
import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';

export default {
    data() {
        return {
            store: usestore(),
            instanceCarte: null,
            donneesCapabilities: null,
            sourceVecteur: null, // Source pour les tracés
            typeTrace: 'LineString',
            interactionDraw: null,
            interactionSnap: null,
            interactionModify: null
        }
    },
    mounted() {
        this.initialiserCarte();
    },
    watch: {
        // Surveille le déclencheur de dessin dans le store
        'store.drawingTrigger'() {
            if (this.store.isDrawingActive) {
                this.reinitialiserInteractions();
            }
        },
        // Check les changements de couches dans le store
        'store.backgroundLayers': {
            handler() { this.updateLayerMap(); },
            deep: true
        },
        'store.extraLayers': {
            handler() { this.updateLayerMap(); },
            deep: true
        },
        'store.cameraPosition.zoom'(newZoom) {
            const view = this.instanceCarte.getView();
            view.setZoom(newZoom);
        },
        'store.selectedTraceId': {
            handler(newId) {
                if (newId) {
                this.flyToTrace(newId);
                }
            }
        },
        'store.traces': {
            handler() {
                this.renderTraces();
            },
            deep: true
        },
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

            // 1. Préparer la couche vectorielle pour le dessin
            this.sourceVecteur = new VectorSource();
            const coucheVecteur = new VectorLayer({
                source: this.sourceVecteur,
                style: {
                    'stroke-color': '#ff0000',
                    'stroke-width': 5,
                },
            });

            // Récupération des WMTS de Swisstopo
            fetch('https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr')
                .then(reponse => reponse.text())
                .then(texteXml => {
                    this.donneesCapabilities = parser.read(texteXml);

                    // Création de l'instance de la carte
                    this.instanceCarte = new Map({
                        target: this.$refs.map2D,
                        layers: [coucheVecteur],
                        view: new View({
                            projection: projectionSuisse,
                            extent: mapExtent,
                            center: this.store.cameraPosition.center,
                            zoom: this.store.cameraPosition.zoom,
                        }),
                        controls: [],
                    });

                    // 2. Ajouter la modification (toujours active sur la source)
                    this.interactionModify = new Modify({ source: this.sourceVecteur });
                    this.instanceCarte.addInteraction(this.interactionModify);

                    this.instanceCarte.on('moveend', () => {
                        const view = this.instanceCarte.getView();
                        this.store.updateCamera({
                            center: view.getCenter(),
                            zoom: view.getZoom()
                        });
                    });

                    // Premier affichage des couches
                    this.updateLayerMap();

                    // AJoute les traces
                    this.renderTraces();
                });
        },

        // Cette méthode est liée à votre bouton @click="submitTrace"
        submitTrace() {
            console.log("Mode tracé activé");
            this.reinitialiserInteractions();
        },

        reinitialiserInteractions() {
            // Supprimer les interactions de dessin existantes
            if (this.interactionDraw) this.instanceCarte.removeInteraction(this.interactionDraw);
            if (this.interactionSnap) this.instanceCarte.removeInteraction(this.interactionSnap);


            this.interactionDraw = new Draw({
                source: this.sourceVecteur,
                type: this.typeTrace,
            });
            this.instanceCarte.addInteraction(this.interactionDraw);

            // Le Snap permet de "coller" les points aux bords existants (très pratique)
            this.interactionSnap = new Snap({ source: this.sourceVecteur });
            this.instanceCarte.addInteraction(this.interactionSnap);

            this.interactionDraw.on('drawend', (event) => {
                this.store.isDrawingActive = false;

                // On vérifie que l'event et la feature existent bien
                if (event && event.feature) {
                    const feature = event.feature;
                    const geometry = feature.getGeometry();

                    if (geometry) {
                        const coordinates = geometry.getCoordinates();

                        // Création de l'objet selon votre structure
                        const nouvelleTrace = {
                            name: this.store.tempTraceName || "Tracé sans nom",
                            geometry: coordinates,
                            h_start_m: 0,
                            h_end_m: 0,
                            length_m: 0,
                            elevation_difference_m: 0,
                            positive_elevation_m: 0,
                            negative_elevation_m: 0
                        };

                        // Ajout au store Pinia
                        this.store.addTrace(nouvelleTrace);
                        console.log("Géométrie capturée :", coordinates);
                    }
                }

                // ON SORT DU MODE DESSIN :
                // On retire les interactions pour que le curseur redevienne normal
                // et qu'on ne puisse pas recommencer une deuxième ligne immédiatement.
                setTimeout(() => {
                    this.instanceCarte.removeInteraction(this.interactionDraw);
                    this.instanceCarte.removeInteraction(this.interactionSnap);
                }, 100);
            });
        },

        updateLayerMap() {
            if (!this.instanceCarte || !this.donneesCapabilities) return;

            // On ne vide pas tout, sinon on perd la couche de dessin
            // On filtre pour ne garder que la couche vectorielle de dessin
            const layers = this.instanceCarte.getLayers().getArray();
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i] instanceof TileLayer) {
                    this.instanceCarte.removeLayer(layers[i]);
                }
            }
            // Couche d'arrière plan
            const coucheFondActive = this.store.backgroundLayers.find(couche => couche.active);
            if (coucheFondActive) {
                this.addLayerOnMap(coucheFondActive.wmts, 1);
            }
            //Couches supplémentaires
            this.store.extraLayers.forEach(coucheExtra => {
                if (coucheExtra.active) {
                    const opacite = coucheExtra.opacity !== undefined ? coucheExtra.opacity : 1;
                    this.addLayerOnMap(coucheExtra.wmts, opacite);
                }
            });
        },

        addLayerOnMap(identifiantWmts, valeurOpacite) {
            const optionsSource = optionsFromCapabilities(this.donneesCapabilities, {
                layer: identifiantWmts,
                matrixSet: 'EPSG:2056',
            });
            const nouvelleCouche = new TileLayer({
                source: new WMTS(optionsSource),
                opacity: valeurOpacite
            });
            this.instanceCarte.getLayers().insertAt(0, nouvelleCouche);
        },

        flyToTrace(traceId){
            const trace = this.store.traces.find(t => t.id === traceId);
            if (!trace || !trace.geometry.length) return;

            const coordinates = trace.geometry
            const lons = coordinates.map(c => c[0]);
            const lats = coordinates.map(c => c[1]);
            const extent = [
              Math.min(...lons),
              Math.min(...lats),
              Math.max(...lons),
              Math.max(...lats)
            ];

            this.instanceCarte.getView().fit(extent, {
                duration: 1000,
                padding: [50, 50, 50, 50],
                maxZoom: 17
            });
        },

        renderTraces() {
            if (!this.sourceVecteur) return;

            this.sourceVecteur.clear();

            this.store.traces.forEach(trace => {
                if (!trace.geometry || !trace.geometry.length) return;

                const feature = new Feature({
                    geometry: new LineString(trace.geometry)
                });

                feature.setId(trace.id);
                this.sourceVecteur.addFeature(feature);
            });
        }
    }
}

</script>

<style scoped>
.map2D {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2e7d32;
    font-weight: bold;
}

.map-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.toolbar {
    position: absolute;
    top: 10px;
    left: 50px;
    z-index: 10;
    background: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
</style>