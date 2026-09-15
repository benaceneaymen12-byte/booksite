import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { FormField, useForm } from '../components/FormComponents';
import { ConfirmModal } from '../components/Modal';

export default function ReportForm() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const editingId = id ? parseInt(id) : null;
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const form = useForm(
    { date: new Date().toISOString().split('T')[0], analyst: '', shiftStart: '', shiftEnd: '', shiftLabel: '', observations: '' },
    (v) => {
      const e: any = {};
      if (!v.date) e.date = 'Required';
      if (!v.analyst) e.analyst = 'Required';
      if (!v.shiftStart) e.shiftStart = 'Required';
      if (!v.shiftEnd) e.shiftEnd = 'Required';
      return e;
    }
  );

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
      }).catch(() => navigate('/reports'));
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
  }, [editingId]);

  const setShift = (preset: keyof typeof SHIFT_PRESETS) => {
    const s = SHIFT_PRESETS[preset];
    form.handleChange('shiftStart', s.start);
    form.handleChange('shiftEnd', s.end);
    form.handleChange('shiftLabel', s.label);
  };

  const toggleActivity = (key: string) => {
    if (activities.includes(key)) setActivities(activities.filter((a) => a !== key));
    else setActivities([...activities, key]);
  };

  const handleSave = async () => {
    if (!form.isValid) return;
    setLoading(true);
    try {
      const payload = { ...form.values, activities };
      if (editingId) await api.updateShiftReport(editingId, payload);
      else await api.createShiftReport(payload);
      navigate('/reports');
    } catch {} finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try { await api.deleteShiftReport(editingId); navigate('/reports'); } catch {} finally { setDeleteModal(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingId ? t('reports.editReport') : t('reports.newReport')}
        </h1>
        {editingId && (
          <div className="flex gap-2">
            <a href={`/reports/${editingId}/preview`} className="btn btn-secondary">{t('reports.preview')}</a>
            <button onClick={() => setDeleteModal(true)} className="btn btn-danger">{t('common.delete')}</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('reports.date')} name="date" type="date" value={form.values.date} onChange={form.handleChange} error={form.errors.date} required />
          <FormField label={t('reports.analyst')} name="analyst" type="text" value={form.values.analyst} onChange={form.handleChange} error={form.errors.analyst} required />
        </div>

        <div className="mt-4">
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

        {form.values.shiftStart && (
          <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <span className="text-sm text-gray-500">{t('reports.shiftStart')}:</span>
            <span className="font-mono font-bold">{form.values.shiftStart}</span>
            <span className="text-sm text-gray-500">{t('reports.shiftEnd')}:</span>
            <span className="font-mono font-bold">{form.values.shiftEnd}</span>
          </div>
        )}

        <div className="mt-4">
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

        <div className="mt-4">
          <FormField label={t('common.observations')} name="observations" type="textarea" value={form.values.observations} onChange={form.handleChange} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading || !form.isValid} className="btn-primary">
          {loading ? t('common.loading') : t('common.save')}
        </button>
        <button onClick={() => navigate('/reports')} className="btn-secondary">
          {t('common.cancel')}
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('common.confirm')}
        message="Delete this report?"
        confirmText={t('common.delete')}
        danger
      />
    </div>
  );
}
