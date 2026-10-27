import { caseThumbnail, safeCaseImage } from '../src/utils/caseThumbnail.js';
import { loadArchiveImages } from '../src/utils/archiveImages.js';
import { archiveQuery, archiveSearch, archiveResults, ARCHIVE_FIELDS } from '../src/utils/archiveDiscovery.js';
import { renderArchiveCatalog } from '../server/archive-catalog.js';
import { readFile } from 'node:fs/promises';
import { parse, parseFragment, serialize } from 'parse5';
import { SUPPORTED_LANGS, getCaseLanguages, normalizeLocale, selectLocalizedCases } from '../src/locales/config.js';
import { cleanSummary } from '../src/utils/content.js';
import { CASE_SUMMARY_FIELDS, casePath, escapeHtml as e, jsonScript, readPublic, readAllPublic, sendContent, sendUnavailable } from '../server/public-content.js';
import { readHomePublic, renderHomePublic } from '../server/home-public.js';

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const match = find(child, predicate); if (match) return match; }
}
export function renderIndexHtml(template, rows, locale, kind, publicCatalog = null, query = archiveQuery()) {
  const tree = parse(template);
  const slot = find(tree, node => node.attrs?.some(attr => attr.name === 'data-live-case-list'));
  const body = find(tree, node => node.tagName === 'body');
  if (!slot || !body) throw new Error('LIVE_CASE_SLOT_MISSING');
  const selected = selectLocalizedCases(rows, locale);
  const homeCards = `<div class="home-case-grid">${selected.slice(0, 3).map(row => `<article class="home-case-card">${safeCaseImage(row.thumbnail) ? `<a class="home-case-image" href="${e(casePath(locale,row.post_group_id))}" tabindex="-1" aria-hidden="true"><img src="${e(safeCaseImage(row.thumbnail))}" alt="" loading="lazy" decoding="async" width="1536" height="1024"></a>` : ''}<h3><a href="${e(casePath(normalizeLocale(row.language_code), row.post_group_id))}">${e(row.title)}</a></h3><p>${e(cleanSummary(row.meta_description))}</p></article>`).join('')}</div>`;
  slot.childNodes = parseFragment(kind === 'home' ? homeCards : renderArchiveCatalog(selected, locale, query)).childNodes;
  for (const child of slot.childNodes) child.parentNode = slot;
  slot.attrs = slot.attrs.map(attr => attr.name === 'aria-busy' ? { ...attr, value: 'false' } : attr);
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
  if (kind === 'archive') {
    const canonical = find(tree,node => node.tagName === 'link' && node.attrs?.some(a => a.name === 'rel' && a.value === 'canonical'));
    if (canonical) {const href=canonical.attrs.find(a=>a.name==='href');if(href)href.value='https://smartjsabridge.com/'+locale+'/archive'+archiveSearch({page:archiveResults(selected,query,locale).page});}
    if (query.search || query.pdf || query.year || query.sort !== 'latest') {
      const robots = find(tree,node => node.tagName === 'meta' && node.attrs?.some(a=>a.name==='name' && a.value==='robots'));
      if (robots) robots.attrs.find(a=>a.name==='content').value='noindex,follow';
      else {const head=find(tree,node=>node.tagName==='head');const meta=parseFragment('<meta name="robots" content="noindex,follow">').childNodes[0];meta.parentNode=head;head.childNodes.push(meta);}
    }
  }
  return serialize(tree).replace('</head>', `<link rel="alternate" type="application/rss+xml" title="Smart JSA Bridge" href="/${e(locale)}/feed.xml"></head>`);
}
export function createContentIndexHandler({ fetcher = fetch, readTemplate = (locale, kind) => readFile(new URL(`../.cache/content-shells/${locale}-${kind}.html`, import.meta.url), 'utf8') } = {}) {
  return async (req, res) => {
    const { lng: locale, kind = 'home' } = req.query || {};
    if (!SUPPORTED_LANGS.includes(locale) || !['home', 'archive'].includes(kind)) { sendContent(req, res, 'Not found', { status: 404 }); return; }
    try {
      const [rows, template, publicCatalog] = await Promise.all([
        readAllPublic('case_studies', { select: kind === 'archive' ? ARCHIVE_FIELDS : CASE_SUMMARY_FIELDS, language_code: 'in.(' + getCaseLanguages(locale).join(',') + ')' }, fetcher),
        readTemplate(locale, kind),
        kind === 'home' ? readHomePublic(locale, fetcher) : null,
      ]);
      let displayRows=rows;
      const query=archiveQuery(new URLSearchParams(req.query));
      if(kind==='home') {
        const featured=selectLocalizedCases(rows,locale).slice(0,3), ids=featured.map(row=>row.id).filter(id=>/^[a-f0-9-]{36}$/i.test(id));
        if(ids.length) {try {
          const media=await readPublic('case_studies',{select:'id,content_md',id:'in.('+ids.join(',')+')',limit:'3'},fetcher);
          const images=new Map(media.map(row=>[row.id,caseThumbnail(row.content_md)]));
          displayRows=rows.map(row=>({...row,thumbnail:images.get(row.id)||''}));
        } catch { /* Image availability does not hide readable cases. */ }}
      }
      if(kind==='archive') {
        const visible=archiveResults(selectLocalizedCases(rows,locale),query,locale).rows;
        try {
          const signal=AbortSignal.timeout(8000);
          const media=await loadArchiveImages(visible,ids=>readPublic('case_studies',{select:'id,content_md',language_code:'in.('+getCaseLanguages(locale).join(',')+')',id:'in.('+ids.join(',')+')',limit:String(ids.length)},fetcher,{signal}));
          const images=new Map(media.map(row=>[row.id,row.thumbnail]));
          displayRows=rows.map(row=>images.has(row.id)?{...row,thumbnail:images.get(row.id)}:row);
        } catch { /* The client can retry image reads without replacing the article list. */ }
      }
      sendContent(req, res, renderIndexHtml(template, displayRows, locale, kind, publicCatalog, query));
    } catch { sendUnavailable(req, res); }
  };
}
export default createContentIndexHandler();
