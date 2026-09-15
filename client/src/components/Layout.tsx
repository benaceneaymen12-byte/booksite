import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';

const navItems = [
  { key: 'dashboard', path: '/', icon: '🏠' },
  { key: 'analyses', path: '/analyses', icon: '🔬' },
  { key: 'personnel', path: '/personnel', icon: '👥' },
  { key: 'water', path: '/water', icon: '💧' },
  { key: 'media', path: '/media', icon: '🧫' },
  { key: 'microorganisms', path: '/microorganisms', icon: '🦠' },
  { key: 'calculator', path: '/calculator', icon: '🧮' },
  { key: 'reports', path: '/reports', icon: '📋' },
  { key: 'settings', path: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 h-screen ${collapsed ? 'w-16' : 'w-60'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          {!collapsed && (
            <span className="font-bold text-primary">PharmaLab</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          v1.0 / Productivity Assistant
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
          Not GMP/QC software
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="flex justify-around py-1">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>
      <div className="flex justify-around py-1 pb-2 border-t border-gray-100 dark:border-gray-800">
        {navItems.slice(5).map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 text-xs transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar() {
  const { t } = useI18n();
  const location = useLocation();

  const current = navItems.find(
    (n) => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path))
  );

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary truncate">
          {current?.icon} {current && t(`nav.${current.key}`)}
        </h1>
        <OfflineIndicator />
      </div>
    </header>
  );
}

function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <span className={`text-xs ${online ? 'text-green-600' : 'text-red-600'}`}>
      {online ? '● Online' : '○ Offline'}
    </span>
  );
}

export function ComplianceBanner() {
  const { t } = useI18n();
  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
      <p className="flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <span>{t('compliance.warning')}</span>
      </p>
    </div>
  );
}
