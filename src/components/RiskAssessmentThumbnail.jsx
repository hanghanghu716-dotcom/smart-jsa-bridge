import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentContent from './DocumentContent';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import { cachedRiskThumbnail, queueRiskThumbnail, riskThumbnailKey } from '../utils/riskThumbnailQueue';
import { createReportPdf } from '../utils/reportPdf';
import { paperDimensions } from '../utils/paperFormat';
import { archiveUi } from '../locales/archiveUi';

export default function RiskAssessmentThumbnail({row,locale}) {
 const {i18n}=useTranslation('export'), paper=useRef(null), key=riskThumbnailKey(row,locale);
 const [image,setImage]=useState(()=>({key,value:cachedRiskThumbnail(key)}));
 const documentLocale=row.public_locale||locale, t=i18n.getFixedT(documentLocale,'export');
 const layout=templateLayout(row.custom_layout,{docTitle:t('default.docTitle'),appr1:t('default.appr1'),appr2:t('default.appr2'),appr3:t('default.appr3'),savedActiveOrder:defaultColumns(row.form_data?.jsaType)});
 useEffect(()=>{
  const controller=new AbortController();
  queueRiskThumbnail(key,async()=>{
   await document.fonts.ready;
   if(controller.signal.aborted||!paper.current)return '';
   const {images}=await createReportPdf([{element:paper.current,orientation:layout.savedOrientation,paperSize:layout.paperSize}],{firstPageOnly:true});
   if(!images[0])return '';
   const source=new Image();source.src=images[0].url;await source.decode();
   const size=paperDimensions(layout.paperSize,layout.savedOrientation), canvas=document.createElement('canvas');
   canvas.width=720;canvas.height=Math.round(720*size.height/size.width);
   const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
   const ratio=canvas.width/size.width;
   context.drawImage(source,10*ratio,10*ratio,images[0].width*ratio,images[0].height*ratio);
   return canvas.toDataURL('image/webp',.85);
  },controller.signal).then(value=>{if(value&&!controller.signal.aborted)setImage({key,value});}).catch(()=>{});
  return()=>controller.abort();
 },[key,layout.savedOrientation,layout.paperSize]);
 const value=image.key===key?image.value:'';
 return <>{value&&<div className="risk-pdf-thumbnail"><img src={value} alt=""/><span className="document-preview-badge">{archiveUi(locale).riskPdfPreview}</span></div>}
 {!value&&<div className="risk-thumbnail-renderer" aria-hidden="true"><div className="jsa-public-paper" ref={paper}><DocumentContent formData={row.form_data} participants={[]} analysisData={row.analysis_data} layout={layout} publicNotes={row.publication_context?.limitations||''} documentLocale={documentLocale}/></div></div>}</>;
}
