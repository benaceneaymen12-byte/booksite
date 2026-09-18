import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('lang') === 'en' ? 'en' : 'fr';
    if (i18n.language !== savedLanguage) {
      void i18n.changeLanguage(savedLanguage);
    }
  }, []);

  return <>{children}</>;
}

export function useI18n() {
  const { t, i18n } = useTranslation();
  const changeLanguage = async (language: string) => {
    const nextLanguage = language === 'en' ? 'en' : 'fr';
    localStorage.setItem('lang', nextLanguage);
    await i18n.changeLanguage(nextLanguage);
  };
  return { t, i18n, changeLanguage };
}
