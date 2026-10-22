import { useEffect, useState } from 'react';
import { ProductDisclosure, ProductList } from './CommerceRecommendations.jsx';
import { getCommerceUi } from '../locales/commerceUi.js';
import { getPpeGuideUi } from '../locales/ppeGuideUi.js';
import { productPurpose } from '../locales/supportUi.js';
import { filterPpeProducts } from '../data/ppeGroups.js';

export default function PpeProductBrowser({locale,group,label}) {
 const ui=getPpeGuideUi(locale),commerce=getCommerceUi(locale);
 const [result,setResult]=useState(null),[attempt,setAttempt]=useState(0),[search,setSearch]=useState(''),[limit,setLimit]=useState(24);
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  const query=new URLSearchParams({kind:'guide',id:'protectiveequipment',locale});
  setResult(null);
  fetch('/api/commerce?'+query,{cache:'no-store',signal:controller.signal})
   .then(response=>{if(!response.ok)throw Error('unavailable');return response.json();})
   .then(data=>{if(active)setResult({locale,data});})
   .catch(()=>{if(active)setResult({locale,error:true});});
  return()=>{active=false;controller.abort();};
 },[locale,attempt]);
 useEffect(()=>{setLimit(24);},[group,search]);
 const current=result?.locale===locale?result:null;
 const items=(Array.isArray(current?.data?.items)?current.data.items:[]).map(item=>({...item,purposeLabel:productPurpose(item.category,locale)}));
 const filtered=filterPpeProducts(items,group,search),shown=filtered.slice(0,limit);
 const groupCount=filterPpeProducts(items,group).length;
 return <section className="ppe-products commerce-panel" aria-labelledby="ppe-products-title">
  <div className="ppe-section-heading"><h2 id="ppe-products-title">{ui.title}</h2><span>{label}</span></div>
  <div className="ppe-product-search"><label htmlFor="ppe-search">{ui.search}</label>
   <div><input id="ppe-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={ui.search}/>
    {search&&<button type="button" onClick={()=>setSearch('')}>{ui.clear}</button>}</div>
  </div>
  {!current?<p role="status">{ui.loading}</p>:current.error?<div role="status"><p>{ui.error}</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>{ui.retry}</button></div>:<>
   <p className="ppe-result-count" role="status" aria-live="polite">{filtered.length} {ui.products}</p>
   {shown.length?<><ProductDisclosure items={shown} ui={commerce} locale={locale}/><ProductList items={shown} ui={commerce} locale={locale}/>
    {filtered.length>limit&&<button className="ppe-show-more" type="button" onClick={()=>setLimit(value=>value+24)}>{ui.more}</button>}
    <footer className="commerce-notes"><p>{ui.note}</p><p>{commerce.merchantCheck}</p></footer></>
    :<p className="ppe-empty">{groupCount?ui.noResults:ui.empty}</p>}
  </>}
 </section>;
}
