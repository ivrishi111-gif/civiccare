import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';
import Logo from './Logo.jsx';
import { APP_NAME } from '../config.js';

function LangSwitcher({ compact }) {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={compact ? 'Change language' : 'Change language / भाषा'}
        className="px-3 py-2 rounded-xl border-2 border-sky-200 bg-white text-sm font-bold text-sky-800 hover:border-sky-400"
      >
        🌐 {current?.native || 'EN'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 z-50 rounded-2xl border-2 border-sky-200 bg-white shadow-xl overflow-hidden">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 font-semibold hover:bg-sky-50 ${l.code === lang ? 'text-sky-700 bg-sky-50' : 'text-slate-700'}`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, authority, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (
    <>
      <NavLink to="/" end className="text-lg">
        {t('nav.home')}
      </NavLink>
      {user && (
        <>
          <NavLink to="/new">{t('nav.report')}</NavLink>
          <NavLink to="/complaints">{t('nav.myComplaints')}</NavLink>
        </>
      )}
      <NavLink to="/profile" onClick={() => !user && !authority && setMenuOpen(false)}>
        {t('nav.profile')}
      </NavLink>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-sky-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-black tracking-tight text-sky-900">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-semibold text-slate-600">
            {links}
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            {user || authority ? (
              <button
                onClick={() => logout(user ? 'user' : 'authority')}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700">
                {t('nav.login')}
              </Link>
            )}
            <button
              className="md:hidden px-3 py-2 text-2xl"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-sky-100 bg-white px-4 py-2 flex flex-col gap-1 font-semibold text-slate-700">
            {links}
            {user && (
              <Link to="/new" className="py-2 text-sky-700">
                {t('dash.new')}
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      {user && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-sky-100 flex">
          {[
            { to: '/complaints', label: t('nav.myComplaints'), icon: '📋' },
            { to: '/new', label: t('nav.report'), icon: '📷' },
            { to: '/profile', label: t('nav.profile'), icon: '👤' },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-bold text-slate-600"
            >
              <span className="text-xl">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}

      <footer className="border-t border-sky-100 bg-white py-8 text-center text-sm text-slate-500">
        <div className="font-black text-sky-800 text-base mb-1">{t('tagline')}</div>
        <div>{t('footer.slogan')}</div>
        <div className="mt-2 text-xs">
          {t('footer.disclaimer')} ·{' '}
          <Link to="/authority/login" className="underline">
            {t('authority.portal')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
