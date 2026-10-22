import { readPublicCatalogPage } from '../src/utils/publicCatalogPage.js';
import { readPublicIndex } from '../server/public-index.js';
import { romanianUi } from '../src/locales/romanianUi.js';
import { SUPPORTED_LANGS, getLanguageTag, getCaseLanguages, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';
import { renderCaseArticle } from './case-study.js';
import { feedXml, publicFeedBody } from '../server/feed-content.js';
import { Buffer } from 'node:buffer';
import { indexableExploreLocales } from '../src/utils/exploreIndexing.js';
import { PUBLIC_JSA_FIELDS, publicIndexQuality, publicJsaView, publicJsaQuality } from '../src/utils/publicJsa.js';
import { buildSitemap } from '../scripts/sitemap-data.js';
import { CASE_SUMMARY_FIELDS, SITE, casePath, readPublic, readAllPublic, sendContent, sendUnavailable } from '../server/public-content.js';

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
export const RSS_MAX_BYTES = 4_000_000;
export const validDate = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
export function buildPublicSitemap(rows) {
  const urls = rows.filter(row => publicIndexQuality(row).indexable).map(row => {
    const modified = validDate(row.content_updated_at);
    return `<url><loc>${SITE}/${row.public_locale}/public-jsa/${row.id}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  });
  if (urls.length > 50000) throw new Error('SITEMAP_LIMIT');
  return xmlHeader + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>';
}
export function buildFeed(cases, publicRows, locale) {
  const canonicalCases = cases.filter(row => normalizeLocale(row.language_code) === locale);
  const entries = selectLocalizedCases(canonicalCases, locale).filter(row => row.content_md?.trim()).map(row => ({ title: row.title, post: row,
    url: SITE + casePath(locale, row.post_group_id), date: validDate(row.content_updated_at || row.created_at) }));
  for (const raw of publicRows) {
    const row = publicJsaView(raw);
    if (!publicJsaQuality(row).indexable || row.public_locale !== locale) continue;
    entries.push({ title: row.title, document: row,
      url: `${SITE}/${locale}/public-jsa/${row.id}`, date: validDate(row.content_updated_at || row.published_at || row.created_at) });
  }
  entries.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.url.localeCompare(b.url));
  const start = xmlHeader + `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Smart JSA Bridge</title><link>${SITE}/${locale}/</link><description>${feedXml(locale === 'ro-RO' ? romanianUi.editorial.feedDescription : 'Latest Case Studies and public JSA documents')}</description><language>${feedXml(getLanguageTag(locale))}</language><atom:link href="${SITE}/${locale}/feed.xml" rel="self" type="application/rss+xml"/>`;
  const end = '</channel></rss>';
  const items = []; let bytes = Buffer.byteLength(start + end);
  for (const row of entries.slice(0, 50)) {
    const body = row.document ? publicFeedBody(row.document, locale)
      : `<h1>${feedXml(row.title)}</h1><p>${feedXml(cleanSummary(row.post.meta_description))}</p>${renderCaseArticle(row.post, locale, row.url)}`;
    const item = `<item><title>${feedXml(row.title)}</title><link>${feedXml(row.url)}</link><guid isPermaLink="true">${feedXml(row.url)}</guid><description>${feedXml(body)}</description>${row.date ? `<pubDate>${new Date(row.date).toUTCString()}</pubDate>` : ''}</item>`;
    const size = Buffer.byteLength(item);
    // Keep whole articles below Vercel's 4.5 MB response limit and Naver's 10 MB limit.
    // The sitemap still lists articles that do not fit in this latest-items feed.
    if (bytes + size >= RSS_MAX_BYTES) continue;
    bytes += size; items.push(item);
  }
  return start + items.join('') + end;
}
async function readFeedDocuments(locale, fetcher) {
  const signal = AbortSignal.timeout(20000);
  const boundedFetch = (url, options) => fetcher(url, { ...options, signal });
  const filters = { is_public: 'eq.true', public_locale: 'eq.' + locale };
  const result = await readPublicCatalogPage({
    page: 0, pageSize: 50,
    readPage: async () => {
      const data = await readPublic('public_jsa_catalog', { ...filters, select: 'id',
        order: 'content_updated_at.desc.nullslast,published_at.desc,id', limit: '50' }, boundedFetch);
      return { data, count: data.length };
    },
    readBatch: async ids => ({ data: await readPublic('public_jsa_catalog', {
      ...filters, select: PUBLIC_JSA_FIELDS, id: 'in.(' + ids.join(',') + ')',
    }, boundedFetch) }),
  });
  return result.rows;
}
export function createContentFeedHandler({ fetcher = fetch } = {}) {
  return async (req, res) => {
    const { kind = 'index', lng: locale } = req.query || {};
    if (!['index', 'static', 'cases', 'public', 'rss'].includes(kind) || (kind === 'rss' && !SUPPORTED_LANGS.includes(locale))) { sendContent(req, res, 'Not found', { status: 404 }); return; }
    try {
      let body;
      if (kind === 'index') {
        const documents = await readPublicIndex(fetcher, { firstIndexable: true });
        const parts = ['static', 'cases'];
        // A urlset requires at least one url. Advertise this section only when
        // there is an eligible public document; it appears on the next request.
        if (documents.some(row => publicIndexQuality(row).indexable)) parts.push('public');
        body = xmlHeader + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + parts.map(part => `<sitemap><loc>${SITE}/sitemap-${part}.xml</loc></sitemap>`).join('') + '</sitemapindex>';
      }
      if (kind === 'static') {
        const documents = await readPublicIndex(fetcher);
        body = buildSitemap([], { includeStatic: true, exploreLocales: indexableExploreLocales(documents) });
      }
      if (kind === 'cases') body = buildSitemap(await readAllPublic('case_studies', { select: CASE_SUMMARY_FIELDS }, fetcher), { includeStatic: false });
      if (kind === 'public') body = buildPublicSitemap(await readPublicIndex(fetcher));
      if (kind === 'rss') {
        const [cases, documents] = await Promise.all([
          readPublic('case_studies', { select: CASE_SUMMARY_FIELDS + ',content_md,pdf_list,pdf_download_url', language_code: 'in.(' + getCaseLanguages(locale).join(',') + ')', order: 'content_updated_at.desc.nullslast,created_at.desc,id', limit: '50' }, fetcher),
          readFeedDocuments(locale, fetcher),
        ]);
        body = buildFeed(cases, documents, locale);
      }
      sendContent(req, res, body, { type: kind === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/xml; charset=utf-8', privateContent: ['public', 'rss'].includes(kind) });
    } catch { sendUnavailable(req, res); }
  };
}
export default createContentFeedHandler();
