import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { listDocumentVariants } from '../services/publicJsaService';
import { getOperatorUi } from '../locales/operatorUi';
import { getCommunityUi } from '../locales/communityUi';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import DocumentContent from './DocumentContent';

export default function PublicDocumentVariants({ row, locale }) {
 const { i18n }=useTranslation('export'), ui=getOperatorUi(locale), community=getCommunityUi(locale);
 const [variants,setVariants]=useState([row]), [failed,setFailed]=useState(false), [loading,setLoading]=useState(Boolean(row.document_group_id));
 const [attempt,setAttempt]=useState(0), [busy,setBusy]=useState(null), [pdfFailed,setPdfFailed]=useState(false);
 const papers=useRef(new Map()), pending=useRef(false);
 useEffect(()=>{
  let active=true;
  if (!row.document_group_id) return;
  setLoading(true);setFailed(false);
  listDocumentVariants(row).then(rows=>{if(active){setVariants(rows.length?rows:[row]);setLoading(false);}})
   .catch(()=>{if(active){setFailed(true);setLoading(false);}});
  return()=>{active=false;};
 },[row,attempt]);
 async function download(item,layout) {
  if(pending.current)return;
  pending.current=true;setBusy(item.id);setPdfFailed(false);
  try {
   await document.fonts.ready;
   const {createReportPdf,downloadBlob}=await import('../utils/reportPdf');
   const element=papers.current.get(item.id);
   if(!element)throw Error('DOCUMENT_UNAVAILABLE');
   const {blob}=await createReportPdf([{element,orientation:layout.savedOrientation||'landscape',paperSize:layout.savedPaperSize||'a4'}]);
   downloadBlob(blob,item.title.replace(/[\\/:*?"<>|]/g,'_')+'.pdf');
  } catch {setPdfFailed(true);}
  finally {pending.current=false;setBusy(null);}
 }
 return <section className="public-document-preview" aria-labelledby="public-document-preview-title">
  <h2 id="public-document-preview-title">{community.preview}{row.document_group_id?' · '+ui.versions:''}</h2>
  {loading&&<p role="status" aria-busy="true">…</p>}
  {failed&&<p role="alert">{ui.error} <button onClick={()=>setAttempt(n=>n+1)}>{ui.retry}</button></p>}
  {variants.map(item=>{
   const t=i18n.getFixedT(item.public_locale||locale,'export');
   const layout=templateLayout(item.custom_layout,{docTitle:t('default.docTitle'),appr1:t('default.appr1'),appr2:t('default.appr2'),appr3:t('default.appr3'),savedActiveOrder:defaultColumns(item.form_data?.jsaType)});
   return <section key={item.id} className="public-document-version">
    <div className="jsa-toolbar"><h3>{ui[item.document_variant]||community.preview}</h3>
     {item.id!==row.id&&<LanguageLink to={'/public-jsa/'+item.id}>{item.title}</LanguageLink>}
     <button disabled={Boolean(busy)||loading} onClick={()=>download(item,layout)}>{busy===item.id?'…':ui.download}</button></div>
    <div className="jsa-paper-scroll" tabIndex={0} role="region" aria-label={ui[item.document_variant]||community.preview}>
     <div className="jsa-public-paper" ref={element=>{if(element)papers.current.set(item.id,element);else papers.current.delete(item.id);}}>
      <DocumentContent formData={item.form_data} participants={[]} analysisData={item.analysis_data} layout={layout} documentLocale={item.public_locale||locale}/>
     </div>
    </div>
   </section>;
  })}
  {pdfFailed&&<p role="alert">{ui.error}</p>}
 </section>;
}
