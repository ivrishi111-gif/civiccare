import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authorityLogin } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useI18n } from '../../i18n.jsx';

export default function AuthorityLogin() {
  const { loginAs } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length !== 10) {
      setError(t('auth.phoneHint'));
      return;
    }
    setBusy(true);
    try {
      const d = await authorityLogin(phone, password);
      loginAs('authority', d.token, d.authority);
      navigate('/authority');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full text-lg px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none bg-white';

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="bg-white rounded-3xl border-2 border-slate-800 shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-5 text-center">
          <div className="text-3xl">🏛️</div>
          <h1 className="text-2xl font-black mt-1">{t('authority.loginTitle')}</h1>
          <p className="text-slate-300 text-sm mt-1">{t('authority.loginSub')}</p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('auth.phone')}</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-slate-100 border-2 border-r-0 border-slate-300 rounded-l-2xl font-black text-slate-600">
                +91
              </span>
              <input
                className={input + ' rounded-l-none'}
                inputMode="numeric"
                maxLength={10}
                placeholder="99999 99999"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">{t('auth.password')}</label>
            <input
              className={input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={busy}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-lg py-4 rounded-2xl"
          >
            {busy ? '…' : t('auth.login')}
          </button>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800 font-bold">
            💡 {t('authority.demoNote')}
          </div>
        </form>
      </div>
      <div className="text-center mt-4 text-sm text-slate-500">
        <Link to="/" className="hover:underline">
          ← {t('nav.home')}
        </Link>
      </div>
    </div>
  );
}
