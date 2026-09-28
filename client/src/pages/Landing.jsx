import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import { CATEGORIES, CATEGORY_ICONS } from '../constants.js';
import DemoVideo from '../components/DemoVideo.jsx';
import { DEMO_VIDEO_URL } from '../config.js';

function FirstVisitBanner() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('cc_demo_seen') === '1');
  if (dismissed || user) return null;
  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-500 text-white px-5 py-4 flex flex-col sm:flex-row items-center gap-3 shadow-lg">
      <div className="flex-1 text-center sm:text-left">
        <div className="font-black text-lg">{t('demo.newUser')}</div>
        <div className="text-sky-100 text-sm">{t('demo.hint')}</div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <a
          href="#demo"
          className="flex-1 sm:flex-none bg-white text-sky-700 font-black rounded-xl px-4 py-2.5 text-center hover:bg-sky-50"
        >
          ▶ {t('demo.watch')}
        </a>
        <button
          onClick={() => {
            localStorage.setItem('cc_demo_seen', '1');
            setDismissed(true);
          }}
          className="bg-sky-800/40 text-white font-bold rounded-xl px-4 py-2.5 hover:bg-sky-800/60"
        >
          ✕ {t('demo.skip')}
        </button>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div>
      <FirstVisitBanner />

      {/* Hero */}
      <section className="text-center py-8 md:py-14">
        <h1 className="text-4xl md:text-5xl font-black text-sky-900 leading-tight">
          {t('hero.title1')}
          <br />
          <span className="text-teal-600">{t('hero.title2')}</span>
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-600">{t('hero.subtitle')}</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={user ? '/new' : '/login'}
            className="bg-sky-600 hover:bg-sky-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-lg"
          >
            {t('hero.report')}
          </Link>
          <a
            href="#how"
            className="border-2 border-sky-300 text-sky-700 font-black text-lg px-8 py-4 rounded-2xl hover:bg-sky-50"
          >
            {t('hero.how')}
          </a>
        </div>
      </section>

      {/* Interactive demo */}
      <section id="demo" className="py-8 scroll-mt-20">
        {DEMO_VIDEO_URL ? (
          <div className="bg-white rounded-3xl border-2 border-sky-200 shadow-xl p-5 md:p-8">
            <h2 className="text-lg md:text-xl font-black text-sky-900 mb-4">🎬 {t('demo.title')}</h2>
            <video
              src={DEMO_VIDEO_URL}
              controls
              playsInline
              className="w-full rounded-2xl border-2 border-slate-200"
            />
          </div>
        ) : (
          <DemoVideo />
        )}
      </section>

      {/* How it works */}
      <section id="how" className="py-10 scroll-mt-20">
        <h2 className="text-2xl md:text-3xl font-black text-sky-900 text-center mb-8">{t('how.title')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '📷', title: t('how.s1t'), text: t('how.s1') },
            { icon: '✨', title: t('how.s2t'), text: t('how.s2') },
            { icon: '📨', title: t('how.s3t'), text: t('how.s3') },
            { icon: '📊', title: t('how.s4t'), text: t('how.s4') },
          ].map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-sky-100 p-5 shadow-sm">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="font-black text-lg text-sky-900">{s.title}</div>
              <div className="text-slate-600 mt-1 text-sm leading-relaxed">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <h2 className="text-2xl md:text-3xl font-black text-sky-900 text-center mb-8">
          {t('categories.title')}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((c) => (
            <div
              key={c}
              className="bg-white border-2 border-sky-100 rounded-2xl px-5 py-3 font-bold text-slate-700 shadow-sm"
            >
              {CATEGORY_ICONS[c]} {c}
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="py-10">
        <h2 className="text-2xl md:text-3xl font-black text-sky-900 text-center mb-8">{t('why.title')}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🤝', title: t('why.s1t'), text: t('why.s1') },
            { icon: '✨', title: t('why.s2t'), text: t('why.s2') },
            { icon: '🔒', title: t('why.s3t'), text: t('why.s3') },
          ].map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="font-black text-lg text-sky-900">{s.title}</div>
              <div className="text-slate-600 mt-1 leading-relaxed">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 text-center">
        <div className="bg-gradient-to-r from-sky-600 to-teal-500 rounded-3xl px-6 py-10 text-white shadow-xl">
          <h2 className="text-2xl md:text-3xl font-black">{t('cta.title')}</h2>
          <p className="mt-2 text-sky-100">{t('cta.sub')}</p>
          <Link
            to={user ? '/new' : '/login'}
            className="inline-block mt-6 bg-white text-sky-700 font-black text-lg px-8 py-4 rounded-2xl shadow hover:bg-sky-50"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
