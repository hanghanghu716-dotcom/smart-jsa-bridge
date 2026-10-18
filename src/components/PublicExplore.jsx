import ListPagination from './ListPagination';
import useCommunityAdmin from '../hooks/useCommunityAdmin';
import { ExploreModerationButton, RestrictedExploreDocuments } from './ExploreModeration';
import ExploreSearchInput from './ExploreSearchInput';
import '../styles/operator-documents.css';
import { getOperatorUi } from '../locales/operatorUi';
import { PUBLIC_COUNTRIES, exploreCountry, localeCountry, countryLabel } from '../utils/publicCountry';
import { exploreIndexable } from '../utils/exploreIndexing.js';
import { getPublicCountryUi } from '../locales/publicCountryUi';
import { usePublicTranslation } from '../hooks/usePublicTranslation';
import PublicTranslationNotice from './PublicTranslationNotice';
import CommunityFooter from './CommunityFooter';
import { getSocialUi } from '../locales/socialUi';
import '../styles/community.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exploreQuery, exploreSearch } from '../utils/discovery';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { listPublicJsa } from '../services/publicJsaService';
import { getLanguageTag } from '../locales/config';
import { getPublicUi } from '../locales/publicUi';
import { supabase } from '../supabaseClient';
import SEO from './SEO';
import ThemeSwitcher from './ThemeSwitcher';
import PublicProjectActions from './PublicProjectActions';
import { DIMENSIONAL_KEYWORD_MAP } from '../utils/TagDictionary';
import { exploreCardTags, exploreExcerpt } from '../utils/explorePresentation.js';
import { publicTagLabel } from '../locales/publicTagLabels.js';
import { getExploreQualityUi } from '../locales/exploreQualityUi.js';
import { getExploreViewUi } from '../locales/exploreViewUi.js';
import { EXPLORE_VIEWS, exploreView, explorePageSize, changeExploreView } from '../utils/exploreView.js';
import '../styles/workspaces.css';
import '../styles/public-explore.css';

