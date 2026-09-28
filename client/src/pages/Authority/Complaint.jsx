import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  authorityComplaint,
  authorityAction,
  authorityComplete,
  authorityNote,
} from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useI18n } from '../../i18n.jsx';
import { STATUS_STYLE, CATEGORY_ICONS, PROGRESS_STEPS, statusIndex, formatDate, shortId } from '../../constants.js';

export default function AuthorityComplaint() {
  const { id } = useParams();
  const { authority } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [afterImage, setAfterImage] = useState(null);
  const [completeMsg, setCompleteMsg] = useState('');
  const fileRef = useRef(null);

  const load = () => {
    authorityComplaint(id)
      .then(setData)
      .catch((e) => setError(e.message));
  };
  useEffect(load, [id]);

  const onAfterFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (f.size > 4 * 1024 * 1024) {
      setError('Image is too large. Please use a photo under 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAfterImage(reader.result);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const doAction = async (action, message) => {
    setBusy(true);
    setError('');
    try {
      await authorityAction(id, action, message);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doComplete = async () => {
    if (!afterImage) {
      setError(t('authority.completeHint'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await authorityComplete(id, afterImage, completeMsg);
      setShowComplete(false);
      setAfterImage(null);
      setCompleteMsg('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setError('');
    try {
      await authorityNote(id, note.trim());
      setNote('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-3 text-2xl font-black text-slate-900">{t('detail.notFoundT')}</h1>
        <Link to="/authority" className="inline-block mt-5 bg-slate-900 text-white font-black px-6 py-3 rounded-2xl">
          ← {t('nav.myComplaints')}
        </Link>
      </div>
    );
  }
  if (!data) return <p className="text-center text-slate-400 font-bold py-16">…</p>;

  const c = data.complaint;
  const style = STATUS_STYLE[c.status] || STATUS_STYLE.open;
  const idx = statusIndex(c.status);

  const primaryAction = {
    open: { action: 'assign', label: '📌 ' + t('authority.assign') },
    assigned: { action: 'start', label: '🔧 ' + t('authority.start') },
    in_progress: { action: 'complete-btn', label: '✅ ' + t('authority.complete') },
    completed: { action: 'resolve', label: '🏁 ' + t('authority.resolve') },
    resolved: null,
  }[c.status];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link to="/authority" className="inline-block text-slate-600 font-black hover:underline">
        ← {t('authority.portal')}
      </Link>

      {/* header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ background: style.bg, color: style.text }}>
            {t(`status.${c.status}`)}
          </span>
          <span className="text-xs text-slate-400 font-mono font-bold">#{shortId(c.id)}</span>
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-800">{c.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {CATEGORY_ICONS[c.category]} {c.category}
          {c.location ? ` · 📍 ${c.location}` : ''}
        </p>
        {c.description && <p className="mt-3 text-slate-600 leading-relaxed">{c.description}</p>}

        {/* progress */}
        <div className="mt-5 flex gap-1.5">
          {PROGRESS_STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-2 rounded-full" style={{ background: i <= idx ? style.bar : '#e2e8f0' }} />
              <div className={`text-[10px] font-bold mt-1 text-center ${i <= idx ? 'text-slate-700' : 'text-slate-300'}`}>
                {t(`status.${s}`)}
              </div>
            </div>
          ))}
        </div>

        {/* primary action */}
        {primaryAction && (
          <div className="mt-5">
            <button
              onClick={() =>
                primaryAction.action === 'complete-btn' ? setShowComplete((v) => !v) : doAction(primaryAction.action)
              }
              disabled={busy}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-lg py-4 rounded-2xl"
            >
              {busy ? '…' : primaryAction.label}
            </button>
          </div>
        )}

        {/* complete work form */}
        {showComplete && (
          <div className="mt-4 border-2 border-slate-300 rounded-2xl p-4 space-y-3 bg-slate-50">
            <p className="text-sm font-bold text-slate-600">{t('authority.completeHint')}</p>
            {afterImage ? (
              <div className="relative">
                <img src={afterImage} alt="after preview" className="w-full max-h-64 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setAfterImage(null)}
                  className="absolute top-2 right-2 bg-white/95 text-slate-700 text-xs font-bold rounded-full px-3 py-1.5 shadow"
                >
                  ✕ {t('report.remove')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                className="w-full border-2 border-dashed border-slate-400 bg-white rounded-2xl py-8 text-center hover:bg-slate-50"
              >
                <span className="text-3xl">📸</span>
                <p className="mt-1 font-black text-slate-700">{t('detail.after')} — {t('report.take')}</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onAfterFile} />
            <input
              className="w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 outline-none"
              value={completeMsg}
              onChange={(e) => setCompleteMsg(e.target.value)}
              placeholder={t('authority.notePlaceholder')}
              maxLength={500}
            />
            <button
              onClick={doComplete}
              disabled={busy || !afterImage}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl"
            >
              {busy ? '…' : t('authority.complete')}
            </button>
          </div>
        )}
      </div>

      {/* before / after */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-black text-lg text-slate-900">🛠️ {t('detail.proof')}</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-2xl overflow-hidden border-2 border-slate-300 aspect-square bg-slate-100">
            {c.before_image || c.photo ? (
              <img src={c.before_image || c.photo} alt={t('detail.before')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
            )}
          </div>
          <div
            className={`rounded-2xl overflow-hidden aspect-square bg-slate-50 border-2 ${c.after_image ? 'border-emerald-400' : 'border-dashed border-slate-300'}`}
          >
            {c.after_image ? (
              <img src={c.after_image} alt={t('detail.after')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">⏳</div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-2 text-xs font-black text-slate-500">
          <span className="flex-1 text-center bg-slate-100 rounded-lg py-1">{t('detail.before')}</span>
          <span className={`flex-1 text-center rounded-lg py-1 ${c.after_image ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
            {t('detail.after')}
          </span>
        </div>
      </div>

      {/* note */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-black text-lg text-slate-900">✍️ {t('detail.updates')}</h2>
        <div className="flex gap-2 mt-3">
          <input
            className="flex-1 text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 outline-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('authority.notePlaceholder')}
            maxLength={500}
          />
          <button
            onClick={doNote}
            disabled={busy || !note.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black px-5 rounded-2xl"
          >
            {t('authority.postNote')}
          </button>
        </div>
      </div>

      {/* history */}
      {data.history && data.history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-black text-lg text-slate-900">📜 {t('detail.updates')}</h2>
          <ol className="mt-4 relative border-l-2 border-slate-200 ml-2 space-y-4">
            {data.history.map((h) => {
              const s = STATUS_STYLE[h.status] || STATUS_STYLE.open;
              return (
                <li key={h.id} className="ml-5 relative">
                  <span
                    className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white"
                    style={{ background: h.role === 'authority' ? s.bar : '#94a3b8' }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                      {t(`timeline.${h.status}`)}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{formatDate(h.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {h.message} {h.actor ? `— ${h.actor}` : ''}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
