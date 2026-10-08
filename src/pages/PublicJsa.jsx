import { usePublicTranslation } from '../hooks/usePublicTranslation';
import PublicTranslationNotice from '../components/PublicTranslationNotice';
import { countryLabel } from '../utils/publicCountry';
import { getPublicCountryUi } from '../locales/publicCountryUi';
import DiscoveryLinks from '../components/DiscoveryLinks';
import AuthorLink from '../components/AuthorLink';
import AdSenseUnit from '../components/AdSenseUnit';
import {documentStats,riskValue} from '../utils/discovery';
import {getDiscoveryUi} from '../locales/discoveryUi';
import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import { getPublicJsa, scrapPublicJsa } from '../services/publicJsaService';
import { recordPublicEngagement } from '../services/publicEngagementService';
import { publicForkState, publicJsaView, publicJsaQuality } from '../utils/publicJsa';
import { getLanguageTag } from '../locales/config';
import { getPublicUi } from '../locales/publicUi';
import { templateLayout, defaultColumns } from '../utils/documentLayout';
import { clearActiveDraft } from '../services/jsaDraftService';
import { supabase } from '../supabaseClient';
import DocumentContent from '../components/DocumentContent';
import ThemeSwitcher from '../components/ThemeSwitcher';
import CommunityFooter from '../components/CommunityFooter';
import { getCommunityUi } from '../locales/communityUi';
import '../styles/community.css';
import SEO from '../components/SEO';
import '../styles/workspaces.css';

