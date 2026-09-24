import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { CATEGORIES, CAT_LIST, STATUS, refOf, fmtDate } from '../constants.js';

const RANK = { open: 0, in_progress: 1, resolved: 2 };

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Other', description: '', location: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/complaints/${id}`)
      .then((d) => setC(d.complaint))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center pt-16">
        <div className="text-5xl">🔍</div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-700">Complaint not found</h1>
        <p className="mt-2 text-slate-500">You can only see complaints that you submitted.</p>
        <Link to="/dashboard" className="btn-primary mt-6">
          Back to my complaints
        </Link>
      </div>
    );
  }
  if (!c) return <p className="text-center text-slate-400 py-16">Loading…</p>;

  const st = STATUS[c.status] || STATUS.open;
  const steps = [
    { label: 'Submitted', when: c.created_at, done: true },
    {
      label: 'Work in progress',
      when: RANK[c.status] >= 1 ? c.updated_at : null,
      done: RANK[c.status] >= 1,
    },
    { label: 'Resolved', when: c.status === 'resolved' ? c.updated_at : null, done: c.status === 'resolved' },
  ];

  const startEdit = () => {
    setForm({ title: c.title, category: c.category, description: c.description, location: c.location || '' });
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api(`/api/complaints/${c.id}`, { method: 'PUT', body: form });
      setC(d.complaint);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status) => {
    if (status === c.status) return;
    try {
      const d = await api(`/api/complaints/${c.id}`, {
        method: 'PUT',
        body: { title: c.title, category: c.category, description: c.description, location: c.location, status },
      });
      setC(d.complaint);
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async () => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api(`/api/complaints/${c.id}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Link to="/dashboard" className="text-sm font-bold text-ocean-600 hover:underline">
          ← My complaints
        </Link>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${st.cls}`}>{st.label.toUpperCase()}</span>
      </div>

      <div className="card mt-4 p-5">
        <p className="font-mono text-xs text-slate-400">{refOf(c.id)}</p>
        <h1 className="mt-1 text-xl md:text-2xl font-extrabold text-slate-800">
          {CATEGORIES[c.category] || ''} {c.title}
        </h1>

        {c.photo ? (
          <img src={c.photo} alt="Problem" className="mt-4 w-full max-h-96 object-cover rounded-xl" />
        ) : (
          <div className="mt-4 w-full h-40 rounded-xl bg-ocean-50 flex items-center justify-center text-5xl">
            {CATEGORIES[c.category] || '📸'}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400">CATEGORY</p>
            <p className="font-semibold text-slate-700 mt-0.5">{c.category}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400">LOCATION</p>
            <p className="font-semibold text-slate-700 mt-0.5">{c.location || 'Not specified'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400">CREATED</p>
            <p className="font-semibold text-slate-700 mt-0.5">{fmtDate(c.created_at)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-slate-400">LAST UPDATED</p>
            <p className="font-semibold text-slate-700 mt-0.5">{fmtDate(c.updated_at)}</p>
          </div>
        </div>

        <p className="mt-4 text-slate-600 leading-relaxed">{c.description}</p>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Timeline */}
      <div className="card mt-4 p-5">
        <h2 className="font-bold text-slate-800">Progress</h2>
        <ol className="relative border-l-2 border-ocean-200 ml-3 mt-4 space-y-5">
          {steps.map((s) => (
            <li key={s.label} className="ml-5">
              <span
                className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${
                  s.done ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'
                }`}
              />
              <p className={`font-bold text-sm ${s.done ? 'text-slate-800' : 'text-slate-400'}`}>
                {s.done ? '✓ ' : ''}
                {s.label}
              </p>
              {s.when && <p className="text-xs text-slate-400">{fmtDate(s.when)}</p>}
            </li>
          ))}
        </ol>
      </div>

      {/* Status */}
      <div className="card mt-4 p-5">
        <h2 className="font-bold text-slate-800">Update status</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Simple mode: you update the status yourself. (Official authority accounts are a future feature.)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(STATUS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              disabled={busy}
              className={`text-sm font-bold rounded-xl px-4 py-2.5 border-2 transition ${
                c.status === key
                  ? 'border-ocean-600 bg-ocean-600 text-white'
                  : 'border-slate-200 text-slate-500 hover:border-ocean-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Edit */}
      {editing ? (
        <form onSubmit={saveEdit} className="card mt-4 p-5 space-y-4">
          <h2 className="font-bold text-slate-800">Edit complaint</h2>
          <div>
            <label className="label" htmlFor="edit-title">
              Title
            </label>
            <input
              id="edit-title"
              className="input"
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-category">
              Category
            </label>
            <select
              id="edit-category"
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CAT_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIES[cat]} {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="edit-desc">
              Description
            </label>
            <textarea
              id="edit-desc"
              className="input min-h-[90px]"
              value={form.description}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-loc">
              Location
            </label>
            <input
              id="edit-loc"
              className="input"
              value={form.location}
              maxLength={200}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={startEdit} className="btn-ghost">
            ✏️ Edit complaint
          </button>
          <button onClick={del} disabled={busy} className="btn-danger">
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}
