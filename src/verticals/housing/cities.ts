/** Feste Städteliste für das MVP (keine externe Geocoding-API). */
export const cities = {
  berlin: { name: "Berlin", lat: 52.52, lng: 13.405 },
  hamburg: { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  muenchen: { name: "München", lat: 48.1351, lng: 11.582 },
  koeln: { name: "Köln", lat: 50.9375, lng: 6.9603 },
  frankfurt: { name: "Frankfurt am Main", lat: 50.1109, lng: 8.6821 },
  stuttgart: { name: "Stuttgart", lat: 48.7758, lng: 9.1829 },
  duesseldorf: { name: "Düsseldorf", lat: 51.2277, lng: 6.7735 },
  leipzig: { name: "Leipzig", lat: 51.3397, lng: 12.3731 },
} as const;

export type CityKey = keyof typeof cities;
export const cityKeys = Object.keys(cities) as [CityKey, ...CityKey[]];

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
