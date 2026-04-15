import { GPX } from 'ol/format';

export const geoUtils = {

  //Calcule la longueur totale d'une trace à partir de ses coordonnées (en 2D)
  calculateTotalLength(coordinates) {
    let totalLength = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      const deltaX = end[0] - start[0];
      const deltaY = end[1] - start[1];
      
      totalLength += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    return totalLength;
  },

  //Calcule le denivelé positif et négatif à partir d'une liste de valeurs d'altitude
  calculateElevationGains(zValues) {
    let positiveElevationGain = 0;
    let negativeElevationGain = 0;

    for (let i = 0; i < zValues.length - 1; i++) {
      const difference = zValues[i + 1] - zValues[i];
      
      if (difference > 0) {
        positiveElevationGain += difference;
      } else {
        negativeElevationGain += Math.abs(difference);
      }
    }
    return {
      positiveElevationGain,
      negativeElevationGain
    };
  },

async parseGPX(fileContent) {
    const format = new GPX();

    const allFeatures = format.readFeatures(fileContent);
    
    const trackFeature = allFeatures.find(f => 
        f.getGeometry().getType() === 'LineString' || 
        f.getGeometry().getType() === 'MultiLineString'
    );

    if (!trackFeature) {
        throw new Error("Nessun tracciato (track) trovato nel file GPX.");
    }

    const geometry = trackFeature.getGeometry();
    
    // On transforme les coordonnées en MN95 et on nettoie les données pour l'API
    const coords2056 = geometry.getType() === 'MultiLineString' 
        ? geometry.getLineString(0).transform('EPSG:4326', 'EPSG:2056').getCoordinates()
        : geometry.transform('EPSG:4326', 'EPSG:2056').getCoordinates();
    return coords2056.map(coo => [coo[0], coo[1]]);
}
};