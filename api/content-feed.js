import { SUPPORTED_LANGS, getCaseLanguages, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';
import { PUBLIC_JSA_FIELDS, publicJsaView, publicJsaQuality } from '../src/utils/publicJsa.js';
import { buildSitemap } from '../scripts/sitemap-data.js';
import { CASE_SUMMARY_FIELDS, SITE, casePath, escapeHtml as e, readAllPublic, sendContent, sendUnavailable } from '../server/public-content.js';

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
export const validDate = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
export function buildPublicSitemap(rows) {
  const urls = rows.map(publicJsaView).filter(row => publicJsaQuality(row).indexable).map(row => {
    const modified = validDate(row.content_updated_at);
    return `<url><loc>${SITE}/${row.public_locale}/public-jsa/${row.id}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`;
  });
  if (urls.length > 50000) throw new Error('SITEMAP_LIMIT');
  return xmlHeader + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>';
}
export function buildFeed(cases, publicRows, locale) {
  const canonicalCases = cases.filter(row => normalizeLocale(row.language_code) === locale);
  const entries = selectLocalizedCases(canonicalCases, locale).map(row => ({ title: row.title, description: cleanSummary(row.meta_description),
    url: SITE + casePath(locale, row.post_group_id), date: validDate(row.content_updated_at || row.created_at) }));
  for (const raw of publicRows) {
    const row = publicJsaView(raw);
    if (!publicJsaQuality(row).indexable || row.public_locale !== locale) continue;
    entries.push({ title: row.title, description: row.analysis_data.map(step => step.proc.stepTitle).join(' · '),
      url: `${SITE}/${locale}/public-jsa/${row.id}`, date: validDate(row.content_updated_at || row.published_at || row.created_at) });
  }
  entries.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.url.localeCompare(b.url));
  return xmlHeader + `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Smart JSA Bridge</title><link>${SITE}/${locale}/</link><description>Latest Case Studies and public JSA documents</description><atom:link href="${SITE}/${locale}/feed.xml" rel="self" type="application/rss+xml"/>` + entries.slice(0, 100).map(row => `<item><title>${e(row.title)}</title><link>${e(row.url)}</link><guid isPermaLink="true">${e(row.url)}</guid><description>${e(row.description)}</description>${row.date ? `<pubDate>${new Date(row.date).toUTCString()}</pubDate>` : ''}</item>`).join('') + '</channel></rss>';
}
export function createContentFeedHandler({ fetcher = fetch } = {}) {
  return async (req, res) => {
    const { kind = 'index', lng: locale } = req.query || {};
    if (!['index', 'static', 'cases', 'public', 'rss'].includes(kind) || (kind === 'rss' && !SUPPORTED_LANGS.includes(locale))) { sendContent(req, res, 'Not found', { status: 404 }); return; }
    try {
      let body;
      if (kind === 'index') body = xmlHeader + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['static', 'cases', 'public'].map(part => `<sitemap><loc>${SITE}/sitemap-${part}.xml</loc></sitemap>`).join('') + '</sitemapindex>';
      if (kind === 'static') body = buildSitemap([], { includeStatic: true });
      if (kind === 'cases') body = buildSitemap(await readAllPublic('case_studies', { select: CASE_SUMMARY_FIELDS }, fetcher), { includeStatic: false });
      if (kind === 'public') body = buildPublicSitemap(await readAllPublic('public_jsa_catalog', { select: PUBLIC_JSA_FIELDS, is_public: 'eq.true' }, fetcher));
      if (kind === 'rss') {
        const [cases, documents] = await Promise.all([
          readAllPublic('case_studies', { select: CASE_SUMMARY_FIELDS, language_code: 'in.(' + getCaseLanguages(locale).join(',') + ')' }, fetcher),
          readAllPublic('public_jsa_catalog', { select: PUBLIC_JSA_FIELDS, is_public: 'eq.true', public_locale: 'eq.' + locale }, fetcher),
        ]);
        body = buildFeed(cases, documents, locale);
      }
      sendContent(req, res, body, { type: kind === 'rss' ? 'application/rss+xml; charset=utf-8' : 'application/xml; charset=utf-8', privateContent: ['public', 'rss'].includes(kind) });
    } catch { sendUnavailable(req, res); }
  };
}
export default createContentFeedHandler();
