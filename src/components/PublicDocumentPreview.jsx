import ProcedureDocument from './ProcedureDocument';
import { projectProcedureDocument } from '../utils/procedureDocument';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getOperatorUi } from '../locales/operatorUi';
import { getCommunityUi } from '../locales/communityUi';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import DocumentContent from './DocumentContent';

export default function PublicDocumentPreview({ row, locale }) {
 const { i18n }=useTranslation('export'), ui=getOperatorUi(locale), community=getCommunityUi(locale);
 const [busy,setBusy]=useState(false), [pdfFailed,setPdfFailed]=useState(false);
 const paper=useRef(null), pending=useRef(false);
 const t=i18n.getFixedT(row.public_locale||locale,'export');
 const layout=templateLayout(row.custom_layout,{docTitle:t('default.docTitle'),appr1:t('default.appr1'),appr2:t('default.appr2'),appr3:t('default.appr3'),savedActiveOrder:defaultColumns(row.form_data?.jsaType)});
 async function download() {
  if(pending.current)return;
  pending.current=true;setBusy(true);setPdfFailed(false);
  try {
   await document.fonts.ready;
   const {createReportPdf,downloadBlob}=await import('../utils/reportPdf');
   if(!paper.current)throw Error('DOCUMENT_UNAVAILABLE');
   const {blob}=await createReportPdf([{element:paper.current,orientation:layout.savedOrientation||'landscape',paperSize:layout.savedPaperSize||'a4'}]);
   downloadBlob(blob,row.title.replace(/[\\/:*?"<>|]/g,'_')+'.pdf');
  } catch {setPdfFailed(true);}
  finally {pending.current=false;setBusy(false);}
 }
 return <section className="public-document-preview" aria-labelledby="public-document-preview-title">
  <h2 id="public-document-preview-title">{community.preview}</h2>
  <ProcedureDocument document={projectProcedureDocument(row)} uiLocale={locale} />
  <section className="public-document-version" data-project-id={row.id} data-document-variant={row.document_variant||undefined}>
   <div className="jsa-toolbar"><h3>{ui[row.document_variant]||community.preview}</h3>
    <button disabled={busy} onClick={download}>{busy?'…':ui.download}</button>
   </div>
   <div className="jsa-paper-scroll" tabIndex={0} role="region" aria-label={ui[row.document_variant]||community.preview}>
    <div className="jsa-public-paper" ref={paper}>
     <DocumentContent formData={row.form_data} participants={[]} analysisData={row.analysis_data} layout={layout} publicNotes={row.publication_context?.limitations || ''} documentLocale={row.public_locale||locale}/>
    </div>
   </div>
  </section>
  {pdfFailed&&<p role="alert">{ui.error}</p>}
 </section>;
}
