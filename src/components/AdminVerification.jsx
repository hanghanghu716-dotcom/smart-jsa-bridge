import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { accountSecurity } from '../locales/accountSecurity';
import { getCommunityUi } from '../locales/communityUi';

export default function AdminVerification({onVerified}) {
  const { i18n } = useTranslation(), ui = accountSecurity(i18n.language);
  const [admin,setAdmin]=useState(false),[factor,setFactor]=useState(null),[qr,setQr]=useState(''),[code,setCode]=useState(''),[verified,setVerified]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
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
    setFactor(data.id);setQr(data.totp.qr_code);
  }
  async function verify(){const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:factor,code});if(error)throw error;setQr('');setCode('');setVerified(true);onVerified?.();}
  return <section className="jsa-card" style={{margin:'16px 0',padding:16}}><h3>{ui.mfa}</h3>{error&&<p role="alert">{getCommunityUi(i18n.language).error}</p>}{verified?<p role="status">{ui.verified}</p>:<>{qr&&<><p>{ui.scan}</p><img src={qr} width="200" height="200" alt="Authenticator QR"/></>}{factor?<form onSubmit={e=>{e.preventDefault();act(verify);}}><label>{ui.code}<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label><button disabled={busy||code.length!==6}>{ui.verify}</button></form>:<button disabled={busy} onClick={()=>act(enroll)}>{ui.enroll}</button>}</>}</section>;
}
