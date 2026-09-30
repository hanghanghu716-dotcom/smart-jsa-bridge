import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { getBusinessAccount, getOrganization, saveCompanyTemplate, businessAction } from '../services/businessService';
import { getBusinessUi, businessError } from '../locales/businessUi';

export default function CompanyTemplateManager({ layout, onApply }) {
 const { i18n }=useTranslation(),ui=getBusinessUi(i18n.language);
 const [organizations,setOrganizations]=useState([]),[orgId,setOrgId]=useState(''),[org,setOrg]=useState(null),[selectedId,setSelectedId]=useState(''),[name,setName]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
 const pending=useRef(false);
 useEffect(()=>{let live=true;getBusinessAccount().then(data=>{if(live)setOrganizations(data.organizations);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[]);
 useEffect(()=>{let live=true;if(orgId)getOrganization(orgId).then(data=>{if(live)setOrg(data);}).catch(e=>{if(live){setOrg(null);setError(e.message);}});return()=>{live=false;};},[orgId,refresh]);
 const current=org?.id===orgId?org:null, selected=current?.templates.find(item=>item.id===selectedId);
 const writable=current?.status.active && ['owner','editor'].includes(current.status.role);
 const perform=async action=>{
  if(pending.current)return;
  if(action!=='new'&&!window.confirm(ui.templateConfirm))return;
  pending.current=true;setBusy(true);setError('');
  try{
   if(action==='delete'){await businessAction('delete_template',{org:orgId,doc:selectedId,expected:selected.version});setSelectedId('');setName('');}
   else {const result=await saveCompanyTemplate({org:orgId,id:action==='new'?null:selectedId,version:selected?.version,name,layout});setSelectedId(result.id);}
   setRefresh(n=>n+1);
  }catch(e){setError(e.message);}finally{pending.current=false;setBusy(false);}
 };
 const control={width:'100%',padding:'8px',margin:'5px 0',border:'1px solid var(--border-default)',borderRadius:6,background:'var(--input-bg)',color:'var(--text-primary)',fontSize:12};
 const button={...control,width:'auto',cursor:'pointer'};
 return <section data-company-template-manager style={{borderTop:'1px solid var(--border-default)',marginTop:18,paddingTop:16}}>
  <h3>{ui.templates}</h3><p style={{fontSize:12,color:'var(--text-secondary)'}}>{ui.companyHint}</p>
  {!organizations.length&&<p style={{fontSize:12}}>{ui.noOrg} <LanguageLink to="/business">{ui.title} →</LanguageLink></p>}
  {error&&<p role="alert">{businessError({message:error},ui)} <button style={button} onClick={()=>{setError('');setRefresh(n=>n+1);}}>{ui.retry}</button></p>}
  <select style={control} aria-label={ui.organizations} value={orgId} disabled={busy} onChange={e=>{setOrgId(e.target.value);setOrg(null);setSelectedId('');setName('');}}><option value="">{ui.chooseOrg}</option>{organizations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
  {current&&<><select style={control} aria-label={ui.chooseTemplate} value={selectedId} disabled={busy} onChange={e=>{setSelectedId(e.target.value);setName(current.templates.find(item=>item.id===e.target.value)?.name || '');}}><option value="">{ui.chooseTemplate}</option>{current.templates.map(item=><option value={item.id} key={item.id}>{item.name} · {ui.revision} {item.version}</option>)}</select><button style={button} disabled={!selected||busy} onClick={()=>onApply(selected)}>{ui.apply}</button>
   {!current.status.active&&<p style={{fontSize:12}}>{ui.orgExpired}</p>}
   {writable&&<><input style={control} aria-label={ui.templateName} placeholder={ui.templateName} value={name} maxLength={120} onChange={e=>setName(e.target.value)} /><div style={{display:'flex',flexWrap:'wrap',gap:5}}><button style={button} disabled={busy||!name.trim()} onClick={()=>perform('new')}>{ui.saveTemplate}</button><button style={button} disabled={busy||!selected||!name.trim()} onClick={()=>perform('update')}>{ui.updateTemplate}</button><button style={button} disabled={busy||!selected} onClick={()=>perform('delete')}>{ui.deleteTemplate}</button></div></>}
  </>}
 </section>;
}