export default function PublicJsa() {
  const { id } = useParams(), location = useLocation(), navigate = useLanguageNavigate();
  const { t, i18n } = useTranslation('export');
  const ui = getPublicUi(i18n.language);
  const community = getCommunityUi(i18n.language);
  const [selection,setSelection] = useState({id,indices:[]});
  const selectedSteps=selection.id===id?selection.indices:[];
  const setSelectedSteps=fn=>setSelection(previous=>({id,indices:fn(previous.id===id?previous.indices:[])}));
  const [row, setRow] = useState(() => typeof window !== 'undefined' && window.__PUBLIC_JSA__?.id === id ? publicJsaView(window.__PUBLIC_JSA__) : null);
  const [status, setStatus] = useState(row ? 'ready' : 'loading');
  const [attempt, setAttempt] = useState(0), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const pending = useRef(false);
  const readyId = status === 'ready' && row?.id === id ? id : null;
  useEffect(() => {
    if (!readyId) return;
    let active = true;
    recordPublicEngagement(readyId, 'view').then(metrics => {
      if (active && metrics) setRow(previous => previous?.id === readyId ? { ...previous, ...metrics } : previous);
    });
    return () => { active = false; };
  }, [readyId]);
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
      if (kind === 'reuse' || kind === 'selected') {
        if (!await requireUser()) return;
        const fresh = await getPublicJsa(id);
        if (!fresh) { setRow(null); setStatus('missing'); return; }
        if (fresh.reuse_license !== 'community-v1') { setMessage(community.licensePending);return; }
        const indices = kind==='selected' ? selectedSteps.filter(index=>index>=0 && index<fresh.analysis_data.length) : fresh.analysis_data.map((_,index)=>index);
        if(!indices.length)return;
        const state = publicForkState(fresh,indices);
        clearActiveDraft(); navigate('/info', { state });
        void recordPublicEngagement(id, 'reuse', indices);
        return;
      }
      const user = await requireUser(); if (!user) return;
      if (kind === 'scrap') { await scrapPublicJsa(id); setMessage(ui.saved); }

    } catch { setMessage(ui.error); }
    finally { pending.current = false; setBusy(false); }
  };
  const sourceRow = row?.id === id ? row : null;
  const translation=usePublicTranslation(sourceRow?[sourceRow]:[],i18n.language,true);
  const currentRow=translation.rows[0]||null;
  const quality = publicJsaQuality(sourceRow), stats=documentStats(currentRow), d=getDiscoveryUi(i18n.language);
  const layout = templateLayout(currentRow?.custom_layout, { docTitle: t('default.docTitle'), appr1: t('default.appr1'), appr2: t('default.appr2'), appr3: t('default.appr3'), savedActiveOrder: defaultColumns(currentRow?.form_data?.jsaType) });
  return <div className="jsa-workspace" dir={i18n.dir()}>
    <SEO pageTitle={(sourceRow?.title || ui.title) + ' | Smart JSA Bridge'} pageDescription={sourceRow?.analysis_data?.map(step => step.proc?.stepTitle).filter(Boolean).join(' · ') || ui.intro}
      canonicalLocale={currentRow?.public_locale || undefined} availableLocales={currentRow?.public_locale ? [currentRow.public_locale] : []} noIndex={!quality.indexable||Boolean(sourceRow?.public_locale&&sourceRow.public_locale!==i18n.language)} />
    <header className="jsa-nav"><LanguageLink to="/explore">← {ui.back}</LanguageLink><ThemeSwitcher compact /></header>
    <main className="jsa-container">
      {status === 'loading' && <p role="status">…</p>}
      {status === 'error' && <p role="alert">{ui.error} <button onClick={() => setAttempt(n => n + 1)}>{ui.retry}</button></p>}
      {status === 'missing' && <h1>{ui.unavailable}</h1>}
      {currentRow && <><span className="jsa-eyebrow">{ui.community}</span><h1 lang={getLanguageTag(translation.translated?i18n.language:sourceRow.public_locale||i18n.language)}>{currentRow.title}</h1>
        <p>{getPublicCountryUi(i18n.language).origin}: {countryLabel(sourceRow.public_country,i18n.language)}</p>
        <PublicTranslationNotice translation={translation} locale={i18n.language}/>
        <AuthorLink id={currentRow.author_id}/>
        <section className="public-document-preview" aria-labelledby="public-document-preview-title">
          <h2 id="public-document-preview-title">{community.preview}</h2>
          <div className="jsa-paper-scroll" tabIndex={0} role="region" aria-labelledby="public-document-preview-title">
            <div className="jsa-public-paper"><DocumentContent formData={currentRow.form_data} participants={[]} analysisData={currentRow.analysis_data} layout={layout} /></div>
          </div>
        </section>
        <p>{ui.steps}: {quality.steps} · {ui.quality}</p><p className="jsa-notice">{ui.notice}</p>
        <p>{ui.views} {currentRow.view_count.toLocaleString(getLanguageTag(i18n.language))} · {ui.reuses} {currentRow.reuse_count.toLocaleString(getLanguageTag(i18n.language))} · {ui.scraps} {currentRow.scrap_count.toLocaleString(getLanguageTag(i18n.language))}</p>
        <details className="jsa-metric-help"><summary>{ui.metricHelp}</summary><p>{ui.metricRules}</p></details>
        <div className="jsa-toolbar"><button className="jsa-primary" disabled={busy || !currentRow.reuse_license} onClick={() => action('reuse')}>{ui.reuse}</button><button disabled={busy} onClick={() => action('scrap')}>{ui.scrap}</button><button disabled={busy} onClick={() => action('share')}>{ui.share}</button><LanguageLink to={'/community?project='+id}>{ui.report}</LanguageLink></div>
        {!currentRow.reuse_license && <p className="jsa-notice">{community.licensePending}</p>}
        <p>{currentRow.public_locale} · {new Date(currentRow.updated_at).toLocaleDateString(getLanguageTag(i18n.language))} · {d.derived} {currentRow.fork_count}</p>
        <dl className="public-stats"><div><dt>{d.hazards}</dt><dd>{stats.hazards}</dd></div><div><dt>{d.controls}</dt><dd>{stats.controls}</dd></div><div><dt>{d.categories}</dt><dd>{stats.categories.map(c=>t(c,{ns:'risk',defaultValue:c})).join(' · ')||'—'}</dd></div></dl>
        <div className="public-context">{['scope','region','limitations','sources'].filter(key=>currentRow.publication_context[key]).map(key=><section key={key}><h2>{community[key]}</h2><p>{currentRow.publication_context[key]}</p></section>)}</div>
        <section className="public-reading" lang={getLanguageTag(translation.translated?i18n.language:sourceRow.public_locale||i18n.language)}><h2>{community.overview}</h2>{currentRow.analysis_data.map((step,index)=><article className="public-step" key={index}><header><input type="checkbox" disabled={!currentRow.reuse_license} aria-label={community.selectSteps+' '+(index+1)} checked={selectedSteps.includes(index)} onChange={e=>setSelectedSteps(previous=>e.target.checked?[...previous,index].sort((a,b)=>a-b):previous.filter(value=>value!==index))}/><h2>{index+1}. {step.proc.stepTitle}</h2></header><p>{step.proc.stepDetail}</p><p className="public-risk-score">{d.frequency}: {riskValue(step.frequency)??'—'} · {d.severity}: {riskValue(step.severity)??'—'} · {d.risk}: {riskValue(step.riskLevel)??'—'}</p>{step.risks.map((risk,riskIndex)=><div className="public-risk" key={riskIndex}><h3>{risk.factor}</h3>{risk.category&&<small>{d.categories}: {t(risk.category,{ns:"risk",defaultValue:risk.category})}</small>}<p><strong>{t('tags.DATA_CURRENT_MEASURE')}</strong><br/>{risk.current_measure||risk.measure}</p>{risk.recommend_measure&&<p><strong>{t('tags.DATA_RECOMMEND_MEASURE')}</strong><br/>{risk.recommend_measure}</p>}</div>)}</article>)}<button className="jsa-primary" disabled={busy||!selectedSteps.length||!currentRow.reuse_license} onClick={()=>action('selected')}>{community.useSelected} ({selectedSteps.length})</button></section>

        <DiscoveryLinks id={id}/><AdSenseUnit client="ca-pub-9791625990220699" slot="1284119169" content={{indexable:quality.indexable,review:currentRow.assessment.review}}/>
        {message && <p role="status">{message}</p>}
      </>}
    </main><CommunityFooter/>
  </div>;
}
