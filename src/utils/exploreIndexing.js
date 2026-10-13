import { publicJsaQuality } from './publicJsa.js';
import { localeCountry } from './publicCountry.js';
import { SUPPORTED_LANGS } from '../locales/config.js';

export function exploreIndexable(rows, query = {}, failed = false) {
  return !failed && !query.search && !query.tags?.length && !query.country
    && (!query.sort || query.sort === 'latest')
    && rows.some(row => publicJsaQuality(row).indexable);
}

export function indexableExploreLocales(rows) {
  // Match Explore's default country filter and first page. Documents can be
  // displayed in a country's catalog regardless of their original language.
  return SUPPORTED_LANGS.filter(locale => {
    const firstPage = rows.filter(row => row?.public_country === localeCountry(locale))
      .sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0)
        || String(a.id).localeCompare(String(b.id))).slice(0, 24);
    return exploreIndexable(firstPage);
  });
}
