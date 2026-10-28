import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageLink } from '../hooks/useLanguage';
import { LANGUAGE_OPTIONS, getLanguageTag } from '../locales/config';
import { resourceHubUi } from '../locales/resourceHubUi';
import { getGuideTitle } from '../locales/discoveryUi';
import { hubQuery, hubSearch, RESOURCE_KINDS, RESOURCE_TOPICS } from '../utils/resourceHub';
import { loadResources, loadResourceSearch, followResources } from '../services/resourceHubService';
import { communityHomeUi } from '../locales/communityHomeUi';
import PublicSiteHeader from '../components/PublicSiteHeader';
import CommunityFooter from '../components/CommunityFooter';
import SEO from '../components/SEO';
import '../styles/resource-hub.css';

export default function ResourceHub(){
 const {i18n}=useTranslation(),locale=i18n.language,ui=resourceHubUi(locale),location=useLocation();
 const search=location.pathname.endsWith('/search'),[params,setParams]=useSearchParams(),query=hubQuery(params),key=locale+location.pathname+params.toString();
 const {user}=useContext(AuthContext),[follows,setFollows]=useState([]),[following,setFollowing]=useState(false),[pending,setPending]=useState(false),[followError,setFollowError]=useState(false);
 const [result,setResult]=useState(()=>{const b=globalThis.window?.__RESOURCE_HUB__;return b?.locale===locale&&b?.mode===(search?'search':'resources')&&JSON.stringify(b.query)===JSON.stringify(query)?{key,data:b.data}:{key:'',data:null};});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;const task=search?loadResourceSearch(locale,query):loadResources(locale,query,following&&Boolean(user));task.then(data=>{if(live)setResult({key,data});}).catch(()=>{if(live)setResult({key,error:true});});return()=>{live=false;};},[key,search,following,user?.id,retry]);
 useEffect(()=>{let live=true;setFollows([]);if(user)followResources().then(data=>{if(live)setFollows(data);}).catch(()=>{if(live)setFollowError(true);});return()=>{live=false;};},[user?.id]);
 const change=values=>setParams(hubSearch({...query,...values,page:0}).slice(1));
 const data=result.key===key?result.data:null,error=result.key===key&&result.error;
 const followed=follows.some(f=>f.locale===locale&&f.topic===query.topic);
 const toggle=async()=>{setPending(true);setFollowError(false);try{setFollows(await followResources(followed?'unfollow':'follow',locale,query.topic));setRetry(x=>x+1);}catch{setFollowError(true);}finally{setPending(false);}};
 const pageLink=page=>hubSearch({...query,page});
 return <div className="resource-hub" dir={i18n.dir()}><SEO noIndex pageTitle={(search?ui.search:ui.title)+' | Smart JSA Bridge'} pageDescription={ui.intro}/><PublicSiteHeader/>
 <main><header className="resource-heading"><div><h1>{search?ui.search:ui.title}</h1><p>{ui.intro}</p></div><select aria-label={ui.directory} value={locale} onChange={e=>{window.location.assign('/'+e.target.value+(search?'/search':'/resources')+hubSearch({...query,page:0}));}}>{!LANGUAGE_OPTIONS.some(o=>o.code===locale)&&<option value={locale}>English (Canada)</option>}{LANGUAGE_OPTIONS.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}</select></header>
 <nav className="resource-tabs"><LanguageLink to="/search" aria-current={search?'page':undefined}>{ui.search}</LanguageLink><LanguageLink to="/resources" aria-current={!search?'page':undefined}>{ui.updates}</LanguageLink></nav>
 <form className="resource-search" role="search" onSubmit={e=>{e.preventDefault();change({q:new FormData(e.currentTarget).get('q')});}}><input key={query.q} name="q" type="search" defaultValue={query.q} placeholder={ui.query} aria-label={ui.query} maxLength={160}/><button>{communityHomeUi(locale).search}</button></form>
 {search?<nav className="resource-tabs">{['all','jsa','case','guide','resource'].map(type=><button key={type} aria-pressed={query.type===type} onClick={()=>change({type})}>{ui[type]}</button>)}</nav>:<>
 <div className="resource-filters"><label>{ui.updates}<select value={query.kind} onChange={e=>change({kind:e.target.value})}><option value="">{ui.all}</option>{RESOURCE_KINDS.map(k=><option key={k} value={k}>{ui[k]}</option>)}</select></label><label>{ui.guide}<select value={query.topic} onChange={e=>change({topic:e.target.value})}><option value="">{ui.all}</option>{RESOURCE_TOPICS.map(t=><option key={t} value={t}>{getGuideTitle(t,locale)}</option>)}</select></label></div>
 <div className="resource-subscribe">{query.topic&&(user?<button disabled={pending} onClick={toggle}>{followed?ui.unfollow:ui.follow}</button>:<LanguageLink to={'/login?next='+encodeURIComponent('/'+locale+'/resources'+location.search)}>{ui.login}</LanguageLink>)}{user&&<label><input type="checkbox" checked={following} onChange={e=>{setFollowing(e.target.checked);change({});}}/>{ui.following}</label>}<small>{ui.subscribeNote}</small>{followError&&<p role="alert">{ui.error}</p>}</div></>}
 {error?<p role="alert">{ui.error} <button onClick={()=>setRetry(n=>n+1)}>↻</button></p>:!data?<p role="status">{ui.loading}</p>:search?<div className="resource-results">{data.groups.map(group=><section key={group.type}><header><h2>{ui[group.type]}</h2>{query.type==='all'&&group.more&&<button onClick={()=>change({type:group.type})}>{ui.all} →</button>}</header>{group.rows.length?<ul>{group.rows.map(row=><li key={row.href}><a href={row.href} lang={getLanguageTag(row.language)} dir="auto" {...(row.external?{target:'_blank',rel:'noopener noreferrer'}:{})}>{row.title}{row.external?' ↗':''}</a>{row.source&&<small>{row.source}</small>}</li>)}</ul>:<p>{ui.noResults}</p>}</section>)}</div>:<>
 <section className="resource-cards" aria-live="polite">{data.items.map(item=><article key={item.id}><div className="resource-meta">{ui[item.kind]} · {item.source}</div><h2 lang={getLanguageTag(item.locale)} dir="auto"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></h2>{item.summary&&<p lang={getLanguageTag(item.locale)} dir="auto">{item.summary}</p>}<dl>{[['sourceDate',item.source_date],['eventDate',item.event_date],['effectiveDate',item.effective_date],['reviewed',item.checked_at?.slice(0,10)]].filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{ui[k]}</dt><dd><time dateTime={v}>{v}</time></dd></div>)}</dl><div className="resource-links"><a href={item.url} target="_blank" rel="noopener noreferrer">{ui.original} ↗</a><LanguageLink to={'/guideline/'+item.topic}>{getGuideTitle(item.topic,locale)}</LanguageLink>{item.search_term&&<LanguageLink to={'/search'+hubSearch({q:item.search_term,type:'all'})}>{ui.related} →</LanguageLink>}</div>{item.attribution&&<p className="resource-attribution" dir="auto">{item.attribution}</p>}{item.policy_url&&<a className="resource-policy" href={item.policy_url} target="_blank" rel="noopener noreferrer">{ui.policy}</a>}</article>)}</section>{!data.items.length&&<p>{ui.empty}</p>}
 <section className="resource-directory"><h2>{ui.directory}</h2><p>{ui.rights}</p><ul>{data.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>{s.policy_url&&<a href={s.policy_url} target="_blank" rel="noopener noreferrer">{ui.policy}</a>}</li>)}</ul></section></>}
 {data&&(!search||query.type!=='all')&&<nav className="resource-pages" aria-label={ui.search}>{query.page>0&&<LanguageLink to={(search?'/search':'/resources')+pageLink(query.page-1)}>{ui.previous}</LanguageLink>}<span>{query.page+1}</span>{(search?data.groups.some(g=>g.more):data.has_more)&&<LanguageLink to={(search?'/search':'/resources')+pageLink(query.page+1)}>{ui.next}</LanguageLink>}</nav>}
 </main><CommunityFooter/></div>;
}
