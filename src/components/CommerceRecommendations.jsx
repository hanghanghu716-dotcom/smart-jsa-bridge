import { useEffect, useId, useState } from 'react';
import { getCommerceUi, COMMERCE_COUNTRIES, commerceCountry } from '../locales/commerceUi.js';
import { getLanguageTag } from '../locales/config.js';
import './CommerceRecommendations.css';

export default function CommerceRecommendations({ kind, contentId, locale, contentLocale = locale }) {
 const [selectedCountry,setSelectedCountry] = useState('');
 const [result,setResult] = useState(null);
 const labelId=useId(), ui=getCommerceUi(locale);
 const requestKey=JSON.stringify([kind,contentId,contentLocale,selectedCountry]);
 useEffect(()=>{
   const controller=new AbortController();
   let active=true;
   const query=new URLSearchParams({kind,id:contentId,locale:contentLocale});
   if(selectedCountry)query.set('country',selectedCountry);
   fetch('/api/commerce?'+query,{signal:controller.signal,cache:'no-store'})
     .then(response=>response.ok?response.json():null)
     .then(data=>{if(active)setResult({key:requestKey,data});})
     .catch(()=>{if(active)setResult({key:requestKey,data:null});});
   return()=>{active=false;controller.abort();};
 },[kind,contentId,contentLocale,selectedCountry,requestKey]);
 const data=result?.key===requestKey?result.data:null;
 if(!data || !['ready','empty'].includes(data.status))return null;
 // Do not insert an empty advertising panel into unrelated content. Keep the
 // country switch available after an explicit selection with no matches.
 if(!data.items?.length && !selectedCountry)return null;
 const country=selectedCountry||data.country||commerceCountry(locale);
 let names;
 try{names=new Intl.DisplayNames([getLanguageTag(locale)],{type:'region'});}catch{/* ISO codes remain usable. */}
 const disclosures=[...new Set((data.items||[]).map(item=>item.disclosure).filter(Boolean))];
 return <aside className="commerce-panel" aria-labelledby={labelId} dir={locale?.startsWith('ar')?'rtl':'ltr'}>
   <div className="commerce-heading"><h2 id={labelId}>{ui.title}</h2>
     <label>{ui.country}<select value={country} onChange={event=>setSelectedCountry(event.target.value)}>
       {COMMERCE_COUNTRIES.map(code=><option value={code} key={code}>{names?.of(code)||code}</option>)}
     </select></label>
   </div>
   {!disclosures.length && <p className="commerce-disclosure">{ui.disclosure}</p>}
   {disclosures.map(value=><p className="commerce-disclosure" key={value}>{value}</p>)}
   <p className="commerce-context">{ui.context}</p>
   {data.items?.some(item=>item.linkOnly) && <p className="commerce-context">{ui.merchantCheck}</p>}
   {data.items?.length ? <ul className="commerce-grid">{data.items.map(item=><li key={item.id}>
     <span className="commerce-merchant">{item.merchant}</span><h3>{item.title}</h3>
     <a href={item.href} target="_blank" rel="sponsored noopener noreferrer">{ui.view}<span aria-hidden="true"> ↗</span></a>
   </li>)}</ul>:<p role="status">{ui.empty}</p>}
 </aside>;
}
