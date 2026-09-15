import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';

export default function SettingsPage() {
  const { t, changeLanguage } = useI18n();
  const [labName, setLabName] = useState('');
  const [analystName, setAnalystName] = useState('');
  const [defaultShift, setDefaultShift] = useState('');
  const [warningDays, setWarningDays] = useState('30');
  const [specs, setSpecs] = useState<any[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getSpecifications(), api.getSopReferences()])
      .then(([settings, s, sopsData]) => {
        setLabName(settings.labName || '');
        setAnalystName(settings.analystName || '');
        setDefaultShift(settings.defaultShift || '');
        setWarningDays(settings.warningDays || '30');
        setSpecs(s || []);
        setSops(sopsData || []);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSetting('labName', labName);
      await api.updateSetting('analystName', analystName);
      await api.updateSetting('defaultShift', defaultShift);
      await api.updateSetting('warningDays', warningDays);
      localStorage.setItem('labName', labName);
      localStorage.setItem('analystName', analystName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const addSpec = async () => {
    const name = prompt(t('settings.specName'));
    if (!name) return;
    const limit = prompt(t('settings.specLimit'));
    const unit = prompt(t('settings.specUnit'));
    try {
      await api.createSpecification({ name, limit: limit || '', unit: unit || '' });
      const data = await api.getSpecifications();
      setSpecs(data || []);
    } catch {}
  };

  const updateSpec = async (id: number) => {
    const name = prompt(t('settings.specName'), specs.find((s) => s.id === id)?.name);
    if (!name) return;
    const limit = prompt(t('settings.specLimit'), specs.find((s) => s.id === id)?.limit);
    const unit = prompt(t('settings.specUnit'), specs.find((s) => s.id === id)?.unit);
    try {
      await api.updateSpecification(id, { name, limit: limit || '', unit: unit || '' });
      const data = await api.getSpecifications();
      setSpecs(data || []);
    } catch {}
  };

  const deleteSpec = async (id: number) => {
    try {
      await api.deleteSpecification(id);
      setSpecs((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const addSop = async () => {
    const name = prompt(t('settings.sopName'));
    if (!name) return;
    const ref = prompt(t('settings.sopRefCode'));
    try {
      await api.createSopReference({ name, refCode: ref || '' });
      const data = await api.getSopReferences();
      setSops(data || []);
    } catch {}
  };

  const deleteSop = async (id: number) => {
    try {
      await api.deleteSopReference(id);
      setSops((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.general')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.labName')}</label>
                <input type="text" value={labName} onChange={(e) => setLabName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.analystName')}</label>
                <input type="text" value={analystName} onChange={(e) => setAnalystName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.defaultShift')}</label>
              <select value={defaultShift} onChange={(e) => setDefaultShift(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">--</option>
                <option value="07:00-15:00">07:00 - 15:00</option>
                <option value="08:00-16:00">08:00 - 16:00</option>
                <option value="13:00-21:00">13:00 - 21:00</option>
                <option value="21:00-05:00">21:00 - 05:00</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.expirationWarningDays')}</label>
              <input type="number" value={warningDays} onChange={(e) => setWarningDays(e.target.value)} min="1" className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <button onClick={handleSave} className="btn-primary">{t('settings.saveSettings')}</button>
            {saved && <p className="text-green-600 font-medium">{t('settings.settingsSaved')}</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.appearance')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.theme')}</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      localStorage.setItem('theme', mode);
                      window.location.reload();
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm border transition-colors ${
                      localStorage.getItem('theme') === mode
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {t(`settings.theme${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.language')}</label>
              <div className="flex gap-2">
                {['fr', 'en'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm border transition-colors ${
                      localStorage.getItem('lang') === lang
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {lang === 'fr' ? 'Français' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.specifications')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('common.noSpec')}</p>
        <div className="flex gap-2 mb-4">
          <button onClick={addSpec} className="btn btn-primary btn-sm">+ {t('settings.addSpec')}</button>
        </div>
        {specs.length > 0 ? (
          <div className="space-y-2">
            {specs.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.limit !== undefined ? `${s.limit} ${s.unit || ''}` : t('common.noLimit')}
                  </p>
                  <p className="text-xs text-purple-600">{t('common.userDefined')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateSpec(s.id)} className="btn btn-secondary btn-sm">{t('common.edit')}</button>
                  <button onClick={() => deleteSpec(s.id)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune spécification configurée</p>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('settings.sopReferences')}</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={addSop} className="btn btn-primary btn-sm">+ {t('settings.addSop')}</button>
        </div>
        {sops.length > 0 ? (
          <div className="space-y-2">
            {sops.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.refCode || '—'}</p>
                </div>
                <button onClick={() => deleteSop(s.id)} className="btn btn-danger btn-sm">{t('common.delete')}</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune référence SOP enregistrée</p>
        )}
      </div>

      <div className="card border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">⚠️ {t('compliance.warning')}</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">{t('compliance.warning')}</p>
      </div>
    </div>
  );
}
