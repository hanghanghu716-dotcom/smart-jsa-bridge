import { seoDiagnosticsUi } from '../locales/seoDiagnosticsUi';
import { getDiscoveryUi } from '../locales/discoveryUi';
import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicJsa } from '../services/publicJsaService';
import { publicationDiagnostics } from '../utils/publicationDiagnostics';
import { discoveryToolsUi } from '../locales/discoveryToolsUi';
import { getPublicUi } from '../locales/publicUi';
import { operations } from '../config/operations';
import PublicationReviewHints from './PublicationReviewHints';
import '../styles/public-discovery-tools.css';

// Mounted only inside the existing operator panel. Reads the anonymous public
// projection; no admin key, private document query or state-changing action.
export default function SeoDiagnostics({id}){
 const {i18n}=useTranslation(),ui=discoveryToolsUi(i18n.language),p=getPublicUi(i18n.language),labels=seoDiagnosticsUi(i18n.language),discovery=getDiscoveryUi(i18n.language);
 const [state,setState]=useState(null),[revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!id){setState(null);return;}
  const controller=new AbortController();let active=true;setState({loading:true});
  (async()=>{
   const row=await getPublicJsa(id);if(!row)throw Error('UNAVAILABLE');
   const diagnostic=publicationDiagnostics(row),url=new URL(diagnostic.canonical);
   const response=await fetch(url.pathname,{signal:controller.signal,cache:'no-store'});
   const doc=new DOMParser().parseFromString(await response.text(),'text/html');
   let sitemap=null;
   try{const result=await fetch('/sitemap-public.xml',{signal:controller.signal,cache:'no-store'});if(result.ok){const xml=new DOMParser().parseFromString(await result.text(),'text/xml');if(!xml.querySelector('parsererror'))sitemap=[...xml.getElementsByTagName('loc')].some(n=>n.textContent===diagnostic.canonical);}}catch{/* unavailable is not absence */}
   if(active)setState({row,diagnostic,status:response.status,canonical:doc.querySelector('link[rel="canonical"]')?.href||'',robots:doc.querySelector('meta[name="robots"]')?.content||'',title:doc.title,h1:doc.querySelectorAll('h1').length,reading:doc.querySelectorAll('[id^="public-step-"]').length,sitemap});
  })().catch(()=>{if(active)setState({error:true});});
  return()=>{active=false;controller.abort();};
 },[id,revision]);
 if(!id)return null;
 return <section className="seo-diagnostics"><h3>{ui.diagnostics}</h3><p>{ui.help}</p><button disabled={state?.loading} onClick={()=>setRevision(n=>n+1)}>{ui.check}</button>
  {state?.loading&&<p role="status">…</p>}{state?.error&&<p role="alert">{p.error}</p>}
  {state?.diagnostic&&<><p>{state.diagnostic.indexable?ui.indexable:ui.excluded}</p><dl>{Object.entries(state.diagnostic.checks).map(([key,value])=><div key={key}><dt>{labels[key]||key}</dt><dd>{value?'✓':'✕'}</dd></div>)}</dl>
   <p>{state.diagnostic.adsContentEligible?ui.adReady:ui.adBlocked}</p><p>{labels.adsEnabled}: {operations.adsEnabled?'✓':'✕'} · {labels.review}: {discovery[state.diagnostic.review]||state.diagnostic.review}</p>
   <h4>{ui.technical}</h4><dl>{Object.entries({HTTP:state.status,Title:state.title,Canonical:state.canonical,Robots:state.robots,H1:state.h1,[labels.reading]:state.reading,Sitemap:state.sitemap===null?'?':state.sitemap?'✓':'✕'}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
   <PublicationReviewHints row={state.row} locale={i18n.language}/></>}
 </section>;
}
