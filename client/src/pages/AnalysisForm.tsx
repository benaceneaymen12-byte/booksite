import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function AnalysisForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const form = useForm(
    {
      sampleId: '', productName: '', productType: 'raw_material', batchLot: '',
      samplingDate: '', analysisDate: new Date().toISOString().split('T')[0], analyst: '',
      testType: '', sopRef: '', dilution: '', volumePlated: '', colonyCount: '',
      unit: 'CFU/mL', result: '', observations: '', status: 'draft',
    },
    (v) => {
      const e: any = {};
      if (!v.sampleId) e.sampleId = 'Required';
      if (!v.productName) e.productName = 'Required';
      if (!v.samplingDate) e.samplingDate = 'Required';
      if (!v.analysisDate) e.analysisDate = 'Required';
      return e;
    }
  );

  useEffect(() => {
    api.getMedia().then((data) => setMedia(data || [])).catch(() => {});
    if (editingId) {
      api.getAnalysis(editingId).then((data) => {
        form.reset({
          sampleId: data.sampleId || '', productName: data.productName || '',
          productType: data.productType || 'raw_material', batchLot: data.batchLot || '',
          samplingDate: data.samplingDate || '', analysisDate: data.analysisDate || '',
          analyst: data.analyst || '', testType: data.testType || '', sopRef: data.sopRef || '',
          dilution: data.dilution || '', volumePlated: data.volumePlated || '',
          colonyCount: data.colonyCount || '', unit: data.unit || 'CFU/mL',
          result: data.result || '', observations: data.observations || '',
          status: data.status || 'draft',
        });
        if (data.results) setResults(data.results);
      }).catch(() => { navigate('/analyses'); });
    } else {
      form.reset({
        sampleId: '', productName: '', productType: 'raw_material', batchLot: '',
        samplingDate: '', analysisDate: new Date().toISOString().split('T')[0], analyst: '',
        testType: '', sopRef: '', dilution: '', volumePlated: '', colonyCount: '',
        unit: 'CFU/mL', result: '', observations: '', status: 'draft',
      });
      setResults([]);
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form.values,
        dilution: form.values.dilution ? parseFloat(form.values.dilution) : undefined,
        volumePlated: form.values.volumePlated ? parseFloat(form.values.volumePlated) : undefined,
        colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined,
        results: results.filter((r: any) => r.colonyCount || r.result),
      };
      if (editingId) await api.updateAnalysis(editingId, payload);
      else await api.createAnalysis(payload);
      navigate('/analyses');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.deleteAnalysis(editingId);
      navigate('/analyses');
    } catch {} finally { setDeleteModal(false); }
  };

  const addResult = () => setResults([...results, { colonyCount: '', dilution: '', volumePlated: '', unit: 'CFU/mL', result: '', observations: '' }]);
  const updateResult = (idx: number, f: string, v: any) => { const u = [...results]; (u[idx] as any)[f] = v; setResults(u); };
  const removeResult = (idx: number) => setResults(results.filter((_: any, i: number) => i !== idx));

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingId ? t('analyses.editAnalysis') : t('analyses.newAnalysis')}
        </h1>
        {editingId && (
          <button onClick={() => setDeleteModal(true)} className="btn btn-danger">
            {t('common.delete')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('analyses.sampleId')} name="sampleId" type="text" value={form.values.sampleId} onChange={form.handleChange} error={form.errors.sampleId} required />
          <FormField label={t('analyses.productName')} name="productName" type="text" value={form.values.productName} onChange={form.handleChange} error={form.errors.productName} required />
          <FormField label={t('analyses.productType')} name="productType" type="select" value={form.values.productType} onChange={form.handleChange}
            options={[ { value: 'raw_material', label: t('analyses.rawMaterial') }, { value: 'finished_product', label: t('analyses.finishedProduct') }, { value: 'in_process', label: t('analyses.inProcess') }, { value: 'other', label: t('analyses.other') } ]} />
          <FormField label={t('analyses.batchLot')} name="batchLot" type="text" value={form.values.batchLot} onChange={form.handleChange} />
          <div>
            <label className="field-label">{t('analyses.preparedMediaLot')}</label>
            <select className="input" value={media.find((item) => item.lotNumber === form.values.batchLot)?.id || ''} onChange={(event) => {
              const selected = media.find((item) => String(item.id) === event.target.value);
              form.handleChange('batchLot', selected?.lotNumber || '');
            }}>
              <option value="">{t('common.select')}</option>
              {media.map((item) => <option key={item.id} value={item.id}>{item.mediumName} · {item.lotNumber || '—'} · {item.expiryDate || '—'}</option>)}
            </select>
          </div>
          <FormField label={t('analyses.samplingDate')} name="samplingDate" type="date" value={form.values.samplingDate} onChange={form.handleChange} error={form.errors.samplingDate} required />
          <FormField label={t('analyses.analysisDate')} name="analysisDate" type="date" value={form.values.analysisDate} onChange={form.handleChange} error={form.errors.analysisDate} required />
          <FormField label={t('analyses.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} />
          <FormField label={t('analyses.testType')} name="testType" type="text" value={form.values.testType} onChange={form.handleChange} />
          <FormField label={t('analyses.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
          <FormField label={t('analyses.dilution')} name="dilution" type="text" value={form.values.dilution} onChange={form.handleChange} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('analyses.results')}</h3>
          <button onClick={addResult} className="btn btn-primary btn-sm">+ {t('analyses.addResult')}</button>
        </div>
        {results.map((r: any, idx: number) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
            <FormField label="#" name={`ri_${idx}`} type="text" value={idx + 1} onChange={() => {}} disabled />
            <FormField label={t('analyses.colonyCount')} name={`rc_${idx}`} type="text" value={r.colonyCount || ''} onChange={(v: any) => updateResult(idx, 'colonyCount', v)} />
            <FormField label={t('analyses.dilution')} name={`rd_${idx}`} type="text" value={r.dilution || ''} onChange={(v: any) => updateResult(idx, 'dilution', v)} />
            <FormField label={t('analyses.volumePlated')} name={`rv_${idx}`} type="text" value={r.volumePlated || ''} onChange={(v: any) => updateResult(idx, 'volumePlated', v)} />
            <FormField label={t('common.unit')} name={`ru_${idx}`} type="text" value={r.unit || ''} onChange={(v: any) => updateResult(idx, 'unit', v)} />
            <FormField label={t('analyses.result')} name={`rr_${idx}`} type="text" value={r.result || ''} onChange={(v: any) => updateResult(idx, 'result', v)} />
            <div className="flex items-end"><button onClick={() => removeResult(idx)} className="btn btn-danger btn-sm">×</button></div>
          </div>
        ))}
      </div>

      <div className="card">
        <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
        <div className="mt-3">
          <FormField label={t('common.status')} name="status" type="select" value={form.values.status} onChange={form.handleChange}
            options={[{ value: 'draft', label: t('common.statusDraft') }, { value: 'completed', label: t('common.statusComplete') }, { value: 'pending', label: t('common.statusPending') }]} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">
          {loading ? t('common.loading') : t('common.save')}
        </button>
        <button onClick={() => navigate('/analyses')} className="btn-secondary">{t('common.cancel')}</button>
      </div>

      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title={t('common.confirm')} message={t('analyses.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}
