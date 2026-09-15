import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useI18n() {
  const { t, i18n } = useTranslation();
  return { t, i18n, changeLanguage: i18n.changeLanguage.bind(i18n) };
}
