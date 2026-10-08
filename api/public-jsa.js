import {documentStats,riskValue,publicHref,editorialHref} from '../src/utils/discovery.js';
import {getDiscoveryUi,getGuideTitle} from '../src/locales/discoveryUi.js';
import {getCommunityUi} from '../src/locales/communityUi.js';
import { readFile } from 'node:fs/promises';
import { publicJsaView, publicJsaQuality, PUBLIC_JSA_FIELDS, validProjectId } from '../src/utils/publicJsa.js';
import { SUPPORTED_LANGS, getLanguageTag } from '../src/locales/config.js';
import { getPublicUi } from '../src/locales/publicUi.js';

const base = 'https://aajvezmhyrdawxxbulqz.supabase.co';
// Anonymous publishable key only. This endpoint never uses a service-role key.
const key = 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function renderPublicHtml(shell, row, locale, failed = false, links = null) {
  const ui = getPublicUi(locale), safe = publicJsaView(row);
  const title = (safe?.title || (failed ? ui.error : ui.unavailable)) + ' | Smart JSA Bridge';
  const description = safe?.analysis_data.map(step => step.proc?.stepTitle).filter(Boolean).join(' · ').slice(0, 180) || ui.intro;
  const canonical = safe ? `https://smartjsabridge.com/${safe.public_locale || locale}/public-jsa/${safe.id}` : '';
  const index = publicJsaQuality(safe).indexable && safe.public_locale === locale;
  const metadata = `<title data-rh="true">${escape(title)}</title><meta data-rh="true" name="description" content="${escape(description)}"><meta data-rh="true" name="robots" content="${index ? 'index,follow' : 'noindex,follow'}"><meta data-rh="true" property="og:title" content="${escape(title)}"><meta data-rh="true" property="og:description" content="${escape(description)}">${canonical ? `<link data-rh="true" rel="canonical" href="${escape(canonical)}"><meta data-rh="true" property="og:url" content="${escape(canonical)}">` : ''}`;
  const d=getDiscoveryUi(locale),c=getCommunityUi(locale),stats=documentStats(safe);
  const list=(label,items)=>items?.length?`<section><h2>${escape(label)}</h2><ul>${items.map(item=>`<li><a href="${escape(publicHref(item,locale))}">${escape(item.title)}</a></li>`).join('')}</ul></section>`:'';
  const body = `<main><a href="/${escape(locale)}/explore">${escape(ui.back)}</a><h1>${escape(safe?.title || (failed ? ui.error : ui.unavailable))}</h1>${safe ? `<p>${escape(ui.notice)}</p><p>${escape(d.hazards)}: ${stats.hazards} · ${escape(d.controls)}: ${stats.controls}</p><p>${escape(d.categories)}: ${escape(stats.categories.join(' · '))}</p>${['scope','region','limitations','sources'].filter(k=>safe.publication_context[k]).map(k=>`<section><h2>${escape(c[k])}</h2><p>${escape(safe.publication_context[k])}</p></section>`).join('')}${safe.analysis_data.map(step => `<section><h2>${escape(step.proc?.stepTitle)}</h2><p>${escape(step.proc?.stepDetail)}</p><p>${escape(d.frequency)}: ${riskValue(step.frequency)??'—'} · ${escape(d.severity)}: ${riskValue(step.severity)??'—'} · ${escape(d.risk)}: ${riskValue(step.riskLevel)??'—'}</p><ul>${(step.risks || []).map(risk => `<li><h3>${escape(risk.factor)}</h3><p>${escape(risk.category)}</p><p>${escape(risk.current_measure || risk.measure)}</p><p>${escape(risk.recommend_measure)}</p></li>`).join('')}</ul></section>`).join('')}${list(d.source,links?.source?[links.source]:[])}${list(d.derived,links?.children)}${list(d.related,links?.related)}${links?.editorial?.length?`<section><h2>${escape(d.editorial)}</h2><ul>${links.editorial.map(l=>`<li><a href="${escape(editorialHref(l,locale))}">${escape(l.title||(l.kind==='guide'?getGuideTitle(l.target,locale):d.caseStudy+' · '+l.target))}</a></li>`).join('')}</ul></section>`:''}` : ''}</main>`;
  const bootstrap = JSON.stringify(safe).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return shell.replace(/<html[^>]*>/, `<html lang="${escape(getLanguageTag(safe?.public_locale || locale))}">`)
    .replace('</head>', metadata + '</head>').replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace('</body>', `<script>window.__PUBLIC_JSA__=${bootstrap};</script></body>`);
}

export function createPublicHandler({ fetcher = fetch, readShell = () => readFile(new URL('../dist/public-jsa-shell.html', import.meta.url), 'utf8') } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const { id, lng } = req.query || {};
    const locale = SUPPORTED_LANGS.includes(lng) ? lng : 'en-US';
    let row = null, failed = false, links = null;
    if (validProjectId(id) && SUPPORTED_LANGS.includes(lng)) {
      try {
        const params = new URLSearchParams({ select: PUBLIC_JSA_FIELDS, id: `eq.${id}`, is_public: 'eq.true', limit: '1' });
        const result = await fetcher(`${base}/rest/v1/public_jsa_catalog?${params}`, { headers: { apikey: key }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
        if (!result.ok) throw new Error('PUBLIC_READ_FAILED');
        row = publicJsaView((await result.json())[0]);
      } catch { failed = true; }
    }
    if(row){try{
      const response=await fetcher(`${base}/rest/v1/rpc/discovery_links`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_id:id}),signal:AbortSignal.timeout(5000),cache:'no-store'});
      if(response.ok)links=await response.json();
    }catch{/* Related content failure does not hide the readable document. */}}
    res.statusCode = failed ? 503 : row ? 200 : 404;
    try { res.end(renderPublicHtml(await readShell(), row, locale, failed, links)); }
    catch { res.statusCode = 503; res.setHeader('X-Robots-Tag', 'noindex'); res.end('<!doctype html><html><head><meta name="robots" content="noindex"></head><body>Temporarily unavailable</body></html>'); }
  };
}
export default createPublicHandler();
