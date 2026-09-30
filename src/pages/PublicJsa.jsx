import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import { getPublicJsa, scrapPublicJsa } from '../services/publicJsaService';
import { publicForkState, publicJsaView, publicJsaQuality } from '../utils/publicJsa';
import { getPublicUi } from '../locales/publicUi';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import { clearActiveDraft } from '../services/jsaDraftService';
import { supabase } from '../supabaseClient';
import DocumentContent from '../components/DocumentContent';
import ThemeSwitcher from '../components/ThemeSwitcher';
import SEO from '../components/SEO';
import '../styles/workspaces.css';

export default function PublicJsa() {
  const { id } = useParams(), location = useLocation(), navigate = useLanguageNavigate();
  const { t, i18n } = useTranslation('export');
  const ui = getPublicUi(i18n.language);
  const [row, setRow] = useState(() => typeof window !== 'undefined' && window.__PUBLIC_JSA__?.id === id ? publicJsaView(window.__PUBLIC_JSA__) : null);
  const [status, setStatus] = useState(row ? 'ready' : 'loading');
  const [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false), [reason, setReason] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const result = await getPublicJsa(id); if (active) { setRow(result); setStatus(result ? 'ready' : 'missing'); } }
      catch { if (active) { setRow(null); setStatus('error'); } }
    };
    refresh(); window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [id, attempt]);
  const requireUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) navigate('/login?next=' + encodeURIComponent(location.pathname));
    return user;
  };
  const action = async kind => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setMessage('');
    try {
      if (kind === 'share') { await navigator.clipboard.writeText(window.location.origin + '/' + (row.public_locale || i18n.language) + '/public-jsa/' + id); setMessage(ui.copied); return; }
      if (kind === 'reuse') {
        const fresh = await getPublicJsa(id);
        if (!fresh) { setRow(null); setStatus('missing'); return; }
        clearActiveDraft(); navigate('/info', { state: publicForkState(fresh) }); return;
      }
      const user = await requireUser(); if (!user) return;
      if (kind === 'scrap') { await scrapPublicJsa(id); setMessage(ui.saved); }
      if (kind === 'report') {
        const { error } = await supabase.from('user_reports').insert({ reporter_id: user.id, project_id: id, reason: reason.trim() });
        if (error) throw error;
        setMessage(ui.reported); setReportOpen(false); setReason('');
      }
    } catch { setMessage(ui.error); }
    finally { pending.current = false; setBusy(false); }
  };
  const currentRow = row?.id === id ? row : null;
  const quality = publicJsaQuality(currentRow);
  const layout = templateLayout(currentRow?.custom_layout, { docTitle: t('default.docTitle'), appr1: t('default.appr1'), appr2: t('default.appr2'), appr3: t('default.appr3'), savedActiveOrder: defaultColumns(currentRow?.form_data?.jsaType) });
  return <div className="jsa-workspace" dir={i18n.dir()}>
    <SEO pageTitle={(currentRow?.title || ui.title) + ' | Smart JSA Bridge'} pageDescription={currentRow?.analysis_data?.map(step => step.proc?.stepTitle).filter(Boolean).join(' · ') || ui.intro}
      canonicalLocale={currentRow?.public_locale || undefined} availableLocales={currentRow?.public_locale ? [currentRow.public_locale] : []} noIndex={!quality.indexable} />
    <header className="jsa-nav"><LanguageLink to="/explore">← {ui.back}</LanguageLink><ThemeSwitcher compact /></header>
    <main className="jsa-container">
      {status === 'loading' && <p role="status">…</p>}
      {status === 'error' && <p role="alert">{ui.error} <button onClick={() => setAttempt(n => n + 1)}>{ui.retry}</button></p>}
      {status === 'missing' && <h1>{ui.unavailable}</h1>}
      {currentRow && <><span className="jsa-eyebrow">{ui.community}</span><h1>{currentRow.title}</h1>
        <p>{ui.steps}: {quality.steps} · {ui.quality}</p><p className="jsa-notice">{ui.notice}</p>
        <div className="jsa-toolbar"><button className="jsa-primary" disabled={busy} onClick={() => action('reuse')}>{ui.reuse}</button><button disabled={busy} onClick={() => action('scrap')}>{ui.scrap}</button><button disabled={busy} onClick={() => action('share')}>{ui.share}</button><button onClick={() => setReportOpen(value => !value)}>{ui.report}</button></div>
        {reportOpen && <form className="jsa-card" onSubmit={e => { e.preventDefault(); action('report'); }}><label>{ui.reason}<textarea required maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={busy || !reason.trim()}>{ui.submit}</button></form>}
        {message && <p role="status">{message}</p>}
        <div className="jsa-paper-scroll"><div className="jsa-public-paper"><DocumentContent formData={currentRow.form_data} participants={[]} analysisData={currentRow.analysis_data} layout={layout} /></div></div>
      </>}
    </main>
  </div>;
}
