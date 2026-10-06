/** A point on the map as [latitude, longitude]. */
export type LatLng = [number, number];

export interface Route {
  id: string;
  name: string;
  colour: string;
  points: LatLng[];
  distance_m: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}
