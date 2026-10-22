import { useEffect, useId, useState } from 'react';
import { getCommerceUi } from '../locales/commerceUi.js';
import './CommerceRecommendations.css';
import { productPurpose } from '../locales/supportUi.js';

export function ProductList({items,ui,locale}) {
 return <ul className="commerce-grid">{items.map(item=><li key={item.id}>
   <a className="commerce-image-link" href={item.href} target="_blank" rel="sponsored noopener noreferrer" aria-label={item.title}>
     {item.imageUrl && <img src={item.imageUrl} alt={item.title} width="160" height="160" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={event=>{event.currentTarget.hidden=true;}}/>}
   </a>
   <div className="commerce-product-copy"><span className="commerce-purpose">{productPurpose(item.category,locale)}</span><h3>{item.title}</h3>
   <span className="commerce-merchant">{item.merchant}</span><a className="commerce-product-link" href={item.href} target="_blank" rel="sponsored noopener noreferrer">{ui.view}<span aria-hidden="true"> ↗</span></a></div>
 </li>)}</ul>;
}
export function ProductDisclosure({items,ui,locale,compact=false}) {
 const disclosures=[...new Set(items.map(item=>item.disclosure).filter(Boolean))];
 const short=locale==='ko'&&items.every(item=>item.merchant==='쿠팡')?'쿠팡 제휴광고 · 구매 시 수수료를 제공받습니다.':ui.disclosure;
 return <div className="commerce-disclosures">{(compact?[short]:disclosures.length?disclosures:[ui.disclosure]).map(text=><p className="commerce-disclosure" key={text}><strong>{text}</strong></p>)}</div>;
}
function ProductNotes({ui}) {
 return <footer className="commerce-notes">
   <p>{ui.context}</p><p>{ui.merchantCheck}</p>
 </footer>;
}
export default function CommerceRecommendations({ kind, contentId, locale, contentLocale = locale, placement = 'inline', sectionNumber }) {
 const [result,setResult] = useState(null);
 const labelId=useId(), ui=getCommerceUi(locale);
 const requestKey=JSON.stringify([kind,contentId,contentLocale,locale]);
 useEffect(()=>{
   const controller=new AbortController();
   let active=true;
   const query=new URLSearchParams({kind,id:contentId,locale:contentLocale,marketLocale:locale});
   fetch('/api/commerce?'+query,{signal:controller.signal,cache:'no-store'})
     .then(response=>response.ok?response.json():null)
     .then(data=>{if(active)setResult({key:requestKey,data});})
     .catch(()=>{if(active)setResult({key:requestKey,data:null});});
   return()=>{active=false;controller.abort();};
 },[kind,contentId,contentLocale,locale,requestKey]);
 const data=result?.key===requestKey?result.data:null;
 const items=(data?.status==='ready'?data.items:[])?.slice(0,8)||[];
 // Numbered case sections remain stable while the catalogue loads or has no
 // matching merchant. Sidebars only exist when there are reviewed matches.
 if(!items.length&&!sectionNumber)return null;
 return <>
   <section id={sectionNumber?'section-'+sectionNumber:undefined} className={'commerce-panel commerce-panel--inline'+(sectionNumber?' commerce-panel--article':'')} aria-labelledby={labelId} dir={locale?.startsWith('ar')?'rtl':'ltr'}>
     <h2 id={labelId}>{sectionNumber?sectionNumber+'. ':''}{ui.title}</h2>
     {items.length?<><ProductDisclosure items={items} ui={ui} locale={locale}/><ProductList items={items} ui={ui} locale={locale}/><ProductNotes ui={ui}/></>:<p className="commerce-empty">{ui.empty}</p>}
   </section>
   {placement==='rail'&&[items.slice(0,4),items.slice(4,8)].map((group,index)=>group.length>0&&<aside key={index} className={'commerce-panel commerce-panel--rail commerce-panel--'+(index?'right':'left')} aria-label={ui.title+' '+(index+1)} dir={locale?.startsWith('ar')?'rtl':'ltr'}>
     <h2>{ui.title}</h2><ProductDisclosure items={group} ui={ui} locale={locale} compact/><ProductList items={group} ui={ui} locale={locale}/>
   </aside>)}
 </>;
}
