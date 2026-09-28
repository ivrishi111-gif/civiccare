import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listComplaints } from '../api.js';
import { STATUS_STYLE, CATEGORY_ICONS, PROGRESS_STEPS, statusIndex, formatDate, shortId } from '../constants.js';
import { useI18n } from '../i18n.jsx';

function ProgressDots({ status, t }) {
  const idx = statusIndex(status);
  const style = STATUS_STYLE[status] || STATUS_STYLE.open;
  return (
    <div className="flex items-center gap-1" aria-label={`${t('detail.progress')}: ${status}`}>
      {PROGRESS_STEPS.map((s, i) => (
        <div
          key={s}
          className="h-1.5 flex-1 rounded-full"
          style={{ background: i <= idx ? style.bar : '#e2e8f0' }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    listComplaints()
      .then((d) => setComplaints(d.complaints))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-sky-900">{t('dash.title')}</h1>
          <p className="text-sm text-slate-500">{t('dash.sub')}</p>
        </div>
        <Link to="/new" className="bg-sky-600 hover:bg-sky-700 text-white font-black px-5 py-3 rounded-2xl whitespace-nowrap">
          {t('dash.new')}
        </Link>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!complaints && !error && <p className="mt-10 text-center text-slate-400 font-bold">…</p>}

      {complaints && complaints.length === 0 && (
        <div className="mt-10 text-center bg-white rounded-3xl border-2 border-dashed border-sky-200 py-14 px-6">
          <div className="text-5xl">📭</div>
          <h2 className="mt-3 text-xl font-black text-sky-900">{t('dash.emptyT')}</h2>
          <p className="text-slate-500 mt-1">{t('dash.emptyS')}</p>
          <Link to="/new" className="inline-block mt-5 bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-3.5 rounded-2xl">
            {t('dash.emptyBtn')}
          </Link>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {complaints?.map((c) => {
          const style = STATUS_STYLE[c.status] || STATUS_STYLE.open;
          return (
            <Link
              key={c.id}
              to={`/complaints/${c.id}`}
              className="block bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="flex">
                <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 bg-slate-100">
                  {c.photo ? (
                    <img src={c.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {CATEGORY_ICONS[c.category] || '📍'}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {t(`status.${c.status}`)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-bold">{shortId(c.id)}</span>
                  </div>
                  <div className="mt-1.5 font-black text-slate-800 truncate">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {CATEGORY_ICONS[c.category]} {c.category} · {formatDate(c.created_at)}
                  </div>
                  <div className="mt-2.5">
                    <ProgressDots status={c.status} t={t} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
