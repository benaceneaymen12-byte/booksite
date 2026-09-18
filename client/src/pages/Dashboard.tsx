import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

const statConfig = [
  { key: 'analysesToday', labelKey: 'dashboard.analysesToday', icon: '🔬', color: 'bg-blue-500 bg-opacity-15 text-blue-600 dark:text-blue-400' },
  { key: 'personnelToday', labelKey: 'dashboard.personnelToday', icon: '👥', color: 'bg-purple-500 bg-opacity-15 text-purple-600 dark:text-purple-400' },
  { key: 'waterToday', labelKey: 'dashboard.waterToday', icon: '💧', color: 'bg-cyan-500 bg-opacity-15 text-cyan-600 dark:text-cyan-400' },
  { key: 'rawMaterials', labelKey: 'dashboard.rawMaterials', icon: '📦', color: 'bg-orange-500 bg-opacity-15 text-orange-600 dark:text-orange-400' },
  { key: 'finishedProducts', labelKey: 'dashboard.finishedProducts', icon: '🏭', color: 'bg-green-500 bg-opacity-15 text-green-600 dark:text-green-400' },
  { key: 'pendingRecords', labelKey: 'dashboard.pendingRecords', icon: '⏳', color: 'bg-amber-500 bg-opacity-15 text-amber-600 dark:text-amber-400' },
  { key: 'completedRecords', labelKey: 'dashboard.completedRecords', icon: '✅', color: 'bg-emerald-500 bg-opacity-15 text-emerald-600 dark:text-emerald-400' },
];

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [operational, setOperational] = useState({ expiring: 0, lowStock: 0, petri: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getRecentActivity(), api.getMedia(), api.getInventory(), api.getPetri(), api.getSettings()])
      .then(([s, a, media, inventory, petri, settings]) => {
        setStats(s);
        setActivity(a || []);
        const configuredWarningDays = Number.parseInt(settings?.warningDays || '10', 10);
        const warningDays = Number.isFinite(configuredWarningDays) && configuredWarningDays > 0 ? configuredWarningDays : 10;
        const soon = (media || []).filter((item: any) => {
          if (!item.expiryDate) return false;
          const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);
          return daysUntilExpiry >= 0 && daysUntilExpiry <= warningDays;
        }).length;
        const low = (inventory || []).filter((item: any) => Number(item.quantity) > 0 && Number(item.quantity) <= 10).length;
        setOperational({ expiring: soon, lowStock: low, petri: (petri || []).length });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statCards = stats ? statConfig.map((cfg) => ({
    ...cfg,
    value: stats[cfg.key] || 0,
    label: t(cfg.labelKey),
  })) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header h1">{t('dashboard.title')}</h1>
          <p className="page-subtitle mt-0.5">{today}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card"><p className="text-sm text-muted">{t('dashboard.mediaExpiring')}</p><p className="text-2xl font-bold text-amber-500 mt-1">{operational.expiring}</p></div>
        <div className="card"><p className="text-sm text-muted">{t('dashboard.lowStock')}</p><p className="text-2xl font-bold text-red-500 mt-1">{operational.lowStock}</p></div>
        <div className="card"><p className="text-sm text-muted">{t('dashboard.petriBatches')}</p><p className="text-2xl font-bold text-lime-500 mt-1">{operational.petri}</p></div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton w-9 h-9 rounded-lg mb-1.5 mx-auto" />
              <div className="skeleton h-6 w-10 mb-1 mx-auto" />
              <div className="skeleton h-3 w-16 mx-auto" />
            </div>
          ))
        ) : statCards.map((card) => (
          <div key={card.key} className="stat-card">
            <div className={`stat-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-copy">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's activities */}
      <div className="card">
        <div className="card-header">
          <h2>{t('dashboard.todaysActivities')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { key: 'analysesToday', icon: '🔬', label: t('dashboard.analysesToday') },
            { key: 'personnelToday', icon: '👥', label: t('dashboard.personnelToday') },
            { key: 'waterToday', icon: '💧', label: t('dashboard.waterToday') },
            { key: 'rawMaterials', icon: '📦', label: t('dashboard.rawMaterials') },
            { key: 'finishedProducts', icon: '🏭', label: t('dashboard.finishedProducts') },
          ].map((item) => (
            <div key={item.key} className="stat-card">
              <div className={`stat-icon ${statConfig.find(c => c.key === item.key)?.color || 'bg-gray-500'}`}>
                {item.icon}
              </div>
              <div className="stat-copy">
                <div className="stat-value">{stats?.[item.key] || 0}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-header">
          <h2>{t('dashboard.recentActivity')}</h2>
          {stats && (
            <span className="text-xs text-muted">
              {stats.totalRecords || 0} au total
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-3 w-3/4 mb-1" />
                  <div className="skeleton h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-center py-4 text-sm text-muted">{t('dashboard.noRecentActivity')}</p>
        ) : (
          <div className="divide-y divide-border dark:divide-border-dark">
            {activity.slice(0, 10).map((item: any) => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon bg-muted/5 dark:bg-white/5 rounded-lg text-base">
                  {item.icon || '📋'}
                </div>
                <div className="activity-content">
                  <p className="activity-label">{item.label}</p>
                  <p className="activity-detail">{item.detail}</p>
                </div>
                <span className="activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
