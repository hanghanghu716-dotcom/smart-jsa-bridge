import { discoveryTopics } from '../src/utils/discoveryTopics.js';
import { discoveryToolsUi } from '../src/locales/discoveryToolsUi.js';
import { pageWindow } from '../src/utils/pagination.js';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';
import { getPaginationUi } from '../src/locales/paginationUi.js';
import { getOperatorUi } from '../src/locales/operatorUi.js';
import { exploreCountry, countryLabel } from '../src/utils/publicCountry.js';
import { exploreIndexable } from '../src/utils/exploreIndexing.js';
import { readFile } from 'node:fs/promises';
import { PUBLIC_JSA_FIELDS, publicJsaView, publicSortColumn } from '../src/utils/publicJsa.js';
import { exploreQuery, exploreSearch } from '../src/utils/discovery.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { SUPPORTED_LANGS, getLanguageTag } from '../src/locales/config.js';
import { exploreCardTags, exploreExcerpt, exploreEvidence } from '../src/utils/explorePresentation.js';
import { getExploreQualityUi } from '../src/locales/exploreQualityUi.js';
import { getExploreViewUi } from '../src/locales/exploreViewUi.js';
import { getPublicCountryUi } from '../src/locales/publicCountryUi.js';
import { EXPLORE_VIEWS, exploreView, explorePageSize, changeExploreView } from '../src/utils/exploreView.js';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const {url:publicBase,key:publicKey}=getPublicSupabaseConfig();

// One bounded retry for transient upstream failures; never substitute an empty
// successful page when the catalog cannot be read.
async function readCatalog(fetcher,url){
 for(let attempt=0;attempt<2;attempt++){
  let response;
  try{
   response=await fetcher(url,{headers:{apikey:publicKey,Prefer:'count=exact'},cache:'no-store',signal:AbortSignal.timeout(8000)});
  }catch(error){if(attempt===1)throw error;}
  if(response){
   if(response.ok||response.status<500||attempt===1)return response;
   await response.body?.cancel();
  }
  await new Promise(resolve=>setTimeout(resolve,250));
 }
}

export function renderExplorePagination(total, current, locale, link) {
 const {page,count,start,end,pages}=pageWindow(current,total),ui=getPaginationUi(locale),e=escapeHtml;
 if(count<=1)return '';
 const arrow=(last=false,forward=false)=>`<svg class="pagination-arrow${forward?' is-forward':''}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/>${last?'<path d="M5 5v14"/>':''}</svg>`;
 const control=(target,label,content,kind,disabled=false)=>{
  const attrs=`class="list-pagination-control list-pagination-${kind}" aria-label="${e(label)}" aria-controls="explore-results"${kind==='number'&&target===page?' aria-current="page"':''}`;
  return disabled?`<span ${attrs} aria-disabled="true">${content}</span>`:`<a ${attrs}${target===page-1?' rel="prev"':target===page+1?' rel="next"':''} href="${e(link(target-1))}">${content}</a>`;
 };
 return `<nav class="list-pagination explore-pagination" aria-label="${e(ui.label)}" dir="${locale.startsWith('ar')?'rtl':'ltr'}">${control(1,ui.first,arrow(true),'first',page===1)}${control(Math.max(1,start-15),ui.previous,arrow(),'previous',start===1)}<div class="list-pagination-numbers">${pages.map(p=>control(p,ui.page.replace('{page}',p),p,'number')).join('')}</div>${control(end+1,ui.next,arrow(false,true),'next',end===count)}${control(count,ui.last,arrow(true,true),'last',page===count)}</nav>`;
}

