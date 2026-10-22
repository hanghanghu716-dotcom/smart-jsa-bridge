import { splitCaseForCommerce, caseResourcesTitle } from '../src/utils/caseSections.js';
import { getCommerceUi } from '../src/locales/commerceUi.js';
import { romanianUi } from '../src/locales/romanianUi.js';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { SUPPORTED_LANGS, SEO_LANGUAGES, getSeoLocale, getLanguageTag, getCaseLanguages, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary, serializeStructuredData } from '../src/utils/content.js';
import { SITE, casePath, escapeHtml as e, jsonScript, readAllPublic, sendContent, sendUnavailable } from '../server/public-content.js';

const schema = { ...defaultSchema, attributes: { ...defaultSchema.attributes, td: [...(defaultSchema.attributes.td || []), 'colSpan', 'rowSpan'], th: [...(defaultSchema.attributes.th || []), 'colSpan', 'rowSpan'] } };
export function renderCaseBody(post, baseUrl) {
  const urlTransform = baseUrl ? value => {
    const safe = defaultUrlTransform(value);
    if (!safe) return safe;
    try { return new URL(safe, baseUrl).href; } catch { return ''; }
  } : defaultUrlTransform;
  return renderToStaticMarkup(React.createElement(Markdown, { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeRaw, [rehypeSanitize, schema]], urlTransform, children: post.content_md || '' }));
}
export function renderCaseArticle(post, locale, baseUrl) {
  const sections = splitCaseForCommerce(post.content_md || '');
  const body = renderCaseBody({...post,content_md:sections.beforeProducts}, baseUrl);
  const afterProducts = sections.afterProducts ? renderCaseBody({...post,content_md:sections.afterProducts}, baseUrl) : '';
  const introduction = sections.introduction ? renderCaseBody({...post,content_md:sections.introduction}, baseUrl) : '';
  const review = sections.review ? renderCaseBody({...post,content_md:sections.review}, baseUrl) : '';
  const pdfs = post.pdf_list?.length ? post.pdf_list : post.pdf_download_url ? [{ name: 'PDF', url: post.pdf_download_url }] : [];
  const downloads = pdfs.filter(pdf => /^https?:\/\//i.test(pdf.url || '')).map(pdf => `<li><a href="${e(pdf.url)}">${e(pdf.name || 'PDF')}</a></li>`).join('');
  const products = `<section id="section-${sections.productSection}"><h2>${sections.productSection}. ${e(getCommerceUi(locale).title)}</h2></section>`;
  const resources = `<section id="section-${sections.resourcesSection}"><h2>${sections.resourcesSection}. ${e(caseResourcesTitle(locale))}</h2>${downloads ? `<ul>${downloads}</ul>` : ''}${introduction}</section>`;
  return `${body}${sections.earlyProducts ? products : ''}${afterProducts}${resources}${sections.earlyProducts ? '' : products}${review}`;
}
export function renderCaseHtml(shell, post, locale, availableLocales) {
  const ro = locale === 'ro-RO' ? romanianUi.editorial : null;
  const path = casePath(locale, post.post_group_id);
  const title = post.meta_title || `${post.title} | Smart JSA Bridge`;
  const description = cleanSummary(String(post.meta_description || '').replace(/<[^>]*>/g, ' '));
  const alternatives = SEO_LANGUAGES.filter(code => availableLocales.some(value => normalizeLocale(value) === getSeoLocale(code)));
  const links = alternatives.map(code => `<link data-rh="true" rel="alternate" hreflang="${e(code)}" href="${e(SITE + casePath(getSeoLocale(code), post.post_group_id))}">`).join('');
  const metadata = `<title data-rh="true">${e(title)}</title><meta data-rh="true" name="description" content="${e(description)}"><meta data-rh="true" name="robots" content="index,follow"><link data-rh="true" rel="canonical" href="${e(SITE + path)}"><meta data-rh="true" property="og:title" content="${e(title)}"><meta data-rh="true" property="og:description" content="${e(description)}"><meta data-rh="true" property="og:url" content="${e(SITE + path)}">${links}${alternatives.includes('en-US') ? `<link data-rh="true" rel="alternate" hreflang="x-default" href="${e(SITE + casePath('en-US', post.post_group_id))}">` : ''}<link rel="alternate" type="application/rss+xml" title="Smart JSA Bridge" href="/${e(locale)}/feed.xml">`;
  const structured = serializeStructuredData(post.schema_markup);
  const article = `<main class="case-study-page" style="max-width:1100px;margin:0 auto;padding:32px 24px;color:var(--text-primary);background:var(--app-bg)"><nav><a href="/${e(locale)}/">Smart JSA Bridge</a> · <a href="/${e(locale)}/archive">${e(ro?.cases || 'Case Studies')}</a> · <a href="/${e(locale)}/explore">${e(ro?.explore || 'Explore')}</a></nav><h1>${e(post.title)}</h1><p>${e(description)}</p><article class="toastui-editor-contents" data-case-study-id="${e(post.id)}">${renderCaseArticle(post, locale)}</article></main>`;
  return shell.replace(/<html[^>]*>/, `<html lang="${e(getLanguageTag(locale))}" dir="${locale.startsWith('ar') ? 'rtl' : 'ltr'}">`)
    .replace('</head>', metadata + '</head>').replace('<div id="root"></div>', `<div id="root">${article}${structured ? `<script type="application/ld+json">${structured}</script>` : ''}<script id="jsa-case-bootstrap" type="application/json">${jsonScript({ path, post, availableLocales })}</script></div>`);
}
export function createCaseHandler({ fetcher = fetch, readShell = () => readFile(new URL('../dist/public-jsa-shell.html', import.meta.url), 'utf8') } = {}) {
  return async (req, res) => {
    const { lng: locale, slug } = req.query || {};
    if (!SUPPORTED_LANGS.includes(locale) || typeof slug !== 'string' || !slug || slug.length > 300 || /[\/\\\x00-\x1f]/.test(slug)) {
      sendContent(req, res, 'Not found', { status: 404 }); return;
    }
    try {
      const variants = await readAllPublic('case_studies', { select: '*', post_group_id: 'eq.' + slug }, fetcher);
      const candidates = variants.filter(row => getCaseLanguages(locale).includes(row.language_code));
      const post = selectLocalizedCases(candidates, locale)[0];
      // Do not publish Korean fallback text under non-existent translations.
      if (!post) { sendContent(req, res, 'Not found', { status: 404 }); return; }
      const canonicalLocale = normalizeLocale(post.language_code);
      if (canonicalLocale !== locale) {
        res.setHeader('Location', casePath(canonicalLocale, slug));
        sendContent(req, res, '', { status: 308 }); return;
      }
      if (!post.content_md?.trim()) { sendContent(req, res, 'Not found', { status: 404 }); return; }
      sendContent(req, res, renderCaseHtml(await readShell(), post, locale, variants.map(row => row.language_code)));
    } catch { sendUnavailable(req, res); }
  };
}
export default createCaseHandler();
