import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function MediaForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const form = useForm(
    {
      mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '',
      sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
      storageConditions: '', preparedBy: '', observations: '', unit: 'g',
    },
    (v) => { const e: any = {}; if (!v.mediumName) e.mediumName = 'Required'; return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getMediaItem(editingId).then((data) => {
        form.reset({
          mediumName: data.mediumName || '', manufacturer: data.manufacturer || '', lotNumber: data.lotNumber || '',
          preparationDate: data.preparationDate || '', sterilizationDate: data.sterilizationDate || '',
          sterilizationMethod: data.sterilizationMethod || '', quantityPrepared: data.quantityPrepared || '',
          quantityUsed: data.quantityUsed || '', expiryDate: data.expiryDate || '',
          storageConditions: data.storageConditions || '', preparedBy: data.preparedBy || '',
          observations: data.observations || '', unit: data.unit || 'g',
        });
      }).catch(() => navigate('/media'));
    } else {
      form.reset({
        mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '',
        sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
        storageConditions: '', preparedBy: '', observations: '', unit: 'g',
      });
    }
  }, [editingId]);

  const qtyRemaining = (parseFloat(form.values.quantityPrepared) || 0) - (parseFloat(form.values.quantityUsed) || 0);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form.values,
        quantityPrepared: form.values.quantityPrepared ? parseFloat(form.values.quantityPrepared) : undefined,
        quantityUsed: form.values.quantityUsed ? parseFloat(form.values.quantityUsed) : undefined,
        quantityRemaining: qtyRemaining || undefined,
      };
      if (editingId) await api.updateMedia(editingId, payload);
      else await api.createMedia(payload);
      navigate('/media');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.deleteMedia(editingId);
      navigate('/media');
    } catch {} finally {
      setDeleteModal(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingId ? t('media.editMedia') : t('media.newMedia')}
        </h1>
        {editingId && (
          <button onClick={() => setDeleteModal(true)} className="btn btn-danger">
            {t('common.delete')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('media.mediumName')} name="mediumName" type="text" value={form.values.mediumName} onChange={form.handleChange} error={form.errors.mediumName} required />
          <FormField label={t('media.manufacturer')} name="manufacturer" type="text" value={form.values.manufacturer} onChange={form.handleChange} />
          <FormField label={t('media.lotNumber')} name="lotNumber" type="text" value={form.values.lotNumber} onChange={form.handleChange} />
          <FormField label={t('media.preparationDate')} name="preparationDate" type="date" value={form.values.preparationDate} onChange={form.handleChange} />
          <FormField label={t('media.sterilizationDate')} name="sterilizationDate" type="date" value={form.values.sterilizationDate} onChange={form.handleChange} />
          <FormField label={t('media.sterilizationMethod')} name="sterilizationMethod" type="text" value={form.values.sterilizationMethod} onChange={form.handleChange} />
          <FormField label={t('media.quantityPrepared')} name="quantityPrepared" type="text" value={form.values.quantityPrepared} onChange={form.handleChange} />
          <FormField label={t('media.quantityUsed')} name="quantityUsed" type="text" value={form.values.quantityUsed} onChange={form.handleChange} />
          <FormField label={t('common.unit')} name="unit" type="text" value={form.values.unit} onChange={form.handleChange} />
          <FormField label={t('media.expiryDate')} name="expiryDate" type="date" value={form.values.expiryDate} onChange={form.handleChange} />
          <FormField label={t('media.storageConditions')} name="storageConditions" type="text" value={form.values.storageConditions} onChange={form.handleChange} />
          <FormField label={t('media.preparedBy')} name="preparedBy" type="text" value={form.values.preparedBy} onChange={form.handleChange} />
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t('media.quantityRemaining')}: <strong>{qtyRemaining} {form.values.unit}</strong>
          </p>
        </div>
        <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">
          {loading ? t('common.loading') : t('common.save')}
        </button>
        <button onClick={() => navigate('/media')} className="btn-secondary">
          {t('common.cancel')}
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('common.confirm')}
        message={t('media.confirmDelete')}
        confirmText={t('common.delete')}
        danger
      />
    </div>
  );
}
