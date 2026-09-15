import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { Microorganism } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';

export default function MicroList() {
  const { t } = useI18n();
  const [microbes, setMicrobes] = useState<Microorganism[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<Microorganism | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchMicrobes = async () => {
    try {
      const data = await api.getMicroorganisms();
      setMicrobes(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMicrobes(); }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try { await api.deleteMicroorganism(deleteModal.id!); setMicrobes((p) => p.filter((m) => m.id !== deleteModal.id)); } catch {}
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('microorganisms.title')}</h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">+ {t('microorganisms.newTest')}</button>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       microbes.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">{t('microorganisms.noMicroorganisms')}</p></div> :
       <div className="space-y-2">
        {microbes.map((m) => (
          <div key={m.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                {m.isDemo && <span className="badge-demo">{t('microorganisms.demoData')}</span>}
              </div>
              {m.alternativeName && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('microorganisms.alternativeName')}: {m.alternativeName}</p>}
              {m.sopRef && <p className="text-xs text-gray-400 mt-1">{t('common.sopRef')}: {m.sopRef}</p>}
              {m.notes && <p className="text-xs text-gray-400 mt-1 italic">{m.notes}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => { setEditingId(m.id!); setShowForm(true); }} className="btn btn-secondary btn-sm">{t('common.edit')}</button>
              <button onClick={() => setDeleteModal(m)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>}

      {showForm && <MicroFormModal isOpen={showForm} onClose={() => setShowForm(false)} editingId={editingId} onSaved={() => { setShowForm(false); fetchMicrobes(); }} />}
      <ConfirmModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('microorganisms.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}

function MicroFormModal({ isOpen, onClose, editingId, onSaved }: { isOpen: boolean; onClose: () => void; editingId: number | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const form = useForm(
    { name: '', alternativeName: '', sopRef: '', notes: '' },
    (v) => { const e: any = {}; if (!v.name) e.name = t('common.required'); return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getMicroorganisms().then((data) => {
        const found = data.find((m: any) => m.id === editingId);
        if (found) form.reset({ name: found.name || '', alternativeName: found.alternativeName || '', sopRef: found.sopRef || '', notes: found.notes || '' });
      }).catch(() => {});
    } else {
      form.reset({ name: '', alternativeName: '', sopRef: '', notes: '' });
    }
  }, [editingId, isOpen]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { name: form.values.name, alternativeName: form.values.alternativeName, sopRef: form.values.sopRef, notes: form.values.notes, isDemo: editingId ? undefined : true };
      if (editingId) await api.updateMicroorganism(editingId, payload);
      else await api.createMicroorganism(payload);
      onSaved();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('microorganisms.editTest') : t('microorganisms.newTest')}>
      <div className="space-y-4">
        <FormField label={t('microorganisms.name')} name="name" type="text" value={form.values.name} onChange={form.handleChange} error={form.errors.name} required />
        <FormField label={t('microorganisms.alternativeName')} name="alternativeName" type="text" value={form.values.alternativeName} onChange={form.handleChange} />
        <FormField label={t('microorganisms.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
        <FormField label={t('common.notes')} name="notes" type="textarea" value={form.values.notes} onChange={form.handleChange} />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
      </div>
    </Modal>
  );
}
