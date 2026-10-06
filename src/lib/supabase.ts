import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null until the two environment variables are set (see SETUP.md).
 * The map and drawing still work without it; only login and saving need it.
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
