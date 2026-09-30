import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import { getBusinessAccount, getOrganization, getOrganizationDocument, getPersonalRevisions, getRevision, businessAction, companyEditorCopy } from '../services/businessService';
import { getBusinessUi, businessError } from '../locales/businessUi';
import { clearActiveDraft } from '../services/jsaDraftService';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import DocumentContent from '../components/DocumentContent';
import ThemeSwitcher from '../components/ThemeSwitcher';
import SEO from '../components/SEO';
import '../styles/workspaces.css';

function Snapshot({ snapshot }) {
 const { t } = useTranslation('export');
 if (!snapshot) return null;
 const layout=templateLayout(snapshot.custom_layout || {}, { docTitle:t('default.docTitle'), appr1:t('default.appr1'), appr2:t('default.appr2'), appr3:t('default.appr3'), savedActiveOrder:defaultColumns(snapshot.form_data?.jsaType) });
 return <div className="jsa-paper-scroll"><div className="jsa-public-paper"><DocumentContent formData={snapshot.form_data || {}} participants={snapshot.participants || []} analysisData={snapshot.analysis_data || []} layout={layout} stepPhotos={snapshot.custom_layout?.stepPhotos || {}} /></div></div>;
}
export default function Business() {
 const { i18n }=useTranslation(), ui=getBusinessUi(i18n.language), location=useLocation(), navigate=useLanguageNavigate();
 const [account,setAccount]=useState(null),[orgId,setOrgId]=useState(''),[org,setOrg]=useState(null),[docId,setDocId]=useState(''),[detail,setDetail]=useState(null);
 const [refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [name,setName]=useState(''),[source,setSource]=useState(''),[reviewer,setReviewer]=useState(''),[comment,setComment]=useState('');
 const [inviteRole,setInviteRole]=useState('viewer'),[inviteLink,setInviteLink]=useState(''),[token,setToken]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('invite') || '');
 const [personalId,setPersonalId]=useState(''),[personalHistory,setPersonalHistory]=useState([]),[preview,setPreview]=useState(null);
 const pending=useRef(false),previewRequest=useRef(0);
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const focus=()=>{setNow(Date.now());setRefresh(n=>n+1);};window.addEventListener('focus',focus);const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};},[]);
 const active=Boolean(account?.beta && Date.parse(account.beta.expires_at)>now);
 useEffect(()=>{if(preview)window.document.querySelector('[data-revision-preview]')?.scrollIntoView({behavior:'smooth',block:'start'});},[preview]);
 useEffect(()=>{let live=true;getBusinessAccount().then(value=>{if(live)setAccount(value);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[refresh]);
 useEffect(()=>{let live=true;if(orgId)getOrganization(orgId).then(value=>{if(live)setOrg(value);}).catch(e=>{if(live){setOrg(null);setPreview(null);previewRequest.current++;setError(e.message);}});return()=>{live=false;};},[orgId,refresh]);
 useEffect(()=>{let live=true;if(docId)getOrganizationDocument(docId).then(value=>{if(live)setDetail(value);}).catch(e=>{if(live){setDetail(null);setError(e.message);}});return()=>{live=false;};},[docId,refresh]);
 useEffect(()=>{let live=true;if(personalId)getPersonalRevisions(personalId).then(value=>{if(live)setPersonalHistory(value || []);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[personalId,refresh]);
 const currentOrg=org?.id===orgId?org:null;
 const document=detail?.document?.id===docId && detail.document.org_id===orgId?detail.document:null;
 const editable=currentOrg?.status.active && Date.parse(currentOrg.status.expires_at)>now && ['owner','editor'].includes(currentOrg.status.role);
 const docOptions={org:orgId,doc:docId,expected:document?.version};
 const personName=id=>currentOrg?.members.find(m=>m.user_id===id)?.name || id?.slice(0,8) || '—';
 const date=value=>new Date(value).toLocaleString(i18n.language==='ko'?'ko-KR':undefined);
 const run=async(action,options={})=>{
  if(pending.current)return null;pending.current=true;setBusy(true);setError('');setMessage('');
  try{const result=await businessAction(action,options);setRefresh(n=>n+1);setMessage(ui.saved);return result;}
  catch(e){setError(e.message);return null;}finally{pending.current=false;setBusy(false);}
 };
 const readPreview=async(id,company)=>{
  const request=++previewRequest.current;setError('');
  try{const item=await getRevision(id,company);if(request===previewRequest.current){if(!item)throw Error('NOT_FOUND');setPreview({ ...item,company });}}
  catch(e){if(request===previewRequest.current)setError(e.message);}
 };
 const chooseOrganization=id=>{previewRequest.current++;setOrgId(id);setDocId('');setDetail(null);setOrg(null);setReviewer('');setComment('');setInviteLink('');setPreview(null);};
 const importDocument=async(existing=false)=>{
  if(!window.confirm(ui.importConfirm))return;
  const result=await run('import_document',{org:orgId,doc:existing?docId:null,expected:existing?document?.version:null,payload:{project_id:source}});
  if(result)setDocId(result.id);
 };
 const restorePreview=async()=>{
  if(!preview || !window.confirm(ui.restoreConfirm))return;
  const current=account.projects.find(p=>p.id===personalId);
  const result=await run(preview.company?'restore_revision':'restore_personal',preview.company?{...docOptions,payload:{revision:preview.id}}:{doc:personalId,payload:{revision:preview.id,updatedAt:current?.updated_at}});
  if(result)setPreview(null);
 };
 return <div className="jsa-workspace" dir={i18n.dir()}>
  <SEO pageTitle={ui.title+' | Smart JSA Bridge'} noIndex />
  <header className="jsa-nav"><LanguageLink to="/">Smart JSA Bridge</LanguageLink><div className="jsa-toolbar"><LanguageLink to="/library">{ui.library}</LanguageLink><ThemeSwitcher compact /></div></header>
  <main className="jsa-container">
   <p className="jsa-eyebrow">{ui.beta}</p><h1>{ui.title}</h1><p className="jsa-notice">{ui.intro}</p>
   {error && <p role="alert">{businessError({message:error},ui)} <button onClick={()=>{setError('');setRefresh(n=>n+1);}}>{ui.refresh}</button></p>}
   {message && <p role="status">{message}</p>}
   <div className="jsa-card-grid">{[['free','freeDesc'],['pro','proDesc'],['business','businessDesc']].map(([title,description])=><section className="jsa-card" key={title}><h2>{ui[title]}</h2><p>{ui[description]}</p></section>)}</div>
   {!account && !error && <p role="status">{ui.loading}</p>}
   {account && !account.user && <LanguageLink className="jsa-primary" to={'/login?next='+encodeURIComponent(location.pathname+location.hash)}>{ui.login}</LanguageLink>}
   {account?.user && <>
    <section className="jsa-card"><p>{ui.trialIncludes}</p>{!account.beta?<button className="jsa-primary" disabled={busy} onClick={()=>run('start_beta',{payload:{plan:'business'}})}>{ui.start}</button>:<><p>{active?ui.active+': '+date(account.beta.expires_at):ui.expired}</p><p>{ui.interest}</p><div className="jsa-toolbar"><button disabled={busy} aria-pressed={account.beta.interest_plan==='pro'} onClick={()=>run('interest',{payload:{plan:'pro'}})}>{ui.interestedPro}</button><button disabled={busy} aria-pressed={account.beta.interest_plan==='business'} onClick={()=>run('interest',{payload:{plan:'business'}})}>{ui.interestedBusiness}</button></div></>}</section>
    {token && <section className="jsa-card"><h2>{ui.join}</h2><p>{ui.joinHint}</p><button disabled={busy} onClick={async()=>{const result=await run('join',{payload:{token}});if(result){setToken('');chooseOrganization(result.org_id);navigate('/business',{replace:true});}}}>{ui.join}</button></section>}
    <section className="jsa-card jsa-section"><h2>{ui.history}</h2><p>{ui.historyHint}</p><select aria-label={ui.history} value={personalId} onChange={e=>{setPersonalId(e.target.value);setPersonalHistory([]);setPreview(null);previewRequest.current++;}}><option value="">{ui.chooseSource}</option>{account.projects.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select>
     {personalId && <div className="jsa-history">{personalHistory.length?personalHistory.map(item=><button key={item.id} onClick={()=>readPreview(item.id,false)}>{date(item.created_at)} · {ui.preview}</button>):<p>{ui.empty}</p>}</div>}
    </section>
    <section className="jsa-card jsa-section"><h2>{ui.organizations}</h2><select aria-label={ui.organizations} value={orgId} onChange={e=>chooseOrganization(e.target.value)}><option value="">{ui.chooseOrg}</option>{account.organizations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><form className="jsa-toolbar" onSubmit={async e=>{e.preventDefault();const result=await run('create_org',{payload:{name}});if(result){setName('');chooseOrganization(result.id);}}}><input aria-label={ui.name} placeholder={ui.name} value={name} maxLength={120} onChange={e=>setName(e.target.value)} /><button disabled={busy || !active || !name.trim() || account.organizations.filter(o=>o.owner_id===account.user.id).length>=3}>{ui.create}</button></form><p>{ui.limit}</p></section>
    {orgId && !currentOrg && !error && <p role="status">{ui.loading}</p>}
    {currentOrg && <>
     {!currentOrg.status.active && <p className="jsa-notice">{ui.orgExpired}</p>}
     <section className="jsa-card jsa-section"><h2>{ui.members}</h2><div className="jsa-stack">{currentOrg.members.map(member=><div className="jsa-toolbar" key={member.user_id}><strong>{member.name}</strong><span>{ui[member.role]}</span>{currentOrg.status.role==='owner' && member.role!=='owner' && <><select aria-label={member.name+' '+ui.members} value={member.role} disabled={busy} onChange={e=>run('member_role',{org:orgId,payload:{user_id:member.user_id,role:e.target.value}})}>{['editor','reviewer','viewer'].map(role=><option key={role} value={role}>{ui[role]}</option>)}</select><button disabled={busy} onClick={()=>window.confirm(ui.removeConfirm)&&run('remove_member',{org:orgId,payload:{user_id:member.user_id}})}>{ui.remove}</button></>}</div>)}</div>
      {currentOrg.status.role==='owner'?<><p>{ui.inviteHint}</p><div className="jsa-toolbar"><select aria-label={ui.invite} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>{['viewer','editor','reviewer'].map(role=><option key={role} value={role}>{ui[role]}</option>)}</select><button disabled={busy || !currentOrg.status.active} onClick={async()=>{const result=await run('invite',{org:orgId,payload:{role:inviteRole}});if(result)setInviteLink(window.location.origin+'/'+i18n.language+'/business#invite='+result.token);}}>{ui.invite}</button></div>{inviteLink && <div className="jsa-toolbar"><input readOnly aria-label={ui.copy} value={inviteLink} onFocus={e=>e.target.select()} /><button onClick={async()=>{try{await navigator.clipboard.writeText(inviteLink);setMessage(ui.copied);}catch{setError('COPY_FAILED');}}}>{ui.copy}</button></div>}<div className="jsa-history">{currentOrg.invites.filter(item=>!item.revoked&&!item.accepted_by&&Date.parse(item.expires_at)>now).map(item=><div key={item.id}>{ui[item.role]} · {date(item.expires_at)} <button disabled={busy} onClick={()=>run('revoke_invite',{org:orgId,doc:item.id})}>{ui.revoke}</button></div>)}</div></>:<button disabled={busy} onClick={async()=>{if(window.confirm(ui.leaveConfirm)){const result=await run('leave',{org:orgId});if(result)chooseOrganization('');}}}>{ui.leave}</button>}
     </section>
     <section className="jsa-card jsa-section"><h2>{ui.templates}</h2><p>{ui.companyHint}</p>{currentOrg.templates.length?currentOrg.templates.map(item=><p key={item.id}>{item.name} · {ui.revision} {item.version}</p>):<p>{ui.empty}</p>}</section>
     <section className="jsa-card jsa-section"><h2>{ui.documents}</h2><p>{ui.importHint}</p><div className="jsa-toolbar"><select aria-label={ui.source} value={source} onChange={e=>setSource(e.target.value)}><option value="">{ui.chooseSource}</option>{account.projects.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select><button disabled={busy || !editable || !source} onClick={()=>importDocument()}>{ui.import}</button></div>
      <div className="jsa-card-grid">{currentOrg.documents.map(item=><article className="jsa-card" key={item.id}><h3>{item.title}</h3><p>{ui[item.state]} · {ui.revision} {item.version}</p><button onClick={()=>{setDocId(item.id);setPreview(null);setReviewer('');setComment('');previewRequest.current++;}}>{ui.open}</button></article>)}</div>{!currentOrg.documents.length&&<p>{ui.empty}</p>}
     </section>
     {document && <section className="jsa-card jsa-section"><h2>{document.title}</h2><p>{ui[document.state]} · {ui.revision} {document.version}</p><p>{ui.editHint}</p><div className="jsa-toolbar"><button onClick={()=>{clearActiveDraft();navigate('/info',{state:companyEditorCopy(document.snapshot)});}}>{ui.editCopy}</button>{editable && <><button disabled={busy || !source || !['draft','rejected'].includes(document.state)} onClick={()=>importDocument(true)}>{ui.replace}</button>{['approved','rejected'].includes(document.state)&&<button disabled={busy} onClick={()=>run('reopen',docOptions)}>{ui.reopen}</button>}{document.state==='submitted' && (currentOrg.status.role==='owner'||document.submitted_by===account.user.id) && <button disabled={busy} onClick={()=>run('withdraw',docOptions)}>{ui.withdraw}</button>}</>}</div>
      {editable && document.state==='draft' && <div className="jsa-toolbar"><select aria-label={ui.reviewer} value={reviewer} onChange={e=>setReviewer(e.target.value)}><option value="">{ui.chooseReviewer}</option>{currentOrg.members.filter(m=>['owner','reviewer'].includes(m.role)&&m.user_id!==account.user.id&&m.user_id!==document.edited_by).map(m=><option value={m.user_id} key={m.user_id}>{m.name}</option>)}</select><button disabled={busy || !reviewer} onClick={()=>run('submit',{...docOptions,payload:{reviewer_id:reviewer}})}>{ui.submit}</button></div>}
      {document.state==='submitted' && <p>{ui.reviewer}: {personName(document.reviewer_id)}</p>}
      {currentOrg.status.active && document.state==='submitted' && document.reviewer_id===account.user.id && ['owner','reviewer'].includes(currentOrg.status.role) && <><label>{ui.comment}<textarea maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)} /></label><div className="jsa-toolbar"><button disabled={busy} onClick={()=>run('approve',{...docOptions,payload:{comment}})}>{ui.approve}</button><button disabled={busy||!comment.trim()} onClick={()=>run('reject',{...docOptions,payload:{comment}})}>{ui.reject}</button></div></>}
      <Snapshot snapshot={document.snapshot} /><h3>{ui.audit}</h3><div className="jsa-history">{detail.revisions.map(item=><div key={item.id}><button onClick={()=>readPreview(item.id,true)}>{ui.revision} {item.version} · {ui[item.state]} · {date(item.created_at)}</button><p>{ui.actor}: {personName(item.actor_id)} {item.comment && '— '+item.comment}</p></div>)}</div>
     </section>}
    </>}
    {preview && <section className="jsa-card jsa-section" data-revision-preview><h2>{ui.preview} · {date(preview.created_at)}</h2><div className="jsa-toolbar"><button onClick={()=>{setPreview(null);previewRequest.current++;}}>{ui.close}</button><button disabled={busy || (preview.company ? !editable || !document || document.state==='submitted' : !active || preview.project_id!==personalId)} onClick={restorePreview}>{ui.restore}</button></div><Snapshot snapshot={preview.snapshot} /></section>}
   </>}
  </main>
 </div>;
}
