import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { CATEGORIES, CAT_LIST } from '../constants.js';

const STEPS = [
  { icon: '📷', title: '1. Capture', text: 'Take a photo of the problem — pothole, garbage, broken light…' },
  { icon: '✨', title: '2. AI helps', text: 'AI suggests a category and description. You review and edit it.' },
  { icon: '📩', title: '3. Submit', text: 'Add the location and submit. You get a unique complaint ID.' },
  { icon: '📊', title: '4. Track', text: 'Follow your complaint from Open to Resolved, any time.' },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-8 md:pt-14 pb-12 text-center">
        <div className="flex justify-center">
          <Logo size={88} />
        </div>
        <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight text-ocean-800">
          See a problem?
          <br />
          <span className="text-ocean-500">Report it in 2 minutes.</span>
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-lg text-slate-500">
          Photograph a public problem, let AI help you describe it, and track it until it is fixed. Simple for
          everyone — no confusion, no jargon.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/report" className="btn-primary text-lg px-8 py-4">
            📷 Report a Problem
          </Link>
          <a href="#how" className="btn-outline text-lg px-8 py-4">
            How it works
          </a>
        </div>

        {/* Sample complaint card (illustration of a real report) */}
        <div className="mt-12 max-w-md mx-auto card p-5 text-left shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400">CS-2026-000123</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">IN PROGRESS</span>
          </div>
          <p className="mt-2 font-bold text-slate-800">🕳️ Pothole near the bus stop</p>
          <p className="text-sm text-slate-500 mt-1">MG Road · 23 Sep 2026</p>
          <div className="mt-4 flex items-center gap-2">
            {['Submitted', 'Assigned', 'Work', 'Done'].map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full ${i < 2 ? 'bg-ocean-500' : 'bg-slate-200'}`} />
                <p className="text-[10px] text-slate-400 mt-1">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-12">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-ocean-800">How it works</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.title} className="card p-5 hover:shadow-md transition-shadow">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 font-bold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-ocean-800">What can you report?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {CAT_LIST.map((c) => (
            <span
              key={c}
              className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
            >
              {CATEGORIES[c]} {c}
            </span>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="py-12">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold text-ocean-800">Why CIVICCARE?</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <div className="text-3xl">📱</div>
            <h3 className="mt-2 font-bold text-slate-800">Simple by design</h3>
            <p className="text-sm text-slate-500 mt-1">
              Big buttons, clear words, large text — made for first-time smartphone users.
            </p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl">✨</div>
            <h3 className="mt-2 font-bold text-slate-800">AI-assisted</h3>
            <p className="text-sm text-slate-500 mt-1">
              AI helps write your complaint — but you always review and confirm before submitting.
            </p>
          </div>
          <div className="card p-5 text-center">
            <div className="text-3xl">🔒</div>
            <h3 className="mt-2 font-bold text-slate-800">Private &amp; safe</h3>
            <p className="text-sm text-slate-500 mt-1">
              Your reports are visible only to you. We never display personal details publicly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="rounded-3xl bg-gradient-to-r from-ocean-800 to-ocean-500 text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">Ready to make your area better?</h2>
          <p className="mt-2 text-ocean-100">Create a free account and report your first problem today.</p>
          <Link
            to="/signup"
            className="mt-6 inline-block bg-white text-ocean-800 font-bold rounded-xl px-8 py-3.5 hover:bg-ocean-50 transition"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>
    </div>
  );
}
