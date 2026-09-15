import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { ConfirmModal } from '../components/Modal';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteModal, setDeleteModal] = useState<any | null>(null);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const data = await api.search(query, params);
      setResults(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal._type === 'analysis') await api.deleteAnalysis(deleteModal.id);
      else if (deleteModal._type === 'personnel') await api.deletePersonnel(deleteModal.id);
      else if (deleteModal._type === 'water') await api.deleteWaterSample(deleteModal.id);
      else if (deleteModal._type === 'media') await api.deleteMedia(deleteModal.id);
      else if (deleteModal._type === 'microorganism') await api.deleteMicroorganism(deleteModal.id);
      else if (deleteModal._type === 'report') await api.deleteShiftReport(deleteModal.id);
      setResults((prev) => prev.filter((r) => r.id !== deleteModal.id));
    } catch {}
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('searchPage.title')}</h1>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder={t('searchPage.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            className="flex-1"
          />
          <button onClick={doSearch} disabled={!query.trim() || loading} className="btn-primary">
            {loading ? t('common.loading') : t('searchPage.title')}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-32">
            <option value="">{t('common.all')} {t('common.type')}</option>
            <option value="analysis">{t('analyses.title')}</option>
            <option value="personnel">{t('personnel.title')}</option>
            <option value="water">{t('water.title')}</option>
            <option value="media">{t('media.title')}</option>
            <option value="microorganism">{t('microorganisms.title')}</option>
            <option value="report">{t('reports.title')}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-32">
            <option value="">{t('common.all')} {t('common.status')}</option>
            <option value="draft">{t('common.statusDraft')}</option>
            <option value="completed">{t('common.statusComplete')}</option>
            <option value="pending">{t('common.statusPending')}</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-36" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-36" />
          {(typeFilter || statusFilter || dateFrom || dateTo) && (
            <button onClick={() => { setTypeFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }} className="btn btn-secondary btn-sm">
              {t('searchPage.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <div key={`${item._type}-${item.id}`} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item._type === 'analysis' && t('analyses.title')}
                    {item._type === 'personnel' && t('personnel.title')}
                    {item._type === 'water' && t('water.title')}
                    {item._type === 'media' && t('media.title')}
                    {item._type === 'microorganism' && t('microorganisms.title')}
                    {item._type === 'report' && t('reports.title')}
                    <span className="text-gray-400 ml-2">#{item.id}</span>
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item._type === 'analysis' && (
                      <span>{item.sampleId} — {item.productName || ''} {item.batchLot ? '(' + item.batchLot + ')' : ''}</span>
                    )}
                    {item._type === 'personnel' && <span>{item.employeeId} — {item.department || ''}</span>}
                    {item._type === 'water' && <span>{item.sampleId} — {item.waterType || ''}</span>}
                    {item._type === 'media' && <span>{item.mediumName} — {item.lotNumber || ''}</span>}
                    {item._type === 'microorganism' && <span>{item.name}</span>}
                    {item._type === 'report' && <span>{item.date ? new Date(item.date).toLocaleDateString() : ''} — {item.analyst || ''}</span>}
                  </div>
                  <span className={`badge mt-1 inline-block ${
                    item.status === 'completed' ? 'badge-completed' :
                    item.status === 'pending' ? 'badge-pending' : 'badge-draft'
                  }`}>
                    {t(`common.status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`)}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {item._type === 'analysis' && <Link to={`/analyses/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  {item._type === 'personnel' && <Link to={`/personnel/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  {item._type === 'water' && <Link to={`/water/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  {item._type === 'media' && <Link to={`/media/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  {item._type === 'microorganism' && <Link to={`/microorganisms/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  {item._type === 'report' && <Link to={`/reports/${item.id}`} className="btn btn-secondary btn-sm">{t('common.edit')}</Link>}
                  <button onClick={() => setDeleteModal(item)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-400">{t('searchPage.noResults')}</p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title={t('common.confirm')}
        message={`${t('common.delete')}?`}
        confirmText={t('common.delete')}
        danger
      />
    </div>
  );
}
