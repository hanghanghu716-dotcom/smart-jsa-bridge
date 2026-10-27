import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { feedbackUi } from '../locales/feedbackUi.js';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGS } from '../locales/config.js';
import { FEEDBACK_CATEGORIES, feedbackCountry, feedbackFileError, parseFeedbackReceipt } from '../utils/feedback.js';
import { sendFeedback, validateFeedbackFiles } from '../services/feedback.js';
import { publicGateway } from '../services/publicGateway.js';
import { casePath } from '../utils/caseRouting.js';

export default function FeedbackForm({includePolicyCategories=false}) {
 const {i18n}=useTranslation(), ui=feedbackUi(i18n.language), location=useLocation();
 const [form,setForm]=useState(()=>({category:'case_request',title:'',detail:'',context:'',locale:i18n.language,country:feedbackCountry(i18n.language),email:'',website:''}));
 const [files,setFiles]=useState([]),[consent,setConsent]=useState(false),[includePage,setIncludePage]=useState(false);
 const [stage,setStage]=useState('edit'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(''),[result,setResult]=useState(null);
 const submission=useRef(null), guard=useRef(false), root=useRef(null);
 useEffect(()=>{const body=root.current?.closest('.feedback-dialog-body');if(body)body.scrollTop=0;root.current?.querySelector('[data-feedback-stage]')?.focus();},[stage]);
 useEffect(()=>{if(!submission.current&&stage==='edit')setForm(previous=>({...previous,locale:i18n.language,country:feedbackCountry(i18n.language)}));},[i18n.language]);
 const field=(key,label,options={})=><label className="feedback-field">{label}{options.area?<textarea value={form[key]} maxLength={options.max||4000} rows={options.rows||4} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input value={form[key]} type={options.type||'text'} maxLength={options.max||200} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>;
 const errorText=error==='EMPTY'?ui.empty:error==='INVALID_FILE'?ui.invalidFile:error==='EXPIRED'?ui.expired:ui.error;
 async function run(fn){if(guard.current)return;guard.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e.message||'FAILED');}finally{guard.current=false;setBusy(false);}}
 function reset(){submission.current=null;setStage('edit');setResult(null);setError('');}
 async function review(event){event.preventDefault();await run(async()=>{
  if(!form.title.trim()&&!form.detail.trim()&&!files.length)throw Error('EMPTY');
  if(feedbackFileError(files))throw Error('INVALID_FILE');
  await validateFeedbackFiles(files);setStage('review');
 });}
 async function submit(){
  await run(async()=>{
   if(!submission.current)submission.current={files:[...files],payload:{...form,client_id:crypto.randomUUID(),consent,source_path:includePage?location.pathname.slice(0,500):'',files:files.map(file=>({name:file.name,type:file.type,size:file.size}))}};
   const saved=await sendFeedback(submission.current);
   setReceipt(saved.receipt);setResult({status:saved.status});setStage('success');
   setForm({...form,title:'',detail:'',context:'',email:'',website:''});setFiles([]);setConsent(false);
  });
 }
 return <div ref={root} className="feedback-form" dir={i18n.language.startsWith('ar')?'rtl':'ltr'}>
  <p className="feedback-help">{ui.intro}</p>
  {error&&<p role="alert" className="feedback-error">{errorText}</p>}
  {stage==='edit'&&<form onSubmit={review}>
   <label className="feedback-field">{ui.category}<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{(includePolicyCategories?[...FEEDBACK_CATEGORIES,'privacy','copyright','safety','spam','appeal','access','erasure']:FEEDBACK_CATEGORIES).map(category=><option key={category} value={category}>{ui[category]}</option>)}</select></label>
   {field('title',ui.title)}
   {field('detail',ui.detail,{area:true})}
   {form.category==='case_request'&&field('context',ui.context,{area:true,max:2000,rows:2})}
   <div className="feedback-columns"><label className="feedback-field">{ui.locale}<select value={form.locale} onChange={e=>setForm({...form,locale:e.target.value})}>{[...LANGUAGE_OPTIONS,{code:'en-CA',label:'English (Canada)'}].map(option=><option key={option.code} value={option.code}>{option.label}</option>)}</select></label>{field('country',ui.country,{max:100})}</div>
   {field('email',ui.email,{type:'email',max:254})}<p className="feedback-help">{ui.emailHelp}</p>
   <label className="feedback-field">{ui.files}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple disabled={busy} onChange={e=>{
    const selected=[...files,...e.target.files];e.target.value='';
    if(feedbackFileError(selected)){setError('INVALID_FILE');return;}setFiles(selected);setError('');
   }}/></label><p className="feedback-help">{ui.fileHelp}</p>
   <ul className="feedback-files">{files.map((file,index)=><li key={index}><span>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span><button type="button" aria-label={ui.remove+': '+file.name} onClick={()=>setFiles(files.filter((_,i)=>i!==index))}>{ui.remove}</button></li>)}</ul>
   <label className="feedback-check"><input type="checkbox" checked={includePage} onChange={e=>setIncludePage(e.target.checked)}/><span>{ui.source}{includePage&&<small>{location.pathname}</small>}</span></label>
   <p className="feedback-help">{ui.privacyNotice} <a href={'/'+i18n.language+'/privacy'} target="_blank" rel="noopener noreferrer">Smart JSA Bridge · {i18n.getFixedT(i18n.language,'main')('navPrivacy','Privacy')}</a></p>
   <label className="feedback-check"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{ui.consent}</span></label>
   <label hidden aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
   <button className="feedback-primary" disabled={busy||!consent}>{busy?ui.sending:ui.review}</button>
  </form>}
  {stage==='review'&&<section aria-label={ui.review}>
   <h3 data-feedback-stage tabIndex={-1}>{ui.review}</h3>
   <dl className="feedback-review">{[['category',ui.category],['title',ui.title],['detail',ui.detail],['context',ui.context],['locale',ui.locale],['country',ui.country],['email',ui.email]].filter(([key])=>form[key]).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{key==='category'?ui[form[key]]:form[key]}</dd></div>)}
    {includePage&&<div><dt>{ui.source}</dt><dd>{submission.current?.payload.source_path||location.pathname}</dd></div>}
   </dl>
   <ul className="feedback-files">{files.map((file,index)=><li key={index}>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</li>)}</ul>
   <p className="feedback-help">{ui.consent}</p>
   <div className="feedback-actions"><button type="button" disabled={busy||!!submission.current?.receipt} onClick={()=>{submission.current=null;setStage('edit');}}>{ui.back}</button><button className="feedback-primary" type="button" disabled={busy} onClick={submit}>{busy?ui.sending:ui.send}</button></div>
   {error==='EXPIRED'&&<button type="button" disabled={busy} onClick={reset}>{ui.reset}</button>}
  </section>}
  {stage==='success'&&<p className="feedback-success" role="status" data-feedback-stage tabIndex={-1}>{ui.success}</p>}
  <details className="feedback-status" open={stage==='success'||undefined}>
   <summary>{ui.check}</summary>
   <form onSubmit={event=>{event.preventDefault();run(async()=>setResult(await publicGateway('feedback_status',parseFeedbackReceipt(receipt))));}}>
    <label className="feedback-field">{ui.receipt}<input required maxLength={101} autoComplete="off" spellCheck={false} dir="ltr" value={receipt} onChange={e=>{setReceipt(e.target.value);setResult(null);}} onFocus={e=>e.target.select()}/></label>
    <p className="feedback-help">{ui.receiptHelp}</p><button disabled={busy||!receipt}>{ui.check}</button>
   </form>
   {result&&<div role="status"><p>{ui[result.status]||result.status}</p><p className="feedback-response">{result.response}</p>{result.case_group&&SUPPORTED_LANGS.includes(result.case_locale)&&<a href={casePath(result.case_locale,result.case_group)}>{ui.preview}</a>}</div>}
  </details>
  {stage==='success'&&<button type="button" onClick={reset}>{ui.reset}</button>}
 </div>;
}
