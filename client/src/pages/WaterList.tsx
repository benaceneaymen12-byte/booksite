import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { WaterSample } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';

export default function WaterList() {
  const { t } = useI18n();
  const [samples, setSamples] = useState<WaterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<WaterSample | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchSamples = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.waterType = typeFilter;
      if (searchQuery) params.q = searchQuery;
      const data = await api.getWaterSamples(params);
      setSamples(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSamples(); }, [statusFilter, typeFilter, searchQuery]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try { await api.deleteWaterSample(deleteModal.id!); setSamples((p) => p.filter((s) => s.id !== deleteModal.id)); } catch {}
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('water.title')}</h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">+ {t('water.newSample')}</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" placeholder={t('searchPage.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-32">
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="draft">{t('common.statusDraft')}</option>
          <option value="completed">{t('common.statusComplete')}</option>
          <option value="pending">{t('common.statusPending')}</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-32">
          <option value="">{t('common.all')} {t('water.waterType')}</option>
          <option value="purified_water">{t('water.purifiedWater')}</option>
          <option value="wfi">{t('water.wfi')}</option>
          <option value="other">{t('water.other')}</option>
        </select>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       samples.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">{t('water.noSamples')}</p></div> :
       <div className="space-y-2">
        {samples.map((s) => (
          <div key={s.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-white">{s.sampleId}</span>
                {s.isDemo && <span className="badge-demo">{t('common.demoBadge')}</span>}
                <span className={`badge ${s.status === 'completed' ? 'badge-completed' : s.status === 'pending' ? 'badge-pending' : 'badge-draft'}`}>
                  {t(`common.status${s.status.charAt(0).toUpperCase() + s.status.slice(1)}`)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t(`water.${s.waterType === 'purified_water' ? 'purifiedWater' : s.waterType === 'wfi' ? 'wfi' : 'other'}`)} — {s.samplingPoint || '—'}
              </p>
              {s.colonyCount !== undefined && <p className="text-xs text-gray-400 mt-1">{s.colonyCount} colonies — {s.result || ''}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</span>
              <button onClick={() => { setEditingId(s.id!); setShowForm(true); }} className="btn btn-secondary btn-sm">{t('common.edit')}</button>
              <button onClick={() => setDeleteModal(s)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>}

      {showForm && <WaterFormModal isOpen={showForm} onClose={() => setShowForm(false)} editingId={editingId} onSaved={() => { setShowForm(false); fetchSamples(); }} />}
      <ConfirmModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('water.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}

function WaterFormModal({ isOpen, onClose, editingId, onSaved }: { isOpen: boolean; onClose: () => void; editingId: number | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const form = useForm(
    {
      sampleId: '', waterType: 'purified_water', samplingPoint: '', samplingDate: '', samplingTime: '',
      analyst: '', volume: '', dilution: '', colonyCount: '', unit: '', result: '',
      sopRef: '', observations: '', status: 'draft',
    },
    (v) => { const e: any = {}; if (!v.sampleId) e.sampleId = t('common.required'); if (!v.samplingDate) e.samplingDate = t('common.required'); return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getWaterSample(editingId).then((data) => {
        form.reset({
          sampleId: data.sampleId || '', waterType: data.waterType || 'purified_water', samplingPoint: data.samplingPoint || '',
          samplingDate: data.samplingDate || '', samplingTime: data.samplingTime || '', analyst: data.analyst || '',
          volume: data.volume || '', dilution: data.dilution || '', colonyCount: data.colonyCount || '',
          unit: data.unit || '', result: data.result || '', sopRef: data.sopRef || '',
          observations: data.observations || '', status: data.status || 'draft',
        });
      }).catch(() => {});
    } else {
      form.reset({
        sampleId: '', waterType: 'purified_water', samplingPoint: '', samplingDate: '', samplingTime: '',
        analyst: '', volume: '', dilution: '', colonyCount: '', unit: '', result: '',
        sopRef: '', observations: '', status: 'draft',
      });
    }
  }, [editingId, isOpen]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { ...form.values, volume: form.values.volume ? parseFloat(form.values.volume) : undefined, dilution: form.values.dilution ? parseFloat(form.values.dilution) : undefined, colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined };
      if (editingId) await api.updateWaterSample(editingId, payload);
      else await api.createWaterSample(payload);
      onSaved();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('water.editSample') : t('water.newSample')} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
        <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
        <FormField label={t('common.status')} name="status" type="select" value={form.values.status} onChange={form.handleChange}
          options={[{ value: 'draft', label: t('common.statusDraft') }, { value: 'completed', label: t('common.statusComplete') }, { value: 'pending', label: t('common.statusPending') }]} />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
      </div>
    </Modal>
  );
}
