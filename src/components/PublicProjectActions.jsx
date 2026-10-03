import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import { supabase } from '../supabaseClient';
import { getPublicJsa, scrapPublicJsa } from '../services/publicJsaService';
import { publicForkState } from '../utils/publicJsa';
import { clearActiveDraft } from '../services/jsaDraftService';
import { recordPublicEngagement } from '../services/publicEngagementService';
import { getPublicUi } from '../locales/publicUi';
import { communityAction } from '../services/communityService';
import { getCommunityUi } from '../locales/communityUi';

export default function PublicProjectActions({ row, onChanged }) {
  const { t, i18n } = useTranslation('explore');
  const ui = getPublicUi(i18n.language), navigate = useLanguageNavigate(), location = useLocation();
  const [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  const [report,setReport] = useState(false), [reason,setReason] = useState('');
  const [hide,setHide] = useState(true), [block,setBlock] = useState(false);
  const dialog = useRef(null), menu = useRef(null), pending = useRef(false);
  useEffect(()=>{ if(report) dialog.current?.showModal(); else dialog.current?.close(); },[report]);
  const act = async kind => {
    if(pending.current) return;
    pending.current=true;setBusy(true);setMessage('');
    if(menu.current) menu.current.open=false;
    try {
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError || !user){navigate('/login?next='+encodeURIComponent(location.pathname));return;}
      if(kind==='scrap'){await scrapPublicJsa(row.id);setMessage(ui.saved);onChanged();}
      if(kind==='reuse'){
        const fresh=await getPublicJsa(row.id);if(!fresh)throw Error('UNAVAILABLE');
        if(fresh.reuse_license !== 'community-v1'){setMessage(getCommunityUi(i18n.language).licensePending);return;}
        const state=publicForkState(fresh);clearActiveDraft();navigate('/info',{state});
        void recordPublicEngagement(row.id,'reuse',fresh.analysis_data.map((_,i)=>i));
      }
      if(kind==='report')setReport(true);
      if(kind==='submit'){
        if(reason.trim().length<10)return;
        await communityAction('request',row.id,{category:'safety',detail:reason.trim()});
        if(hide){const result=await supabase.from('user_project_blocks').upsert({user_id:user.id,project_id:row.id},{onConflict:'user_id,project_id',ignoreDuplicates:true});if(result.error)throw result.error;}
        if(block){const result=await supabase.from('user_blocks').upsert({blocker_id:user.id,blocked_user_id:row.author_id},{onConflict:'blocker_id,blocked_user_id',ignoreDuplicates:true});if(result.error)throw result.error;}
        setReport(false);setReason('');setMessage(ui.reported);onChanged();
      }
    }catch{setMessage(ui.error);}finally{pending.current=false;setBusy(false);}
  };
  return <div className="explore-project-actions">
    <details ref={menu}><summary aria-label={ui.actions+' · '+row.title}>•••</summary><div className="explore-action-menu">
      <button disabled={busy} onClick={()=>act('scrap')}>{t('saveLibrary')}</button>
      <button disabled={busy} onClick={()=>act('reuse')}>{t('startWithThis')}</button>
      <button disabled={busy} onClick={()=>act('report')}>{ui.report}</button>
    </div></details>
    {!report && message && <span className="explore-action-status" role="status">{message}</span>}
    <dialog ref={dialog} className="explore-report-dialog" onCancel={()=>setReport(false)} aria-label={t('reportModalTitle')}>
      <form onSubmit={event=>{event.preventDefault();void act('submit');}}>
        <h2>{t('reportModalTitle')}</h2><p>{row.title}</p>
        <textarea aria-label={ui.reason} placeholder={t('reportPlaceholder')} value={reason} onChange={event=>setReason(event.target.value)} required minLength={10} maxLength={2000} />
        <label><input type="checkbox" checked={hide} onChange={event=>setHide(event.target.checked)} />{t('hideProjectOption')}</label>
        <label><input type="checkbox" checked={block} onChange={event=>setBlock(event.target.checked)} />{t('blockUserOption')}</label>
        {message && <p role="status">{message}</p>}
        <div className="jsa-toolbar"><button disabled={busy || reason.trim().length<10} type="submit">{t('submitReportBtn')}</button><button type="button" disabled={busy} onClick={()=>setReport(false)}>{t('cancelBtn')}</button><button type="button" onClick={()=>navigate('/community?project='+row.id)}>{getCommunityUi(i18n.language).hub}</button></div>
      </form>
    </dialog>
  </div>;
}
