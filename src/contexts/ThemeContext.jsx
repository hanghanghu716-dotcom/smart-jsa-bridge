import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const THEME_STORAGE_KEY = 'smartjsa_theme_preference';
const VALID_THEMES = new Set(['auto', 'light', 'dark']);

const getPreference = () => {
  if (typeof window === 'undefined') return 'auto';
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return VALID_THEMES.has(saved) ? saved : 'auto';
};

export const resolveTheme = (preference) => {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const applyTheme = (preference) => {
  if (typeof document === 'undefined') return resolveTheme(preference);
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
};

export const initializeTheme = () => applyTheme(getPreference());

const ThemeContext = createContext({
  preference: 'auto',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getPreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(getPreference()));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const syncTheme = () => {
      const resolved = applyTheme(preference);
      setResolvedTheme(resolved);
    };

    const syncStorage = event => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = VALID_THEMES.has(event.newValue) ? event.newValue : 'auto';
      setPreference(next);
    };

    syncTheme();
    if (preference === 'auto') media.addEventListener('change', syncTheme);
    window.addEventListener('storage', syncStorage);

    return () => {
      media.removeEventListener('change', syncTheme);
      window.removeEventListener('storage', syncStorage);
    };
  }, [preference]);

  const setTheme = next => {
    const value = VALID_THEMES.has(next) ? next : 'auto';
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    setPreference(value);
  };

  const value = useMemo(() => ({ preference, resolvedTheme, setTheme }), [preference, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
