import { useEffect, useState } from 'react';
import { ThemeContext } from '../hooks/useTheme';
import { applyTheme, normalizeTheme, readTheme, resolveTheme, saveTheme, THEME_STORAGE_KEY } from '../theme/preferences';

export function ThemeProvider({ children }) {
  const [preference, updatePreference] = useState(() => {
    try { return readTheme(window.localStorage); } catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resolvedTheme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    applyTheme(document, resolvedTheme, preference);
  }, [resolvedTheme, preference]);

  useEffect(() => {
    const sync = event => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) updatePreference(normalizeTheme(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const setPreference = value => {
    const next = normalizeTheme(value);
    updatePreference(next);
    applyTheme(document, resolveTheme(next, window.matchMedia('(prefers-color-scheme: dark)').matches), next);
    try { saveTheme(window.localStorage, next); } catch { /* Storage access itself can throw. */ }
  };

  return <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>{children}</ThemeContext.Provider>;
}
