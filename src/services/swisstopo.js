
const BASE_URL = 'https://api3.geo.admin.ch/rest/services';

export const swisstopoService = {

    /**
     * RÉCUPÉRER L'ALTITUDE D'UN POINT PRÉCIS
     * Utile pour afficher l'altitude au survol ou au clic
     * @param {number} easting  - Coordonnée X (ex: 2600000)
     * @param {number} northing - Coordonnée Y (ex: 1200000)
     * @returns {Promise<number|null>} - Altitude en mètres
     */
    async getPointHeight(easting, northing) {
        try {
            const url = `${BASE_URL}/height?easting=${easting}&northing=${northing}&sr=2056`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`Erreur API Height: ${response.status}`);

            const data = await response.json();
            // L'API retourne {"height": "550.5"}
            return parseFloat(data.height);
        } catch (error) {
            console.error("Erreur getPointHeight:", error);
            return null;
        }
    },

    /**
       * Récupère le profil altimétrique pour un tracé (LineString)
       * @param {Array} coordinates - Tableau de coordonnées [[E, N], [E, N], ...] en MN95
       * @param {number} nbPoints - Nombre de points d'échantillonnage (défaut 200)
       * @returns {Promise<Array>} - Liste des points du profil avec distance et altitude
       */
    async getLineProfileOLD(coordinates, nbPoints = 200) {
        try {
            // Préparation de l'objet GeoJSON requis par l'API
            const geom = {
                type: "LineString",
                coordinates: coordinates
            };

            // Construction de l'URL avec encodage de la géométrie
            // On utilise sr=2056 pour le système suisse et distinct_points=True 
            // pour être sûr que nos points cliqués font partie du résultat.
            const params = new URLSearchParams({
                sr: '2056',
                nb_points: nbPoints.toString(),
                distinct_points: 'True',
                geom: JSON.stringify(geom)
            });

            const url = `${BASE_URL}/profile.json?${params.toString()}`;

            const response = await fetch(url);
            //console.log("response", response)
            if (!response.ok) {
                throw new Error(`Erreur Profil API: ${response.status}`);
            }

            const data = await response.json();

            /**
             * L'API renvoie un tableau d'objets :
             * [ { "alts": {"DTM25": 550.1}, "dist": 0, "x": 2600, "y": 1200 }, ... ]
             */
            //console.log(data.map(point => point.alts?.COMB ?? null))
            return data.map(point => point.alts?.COMB ?? null)
        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
            return null;
        }
    },

    async getLineProfile(coordinates, nbPoints = 200) {
        try {
            // 1. Pulizia: Arrotondiamo i decimali (l'API non vuole 15 cifre decimali)
            // e rimuoviamo punti identici consecutivi
            let cleanedCoords = coordinates.map(c => [
                Math.round(c[0] * 10) / 10,
                Math.round(c[1] * 10) / 10
            ]).filter((coord, index, self) => {
                if (index === 0) return true;
                return coord[0] !== self[index - 1][0] || coord[1] !== self[index - 1][1];
            });

            // 2. Semplificazione forzata: l'API accetta max ~50-100 punti per la geometria in GET
            // Se il GPX è denso, ne prendiamo un campione rappresentativo
            const MAX_POINTS_FOR_API = 100;
            let simplifiedCoords = cleanedCoords;

            if (cleanedCoords.length > MAX_POINTS_FOR_API) {
                const step = Math.ceil(cleanedCoords.length / MAX_POINTS_FOR_API);
                simplifiedCoords = cleanedCoords.filter((_, idx) => idx % step === 0);

                // Assicuriamoci che l'ultimo punto originale sia incluso
                const lastPoint = cleanedCoords[cleanedCoords.length - 1];
                if (simplifiedCoords[simplifiedCoords.length - 1] !== lastPoint) {
                    simplifiedCoords.push(lastPoint);
                }
            }

            const geom = {
                type: "LineString",
                coordinates: simplifiedCoords
            };

            const params = new URLSearchParams({
                sr: '2056',
                nb_points: nbPoints.toString(),
                distinct_points: 'True',
                geom: JSON.stringify(geom)
            });

            const url = `${BASE_URL}/profile.json?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Dettagli errore API:", errorData);
                throw new Error(`Erreur Profil API: ${response.status}`);
            }

            const data = await response.json();
            // COMB è lo strato altimetrico combinato più preciso
            return data.map(point => point.alts?.COMB ?? point.alts?.DTM25 ?? 0);

        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
            return null;
        }
    },

    /**
     * GÉNÉRER L'URL POUR EXCEL (CSV)
     * Permet de tester les données ou d'offrir un export à l'utilisateur
     * @param {Array} coordinates - [[E, N], [E, N]...]
     * @returns {string} - URL directe vers le fichier CSV
     */
    getCSVProfileURL(coordinates) {
        const geom = {
            type: "LineString",
            coordinates: coordinates
        };

        const params = new URLSearchParams({
            sr: '2056',
            distinct_points: 'True',
            geom: JSON.stringify(geom)
        });

        return `${BASE_URL}/profile.csv?${params.toString()}`;
    }
};