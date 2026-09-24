import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { CATEGORIES, STATUS, refOf, fmtDate } from '../constants.js';

export default function Dashboard() {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/complaints')
      .then((d) => setComplaints(d.complaints))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ocean-800">My Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track everything you have reported</p>
        </div>
        <Link to="/report" className="btn-primary whitespace-nowrap">
          📷 New Report
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!complaints && !error && <p className="text-slate-400 text-center py-10">Loading…</p>}

      {complaints && complaints.length === 0 && (
        <div className="mt-8 text-center card p-10">
          <div className="text-5xl">🌤️</div>
          <h2 className="mt-3 font-bold text-lg text-slate-700">No complaints yet</h2>
          <p className="text-slate-500 mt-1">When you report a problem, it will show up here.</p>
          <Link to="/report" className="btn-primary mt-5">
            Report your first problem
          </Link>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {complaints?.map((c) => {
          const st = STATUS[c.status] || STATUS.open;
          return (
            <Link
              key={c.id}
              to={`/complaints/${c.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block"
            >
              {c.photo ? (
                <img src={c.photo} alt="Problem" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-ocean-50 flex items-center justify-center text-3xl shrink-0">
                  {CATEGORIES[c.category] || '📸'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">
                  {CATEGORIES[c.category] || ''} {c.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {refOf(c.id)} · {fmtDate(c.created_at)}
                  {c.location ? ' · ' + c.location : ''}
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>
                {st.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
