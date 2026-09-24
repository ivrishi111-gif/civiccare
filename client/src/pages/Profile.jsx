import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/api/complaints')
      .then((d) => {
        const cs = d.complaints;
        setStats({
          total: cs.length,
          open: cs.filter((c) => c.status === 'open').length,
          progress: cs.filter((c) => c.status === 'in_progress').length,
          resolved: cs.filter((c) => c.status === 'resolved').length,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-ocean-100 flex items-center justify-center text-4xl">
          👤
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-800">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-center">
        {[
          ['Total', stats?.total],
          ['Open', stats?.open],
          ['In Progress', stats?.progress],
          ['Resolved', stats?.resolved],
        ].map(([label, val]) => (
          <div key={label} className="card py-3">
            <p className="text-xl font-extrabold text-ocean-600">{val ?? '–'}</p>
            <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 card divide-y divide-slate-100">
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-4 font-semibold text-slate-700 hover:bg-slate-50">
          📋 My complaints
        </Link>
        <Link to="/report" className="flex items-center gap-3 px-5 py-4 font-semibold text-slate-700 hover:bg-slate-50">
          📷 Report a problem
        </Link>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center gap-3 px-5 py-4 font-semibold text-red-600 hover:bg-red-50"
        >
          🚪 Logout
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        CIVICCARE is a citizen-reporting concept, not an official government website.
      </p>
    </div>
  );
}
