import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { User } from '../types';

function toUser(u: { id: string; email?: string } | null | undefined): User | null {
  return u ? { id: u.id, email: u.email ?? '' } : null;
}

/**
 * The signed-in user, or null. `ready` turns true once the stored session
 * (if any) has been restored, so the UI can avoid flashing the signed-out view.
 */
export function useAuth(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    // Keep the same object while the user is unchanged, so token refreshes
    // don't trigger a reload of the routes.
    const apply = (next: User | null) => {
      if (!active) return;
      setUser((prev) => (prev?.id === next?.id ? prev : next));
      setReady(true);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(toUser(data.session?.user)))
      .catch(() => apply(null));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(toUser(session?.user));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}
