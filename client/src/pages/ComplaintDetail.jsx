import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getComplaint, updateComplaint, deleteComplaint } from '../api.js';
import {
  STATUS_STYLE,
  CATEGORY_ICONS,
  PROGRESS_STEPS,
  statusIndex,
  formatDate,
  shortId,
  CATEGORIES,
} from '../constants.js';
import { useI18n } from '../i18n.jsx';

function ProofPhotos({ c, t }) {
  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
      <h2 className="font-black text-lg text-sky-900">🛠️ {t('detail.proof')}</h2>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <div className="rounded-2xl overflow-hidden border-2 border-slate-300 aspect-square bg-slate-100">
            {c.before_image || c.photo ? (
              <img src={c.before_image || c.photo} alt={t('detail.before')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
            )}
          </div>
          <div className="text-center text-xs font-black text-slate-500 mt-1.5 bg-slate-100 rounded-lg py-1">
            {t('detail.before')}
          </div>
        </div>
        <div>
          <div
            className={`rounded-2xl overflow-hidden aspect-square bg-slate-50 border-2 ${c.after_image ? 'border-emerald-400' : 'border-dashed border-slate-300'}`}
          >
            {c.after_image ? (
              <img src={c.after_image} alt={t('detail.after')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-3 text-center">
                <span className="text-3xl">⏳</span>
                <span className="text-[11px] font-bold text-slate-400 leading-tight">{t('detail.waitingAfter')}</span>
              </div>
            )}
          </div>
          <div
            className={`text-center text-xs font-black mt-1.5 rounded-lg py-1 ${c.after_image ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
          >
            {t('detail.after')}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">{t('detail.proofHint')}</p>
    </div>
  );
}

function Timeline({ history, t }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
        <h2 className="font-black text-lg text-sky-900">🛠️ {t('detail.updates')}</h2>
        <p className="text-sm text-slate-500 mt-2">{t('detail.noUpdates')}</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
      <h2 className="font-black text-lg text-sky-900">🛠️ {t('detail.updates')}</h2>
      <ol className="mt-4 relative border-l-2 border-sky-100 ml-2 space-y-4">
        {history.map((h) => {
          const isAuthority = h.role === 'authority';
          const style = STATUS_STYLE[h.status] || STATUS_STYLE.open;
          return (
            <li key={h.id} className="ml-5 relative">
              <span
                className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ background: isAuthority ? style.bar : '#94a3b8' }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: style.bg, color: style.text }}
                >
                  {t(`timeline.${h.status}`)}
                </span>
                <span className="text-xs text-slate-400 font-bold">{formatDate(h.created_at)}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {h.message} {isAuthority && h.actor ? `— ${h.actor}` : ''}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Other');
  const [busy, setBusy] = useState(false);

  const load = () => {
    getComplaint(id)
      .then((d) => {
        setData(d);
        setTitle(d.complaint.title);
        setDescription(d.complaint.description);
        setLocation(d.complaint.location || '');
        setCategory(d.complaint.category);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, [id]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-3 text-2xl font-black text-sky-900">{t('detail.notFoundT')}</h1>
        <p className="text-slate-500 mt-1">{t('detail.notFoundS')}</p>
        <Link to="/complaints" className="inline-block mt-5 bg-sky-600 text-white font-black px-6 py-3 rounded-2xl">
          ← {t('detail.back')}
        </Link>
      </div>
    );
  }
  if (!data) return <p className="text-center text-slate-400 font-bold py-16">…</p>;

  const c = data.complaint;
  const style = STATUS_STYLE[c.status] || STATUS_STYLE.open;
  const idx = statusIndex(c.status);

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await updateComplaint(c.id, { title, category, description, location });
      setData((prev) => ({ ...prev, complaint: d.complaint }));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`${t('detail.delete')}?`)) return;
    setBusy(true);
    try {
      await deleteComplaint(c.id);
      navigate('/complaints');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/complaints" className="inline-block text-sky-600 font-black hover:underline">
        ← {t('detail.back')}
      </Link>

      {/* header card */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-black px-3 py-1.5 rounded-full"
                style={{ background: style.bg, color: style.text }}
              >
                {t(`status.${c.status}`)}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">#{shortId(c.id)}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-800 leading-snug">{c.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {CATEGORY_ICONS[c.category]} {c.category}
              {c.location ? ` · 📍 ${c.location}` : ''}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-sm font-bold text-sky-700 border-2 border-sky-200 rounded-xl px-3 py-2 hover:bg-sky-50"
            >
              {t('detail.edit')}
            </button>
            <button
              onClick={remove}
              className="text-sm font-bold text-red-600 border-2 border-red-200 rounded-xl px-3 py-2 hover:bg-red-50"
            >
              {t('detail.delete')}
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="mt-5">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">{t('detail.progress')}</div>
          <div className="flex gap-1.5">
            {PROGRESS_STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className="h-2 rounded-full"
                  style={{ background: i <= idx ? style.bar : '#e2e8f0' }}
                />
                <div
                  className={`text-[10px] font-bold mt-1 text-center ${i <= idx ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  {t(`status.${s}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* edit form */}
      {editing && (
        <form onSubmit={saveEdit} className="bg-white rounded-3xl border-2 border-sky-300 shadow-sm p-5 space-y-4">
          <input
            className="w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('report.titleF')}
            maxLength={120}
          />
          <select
            className="w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>
          <textarea
            className="w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('report.descF')}
            maxLength={1000}
          />
          <input
            className="w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('report.locF')}
            maxLength={200}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black py-3 rounded-2xl"
            >
              {t('detail.save')}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-5 py-3 border-2 border-slate-200 font-black rounded-2xl text-slate-600"
            >
              {t('detail.cancel')}
            </button>
          </div>
        </form>
      )}

      <ProofPhotos c={c} t={t} />
      <Timeline history={data.history} t={t} />
    </div>
  );
}
