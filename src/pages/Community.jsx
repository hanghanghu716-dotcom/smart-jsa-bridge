import { useEffect,useRef,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { LanguageLink } from '../hooks/useLanguage';
import { getCommunityUi } from '../locales/communityUi';
import { getLanguageTag } from '../locales/config';
import { communityAction,myCommunityData } from '../services/communityService';
import { validProjectId } from '../utils/publicJsa';
import ThemeSwitcher from '../components/ThemeSwitcher';
import SEO from '../components/SEO';
import { getCommunityPolicy } from '../locales/communityPolicy';
import PublicationFields from '../components/PublicationFields';
import DiscoveryAdmin from '../components/DiscoveryAdmin';
import { supabase } from '../supabaseClient';
import '../styles/community.css';
export default function Community(){
 const {i18n}=useTranslation(),ui={...getCommunityUi(i18n.language),...getCommunityPolicy(i18n.language)},location=useLocation();
 const [account,setAccount]=useState(undefined),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [category,setCategory]=useState(new URLSearchParams(location.search).has('project')?'safety':'general'),[detail,setDetail]=useState(''),[project,setProject]=useState(new URLSearchParams(location.search).get('project')||'');
 const [queue,setQueue]=useState([]),[selected,setSelected]=useState(''),[decision,setDecision]=useState('reviewing'),[reason,setReason]=useState('');
 const [publication,setPublication]=useState(''),[consent,setConsent]=useState(false),[context,setContext]=useState({});
 const pending=useRef(false);
 useEffect(()=>{let live=true;myCommunityData().then(async data=>{if(live)setAccount(data);if(data?.status.admin){const items=await communityAction('queue');if(live)setQueue(items);}}).catch(()=>{if(live)setMessage(ui.error);});return()=>{live=false;};},[refresh,ui.error]);
 const run=async fn=>{if(pending.current)return;pending.current=true;setBusy(true);setMessage('');try{await fn();setMessage(ui.saved);setRefresh(n=>n+1);}catch{setMessage(ui.error);}finally{pending.current=false;setBusy(false);}};
 const date=value=>new Date(value).toLocaleString(getLanguageTag(i18n.language));
 return <div className="jsa-workspace" dir={i18n.dir()}><SEO pageTitle={ui.hub+' | Smart JSA Bridge'} noIndex/><header className="jsa-nav"><LanguageLink to="/explore">Smart JSA Bridge</LanguageLink><ThemeSwitcher compact/></header><main className="jsa-container community-center"><h1>{ui.support}</h1><p>{ui.privateHelp}</p><p>{ui.freeCore}</p><p>{ui.orgControl}</p>
 {message&&<p role="status">{message}</p>}
 {account?.status.admin&&<DiscoveryAdmin/>}
 {account===null&&<LanguageLink to={'/login?next='+encodeURIComponent(location.pathname+location.search)}>{ui.login}</LanguageLink>}
 {account?.projects.length>0&&<details className="jsa-card community-policy"><summary>{ui.licensePending}</summary><select aria-label={ui.selectSteps} value={publication} onChange={e=>{setPublication(e.target.value);setConsent(false);setContext(account.projects.find(p=>p.id===e.target.value)?.publication_context||{});}}><option value="">—</option>{account.projects.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select>{publication&&<><PublicationFields consent={consent} onConsent={setConsent} context={context} onContext={setContext}/><button disabled={busy||!consent} onClick={()=>run(async()=>{const {data,error}=await supabase.from('jsa_projects').update({reuse_license:'community-v1',publication_context:context,updated_at:new Date().toISOString()}).eq('id',publication).eq('author_id',account.user.id).select('id').single();if(error||!data)throw error||Error('NOT_FOUND');setPublication('');setConsent(false);})}>{ui.send}</button></>}</details>}
 {account&&<><section className="jsa-card"><h2>{ui.send}</h2><form onSubmit={e=>{e.preventDefault();run(async()=>{await communityAction('request',project||null,{category,detail});setDetail('');});}}>
 <label>{ui.category}<select value={category} onChange={e=>setCategory(e.target.value)}>{['general','suggestion','privacy','copyright','safety','spam','appeal','access','erasure','correction'].map(key=><option value={key} key={key}>{ui[key]}</option>)}</select></label>
 <label>JSA ID<input value={project} onChange={e=>setProject(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></label>
 <label>{ui.detail}<textarea required minLength={10} maxLength={4000} value={detail} onChange={e=>setDetail(e.target.value)}/></label><button disabled={busy||detail.trim().length<10||Boolean(project&&!validProjectId(project))}>{ui.send}</button></form></section>
 <section className="jsa-card"><h2>{ui.requests}</h2>{account.requests.map(item=><article key={item.id}><strong>{ui[item.category]} · {ui[item.status]}</strong><p>{item.detail}</p><small>{date(item.created_at)} · {item.id}</small></article>)}<button disabled={busy} onClick={()=>run(async()=>{const data=await communityAction('export');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='smartjsa-my-documents.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);})}>{ui.exportData}</button></section>
 <section className="jsa-card"><h2>{ui.notices}</h2>{account.notices.map(item=><article key={item.id}><strong>{ui[item.action]||item.action}</strong><p>{item.reason}</p><small>{date(item.created_at)}</small>{item.project_id&&<button onClick={()=>{setCategory('appeal');setProject(item.project_id);window.scrollTo({top:0,behavior:'smooth'});}}>{ui.appeal}</button>}</article>)}</section>
 {account.status.admin&&<section className="jsa-card"><h2>{ui.manage}</h2><select aria-label={ui.manage} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">—</option>{queue.map(item=><option key={item.id} value={item.id}>{ui[item.category]} · {ui[item.status]} · {item.id.slice(0,8)}</option>)}</select>{queue.filter(item=>item.id===selected).map(item=><article key={item.id}><p>{item.detail}</p><p>{item.project_id}</p><small>{date(item.created_at)}</small></article>)}<form onSubmit={e=>{e.preventDefault();run(async()=>{await communityAction('decide',selected,{decision,reason});setReason('');});}}><select aria-label={ui.category} value={decision} onChange={e=>setDecision(e.target.value)}>{['reviewing','restrict','restore','resolve','decline'].map(key=><option value={key} key={key}>{ui[key]}</option>)}</select><label>{ui.reason}<textarea required minLength={10} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></label><button disabled={busy||!selected||reason.trim().length<10}>{ui.send}</button></form></section>}</>}
 <details className="jsa-card community-policy"><summary>{ui.scope}</summary><p>{ui.contextHint}</p><p>{ui.reuseTerms}</p><p>{ui.safetyHelp}</p><p>{ui.measurement}</p><p>{ui.pendingContact}</p><div className="jsa-toolbar"><LanguageLink to="/terms">{i18n.t("terms:heading")}</LanguageLink><LanguageLink to="/privacy">{i18n.t("privacy:heading.line1")}</LanguageLink></div></details>
 </main></div>;
}
