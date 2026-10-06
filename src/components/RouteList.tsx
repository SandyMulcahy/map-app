import { useState } from 'react';
import type { Route } from '../types';
import { formatDistance } from '../lib/geo';

interface Props {
  routes: Route[];
  hidden: string[];
  loading: boolean;
  onToggle: (id: string) => void;
  onSetAllVisible: (visible: boolean) => void;
  onRename: (id: string, name: string) => void;
  onColour: (id: string, colour: string) => void;
  onDelete: (id: string) => void;
  onZoom: (route: Route) => void;
}

export default function RouteList(props: Props) {
  const { routes, hidden, loading } = props;
  const anyVisible = routes.some((r) => !hidden.includes(r.id));

  return (
    <section className="panel" aria-label="Saved routes">
      <div className="panel-head">
        <h2>Saved routes</h2>
        {routes.length > 1 && (
          <button type="button" className="link" onClick={() => props.onSetAllVisible(!anyVisible)}>
            {anyVisible ? 'Hide all' : 'Show all'}
          </button>
        )}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {!loading && routes.length === 0 && (
        <p className="muted">No routes yet. Choose “New route” and click the map to draw one.</p>
      )}

      <ul className="route-list">
        {routes.map((route) => (
          <RouteItem
            key={route.id}
            route={route}
            visible={!hidden.includes(route.id)}
            onToggle={() => props.onToggle(route.id)}
            onRename={(name) => props.onRename(route.id, name)}
            onColour={(colour) => props.onColour(route.id, colour)}
            onDelete={() => props.onDelete(route.id)}
            onZoom={() => props.onZoom(route)}
          />
        ))}
      </ul>
    </section>
  );
}

interface ItemProps {
  route: Route;
  visible: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onColour: (colour: string) => void;
  onDelete: () => void;
  onZoom: () => void;
}

function RouteItem({ route, visible, onToggle, onRename, onColour, onDelete, onZoom }: ItemProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(route.name);
  const [confirming, setConfirming] = useState(false);

  function startRename() {
    setDraftName(route.name);
    setEditing(true);
    setConfirming(false);
  }

  function commitRename() {
    const next = draftName.trim();
    if (next && next !== route.name) onRename(next);
    setEditing(false);
  }

  return (
    <li className="route">
      <div className="route-main">
        <input
          type="checkbox"
          checked={visible}
          onChange={onToggle}
          aria-label={`Show ${route.name} on the map`}
        />
        <input
          type="color"
          className="swatch"
          value={route.colour}
          onChange={(e) => onColour(e.target.value)}
          aria-label={`Colour of ${route.name}`}
        />
        {editing ? (
          <form
            className="rename"
            onSubmit={(e) => {
              e.preventDefault();
              commitRename();
            }}
          >
            <input
              type="text"
              value={draftName}
              maxLength={100}
              autoFocus
              aria-label="Route name"
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <button type="submit">Save</button>
          </form>
        ) : (
          <span className="route-name" title={route.name}>
            {route.name}
          </span>
        )}
        {!editing && <span className="route-distance">{formatDistance(route.distance_m)}</span>}
      </div>

      {!editing && (
        <div className="route-actions">
          {confirming ? (
            <>
              <span className="muted">Delete this route?</span>
              <button type="button" className="link" onClick={onDelete}>
                Yes, delete
              </button>
              <button type="button" className="link" onClick={() => setConfirming(false)}>
                Keep
              </button>
            </>
          ) : (
            <>
              <button type="button" className="link" onClick={onZoom}>
                Zoom to
              </button>
              <button type="button" className="link" onClick={startRename}>
                Rename
              </button>
              <button type="button" className="link" onClick={() => setConfirming(true)}>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
