import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthDialog, { type AuthMode } from './components/AuthDialog';
import DraftPanel from './components/DraftPanel';
import MapView, { type Focus } from './components/MapView';
import RouteList from './components/RouteList';
import { nextColour, routeDistance } from './lib/geo';
import { createRoute, deleteRoute, listRoutes, updateRoute } from './lib/routesApi';
import { load, save } from './lib/storage';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/useAuth';
import type { LatLng, Route } from './types';

const DRAFT_KEY = 'routes.draft';
const HIDDEN_KEY = 'routes.hidden';
const COLOUR_SAVE_DELAY_MS = 500;

function loadDraft(): LatLng[] {
  const raw = load<unknown>(DRAFT_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is LatLng =>
      Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  );
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong.';
}

export default function App() {
  const { user, ready } = useAuth();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>(() => {
    const raw = load<unknown>(HIDDEN_KEY, []);
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  });

  // The route being drawn.
  const [points, setPoints] = useState<LatLng[]>(loadDraft);
  const [name, setName] = useState('');
  const [colourChoice, setColourChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // null = decide automatically: visitors start in drawing mode, signed-in users start
  // by viewing their routes. An unfinished route always keeps drawing mode on.
  const [drawingChoice, setDrawingChoice] = useState<boolean | null>(null);
  const drawing = drawingChoice ?? ((ready && !user) || points.length > 0);

  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  const distance = useMemo(() => routeDistance(points), [points]);
  const draftColour = colourChoice ?? nextColour(routes.map((r) => r.colour));
  const defaultName = useMemo(
    () =>
      `Route ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    [],
  );
  const visibleRoutes = useMemo(() => routes.filter((r) => !hidden.includes(r.id)), [routes, hidden]);

  // Remember an unfinished route across reloads (and across logging in).
  useEffect(() => save(DRAFT_KEY, points), [points]);
  useEffect(() => save(HIDDEN_KEY, hidden), [hidden]);

  // Load the signed-in user's routes; clear them on log out.
  useEffect(() => {
    if (!user) {
      setRoutes([]);
      setDrawingChoice(null);
      return;
    }
    let active = true;
    setLoading(true);
    listRoutes()
      .then((rows) => active && setRoutes(rows))
      .catch((e) => active && setError(`Could not load your routes: ${message(e)}`))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const addPoint = useCallback((point: LatLng) => setPoints((prev) => [...prev, point]), []);
  const undo = useCallback(() => setPoints((prev) => prev.slice(0, -1)), []);

  // Ctrl/Cmd+Z removes the last point while drawing.
  useEffect(() => {
    if (!drawing) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawing, undo]);

  function resetDraft() {
    setPoints([]);
    setName('');
    setColourChoice(null);
  }

  async function saveDraft() {
    if (!user) {
      setAuthMode('login');
      return;
    }
    if (points.length < 2 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createRoute({
        name: name.trim() || defaultName,
        colour: draftColour,
        points,
        distance_m: Math.round(distance * 10) / 10,
      });
      setRoutes((prev) => [created, ...prev]);
      resetDraft();
      setDrawingChoice(false);
    } catch (e) {
      setError(`Could not save the route: ${message(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function rename(id: string, nextName: string) {
    const before = routes.find((r) => r.id === id);
    if (!before) return;
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, name: nextName } : r)));
    try {
      await updateRoute(id, { name: nextName });
    } catch (e) {
      setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, name: before.name } : r)));
      setError(`Could not rename the route: ${message(e)}`);
    }
  }

  // Colour pickers fire continuously while dragging, so the line updates at once
  // and the database write waits until the colour has settled.
  const colourTimers = useRef(new Map<string, number>());
  function recolour(id: string, colour: string) {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, colour } : r)));
    const timers = colourTimers.current;
    window.clearTimeout(timers.get(id));
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        updateRoute(id, { colour }).catch((e) => setError(`Could not save the colour: ${message(e)}`));
      }, COLOUR_SAVE_DELAY_MS),
    );
  }

  async function remove(id: string) {
    try {
      window.clearTimeout(colourTimers.current.get(id));
      colourTimers.current.delete(id);
      await deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      setHidden((prev) => prev.filter((h) => h !== id));
    } catch (e) {
      setError(`Could not delete the route: ${message(e)}`);
    }
  }

  function toggle(id: string) {
    setHidden((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  }

  function zoomTo(route: Route) {
    setHidden((prev) => prev.filter((h) => h !== route.id));
    setFocus({ points: route.points, nonce: Date.now() });
  }

  async function logOut() {
    const { error } = (await supabase?.auth.signOut()) ?? { error: null };
    if (error) setError(`Could not log out: ${error.message}`);
  }

  const closeAuth = useCallback(() => setAuthMode(null), []);

  return (
    <div className="app">
      <header className="header">
        <h1>Routes</h1>
        <div className="account">
          {!ready ? null : user ? (
            <>
              <span className="email" title={user.email}>
                {user.email}
              </span>
              <button type="button" onClick={logOut}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setAuthMode('login')}>
                Log in
              </button>
              <button type="button" className="primary" onClick={() => setAuthMode('signup')}>
                Sign up
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          {error && (
            <div className="notice" role="alert">
              <span>{error}</span>
              <button type="button" className="link" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {drawing ? (
            <DraftPanel
              points={points}
              distance={distance}
              name={name}
              defaultName={defaultName}
              colour={draftColour}
              signedIn={!!user}
              saving={saving}
              onName={setName}
              onColour={setColourChoice}
              onUndo={undo}
              onClear={() => setPoints([])}
              onSave={saveDraft}
              onCancel={() => {
                resetDraft();
                setDrawingChoice(false);
              }}
            />
          ) : (
            ready && (
              <section className="panel">
                <button type="button" className="primary" onClick={() => setDrawingChoice(true)}>
                  New route
                </button>
              </section>
            )
          )}

          {user && (
            <RouteList
              routes={routes}
              hidden={hidden}
              loading={loading}
              onToggle={toggle}
              onSetAllVisible={(visible) => setHidden(visible ? [] : routes.map((r) => r.id))}
              onRename={rename}
              onColour={recolour}
              onDelete={remove}
              onZoom={zoomTo}
            />
          )}
        </aside>

        <MapView
          routes={visibleRoutes}
          draftPoints={points}
          draftColour={draftColour}
          drawing={drawing}
          onAddPoint={addPoint}
          focus={focus}
        />
      </main>

      {authMode && <AuthDialog initialMode={authMode} onClose={closeAuth} />}
    </div>
  );
}
