import { GPX } from 'ol/format';

export const geoUtils = {
  /**
   * Calculates the total planimetric length of a coordinate array
   */
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

  /**
   * Calculates cumulative positive and negative elevation gains from a profile
   */
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




// ... all'interno dell'oggetto geoUtils
async parseGPX(fileContent) {
    const format = new GPX();
    // Leggiamo tutte le features (punti e linee)
    const allFeatures = format.readFeatures(fileContent);
    
    // Cerchiamo la feature che è una linea (il tracciato vero e proprio)
    const trackFeature = allFeatures.find(f => 
        f.getGeometry().getType() === 'LineString' || 
        f.getGeometry().getType() === 'MultiLineString'
    );

    if (!trackFeature) {
        throw new Error("Nessun tracciato (track) trovato nel file GPX.");
    }

    const geometry = trackFeature.getGeometry();
    
    // Trasformiamo le coordinate da GPS (4326) a Svizzere (2056)
    // Se è una MultiLineString, prendiamo solo la prima linea
    const coords2056 = geometry.getType() === 'MultiLineString' 
        ? geometry.getLineString(0).transform('EPSG:4326', 'EPSG:2056').getCoordinates()
        : geometry.transform('EPSG:4326', 'EPSG:2056').getCoordinates();

    // Pulizia coordinate: prendiamo solo X e Y (evitiamo Z o Time se presenti)
    return coords2056.map(c => [c[0], c[1]]);
}
};