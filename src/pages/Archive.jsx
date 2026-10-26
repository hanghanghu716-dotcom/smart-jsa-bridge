import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { LanguageLink } from '../hooks/useLanguage';
import { archiveUi } from '../locales/archiveUi';
import { getPublicUi } from '../locales/publicUi';
import { getLanguageTag } from '../locales/config';
import { archiveQuery, archiveSearch, archiveResults, casePdf, loadArchiveRows } from '../utils/archiveDiscovery';
import { canonicalCaseSlug } from '../utils/caseRouting';
import { caseListBootstrap, isStaticContentBuild } from '../utils/caseListBootstrap';
import { cleanSummary } from '../utils/content';
import PublicSiteHeader from '../components/PublicSiteHeader';
import CommunityFooter from '../components/CommunityFooter';
import ExploreSearchInput from '../components/ExploreSearchInput';
import ListPagination from '../components/ListPagination';
import PdfThumbnail from '../components/PdfThumbnail';
import SEO from '../components/SEO';
import '../styles/archive.css';

export default function Archive() {
 const {i18n} = useTranslation(), locale = i18n.language, ui = archiveUi(locale), p = getPublicUi(locale);
 const [params,setParams] = useSearchParams(), query = archiveQuery(params), queryRef = useRef(query);
 useEffect(() => {queryRef.current = query;},[query]);
 const [state,setState] = useState(() => ({locale,rows:caseListBootstrap(),loading:true})), [attempt,setAttempt] = useState(0);
 const [resetKey,setResetKey] = useState(0);
 useEffect(() => {
  if (isStaticContentBuild()) return;
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(),20000);
  let active = true;
  loadArchiveRows(supabase,locale,controller.signal).then(rows => {if(active)setState({locale,rows});}).catch(() => {if(active)setState({locale,rows:[],error:true});}).finally(() => clearTimeout(timer));
  return () => {active = false;clearTimeout(timer);controller.abort();};
 },[locale,attempt]);
 const current = state.locale === locale ? state : {rows:[],loading:true};
 const result = archiveResults(current.rows,query,locale);
 const years = [...new Set(current.rows.map(row => String(row.created_at || '').slice(0,4)).filter(year => /^\d{4}$/.test(year)))].sort().reverse();
 const update = patch => {const next = {...queryRef.current,...patch,page:1};queryRef.current=next;setParams(archiveSearch(next).slice(1),{replace:true});};
 const reset = () => {setResetKey(n=>n+1);update({search:'',pdf:false,year:'',sort:'latest'});};
 const retry = () => {setState({locale,rows:[],loading:true});setAttempt(n=>n+1);};
 return <div className="community-home archive-page" dir={i18n.dir()}>
  <SEO pageTitle={ui.title + ' | Smart JSA Bridge'} pageDescription={ui.intro} canonicalSearch={archiveSearch({page:result.page})} noIndex={Boolean(query.search || query.pdf || query.year || query.sort !== 'latest')} />
  <PublicSiteHeader community/>
  <main className="home-content">
   <div className="archive-heading"><div><h1>{ui.title}</h1><p>{ui.intro}</p></div><LanguageLink to="/explore">{p.title} <span aria-hidden="true">↗</span></LanguageLink></div>
   <section className="archive-tools" aria-label={ui.search}>
    <div className="archive-search" role="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><ExploreSearchInput value={query.search} resetKey={resetKey} onSearch={search => update({search})} label={ui.search}/></div>
    <div className="archive-filters"><div className="archive-type-filter" role="group" aria-label={ui.pdfOnly}><button type="button" aria-pressed={!query.pdf} onClick={() => update({pdf:false})}>{ui.all}</button><button type="button" aria-pressed={query.pdf} onClick={() => update({pdf:true})}>{ui.pdfOnly}</button></div>
     <select aria-label={ui.year} value={query.year} onChange={e=>update({year:e.target.value})}><option value="">{ui.year}</option>{query.year && !years.includes(query.year) && <option value={query.year}>{query.year}</option>}{years.map(year=><option key={year}>{year}</option>)}</select>
     <label className="archive-sort">{ui.sort}<select aria-label={ui.sort} value={query.sort} onChange={e=>update({sort:e.target.value})}>{['latest','oldest','title'].map(value=><option key={value} value={value}>{ui[value === 'title' ? 'alphabetical' : value]}</option>)}</select></label>
     <button className="archive-reset" type="button" onClick={reset}>{ui.reset}</button>
    </div>
   </section>
   <section data-live-case-list="archive" aria-busy={Boolean(current.loading)}>
    <div className="archive-results-heading"><p role="status">{current.loading ? ui.loading : current.error ? p.error : ui.results.replace('{count}',result.total.toLocaleString(getLanguageTag(locale)))}</p></div>
    {current.error && <button className="home-create" onClick={retry}>{p.retry}</button>}
    {!current.loading && !current.error && !result.total && <div className="archive-empty"><p>{ui.empty}</p><button onClick={reset}>{ui.reset}</button></div>}
    <div id="archive-results" className="archive-grid">{result.rows.map(row => <article className="archive-card" key={row.post_group_id}>
     <LanguageLink className="archive-card-preview" tabIndex={-1} aria-hidden="true" to={'/case-study/'+encodeURIComponent(canonicalCaseSlug(row.post_group_id))}><PdfThumbnail url={casePdf(row)} title={row.title} summary={cleanSummary(row.meta_description)} locale={locale}/></LanguageLink>
     <div className="archive-card-body"><div className="archive-card-meta"><time dateTime={row.created_at || undefined}>{Number.isFinite(Date.parse(row.created_at)) ? new Intl.DateTimeFormat(getLanguageTag(locale),{timeZone:'UTC'}).format(new Date(row.created_at)) : ''}</time>{casePdf(row) && <span>PDF</span>}</div>
      <h2><LanguageLink to={'/case-study/'+encodeURIComponent(canonicalCaseSlug(row.post_group_id))}>{row.title}</LanguageLink></h2><p>{cleanSummary(row.meta_description)}</p>
     </div>
    </article>)}</div>
    <ListPagination current={result.page} total={result.pages} locale={locale} controls="archive-results" hrefForPage={page=>'/archive'+archiveSearch({...query,page})}/>
   </section>
  </main><CommunityFooter/>
 </div>;
}
