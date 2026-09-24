import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../auth.jsx';
import { useHealth } from '../health.js';

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const health = useHealth();

  let banner = '';
  if (health) {
    if (health.demoMode) {
      banner =
        'Demo mode — data is stored in memory (resets on restart) and AI is mocked. Add your Supabase + Gemini keys to go live.';
    } else if (!health.aiEnabled) {
      banner = 'AI is not connected yet — add GEMINI_API_KEY to server/.env to enable real AI help.';
    }
  }

  const doLogout = () => {
    logout();
    navigate('/');
  };

  const navCls = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
      isActive ? 'text-ocean-700' : 'text-slate-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <Logo size={38} />
            <span className="leading-tight">
              <span className="block font-extrabold text-ocean-800 tracking-tight text-lg">CIVICCARE</span>
              <span className="hidden sm:block text-[11px] text-slate-400 -mt-0.5">
                See it. Report it. Track it.
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Main navigation">
            {loading ? null : user ? (
              <>
                <Link to="/profile" className="hidden sm:inline-flex btn-ghost text-sm py-2 px-3">
                  👤 {user.name.split(' ')[0]}
                </Link>
                <button onClick={doLogout} className="btn-ghost text-sm py-2 px-3">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm py-2 px-3">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">
                  Sign up free
                </Link>
              </>
            )}
          </nav>
        </div>
        {banner && (
          <div className="bg-amber-50 text-amber-800 text-xs font-medium text-center px-4 py-1.5 border-t border-amber-100">
            {banner}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 pb-24 md:pb-12">{children}</main>

      {/* Mobile bottom navigation */}
      {user && !loading && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-3"
          aria-label="Mobile navigation"
        >
          <NavLink to="/dashboard" className={navCls}>
            <span className="text-xl">🏠</span>
            Home
          </NavLink>
          <NavLink to="/report" className="relative flex flex-col items-center justify-end pb-1.5 -mt-5">
            <span className="w-14 h-14 rounded-full bg-ocean-600 text-white text-2xl shadow-lg flex items-center justify-center border-4 border-white">
              📷
            </span>
            <span className="text-[10px] font-bold text-ocean-700 mt-1">Report</span>
          </NavLink>
          <NavLink to="/profile" className={navCls}>
            <span className="text-xl">👤</span>
            Profile
          </NavLink>
        </nav>
      )}

      {/* Footer (desktop) */}
      <footer className="hidden md:block bg-white border-t border-slate-200/60 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>
            <span className="font-bold text-ocean-700">CIVICCARE</span> — See it. Report it. Track it. Improve India.
          </p>
          <p className="mt-1 text-xs">A citizen-reporting concept · Not an official government website.</p>
        </div>
      </footer>
    </div>
  );
}
