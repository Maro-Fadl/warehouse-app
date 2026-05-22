'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { getDirection } from '@/lib/i18n';

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
}

export function I18nProvider({ children, locale = 'en' }: I18nProviderProps) {
  useEffect(() => {
    i18n.changeLanguage(locale);
    document.documentElement.dir = getDirection(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
