import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { feedbackUi } from '../locales/feedbackUi.js';
import '../styles/feedback.css';
const FeedbackForm=lazy(()=>import('./FeedbackForm.jsx'));

export default function FeedbackWidget(){
 const {i18n}=useTranslation(),ui=feedbackUi(i18n.language),location=useLocation();
 const dialog=useRef(null),button=useRef(null),[opened,setOpened]=useState(false),[mounted,setMounted]=useState(false);
 const authoring=/\/(templates|info|procedure|analysis|export|document-designer|layoutbuilder|layout-module|layout-table|work-packages|jsa-preview)(\/|$)/.test(location.pathname);
 useEffect(()=>{dialog.current?.close();},[location.pathname]);
 useEffect(()=>{
  if(!opened)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previous;};
 },[opened]);
 const close=()=>{dialog.current?.close();setOpened(false);button.current?.focus();};
 return <div className="feedback-widget" data-html2canvas-ignore="true" data-authoring={authoring||undefined}>
  <button ref={button} className="feedback-launcher" type="button" aria-haspopup="dialog" aria-expanded={opened} aria-controls="feedback-dialog" aria-label={ui.launcher} title={ui.launcher} onClick={()=>{setMounted(true);setOpened(true);dialog.current.showModal();}}>
   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z"/><path d="M7 9h8M7 13h5"/></svg><span>{ui.launcher}</span>
  </button>
  <dialog ref={dialog} id="feedback-dialog" className="feedback-dialog" aria-labelledby="feedback-title" onCancel={event=>{event.preventDefault();close();}} onClose={()=>setOpened(false)}>
   <div className="feedback-dialog-header"><h2 id="feedback-title">{ui.launcher}</h2><button type="button" aria-label={ui.close} title={ui.close} onClick={close}>×</button></div>
   <div className="feedback-dialog-body">{mounted&&<Suspense fallback={<p role="status">{ui.sending}</p>}><FeedbackForm/></Suspense>}</div>
  </dialog>
 </div>;
}