function ExploreIcon({ name, className = '' }) {
  const paths = {
    library: 'M4 4h4v16H4z M11 4h4v16h-4z M18 5l3 14',
    search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    document: 'M14 2H5v20h14V7z M14 2v5h5 M8 12h8 M8 16h6',
    steps: 'M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01',
    bookmark: 'M6 3h12v18l-6-4-6 4z',
    eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    reuse: 'M4 7h13l-3-3 M17 7l-3 3 M20 17H7l3-3 M7 17l3 3',
    arrow: 'M4 12h16 M14 6l6 6-6 6',
    close: 'M6 6l12 12 M6 18L18 6',
    large: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    small: 'M3 3h4v4H3z M10 3h4v4h-4z M17 3h4v4h-4z M3 10h4v4H3z M10 10h4v4h-4z M17 10h4v4h-4z M3 17h4v4H3z M10 17h4v4h-4z M17 17h4v4h-4z',
    details: 'M3 4h18v16H3z M3 9h18 M3 14h18 M14 4v16',
  };
  return <svg className={'explore-icon ' + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function useExploreCards(rows, country, locale) {
  return useMemo(() => {
    const selected = exploreCountry(country, locale);
    return rows.filter(row => !selected || row.public_country === selected)
      .map(row => ({ ...row, cardExcerpt: exploreExcerpt(row), cardTags: exploreCardTags(row, locale) }));
  }, [rows, country, locale]);
}

export default function PublicExplore() {
  const admin = useCommunityAdmin();
  const { t, i18n } = useTranslation(['explore', 'tags']);
  const locale = i18n.language;
  const ui = getPublicUi(i18n.language);
  const qualityUi = getExploreQualityUi(i18n.language);
  const viewUi = getExploreViewUi(i18n.language);
  const tagLabel = tag => publicTagLabel(tag, i18n.language);
  const operatorUi=getOperatorUi(i18n.language);
  const [params,setParams]=useSearchParams();
  const query=useMemo(()=>exploreQuery(params),[params]);
  const {search,sort,tags,page,country,author}=query;
  const view = exploreView(query.view), pageSize = explorePageSize(view);
  const countryUi=getPublicCountryUi(i18n.language);
  const selectedCountry=exploreCountry(country,i18n.language);
  const queryRef=useRef(query);
  const [searchReset, setSearchReset] = useState(0);
  useEffect(()=>{queryRef.current=query;},[query]);
  const change=patch=>{if ('search' in patch) setSearchReset(n=>n+1);const next={...queryRef.current,...patch,page:0};queryRef.current=next;setParams(exploreSearch(next).slice(1),{replace:true});};
  const setView = value => {
    const next = changeExploreView({ ...queryRef.current }, value);
    queryRef.current = next;
    setParams(exploreSearch(next).slice(1));
  };
  const setSearch=search=>change({search}),setSort=sort=>change({sort});
  const setTags=tags=>change({tags:typeof tags==='function'?tags(queryRef.current.tags):tags});
  const [bootstrap]=useState(()=>window.__PUBLIC_EXPLORE__?.locale===i18n.language&&exploreSearch(window.__PUBLIC_EXPLORE__.query)===exploreSearch(query)?window.__PUBLIC_EXPLORE__:null);
  const [total, setTotal] = useState(bootstrap?.total||0);
  const [rows, setRows] = useState(bootstrap?.rows||[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const toggleTag = value => { setTags(previous => previous.includes(value) ? previous.filter(tag => tag !== value) : [...previous, value]); };
  const allTags = Object.keys(DIMENSIONAL_KEYWORD_MAP).filter(tag => tagLabel(tag));
  const groups = [
    ['industry','categoryIndustry',allTags.filter(tag => !tag.startsWith('설비(') && !tag.startsWith('사고(') && !/^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag))],
    ['safety','categorySafety',allTags.filter(tag => /^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag))],
    ['machine','categoryMachine',allTags.filter(tag => tag.startsWith('설비('))],
    ['accident','categoryAccident',allTags.filter(tag => tag.startsWith('사고('))],
  ];
  const suggestedTags = search.trim() ? allTags.filter(tag => !tags.includes(tag) && (tag + ' ' + tagLabel(tag)).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).slice(0,10) : [];
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let blocked = [], hidden = [];
        if (user) {
          const [users, projects] = await Promise.all([
            supabase.from('user_blocks').select('blocked_user_id').eq('blocker_id', user.id),
            supabase.from('user_project_blocks').select('project_id').eq('user_id', user.id),
          ]);
          if (users.error || projects.error) throw users.error || projects.error;
          blocked = (users.data || []).map(item => item.blocked_user_id);
          hidden = (projects.data || []).map(item => item.project_id);
        }
        const result = await listPublicJsa({ search, tags, sort, page, view, author, country: selectedCountry, blocked, hidden });
        if (active) {
          const visible = result.rows.filter(row => !blocked.includes(row.author_id) && !hidden.includes(row.id));
          setRows(visible);
          setTotal(result.total);
        }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search, sort, tags, page, view, author, attempt, selectedCountry]);
  const cardRows = useExploreCards(rows, country, locale);
  const translation=usePublicTranslation(cardRows,i18n.language);
  return <div className="jsa-workspace explore-page" dir={i18n.dir()}>
    <SEO pageTitle={ui.title + ' | Smart JSA Bridge'} pageDescription={ui.intro} canonicalSearch={exploreSearch({page,view})} noIndex={!exploreIndexable(rows,query,error)} />
    <header className="jsa-nav explore-nav"><LanguageLink className="explore-brand" to="/"><span className="explore-brand-mark"><ExploreIcon name="library" /></span>Smart JSA Bridge</LanguageLink><ThemeSwitcher compact /></header>
    <main className="jsa-container">
      <section className="explore-hero">
        <div><p className="jsa-eyebrow">EXPLORE / JSA</p><h1>{ui.title}</h1><p className="explore-intro">{ui.intro}</p></div>
        <div className="explore-hero-art" aria-hidden="true"><ExploreIcon name="library" /></div>
      </section>
      <nav className="jsa-toolbar"><LanguageLink to="/explore" aria-current="page">{getSocialUi(i18n.language).all}</LanguageLink><LanguageLink to="/following">{getSocialUi(i18n.language).following}</LanguageLink></nav>
      {admin && <RestrictedExploreDocuments refreshKey={attempt} onChanged={() => setAttempt(n => n + 1)} />}
      <div className="explore-searchbar" role="search">
        <label className="explore-search"><ExploreIcon name="search" /><ExploreSearchInput label={ui.search} value={search} resetKey={params.toString()+":"+searchReset} onSearch={setSearch} /></label>
        <select aria-label={ui.sort} value={sort} onChange={e => { setSort(e.target.value); }}><option value="latest">{ui.latest}</option><option value="popular">{ui.popular}</option><option value="views">{ui.mostViewed}</option><option value="reused">{ui.mostReused}</option></select>
      </div>
      <label className="explore-country">{countryUi.country}<select value={country||'local'} onChange={e=>{setRows([]);setTotal(0);change({country:e.target.value==='local'?undefined:e.target.value});}}>
        <option value="local">{countryUi.local} · {countryLabel(localeCountry(i18n.language),i18n.language)}</option>
        <option value="all">{countryUi.all}</option>
        {PUBLIC_COUNTRIES.map(code=><option key={code} value={code}>{countryLabel(code,i18n.language)}</option>)}
      </select></label>
      {suggestedTags.length>0 && <div className="explore-suggestions"><strong>{t('tagSearchResultLabel')}</strong><div className="explore-tags">{suggestedTags.map(tag=><button key={tag} onClick={()=>{change({tags:tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag],search:''});}}>#{tagLabel(tag)}</button>)}</div></div>}
      <details className="explore-filters" open>
        <summary>{t('sidebarTitle')}{tags.length>0 && <span>{tags.length}</span>}</summary>
        <label className="explore-operator-filter"><input type="checkbox" checked={author==='operator'} onChange={e=>change({author:e.target.checked?'operator':undefined})}/>{operatorUi.only}</label>
        <div className="explore-filter-tools"><button onClick={()=>{change({tags:[],search:'',sort:'latest',country:undefined,author:undefined});}}>{t('resetBtn')}</button></div>
        <div className="explore-filter-groups">{groups.map(([id,label,values])=><details key={id}><summary>{t(label)}</summary><div className="explore-filter-options">{values.map(tag=><button key={tag} aria-pressed={tags.includes(tag)} onClick={()=>toggleTag(tag)}>{tagLabel(tag)}</button>)}</div></details>)}</div>
      </details>
      <div className="explore-results-heading"><h2>{t('totalLabel')}<strong>{loading&&!rows.length?'…':total.toLocaleString(getLanguageTag(i18n.language))}</strong>{t('assetCountLabel')}</h2>{tags.map(tag => <button key={tag} className="explore-active-filter" onClick={() => toggleTag(tag)}>#{tagLabel(tag) || ui.search}<ExploreIcon name="close" /></button>)}</div>
      <div className="explore-view-toolbar">
        <div className="explore-view-switch" role="group" aria-label={viewUi.view}>
          {Object.entries(EXPLORE_VIEWS).map(([mode, count]) => <button key={mode} type="button" data-explore-view={mode} aria-pressed={view === mode} aria-controls="explore-results" onClick={() => setView(mode)}>
            <ExploreIcon name={mode}/><span>{viewUi[mode]}</span><small>{count}</small>
          </button>)}
        </div>
        <span className="explore-page-size">{viewUi.perPage.replace('{count}', pageSize)}</span>
      </div>
      <details className="jsa-metric-help"><summary>{ui.metricHelp}</summary><p>{ui.metricRules}</p></details>
      {error && <div className="explore-state" role="alert"><p>{ui.error}</p><button onClick={() => setAttempt(n => n + 1)}>{ui.retry}</button></div>}
      {loading && <div className="explore-loading" role="status" aria-label={ui.title}><span /><span /><span /></div>}
      {!loading && !error && rows.length === 0 && <div className="explore-state"><ExploreIcon name="search" /><p>{selectedCountry?countryUi.empty:ui.empty}</p>{selectedCountry&&<button onClick={()=>change({country:'all'})}>{countryUi.all}</button>}</div>}
      <PublicTranslationNotice translation={translation} locale={i18n.language}/>
      {view === 'details' ? <div id="explore-results" className="explore-details" aria-busy={loading}>
        <table><caption className="explore-sr-only">{ui.title}</caption><thead><tr>
          {[viewUi.title, countryUi.country, viewUi.date, ui.steps, ui.views, ui.reuses, ui.scraps, viewUi.actions].map(label => <th scope="col" key={label}>{label}</th>)}
        </tr></thead><tbody>{translation.rows.slice(0,pageSize).map(row => <tr key={row.id}>
          <th scope="row" className="explore-details-title">
            {row.is_operator && <span className="operator-badge">{operatorUi.badge}</span>}
            <LanguageLink lang={getLanguageTag(translation.translated?i18n.language:row.public_locale||i18n.language)} to={'/public-jsa/' + row.id}>{row.title || ui.detail}</LanguageLink>
            <span className="explore-details-type">{row.form_data.jsaType === '3-step' ? t('typeAdvanced') : t('typeBasic')}</span>
          </th>
          <td data-label={countryUi.country}>{countryLabel(row.public_country,i18n.language)}</td>
          <td data-label={viewUi.date}><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString(getLanguageTag(i18n.language))}</time></td>
          <td data-label={ui.steps}>{row.analysis_data.length}</td>
          <td data-label={ui.views}>{row.view_count.toLocaleString(getLanguageTag(i18n.language))}</td>
          <td data-label={ui.reuses}>{row.reuse_count.toLocaleString(getLanguageTag(i18n.language))}</td>
          <td data-label={ui.scraps}>{row.scrap_count.toLocaleString(getLanguageTag(i18n.language))}</td>
          <td className="explore-details-actions"><PublicProjectActions row={row} onChanged={()=>{change({});setAttempt(n=>n+1);}} />
            {admin && <ExploreModerationButton id={row.id} onChanged={() => setAttempt(n => n + 1)} />}
          </td>
        </tr>)}</tbody></table>
      </div> : <div id="explore-results" className={'jsa-card-grid explore-grid explore-view-' + view} aria-busy={loading}>{translation.rows.slice(0,pageSize).map(row => <article className="jsa-card explore-card" key={row.id}>
        <div className="explore-card-top">{row.is_operator&&<span className="operator-badge">{operatorUi.badge}</span>}<PublicProjectActions row={row} onChanged={()=>{change({});setAttempt(n=>n+1);}} /></div>
        <h2 lang={getLanguageTag(translation.translated?i18n.language:row.public_locale||i18n.language)}><LanguageLink to={'/public-jsa/' + row.id}>{row.title || ui.detail}</LanguageLink></h2>
        <p className="explore-meta"><ExploreIcon name="steps" />{ui.steps}<strong>{row.analysis_data.length}</strong></p>
        <p className="explore-document-meta"><span>{countryLabel(row.public_country,i18n.language)}</span><span>{row.form_data.jsaType === '3-step' ? t('typeAdvanced') : t('typeBasic')}</span><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString(getLanguageTag(i18n.language))}</time></p>
        {view === 'large' && row.cardExcerpt && <div className="explore-excerpt"><span>{qualityUi.excerpt}</span><p data-explore-excerpt lang={getLanguageTag(translation.translated ? i18n.language : row.public_locale || i18n.language)} dir="auto">{row.cardExcerpt}</p></div>}
        <div className="explore-tags">{row.cardTags.slice(0,view === 'small' ? 3 : 5).map(({tag,label}) => <button key={tag} data-explore-tag aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>#{label}</button>)}</div>
        <dl className="explore-metrics">{[['eye',ui.views,row.view_count],['reuse',ui.reuses,row.reuse_count],['bookmark',ui.scraps,row.scrap_count]].map(([icon,label,count]) => <div key={icon}><dt><ExploreIcon name={icon} />{label}</dt><dd>{count.toLocaleString(getLanguageTag(i18n.language))}</dd></div>)}</dl>
        <div className="explore-card-footer"><LanguageLink className="explore-detail" to={'/public-jsa/' + row.id}>{ui.detail}<ExploreIcon name="arrow" /></LanguageLink></div>
        {admin && <ExploreModerationButton id={row.id} onChanged={() => setAttempt(n => n + 1)} />}
      </article>)}</div>}
      <ListPagination className="explore-pagination" current={page+1} total={Math.ceil(total/pageSize)}
        locale={i18n.language} controls="explore-results" hrefForPage={number=>'/explore'+exploreSearch({...query,page:number-1})}
        onPageChange={()=>document.querySelector('.explore-results-heading')?.scrollIntoView({behavior:'smooth',block:'start'})} />
    </main><CommunityFooter/>
  </div>;
}
