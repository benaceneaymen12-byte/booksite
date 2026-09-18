import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { CultureMedia } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';
import { BIOCARE_MEDIA_CATALOGUE, calculateBiocareExpiryDate, generateBiocareLotNumber, getTodayDate } from '../data/biocareMedia';

const getNotificationStatus = (): NotificationPermission | 'unsupported' => {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
};

export default function MediaList() {
  const { t } = useI18n();
  const [media, setMedia] = useState<CultureMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<CultureMedia | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [warningDays, setWarningDays] = useState(() => parseInt(localStorage.getItem('warningDays') || '10'));
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(getNotificationStatus);
  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchMedia = async () => {
    try {
      const [data, settings] = await Promise.all([api.getMedia(), api.getSettings()]);
      const savedWarningDays = parseInt(settings.warningDays || '10');
      setWarningDays(Number.isFinite(savedWarningDays) && savedWarningDays > 0 ? savedWarningDays : 10);
      localStorage.setItem('warningDays', String(savedWarningDays));
      setMedia(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, []);

  const enableNotifications = async () => {
    const permission = getNotificationStatus();
    if (permission === 'unsupported') {
      setNotificationMessage(t('media.notificationsUnsupported'));
      return;
    }
    if (permission === 'granted') {
      setNotificationPermission('granted');
      setNotificationMessage(t('media.notificationsEnabledBody'));
      return;
    }
    if (permission === 'denied') {
      setNotificationPermission('denied');
      setNotificationMessage(t('media.notificationsBlocked'));
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setNotificationMessage(t('media.notificationsSecureOnly'));
      return;
    }

    try {
      const requestedPermission = await Notification.requestPermission();
      setNotificationPermission(requestedPermission);
      if (requestedPermission === 'granted') {
        new Notification(t('media.notificationsEnabledTitle'), { body: t('media.notificationsEnabledBody') });
        setNotificationMessage(t('media.notificationsEnabledBody'));
      } else if (requestedPermission === 'denied') {
        setNotificationMessage(t('media.notificationsBlocked'));
      } else {
        setNotificationMessage(t('media.notificationsBlocked'));
      }
    } catch {
      setNotificationPermission('denied');
      setNotificationMessage(t('media.notificationsBlocked'));
    }
  };

  useEffect(() => {
    if (notificationPermission !== 'granted' || !media.length || typeof Notification === 'undefined') return;
    let notified: Record<string, string> = {};
    try {
      const saved = JSON.parse(localStorage.getItem('mediaExpiryNotifications') || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) notified = saved;
    } catch {
      localStorage.removeItem('mediaExpiryNotifications');
    }
    const today = new Date().toISOString().slice(0, 10);
    media.forEach((item) => {
      if (!item.id || !item.expiryDate) return;
      const diff = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000);
      if (diff > warningDays) return;
      const key = `${item.id}:${item.expiryDate}`;
      if (notified[key] === today) return;
      const status = diff < 0 ? t('media.expired') : t('media.expiringSoon');
      try {
        new Notification(`${item.mediumName} - ${status}`, { body: `${t('media.expiryDate')}: ${item.expiryDate}` });
      } catch {
        return;
      }
      notified[key] = today;
    });
    try {
      localStorage.setItem('mediaExpiryNotifications', JSON.stringify(notified));
    } catch {}
  }, [media, notificationPermission, warningDays, t]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try { await api.deleteMedia(deleteModal.id!); setMedia((p) => p.filter((m) => m.id !== deleteModal.id)); } catch {}
    setDeleteModal(null);
  };

  const printMediaLabel = (item: CultureMedia) => {
    const printWindow = window.open('', '_blank', 'width=520,height=700');
    if (!printWindow) return;

    const escapeHtml = (value: unknown) => String(value ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    const value = (field: unknown) => escapeHtml(field || '—');
    const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}logok.png`;

    printWindow.document.write(`<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${value(item.mediumName)} - ${value(item.volume || '1 L')}</title>
          <style>
            @page { size: 90mm 120mm; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 8mm; font-family: Arial, sans-serif; color: #172033; }
            .label { border: 2px solid #172033; border-radius: 4mm; padding: 5mm; min-height: 104mm; }
            .logo { display: block; width: 34mm; height: auto; margin-bottom: 3mm; }
            h1 { font-size: 18pt; line-height: 1.05; margin: 3mm 0 1mm; overflow-wrap: anywhere; }
            .volume { display: inline-block; margin: 2mm 0 4mm; padding: 1.5mm 3mm; border-radius: 2mm; background: #315cce; color: #fff; font-size: 12pt; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 4mm; }
            .item { border-top: 1px solid #cbd5e1; padding-top: 1.5mm; min-width: 0; }
            .key { color: #64748b; font-size: 7pt; font-weight: 700; text-transform: uppercase; }
            .val { margin-top: 1mm; font-size: 9pt; font-weight: 600; overflow-wrap: anywhere; }
            .footer { border-top: 1px solid #cbd5e1; margin-top: 4mm; padding-top: 2mm; color: #64748b; font-size: 7pt; }
            @media print { body { padding: 0; } .label { border-width: 1.5px; } }
          </style>
        </head>
        <body>
          <section class="label">
            <img class="logo" src="${logoUrl}" alt="Biocare Biotech" />
            <h1>${value(item.mediumName)}</h1>
            <div class="volume">Volume: ${value(item.volume || '1 L')}</div>
            <div class="grid">
              <div class="item"><div class="key">${escapeHtml(t('media.lotNumber'))}</div><div class="val">${value(item.lotNumber)}</div></div>
              <div class="item"><div class="key">${escapeHtml(t('media.manufacturer'))}</div><div class="val">${value(item.manufacturer)}</div></div>
              <div class="item"><div class="key">${escapeHtml(t('media.preparationDate'))}</div><div class="val">${value(item.preparationDate)}</div></div>
              <div class="item"><div class="key">${escapeHtml(t('media.expiryDate'))}</div><div class="val">${value(item.expiryDate)}</div></div>
              <div class="item"><div class="key">${escapeHtml(t('media.preparedBy'))}</div><div class="val">${value(item.preparedBy)}</div></div>
            </div>
            <div class="footer">${escapeHtml(t('media.labelWarning'))}</div>
          </section>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.addEventListener('afterprint', () => printWindow.close());
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
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

  const expiredMedia = media.filter((item) => getStatus(item) === 'expired');
  const expiringMedia = media.filter((item) => getStatus(item) === 'expiring_soon');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('media.title')}</h1>
        <div className="flex flex-wrap gap-2">
          {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && <button onClick={enableNotifications} className="btn btn-secondary">🔔 {t('media.enableNotifications')}</button>}
          <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">+ {t('media.newMedia')}</button>
        </div>
      </div>
      {notificationMessage && <p className="text-sm text-muted" role="status">{notificationMessage}</p>}

      {!loading && (expiredMedia.length > 0 || expiringMedia.length > 0) && (
        <div className="media-expiration-alert" role="alert">
          <div className="media-expiration-icon" aria-hidden="true">⚠️</div>
          <div className="min-w-0">
            <h2 className="font-bold">{t('media.expirationAlertTitle')}</h2>
            <p className="text-sm mt-1">
              {expiredMedia.length > 0 && `${expiredMedia.length} ${t('media.expiredCount')}`}
              {expiredMedia.length > 0 && expiringMedia.length > 0 ? ' · ' : ''}
              {expiringMedia.length > 0 && `${expiringMedia.length} ${t('media.expiringCount')} (${warningDays} ${t('media.days')})`}
            </p>
            <p className="text-xs mt-2 opacity-80 truncate">
              {[...expiredMedia, ...expiringMedia].map((item) => item.mediumName).filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <details className="card biocare-media-catalogue">
        <summary className="font-semibold cursor-pointer">{t('media.biocareCatalogue')}</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {BIOCARE_MEDIA_CATALOGUE.map((reference) => (
            <div key={reference.codePrefix} className="biocare-media-reference">
              <p className="font-semibold text-sm">{reference.designation}</p>
              <p className="text-xs text-muted mt-1">{reference.codePrefix} · {reference.validityDays} {t('media.days')}</p>
            </div>
          ))}
        </div>
      </details>

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
              <p className="text-xs text-muted mb-2">Created by: <span className="font-semibold">{m.createdByUser || m.preparedBy || '—'}</span>{m.updatedByUser && <span> · Last edited by: <span className="font-semibold">{m.updatedByUser}</span></span>}</p>
              {m.isDemo && <span className="badge-demo mb-2 inline-block">{t('common.demoBadge')}</span>}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2">
                <p><span className="font-medium">{t('media.manufacturer')}:</span> {m.manufacturer || '—'}</p>
                <p><span className="font-medium">{t('media.lotNumber')}:</span> {m.lotNumber || '—'}</p>
                <p><span className="font-medium">{t('media.preparationDate')}:</span> {m.preparationDate || '—'}</p>
                <p><span className="font-medium">{t('media.expiryDate')}:</span> {m.expiryDate || '—'}</p>
                <p className="border-t pt-1 mt-1"><span className="font-medium">{t('media.quantityRemaining')}:</span> {(m.quantityRemaining !== undefined ? m.quantityRemaining : (m.quantityPrepared || 0) - (m.quantityUsed || 0))} {m.unit || ''}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => printMediaLabel(m)} className="btn btn-secondary btn-sm flex-1">
                  <span aria-hidden="true">🖨️</span> {t('common.print')}
                </button>
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
      mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '', volume: '',
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
          sterilizationMethod: data.sterilizationMethod || '', quantityPrepared: data.quantityPrepared || '', volume: data.volume || '',
          quantityUsed: data.quantityUsed || '', expiryDate: data.expiryDate || '',
          storageConditions: data.storageConditions || '', preparedBy: data.preparedBy || '',
          observations: data.observations || '', unit: data.unit || 'g',
        });
      }).catch(() => {});
    } else {
      form.reset({
        mediumName: '', manufacturer: '', lotNumber: '', preparationDate: '', sterilizationDate: '', volume: '',
        sterilizationMethod: '', quantityPrepared: '', quantityUsed: '', expiryDate: '',
        storageConditions: '', preparedBy: '', observations: '', unit: 'g',
      });
    }
  }, [editingId, isOpen]);

  const quantityRemaining = (parseFloat(form.values.quantityPrepared) || 0) - (parseFloat(form.values.quantityUsed) || 0);

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
          <FormField label={t('media.mediumName')} name="mediumName" type="text" value={form.values.mediumName} onChange={handleMediaChange} error={form.errors.mediumName} required list="biocare-media-catalogue" />
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
