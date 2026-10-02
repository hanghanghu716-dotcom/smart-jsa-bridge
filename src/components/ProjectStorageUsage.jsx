import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStorageUsage } from '../services/projectStorageService';
import { getStorageUi } from '../locales/storageUi';
import { formatStorageCount } from '../locales/phase6Ui';
import { getVisibilityUi } from '../locales/visibilityUi';
export default function ProjectStorageUsage({ refreshKey, onStatus }) {
 const { i18n }=useTranslation(),ui=getStorageUi(i18n.language);
 const [usage,setUsage]=useState(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 const callback=useRef(onStatus);
 useEffect(()=>{callback.current=onStatus;},[onStatus]);
 useEffect(()=>{
  let active=true,request=0;
  const refresh=async()=>{const current=++request;try{const value=await getStorageUsage();if(active&&current===request){setUsage(value);setFailed(false);callback.current?.(value);}}catch{if(active&&current===request){setFailed(true);setUsage(null);callback.current?.(null);}}};
  refresh();window.addEventListener('focus',refresh);window.addEventListener('jsa-storage-changed',refresh);
  const timer=setInterval(refresh,60000);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('jsa-storage-changed',refresh);};
 },[refreshKey,attempt]);
 if(!usage&&!failed)return null;
 return <section data-storage-usage dir={i18n.dir()} style={{padding:'14px 16px',margin:'12px 0',border:'1px solid var(--border-default)',borderRadius:8,background:'var(--panel-bg)',color:'var(--text-primary)',fontSize:13,lineHeight:1.6,textAlign:'start',minWidth:0,overflowWrap:'anywhere'}}>
  <strong>{ui.title}</strong>
  {failed?<p role="status">{ui.error} <button type="button" onClick={()=>setAttempt(n=>n+1)}>{ui.retry}</button></p>:<><p>{(usage.trial_active ? ui.trial : ui.used).replace('{used}',formatStorageCount(usage.used,i18n.language)).replace('{limit}',formatStorageCount(usage.limit ?? 3,i18n.language))}</p>{!usage.trial_active && usage.trial_expires_at && <p>{ui.expired}</p>}<p>{usage.trial_active?getVisibilityUi(i18n.language).beta:usage.can_create?ui.hint:ui.full}</p></>}
 </section>;
}
