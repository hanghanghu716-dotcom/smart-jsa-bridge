import { exploreCountry, countryLabel } from '../src/utils/publicCountry.js';
import { readFile } from 'node:fs/promises';
import { PUBLIC_JSA_FIELDS, publicJsaView, publicSortColumn } from '../src/utils/publicJsa.js';
import { exploreQuery, exploreSearch } from '../src/utils/discovery.js';
import { getPublicUi } from '../src/locales/publicUi.js';
import { getDiscoveryUi } from '../src/locales/discoveryUi.js';
import { SUPPORTED_LANGS, getLanguageTag } from '../src/locales/config.js';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const publicBase='https://aajvezmhyrdawxxbulqz.supabase.co';
export const publicKey='sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh';
export function renderExploreHtml(shell,result,locale,query,failed=false){
 const e=escapeHtml,ui=getPublicUi(locale),d=getDiscoveryUi(locale),rows=result.rows.map(publicJsaView).filter(Boolean);
 const title=ui.title+' | Smart JSA Bridge',canonical=`https://smartjsabridge.com/${locale}/explore${exploreSearch({page:query.page})}`;
 const noindex=failed||!rows.length||Boolean(query.search||query.tags.length||query.sort!=='latest'||query.country);
 const link=p=>`/${locale}/explore${exploreSearch({...query,page:p})}`;
 const body=`<main><h1>${e(ui.title)}</h1><p>${e(ui.intro)}</p>${failed?`<p role="alert">${e(ui.error)}</p>`:`<p>${result.total}</p><section>${rows.map(row=>`<article><h2><a href="/${e(locale)}/public-jsa/${e(row.id)}">${e(row.title)}</a></h2><p>${e(countryLabel(row.public_country,locale))}</p><p>${e(ui.steps)}: ${row.analysis_data.length}</p><p>${e(row.analysis_data.map(s=>s.proc.stepTitle).join(' · '))}</p><p>${e(row.tags.join(' · '))}</p><p>${e(ui.views)}: ${row.view_count} · ${e(ui.reuses)}: ${row.reuse_count} · ${e(ui.scraps)}: ${row.scrap_count}</p></article>`).join('')}</section><nav>${query.page>0?`<a rel="prev" href="${e(link(query.page-1))}">${e(d.previous)}</a>`:''}${result.hasMore?`<a rel="next" href="${e(link(query.page+1))}">${e(d.next)}</a>`:''}</nav>`}</main>`;
 const bootstrap=JSON.stringify({locale,query,...result,rows}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 return shell.replace(/<html[^>]*>/,`<html lang="${e(getLanguageTag(locale))}" dir="${locale.startsWith('ar')?'rtl':'ltr'}">`).replace('</head>',`<title data-rh="true">${e(title)}</title><meta data-rh="true" name="description" content="${e(ui.intro)}"><meta data-rh="true" name="robots" content="${noindex?'noindex':'index'},follow"><link data-rh="true" rel="canonical" href="${e(canonical)}"></head>`).replace('<div id="root"></div>',`<div id="root">${body}</div>`).replace('</body>',`<script>window.__PUBLIC_EXPLORE__=${bootstrap};</script></body>`);
}
export function createExploreHandler({fetcher=fetch,readShell=()=>readFile(new URL('../dist/public-jsa-shell.html',import.meta.url),'utf8')}={}){
 return async(req,res)=>{
  for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  const locale=SUPPORTED_LANGS.includes(req.query?.lng)?req.query.lng:'en-US';
  const params=new URLSearchParams();for(const [key,value]of Object.entries(req.query||{}))for(const v of Array.isArray(value)?value:[value])params.append(key,v);
  const query=exploreQuery(params);let result={rows:[],total:0,hasMore:false},failed=false;
  try{
   if(!SUPPORTED_LANGS.includes(req.query?.lng)){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');res.end(renderExploreHtml(await readShell(),result,locale,query,true));return;}
   const p=new URLSearchParams({select:PUBLIC_JSA_FIELDS,is_public:'eq.true',order:publicSortColumn(query.sort)+'.desc,id.asc',offset:String(query.page*24),limit:'24'});
   const country=exploreCountry(query.country,locale);if(country)p.set('public_country','eq.'+country);
   if(query.search.trim())p.set('title','ilike.%'+query.search.trim().replace(/[\\%_]/g,'\\$&')+'%');
   if(query.tags.length)p.set('tags','cs.{'+query.tags.map(tag=>JSON.stringify(tag)).join(',')+'}');
   const response=await fetcher(`${publicBase}/rest/v1/public_jsa_catalog?${p}`,{headers:{apikey:publicKey,Prefer:'count=exact'},cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('READ_FAILED');
   const rows=await response.json(),count=Number(response.headers.get('content-range')?.split('/')[1]);
   if(!Array.isArray(rows)||!Number.isFinite(count))throw Error('INVALID_RESULT');
   result={rows:rows.map(publicJsaView).filter(Boolean),total:count,hasMore:(query.page+1)*24<count};
  }catch{failed=true;}
  res.statusCode=failed?503:200;
  try{res.end(renderExploreHtml(await readShell(),result,locale,query,failed));}catch{res.statusCode=503;res.setHeader('X-Robots-Tag','noindex');res.end('Temporarily unavailable');}
 };
}
export default createExploreHandler();
