import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { feedbackUi } from '../locales/feedbackUi.js';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGS } from '../locales/config.js';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from '../utils/feedback.js';
import { caseLookupSlugs, casePath } from '../utils/caseRouting.js';
import { feedbackAdmin } from '../services/feedback.js';
import useCommunityAdmin from '../hooks/useCommunityAdmin.js';
import { supabase } from '../supabaseClient';
import '../styles/feedback.css';

function Attachment({file,ui}){
 const [url,setUrl]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false),[preview,setPreview]=useState(false);
 const objectUrl=useRef(''),active=useRef(true),fileBlob=useRef(null),previewAbort=useRef(null);
 const [pdfPreview,setPdfPreview]=useState(null);
 useEffect(()=>{active.current=true;return()=>{active.current=false;previewAbort.current?.abort();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);};},[]);
 async function load(showPreview){
  setBusy(true);setError(false);
  try {
   let src=objectUrl.current;
   if(!src){const {data,error:failure}=await supabase.storage.from('feedback-attachments').download(file.path);if(failure)throw failure;
    if(!active.current)return;fileBlob.current=data;src=URL.createObjectURL(data);objectUrl.current=src;setUrl(src);
   }
   if(showPreview){
    if(file.type==='application/pdf'&&!pdfPreview){
     const {feedbackPdfPreview}=await import('../utils/feedbackPdfPreview.js');
     const controller=new AbortController();previewAbort.current=controller;
     const rendered=await feedbackPdfPreview(fileBlob.current,controller.signal);
     if(!active.current)return;setPdfPreview(rendered);
    }
    if(active.current)setPreview(true);
   }else{const link=document.createElement('a');link.href=src;link.download=file.name;link.click();}
  }catch{if(active.current)setError(true);}finally{if(active.current)setBusy(false);}
 }
 return <li style={{display:'block'}}><p>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>
  <div className="feedback-actions"><button type="button" disabled={busy} onClick={()=>load(true)}>{ui.preview}</button><button type="button" disabled={busy} onClick={()=>load(false)}>{ui.download}</button></div>
  {error&&<p role="alert">{ui.error}</p>}
  {preview&&url&&<figure style={{margin:0}}><img alt={file.name} className="feedback-attachment-preview" src={file.type==='application/pdf'?pdfPreview?.url:url}/>{pdfPreview&&<figcaption>PDF · 1 / {pdfPreview.pages}</figcaption>}</figure>}
 </li>;
}
export default function FeedbackInbox(){
 const {i18n}=useTranslation(),ui=feedbackUi(i18n.language),admin=useCommunityAdmin();
 const [category,setCategory]=useState(''),[filter,setFilter]=useState(''),[page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[edit,setEdit]=useState({}),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const generation=useRef(null),saving=useRef(false);
 useEffect(()=>{
  const sequence=Symbol('queue');generation.current=sequence;let active=true;
  // Clear private data immediately when authorization or the requested queue changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setRows([]);setSelected(null);setError(false);
  if(!admin)return;
  setBusy(true);
  feedbackAdmin('list',{category,status:filter,offset:page*50}).then(data=>{if(active&&sequence===generation.current)setRows(data);}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;generation.current=null;};
 },[admin,category,filter,page,revision]);
 async function detail(row){
  const sequence=Symbol('detail');generation.current=sequence;setSelected(null);setBusy(true);setError(false);
  try{const value=await feedbackAdmin('detail',{id:row.id});if(sequence!==generation.current)return;
   setSelected(value);setEdit({status:value.status,response:value.response,notes:value.internal_notes,caseUrl:value.linked_case_group?casePath(value.linked_case_locale,value.linked_case_group):''});
  }catch{if(sequence===generation.current)setError(true);}finally{if(sequence===generation.current)setBusy(false);}
 }
 async function save(event){
  event.preventDefault();if(saving.current)return;saving.current=true;setBusy(true);setError(false);
  try{
   let case_group='',case_locale='';
   if(edit.caseUrl.trim()){
    const url=new URL(edit.caseUrl.trim(),window.location.origin),match=/^\/([^/]+)\/case-study\/([^/]+)\/?$/.exec(url.pathname);
    if(!['smartjsabridge.com',window.location.hostname].includes(url.hostname)||!match||!SUPPORTED_LANGS.includes(match[1])||url.search||url.hash)throw Error('INVALID_CASE');
    case_locale=match[1];case_group=decodeURIComponent(match[2]);
    const found=await supabase.from('case_studies').select('post_group_id').in('post_group_id',caseLookupSlugs(case_group)).eq('language_code',case_locale).limit(1);
    if(found.error||!found.data?.length)throw Error('INVALID_CASE');
    case_group=found.data[0].post_group_id;
   }
   await feedbackAdmin('update',{id:selected.id,expected:selected.updated_at,status:edit.status,response:edit.response,notes:edit.notes,case_group,case_locale});
   setRevision(n=>n+1);
  }catch{setError(true);}finally{setBusy(false);saving.current=false;}
 }
 if(!admin)return null;
 const categories=[...FEEDBACK_CATEGORIES,'privacy','copyright','safety','spam','appeal','access','erasure'];
 return <section className="feedback-inbox" dir={i18n.language.startsWith('ar')?'rtl':'ltr'}>
  <h2>{ui.inbox}</h2>
  <div className="feedback-columns"><label className="feedback-field">{ui.category}<select value={category} onChange={e=>{setCategory(e.target.value);setPage(0);}}><option value="">{ui.all}</option>{categories.map(c=><option key={c} value={c}>{ui[c]||c}</option>)}</select></label>
   <label className="feedback-field">{ui.check}<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}><option value="">{ui.all}</option>{FEEDBACK_STATUSES.map(s=><option key={s} value={s}>{ui[s]}</option>)}</select></label></div>
  <div className="feedback-actions"><button disabled={busy} onClick={()=>setRevision(n=>n+1)}>{ui.refresh}</button><button disabled={busy||!page} onClick={()=>setPage(n=>n-1)}>{ui.previous}</button><button disabled={busy||rows.length<50} onClick={()=>setPage(n=>n+1)}>{ui.next}</button></div>
  {error&&<p className="feedback-error" role="alert">{ui.error}</p>}
  {busy&&<p role="status">{ui.sending}</p>}
  {!busy&&!error&&!rows.length&&<p>{ui.noResults}</p>}
  <ul className="feedback-queue">{rows.map(row=><li key={row.id}><button disabled={busy} onClick={()=>detail(row)}>
   <span>{ui[row.category]||row.category} · {row.title||row.id.slice(0,8)}</span><small>{ui[row.status]} · {row.locale} · {new Date(row.created_at).toLocaleDateString()} · {ui.files} {row.attachments}</small>
  </button></li>)}</ul>
  {selected&&<section key={selected.id} className="feedback-inbox-detail">
   <h3>{selected.title||ui[selected.category]||selected.category}</h3>
   <p>{selected.id} · {selected.country} · {LANGUAGE_OPTIONS.find(l=>l.code===selected.locale)?.label||selected.locale}</p>
   {selected.contact_email&&<p>{ui.email}: {selected.contact_email}</p>}
   {selected.source_path&&<p>{ui.source}: {selected.source_path}</p>}
   <p className="preserve-lines">{selected.detail}</p><p className="preserve-lines">{selected.context}</p><p className="preserve-lines">{selected.evidence}</p>
   <ul className="feedback-files">{selected.files.map(file=><Attachment key={file.id} file={file} ui={ui}/>)}</ul>
   <form onSubmit={save}>
    <label className="feedback-field">{ui.check}<select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>{FEEDBACK_STATUSES.map(s=><option key={s} value={s}>{ui[s]}</option>)}</select></label>
    <label className="feedback-field">{ui.notes}<textarea rows={4} maxLength={4000} value={edit.notes} onChange={e=>setEdit({...edit,notes:e.target.value})}/></label>
    <label className="feedback-field">{ui.response}<textarea rows={4} maxLength={2000} value={edit.response} onChange={e=>setEdit({...edit,response:e.target.value})}/></label>
    <label className="feedback-field">{ui.linkedCase}<input value={edit.caseUrl} maxLength={600} onChange={e=>setEdit({...edit,caseUrl:e.target.value})}/></label>
    <button disabled={busy}>{ui.save}</button>
   </form>
  </section>}
 </section>;
}
