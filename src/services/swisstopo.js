const BASE_URL = 'https://api3.geo.admin.ch/rest/services';

export const swisstopoService = {

    /**
     * RÉCUPÉRER L'ALTITUDE D'UN POINT
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
    async getLineProfile(coordinates, nbPoints = 200) {
        try {
            // On arrondit les coo et on elimine les points doublons
            let cleanedCoords = coordinates.map(c => [
                Math.round(c[0] * 10) / 10,
                Math.round(c[1] * 10) / 10
            ]).filter((coord, index, self) => {
                if (index === 0) return true;
                return coord[0] !== self[index - 1][0] || coord[1] !== self[index - 1][1];
            });

            // On fixe a 100 le nombre max de points pour l'API (ca evite les erreurs 414 URI too long)
            const MAX_POINTS_FOR_API = 100;
            let simplifiedCoords = cleanedCoords;

            // Si on a plus de points que le max, on échantillonne régulièrement pour réduire la taille du payload
            if (cleanedCoords.length > MAX_POINTS_FOR_API) {
                const step = Math.ceil(cleanedCoords.length / MAX_POINTS_FOR_API);
                simplifiedCoords = cleanedCoords.filter((_, idx) => idx % step === 0);

                // Le dernier point doit toujours être inclus pour que le profil soit complet
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
            //COMB (combine) est la meilleure estimation de l'altitude
            return data.map(point => point.alts?.COMB ?? point.alts?.DTM25 ?? 0);

        } catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
            return null;
        }
    }
};