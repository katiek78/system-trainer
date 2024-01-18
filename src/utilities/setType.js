export const determineSetType = (numberOfImages) => {
    if (numberOfImages === 100) return '2d';
    if (numberOfImages === 1000) return '3d';
    if (numberOfImages === 10000) return '4d';
    if (numberOfImages === 52) return '1c';
    if (numberOfImages === 2704) return '2c';
    if (numberOfImages === 1352) return '2cv';
    return 'other'
  }