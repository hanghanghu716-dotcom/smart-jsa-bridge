export const THEME_STORAGE_KEY = 'smartjsa_theme_preference';
export const normalizeTheme = value => ['light', 'dark'].includes(value) ? value : 'system';
export const resolveTheme = (preference, systemDark) =>
  preference === 'dark' || (normalizeTheme(preference) === 'system' && systemDark) ? 'dark' : 'light';

export function readTheme(storage) {
  try { return normalizeTheme(storage.getItem(THEME_STORAGE_KEY)); }
  catch { return 'system'; }
}

export function saveTheme(storage, preference) {
  try { storage.setItem(THEME_STORAGE_KEY, normalizeTheme(preference) === 'system' ? 'auto' : preference); }
  catch { /* An in-memory choice remains usable when browser storage is blocked. */ }
}

export function applyTheme(document, theme, preference = theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference === 'system' ? 'auto' : preference;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1115' : '#f4f6f8');
}
