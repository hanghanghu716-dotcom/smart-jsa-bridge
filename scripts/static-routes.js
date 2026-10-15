import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { isIndexableStaticPage } from '../src/utils/indexing.js';

const publicPages = ['', 'about', 'dictionary', 'jrajsa', 'regulation',
  'riskclassification', 'protectiveequipment', 'guideline/common',
  'guideline/construction', 'guideline/manufacturing', 'guideline/chemical',
  'guideline/high-risk', 'guideline/general', 'terms', 'privacy', 'archive'];

// react-snap 1.23 ignores the legacy `exclude` setting. Disable link crawling
// and enumerate stable public routes so user-owned data is never snapshotted.
export function staticRoutes(manifest) {
  return [...new Set(['/', ...SUPPORTED_LANGS.flatMap(locale => publicPages.filter(page => isIndexableStaticPage(locale, page)).map(page => `/${locale}/${page}`)),
    ...manifest.map(item => item.route).filter(route => /^\/[^/]+\/case-study\/[^/]+$/.test(route))])];
}
