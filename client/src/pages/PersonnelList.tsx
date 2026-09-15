import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import type { PersonnelMonitoring } from '../types';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';

export default function PersonnelList() {
  const { t } = useI18n();
  const [records, setRecords] = useState<PersonnelMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<PersonnelMonitoring | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchRecords = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;
      const data = await api.getPersonnel(params);
      setRecords(data || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [statusFilter, searchQuery]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.deletePersonnel(deleteModal.id!);
      setRecords((prev) => prev.filter((r) => r.id !== deleteModal.id));
    } catch {}
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('personnel.title')}</h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">
          + {t('personnel.newMonitoring')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input type="text" placeholder={t('searchPage.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-32">
          <option value="">{t('common.all')} {t('common.status')}</option>
          <option value="draft">{t('common.statusDraft')}</option>
          <option value="completed">{t('common.statusComplete')}</option>
          <option value="pending">{t('common.statusPending')}</option>
        </select>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       records.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">{t('personnel.noRecords')}</p></div> :
       <div className="space-y-2">
        {records.map((r) => (
          <div key={r.id} className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-white">{r.employeeId}</span>
                {r.isDemo && <span className="badge-demo">{t('common.demoBadge')}</span>}
                <span className={`badge ${r.status === 'completed' ? 'badge-completed' : r.status === 'pending' ? 'badge-pending' : 'badge-draft'}`}>
                  {t(`common.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {r.department || '—'} — {r.samplingType || '—'}
              </p>
              {r.colonyCount !== undefined && (
                <p className="text-xs text-gray-400 mt-1">{r.colonyCount} colonies — {r.result || ''}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              <button onClick={() => { setEditingId(r.id!); setShowForm(true); }} className="btn btn-secondary btn-sm">{t('common.edit')}</button>
              <button onClick={() => setDeleteModal(r)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>}

      {showForm && <PersonnelFormModal isOpen={showForm} onClose={() => setShowForm(false)} editingId={editingId} onSaved={() => { setShowForm(false); fetchRecords(); }} />}

      <ConfirmModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('personnel.confirmDelete')} confirmText={t('common.delete')} danger />
    </div>
  );
}

function PersonnelFormModal({ isOpen, onClose, editingId, onSaved }: { isOpen: boolean; onClose: () => void; editingId: number | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const form = useForm(
    {
      employeeId: '', department: '', site: '', samplingType: '', samplingDate: '', samplingTime: '',
      analyst: '', medium: '', colonyCount: '', microorganism: '', method: '', sopRef: '',
      unit: '', result: '', observations: '', status: 'draft',
    },
    (v) => { const e: any = {}; if (!v.employeeId) e.employeeId = t('common.required'); if (!v.samplingDate) e.samplingDate = t('common.required'); return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getPersonnelRecord(editingId).then((data) => {
        form.reset({
          employeeId: data.employeeId || '', department: data.department || '', site: data.site || '',
          samplingType: data.samplingType || '', samplingDate: data.samplingDate || '', samplingTime: data.samplingTime || '',
          analyst: data.analyst || '', medium: data.medium || '', colonyCount: data.colonyCount || '',
          microorganism: data.microorganism || '', method: data.method || '', sopRef: data.sopRef || '',
          unit: data.unit || '', result: data.result || '', observations: data.observations || '', status: data.status || 'draft',
        });
      }).catch(() => {});
    } else {
      form.reset({
        employeeId: '', department: '', site: '', samplingType: '', samplingDate: '', samplingTime: '',
        analyst: '', medium: '', colonyCount: '', microorganism: '', method: '', sopRef: '',
        unit: '', result: '', observations: '', status: 'draft',
      });
    }
  }, [editingId, isOpen]);

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { ...form.values, colonyCount: form.values.colonyCount ? parseInt(form.values.colonyCount) : undefined };
      if (editingId) await api.updatePersonnel(editingId, payload);
      else await api.createPersonnel(payload);
      onSaved();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('personnel.editMonitoring') : t('personnel.newMonitoring')} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
          <FormField label={t('analyses.sopRef')} name="sopRef" type="text" value={form.values.sopRef} onChange={form.handleChange} />
          <FormField label={t('common.unit')} name="unit" type="text" value={form.values.unit} onChange={form.handleChange} />
          <FormField label={t('common.result')} name="result" type="text" value={form.values.result} onChange={form.handleChange} />
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
