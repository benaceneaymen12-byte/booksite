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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">{t('common.loading')}</div></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧪</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PharmaLab Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Productivity Assistant — Not GMP/QC Software</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.username')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('common.password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !username || !password} className="btn-primary w-full">
              {loading ? t('common.loading') : t('common.login')}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Demo credentials:</strong><br />
              Username: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">admin</code><br />
              Password: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">admin</code>
            </p>
          </div>

          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ {t('compliance.warning')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
