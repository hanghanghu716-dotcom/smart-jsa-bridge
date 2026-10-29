import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { accountSecurity } from '../locales/accountSecurity';
import { getCommunityUi } from '../locales/communityUi';
import { authenticatorQrSource } from '../utils/authenticatorQr';

export default function AdminVerification({onVerified}) {
  const { i18n } = useTranslation(), ui = accountSecurity(i18n.language);
  const [admin,setAdmin]=useState(false),[factor,setFactor]=useState(null),[qr,setQr]=useState(''),[code,setCode]=useState(''),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
  // Enrollment secrets stay in component memory only and are cleared on verification.
  const [secret,setSecret]=useState(''),[qrFailed,setQrFailed]=useState(false);
  useEffect(()=>{let live=true;(async()=>{
    const user=await supabase.auth.getUser();if(user.error)throw user.error;
    if(user.data.user?.app_metadata?.role!=='admin')return;
    const factors=await supabase.auth.mfa.listFactors(), assurance=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if(factors.error||assurance.error)throw factors.error||assurance.error;
    if(live){setAdmin(true);setFactor(factors.data.totp?.find(f=>f.status==='verified')?.id||null);setVerified(assurance.data.currentLevel==='aal2');}
  })().catch(()=>{if(live)setError(true);});return()=>{live=false;};},[]);
  if(!admin)return null;
  async function act(fn){setBusy(true);setError(false);try{await fn();}catch{setError(true);}finally{setBusy(false);}}
  async function enroll(){
    // Remove only unfinished enrollments belonging to this account, never a verified factor.
    const existing=await supabase.auth.mfa.listFactors();if(existing.error)throw existing.error;
    for(const f of existing.data.all||[])if(f.factor_type==='totp'&&f.status==='unverified'){const r=await supabase.auth.mfa.unenroll({factorId:f.id});if(r.error)throw r.error;}
    const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Smart JSA Bridge administrator'});if(error)throw error;
    setFactor(data.id);setQr(authenticatorQrSource(data.totp.qr_code));setSecret(data.totp.secret||'');setQrFailed(false);
  }
  async function verify(){const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw error;setQr('');setSecret('');setCode('');setVerified(true);onVerified?.();}
  return <section className="jsa-card" style={{margin:'16px 0',padding:16}}>
    <h3>{ui.mfa}</h3>
    {error&&<p role="alert">{getCommunityUi(i18n.language).error}</p>}
    {verified?<p role="status">{ui.verified}</p>:<>
      {qr&&!qrFailed&&<><p>{ui.scan}</p><div style={{background:'#fff',padding:24,width:'fit-content',maxWidth:'100%',boxSizing:'border-box',margin:'16px 0'}}>
        <img src={qr} width="280" height="280" alt="Authenticator QR" onError={()=>setQrFailed(true)} style={{display:'block',width:280,maxWidth:'100%',height:'auto',filter:'none'}}/>
      </div></>}
      {secret&&<details open={qrFailed||!qr||undefined} style={{margin:'16px 0'}}>
        <summary style={{cursor:'pointer'}}>{ui.manualSetup}</summary>
        <p>{ui.manualHelp}</p>
        <p><strong>{ui.setupKey}</strong></p>
        <code dir="ltr" style={{display:'block',fontSize:18,letterSpacing:1,overflowWrap:'anywhere',userSelect:'all',padding:'12px 0'}}>{secret}</code>
        <p>{ui.keepSecret}</p>
      </details>}
      {factor?<form onSubmit={e=>{e.preventDefault();act(verify);}}><label>{ui.code}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label><button disabled={busy||code.length!==6}>{ui.verify}</button></form>:<button disabled={busy} onClick={()=>act(enroll)}>{ui.enroll}</button>}
    </>}
  </section>;
}
