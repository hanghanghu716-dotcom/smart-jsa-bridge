import { publicJsaView, validProjectId } from './publicJsa.js';
import { contentDate } from './publicDocumentPresentation.js';
import { localeCountry } from './publicCountry.js';
import { exploreExcerpt, excerptText, exploreCardTags } from './explorePresentation.js';

export const HOME_PUBLIC_LIMIT = 6;

// Decorative category images only; they do not represent the submitted job.
export function homeResourceImage(tags = []) {
  const category = tags.map(item => item.tag).join(' ');
  if (/밀폐/.test(category)) return '/images/image3.jpg';
  if (/비계|고소|추락/.test(category)) return '/images/image2.jpg';
  if (/전기|감전/.test(category)) return '/images/image6.jpg';
  if (/토목|건축|교량|양중|굴착/.test(category)) return '/images/image4.jpg';
  if (/용접/.test(category)) return '/images/image1.jpg';
  if (/방사선/.test(category)) return '/images/image5.jpg';
  return null;
}

// A compact, public-only projection shared by the live response and the client.
// Never serialize private form fields, document bodies or internal review data.
export function homePublicCards(rows, locale) {
  const country = localeCountry(locale), groups = new Set();
  return (Array.isArray(rows) ? rows : []).filter(row => !row?.restricted).map(publicJsaView).filter(row => row && validProjectId(row.id) && !row.assessment.duplicate_of && row.assessment.review !== 'rejected' && (!country || row.public_country === country))
    .filter(row => { const group = row.document_group_id || row.id; if (groups.has(group)) return false; groups.add(group); return true; })
    .slice(0, HOME_PUBLIC_LIMIT).map(row => ({
      id: row.id, title: row.title, authorId: row.author_id, operator: row.is_operator,
      locale: row.public_locale || locale, country: row.public_country,
      date: contentDate(row), variant: row.document_variant,
      excerpt: excerptText(exploreExcerpt(row), 190), steps: row.analysis_data.length,
      tags: exploreCardTags(row, locale, 3).map(({ tag, label }) => ({ tag, label })),
    }));
}
