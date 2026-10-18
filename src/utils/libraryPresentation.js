import { publicTagLabel } from '../locales/publicTagLabels.js';

export const LIBRARY_PAGE_SIZE = 12;
export function libraryTagLabel(tag, locale) {
  // Translate built-in IDs; custom user labels remain authored text.
  return publicTagLabel(tag, locale) || (publicTagLabel(tag, 'ko') ? '' : String(tag || ''));
}
export function libraryPage(items, requested = 1) {
  const total = Math.ceil(items.length / LIBRARY_PAGE_SIZE);
  const current = Math.max(1, Math.min(Number(requested) || 1, total || 1));
  return { current, total, rows: items.slice((current - 1) * LIBRARY_PAGE_SIZE, current * LIBRARY_PAGE_SIZE) };
}

