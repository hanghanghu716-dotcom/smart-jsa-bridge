import { SUPPORTED_LANGS, SEO_LANGUAGES, getSeoLocale, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';

const baseUrl = 'https://smartjsabridge.com';
const staticPages = ['', 'about', 'archive', 'explore', 'dictionary', 'jrajsa', 'regulation',
  'riskclassification', 'protectiveequipment', 'guideline/common', 'guideline/construction',
  'guideline/manufacturing', 'guideline/chemical', 'guideline/high-risk', 'guideline/general', 'terms', 'privacy'];
const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[char]));
const casePath = slug => '/case-study/' + encodeURIComponent(slug);

export async function loadCaseRows(client) {
  const result = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await client.from('case_studies')
      .select('post_group_id, language_code')
      .order('post_group_id', { ascending: true })
      .order('language_code', { ascending: true }).range(from, from + size - 1);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < size) return result;
  }
}

export function buildSitemap(rows, { includeStatic = true } = {}) {
  const entries = [];
  const addEntry = (locale, path, alternates, modified) => {
    const url = code => escapeXml(baseUrl + '/' + code + path);
    const links = alternates.map(code => '    <xhtml:link rel="alternate" hreflang="' + code
      + '" href="' + url(getSeoLocale(code)) + '"/>');
    if (alternates.includes('en-US')) links.push('    <xhtml:link rel="alternate" hreflang="x-default" href="' + url('en-US') + '"/>');
    const lastmod = modified && Number.isFinite(Date.parse(modified)) ? '\n    <lastmod>' + new Date(modified).toISOString() + '</lastmod>' : '';
    entries.push('  <url>\n    <loc>' + url(locale) + '</loc>' + lastmod + '\n' + links.join('\n') + '\n  </url>');
  };
  for (const page of includeStatic ? staticPages : []) {
    for (const locale of SUPPORTED_LANGS) addEntry(locale, page ? '/' + page : '', SEO_LANGUAGES);
  }
  const groups = new Map();
  const variants = new Map();
  for (const row of rows) {
    const locale = normalizeLocale(row.language_code);
    if (!row.post_group_id || !SUPPORTED_LANGS.includes(locale)) continue;
    if (!groups.has(row.post_group_id)) groups.set(row.post_group_id, new Set());
    groups.get(row.post_group_id).add(locale);
    const key = locale + '/' + row.post_group_id;
    if (!variants.has(key)) variants.set(key, []);
    variants.get(key).push(row);
  }
  for (const [slug, locales] of groups) {
    const alternates = SEO_LANGUAGES.filter(locale => locales.has(getSeoLocale(locale)));
    for (const locale of locales) {
      const selected = selectLocalizedCases(variants.get(locale + '/' + slug), locale)[0];
      addEntry(locale, casePath(slug), alternates, selected?.content_updated_at);
    }
  }
  if (entries.length > 50000) throw new Error('Sitemap exceeds 50,000 URLs; split into a sitemap index before publishing.');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + entries.join('\n') + '\n</urlset>\n';
}
