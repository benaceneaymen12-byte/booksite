import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

export default function AuditPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs({ page: String(page), limit: String(pageSize) });
      setLogs(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('audit.title')}</h1>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       logs.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">Aucun log d'audit</p></div> :
       <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('audit.action')}:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize ml-1">{log.action}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('audit.recordType')}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">{log.recordType}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('audit.recordId')}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">{log.recordId || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('audit.user')}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">{log.user || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{t('audit.date')}:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</span>
              </div>
            </div>
            {(log.oldValue || log.newValue) && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <span className="text-gray-500">{t('audit.oldValue')}:</span>
                  <pre className="text-red-600 dark:text-red-400 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-auto max-h-20">{JSON.stringify(log.oldValue, null, 2)}</pre>
                </div>
                <div>
                  <span className="text-gray-500">{t('audit.newValue')}:</span>
                  <pre className="text-green-600 dark:text-green-400 mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded overflow-auto max-h-20">{JSON.stringify(log.newValue, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>}

      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-secondary btn-sm">← Précédent</button>
        <span className="text-sm text-gray-500">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={logs.length < pageSize} className="btn btn-secondary btn-sm">Suivant →</button>
      </div>
    </div>
  );
}
