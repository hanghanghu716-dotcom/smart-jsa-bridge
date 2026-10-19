import { publicCategoryLabel, publicDescription, contentDate, publicAuthor, publicDocumentSchema, structuredJson } from '../src/utils/publicDocumentPresentation.js';
import { getPublicDocumentUi } from '../src/locales/publicDocumentUi.js';
import { getProcedureDocumentUi } from '../src/locales/procedureDocumentUi.js';
import { getActionPlanUi } from '../src/locales/actionPlanUi.js';
import { getSocialUi } from '../src/locales/socialUi.js';
import { documentTextHtml } from '../server/document-text.js';
import {getOperatorUi} from '../src/locales/operatorUi.js';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';
import {documentStats,riskValue,publicHref,editorialHref} from '../src/utils/discovery.js';
import {getDiscoveryUi,getGuideTitle} from '../src/locales/discoveryUi.js';
import {getCommunityUi} from '../src/locales/communityUi.js';
import { readFile } from 'node:fs/promises';
import { publicJsaView, publicJsaQuality, PUBLIC_JSA_FIELDS, validProjectId } from '../src/utils/publicJsa.js';
import { SUPPORTED_LANGS, getLanguageTag } from '../src/locales/config.js';
import { getPublicUi } from '../src/locales/publicUi.js';

// Anonymous publishable key only. This endpoint never uses a service-role key.
const { url: base, key } = getPublicSupabaseConfig();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function renderPublicHtml(shell, row, locale, failed = false, links = null, author = null) {
  const ui = getPublicUi(locale), safe = publicJsaView(row);
  const title = (safe?.title || (failed ? ui.error : ui.unavailable)) + ' | Smart JSA Bridge';
  const description = publicDescription(safe) || ui.intro;
  const canonical = safe ? `https://smartjsabridge.com/${safe.public_locale || locale}/public-jsa/${safe.id}` : '';
  const index = publicJsaQuality(safe).indexable && safe.public_locale === locale;
  const metadata = `<title data-rh="true">${escape(title)}</title><meta data-rh="true" name="description" content="${escape(description)}"><meta data-rh="true" name="robots" content="${index ? 'index,follow' : 'noindex,follow'}"><meta data-rh="true" property="og:title" content="${escape(title)}"><meta data-rh="true" property="og:description" content="${escape(description)}">${canonical ? `<link data-rh="true" rel="canonical" href="${escape(canonical)}"><meta data-rh="true" property="og:url" content="${escape(canonical)}">` : ''}`;
  const d=getDiscoveryUi(locale),c=getCommunityUi(locale),stats=documentStats(safe);
  const list=(label,items)=>items?.length?`<section><h2>${escape(label)}</h2><ul>${items.map(item=>`<li><a href="${escape(publicHref(item,locale))}">${escape(item.title)}</a></li>`).join('')}</ul></section>`:'';
  const labels=getPublicDocumentUi(locale), procedure=getProcedureDocumentUi(safe?.public_locale || locale), action=getActionPlanUi(locale);
  const by=publicAuthor(author,safe?.author_id), date=contentDate(safe);
  const procedureHtml=safe?`<section class="procedure-document-inline" aria-labelledby="procedure-preview-title"><h2 id="procedure-preview-title">${escape(labels.procedurePreview)}</h2><h3>${escape(procedure.title)}</h3><table><thead><tr><th>${escape(procedure.number)}</th><th>${escape(procedure.step)}</th><th>${escape(procedure.detail)}</th></tr></thead><tbody>${safe.analysis_data.filter(step=>step.proc.stepTitle||step.proc.stepDetail).map((step,i)=>`<tr><td>${i+1}</td><td>${escape(step.proc.stepTitle)}</td><td>${documentTextHtml(step.proc.stepDetail)}</td></tr>`).join('')}</tbody></table></section>`:'';
  const body = `<main><a href="/${escape(locale)}/explore">${escape(ui.back)}</a><h1>${escape(safe?.title || (failed ? ui.error : ui.unavailable))}</h1>${safe ? `${by?`<p class="author-byline"><a href="/${escape(locale)}/authors/${escape(by.id)}">${escape(getSocialUi(locale).author)}: ${escape(by.nickname || by.id.slice(0,8))}</a></p>`:''}${date?`<p>${escape(labels.modified)}: <time datetime="${escape(date)}">${escape(date.slice(0,10))}</time></p>`:''}${procedureHtml}<h2>${escape(c.preview)}</h2>${safe.is_operator?`<span>${escape(getOperatorUi(locale).badge)}</span>`:''}<p>${escape(ui.notice)}</p><p>${escape(d.hazards)}: ${stats.hazards} · ${escape(d.controls)}: ${stats.controls}</p><p>${escape(d.categories)}: ${escape(stats.categories.map(value=>publicCategoryLabel(value,locale)).filter(Boolean).join(' · '))}</p>${['scope','region','limitations','sources'].filter(k=>safe.publication_context[k]).map(k=>`<section><h2>${escape(c[k])}</h2>${documentTextHtml(safe.publication_context[k])}</section>`).join('')}${safe.analysis_data.map(step => `<section><h2>${escape(step.proc?.stepTitle)}</h2>${documentTextHtml(step.proc?.stepDetail)}<p>${escape(d.frequency)}: ${riskValue(step.frequency)??''} · ${escape(d.severity)}: ${riskValue(step.severity)??''} · ${escape(d.risk)}: ${riskValue(step.riskLevel)??''}</p><ul>${(step.risks || []).map(risk => `<li><h3>${documentTextHtml(risk.factor)}</h3><p>${escape(publicCategoryLabel(risk.category,locale))}</p><strong>${escape(labels.current)}</strong>${documentTextHtml(risk.current_measure || risk.measure)}${risk.recommend_measure?`<strong>${escape(labels.recommended)}</strong>${documentTextHtml(risk.recommend_measure)}`:''}</li>`).join('')}</ul>${step.actionPlan?.additionalControls?`<section class="public-additional-controls"><h3>${escape(action.additionalControls)}</h3>${documentTextHtml(step.actionPlan.additionalControls)}</section>`:''}</section>`).join('')}${list(d.source,links?.source?[links.source]:[])}${list(d.derived,links?.children)}${list(d.related,links?.related)}${links?.editorial?.length?`<section><h2>${escape(d.editorial)}</h2><ul>${links.editorial.map(l=>`<li><a href="${escape(editorialHref(l,locale))}">${escape(l.title||(l.kind==='guide'?getGuideTitle(l.target,locale):d.caseStudy+' · '+l.target))}</a></li>`).join('')}</ul></section>`:''}` : ''}</main>`;
  const bootstrap = JSON.stringify(safe).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return shell.replace(/<html[^>]*>/, `<html lang="${escape(getLanguageTag(safe?.public_locale || locale))}">`)
    .replace('</head>', metadata + (safe && safe.public_locale ? `<script data-rh="true" type="application/ld+json">${structuredJson(publicDocumentSchema(safe,by,ui.back))}</script>` : '') + '</head>').replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace('</body>', `<script>window.__PUBLIC_JSA__=${bootstrap};</script><script>window.__PUBLIC_JSA_AUTHOR__=${structuredJson(by)};</script></body>`);
}

