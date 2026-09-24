import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { CATEGORIES, CAT_LIST, refOf } from '../constants.js';

export default function NewComplaint() {
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
      setError('Please choose an image file (photo).');
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
      setError('Add a photo or a short note first, then ask AI for help.');
      return;
    }
    setAiBusy(true);
    setAiNote('');
    setError('');
    try {
      const d = await api('/api/ai/analyze', {
        method: 'POST',
        body: { image: photo, text: description },
      });
      setCategory(d.category);
      if (!title.trim()) setTitle(d.title || '');
      if (!description.trim() && d.description) setDescription(d.description);
      setAiNote(
        d.demo
          ? '🧪 Demo suggestion (no AI key connected yet) — please write the details yourself.'
          : '✨ AI suggestion — please review and edit it before submitting. AI can be wrong.'
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const improve = async () => {
    if (!description.trim()) {
      setError('Write a short note first, then ask AI to improve it.');
      return;
    }
    setAiBusy(true);
    setError('');
    try {
      const d = await api('/api/ai/improve', { method: 'POST', body: { text: description } });
      setDescription(d.description || description);
      setAiNote(
        d.demo
          ? '🧪 Demo mode — AI rewriting is off (add GEMINI_API_KEY to server/.env).'
          : '✨ Rewritten by AI — please review before submitting.'
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported here. Please type the area or street name.');
      return;
    }
    setLocBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(
          `Near ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (my approximate location)`
        );
        setLocBusy(false);
      },
      () => {
        setError('Location permission was denied — please type the area or street name instead.');
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
      const d = await api('/api/complaints', {
        method: 'POST',
        body: { title, category, description, location, photo },
      });
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
        <div className="text-6xl animate-pop">✅</div>
        <h1 className="mt-4 text-3xl font-extrabold text-ocean-800">Complaint submitted!</h1>
        <p className="mt-2 text-slate-500">Thank you for helping make your area better.</p>
        <div className="card mt-6 p-6">
          <p className="text-sm text-slate-400">Your complaint ID</p>
          <p className="text-2xl font-extrabold font-mono text-ocean-600 mt-1">{refOf(done.id)}</p>
          <p className="text-sm text-slate-500 mt-2">
            {CATEGORIES[done.category] || ''} {done.category} · {done.title}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/complaints/${done.id}`} className="btn-primary">
            Track Complaint
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
            className="btn-outline"
          >
            Report another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold text-ocean-800">Report a Problem</h1>
      <p className="text-sm text-slate-500 mt-1">Takes about 1–2 minutes. You can edit everything before submitting.</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Step 1 — Photo */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-800">1 · Photo of the problem</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tip: stand 2–3 metres away so the whole problem is visible.</p>
          {photo ? (
            <div className="mt-3 relative">
              <img src={photo} alt="Problem preview" className="w-full max-h-72 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-white/95 text-slate-700 text-xs font-bold rounded-full px-3 py-1.5 shadow"
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              className="mt-3 w-full border-2 border-dashed border-ocean-300 bg-ocean-50/50 rounded-2xl py-10 text-center hover:bg-ocean-50 transition"
            >
              <span className="text-4xl">📷</span>
              <p className="mt-2 font-bold text-ocean-600">Take a photo or upload one</p>
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
        <div className="card p-5">
          <h2 className="font-bold text-slate-800">2 · AI assistance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            AI suggests a category and description. You always confirm — it never submits for you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={analyze} disabled={aiBusy} className="btn-ghost">
              {aiBusy ? 'AI is thinking…' : '✨ Analyze photo & note'}
            </button>
            <button type="button" onClick={improve} disabled={aiBusy} className="btn-ghost">
              ✍️ Improve my note
            </button>
          </div>
          {aiNote && (
            <p className="mt-3 text-sm font-semibold text-cyan-800 bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-3">
              {aiNote}
            </p>
          )}
        </div>

        {/* Step 3 — Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-slate-800">3 · Complaint details</h2>
          <div>
            <label className="label" htmlFor="title">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pothole near the bus stop"
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CAT_LIST.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c]} {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              className="input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Where exactly? How long has it been like this?"
              maxLength={1000}
            />
          </div>
          <div>
            <label className="label" htmlFor="location">
              Location (optional)
            </label>
            <div className="flex gap-2">
              <input
                id="location"
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Area / street / landmark"
                maxLength={200}
              />
              <button type="button" onClick={useMyLocation} disabled={locBusy} className="btn-ghost whitespace-nowrap">
                {locBusy ? '…' : '📍 Use my location'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full text-lg py-4">
          {busy ? 'Submitting…' : 'Submit Complaint'}
        </button>
        <p className="text-center text-xs text-slate-400 -mt-1">
          AI-generated suggestions may be incorrect. Please review before submitting.
        </p>
      </form>
    </div>
  );
}
