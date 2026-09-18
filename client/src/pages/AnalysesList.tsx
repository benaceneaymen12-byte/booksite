import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { Analysis } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';

export default function AnalysesList() {
  const { t } = useI18n();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<Analysis | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.productType = typeFilter;
      if (searchQuery) params.q = searchQuery;
      const data = await api.getAnalyses(params);
      setAnalyses(data || []);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.deleteAnalysis(deleteModal.id!);
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteModal.id));
    } catch {
      // offline or error
    }
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-header h1">
          {t('analyses.title')}
        </h1>
        <div className="primary-actions">
          <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn btn-primary">
            + {t('analyses.newAnalysis')}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder={t('searchPage.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-32"
        >
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="draft">{t('common.statusDraft')}</option>
          <option value="completed">{t('common.statusComplete')}</option>
          <option value="pending">{t('common.statusPending')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-32"
        >
          <option value="">{t('common.all')} {t('common.type')}</option>
          <option value="raw_material">{t('analyses.rawMaterial')}</option>
          <option value="finished_product">{t('analyses.finishedProduct')}</option>
          <option value="in_process">{t('analyses.inProcess')}</option>
          <option value="other">{t('analyses.other')}</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">{t('common.loading')}</div>
      ) : analyses.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">{t('analyses.noAnalyses')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.sampleId}
                    {analysis.isDemo && (
                      <span className="badge-demo ml-2">{t('common.demoBadge')}</span>
                    )}
                  </span>
                  <span className={`badge ${
                    analysis.status === 'completed' ? 'badge-completed' :
                    analysis.status === 'pending' ? 'badge-pending' :
                    'badge-draft'
                  }`}>
                    {t(`common.status${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}`)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {analysis.productName} — {analysis.batchLot || '—'}
                </p>
                {analysis.results && analysis.results.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {analysis.results.length} {t('common.results')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : ''}
                </span>
                <button
                  onClick={() => { setEditingId(analysis.id!); setShowForm(true); }}
                  className="btn btn-secondary btn-sm"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => setDeleteModal(analysis)}
                  className="btn btn-danger btn-sm"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AnalysisFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          editingId={editingId}
          onSaved={() => {
            setShowForm(false);
            fetchAnalyses();
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title={t('common.confirm')}
        message={t('analyses.confirmDelete')}
        confirmText={t('common.delete')}
        danger
      />
    </div>
  );
}

function AnalysisFormModal({
  isOpen,
  onClose,
  editingId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const form = useForm(
    {
      sampleId: '',
      productName: '',
      productType: 'raw_material',
      batchLot: '',
      samplingDate: '',
      analysisDate: new Date().toISOString().split('T')[0],
      analyst: '',
      testType: '',
      sopRef: '',
      dilution: '',
      volumePlated: '',
      colonyCount: '',
      unit: 'CFU/mL',
      result: '',
      observations: '',
      status: 'draft',
    },
    (v) => {
      const errs: any = {};
      if (!v.sampleId) errs.sampleId = t('common.required');
      if (!v.productName) errs.productName = t('common.required');
      if (!v.samplingDate) errs.samplingDate = t('common.required');
      if (!v.analysisDate) errs.analysisDate = t('common.required');
      return errs;
    }
  );

  useEffect(() => {
    if (editingId) {
      api.getAnalysis(editingId).then((data) => {
        form.reset({
          sampleId: data.sampleId || '',
          productName: data.productName || '',
          productType: data.productType || 'raw_material',
          batchLot: data.batchLot || '',
          samplingDate: data.samplingDate || '',
          analysisDate: data.analysisDate || '',
          analyst: data.analyst || '',
          testType: data.testType || '',
          sopRef: data.sopRef || '',
          dilution: data.dilution || '',
          volumePlated: data.volumePlated || '',
          colonyCount: data.colonyCount || '',
          unit: data.unit || 'CFU/mL',
          result: data.result || '',
          observations: data.observations || '',
          status: data.status || 'draft',
        });
        if (data.results) setResults(data.results);
      }).catch(() => {});
    } else {
      form.reset({
        sampleId: '',
        productName: '',
        productType: 'raw_material',
        batchLot: '',
        samplingDate: '',
        analysisDate: new Date().toISOString().split('T')[0],
        analyst: '',
        testType: '',
        sopRef: '',
        dilution: '',
        volumePlated: '',
        colonyCount: '',
        unit: 'CFU/mL',
        result: '',
        observations: '',
        status: 'draft',
      });
      setResults([]);
    }
  }, [editingId, isOpen]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form.values,
        dilution: form.values.dilution ? parseFloat(form.values.dilution) : undefined,
        volumePlated: form.values.volumePlated ? parseFloat(form.values.volumePlated) : undefined,
        colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined,
        results: results.filter((r) => r.colonyCount || r.result),
      };
      if (editingId) {
        await api.updateAnalysis(editingId, payload);
      } else {
        await api.createAnalysis(payload);
      }
      onSaved();
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const addResult = () => {
    setResults([...results, { colonyCount: '', dilution: '', volumePlated: '', unit: 'CFU/mL', result: '', observations: '' }]);
  };

  const updateResult = (idx: number, field: string, value: any) => {
    const updated = [...results];
    (updated[idx] as any)[field] = value;
    setResults(updated);
  };

  const removeResult = (idx: number) => {
    setResults(results.filter((_, i) => i !== idx));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('analyses.editAnalysis') : t('analyses.newAnalysis')} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('analyses.sampleId')} name="sampleId" type="text" value={form.values.sampleId} onChange={form.handleChange} error={form.errors.sampleId} required />
          <FormField label={t('analyses.productName')} name="productName" type="text" value={form.values.productName} onChange={form.handleChange} error={form.errors.productName} required />
          <FormField
            label={t('analyses.productType')}
            name="productType"
            type="select"
            value={form.values.productType}
            onChange={form.handleChange}
            options={[
              { value: 'raw_material', label: t('analyses.rawMaterial') },
              { value: 'finished_product', label: t('analyses.finishedProduct') },
              { value: 'in_process', label: t('analyses.inProcess') },
              { value: 'other', label: t('analyses.other') },
            ]}
          />
          <FormField label={t('analyses.batchLot')} name="batchLot" type="text" value={form.values.batchLot} onChange={form.handleChange} />
          <FormField label={t('analyses.samplingDate')} name="samplingDate" type="date" value={form.values.samplingDate} onChange={form.handleChange} error={form.errors.samplingDate} required />
          <FormField label={t('analyses.analysisDate')} name="analysisDate" type="date" value={form.values.analysisDate} onChange={form.handleChange} error={form.errors.analysisDate} required />
          <FormField label={t('analyses.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} />
          <FormField label={t('analyses.testType')} name="testType" type="text" value={form.values.testType} onChange={form.handleChange} />
          <FormField label={t('analyses.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
          <FormField label={t('analyses.dilution')} name="dilution" type="text" value={form.values.dilution} onChange={form.handleChange} />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('analyses.results')}</h3>
            <button onClick={addResult} className="btn btn-primary btn-sm">+ {t('analyses.addResult')}</button>
          </div>
          {results.map((r, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
              <FormField label="#" name={`result_${idx}_index`} type="text" value={idx + 1} onChange={() => {}} disabled />
              <FormField label={t('analyses.colonyCount')} name={`result_${idx}_colonyCount`} type="text" value={r.colonyCount || ''} onChange={(v) => updateResult(idx, 'colonyCount', v)} />
              <FormField label={t('analyses.dilution')} name={`result_${idx}_dilution`} type="text" value={r.dilution || ''} onChange={(v) => updateResult(idx, 'dilution', v)} />
              <FormField label={t('analyses.volumePlated')} name={`result_${idx}_volumePlated`} type="text" value={r.volumePlated || ''} onChange={(v) => updateResult(idx, 'volumePlated', v)} />
              <FormField label={t('common.unit')} name={`result_${idx}_unit`} type="text" value={r.unit || ''} onChange={(v) => updateResult(idx, 'unit', v)} />
              <FormField label={t('analyses.result')} name={`result_${idx}_result`} type="text" value={r.result || ''} onChange={(v) => updateResult(idx, 'result', v)} />
              <button onClick={() => removeResult(idx)} className="btn btn-danger btn-sm self-end">×</button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
          <FormField
            label={t('common.status')}
            name="status"
            type="select"
            value={form.values.status}
            onChange={form.handleChange}
            options={[
              { value: 'draft', label: t('common.statusDraft') },
              { value: 'completed', label: t('common.statusComplete') },
              { value: 'pending', label: t('common.statusPending') },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">
          {loading ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
