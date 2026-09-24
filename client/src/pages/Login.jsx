import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useHealth } from '../health.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const health = useHealth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-4">
      <div className="card p-6 md:p-8">
        <div className="flex flex-col items-center">
          <Logo size={64} />
          <h1 className="mt-3 text-2xl font-extrabold text-ocean-800">Welcome back</h1>
          <p className="text-sm text-slate-500">Log in to see and manage your complaints</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full text-lg py-3.5">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to CIVICCARE?{' '}
          <Link to="/signup" className="font-bold text-ocean-600 hover:underline">
            Create a free account
          </Link>
        </p>
      </div>

      {health && health.demoMode && (
        <div className="mt-4 rounded-2xl bg-ocean-50 border border-ocean-200 px-5 py-4 text-sm text-ocean-800">
          <p className="font-bold">🧪 Trying it for the first time?</p>
          <p className="mt-1">
            In demo mode you can log in with <span className="font-mono font-semibold">demo@civiccare.in</span> /{' '}
            <span className="font-mono font-semibold">Demo@123</span>
          </p>
        </div>
      )}
    </div>
  );
}
