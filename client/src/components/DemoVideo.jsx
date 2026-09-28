import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n.jsx';

// A simple 30-second guided walkthrough: a phone mockup that walks through
// the whole app flow automatically. No video file needed, works offline.
const STEPS = 7;

function ScreenLanding({ t }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-100 to-white p-4">
      <div className="flex items-center gap-1 mb-3">
        <div className="w-5 h-5 rounded-md bg-sky-600" />
        <div className="text-[10px] font-black text-sky-900">CIVICCARE</div>
      </div>
      <div className="text-sm font-black text-sky-900 leading-tight">
        {t('hero.title1')}
        <br />
        {t('hero.title2')}
      </div>
      <div className="text-[8px] text-slate-500 mt-2 leading-snug">{t('hero.subtitle')}</div>
      <div className="mt-auto">
        <div className="bg-sky-600 text-white text-xs font-black rounded-xl py-3 text-center shadow-lg ring-4 ring-sky-300 animate-pulse">
          {t('hero.report')}
        </div>
      </div>
    </div>
  );
}

function ScreenCamera({ t }) {
  return (
    <div className="h-full bg-slate-900 p-3 flex flex-col">
      <div className="flex-1 rounded-lg overflow-hidden relative">
        <img src="/samples/pothole-before.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] px-2 py-1 rounded">📸 3</div>
      </div>
      <div className="text-center text-white/80 text-[9px] mt-2">{t('demo.steps.2')}</div>
      <div className="flex justify-center mt-2">
        <div className="w-10 h-10 rounded-full border-4 border-white flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

function ScreenAI({ t }) {
  return (
    <div className="h-full bg-white p-4 flex flex-col gap-2">
      <div className="text-[10px] font-black text-slate-800">{t('report.step2')}</div>
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-2 text-[9px] text-violet-700 flex gap-1">
        <span>✨</span>
        <span>{t('report.aiNote')}</span>
      </div>
      <div className="space-y-1.5 mt-1">
        <div>
          <div className="text-[8px] text-slate-500 font-bold">{t('report.categoryF')}</div>
          <div className="text-[10px] font-bold text-sky-800 border border-sky-300 rounded-lg px-2 py-1 bg-sky-50">🕳️ Pothole</div>
        </div>
        <div>
          <div className="text-[8px] text-slate-500 font-bold">{t('report.descF')}</div>
          <div className="text-[9px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 leading-snug">
            A large pothole in the middle of the road near the bus stop…
          </div>
        </div>
      </div>
      <div className="mt-auto bg-sky-600 text-white text-[10px] font-black rounded-xl py-2 text-center">
        {t('report.submit')}
      </div>
    </div>
  );
}

function ScreenEdit({ t }) {
  return (
    <div className="h-full bg-white p-4 flex flex-col gap-2">
      <div className="text-[10px] font-black text-slate-800">{t('report.step3')}</div>
      <div>
        <div className="text-[8px] text-slate-500 font-bold">{t('report.titleF')}</div>
        <div className="text-[10px] font-bold text-slate-800 border border-sky-400 rounded-lg px-2 py-1 bg-sky-50 relative">
          Pothole near the bus stop
          <span className="absolute right-2 top-1 text-sky-600">▌</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="text-[8px] text-slate-500 font-bold">{t('report.categoryF')}</div>
        <div className="text-[9px] font-bold text-sky-800 border border-slate-200 rounded-lg px-1.5 py-0.5 bg-sky-50">🕳️ Pothole</div>
      </div>
      <div>
        <div className="text-[8px] text-slate-500 font-bold">{t('report.descF')}</div>
        <div className="text-[9px] text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 leading-snug">
          A large pothole in the middle of the road near the bus stop. Water collects in it…
        </div>
      </div>
      <div className="text-[8px] text-slate-500 font-bold">📍 {t('report.locF')}</div>
      <div className="text-[9px] font-bold text-slate-800 border border-slate-200 rounded-lg px-2 py-1 bg-amber-50">
        MG Road, near City Bus Stop
      </div>
    </div>
  );
}

function ScreenSuccess({ t }) {
  return (
    <div className="h-full bg-gradient-to-b from-emerald-50 to-white p-4 flex flex-col items-center justify-center text-center gap-2">
      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white text-2xl flex items-center justify-center">✓</div>
      <div className="text-[11px] font-black text-emerald-800">{t('success.title')}</div>
      <div className="text-[9px] text-slate-500">{t('success.idLabel')}</div>
      <div className="bg-white border-2 border-emerald-300 rounded-xl px-4 py-2 font-mono font-black text-emerald-800 text-sm">
        CC-A4F21B9E
      </div>
      <div className="bg-emerald-600 text-white text-[10px] font-black rounded-xl px-4 py-2 mt-2">{t('success.track')}</div>
    </div>
  );
}

function ScreenTrack({ t }) {
  return (
    <div className="h-full bg-white p-4 flex flex-col gap-2">
      <div className="text-[10px] font-black text-slate-800">📋 {t('nav.myComplaints')}</div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-16 bg-slate-100 relative">
          <img src="/samples/pothole-before.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-2">
          <div className="text-[9px] font-bold text-slate-800">Pothole near the bus stop</div>
          <div className="flex gap-1 mt-1">
            {['✓', '✓', '▶', '', ''].map((m, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded ${i < 3 ? 'bg-teal-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="text-[8px] font-bold text-teal-700 mt-1">
            {t('status.in_progress')}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-2 opacity-70">
        <div className="text-[9px] font-bold text-slate-600">Dustbin overflowing</div>
        <div className="text-[8px] font-bold text-amber-600 mt-0.5">{t('status.assigned')}</div>
      </div>
    </div>
  );
}

function ScreenProof({ t }) {
  return (
    <div className="h-full bg-white p-4 flex flex-col gap-2">
      <div className="text-[10px] font-black text-emerald-800">🛠️ {t('detail.proof')}</div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="rounded-lg overflow-hidden border-2 border-slate-300 relative">
          <img src="/samples/pothole-before.jpg" alt="before" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-bold text-center py-0.5">{t('detail.before')}</div>
        </div>
        <div className="rounded-lg overflow-hidden border-2 border-emerald-400 relative">
          <img src="/samples/pothole-after.jpg" alt="after" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-bold text-center py-0.5">{t('detail.after')}</div>
        </div>
      </div>
      <div className="text-center text-[9px] font-black text-emerald-700 bg-emerald-50 rounded-lg py-1.5">
        {t('status.resolved')} ✓
      </div>
    </div>
  );
}

const SCREENS = [ScreenLanding, ScreenCamera, ScreenAI, ScreenEdit, ScreenSuccess, ScreenTrack, ScreenProof];

export default function DemoVideo() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => (s + 1) % STEPS);
    }, 3200);
    return () => clearTimeout(timer.current);
  }, [step, playing]);

  const Screen = SCREENS[step];

  return (
    <div className="bg-white rounded-3xl border-2 border-sky-200 shadow-xl p-5 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg md:text-xl font-black text-sky-900">🎬 {t('demo.title')}</h2>
      </div>
      <p className="text-sm text-slate-500 -mt-3 mb-5">{t('demo.hint')}</p>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* phone */}
        <div className="shrink-0 w-52 h-[420px] rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden relative">
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-900 rounded-full z-10" />
          <div key={step} className="h-full w-full animate-[fadeIn_0.4s_ease]">
            <Screen t={t} />
          </div>
        </div>

        {/* caption + controls */}
        <div className="flex-1 w-full flex flex-col items-center text-center">
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: STEPS }).map((_, i) => (
              <button
                key={i}
                aria-label={`Step ${i + 1}`}
                onClick={() => {
                  setStep(i);
                  setPlaying(false);
                }}
                className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-sky-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <div className="text-sm font-black text-slate-400 mb-1">{step + 1} / {STEPS}</div>
          <p className="text-lg md:text-2xl font-black text-sky-900 leading-snug min-h-[4rem]">
            {t(`demo.steps.${step + 1}`)}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="px-5 py-3 rounded-2xl bg-sky-600 text-white font-black text-lg hover:bg-sky-700"
            >
              {playing ? '⏸' : '▶'} {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setStep(0);
                setPlaying(true);
              }}
              className="px-5 py-3 rounded-2xl border-2 border-sky-300 text-sky-700 font-black text-lg hover:bg-sky-50"
            >
              ↺ Restart
            </button>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
