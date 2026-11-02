import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { LanguageLink } from '../hooks/useLanguage';
import { jobUi } from '../locales/jobUi';
import { jobQuery,jobSearch,jobStatus } from '../utils/jobs';
import { loadJobs } from '../services/jobService';
import { resourceHubUi } from '../locales/resourceHubUi';
import PublicSiteHeader from '../components/PublicSiteHeader';
import CommunityFooter from '../components/CommunityFooter';
import SEO from '../components/SEO';
import '../styles/resource-hub.css';
export default function Jobs(){
 const {i18n}=useTranslation(),locale=i18n.language,ui=jobUi(locale),[params,setParams]=useSearchParams(),query=jobQuery(params),key=locale+jobSearch(query);
 const [retry,setRetry]=useState(0),[now,setNow]=useState(Date.now());
 const [result,setResult]=useState(()=>{const b=globalThis.window?.__JOB_CATALOG__;return b?.locale===locale&&JSON.stringify(b.query)===JSON.stringify(query)?{key,data:b.data}:{key:'',data:null};});
 useEffect(()=>{let active=true;loadJobs(locale,query).then(data=>{if(active){setNow(Date.now());setResult({key,data});}}).catch(()=>{if(active)setResult({key,error:true});});return()=>{active=false;};},[key,retry]);
 // Re-evaluate deadlines while the page is open as well as on each server request.
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);const focus=()=>{setNow(Date.now());setRetry(n=>n+1);};window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};},[]);
 const data=result.key===key?result.data:null,change=values=>setParams(jobSearch({...query,...values,page:0}).slice(1));
 const items=data?.items.filter(item=>jobStatus(item,now)===query.status)||[];
 return <div className="resource-hub" dir={i18n.dir()}><SEO noIndex pageTitle={ui.title+' | Smart JSA Bridge'} pageDescription={ui.intro}/><PublicSiteHeader/><main>
 <header className="resource-heading"><div><h1>{ui.title}</h1><p>{ui.intro}</p></div></header>
 <nav className="resource-tabs"><LanguageLink to="/resources">{resourceHubUi(locale).updates}</LanguageLink><LanguageLink to="/jobs" aria-current="page">{ui.title}</LanguageLink></nav>
 <form className="resource-search" role="search" onSubmit={e=>{e.preventDefault();change({q:new FormData(e.currentTarget).get('q')});}}><input key={query.q} name="q" type="search" maxLength={120} defaultValue={query.q} aria-label={ui.search} placeholder={ui.search}/><button>{ui.search}</button></form>
 <nav className="resource-tabs">{['open','closed','unconfirmed'].map(status=><button key={status} aria-pressed={query.status===status} onClick={()=>change({status})}>{ui[status]}</button>)}</nav>
 <p className="resource-admin-note">{ui.notice}</p>
 {result.key===key&&result.error?<p role="alert">{ui.error} <button onClick={()=>setRetry(n=>n+1)}>↻</button></p>:!data?<p role="status">{ui.loading}</p>:<>
 <section className="resource-cards" aria-live="polite">{items.map(item=><article key={item.id}><div className="resource-meta">{ui[jobStatus(item,now)]} · {item.source}</div><h2 dir="auto"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></h2>
 <dl>{[['employer',item.employer],['location',item.location],['deadline',item.deadline_text||ui.unknown],['checked',new Date(item.verified_at).toLocaleString(i18n.language==='fr-CA-QC'?'fr-CA':i18n.language.startsWith('en-CA')?'en-CA':i18n.language)]].filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{ui[k]}</dt><dd dir="auto">{v}</dd></div>)}</dl>
 <a href={item.url} target="_blank" rel="noopener noreferrer">{ui.original} ↗</a></article>)}</section>
 {!items.length&&<p>{ui.empty}</p>}
 <nav className="resource-pages">{query.page>0&&<LanguageLink to={'/jobs'+jobSearch({...query,page:query.page-1})}>{ui.previous}</LanguageLink>}<span>{query.page+1}</span>{data.has_more&&<LanguageLink to={'/jobs'+jobSearch({...query,page:query.page+1})}>{ui.next}</LanguageLink>}</nav>
 <section className="resource-directory"><h2>{ui.sources}</h2>{!data.sources.some(s=>s.connected)&&<p>{ui.preparing}</p>}<ul>{data.sources.map(s=><li key={s.id}>{s.name}</li>)}</ul></section></>}
 </main><CommunityFooter/></div>;
}
