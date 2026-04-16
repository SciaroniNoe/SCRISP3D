<template>
    <div class="map-container">
        <div ref="map2D" class="map2D"></div>

        <transition name="fade">
            <InfoBoxEndTrace v-if="store.isDrawingActive" />
        </transition>

    </div>
</template>

<script>
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
import Projection from 'ol/proj/Projection.js'
import Point from 'ol/geom/Point.js';
import { register } from "ol/proj/proj4";

import proj4 from "proj4";

import { usestore } from '@/stores/store';
import { geoUtils } from '@/services/geoUtils';
import { swisstopoService } from '@/services/swisstopo';

import InfoBoxEndTrace from '@/components/ui/InfoBoxEndTrace.vue';

// Imports pour le dessin
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import Draw from 'ol/interaction/Draw.js';
import Modify from 'ol/interaction/Modify.js';
import Snap from 'ol/interaction/Snap.js';
import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';

export default {
    components: {
        InfoBoxEndTrace,
    },
    data() {
        return {
            store: usestore(),
            instanceCarte: null,
            donneesCapabilities: null,
            sourceVecteur: null,
            typeTrace: 'LineString',
            interactionDraw: null,
            interactionSnap: null,
            interactionModify: null,
            isInternalUpdate: false,
            sourceCurseur: null,
            featureCurseur: null,
        }
    },
    mounted() {
        this.initialisationMap();
    },
    watch: {
        // Surveille le trigger de dessin dans le store pour activer le mode dessin
        'store.drawingTrigger'() {
            if (this.store.isDrawingActive) {
                this.reinitialiserInteractions();
            }
        },

        // Surveille les changements de couches dans le store
        'store.backgroundLayers': {
            handler() { this.updateLayerMap(); },
            deep: true
        },
        'store.extraLayers': {
            handler() { this.updateLayerMap(); },
            deep: true
        },

        // Surveille le zoom de la caméra dans le store pour adapter la vue de la carte (ex. button + et -)
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
                if (this.isInternalUpdate) {
                    this.isInternalUpdate = false;
                    return;
                }
                this.renderTraces();
            },
            deep: true
        },

        'store.hoveredPointIndex'(mousePositionInProfile) {
            this.updateCursorPosition(mousePositionInProfile);
        }
    },
    methods: {
        initialisationMap() {
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

            this.sourceVecteur = new VectorSource();
            const layerVector = new VectorLayer({
                source: this.sourceVecteur,
                style: {
                    'stroke-color': '#ff0000',
                    'stroke-width': 5,
                },
            });

            this.sourceCurseur = new VectorSource();
            const layerMousePositionProfileOnMap = new VectorLayer({
                source: this.sourceCurseur,
                style: {
                    'circle-radius': 7,
                    'circle-fill-color': '#ff0000',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                },
                zIndex: 999
            });

            fetch('https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr')
                .then(reponse => reponse.text())
                .then(texteXml => {
                    this.donneesCapabilities = parser.read(texteXml);

                    this.instanceCarte = new Map({
                        target: this.$refs.map2D,
                        layers: [layerVector, layerMousePositionProfileOnMap],
                        view: new View({
                            projection: projectionSuisse,
                            extent: mapExtent,
                            center: this.store.cameraPosition.center,
                            zoom: this.store.cameraPosition.zoom,
                        }),
                        controls: [],
                    });

                    // Initialisation de l'interaction de modification
                    this.interactionModify = new Modify({ source: this.sourceVecteur });
                    this.instanceCarte.addInteraction(this.interactionModify);

                    // on attend la fin de la modification pour mettre à jour les données du trace modifiée dans le store
                    this.interactionModify.on('modifyend', async (event) => {
                        const modifiedFeatures = event.features.getArray();

                        for (const feature of modifiedFeatures) {
                            const traceId = feature.getId();
                            const geometry = feature.getGeometry();

                            if (geometry && traceId) {
                                const coordinates = geometry.getCoordinates();

                                try {
                                    // Récupération des nouvelles données altimétriques
                                    const firstPoint = coordinates[0];
                                    const lastPoint = coordinates[coordinates.length - 1];

                                    const startHeight = await swisstopoService.getPointHeight(firstPoint[0], firstPoint[1]);
                                    const endHeight = await swisstopoService.getPointHeight(lastPoint[0], lastPoint[1]);
                                    const profileZValues = await swisstopoService.getLineProfile(coordinates);

                                    // Calculs des nouvelles propriétés géométriques
                                    const totalLength = geoUtils.calculateTotalLength(coordinates);
                                    const gains = geoUtils.calculateElevationGains(profileZValues);
                                    const elevationDifference = endHeight - startHeight;

                                    // Mise à jour du store Pinia
                                    const updatedData = {
                                        geometry: coordinates,
                                        h_start_m: startHeight,
                                        h_end_m: endHeight,
                                        length_m: totalLength,
                                        elevation_difference_m: elevationDifference,
                                        positive_elevation_m: gains.positiveElevationGain,
                                        negative_elevation_m: gains.negativeElevationGain
                                    };
                                    this.isInternalUpdate = true;
                                    this.store.updateTraceData(traceId, updatedData);

                                } catch (error) {
                                    console.error("Error updating trace after modification:", error);
                                }
                            }
                        }
                    });

                    this.instanceCarte.on('moveend', () => {
                        const view = this.instanceCarte.getView();
                        this.store.updateCamera({
                            center: view.getCenter(),
                            zoom: view.getZoom()
                        });
                    });

                    this.updateLayerMap();
                    this.renderTraces();
                });
        },

        reinitialiserInteractions() {
            this.store.isDrawingActive = true;
            // Supprimer les interactions de dessin existantes
            if (this.interactionDraw) this.instanceCarte.removeInteraction(this.interactionDraw);
            if (this.interactionSnap) this.instanceCarte.removeInteraction(this.interactionSnap);

            // Instancie et ajoute à la carte l'interaction permettant de dessiner des géométries
            this.interactionDraw = new Draw({
                source: this.sourceVecteur,
                type: this.typeTrace,
            });
            this.instanceCarte.addInteraction(this.interactionDraw);

            // Permet de coller les points aux sommets d'un trace existants
            this.interactionSnap = new Snap({
                source: this.sourceVecteur,
            });
            this.instanceCarte.addInteraction(this.interactionSnap);

            // Pour supprimer le dernier point dessiné (del)
            const handleKeyDown = (event) => {
                if (event.key === 'Delete') {
                    event.preventDefault();
                    if (this.interactionDraw) {
                        this.interactionDraw.removeLastPoint();
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            // Quand le dessin est terminé, on récupère la géométrie
            this.interactionDraw.on('drawend', async (event) => {
                this.store.isDrawingActive = false;

                if (event && event.feature) {
                    const feature = event.feature;
                    const geometry = feature.getGeometry();

                    if (geometry) {
                        const coordinates = geometry.getCoordinates();
                        const firstPoint = coordinates[0];
                        const lastPoint = coordinates[coordinates.length - 1];

                        try {
                            const startHeight = await swisstopoService.getPointHeight(firstPoint[0], firstPoint[1]);
                            const endHeight = await swisstopoService.getPointHeight(lastPoint[0], lastPoint[1]);
                            const profileZValues = await swisstopoService.getLineProfile(coordinates);

                            const totalLength = geoUtils.calculateTotalLength(coordinates);
                            const gains = geoUtils.calculateElevationGains(profileZValues);
                            const elevationDifference = endHeight - startHeight;

                            const newTrace = {
                                id: Date.now(),
                                name: this.store.tempTraceName || "New Trace",
                                geometry: coordinates,
                                h_start_m: startHeight,
                                h_end_m: endHeight,
                                length_m: totalLength,
                                elevation_difference_m: elevationDifference,
                                positive_elevation_m: gains.positiveElevationGain,
                                negative_elevation_m: gains.negativeElevationGain
                            };

                            this.store.addTrace(newTrace);
                            this.store.selectedTraceId = newTrace.id;
                            this.store.isSidebarInfoOpen = true;
                            this.store.isSidebarOpen = true;

                        } catch (error) {
                            console.error("Error calculating trace properties:", error);
                        }
                    }
                }

                // On sort du mode dessin
                setTimeout(() => {
                    this.instanceCarte.removeInteraction(this.interactionDraw);
                    this.instanceCarte.removeInteraction(this.interactionSnap);
                }, 100); // petit délai pour éviter les conflits avec dernier point cree
            });
        },

        updateLayerMap() {
            if (!this.instanceCarte || !this.donneesCapabilities) return;

            // On vide la couche du curseur (le point que se deplace si on est sur le profil)
            if (this.sourceCurseur) {
                this.sourceCurseur.clear();
            }

            // On supprime toutes les couches WMTS (sans toucher la couche de tracés ni celle du curseur)
            const layers = this.instanceCarte.getLayers().getArray();
            for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex--) {
                if (layers[layerIndex] instanceof TileLayer) {
                    this.instanceCarte.removeLayer(layers[layerIndex]);
                }
            }

            // Couche d'arrière plan
            const backgroundLayerActive = this.store.backgroundLayers.find(backgroundLayer => backgroundLayer.active);
            if (backgroundLayerActive) {
                this.addLayerOnMap(backgroundLayerActive.wmts, 1, false);
            }
            //Couches supplémentaires
            this.store.extraLayers.forEach(extraLayer => {
                if (extraLayer.active) {
                    const opacite = extraLayer.opacity !== undefined ? extraLayer.opacity : 1;
                    this.addLayerOnMap(extraLayer.wmts, opacite, true);
                }
            });
        },

        addLayerOnMap(identifiantWmts, valeurOpacite, isExtraLayer) {
            const optionsSource = optionsFromCapabilities(this.donneesCapabilities, {
                layer: identifiantWmts,
                matrixSet: 'EPSG:2056',
            });
            const newLayer = new TileLayer({
                source: new WMTS(optionsSource),
                opacity: valeurOpacite
            });
            if (isExtraLayer) {
                const totalLayers = this.instanceCarte.getLayers().getLength();
                this.instanceCarte.getLayers().insertAt(totalLayers - 1, newLayer);
            } else {
                this.instanceCarte.getLayers().insertAt(0, newLayer);
            }
        },

        flyToTrace(traceId) {
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

        // Affiche les traces dans la carte en créant une feature pour chaque trace et en l'ajoutant à la sourceVecteur
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
        },

        // Permet de voir un point sur la carte si on a la souris sur le profil
        updateCursorPosition(mousePositionInProfile) {

            if (this.sourceCurseur) {
                this.sourceCurseur.clear();
            }

            // Si on est pas sur le profil alors mousePositionInProfile est null
            if (mousePositionInProfile === null || mousePositionInProfile === undefined) {
                return;
            }

            const currentTrace = this.store.selectedTrace;

            if (!currentTrace || !currentTrace.geometry || currentTrace.geometry.length < 2) {
                return;
            }

            try {
                const line = new LineString(currentTrace.geometry);

                const totalGraphPoints = this.store.currentProfileLength || currentTrace.geometry.length;

                if (totalGraphPoints <= 1) return;

                const percentage = mousePositionInProfile / (totalGraphPoints - 1);

                // On obtient les coo sur le trace en function du purcentage
                const coordinate = line.getCoordinateAt(percentage);

                if (coordinate) {
                    const feature = new Feature({
                        geometry: new Point(coordinate)
                    });
                    this.sourceCurseur.addFeature(feature);
                }
            } catch (error) {
                console.error("Erreur lors du calcul de la position du curseur: ", error);
            }
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


/* Pour le popup aide creation trace */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
