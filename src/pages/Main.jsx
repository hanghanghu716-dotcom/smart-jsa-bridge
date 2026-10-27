import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageLink, useLanguageNavigate } from '../hooks/useLanguage';
import { supabase } from '../supabaseClient';
import { clearActiveDraft } from '../services/jsaDraftService';
import { caseListBootstrap, isStaticContentBuild } from '../utils/caseListBootstrap';
import { journeyContext, newJourneyState } from '../utils/regionalJourney';
import { loadHomeCaseThumbnails } from '../utils/caseThumbnail';
import { cleanSummary } from '../utils/content';
import { getCaseLanguages, selectLocalizedCases } from '../locales/config';
import { communityHomeUi } from '../locales/communityHomeUi';
import { getWorkspaceNavUi } from '../locales/workspaceNavUi';
import { hubSearch } from '../utils/resourceHub';
import { resourceHubUi } from '../locales/resourceHubUi';
import { getPublicUi } from '../locales/publicUi';
import PublicSiteHeader from '../components/PublicSiteHeader';
import HomePublicCatalog from '../components/HomePublicCatalog';
import HomeTopicNavigation from '../components/HomeTopicNavigation';
import CommunityFooter from '../components/CommunityFooter';
import SEO from '../components/SEO';
import '../styles/community-home.css';

export default function Main() {
  const { t, i18n } = useTranslation('main');
  const locale = i18n.language, ui = communityHomeUi(locale), w = getWorkspaceNavUi(locale), p = getPublicUi(locale);
  const navigate = useLanguageNavigate(), { user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState(() => ({ locale, rows: caseListBootstrap() }));
  const [startOpen, setStartOpen] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (isStaticContentBuild()) return;
    let active = true;
    supabase.from('case_studies').select('id,post_group_id,title,meta_description,created_at,language_code')
      .in('language_code', getCaseLanguages(locale)).order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        const selected=error?[]:selectLocalizedCases(data||[],locale);
        if(active)setCases({locale,rows:selected,error:Boolean(error)});
        if(!error){try{const rows=await loadHomeCaseThumbnails(supabase,selected);if(active)setCases({locale,rows});}catch{/* Keep readable summaries when an image read fails. */}}
      });
    return () => { active = false; };
  }, [locale]);
  useEffect(() => {
    if (!startOpen) return;
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const close = event => {
      if (event.key === 'Escape') setStartOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = overflow; previous?.focus(); };
  }, [startOpen]);
  const start = isMember => {
    clearActiveDraft({ preserveGuest: !isMember });
    navigate('/templates', { state: { ...newJourneyState(journeyContext(locale)), isMember } });
  };
  const create = () => user ? start(true) : setStartOpen(true);
  const rows = cases.locale === locale ? cases.rows.slice(0, 3) : [];
  return <div className="community-home" dir={i18n.dir()}>
    <SEO pageTitle={p.title + ' | Smart JSA Bridge'} pageDescription={ui.intro} />
    <PublicSiteHeader community />
    <main className="home-content">
      <section className="home-intro">
        <div><h1>{ui.title}</h1><p>{ui.intro}</p></div>
        <button className="home-create" onClick={create}><span aria-hidden="true">＋</span>{ui.create}</button>
      </section>
      <form className="home-search" role="search" action={'/' + locale + '/search'} onSubmit={event => { event.preventDefault(); navigate('/search' + hubSearch({ q: query, type: 'all' })); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg>
        <input name="q" type="search" aria-label={resourceHubUi(locale).search} placeholder={resourceHubUi(locale).title} value={query} onChange={event => setQuery(event.target.value)} />
        <button type="submit">{ui.search}</button>
      </form>
      <p><LanguageLink to="/resources">{resourceHubUi(locale).title} →</LanguageLink></p>
      <HomeTopicNavigation locale={locale} />
      <HomePublicCatalog />
      <section id="case-studies" className="home-cases" aria-labelledby="home-cases-title">
        <div className="home-section-heading"><h2 id="home-cases-title">{ui.cases}</h2><LanguageLink to="/archive">{ui.cases} →</LanguageLink></div>
        <div data-live-case-list="home">
          <div className="home-case-grid">{rows.map(row => <article className="home-case-card" key={row.post_group_id}>
            {row.thumbnail && <LanguageLink to={'/case-study/' + row.post_group_id} className="home-case-image" tabIndex={-1} aria-hidden="true"><img src={row.thumbnail} alt="" loading="lazy" decoding="async" width="1536" height="1024" onError={event=>{event.currentTarget.hidden=true;}}/></LanguageLink>}
            <h3><LanguageLink to={'/case-study/' + row.post_group_id}>{row.title}</LanguageLink></h3>
            <p>{cleanSummary(row.meta_description)}</p>
          </article>)}</div>
          {cases.error && <p role="status">{p.error}</p>}
        </div>
      </section>
      <div className="home-contribute">
        <section><h2>{ui.shareTitle}</h2><p>{ui.shareText}</p><button onClick={create}>{ui.create} →</button></section>
        <section><h2>{ui.privateTitle}</h2><p>{ui.privateText}</p><LanguageLink to="/work-packages">{w.openPackages} →</LanguageLink><p><LanguageLink to="/business">{w.openPlans}</LanguageLink></p></section>
      </div>
    </main>
    <CommunityFooter />
    {startOpen && <div className="home-start-overlay" onClick={() => setStartOpen(false)}>
      <section ref={dialogRef} className="home-start-dialog" role="dialog" aria-modal="true" aria-labelledby="home-start-title" onClick={event => event.stopPropagation()}>
        <h2 id="home-start-title">{t('modalTitle')}</h2><p>{t('modalSub1')}<br/>{t('modalSub2')}</p>
        <button className="home-create" onClick={() => navigate('/login?next=' + encodeURIComponent('/' + locale + '/templates'))}>{t('loginBtn')}</button>
        <button onClick={() => start(false)}>{t('guestBtn')}</button><button onClick={() => setStartOpen(false)}>{t('cancelBtn')}</button>
      </section>
    </div>}
  </div>;
}
