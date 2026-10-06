import type { LatLng } from '../types';

const EARTH_RADIUS_M = 6371008.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a route in metres. */
export function routeDistance(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1], points[i]);
  }
  return total;
}

export function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(2)} km`;
}

/** Colours used for route lines. These are the only colours in the UI. */
export const PALETTE = [
  '#e6194b',
  '#1f77b4',
  '#2ca02c',
  '#ff7f0e',
  '#9467bd',
  '#00a6a6',
  '#d62fa0',
  '#8c564b',
];

/** First palette colour not already in use, cycling once all are taken. */
export function nextColour(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  const free = PALETTE.find((c) => !taken.has(c));
  return free ?? PALETTE[used.length % PALETTE.length];
}
