/** Haversine distance in km between two lat/lon points. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Known Swiss city coordinates for profile location lookup. */
const SWISS_CITIES: Record<string, { lat: number; lon: number }> = {
  zurich: { lat: 47.3769, lon: 8.5417 },
  zürich: { lat: 47.3769, lon: 8.5417 },
  bern: { lat: 46.948, lon: 7.4474 },
  basel: { lat: 47.5596, lon: 7.5886 },
  geneva: { lat: 46.2044, lon: 6.1432 },
  genf: { lat: 46.2044, lon: 6.1432 },
  genève: { lat: 46.2044, lon: 6.1432 },
  lausanne: { lat: 46.5197, lon: 6.6323 },
  lucerne: { lat: 47.0502, lon: 8.3093 },
  luzern: { lat: 47.0502, lon: 8.3093 },
  solothurn: { lat: 47.2088, lon: 7.5323 },
  winterthur: { lat: 47.4985, lon: 8.7241 },
  'st. gallen': { lat: 47.4245, lon: 9.3767 },
  lugano: { lat: 46.0037, lon: 8.9511 },
  biel: { lat: 47.1368, lon: 7.2467 },
  bienne: { lat: 47.1368, lon: 7.2467 },
  thun: { lat: 46.758, lon: 7.628 },
  aarau: { lat: 47.3904, lon: 8.0524 },
  olten: { lat: 47.3521, lon: 7.9065 },
  baden: { lat: 47.4734, lon: 8.3064 },
  zug: { lat: 47.1724, lon: 8.5174 },
  fribourg: { lat: 46.8065, lon: 7.162 },
  schaffhausen: { lat: 47.6965, lon: 8.635 },
  chur: { lat: 46.8499, lon: 9.5329 },
};

export function geocodeCity(location: string): { lat: number; lon: number } | null {
  const normalized = location.toLowerCase().trim();
  for (const [city, coords] of Object.entries(SWISS_CITIES)) {
    if (normalized.includes(city)) {
      return coords;
    }
  }
  return null;
}
