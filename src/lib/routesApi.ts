import { supabase } from './supabase';
import type { LatLng, Route } from '../types';

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function isLatLng(p: unknown): p is LatLng {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    Number.isFinite(p[0]) &&
    Number.isFinite(p[1])
  );
}

// Rows come back as loosely-typed JSON, so check the shape before using it.
function toRoute(row: Record<string, unknown>): Route {
  const points = Array.isArray(row.points) ? row.points.filter(isLatLng) : [];
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    colour: String(row.colour ?? '#000000'),
    points,
    distance_m: Number(row.distance_m ?? 0),
    created_at: String(row.created_at ?? ''),
  };
}

export async function listRoutes(): Promise<Route[]> {
  const { data, error } = await client()
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toRoute);
}

export async function createRoute(input: {
  name: string;
  colour: string;
  points: LatLng[];
  distance_m: number;
}): Promise<Route> {
  // user_id is filled in by the database (default auth.uid()).
  const { data, error } = await client().from('routes').insert(input).select().single();
  if (error) throw new Error(error.message);
  return toRoute(data);
}

export async function updateRoute(
  id: string,
  changes: Partial<Pick<Route, 'name' | 'colour'>>,
): Promise<Route> {
  const { data, error } = await client()
    .from('routes')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toRoute(data);
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await client().from('routes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
