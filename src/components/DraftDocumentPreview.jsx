import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentContent from './DocumentContent';
import { draftDocumentLayout } from '../utils/jsaTemplates';
import { paperDimensions, paperPreviewWidth } from '../utils/paperFormat';
import { reportPageGeometry, reportPages } from '../utils/reportPagination';
import { jsaTemplateUi } from '../locales/jsaTemplateUi';
import '../styles/jsa-authoring.css';

export default function DraftDocumentPreview({ snapshot, onChangeTemplate }) {
 const {i18n}=useTranslation(), ui=jsaTemplateUi(i18n.language);
 const locale=snapshot.formData?.context?.documentLocale || i18n.language;
 const layout=draftDocumentLayout(snapshot,i18n), orientation=layout.savedOrientation, size=layout.paperSize;
 const width=paperPreviewWidth(size,orientation), dimensions=paperDimensions(size,orientation);
 const units=width/(dimensions.width-20), fullWidth=dimensions.width*units, fullHeight=dimensions.height*units;
 const source=useRef(null), viewport=useRef(null);
 const [frames,setFrames]=useState([]), [index,setIndex]=useState(0), [fit,setFit]=useState(.4), [zoom,setZoom]=useState(null), [error,setError]=useState(false);
 const sourceKey=JSON.stringify([snapshot,locale]);
 const rows=snapshot.analysisData?.length ? snapshot.analysisData :
  snapshot.procedures?.length ? snapshot.procedures.map(proc=>({proc,risks:[]})) : [{proc:{},risks:[]}];
 const contents=()=> <DocumentContent documentLocale={locale} formData={snapshot.formData} participants={snapshot.participants}
  analysisData={rows} layout={layout} stepPhotos={snapshot.stepPhotos || {}} />;
 const paper=()=> <div className="authoring-report theme-paper" dir={i18n.dir(locale)} lang={locale} style={{width}}>{contents()}</div>;
 useEffect(()=>{
  const node=source.current; if(!node)return;
  let active=true, timer;
  const measure=()=>{clearTimeout(timer);timer=setTimeout(()=>{
   if(!active)return;
   try{
    const element=node.firstElementChild, bounds=element.getBoundingClientRect();
    const last=element.lastElementChild?.getBoundingClientRect();
    const height=Math.max(1,Math.ceil((last?.bottom || bounds.bottom)-bounds.top));
    if(bounds.height>16000)throw Error('WORK_OUTPUT_LARGE');
    const pixels=Math.floor((dimensions.height-20)*width/(dimensions.width-20)*2);
    const next=reportPages(height*2,pixels,reportPageGeometry(element,pixels,2));
    setFrames(next);setIndex(previous=>Math.min(previous,next.length-1));setError(false);
   }catch{setError(true);}
  },180);};
  const observer=new ResizeObserver(measure);observer.observe(node.firstElementChild);
  node.addEventListener('load',measure,true);document.fonts.ready.then(()=>{if(active)measure();});measure();
  return()=>{active=false;clearTimeout(timer);observer.disconnect();node.removeEventListener('load',measure,true);};
 },[sourceKey,width,dimensions.width,dimensions.height]);
 useEffect(()=>{
  const node=viewport.current;if(!node)return;
  const resize=()=>setFit(Math.max(.1,Math.min(1,(node.clientWidth-28)/fullWidth)));
  const observer=new ResizeObserver(resize);observer.observe(node);resize();
  return()=>observer.disconnect();
 },[fullWidth]);
 const frame=frames[Math.max(0,index)], scale=zoom ?? fit;
 return <aside className="authoring-preview" aria-label={ui.preview}>
  <header><h2>{ui.preview}</h2>{onChangeTemplate&&<button type="button" data-change-template onClick={onChangeTemplate}>{ui.change}</button>}</header>
  <div className="authoring-preview-tools">
   <span>{size.toUpperCase()} · {orientation==='portrait'?'↕':'↔'}</span>
   <button type="button" aria-label={ui.preview+' −'} onClick={()=>setZoom(Math.max(.15,scale-.1))}>−</button>
   <button type="button" onClick={()=>setZoom(null)}>{Math.round(scale*100)}%</button>
   <button type="button" aria-label={ui.preview+' +'} onClick={()=>setZoom(Math.min(1.5,scale+.1))}>+</button>
  </div>
  <div className="authoring-preview-viewport" ref={viewport}>
   {error?<p role="alert">{ui.error}</p>:!frame?<p role="status">{ui.loading}</p>:
    <div className="authoring-sheet" data-preview-page={index+1} style={{width:fullWidth,height:fullHeight,zoom:scale}}>
     <div style={{position:'absolute',left:10*units,top:10*units,width,height:frame.headingHeight/2,overflow:'hidden'}} aria-hidden="true">
      {frame.heading&&<div style={{position:'absolute',top:-frame.heading.top/2}}>{paper()}</div>}
     </div>
     <div data-preview-body style={{position:'absolute',left:10*units,top:10*units+frame.headingHeight/2,width,height:(frame.end-frame.start)/2,overflow:'hidden'}}>
      <div style={{position:'absolute',top:-frame.start/2}}>{paper()}</div>
     </div>
    </div>}
  </div>
  <div className="authoring-page-controls">
   <button type="button" aria-label={ui.back} disabled={index<=0} onClick={()=>setIndex(n=>n-1)}>‹</button>
   <output aria-live="polite">{frames.length?index+1:0} / {frames.length}</output>
   <button type="button" aria-label={ui.steps[4]+' ›'} disabled={index>=frames.length-1} onClick={()=>setIndex(n=>n+1)}>›</button>
  </div>
  <div ref={source} className="authoring-measure" aria-hidden="true" inert>{paper()}</div>
 </aside>;
}
