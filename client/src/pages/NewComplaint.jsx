import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createComplaint, aiAnalyze, aiImprove } from '../api.js';
import { CATEGORIES, CATEGORY_ICONS } from '../constants.js';
import { useI18n } from '../i18n.jsx';

export default function NewComplaint() {
  const { t } = useI18n();
  const [photo, setPhoto] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [locBusy, setLocBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('report.take'));
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError('Image is too large. Please use a photo under 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setError('');
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const analyze = async () => {
    if (!photo && !description.trim()) {
      setError(t('report.step2hint'));
      return;
    }
    setAiBusy(true);
    setAiNote('');
    setError('');
    try {
      const d = await aiAnalyze(photo, description);
      setCategory(d.category);
      if (!title.trim()) setTitle(d.title || '');
      if (!description.trim() && d.description) setDescription(d.description);
      setAiNote(t('report.aiNote'));
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const improve = async () => {
    if (!description.trim()) {
      setError(t('report.descPh'));
      return;
    }
    setAiBusy(true);
    setError('');
    try {
      const d = await aiImprove(description);
      setDescription(d.description || description);
      setAiNote(t('report.aiNote'));
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t('report.locPh'));
      return;
    }
    setLocBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`Near ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocBusy(false);
      },
      () => {
        setError(t('report.locPh'));
        setLocBusy(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await createComplaint({ title, category, description, location, photo });
      setDone(d.complaint);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ---- Success screen ----
  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center pt-8">
        <div className="text-6xl">✅</div>
        <h1 className="mt-4 text-3xl font-black text-emerald-700">{t('success.title')}</h1>
        <p className="mt-2 text-slate-500">{t('success.sub')}</p>
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 mt-6 shadow">
          <p className="text-sm text-slate-400 font-bold">{t('success.idLabel')}</p>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{done.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-slate-500 mt-2">
            {CATEGORY_ICONS[done.category]} {done.category} · {done.title}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/complaints/${done.id}`} className="bg-sky-600 hover:bg-sky-700 text-white font-black px-6 py-3.5 rounded-2xl">
            {t('success.track')}
          </Link>
          <button
            onClick={() => {
              setDone(null);
              setPhoto(null);
              setTitle('');
              setCategory('Other');
              setDescription('');
              setLocation('');
              setAiNote('');
            }}
            className="border-2 border-sky-300 text-sky-700 font-black px-6 py-3.5 rounded-2xl hover:bg-sky-50"
          >
            {t('success.another')}
          </button>
        </div>
      </div>
    );
  }

  const input =
    'w-full text-lg px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none bg-white';
  const label = 'block font-bold text-slate-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-black text-sky-900">{t('report.title')}</h1>
      <p className="text-sm text-slate-500 mt-1">{t('report.sub')}</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Step 1 — Photo */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
          <h2 className="font-black text-slate-800 text-lg">{t('report.step1')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('report.step1hint')}</p>
          {photo ? (
            <div className="mt-3 relative">
              <img src={photo} alt="" className="w-full max-h-72 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-white/95 text-slate-700 text-xs font-bold rounded-full px-3 py-1.5 shadow"
              >
                {t('report.remove')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              className="mt-3 w-full border-2 border-dashed border-sky-300 bg-sky-50/50 rounded-2xl py-10 text-center hover:bg-sky-50 transition"
            >
              <span className="text-4xl">📷</span>
              <p className="mt-2 font-black text-sky-700">{t('report.take')}</p>
              <p className="text-xs text-slate-400 mt-1">JPG or PNG · up to 4 MB</p>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFile}
            aria-label="Upload problem photo"
          />
        </div>

        {/* Step 2 — AI help */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
          <h2 className="font-black text-slate-800 text-lg">{t('report.step2')}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t('report.step2hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={analyze}
              disabled={aiBusy}
              className="bg-violet-50 border-2 border-violet-200 text-violet-800 font-bold rounded-xl px-4 py-2.5 hover:bg-violet-100 disabled:opacity-50"
            >
              {aiBusy ? t('report.thinking') : t('report.analyze')}
            </button>
            <button
              type="button"
              onClick={improve}
              disabled={aiBusy}
              className="bg-violet-50 border-2 border-violet-200 text-violet-800 font-bold rounded-xl px-4 py-2.5 hover:bg-violet-100 disabled:opacity-50"
            >
              {t('report.improve')}
            </button>
          </div>
          {aiNote && (
            <p className="mt-3 text-sm font-semibold text-violet-800 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
              {aiNote}
            </p>
          )}
        </div>

        {/* Step 3 — Details */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5 space-y-4">
          <h2 className="font-black text-slate-800 text-lg">{t('report.step3')}</h2>
          <div>
            <label className={label} htmlFor="title">
              {t('report.titleF')} <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pothole near the bus stop"
              maxLength={120}
            />
          </div>
          <div>
            <label className={label} htmlFor="category">
              {t('report.categoryF')}
            </label>
            <select id="category" className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="description">
              {t('report.descF')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className={input + ' min-h-[90px]'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.descPh')}
              maxLength={1000}
            />
          </div>
          <div>
            <label className={label} htmlFor="location">
              {t('report.locF')}
            </label>
            <div className="flex gap-2">
              <input
                id="location"
                className={input}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('report.locPh')}
                maxLength={200}
              />
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locBusy}
                className="bg-slate-50 border-2 border-slate-200 font-bold rounded-xl px-4 py-2 whitespace-nowrap hover:bg-slate-100"
              >
                {locBusy ? '…' : t('report.useLoc')}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-black text-lg py-4 rounded-2xl"
        >
          {busy ? t('report.submitting') : t('report.submit')}
        </button>
        <p className="text-center text-xs text-slate-400 -mt-1">{t('report.disclaimer')}</p>
      </form>
    </div>
  );
}
