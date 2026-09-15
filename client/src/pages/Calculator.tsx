import { useState } from 'react';
import { useI18n } from '../context/I18nContext';

export default function Calculator() {
  const { t } = useI18n();
  const [colonies, setColonies] = useState('');
  const [dilution, setDilution] = useState('');
  const [volume, setVolume] = useState('');
  const [numPlates, setNumPlates] = useState(1);
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const c = parseFloat(colonies);
    const d = parseFloat(dilution);
    const v = parseFloat(volume);

    if (isNaN(c) || isNaN(d) || isNaN(v) || v === 0) {
      setResult(null);
      return;
    }

    const val = (c * d) / v;
    setResult(val);
  };

  const isValid = () => {
    const c = parseFloat(colonies);
    const d = parseFloat(dilution);
    const v = parseFloat(volume);
    return !isNaN(c) && !isNaN(d) && !isNaN(v) && v > 0;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('calculator.title')}</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('calculator.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('calculator.colonies')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={colonies}
              onChange={(e) => setColonies(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{t('calculator.zeroColonies')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('calculator.dilutionFactor')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={dilution}
              onChange={(e) => setDilution(e.target.value)}
              placeholder="1"
              min="1"
              step="0.1"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('calculator.volumePlated')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="0.1"
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{t('calculator.unit')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('calculator.numPlates')}
            </label>
            <input
              type="number"
              value={numPlates}
              onChange={(e) => setNumPlates(parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={calculate} disabled={!isValid()} className="btn-primary">
            {t('calculator.calculate')}
          </button>
        </div>
      </div>

      {result !== null && (
        <div className="card border-2 border-primary">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('calculator.formulaDisplay')}</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-500">{t('calculator.colonies')}</p>
              <p className="text-xl font-bold">{colonies}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('calculator.dilutionFactor')}</p>
              <p className="text-xl font-bold">{dilution}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('calculator.volumePlated')}</p>
              <p className="text-xl font-bold">{volume} mL</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('common.formula')}</p>
              <p className="text-lg font-medium text-gray-600">({colonies} × {dilution}) / {volume}</p>
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-2xl font-bold text-primary">
              {result.toLocaleString()} {t('calculator.cfuPerMl')}
            </p>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 flex items-start gap-2">
            <span>⚠️</span>
            <span>{t('calculator.disclaimer')}</span>
          </p>
        </div>
      )}

      <div className="card bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('common.alert')}</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>0 colonies → result = 0 UFC/mL</li>
          <li>TNTC (Too Numerous To Count) → ne pas calculer automatiquement</li>
          <li>Plaque invalide → exclure du calcul</li>
          <li>Ce calculateur est indicatif — utiliser la méthode/SOP validée</li>
        </ul>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('common.compliance.warning')}</h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 flex items-start gap-2">
            <span>⚠️</span>
            <span>{t('calculator.disclaimer')}</span>
          </p>
      </div>
    </div>
  );
}
