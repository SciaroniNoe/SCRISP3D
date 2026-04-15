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
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { usestore } from '@/stores/store';
import { geoUtils } from '@/services/geoUtils';
import { swisstopoService } from '@/services/swisstopo';
import InfoBoxEndTrace from '@/components/ui/InfoBoxEndTrace.vue';
import Point from 'ol/geom/Point.js';

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
                if (this.isInternalUpdate) {
                    this.isInternalUpdate = false;
                    return;
                }
                this.renderTraces();
            },
            deep: true
        },
        'store.hoveredPointIndex'(newIndex) {
            this.updateCursorPosition(newIndex);
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

            this.sourceVecteur = new VectorSource();
            const coucheVecteur = new VectorLayer({
                source: this.sourceVecteur,
                style: {
                    'stroke-color': '#ff0000',
                    'stroke-width': 5,
                },
            });

            this.sourceCurseur = new VectorSource();
            const coucheCurseur = new VectorLayer({
                source: this.sourceCurseur,
                style: {
                    'circle-radius': 7,
                    'circle-fill-color': '#ff0000', // Rosso
                    'circle-stroke-color': '#ffffff', // Bordo bianco per visibilità
                    'circle-stroke-width': 2,
                },
                zIndex: 999 // Assicuriamoci che sia sopra a tutto
            });

            fetch('https://wmts.geo.admin.ch/EPSG/3857/1.0.0/WMTSCapabilities.xml?lang=fr')
                .then(reponse => reponse.text())
                .then(texteXml => {
                    this.donneesCapabilities = parser.read(texteXml);

                    this.instanceCarte = new Map({
                        target: this.$refs.map2D,
                        layers: [coucheVecteur, coucheCurseur],
                        view: new View({
                            projection: projectionSuisse,
                            extent: mapExtent,
                            center: this.store.cameraPosition.center,
                            zoom: this.store.cameraPosition.zoom,
                        }),
                        controls: [],
                    });

                    // 1. Initialisation de l'interaction de modification
                    this.interactionModify = new Modify({ source: this.sourceVecteur });
                    this.instanceCarte.addInteraction(this.interactionModify);

                    // 2. Événement déclenché à la fin d'une modification (déplacement de sommet)
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

        // Cette méthode est liée à votre bouton @click="submitTrace"
        submitTrace() {
            //console.log("Mode tracé activé");
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

            const handleKeyDown = (event) => {
                if (event.key === 'Delete') {
                    event.preventDefault();
                    if (this.interactionDraw) {
                        this.interactionDraw.removeLastPoint();
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);

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
                            // 1. Fetch Elevations from Swisstopo
                            const startHeight = await swisstopoService.getPointHeight(firstPoint[0], firstPoint[1]);
                            const endHeight = await swisstopoService.getPointHeight(lastPoint[0], lastPoint[1]);
                            const profileZValues = await swisstopoService.getLineProfile(coordinates);

                            // 2. Geometric Calculations
                            const totalLength = geoUtils.calculateTotalLength(coordinates);
                            const gains = geoUtils.calculateElevationGains(profileZValues);
                            const elevationDifference = endHeight - startHeight;

                            // 3. Create the Trace Object
                            const newTrace = {
                                id: Date.now(), // ID temporaneo unico
                                name: this.store.tempTraceName || "New Trace",
                                geometry: coordinates,
                                h_start_m: startHeight,
                                h_end_m: endHeight,
                                length_m: totalLength,
                                elevation_difference_m: elevationDifference,
                                positive_elevation_m: gains.positiveElevationGain,
                                negative_elevation_m: gains.negativeElevationGain
                            };

                            // 4. Store the data
                            this.store.addTrace(newTrace);
                            this.store.selectedTraceId = newTrace.id;
                            this.store.isSidebarInfoOpen = true;

                        } catch (error) {
                            console.error("Error calculating trace properties:", error);
                        }
                    }
                }

                // Exit drawing mode
                setTimeout(() => {
                    this.instanceCarte.removeInteraction(this.interactionDraw);
                    this.instanceCarte.removeInteraction(this.interactionSnap);
                }, 100);
            });
        },

        updateLayerMap() {
            if (!this.instanceCarte || !this.donneesCapabilities) return;

            if (this.sourceCurseur) {
                this.sourceCurseur.clear();
            }
            
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
                this.addLayerOnMap(coucheFondActive.wmts, 1, false);
            }
            //Couches supplémentaires
            this.store.extraLayers.forEach(coucheExtra => {
                if (coucheExtra.active) {
                    const opacite = coucheExtra.opacity !== undefined ? coucheExtra.opacity : 1;
                    this.addLayerOnMap(coucheExtra.wmts, opacite, true);
                }
            });
        },

        addLayerOnMap(identifiantWmts, valeurOpacite, isExtraLayer) {
            const optionsSource = optionsFromCapabilities(this.donneesCapabilities, {
                layer: identifiantWmts,
                matrixSet: 'EPSG:2056',
            });
            const nouvelleCouche = new TileLayer({
                source: new WMTS(optionsSource),
                opacity: valeurOpacite
            });
            if (isExtraLayer) {
                const totalLayers = this.instanceCarte.getLayers().getLength();
                this.instanceCarte.getLayers().insertAt(totalLayers - 1, nouvelleCouche);
            } else {
                this.instanceCarte.getLayers().insertAt(0, nouvelleCouche);
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
        updateCursorPosition(index) {
            // 1. PULIZIA SEMPRE E COMUNQUE
            // Questo rimuove il puntino rosso dalla mappa
            if (this.sourceCurseur) {
                this.sourceCurseur.clear();
            }

            // 2. SE L'INDICE È NULL, CI FERMIAMO QUI
            // (Il puntino è già stato rimosso sopra, quindi la mappa è pulita)
            if (index === null || index === undefined) {
                return;
            }

            // 3. RECUPERO TRACCIA SELEZIONATA
            // Usiamo una costante locale per sicurezza
            const currentTrace = this.store.selectedTrace;

            if (!currentTrace || !currentTrace.geometry || currentTrace.geometry.length < 2) {
                return;
            }

            try {
                // 4. CREAZIONE GEOMETRIA PER INTERPOLAZIONE
                const line = new LineString(currentTrace.geometry);

                // 5. CALCOLO PERCENTUALE
                // Usiamo la lunghezza del profilo salvata nello store (quella di Swisstopo)
                // Se non esiste ancora, usiamo il numero di punti della geometria come fallback
                const totalGraphPoints = this.store.currentProfileLength || currentTrace.geometry.length;

                // Evitiamo divisioni per zero
                if (totalGraphPoints <= 1) return;

                const percentage = index / (totalGraphPoints - 1);

                // 6. OTTENIAMO LE COORDINATE GPS
                const coordinate = line.getCoordinateAt(percentage);

                if (coordinate) {
                    const feature = new Feature({
                        geometry: new Point(coordinate)
                    });
                    this.sourceCurseur.addFeature(feature);
                }
            } catch (error) {
                console.error("Errore nel calcolo della posizione del cursore:", error);
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
