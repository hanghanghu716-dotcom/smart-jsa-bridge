import {useEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {communityAction} from '../services/communityService';
import {getSocialUi} from '../locales/socialUi';
export default function AuthorCorrections(){
 const {i18n}=useTranslation(),ui=getSocialUi(i18n.language);
 const [data,setData]=useState(null),[refresh,setRefresh]=useState(0),[request,setRequest]=useState(''),[revision,setRevision]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false);
 useEffect(()=>{let active=true;communityAction('corrections').then(result=>{if(active)setData(result);}).catch(()=>{if(active)setMessage(ui.error);});return()=>{active=false;};},[refresh,ui.error]);
 const submit=async e=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await communityAction('resubmit',request,{revisionId:revision});setRequest('');setRevision('');setRefresh(n=>n+1);setMessage(ui.saved);}catch{setMessage(ui.error);}finally{lock.current=false;setBusy(false);}};
 if(!data?.requests.length&&!message)return null;
 return <section className="jsa-card"><h2>{ui.resubmit}</h2><p>{ui.revisionHelp}</p>{message&&<p role="status">{message}</p>}{Boolean(data?.requests.length)&&<form onSubmit={submit}><label>{ui.receipt}<select required value={request} onChange={e=>{setRequest(e.target.value);setRevision('');}}><option value="">—</option>{data.requests.map(r=><option key={r.id} value={r.id}>{r.title} · {r.id.slice(0,8)}</option>)}</select></label><label>{ui.revision}<select required value={revision} onChange={e=>setRevision(e.target.value)}><option value="">—</option>{data.documents.filter(d=>{const item=data.requests.find(r=>r.id===request);return d.id!==item?.project_id&&d.id!==item?.revision_project_id;}).map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label><button disabled={busy||!request||!revision}>{ui.resubmit}</button></form>}</section>;
}
