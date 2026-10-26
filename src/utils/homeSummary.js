import { validProjectId } from './publicJsa.js';
import { contentDate, publicCategoryLabel } from './publicDocumentPresentation.js';
import { localeCountry } from './publicCountry.js';
import { excerptText } from './explorePresentation.js';
import { storedThumbnail } from './publicThumbnail.js';

const COMMON_FIELDS = 'id,title,author_id,is_public,public_locale,public_country,tags,published_at,content_updated_at,is_operator,document_group_id,document_variant,assessment';
export const HOME_SUMMARY_FIELDS = COMMON_FIELDS + ',excerpt,step_count,thumbnail_revision,thumbnail_width,thumbnail_height';
// Compatibility during a staggered deployment: no document bodies, even on the old schema.
export const HOME_LEGACY_FIELDS = COMMON_FIELDS + ',excerpt:publication_context->>scope';
export const homeSchemaMissing = error => ['42P01','PGRST205','42703','PGRST204'].includes(error?.code);

export function homeSummaryCards(rows, locale) {
  const country = localeCountry(locale), groups = new Set();
  return rows.filter(row => row?.is_public === true && validProjectId(row.id) && !row.restricted &&
    !row.assessment?.duplicate_of && row.assessment?.review !== 'rejected' && (!country || row.public_country === country))
    .filter(row => { const group = row.document_group_id || row.id; if (groups.has(group)) return false; groups.add(group); return true; })
    .slice(0, 6).map(row => ({
      id: row.id, title: typeof row.title === 'string' ? row.title : '', authorId: row.author_id,
      operator: row.is_operator === true, locale: row.public_locale || locale, country: row.public_country,
      date: contentDate(row), variant: ['basic','technical','handover'].includes(row.document_variant) ? row.document_variant : null,
      excerpt: excerptText(typeof row.excerpt === 'string' ? row.excerpt : '', 190),
      steps: Number.isSafeInteger(row.step_count) && row.step_count >= 0 ? row.step_count : null,
      tags: [...new Set((Array.isArray(row.tags) ? row.tags : []).filter(tag => typeof tag === 'string'))].slice(0,3)
        .map(tag => ({ tag, label: publicCategoryLabel(tag, locale) })),
      thumbnail: storedThumbnail(row),
    }));
}

// Six visible groups, no exact count or full-document fetch. Bound sparse catalogs
// to 120 metadata rows, while still handling server-side result caps.
export async function readHomeSummary(locale, readPage, signal) {
  let table = 'public_jsa_cards', fields = HOME_SUMMARY_FIELDS, offset = 0;
  const rows = [], seen = new Set();
  for (let page = 0; page < 10; page++) {
    signal?.throwIfAborted();
    let batch;
    try { batch = await readPage({ table, fields, offset, limit: 12, signal }); }
    catch (error) {
      if (table !== 'public_jsa_cards' || offset !== 0 || !homeSchemaMissing(error)) throw error;
      table = 'public_jsa_catalog'; fields = HOME_LEGACY_FIELDS;
      batch = await readPage({ table, fields, offset, limit: 12, signal });
    }
    signal?.throwIfAborted();
    if (!Array.isArray(batch)) throw new Error('INVALID_HOME_SUMMARY');
    if (!batch.length) break;
    const fresh = batch.filter(row => !seen.has(row.id));
    if (!fresh.length) throw new Error('HOME_PAGINATION_STALLED');
    for (const row of fresh) { seen.add(row.id); rows.push(row); }
    offset += batch.length;
    if (homeSummaryCards(rows, locale).length === 6) break;
  }
  return { locale, cards: homeSummaryCards(rows, locale) };
}
