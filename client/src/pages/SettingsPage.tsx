import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_BIOCARE_WATER_SCHEDULE = {
  sunday: ['60110VH05', '60110VH55', '60410VH13', '60410VH11', '02266VH01', '60410VH09', '83061VH01(M)', '61110VH05', '61110VH55', '83061VH01(A)', '62410VH11', 'LPUE060', 'LPUE059'],
  monday: ['61110VH55', '61110VH05', 'RRU1,V38-R09', 'LPUE 59', 'LPUE60', '02266VH01'],
  tuesday: ['61110VH55', '61110VH05', '61410VH11'],
  wednesday: ['61110VH55', '61110VH05', '61410VH13', '61410VH11', 'LPUE059'],
  thursday: ['61110VH55', '61110VH05', '61110VH05', '61110VH55', '61110VH05', '61110VH55'],
  friday: [],
  saturday: [],
};

const DEFAULT_BIOCARE_MP_PF = {
  format: 'pf',
  collector: 'DDE',
  phCh: true,
  micro: true,
};

const DEFAULT_BIOCARE_MACHINE_PARTS = [
  'Cuve tampon',
  'Tube en silicone entre ligne transfert et la cuve tampon',
  'Tube en silicone entre la cuve de transfert et distributeur',
  'Tube en silicone des aiguilles',
  'Tube en PTFE des aiguilles',
  'Distributeur',
  'Les aiguilles de remplissage',
  'TC Clamps',
  'Joint',
  'WFI',
];

const DEFAULT_BIOCARE_PRINT_PROFILES = {
  preparedMedia: { width: 11.9, height: 7.4, orientation: 'portrait' },
  prePouredPetri: { width: 11.9, height: 7.4, orientation: 'portrait' },
  sterilization: { width: 11.9, height: 7.4, orientation: 'portrait' },
  inventory: { width: 11.9, height: 7.4, orientation: 'portrait' },
  waterSampling: { width: 9.5, height: 4.5, orientation: 'portrait' },
  mpPfSampling: { width: 10, height: 6, orientation: 'portrait' },
  report: { width: 21, height: 29.7, orientation: 'landscape' },
  machineParts: { width: 3.5, height: 2.5, orientation: 'portrait' },
  actionLogbook: { width: 21, height: 29.7, orientation: 'landscape' },
};

export default function SettingsPage() {
  const { t, i18n, changeLanguage } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [labName, setLabName] = useState('');
  const [analystName, setAnalystName] = useState('');
  const [defaultShift, setDefaultShift] = useState('');
  const [warningDays, setWarningDays] = useState('10');
  const [specs, setSpecs] = useState<any[]>([]);
  const [sops, setSops] = useState<any[]>([]);
  const [waterSchedule, setWaterSchedule] = useState(JSON.stringify(DEFAULT_BIOCARE_WATER_SCHEDULE, null, 2));
  const [mpPfDefaults, setMpPfDefaults] = useState(JSON.stringify(DEFAULT_BIOCARE_MP_PF, null, 2));
  const [machineParts, setMachineParts] = useState(DEFAULT_BIOCARE_MACHINE_PARTS.join('\n'));
  const [printProfiles, setPrintProfiles] = useState(JSON.stringify(DEFAULT_BIOCARE_PRINT_PROFILES, null, 2));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([api.getSettings(), api.getSpecifications(), api.getSopReferences()])
      .then(([settings, s, sopsData]) => {
        setLabName(settings.labName || '');
        setAnalystName(settings.analystName || '');
        setDefaultShift(settings.defaultShift || '');
        setWarningDays(settings.warningDays || '10');
        setWaterSchedule(settings.biocareWaterSchedule || JSON.stringify(DEFAULT_BIOCARE_WATER_SCHEDULE, null, 2));
        setMpPfDefaults(settings.biocareMpPfDefaults || JSON.stringify(DEFAULT_BIOCARE_MP_PF, null, 2));
        setMachineParts(settings.biocareMachineParts || DEFAULT_BIOCARE_MACHINE_PARTS.join('\n'));
        setPrintProfiles(settings.biocarePrintProfiles || JSON.stringify(DEFAULT_BIOCARE_PRINT_PROFILES, null, 2));
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
      await api.updateSetting('biocareWaterSchedule', waterSchedule);
      await api.updateSetting('biocareMpPfDefaults', mpPfDefaults);
      await api.updateSetting('biocareMachineParts', machineParts);
      await api.updateSetting('biocarePrintProfiles', printProfiles);
      localStorage.setItem('labName', labName);
      localStorage.setItem('analystName', analystName);
      localStorage.setItem('warningDays', warningDays);
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
    const ref = prompt(t('settings.sopRefCode'))?.trim();
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

  const handleLanguageChange = async (lang: string) => {
    localStorage.setItem('lang', lang);
    await changeLanguage(lang);
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
                      i18n.language === lang
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
              <div key={s.id} className="flex items-start justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="min-w-0 space-y-2">
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
          <div className="space-y-4">
            {sops.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="min-w-0 space-y-4">
                  <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                  {(() => {
                    const refCode = String(s.refCode ?? s.ref_code ?? '').trim();
                    const isUrl = /^https?:\/\//i.test(refCode);
                    return isUrl ? <a className="btn btn-secondary btn-sm inline-flex mt-1" href={refCode} target="_blank" rel="noreferrer">{t('settings.openSop')}</a> : <p className="text-xs text-gray-500">{refCode || '—'}</p>;
                  })()}
                </div>
                {isAdmin && <button onClick={() => deleteSop(s.id)} className="btn btn-danger btn-sm">{t('common.delete')}</button>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune référence SOP enregistrée</p>
        )}
      </div>

    </div>
  );
}
