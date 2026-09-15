import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { CultureMedia } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';

export default function MediaList() {
  const { t } = useI18n();
  const [media, setMedia] = useState<CultureMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<CultureMedia | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const warningDays = parseInt(localStorage.getItem('warningDays') || '30');

  const fetchMedia = async () => {
    try {
      const data = await api.getMedia();
      setMedia(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try { await api.deleteMedia(deleteModal.id!); setMedia((p) => p.filter((m) => m.id !== deleteModal.id)); } catch {}
    setDeleteModal(null);
  };

  const getStatus = (item: CultureMedia) => {
    if (!item.expiryDate) return null;
    const exp = new Date(item.expiryDate);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'expired';
    if (diff <= warningDays) return 'expiring_soon';
    return 'valid';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('media.title')}</h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">+ {t('media.newMedia')}</button>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       media.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">{t('media.noMedia')}</p></div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((m) => {
          const status = getStatus(m);
          return (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{m.mediumName}</h3>
                {status && (
                  <span className={`badge ${status === 'valid' ? 'badge-valid' : status === 'expiring_soon' ? 'badge-warning' : 'badge-expired'}`}>
                    {t(`media.${status === 'valid' ? 'valid' : status === 'expiring_soon' ? 'expiringSoon' : 'expired'}`)}
                  </span>
                )}
              </div>
              {m.isDemo && <span className="badge-demo mb-2 inline-block">{t('common.demoBadge')}</span>}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2">
                <p><span className="font-medium">{t('media.manufacturer')}:</span> {m.manufacturer || '—'}</p>
                <p><span className="font-medium">{t('media.lotNumber')}:</span> {m.lotNumber || '—'}</p>
                <p><span className="font-medium">{t('media.preparationDate')}:</span> {m.preparationDate || '—'}</p>
                <p><span className="font-medium">{t('media.expiryDate')}:</span> {m.expiryDate || '—'}</p>
                <p className="border-t pt-1 mt-1"><span className="font-medium">{t('media.quantityRemaining')}:</span> {(m.quantityRemaining !== undefined ? m.quantityRemaining : (m.quantityPrepared || 0) - (m.quantityUsed || 0))} {m.unit || ''}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => { setEditingId(m.id!); setShowForm(true); }} className="btn btn-secondary btn-sm flex-1">{t('common.edit')}</button>
                <button onClick={() => setDeleteModal(m)} className="btn btn-danger btn-sm flex-1">{t('common.delete')}</button>
              </div>
            </div>
          );
        })}
      </div>}

      {showForm && <MediaFormModal isOpen={showForm} onClose={() => setShowForm(false)} editingId={editingId} onSaved={() => { setShowForm(false); fetchMedia(); }} />}
      <ConfirmModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('media.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}

function MediaFormModal({ isOpen, onClose, editingId, onSaved }: { isOpen: boolean; onClose: () => void; editingId: number | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const form = useForm(
    {
      mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '',
      sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
      storageConditions: '', preparedBy: '', observations: '', unit: 'g',
    },
    (v) => { const e: any = {}; if (!v.mediumName) e.mediumName = t('common.required'); return e; }
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
      }).catch(() => {});
    } else {
      form.reset({
        mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '',
        sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
        storageConditions: '', preparedBy: '', observations: '', unit: 'g',
      });
    }
  }, [editingId, isOpen]);

  const quantityRemaining = (parseFloat(form.values.quantityPrepared) || 0) - (parseFloat(form.values.quantityUsed) || 0);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form.values,
        quantityPrepared: form.values.quantityPrepared ? parseFloat(form.values.quantityPrepared) : undefined,
        quantityUsed: form.values.quantityUsed ? parseFloat(form.values.quantityUsed) : undefined,
        quantityRemaining: quantityRemaining || undefined,
      };
      if (editingId) await api.updateMedia(editingId, payload);
      else await api.createMedia(payload);
      onSaved();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('media.editMedia') : t('media.newMedia')} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('media.quantityRemaining')}: <span className="font-bold">{quantityRemaining} {form.values.unit}</span></p>
        </div>
        <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
      </div>
    </Modal>
  );
}
