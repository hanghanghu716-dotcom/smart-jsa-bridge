import { readFile } from 'node:fs/promises';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';
import { readPublic,escapeHtml as e,jsonScript,sendContent,sendUnavailable } from '../server/public-content.js';
import { resourceHubUi } from '../src/locales/resourceHubUi.js';
import { getGuideTitle } from '../src/locales/discoveryUi.js';
import { getLanguageTag } from '../src/locales/config.js';
import { hubLocale,hubQuery,hubSearch } from '../src/utils/resourceHub.js';
import { searchResources } from '../src/utils/resourceSearch.js';
export function renderResourceHtml(shell,locale,mode,query,data){
 const ui=resourceHubUi(locale),search=mode==='search',path=`/${locale}/${search?'search':'resources'}`;
 const title=(search?ui.search:ui.title)+' | Smart JSA Bridge';
 const item=r=>`<li><a href="${e(r.href)}"${r.external?' target="_blank" rel="noopener noreferrer"':''}>${e(r.title)}</a></li>`;
 const body=`<div class="resource-hub" dir="${locale.startsWith('ar')?'rtl':'ltr'}"><main><a href="/${e(locale)}/">Smart JSA Bridge</a><h1>${e(search?ui.search:ui.title)}</h1><p>${e(ui.intro)}</p><nav><a href="/${locale}/search">${e(ui.search)}</a> · <a href="/${locale}/resources">${e(ui.updates)}</a></nav><form action="${path}" role="search"><input type="search" name="q" value="${e(query.q)}" aria-label="${e(ui.query)}"><button>${e(ui.search)}</button></form>${search?data.groups.map(g=>`<section><h2>${e(ui[g.type])}</h2><ul>${g.rows.map(item).join('')}</ul>${g.more?`<a href="${path}${e(hubSearch({...query,type:g.type,page:query.type==='all'?0:query.page+1}))}">${e(ui.next)}</a>`:''}</section>`).join(''):
 `<section>${data.items.map(r=>`<article><h2 lang="${e(getLanguageTag(r.locale))}"><a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${e(r.title)}</a></h2><p>${e(r.source)} · ${e(ui[r.kind])}</p>${r.summary?`<p>${e(r.summary)}</p>`:''}${[['sourceDate',r.source_date],['eventDate',r.event_date],['effectiveDate',r.effective_date],['reviewed',r.checked_at?.slice(0,10)]].filter(([,v])=>v).map(([k,v])=>`<p>${e(ui[k])}: <time datetime="${e(v)}">${e(v)}</time></p>`).join('')}<a href="/${locale}/guideline/${e(r.topic)}">${e(getGuideTitle(r.topic,locale))}</a>${r.search_term?` · <a href="/${locale}/search${e(hubSearch({q:r.search_term,type:'all'}))}">${e(ui.related)}</a>`:''}${r.attribution?`<p>${e(r.attribution)}</p>`:''}${r.policy_url?` · <a href="${e(r.policy_url)}" target="_blank" rel="noopener noreferrer">${e(ui.policy)}</a>`:''}</article>`).join('')||`<p>${e(ui.empty)}</p>`}</section><section><h2>${e(ui.directory)}</h2><p>${e(ui.rights)}</p><ul>${data.sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.name)}</a>${s.policy_url?` · <a href="${e(s.policy_url)}" target="_blank" rel="noopener noreferrer">${e(ui.policy)}</a>`:''}</li>`).join('')}</ul></section>${data.has_more?`<a href="${path}${e(hubSearch({...query,page:query.page+1}))}">${e(ui.next)}</a>`:''}`}${query.page?`<a href="${path}${e(hubSearch({...query,page:query.page-1}))}">${e(ui.previous)}</a>`:''}</main></div>`;
 return shell.replace(/<title[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta[^>]+name=["'](?:description|robots)["'][^>]*>/gi,'').replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
 .replace('<html lang="en">',`<html lang="${e(getLanguageTag(locale))}">`).replace('</head>',`<title>${e(title)}</title><meta name="description" content="${e(ui.intro)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://smartjsabridge.com${path}"></head>`)
 .replace('<div id="root"></div>',`<div id="root">${body}</div>`).replace('</body>',`<script>window.__RESOURCE_HUB__=${jsonScript({locale,mode,query,data})};</script></body>`);
}
export function createResourceHandler({fetcher=fetch,readShell=()=>readFile(new URL('../dist/public-jsa-shell.html',import.meta.url),'utf8')}={}){
 return async(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, follow');
  if(!['GET','HEAD'].includes(req.method||'GET')){sendContent(req,res,'Method not allowed',{status:405});return;}
  const locale=hubLocale(req.query?.lng),mode=req.query?.mode==='search'?'search':'resources';
  if(!locale){sendContent(req,res,'Not found',{status:404});return;}
  const params=new URLSearchParams();for(const k of ['q','kind','topic','page','type'])if(typeof req.query[k]==='string')params.set(k,req.query[k]);
  const query=hubQuery(params),config=getPublicSupabaseConfig();
  const resources=async()=>{
   const r=await fetcher(config.url+'/rest/v1/rpc/resource_hub',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({p_locale:locale,p_query:query.q,p_kind:query.kind,p_topic:query.topic,p_page:mode==='search'&&query.type==='all'?0:query.page}),signal:AbortSignal.timeout(8000)});
   if(!r.ok)throw Error('RESOURCE_READ_FAILED');return r.json();
  };
  try{const data=mode==='search'?await searchResources(locale,query,(table,p)=>readPublic(table,p,fetcher),resources):await resources();sendContent(req,res,renderResourceHtml(await readShell(),locale,mode,query,data));}catch{sendUnavailable(req,res);}
 };
}
export default createResourceHandler();
