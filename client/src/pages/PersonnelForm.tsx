import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function PersonnelForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const form = useForm(
    { employeeId: '', department: '', site: '', samplingType: '', samplingDate: '', samplingTime: '',
      analyst: '', medium: '', colonyCount: '', microorganism: '', method: '', sopRef: '', unit: '', result: '', observations: '', status: 'draft' },
    (v) => { const e: any = {}; if (!v.employeeId) e.employeeId = 'Required'; if (!v.samplingDate) e.samplingDate = 'Required'; return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getPersonnelRecord(editingId).then((data) => {
        form.reset({ employeeId: data.employeeId || '', department: data.department || '', site: data.site || '',
          samplingType: data.samplingType || '', samplingDate: data.samplingDate || '', samplingTime: data.samplingTime || '',
          analyst: data.analyst || '', medium: data.medium || '', colonyCount: data.colonyCount || '',
          microorganism: data.microorganism || '', method: data.method || '', sopRef: data.sopRef || '',
          unit: data.unit || '', result: data.result || '', observations: data.observations || '', status: data.status || 'draft' });
      }).catch(() => navigate('/personnel'));
    } else {
      form.reset({ employeeId: '', department: '', site: '', samplingType: '', samplingDate: '', samplingTime: '',
        analyst: '', medium: '', colonyCount: '', microorganism: '', method: '', sopRef: '', unit: '', result: '', observations: '', status: 'draft' });
    }
  }, [editingId]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { ...form.values, colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined };
      if (editingId) await api.updatePersonnel(editingId, payload);
      else await api.createPersonnel(payload);
      navigate('/personnel');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try { await api.deletePersonnel(editingId); navigate('/personnel'); } catch {} finally { setDeleteModal(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editingId ? t('personnel.editMonitoring') : t('personnel.newMonitoring')}</h1>
        {editingId && <button onClick={() => setDeleteModal(true)} className="btn btn-danger">{t('common.delete')}</button>}
      </div>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('personnel.employeeId')} name="employeeId" type="text" value={form.values.employeeId} onChange={form.handleChange} error={form.errors.employeeId} required />
          <FormField label={t('personnel.department')} name="department" type="text" value={form.values.department} onChange={form.handleChange} />
          <FormField label={t('common.name')} name="site" type="text" value={form.values.site} onChange={form.handleChange} />
          <FormField label={t('personnel.samplingType')} name="samplingType" type="text" value={form.values.samplingType} onChange={form.handleChange} />
          <FormField label={t('personnel.samplingDate')} name="samplingDate" type="date" value={form.values.samplingDate} onChange={form.handleChange} error={form.errors.samplingDate} required />
          <FormField label={t('common.time')} name="samplingTime" type="time" value={form.values.samplingTime} onChange={form.handleChange} />
          <FormField label={t('personnel.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} />
          <FormField label={t('personnel.medium')} name="medium" type="text" value={form.values.medium} onChange={form.handleChange} />
          <FormField label={t('personnel.colonyCount')} name="colonyCount" type="number" value={form.values.colonyCount} onChange={form.handleChange} />
          <FormField label={t('personnel.microorganism')} name="microorganism" type="text" value={form.values.microorganism} onChange={form.handleChange} />
          <FormField label={t('common.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
          <FormField label={t('common.unit')} name="unit" type="text" value={form.values.unit} onChange={form.handleChange} />
          <FormField label={t('common.result')} name="result" type="text" value={form.values.result} onChange={form.handleChange} />
        </div>
        <div className="mt-4"><FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} /></div>
        <div className="mt-4"><FormField label={t('common.status')} name="status" type="select" value={form.values.status} onChange={form.handleChange}
          options={[{ value: 'draft', label: t('common.statusDraft') }, { value: 'completed', label: t('common.statusComplete') }, { value: 'pending', label: t('common.statusPending') }]} /></div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
        <button onClick={() => navigate('/personnel')} className="btn-secondary">{t('common.cancel')}</button>
      </div>
      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title={t('common.confirm')} message={t('personnel.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}
