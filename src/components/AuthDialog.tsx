import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export type AuthMode = 'login' | 'signup';

interface Props {
  initialMode: AuthMode;
  onClose: () => void;
}

export default function AuthDialog({ initialMode, onClose }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else if (data.session) onClose();
        // Only reached if email confirmation is switched on in Supabase.
        else setInfo('Account created. Confirm it using the email we sent, then log in.');
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'login' ? 'Log in' : 'Sign up';

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="panel-head">
          <h2 id="auth-title">{title}</h2>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </div>

        {!supabase ? (
          <p>
            Accounts are not set up yet. Add your Supabase details to <code>.env.local</code> as
            described in <code>SETUP.md</code>, then restart the app.
          </p>
        ) : (
          <form onSubmit={submit} className="stack">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                required
                autoFocus
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {mode === 'signup' && <p className="muted">At least 6 characters.</p>}

            {error && <p className="notice" role="alert">{error}</p>}
            {info && <p className="notice" role="status">{info}</p>}

            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Please wait…' : title}
            </button>

            <p className="muted">
              {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
              <button
                type="button"
                className="link"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
