import { useState, useEffect, useCallback } from 'react';
import { getLocale, setLocale, t as _t } from './index';
import type { Locale } from './index';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getLocale);

  useEffect(() => {
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail);
    };
    window.addEventListener('locale-change', handler);
    return () => window.removeEventListener('locale-change', handler);
  }, []);

  const changeLocale = useCallback((l: Locale) => {
    setLocale(l);
    setLocaleState(l);
  }, []);

  const t = useCallback((key: string) => _t(key, locale), [locale]);

  return { locale, changeLocale, t };
}