export function renderExploreHtml(shell,result,locale,query,failed=false){
 const e=escapeHtml,ui=getPublicUi(locale),viewUi=getExploreViewUi(locale),view=exploreView(query.view),pageSize=explorePageSize(view),rows=result.rows.map(publicJsaView).filter(Boolean).slice(0,pageSize);
 const title=ui.title+' | Smart JSA Bridge',canonical=`https://smartjsabridge.com/${locale}/explore${exploreSearch({page:query.page,view})}`;
 const noindex=!exploreIndexable(rows,query,failed);
 const link=p=>`/${locale}/explore${exploreSearch({...query,page:p})}`;
 const cards=rows.map(row=>{
  const excerpt=view==='large'?exploreExcerpt(row):'',labels=exploreCardTags(row,locale).slice(0,view==='small'?3:5),contentLang=getLanguageTag(row.public_locale||locale);
  return `<article class="jsa-card explore-card">${row.is_operator?`<span>${e(getOperatorUi(locale).badge)}</span>`:''}<h2 lang="${e(contentLang)}"><a href="/${e(locale)}/public-jsa/${e(row.id)}">${e(row.title)}</a></h2><p>${e(countryLabel(row.public_country,locale))}</p><p>${e(ui.steps)}: ${row.analysis_data.length}</p>${excerpt?`<div class="explore-excerpt"><span>${e(getExploreQualityUi(locale).excerpt)}</span><p data-explore-excerpt lang="${e(contentLang)}" dir="auto">${e(excerpt)}</p></div>`:''}${view==='large'?`<dl class="explore-evidence" lang="${e(contentLang)}">${exploreEvidence(row).map(item=>`<div><dt lang="${e(getLanguageTag(locale))}">${e(discoveryToolsUi(locale)[item.key])}</dt><dd dir="auto">${e(item.text)}</dd></div>`).join('')}</dl>`:''}<div class="explore-tags">${labels.map(({tag,label})=>`<a data-explore-tag href="/${e(locale)}/explore${e(exploreSearch({...query,page:0,tags:[tag]}))}">#${e(label)}</a>`).join('')}</div><p>${e(ui.views)}: ${row.view_count} · ${e(ui.reuses)}: ${row.reuse_count} · ${e(ui.scraps)}: ${row.scrap_count}</p></article>`;
 }).join('');
 const countryUi=getPublicCountryUi(locale);
 const details=`<table><caption class="explore-sr-only">${e(ui.title)}</caption><thead><tr>${[viewUi.title,countryUi.country,viewUi.date,ui.steps,ui.views,ui.reuses,ui.scraps,viewUi.actions].map(label=>`<th scope="col">${e(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row" class="explore-details-title"><a lang="${e(getLanguageTag(row.public_locale||locale))}" href="/${e(locale)}/public-jsa/${e(row.id)}">${e(row.title)}</a></th>${[[countryUi.country,countryLabel(row.public_country,locale)],[viewUi.date,new Date(row.created_at).toLocaleDateString(getLanguageTag(locale))],[ui.steps,row.analysis_data.length],[ui.views,row.view_count],[ui.reuses,row.reuse_count],[ui.scraps,row.scrap_count]].map(([label,value])=>`<td data-label="${e(label)}">${e(value)}</td>`).join('')}<td class="explore-details-actions"></td></tr>`).join('')}</tbody></table>`;
 const toolbar=`<div class="explore-view-toolbar"><div class="explore-view-switch" role="group" aria-label="${e(viewUi.view)}">${Object.entries(EXPLORE_VIEWS).map(([mode,count])=>`<a data-explore-view="${mode}"${mode===view?' aria-current="true"':''} href="/${e(locale)}/explore${e(exploreSearch(changeExploreView(query,mode)))}"><span>${e(viewUi[mode])}</span><small>${count}</small></a>`).join('')}</div><span class="explore-page-size">${e(viewUi.perPage.replace('{count}',pageSize))}</span></div>`;
 const topics=`<nav class="discovery-topic-nav" aria-label="${e(discoveryToolsUi(locale).topics)}"><details><summary>${e(discoveryToolsUi(locale).topics)}</summary><ul>${discoveryTopics(rows,locale,query).map(item=>`<li><a href="/${e(locale)}${e(item.href)}">${e(item.label)}</a></li>`).join('')}</ul></details></nav>`;
 const body=`<div class="jsa-workspace explore-page"><main class="jsa-container"><h1>${e(ui.title)}</h1><p>${e(ui.intro)}</p>${topics}${toolbar}${failed?`<p role="alert">${e(ui.error)}</p>`:`<p>${result.total}</p><section id="explore-results" class="${view==='details'?'explore-details':'jsa-card-grid explore-grid explore-view-'+view}">${view==='details'?details:cards}</section>${renderExplorePagination(Math.ceil(result.total/pageSize),query.page+1,locale,link)}`}</main></div>`;
 const bootstrap=JSON.stringify({locale,query,...result,rows}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return shell.replace(/<html[^>]*>/,`<html lang="${e(getLanguageTag(locale))}" dir="${locale.startsWith('ar')?'rtl':'ltr'}">`).replace('</head>',`<title data-rh="true">${e(title)}</title><meta data-rh="true" name="description" content="${e(ui.intro)}"><meta data-rh="true" name="robots" content="${noindex?'noindex':'index'},follow"><link data-rh="true" rel="canonical" href="${e(canonical)}"></head>`).replace('<div id="root"></div>',`<div id="root">${body}</div>`).replace('</body>',`<script>window.__PUBLIC_EXPLORE__=${bootstrap};</script></body>`);
}
export function createExploreHandler({fetcher=fetch,readShell=()=>readFile(new URL('../dist/public-jsa-shell.html',import.meta.url),'utf8')}={}){
 return async(req,res)=>{
  for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  const locale=SUPPORTED_LANGS.includes(req.query?.lng)?req.query.lng:'en-US';
  const params=new URLSearchParams();for(const [key,value]of Object.entries(req.query||{}))for(const v of Array.isArray(value)?value:[value])params.append(key,v);
  const query=exploreQuery(params),pageSize=explorePageSize(query.view);let result={rows:[],total:0,hasMore:false},failed=false;
  try{
   if(!SUPPORTED_LANGS.includes(req.query?.lng)){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');res.end(renderExploreHtml(await readShell(),result,locale,query,true));return;}
   const p=new URLSearchParams({select:PUBLIC_JSA_FIELDS,is_public:'eq.true',order:publicSortColumn(query.sort)+'.desc,id.asc',offset:String(query.page*pageSize),limit:String(pageSize)});
   if(query.author==='operator')p.set('is_operator','eq.true');
   const country=exploreCountry(query.country,locale);if(country)p.set('public_country','eq.'+country);
   if(query.search.trim())p.set('title','ilike.%'+query.search.trim().replace(/[\\%_]/g,'\\$&')+'%');
   if(query.tags.length)p.set('tags','cs.{'+query.tags.map(tag=>JSON.stringify(tag)).join(',')+'}');
   const response=await readCatalog(fetcher,`${publicBase}/rest/v1/public_jsa_catalog?${p}`);
   if(!response.ok)throw Error('READ_FAILED');
   const rows=await response.json(),count=Number(response.headers.get('content-range')?.split('/')[1]);
   if(!Array.isArray(rows)||!Number.isFinite(count))throw Error('INVALID_RESULT');
   result={rows:rows.map(publicJsaView).filter(Boolean),total:count,hasMore:(query.page+1)*pageSize<count};
  }catch{failed=true;}
  res.statusCode=failed?503:200;
  try{res.end(renderExploreHtml(await readShell(),result,locale,query,failed));}catch{res.statusCode=503;res.setHeader('X-Robots-Tag','noindex');res.end('Temporarily unavailable');}
 };
}
export default createExploreHandler();

