import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, signup, sendOtp, verifyOtp } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';

export default function Login() {
  const { loginAs } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [tab, setTab] = useState('phone'); // phone | email
  const [emailMode, setEmailMode] = useState('login'); // login | signup

  // phone + otp
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // email
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const afterLogin = (token, user) => {
    loginAs('user', token, user);
    navigate('/complaints');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length !== 10) {
      setError(t('auth.phoneHint'));
      return;
    }
    setOtpLoading(true);
    try {
      const d = await sendOtp(phone);
      setOtpSent(true);
      setDemoOtp(d.demoOtp || '');
      if (!d.demoOtp) {
        // real SMS sent — don't show the code
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError(t('auth.enterOtp'));
      return;
    }
    setLoading(true);
    try {
      const d = await verifyOtp(phone, otp);
      afterLogin(d.token, d.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (emailMode === 'signup') {
      if (!name.trim()) return setError(t('auth.name'));
      if (password.length < 6) return setError(t('auth.password') + ' (6+)');
      if (password !== confirm) return setError(t('auth.confirm'));
    }
    setLoading(true);
    try {
      const d =
        emailMode === 'signup'
          ? await signup(name.trim(), email.trim(), password)
          : await login(email.trim(), password);
      afterLogin(d.token, d.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input =
    'w-full text-lg px-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-sky-500 outline-none bg-white';
  const label = 'block text-left font-bold text-slate-700 mb-1';

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="bg-white rounded-3xl border-2 border-sky-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-teal-500 text-white px-6 py-5 text-center">
          <h1 className="text-2xl font-black">
            {emailMode === 'signup' && tab === 'email' ? t('auth.create') : t('auth.welcome')}
          </h1>
          <p className="text-sky-100 text-sm mt-1">
            {emailMode === 'signup' && tab === 'email' ? t('auth.createSub') : t('auth.welcomeSub')}
          </p>
        </div>

        <div className="p-6">
          {/* tabs */}
          <div className="grid grid-cols-2 gap-2 mb-5 bg-slate-100 rounded-2xl p-1.5">
            <button
              type="button"
              onClick={() => {
                setTab('phone');
                setError('');
              }}
              className={`py-3 rounded-xl font-black text-sm ${tab === 'phone' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
            >
              📱 {t('auth.phoneTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setError('');
              }}
              className={`py-3 rounded-xl font-black text-sm ${tab === 'email' ? 'bg-white shadow text-sky-700' : 'text-slate-500'}`}
            >
              ✉️ {t('auth.emailTab')}
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* ---------------- phone + OTP ---------------- */}
          {tab === 'phone' && (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className={label}>{t('auth.phone')}</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-slate-100 border-2 border-r-0 border-slate-300 rounded-l-2xl font-black text-slate-600">
                    +91
                  </span>
                  <input
                    className={input + ' rounded-l-none'}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={otpSent}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('auth.phoneHint')}</p>
              </div>

              {otpSent && (
                <>
                  {demoOtp && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 text-center">
                      <div className="text-xs font-bold text-amber-700">{t('auth.demoOtp')}</div>
                      <div className="text-2xl font-black tracking-[0.4em] text-amber-800 mt-1">{demoOtp}</div>
                    </div>
                  )}
                  <div>
                    <label className={label}>{t('auth.enterOtp')}</label>
                    <input
                      className={input + ' text-center tracking-[0.5em] font-black'}
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                    />
                  </div>
                </>
              )}

              <button
                disabled={loading || otpLoading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-black text-lg py-4 rounded-2xl"
              >
                {loading || otpLoading
                  ? '…'
                  : otpSent
                    ? t('auth.verify')
                    : t('auth.sendOtp')}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full text-sm font-bold text-sky-600 hover:underline"
                >
                  {t('auth.resend')}
                </button>
              )}
            </form>
          )}

          {/* ---------------- email ---------------- */}
          {tab === 'email' && (
            <form onSubmit={handleEmail} className="space-y-4">
              {emailMode === 'signup' && (
                <div>
                  <label className={label}>{t('auth.name')}</label>
                  <input
                    className={input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ravi Kumar"
                  />
                </div>
              )}
              <div>
                <label className={label}>{t('auth.email')}</label>
                <input
                  className={input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={label}>{t('auth.password')}</label>
                <input
                  className={input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {emailMode === 'signup' && (
                <div>
                  <label className={label}>{t('auth.confirm')}</label>
                  <input
                    className={input}
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}
              <button
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-black text-lg py-4 rounded-2xl"
              >
                {loading ? '…' : emailMode === 'signup' ? t('auth.signup') : t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => setEmailMode((m) => (m === 'signup' ? 'login' : 'signup'))}
                className="w-full text-sm font-bold text-sky-600 hover:underline"
              >
                {emailMode === 'signup'
                  ? `${t('auth.haveAccount')} ${t('auth.login')}`
                  : `${t('auth.noAccount')} ${t('auth.signup')}`}
              </button>
            </form>
          )}

          <div className="mt-5 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 text-xs text-sky-800 leading-relaxed">
            💡 {t('auth.demoHint')}
          </div>
        </div>
      </div>

      <div className="text-center mt-4 text-sm text-slate-500">
        <Link to="/" className="hover:underline">
          ← {t('nav.home')}
        </Link>
      </div>
    </div>
  );
}
