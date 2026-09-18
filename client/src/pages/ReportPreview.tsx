import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

export default function ReportPreview() {
  const { t } = useI18n();
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportResult, htmlResult] = await Promise.allSettled([
          api.getShiftReport(parseInt(id!)),
          api.generateReportPdf(parseInt(id!)),
        ]);

        if (reportResult.status === 'fulfilled') {
          setReport(reportResult.value);
        }

        if (htmlResult.status === 'fulfilled') {
          setPreviewHtml(htmlResult.value);
        }
      } catch {
        // keep the previous state empty and show the not-found message below
      }
      finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-8">{t('common.loading')}</div>;

  if (!report) return <div className="text-center py-8">Report not found</div>;

  const reportShift = report.shiftLabel || `${report.shiftStart || ''} - ${report.shiftEnd || ''}`.trim().replace(/^\s*-\s*|\s*-\s*$/g, '') || '—';

  const labName = localStorage.getItem('labName') || 'Laboratoire';
  const generated = new Date().toLocaleString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.preview')}</h1>
        <div className="flex gap-2">
          {previewHtml && (
            <>
              <a href={URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' }))} download={`rapport-${report.id}.html`} className="btn-primary">
                {t('reports.download')}
              </a>
              <button
                onClick={() => window.open(URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' })), '_blank')}
                className="btn btn-secondary"
              >
                {t('reports.printReport')}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Rapport de shift - ${report.date}`,
                      url: URL.createObjectURL(new Blob([previewHtml], { type: 'text/html' })),
                    }).catch(() => {});
                  }
                }}
                className="btn btn-secondary"
              >
                {t('reports.shareReport')}
              </button>
            </>
          )}
          <Link to={`/reports/${id}`} className="btn btn-secondary">
            {t('common.edit')}
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🧪</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{labName}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('common.appName')} — Rapport de shift</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase">Date</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {report.date ? new Date(report.date).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Analyste</p>
            <p className="font-semibold text-gray-900 dark:text-white">{report.analyst || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Shift</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {reportShift}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Généré le</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{generated}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('reports.activities')}</h3>
          {Array.isArray(report.activities) && report.activities.length > 0 ? (
            <div className="space-y-2">
              {report.activities.map((a: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{t(`reports.${a}`)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">Aucune activité enregistrée</p>
          )}
        </div>

        {report.observations && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('common.observations')}</h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{report.observations}</p>
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Document généré automatiquement par {t('common.appName')}.
            Ce rapport est un aide-mémoire et ne remplace pas la documentation GMP officielle.
          </p>
        </div>
      </div>

      {previewHtml && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('reports.preview')}</h3>
          <iframe srcDoc={previewHtml} className="w-full h-[500px] border border-gray-200 rounded-lg" />
        </div>
      )}
    </div>
  );
}