export function createPublicHandler({ fetcher = fetch, readShell = () => readFile(new URL('../dist/public-jsa-shell.html', import.meta.url), 'utf8') } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const { id, lng } = req.query || {};
    const locale = SUPPORTED_LANGS.includes(lng) ? lng : 'en-US';
    let row = null, failed = false, links = null, author = null;
    if (validProjectId(id) && SUPPORTED_LANGS.includes(lng)) {
      try {
        const params = new URLSearchParams({ select: PUBLIC_JSA_FIELDS, id: `eq.${id}`, is_public: 'eq.true', limit: '1' });
        const result = await fetcher(`${base}/rest/v1/public_jsa_catalog?${params}`, { headers: { apikey: key }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
        if (!result.ok) throw new Error('PUBLIC_READ_FAILED');
        row = publicJsaView((await result.json())[0]);
      } catch { failed = true; }
    }
    if(row){
      const lookup=async (rpc,body)=>{try {
        const result=await fetcher(`${base}/rest/v1/rpc/${rpc}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(3000),cache:'no-store'});
        return result.ok?await result.json():null;
      }catch{return null;}};
      [links,author]=await Promise.all([lookup('discovery_links',{p_id:id}),validProjectId(row.author_id)?lookup('author_action',{p_action:'author',p_id:row.author_id,p_payload:{}}):null]);
    }
    res.statusCode = failed ? 503 : row ? 200 : 404;
    try { res.end(renderPublicHtml(await readShell(), row, locale, failed, links, author)); }
    catch { res.statusCode = 503; res.setHeader('X-Robots-Tag', 'noindex'); res.end('<!doctype html><html><head><meta name="robots" content="noindex"></head><body>Temporarily unavailable</body></html>'); }
  };
}
export default createPublicHandler();

