import { useEffect, useState } from 'react';
import type { ShiftReport } from '../types';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { Modal, ConfirmModal } from '../components/Modal';
import { FormField, useForm } from '../components/FormComponents';
import { Link } from 'react-router-dom';

const SHIFT_PRESETS = {
  '07:00-15:00': { start: '07:00', end: '15:00', label: '07:00 - 15:00' },
  '08:00-16:00': { start: '08:00', end: '16:00', label: '08:00 - 16:00' },
  '13:00-21:00': { start: '13:00', end: '21:00', label: '13:00 - 21:00' },
  '21:00-05:00': { start: '21:00', end: '05:00', label: '21:00 - 05:00' },
};

const ACTIVITY_OPTIONS = [
  { key: 'personnelControl', label: 'personnelControl' },
  { key: 'specifiedGerms', label: 'specifiedGerms' },
  { key: 'mediaPreparation', label: 'mediaPreparation' },
  { key: 'sterilization', label: 'sterilization' },
  { key: 'rawMaterialTraceability', label: 'rawMaterialTraceability' },
  { key: 'samplingControl', label: 'samplingControl' },
  { key: 'waterControl', label: 'waterControl' },
  { key: 'other', label: 'other' },
];

export default function ReportsList() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ShiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<ShiftReport | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchReports = async () => {
    try {
      const data = await api.getShiftReports();
      setReports(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try { await api.deleteShiftReport(deleteModal.id!); setReports((p) => p.filter((r) => r.id !== deleteModal.id)); } catch {}
    setDeleteModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className="btn-primary">+ {t('reports.newReport')}</button>
      </div>

      {loading ? <div className="text-center py-8">{t('common.loading')}</div> :
       reports.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">{t('reports.noReports')}</p></div> :
       <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {r.date ? new Date(r.date).toLocaleDateString() : '—'} — {r.shiftLabel || r.shiftStart + ' - ' + r.shiftEnd}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('common.analyst')}: {r.analyst || '—'}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.activities.map((a) => (
                    <span key={a} className="badge bg-blue-100 text-blue-800 text-xs">
                      {t(`reports.${a}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/reports/${r.id}/preview`} className="btn btn-secondary btn-sm">{t('reports.preview')}</Link>
                <button onClick={() => { setEditingId(r.id!); setShowForm(true); }} className="btn btn-secondary btn-sm">{t('common.edit')}</button>
                <button onClick={() => setDeleteModal(r)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
              </div>
            </div>
            {r.observations && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic border-t pt-2">{r.observations}</p>
            )}
          </div>
        ))}
      </div>}

      {showForm && <ReportFormModal isOpen={showForm} onClose={() => setShowForm(false)} editingId={editingId} onSaved={() => { setShowForm(false); fetchReports(); }} />}
      <ConfirmModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title={t('common.confirm')} message={t('reports.confirmDelete') || 'Delete this report?'} confirmText={t('common.delete')} danger />
    </div>
  );
}

function ReportFormModal({ isOpen, onClose, editingId, onSaved }: { isOpen: boolean; onClose: () => void; editingId: number | null; onSaved: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm(
    {
      date: new Date().toISOString().split('T')[0],
      analyst: '',
      shiftStart: '',
      shiftEnd: '',
      shiftLabel: '',
      observations: '',
    },
    (v) => { const e: any = {}; if (!v.date) e.date = t('common.required'); if (!v.analyst) e.analyst = t('common.required'); if (!v.shiftStart) e.shiftStart = t('common.required'); if (!v.shiftEnd) e.shiftEnd = t('common.required'); return e; }
  );

  useEffect(() => {
    if (editingId) {
      api.getShiftReport(editingId).then((data) => {
        form.reset({
          date: data.date || '',
          analyst: data.analyst || '',
          shiftStart: data.shiftStart || '',
          shiftEnd: data.shiftEnd || '',
          shiftLabel: data.shiftLabel || '',
          observations: data.observations || '',
        });
        if (data.activities) setActivities(data.activities);
      }).catch(() => {});
    } else {
      form.reset({
        date: new Date().toISOString().split('T')[0],
        analyst: '',
        shiftStart: '',
        shiftEnd: '',
        shiftLabel: '',
        observations: '',
      });
      setActivities([]);
    }
  }, [editingId, isOpen]);

  const setShift = (preset: keyof typeof SHIFT_PRESETS) => {
    const s = SHIFT_PRESETS[preset];
    if (s) {
      form.handleChange('shiftStart', s.start);
      form.handleChange('shiftEnd', s.end);
      form.handleChange('shiftLabel', s.label);
    }
  };

  const toggleActivity = (key: string) => {
    if (activities.includes(key)) {
      setActivities(activities.filter((a) => a !== key));
    } else {
      setActivities([...activities, key]);
    }
  };

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form.values,
        activities,
      };
      if (editingId) await api.updateShiftReport(editingId, payload);
      else await api.createShiftReport(payload);
      onSaved();
    } catch {} finally { setLoading(false); }
  };

  const handlePreview = async () => {
    if (!editingId) return;
    try {
      const url = await api.generateReportPdf(editingId);
      setPreviewUrl(url);
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? t('reports.editReport') : t('reports.newReport')} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('reports.date')} name="date" type="date" value={form.values.date} onChange={form.handleChange} error={form.errors.date} required />
          <FormField label={t('reports.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} error={form.errors.analyst} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('reports.shift')}</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SHIFT_PRESETS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => setShift(key as keyof typeof SHIFT_PRESETS)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  form.values.shiftLabel === s.label
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {form.values.shiftStart && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span className="text-sm text-gray-500">{t('reports.shiftStart')}:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{form.values.shiftStart}</span>
              <span className="text-sm text-gray-500">{t('reports.shiftEnd')}:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{form.values.shiftEnd}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('reports.activities')}</label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleActivity(opt.key)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  activities.includes(opt.key)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t(`reports.${opt.label}`)}
              </button>
            ))}
          </div>
        </div>

        <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
      </div>

      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <button onClick={handlePreview} disabled={!editingId || loading} className="btn btn-secondary">
          {t('reports.preview')}
        </button>
        <button onClick={onClose} className="btn btn-secondary">{t('common.cancel')}</button>
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">
          {loading ? t('common.loading') : t('common.save')}
        </button>
      </div>

      {previewUrl && (
        <iframe src={previewUrl} className="w-full h-[400px] mt-4 border border-gray-200 rounded-lg" />
      )}
    </Modal>
  );
}
