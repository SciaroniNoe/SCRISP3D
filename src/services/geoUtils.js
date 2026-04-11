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
  }
};