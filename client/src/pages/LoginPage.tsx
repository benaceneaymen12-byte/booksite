import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { login, loading: authLoading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        navigate('/');
      } else {
        setError(t('common.invalidCredentials'));
      }
    } catch {
      setError(t('common.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell min-h-screen">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="login-panel-wrapper">
        <div className="login-brand text-center mb-6">
          <img className="brand-logo-card" src={`${import.meta.env.BASE_URL}logok.png`} alt="Biocare Biotech" />
          <p className="login-subtitle">Laboratory Management Assistant</p>
        </div>

        <div className="card login-card">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-2.5 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <span>✕</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="field-label">
                {t('common.username')} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="field-label">
                {t('common.password')} <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.login')
              )}
            </button>
          </form>

          <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 rounded-lg">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{t('compliance.warning')}</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted mt-4 tracking-wide uppercase">
          Made by Aymen Benahcene · Not GMP/QC software
        </p>
      </div>
    </div>
  );
}
