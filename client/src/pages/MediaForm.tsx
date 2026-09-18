import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';
import { BIOCARE_MEDIA_CATALOGUE, calculateBiocareExpiryDate, generateBiocareLotNumber, getTodayDate } from '../data/biocareMedia';

export default function MediaForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const form = useForm(
    {
      mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '', volume: '',
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
          sterilizationMethod: data.sterilizationMethod || '', quantityPrepared: data.quantityPrepared || '', volume: data.volume || '',
          quantityUsed: data.quantityUsed || '', expiryDate: data.expiryDate || '',
          storageConditions: data.storageConditions || '', preparedBy: data.preparedBy || '',
          observations: data.observations || '', unit: data.unit || 'g',
        });
      }).catch(() => navigate('/media'));
    } else {
      form.reset({
        mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '', volume: '',
        sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
        storageConditions: '', preparedBy: '', observations: '', unit: 'g',
      });
    }
  }, [editingId]);

  const qtyRemaining = (parseFloat(form.values.quantityPrepared) || 0) - (parseFloat(form.values.quantityUsed) || 0);

  const handleMediaChange = (name: string, value: any) => {
    form.handleChange(name, value);
    if (name === 'mediumName' || name === 'preparationDate') {
      const mediumName = name === 'mediumName' ? value : form.values.mediumName;
      const preparationDate = name === 'preparationDate' ? value : (form.values.preparationDate || getTodayDate());
      if (name === 'mediumName' && !form.values.preparationDate) form.handleChange('preparationDate', preparationDate);
      if (name === 'mediumName') {
        const lotNumber = generateBiocareLotNumber(mediumName, preparationDate);
        form.handleChange('lotNumber', lotNumber);
      }
      const expiryDate = calculateBiocareExpiryDate(mediumName, preparationDate);
      if (expiryDate) form.handleChange('expiryDate', expiryDate);
    }
  };

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
          <FormField label={t('media.mediumName')} name="mediumName" type="text" value={form.values.mediumName} onChange={handleMediaChange} error={form.errors.mediumName} required placeholder="Biocare reference medium" list="biocare-media-catalogue" />
          <datalist id="biocare-media-catalogue">
            {BIOCARE_MEDIA_CATALOGUE.map((reference) => (
              <option key={reference.codePrefix} value={reference.designation}>{reference.codePrefix} · {reference.validityDays} {t('media.days')}</option>
            ))}
          </datalist>
          <div className="sm:col-span-2 rounded-lg border border-primary/30 bg-primary-light/40 p-3 dark:border-primary/40 dark:bg-primary/10">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('media.batchDetails')}</p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div><p className="text-xs text-muted">{t('media.lotNumber')}</p><p className="font-medium text-gray-900 dark:text-white">{form.values.lotNumber || '—'}</p></div>
              <div><p className="text-xs text-muted">{t('media.preparationDate')}</p><p className="font-medium text-gray-900 dark:text-white">{form.values.preparationDate || '—'}</p></div>
              <div><p className="text-xs text-muted">{t('media.expiryDate')}</p><p className="font-medium text-gray-900 dark:text-white">{form.values.expiryDate || '—'}</p></div>
              <div><p className="text-xs text-muted">{t('media.validity')}</p><p className="font-medium text-gray-900 dark:text-white">{form.values.expiryDate && form.values.preparationDate ? t('media.calculated') : '—'}</p></div>
            </div>
          </div>
          <FormField label={t('media.manufacturer')} name="manufacturer" type="text" value={form.values.manufacturer} onChange={form.handleChange} />
          <FormField label={t('media.lotNumber')} name="lotNumber" type="text" value={form.values.lotNumber} onChange={form.handleChange} />
          <FormField label={t('media.preparationDate')} name="preparationDate" type="date" value={form.values.preparationDate} onChange={handleMediaChange} />
          <FormField label={t('media.quantityPrepared')} name="quantityPrepared" type="text" value={form.values.quantityPrepared} onChange={form.handleChange} />
          <FormField label={t('media.quantityUsed')} name="quantityUsed" type="text" value={form.values.quantityUsed} onChange={form.handleChange} />
          <FormField label={t('media.volume')} name="volume" type="text" value={form.values.volume} onChange={form.handleChange} placeholder="e.g. 1 L" />
          <FormField label={t('common.unit')} name="unit" type="text" value={form.values.unit} onChange={form.handleChange} />
          <FormField label={t('media.expiryDate')} name="expiryDate" type="date" value={form.values.expiryDate} onChange={form.handleChange} />
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
