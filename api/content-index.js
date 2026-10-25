import { romanianUi } from '../src/locales/romanianUi.js';
import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import { SUPPORTED_LANGS, getCaseLanguages, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';
import { CASE_SUMMARY_FIELDS, casePath, escapeHtml as e, jsonScript, readAllPublic, sendContent, sendUnavailable } from '../server/public-content.js';
import { readHomePublic, renderHomePublic } from '../server/home-public.js';

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const match = find(child, predicate); if (match) return match; }
}
export function renderIndexHtml(template, rows, locale, kind, publicCatalog = null) {
  const ro = locale === 'ro-RO' ? romanianUi.editorial : null;
  const tree = parse(template);
  const slot = find(tree, node => node.attrs?.some(attr => attr.name === 'data-live-case-list'));
  const body = find(tree, node => node.tagName === 'body');
  if (!slot || !body) throw new Error('LIVE_CASE_SLOT_MISSING');
  const selected = selectLocalizedCases(rows, locale);
  const cards = (kind === 'home' ? selected.slice(0, 6) : selected).map(row => `<article style="padding:24px;border:1px solid #e2e8f0;border-radius:16px;margin:12px 0"><h2><a href="${e(casePath(normalizeLocale(row.language_code), row.post_group_id))}">${e(row.title)}</a></h2><p>${e(cleanSummary(row.meta_description))}</p><time datetime="${e(row.created_at)}">${e(locale === 'ro-RO' && Number.isFinite(Date.parse(row.created_at)) ? new Intl.DateTimeFormat('ro-RO', { timeZone: 'UTC' }).format(new Date(row.created_at)) : String(row.created_at || '').slice(0, 10))}</time></article>`).join('');
  const homeCards = `<div class="home-case-grid">${selected.slice(0, 3).map(row => `<article class="home-case-card"><h3><a href="${e(casePath(normalizeLocale(row.language_code), row.post_group_id))}">${e(row.title)}</a></h3><p>${e(cleanSummary(row.meta_description))}</p></article>`).join('')}</div>`;
  slot.childNodes = parseFragment(kind === 'home' ? homeCards : cards + `<nav><a href="/${e(locale)}/archive">${e(ro?.cases || 'Case Studies')}</a> · <a href="/${e(locale)}/explore">${e(ro?.explore || 'Explore')}</a> · <a href="/${e(locale)}/feed.xml">RSS</a></nav>`).childNodes;
  for (const child of slot.childNodes) child.parentNode = slot;
  const script = parseFragment(`<script>window.__CASE_LIST__=${jsonScript({ locale, rows: selected })};</script>`).childNodes[0];
  script.parentNode = body; body.childNodes.push(script);
  if (kind === 'home' && publicCatalog) {
    const publicSlot = find(tree, node => node.attrs?.some(attr => attr.name === 'data-live-public-list'));
    if (!publicSlot) throw new Error('LIVE_PUBLIC_SLOT_MISSING');
    publicSlot.childNodes = parseFragment(renderHomePublic(publicCatalog, locale)).childNodes;
    for (const child of publicSlot.childNodes) child.parentNode = publicSlot;
    const publicScript = parseFragment(`<script>window.__HOME_PUBLIC__=${jsonScript(publicCatalog)};</script>`).childNodes[0];
    publicScript.parentNode = body; body.childNodes.push(publicScript);
  }
  return serialize(tree).replace('</head>', `<link rel="alternate" type="application/rss+xml" title="Smart JSA Bridge" href="/${e(locale)}/feed.xml"></head>`);
}
export function createContentIndexHandler({ fetcher = fetch, readTemplate = (locale, kind) => readFile(new URL(`../.cache/content-shells/${locale}-${kind}.html`, import.meta.url), 'utf8') } = {}) {
  return async (req, res) => {
    const { lng: locale, kind = 'home' } = req.query || {};
    if (!SUPPORTED_LANGS.includes(locale) || !['home', 'archive'].includes(kind)) { sendContent(req, res, 'Not found', { status: 404 }); return; }
    try {
      const [rows, template, publicCatalog] = await Promise.all([
        readAllPublic('case_studies', { select: CASE_SUMMARY_FIELDS, language_code: 'in.(' + getCaseLanguages(locale).join(',') + ')' }, fetcher),
        readTemplate(locale, kind),
        kind === 'home' ? readHomePublic(locale, fetcher) : null,
      ]);
      sendContent(req, res, renderIndexHtml(template, rows, locale, kind, publicCatalog));
    } catch { sendUnavailable(req, res); }
  };
}
export default createContentIndexHandler();
