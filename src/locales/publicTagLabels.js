import labels0 from './ko/tags.json' with { type: 'json' };
import labels1 from './en-US/tags.json' with { type: 'json' };
import labels2 from './en-GB/tags.json' with { type: 'json' };
import labels3 from './en-AU/tags.json' with { type: 'json' };
import labels4 from './en-CA/tags.json' with { type: 'json' };
import labels5 from './de-DE/tags.json' with { type: 'json' };
import labels6 from './fr-FR/tags.json' with { type: 'json' };
import labels7 from './ja-JP/tags.json' with { type: 'json' };
import labels8 from './it-IT/tags.json' with { type: 'json' };
import labels9 from './es-ES/tags.json' with { type: 'json' };
import labels10 from './ar-SA/tags.json' with { type: 'json' };
import labels11 from './pt-BR/tags.json' with { type: 'json' };
import labels12 from './ru-RU/tags.json' with { type: 'json' };
import labels13 from './ro-RO/tags.json' with { type: 'json' };
import { getDataLocale, normalizeLocale } from './config.js';

// Shared by the server HTML and the interactive filters/cards. Canonical tag
// IDs stay stable; a missing translation never leaks the Korean storage key.
const catalogs = { 'ko': labels0, 'en-US': labels1, 'en-GB': labels2, 'en-AU': labels3, 'en-CA': labels4, 'de-DE': labels5, 'fr-FR': labels6, 'ja-JP': labels7, 'it-IT': labels8, 'es-ES': labels9, 'ar-SA': labels10, 'pt-BR': labels11, 'ru-RU': labels12, 'ro-RO': labels13 };
export function publicTagLabel(tag, locale) {
  const resolved = getDataLocale(normalizeLocale(locale || 'en-US'));
  const labels = catalogs[resolved] || catalogs['en-US'];
  const value = Object.hasOwn(labels, tag) ? labels[tag] : '';
  return typeof value === 'string' ? value.trim() : '';
}

