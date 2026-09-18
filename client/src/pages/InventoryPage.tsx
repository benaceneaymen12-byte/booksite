import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { MediaInventoryItem } from '../types';

const emptyItem: MediaInventoryItem = { mediumName: '', lotNumber: '', supplier: '', receivedDate: '', openingDate: '', expiryDate: '', storageLocation: '', quantity: undefined, unit: 'units', observations: '' };

function parseCsv(text: string): MediaInventoryItem[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const read = (values: string[], names: string[]) => values[headers.findIndex((header) => names.includes(header))] || '';
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
    return {
      mediumName: read(values, ['mediumname', 'medium', 'designation', 'nom du milieu']),
      lotNumber: read(values, ['lotnumber', 'lot', 'code']),
      supplier: read(values, ['supplier', 'fournisseur']),
      receivedDate: read(values, ['receiveddate', 'reception', 'date de reception']),
      openingDate: read(values, ['openingdate', 'ouverture', 'date ouverture']),
      expiryDate: read(values, ['expirydate', 'expiry', 'peremption', 'péremption']),
      storageLocation: read(values, ['storagelocation', 'location', 'emplacement']),
      quantity: Number(read(values, ['quantity', 'quantite', 'quantité'])) || undefined,
      unit: read(values, ['unit', 'unite', 'unité']) || 'units',
      observations: read(values, ['observations', 'notes']),
    };
  }).filter((item) => item.mediumName);
}

export default function InventoryPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<MediaInventoryItem[]>([]);
  const [form, setForm] = useState<MediaInventoryItem>(emptyItem);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try { setItems(await api.getInventory() || []); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const visibleItems = useMemo(() => items.filter((item) => !query || `${item.mediumName} ${item.lotNumber} ${item.supplier} ${item.storageLocation}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  const save = async () => {
    if (!form.mediumName) return;
    try {
      const created = await api.createInventory(form);
      setItems((current) => [created, ...current]);
      setForm(emptyItem);
    } catch {}
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) return;
    try { await api.importInventory(rows); await load(); } catch {}
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async (id: number) => {
    try { await api.deleteInventory(id); setItems((current) => current.filter((item) => item.id !== id)); } catch {}
  };

  const status = (expiry?: string) => {
    if (!expiry) return '';
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return days < 0 ? t('inventory.expired') : days <= 30 ? t('inventory.expiringSoon') : t('inventory.valid');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1><p className="text-sm text-muted mt-1">{t('inventory.subtitle')}</p></div>
        <div className="flex gap-2"><button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>{t('inventory.import')}</button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => importFile(event.target.files?.[0])} /></div>
      </div>
      <div className="card"><h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('inventory.add')}</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([['mediumName', 'text'], ['lotNumber', 'text'], ['supplier', 'text'], ['receivedDate', 'date'], ['openingDate', 'date'], ['expiryDate', 'date'], ['storageLocation', 'text'], ['quantity', 'number'], ['unit', 'text']] as const).map(([key, type]) => <div key={key}><label className="field-label">{t(`inventory.${key}`)}</label><input className="input" type={type} value={(form as any)[key] || ''} onChange={(event) => setForm({ ...form, [key]: type === 'number' ? Number(event.target.value) || undefined : event.target.value })} /></div>)}
      </div><button className="btn-primary mt-4" onClick={save} disabled={!form.mediumName}>{t('inventory.save')}</button></div>
      <div className="card"><input className="input" placeholder={t('inventory.search')} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      {loading ? <div className="text-center py-8">{t('common.loading')}</div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{visibleItems.map((item) => <div className="card" key={item.id}><div className="flex justify-between gap-2"><h2 className="font-semibold text-gray-900 dark:text-white">{item.mediumName}</h2><span className="badge">{status(item.expiryDate)}</span></div><div className="text-sm text-muted space-y-1 mt-3"><p><b>{t('inventory.lotNumber')}:</b> {item.lotNumber || '—'}</p><p><b>{t('inventory.supplier')}:</b> {item.supplier || '—'}</p><p><b>{t('inventory.expiryDate')}:</b> {item.expiryDate || '—'}</p><p><b>{t('inventory.storageLocation')}:</b> {item.storageLocation || '—'}</p><p><b>{t('inventory.quantity')}:</b> {item.quantity ?? '—'} {item.unit || ''}</p></div><button className="btn btn-danger btn-sm mt-4" onClick={() => item.id && remove(item.id)}>{t('common.delete')}</button></div>)}</div>}
    </div>
  );
}
