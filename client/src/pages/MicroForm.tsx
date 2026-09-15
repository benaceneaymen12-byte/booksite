import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function MicroForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [microbes, setMicrobes] = useState<any[]>([]);
  const form = useForm(
    { name: '', alternativeName: '', sopRef: '', notes: '' },
    (v) => { const e: any = {}; if (!v.name) e.name = 'Required'; return e; }
  );

  useEffect(() => {
    api.getMicroorganisms().then(setMicrobes).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingId) {
      const found = microbes.find((m) => m.id === editingId);
      if (found) form.reset({ name: found.name || '', alternativeName: found.alternativeName || '', sopRef: found.sopRef || '', notes: found.notes || '' });
    } else {
      form.reset({ name: '', alternativeName: '', sopRef: '', notes: '' });
    }
  }, [editingId, microbes]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { name: form.values.name, alternativeName: form.values.alternativeName, sopRef: form.values.sopRef, notes: form.values.notes, isDemo: editingId ? undefined : true };
      if (editingId) await api.updateMicroorganism(editingId, payload);
      else await api.createMicroorganism(payload);
      navigate('/microorganisms');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try { await api.deleteMicroorganism(editingId); navigate('/microorganisms'); } catch {} finally { setDeleteModal(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editingId ? t('microorganisms.editTest') : t('microorganisms.newTest')}</h1>
        {editingId && <button onClick={() => setDeleteModal(true)} className="btn btn-danger">{t('common.delete')}</button>}
      </div>
      <div className="card">
        <FormField label={t('microorganisms.name')} name="name" type="text" value={form.values.name} onChange={form.handleChange} error={form.errors.name} required />
        <FormField label={t('microorganisms.alternativeName')} name="alternativeName" type="text" value={form.values.alternativeName} onChange={form.handleChange} />
        <FormField label={t('microorganisms.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
        <FormField label={t('common.notes')} name="notes" type="textarea" value={form.values.notes} onChange={form.handleChange} />
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
        <button onClick={() => navigate('/microorganisms')} className="btn-secondary">{t('common.cancel')}</button>
      </div>
      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title={t('common.confirm')} message={t('microorganisms.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}
