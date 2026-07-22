interface ILatLon { latitude?: number, longitude?: number };
const geoDistanceHaversine = (geo1: ILatLon, geo2: ILatLon) => {
  if (geo1.latitude == null || geo1.longitude == null ||
    geo2.latitude == null || geo2.longitude == null) return -1;
  const deg2rad = (deg: number) => deg * Math.PI / 180;
  const dLat = deg2rad(geo2.latitude - geo1.latitude);
  const dLon = deg2rad(geo2.longitude - geo1.longitude);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(geo1.latitude)) * Math.cos(deg2rad(geo2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c * 6371000; // multiply with radius of earth in m to get distance
};

const geoDistanceEucl = (geo1: ILatLon, geo2: ILatLon) => {
  if (geo1.latitude == null || geo1.longitude == null ||
    geo2.latitude == null || geo2.longitude == null) return -1;
  const dx = (geo2.longitude - geo1.longitude) * Math.cos((geo1.latitude + geo2.latitude) / 2);
  const dy = (geo2.latitude - geo1.latitude);
  return Math.sqrt((dx * dx) + (dy * dy)) * 6371000;
};

export default geoDistanceHaversine;
export { geoDistanceEucl };
