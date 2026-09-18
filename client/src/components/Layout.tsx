import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { key: 'dashboard', path: '/', icon: '🏠' },
  { key: 'analyses', path: '/analyses', icon: '🔬' },
  { key: 'personnel', path: '/personnel', icon: '👥' },
  { key: 'water', path: '/water', icon: '💧' },
  { key: 'media', path: '/media', icon: '🧫' },
  { key: 'petri', path: '/petri', icon: '🧪' },
  { key: 'inventory', path: '/inventory', icon: '📦' },
  { key: 'sterilization', path: '/sterilization', icon: '♨️' },
  { key: 'microorganisms', path: '/microorganisms', icon: '🦠' },
  { key: 'calculator', path: '/calculator', icon: '🧮' },
  { key: 'reports', path: '/reports', icon: '📋' },
  { key: 'settings', path: '/settings', icon: '⚙️' },
];

const iconColors: Record<string, string> = {
  dashboard: 'bg-blue-500',
  analyses: 'bg-purple-500',
  personnel: 'bg-emerald-500',
  water: 'bg-cyan-500',
  media: 'bg-orange-500',
  petri: 'bg-lime-500',
  inventory: 'bg-indigo-500',
  sterilization: 'bg-red-500',
  microorganisms: 'bg-pink-500',
  calculator: 'bg-amber-500',
  reports: 'bg-teal-500',
  settings: 'bg-gray-500',
};

export function Sidebar() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`app-sidebar hidden lg:flex flex-col transition-all duration-200 h-screen ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="sidebar-header">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const iconBg = iconColors[item.key] || 'bg-gray-500';
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-item ${active ? 'is-active' : ''} ${collapsed ? 'collapsed' : ''}`}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
            >
              <span className={`nav-icon ${iconBg}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="nav-label">{t(`nav.${item.key}`)}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {user?.role === 'admin' && <Link to="/admin/users" className="btn btn-secondary btn-sm w-full mb-2">Admin users</Link>}
        <button onClick={logout} className={`btn btn-secondary btn-sm w-full ${collapsed ? 'px-2' : ''}`} title={collapsed ? t('common.logout') : undefined}>
          <span aria-hidden="true">↪</span>{!collapsed && <span>{t('common.logout')}</span>}
        </button>
        <p className="sidebar-meta">v1.0</p>
        <p className="sidebar-meta subtle">Biocare Biotech Lab</p>
        <p className="sidebar-meta tiny">Made by Aymen Benahcene</p>
        <p className="sidebar-meta tiny">Not GMP/QC</p>
      </div>
    </aside>
  );
}

export function BrandHeader() {
  const { user } = useAuth();
  return (
    <div className="app-brand-header">
      <Link to="/" className="global-brand-link">
        <img className="global-brand-logo" src={`${import.meta.env.BASE_URL}logok.png`} alt="Biocare Biotech" />
      </Link>
      {user && <Link to="/profile" className="global-profile-link">
        {user.avatar ? <img src={user.avatar} alt="" className="global-avatar" /> : <span className="global-avatar global-avatar-fallback">{(user.name || user.username).slice(0, 1).toUpperCase()}</span>}
        <span>{user.name || user.username}</span>
      </Link>}
    </div>
  );
}

export function MobileNav() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav className="mobile-nav lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="flex justify-around items-center py-1 max-w-md mx-auto">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const iconBg = iconColors[item.key] || 'bg-gray-500';
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <span className={`mobile-nav-icon ${iconBg} ${active ? 'active' : ''}`}>
                {item.icon}
              </span>
              <span className={`mobile-nav-label ${active ? 'active' : ''}`}>
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="flex justify-around items-center py-1 max-w-md mx-auto mobile-nav-second-row">
        {navItems.slice(5).map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const iconBg = iconColors[item.key] || 'bg-gray-500';
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
            >
              <span className={`mobile-nav-icon ${iconBg} ${active ? 'active' : ''}`}>
                {item.icon}
              </span>
              <span className={`mobile-nav-label ${active ? 'active' : ''}`}>
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const location = useLocation();

  const current = navItems.find(
    (n) => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path))
  );

  return (
    <header className="mobile-topbar lg:hidden sticky top-0 z-40 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold truncate flex items-center gap-2">
          <span className="text-base">{current?.icon || '📋'}</span>
          {current && t(`nav.${current.key}`)}
        </h1>
        <div className="flex items-center gap-3">
          <OfflineIndicator />
          <Link to="/profile" className="text-xs font-semibold text-white/80 hover:text-white">Profile</Link>
          <button onClick={logout} className="text-xs font-semibold text-white/80 hover:text-white" aria-label={t('common.logout')}>
            {t('common.logout')}
          </button>
        </div>
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
    <span className={`text-[10px] font-medium ${online ? 'text-green-400' : 'text-red-400'}`}>
      {online ? '● Online' : '○ Offline'}
    </span>
  );
}

export function ComplianceBanner() {
  const { t } = useI18n();
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
      <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
      <span className="leading-relaxed">{t('compliance.warning')}</span>
    </div>
  );
}
