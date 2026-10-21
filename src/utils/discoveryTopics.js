import { getDiscoveryUi, getGuideTitle } from '../locales/discoveryUi.js';
import { exploreCardTags } from './explorePresentation.js';
import { exploreSearch } from './discovery.js';

// The same bounded links are used by the browser and initial HTML. Only tags
// supported by both the saved classification and the actual text are promoted.
export function discoveryTopics(rows, locale, query = {}) {
  const tags = [...new Map(rows.flatMap(row => exploreCardTags(row, locale)).map(item => [item.tag, item])).values()].slice(0, 8);
  return [
    ...tags.map(item => ({ label: item.label, href: '/explore' + exploreSearch({ ...query, page: 0, tags: [item.tag] }) })),
    ...['common', 'construction', 'manufacturing', 'chemical', 'high-risk', 'general'].map(key => ({ label: getGuideTitle(key, locale), href: '/guideline/' + key })),
    { label: getDiscoveryUi(locale).caseStudy, href: '/archive' },
  ];
}
