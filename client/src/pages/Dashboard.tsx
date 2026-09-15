import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getRecentActivity()])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a || []);
      })
      .catch(() => {
        // offline mode - use empty data
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statCards = stats ? [
    { label: t('dashboard.analysesToday'), value: stats.analysesToday || 0, icon: '🔬', color: 'bg-blue-500' },
    { label: t('dashboard.personnelToday'), value: stats.personnelToday || 0, icon: '👥', color: 'bg-purple-500' },
    { label: t('dashboard.waterToday'), value: stats.waterToday || 0, icon: '💧', color: 'bg-cyan-500' },
    { label: t('dashboard.rawMaterials'), value: stats.rawMaterials || 0, icon: '📦', color: 'bg-orange-500' },
    { label: t('dashboard.finishedProducts'), value: stats.finishedProducts || 0, icon: '🏭', color: 'bg-green-500' },
    { label: t('dashboard.pendingRecords'), value: stats.pendingRecords || 0, icon: '⏳', color: 'bg-amber-500' },
    { label: t('dashboard.completedRecords'), value: stats.completedRecords || 0, icon: '✅', color: 'bg-emerald-500' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.title')}
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{today}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${card.color} flex items-center justify-center text-white text-sm`}>
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.todaysActivities')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.analysesToday')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.analysesToday || 0}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.personnelToday')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.personnelToday || 0}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.waterToday')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.waterToday || 0}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.rawMaterials')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.rawMaterials || 0}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.finishedProducts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.finishedProducts || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
        ) : activity.length === 0 ? (
          <p className="text-center py-4 text-gray-400">{t('dashboard.noRecentActivity')}</p>
        ) : (
          <div className="space-y-2">
            {activity.slice(0, 10).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon || '📋'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
