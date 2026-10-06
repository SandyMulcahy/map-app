import type { LatLng } from '../types';
import { formatDistance } from '../lib/geo';

interface Props {
  points: LatLng[];
  distance: number;
  name: string;
  defaultName: string;
  colour: string;
  signedIn: boolean;
  saving: boolean;
  onName: (name: string) => void;
  onColour: (colour: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function DraftPanel(props: Props) {
  const { points, distance, name, defaultName, colour, signedIn, saving } = props;
  const canSave = points.length >= 2 && !saving;

  return (
    <section className="panel" aria-label="New route">
      <h2>New route</h2>

      <p className="distance" aria-live="polite">
        <span className="distance-value">{formatDistance(distance)}</span>
        <span className="muted">
          {points.length} {points.length === 1 ? 'point' : 'points'}
        </span>
      </p>

      {points.length === 0 && <p className="muted">Click the map to place the start of your route.</p>}
      {points.length === 1 && <p className="muted">Click again to add the next point.</p>}

      <div className="row">
        <button type="button" onClick={props.onUndo} disabled={points.length === 0}>
          Undo
        </button>
        <button type="button" onClick={props.onClear} disabled={points.length === 0}>
          Clear
        </button>
      </div>

      <div className="field-row">
        <label className="field grow">
          <span>Name</span>
          <input
            type="text"
            value={name}
            maxLength={100}
            placeholder={defaultName}
            onChange={(e) => props.onName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Colour</span>
          <input
            type="color"
            className="swatch"
            value={colour}
            onChange={(e) => props.onColour(e.target.value)}
          />
        </label>
      </div>

      <div className="row">
        <button type="button" className="primary" onClick={props.onSave} disabled={!canSave}>
          {saving ? 'Saving…' : signedIn ? 'Save route' : 'Log in to save'}
        </button>
        {signedIn && (
          <button type="button" onClick={props.onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>

      {!signedIn && (
        <p className="muted">You can draw without an account. Log in or sign up to keep your routes.</p>
      )}
    </section>
  );
}
