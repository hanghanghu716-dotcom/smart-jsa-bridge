import ar from './phase6/ar.js';
import de from './phase6/de.js';
import es from './phase6/es.js';
import fr from './phase6/fr.js';
import it from './phase6/it.js';
import ja from './phase6/ja.js';
import pt from './phase6/pt.js';
import ru from './phase6/ru.js';
import { getLanguageTag, normalizeLocale } from './config.js';

const translations = { ar, de, es, fr, it, ja, pt, ru };
export const phase6Language = (locale = 'en-US') => normalizeLocale(locale).split('-')[0].toLowerCase();
export const getPhase6Ui = (section, locale) => translations[phase6Language(locale)]?.[section];
// Application province identifiers are not valid Intl language tags.
export const formatBusinessDate = (value, locale) => new Date(value).toLocaleString(getLanguageTag(locale));
export const formatStorageCount = (value, locale) => new Intl.NumberFormat(getLanguageTag(locale)).format(value);
