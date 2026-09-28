import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useI18n, LANGUAGES } from '../i18n.jsx';
import { APP_NAME } from '../config.js';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  if (!user) return null;

  const initial = (user.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-500 to-teal-400 text-white text-3xl font-black flex items-center justify-center shadow-lg">
          {initial}
        </div>
        <h1 className="mt-3 text-2xl font-black text-sky-900">{user.name}</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {user.email || (user.phone ? `📱 ${user.phone}` : APP_NAME)}
        </p>
      </div>

      {/* language */}
      <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-5">
        <h2 className="font-black text-lg text-sky-900">🌐 {t('profile.language')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('profile.languageHint')}</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`py-3 rounded-2xl font-black border-2 ${
                lang === l.code
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>

      <Link
        to="/complaints"
        className="block bg-white rounded-3xl border border-sky-100 shadow-sm p-5 font-black text-slate-700 hover:bg-sky-50"
      >
        {t('profile.myComplaints')} →
      </Link>
      <Link
        to="/new"
        className="block bg-white rounded-3xl border border-sky-100 shadow-sm p-5 font-black text-slate-700 hover:bg-sky-50"
      >
        {t('profile.report')} →
      </Link>
      <button
        onClick={() => logout('user')}
        className="w-full bg-white rounded-3xl border-2 border-red-200 shadow-sm p-5 font-black text-red-600 hover:bg-red-50"
      >
        {t('profile.logout')}
      </button>

      <p className="text-center text-xs text-slate-400 px-4">{t('profile.disclaimer')}</p>
    </div>
  );
}
