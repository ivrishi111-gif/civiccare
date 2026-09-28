import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authorityComplaints } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useI18n } from '../../i18n.jsx';
import { STATUS_STYLE, CATEGORY_ICONS, formatDate, shortId } from '../../constants.js';

const FILTERS = ['all', 'open', 'assigned', 'in_progress', 'completed', 'resolved'];

export default function AuthorityDashboard() {
  const { authority, logout } = useAuth();
  const { t } = useI18n();
  const [complaints, setComplaints] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = () => {
    authorityComplaints(filter)
      .then((d) => setComplaints(d.complaints))
      .catch((e) => setError(e.message));
  };
  useEffect(load, [filter]);

  const counts = (list) => {
    const c = { all: list.length, open: 0, assigned: 0, in_progress: 0, completed: 0, resolved: 0 };
    for (const x of list) c[x.status] = (c[x.status] || 0) + 1;
    return c;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">🏛️ {t('authority.portal')}</h1>
          <p className="text-sm text-slate-500">
            {authority?.name}
            {authority?.department ? ` · ${authority.department}` : ''}
            {authority?.isDemo ? ' · (demo)' : ''}
          </p>
        </div>
        <button
          onClick={() => logout('authority')}
          className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
        >
          {t('nav.logout')}
        </button>
      </div>

      {/* filter chips */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-xl font-black text-sm border-2 ${
              filter === f
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {f === 'all' ? t('authority.all') : t(`status.${f}`)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {!complaints && !error && <p className="mt-10 text-center text-slate-400 font-bold">…</p>}

      {complaints && (
        <>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
            {FILTERS.map((f) => {
              const n = counts(complaints)[f] || 0;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-2xl border-2 p-3 ${
                    filter === f ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-2xl font-black text-slate-800">{n}</div>
                  <div className="text-[11px] font-bold text-slate-500">
                    {f === 'all' ? t('authority.all') : t(`status.${f}`)}
                  </div>
                </button>
              );
            })}
          </div>

          {complaints.length === 0 ? (
            <div className="mt-8 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 py-14">
              <div className="text-4xl">📭</div>
              <p className="font-bold text-slate-500 mt-2">{t('authority.noComplaints')}</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {complaints.map((c) => {
                const style = STATUS_STYLE[c.status] || STATUS_STYLE.open;
                return (
                  <Link
                    key={c.id}
                    to={`/authority/${c.id}`}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 hover:shadow-md transition"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {c.photo || c.before_image ? (
                        <img src={c.photo || c.before_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {CATEGORY_ICONS[c.category] || '📍'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {t(`status.${c.status}`)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono font-bold">#{shortId(c.id)}</span>
                      </div>
                      <div className="font-black text-slate-800 truncate mt-1">{c.title}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {CATEGORY_ICONS[c.category]} {c.category}
                        {c.location ? ` · 📍 ${c.location}` : ''} · {formatDate(c.created_at)}
                      </div>
                    </div>
                    <span className="text-slate-300 text-xl">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
