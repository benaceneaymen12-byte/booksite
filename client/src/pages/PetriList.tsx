import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { CultureMedia, PrePouredPetri } from '../types';

export default function PetriList() {
  const { t } = useI18n();
  const [media, setMedia] = useState<CultureMedia[]>([]);
  const [petri, setPetri] = useState<PrePouredPetri[]>([]);
  const [mediaId, setMediaId] = useState('');
  const [quantityPrepared, setQuantityPrepared] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [mediaData, petriData] = await Promise.all([api.getMedia(), api.getPetri()]);
      setMedia(mediaData || []);
      setPetri(petriData || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedMedia = media.find((item) => String(item.id) === mediaId);
  const quantity = Number(quantityPrepared) || 0;

  const handleSave = async () => {
    if (!selectedMedia || quantity <= 0) return;
    setSaving(true);
    try {
      const created = await api.createPetri({ mediaId: selectedMedia.id, quantityPrepared: quantity, preparedBy, observations });
      setPetri((current) => [created, ...current]);
      setMedia(await api.getMedia() || []);
      setMediaId('');
      setQuantityPrepared('');
      setPreparedBy('');
      setObservations('');
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try { await api.deletePetri(id); setPetri((current) => current.filter((item) => item.id !== id)); } catch {}
  };

  const printLabel = (item: PrePouredPetri) => {
    const printWindow = window.open('', '_blank', 'width=520,height=520');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${item.mediumName}</title><style>body{font-family:Arial;padding:24px;color:#172033}.label{border:2px solid #172033;border-radius:12px;padding:20px;max-width:360px}h1{font-size:22px;margin:0 0 16px}.row{border-top:1px solid #cbd5e1;padding:8px 0;font-size:14px}.key{color:#64748b;font-size:11px;font-weight:bold;text-transform:uppercase}.value{font-weight:bold;margin-top:3px}</style></head><body><section class="label"><h1>${item.mediumName}</h1><div class="row"><div class="key">Lot</div><div class="value">${item.lotNumber || '—'}</div></div><div class="row"><div class="key">Preparation</div><div class="value">${item.preparationDate || '—'}</div></div><div class="row"><div class="key">Expiration</div><div class="value">${item.expiryDate || '—'}</div></div><div class="row"><div class="key">Quantity</div><div class="value">${item.quantityPrepared || 0}</div></div></section></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 200);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('petri.title')}</h1>
        <p className="text-sm text-muted mt-1">{t('petri.subtitle')}</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('petri.newBatch')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">{t('petri.sourceMedia')}</label>
            <select className="input" value={mediaId} onChange={(event) => setMediaId(event.target.value)}>
              <option value="">{t('common.select')}</option>
              {media.map((item) => <option key={item.id} value={item.id}>{item.mediumName} · {item.lotNumber || '—'} · {item.expiryDate || '—'}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t('petri.quantity')}</label>
            <input className="input" type="number" min="1" value={quantityPrepared} onChange={(event) => setQuantityPrepared(event.target.value)} />
          </div>
          <div>
            <label className="field-label">{t('petri.preparedBy')}</label>
            <input className="input" value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} />
          </div>
          <div>
            <label className="field-label">{t('petri.observations')}</label>
            <input className="input" value={observations} onChange={(event) => setObservations(event.target.value)} />
          </div>
        </div>
        {selectedMedia && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary-light/40 p-3 dark:border-primary/40 dark:bg-primary/10">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('petri.inheritedDetails')}</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <span><b>{t('media.mediumName')}:</b> {selectedMedia.mediumName}</span>
              <span><b>{t('media.lotNumber')}:</b> {selectedMedia.lotNumber || '—'}</span>
              <span><b>{t('media.expiryDate')}:</b> {selectedMedia.expiryDate || '—'}</span>
              <span><b>{t('media.quantityRemaining')}:</b> {selectedMedia.quantityRemaining ?? 0}</span>
            </div>
          </div>
        )}
        <button className="btn-primary mt-4" onClick={handleSave} disabled={saving || !selectedMedia || quantity <= 0}>
          {saving ? t('common.loading') : t('petri.save')}
        </button>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> : petri.length === 0 ? (
        <div className="card text-center py-8 text-muted">{t('petri.empty')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {petri.map((item) => (
            <div className="card" key={item.id}>
              <h2 className="font-semibold text-gray-900 dark:text-white">{item.mediumName}</h2>
              <div className="text-sm text-muted space-y-1 mt-3">
                <p><b>{t('media.lotNumber')}:</b> {item.lotNumber || '—'}</p>
                <p><b>{t('media.preparationDate')}:</b> {item.preparationDate || '—'}</p>
                <p><b>{t('media.expiryDate')}:</b> {item.expiryDate || '—'}</p>
                <p><b>{t('petri.quantityRemaining')}:</b> {item.quantityRemaining ?? 0}</p>
                <p><b>{t('petri.preparedBy')}:</b> {item.preparedBy || '—'}</p>
              </div>
              <div className="flex gap-2 mt-4"><button className="btn btn-secondary btn-sm" onClick={() => printLabel(item)}>🖨️ {t('common.print')}</button><button className="btn btn-danger btn-sm" onClick={() => item.id && handleDelete(item.id)}>{t('common.delete')}</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}