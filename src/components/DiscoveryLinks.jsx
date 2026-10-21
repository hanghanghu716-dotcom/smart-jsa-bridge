import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { discoveryLinks,editorialTitles } from '../services/discoveryService';
import { getDiscoveryUi,getGuideTitle } from '../locales/discoveryUi';
import { getPublicUi } from '../locales/publicUi';
import { regionalJourneyUi } from '../locales/regionalJourneyUi';
import { editorialHref,publicHref } from '../utils/discovery';
import '../styles/community.css';
export default function DiscoveryLinks({id=null,kind=null,target=null,showReuseHelp=false,compact=false}){
 const {i18n}=useTranslation(),ui=getDiscoveryUi(i18n.language),p=getPublicUi(i18n.language);
 const [state,setState]=useState(null),[attempt,setAttempt]=useState(0);
 const key=[id,kind,target,i18n.language].join(':');
 useEffect(()=>{if(navigator.userAgent.includes("ReactSnap"))return;let live=true;discoveryLinks(id,kind,target,i18n.language).then(async result=>{if(id&&result)result={...result,editorial:await editorialTitles(result.editorial||[],i18n.language)};if(live)setState({key,result});}).catch(()=>{if(live)setState({key,error:true});});return()=>{live=false;};},[id,kind,target,i18n.language,key,attempt]);
 if(state?.key!==key)return null;
 if(state.error)return <p role="status">{p.error} <button onClick={()=>setAttempt(n=>n+1)}>{p.retry}</button></p>;
 const data=state.result;
 const list=(label,items)=> items?.length ? <section key={label}><h2>{label}</h2>{items?.length?<ul>{items.slice(0,compact?3:items.length).map(item=><li key={item.id}><LanguageLink to={publicHref(item,i18n.language)}>{item.title}</LanguageLink></li>)}</ul>:null}</section>:null;
 if(!id)return data?.length?<aside className="discovery-links discovery-links--editorial" dir={i18n.dir()}>
  <section>
   <h2>{ui.related}</h2>
   {showReuseHelp&&<p className="discovery-links-intro">{regionalJourneyUi(i18n.language).linkedHelp}</p>}
   <ul>{data.slice(0,compact?3:data.length).map(item=><li key={item.id}><LanguageLink to={'/public-jsa/'+item.id}>{item.title}</LanguageLink></li>)}</ul>
  </section>
 </aside>:null;
 return <aside className="discovery-links">{data?.source&&list(ui.source,[data.source])}{list(ui.derived,data?.children)}{list(ui.related,data?.related)}{!!data?.editorial?.length&&<section><h2>{ui.editorial}</h2>{data?.editorial?.length?<ul>{data.editorial.slice(0,compact?2:data.editorial.length).map(l=><li key={l.kind+l.target}><LanguageLink to={editorialHref(l,i18n.language)}>{l.title||getGuideTitle(l.target,i18n.language)}</LanguageLink></li>)}</ul>:<p>{ui.empty}</p>}</section>}</aside>;
}
