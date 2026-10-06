import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLng, Route } from '../types';

// Used until (or unless) the browser shares a location.
const FALLBACK_CENTRE: LatLng = [51.752, -1.2577]; // Oxford
const FALLBACK_ZOOM = 14;
const LOCATED_ZOOM = 15;

export interface Focus {
  points: LatLng[];
  /** Changes on every request, so asking for the same route twice still zooms. */
  nonce: number;
}

interface Props {
  routes: Route[];
  draftPoints: LatLng[];
  draftColour: string;
  drawing: boolean;
  onAddPoint: (point: LatLng) => void;
  focus: Focus | null;
}

function ClickHandler({ enabled, onAddPoint }: { enabled: boolean; onAddPoint: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapView({ routes, draftPoints, draftColour, drawing, onAddPoint, focus }: Props) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [here, setHere] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Read once at start-up: a draft restored from a previous visit.
  const initialDraft = useRef(draftPoints);

  function locate(recentre: boolean, reportErrors: boolean) {
    if (!map) return;
    if (!('geolocation' in navigator)) {
      if (reportErrors) setLocateError('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setHere(point);
        setLocating(false);
        if (recentre) map.setView(point, Math.max(map.getZoom(), LOCATED_ZOOM));
      },
      () => {
        setLocating(false);
        if (reportErrors) setLocateError('Location unavailable. Check the browser permission.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  // Opening view: an unfinished route if there is one, otherwise where you are.
  useEffect(() => {
    if (!map) return;
    const draft = initialDraft.current;
    if (draft.length >= 2) {
      map.fitBounds(draft, { padding: [40, 40] });
      locate(false, false);
    } else if (draft.length === 1) {
      map.setView(draft[0], LOCATED_ZOOM);
      locate(false, false);
    } else {
      locate(true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Double-click would otherwise zoom the map while placing points quickly.
  useEffect(() => {
    if (!map) return;
    if (drawing) map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }, [map, drawing]);

  // Zoom to a route when asked.
  useEffect(() => {
    if (!map || !focus || focus.points.length === 0) return;
    if (focus.points.length === 1) map.setView(focus.points[0], LOCATED_ZOOM);
    else map.fitBounds(focus.points, { padding: [40, 40] });
  }, [map, focus]);

  // Leaflet needs telling when its container changes size (e.g. phone rotation).
  useEffect(() => {
    const el = wrapRef.current;
    if (!map || !el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);

  return (
    <div ref={wrapRef} className={drawing ? 'map-wrap drawing' : 'map-wrap'}>
      <MapContainer
        ref={setMap}
        center={FALLBACK_CENTRE}
        zoom={FALLBACK_ZOOM}
        className="map"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <ClickHandler enabled={drawing} onAddPoint={onAddPoint} />

        {here && (
          <CircleMarker
            center={here}
            radius={6}
            interactive={false}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#111111', fillOpacity: 1 }}
          />
        )}

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            interactive={false}
            pathOptions={{ color: route.colour, weight: 4, opacity: 0.9 }}
          />
        ))}

        {draftPoints.length > 1 && (
          <Polyline
            positions={draftPoints}
            interactive={false}
            pathOptions={{ color: draftColour, weight: 4, opacity: 0.9 }}
          />
        )}
        {draftPoints.map((point, i) => (
          <CircleMarker
            key={i}
            center={point}
            radius={i === 0 ? 6 : 4}
            interactive={false}
            pathOptions={{
              color: draftColour,
              weight: 2,
              fillColor: i === 0 ? draftColour : '#ffffff',
              fillOpacity: 1,
            }}
          />
        ))}
      </MapContainer>

      <div className="map-tools">
        <button type="button" onClick={() => locate(true, true)} disabled={locating}>
          {locating ? 'Locating…' : 'My location'}
        </button>
        {locateError && <p className="map-note" role="status">{locateError}</p>}
      </div>
    </div>
  );
}
