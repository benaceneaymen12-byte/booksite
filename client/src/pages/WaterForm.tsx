import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function WaterForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const form = useForm(
    { sampleId: '', waterType: 'purified_water', samplingPoint: '', samplingDate: '', samplingTime: '',
      analyst: '', volume: '', dilution: '', colonyCount: '', unit: '', result: '', sopRef: '', observations: '', status: 'draft' },
    (v) => { const e: any = {}; if (!v.sampleId) e.sampleId = 'Required'; if (!v.samplingDate) e.samplingDate = 'Required'; return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getWaterSample(editingId).then((data) => {
        form.reset({ sampleId: data.sampleId || '', waterType: data.waterType || 'purified_water', samplingPoint: data.samplingPoint || '',
          samplingDate: data.samplingDate || '', samplingTime: data.samplingTime || '', analyst: data.analyst || '',
          volume: data.volume || '', dilution: data.dilution || '', colonyCount: data.colonyCount || '',
          unit: data.unit || '', result: data.result || '', sopRef: data.sopRef || '',
          observations: data.observations || '', status: data.status || 'draft' });
      }).catch(() => navigate('/water'));
    } else {
      form.reset({ sampleId: '', waterType: 'purified_water', samplingPoint: '', samplingDate: '', samplingTime: '',
        analyst: '', volume: '', dilution: '', colonyCount: '', unit: '', result: '', sopRef: '', observations: '', status: 'draft' });
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { ...form.values, volume: form.values.volume ? parseFloat(form.values.volume) : undefined, dilution: form.values.dilution ? parseFloat(form.values.dilution) : undefined, colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined };
      if (editingId) await api.updateWaterSample(editingId, payload);
      else await api.createWaterSample(payload);
      navigate('/water');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try { await api.deleteWaterSample(editingId); navigate('/water'); } catch {} finally { setDeleteModal(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editingId ? t('water.editSample') : t('water.newSample')}</h1>
        {editingId && <button onClick={() => setDeleteModal(true)} className="btn btn-danger">{t('common.delete')}</button>}
      </div>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('water.sampleId')} name="sampleId" type="text" value={form.values.sampleId} onChange={form.handleChange} error={form.errors.sampleId} required />
          <FormField label={t('water.waterType')} name="waterType" type="select" value={form.values.waterType} onChange={form.handleChange}
            options={[{ value: 'purified_water', label: t('water.purifiedWater') }, { value: 'wfi', label: t('water.wfi') }, { value: 'other', label: t('water.other') }]} />
          <FormField label={t('water.samplingPoint')} name="samplingPoint" type="text" value={form.values.samplingPoint} onChange={form.handleChange} />
          <FormField label={t('water.samplingDate')} name="samplingDate" type="date" value={form.values.samplingDate} onChange={form.handleChange} error={form.errors.samplingDate} required />
          <FormField label={t('common.time')} name="samplingTime" type="time" value={form.values.samplingTime} onChange={form.handleChange} />
          <FormField label={t('water.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} />
          <FormField label={t('water.volume')} name="volume" type="text" value={form.values.volume} onChange={form.handleChange} />
          <FormField label={t('common.dilution')} name="dilution" type="text" value={form.values.dilution} onChange={form.handleChange} />
          <FormField label={t('water.colonyCount')} name="colonyCount" type="number" value={form.values.colonyCount} onChange={form.handleChange} />
          <FormField label={t('common.unit')} name="unit" type="text" value={form.values.unit} onChange={form.handleChange} />
          <FormField label={t('common.result')} name="result" type="text" value={form.values.result} onChange={form.handleChange} />
          <FormField label={t('water.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
        </div>
        <div className="mt-4"><FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} /></div>
        <div className="mt-4"><FormField label={t('common.status')} name="status" type="select" value={form.values.status} onChange={form.handleChange}
          options={[{ value: 'draft', label: t('common.statusDraft') }, { value: 'completed', label: t('common.statusComplete') }, { value: 'pending', label: t('common.statusPending') }]} /></div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
        <button onClick={() => navigate('/water')} className="btn-secondary">{t('common.cancel')}</button>
      </div>
      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title={t('common.confirm')} message={t('water.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}
