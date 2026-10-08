import { PUBLIC_COUNTRIES, exploreCountry, localeCountry, countryLabel } from '../utils/publicCountry';
import { getPublicCountryUi } from '../locales/publicCountryUi';
import { usePublicTranslation } from '../hooks/usePublicTranslation';
import PublicTranslationNotice from './PublicTranslationNotice';
import CommunityFooter from './CommunityFooter';
import { getSocialUi } from '../locales/socialUi';
import '../styles/community.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { exploreQuery, exploreSearch } from '../utils/discovery';
import { getDiscoveryUi } from '../locales/discoveryUi';
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
  };
  return <svg className={'explore-icon ' + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function PublicExplore() {
  const { t, i18n } = useTranslation(['explore', 'tags']);
  const ui = getPublicUi(i18n.language);
  const d=getDiscoveryUi(i18n.language);
  const [params,setParams]=useSearchParams();
  const query=useMemo(()=>exploreQuery(params),[params]);
  const {search,sort,tags,page,country}=query;
  const countryUi=getPublicCountryUi(i18n.language);
  const selectedCountry=exploreCountry(country,i18n.language);
  const queryRef=useRef(query);
  useEffect(()=>{queryRef.current=query;},[query]);
  const change=patch=>{const next={...queryRef.current,...patch,page:0};queryRef.current=next;setParams(exploreSearch(next).slice(1),{replace:true});};
  const setSearch=search=>change({search}),setSort=sort=>change({sort});
  const setTags=tags=>change({tags:typeof tags==='function'?tags(queryRef.current.tags):tags});
  const [bootstrap]=useState(()=>window.__PUBLIC_EXPLORE__?.locale===i18n.language&&exploreSearch(window.__PUBLIC_EXPLORE__.query)===exploreSearch(query)?window.__PUBLIC_EXPLORE__:null);
  const [total, setTotal] = useState(bootstrap?.total||0);
  const [rows, setRows] = useState(bootstrap?.rows||[]);
  const [hasMore, setHasMore] = useState(bootstrap?.hasMore||false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const toggleTag = value => { setTags(previous => previous.includes(value) ? previous.filter(tag => tag !== value) : [...previous, value]); };
  const allTags = Object.keys(DIMENSIONAL_KEYWORD_MAP);
  const groups = [
    ['industry','categoryIndustry',allTags.filter(tag => !tag.startsWith('설비(') && !tag.startsWith('사고(') && !/^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag))],
    ['safety','categorySafety',allTags.filter(tag => /^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag))],
    ['machine','categoryMachine',allTags.filter(tag => tag.startsWith('설비('))],
    ['accident','categoryAccident',allTags.filter(tag => tag.startsWith('사고('))],
  ];
  const suggestedTags = search.trim() ? allTags.filter(tag => !tags.includes(tag) && (tag + ' ' + t(tag,{ns:'tags'})).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).slice(0,10) : [];
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
        const result = await listPublicJsa({ search, tags, sort, page, country: selectedCountry, blocked, hidden });
        if (active) {
          const visible = result.rows.filter(row => !blocked.includes(row.author_id) && !hidden.includes(row.id));
          setRows(visible);
          setHasMore(result.hasMore);
          setTotal(result.total);
        }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search, sort, tags, page, attempt, selectedCountry]);
  const translation=usePublicTranslation(rows.filter(row=>!selectedCountry||row.public_country===selectedCountry),i18n.language);
  return <div className="jsa-workspace explore-page" dir={i18n.dir()}>
    <SEO pageTitle={ui.title + ' | Smart JSA Bridge'} pageDescription={ui.intro} canonicalSearch={exploreSearch({page})} noIndex={Boolean(search || tags.length || sort!=='latest' || country || error || (!loading&&!rows.length))} />
    <header className="jsa-nav explore-nav"><LanguageLink className="explore-brand" to="/"><span className="explore-brand-mark"><ExploreIcon name="library" /></span>Smart JSA Bridge</LanguageLink><ThemeSwitcher compact /></header>
    <main className="jsa-container">
      <section className="explore-hero">
        <div><p className="jsa-eyebrow">EXPLORE / JSA</p><h1>{ui.title}</h1><p className="explore-intro">{ui.intro}</p></div>
        <div className="explore-hero-art" aria-hidden="true"><ExploreIcon name="library" /></div>
      </section>
      <nav className="jsa-toolbar"><LanguageLink to="/explore" aria-current="page">{getSocialUi(i18n.language).all}</LanguageLink><LanguageLink to="/following">{getSocialUi(i18n.language).following}</LanguageLink></nav>
      <div className="explore-searchbar" role="search">
        <label className="explore-search"><ExploreIcon name="search" /><input aria-label={ui.search} placeholder={ui.search} value={search} onChange={e => { setSearch(e.target.value); }} /></label>
        <select aria-label={ui.sort} value={sort} onChange={e => { setSort(e.target.value); }}><option value="latest">{ui.latest}</option><option value="popular">{ui.popular}</option><option value="views">{ui.mostViewed}</option><option value="reused">{ui.mostReused}</option></select>
      </div>
      <label className="explore-country">{countryUi.country}<select value={country||'local'} onChange={e=>{setRows([]);setTotal(0);change({country:e.target.value==='local'?undefined:e.target.value});}}>
        <option value="local">{countryUi.local} · {countryLabel(localeCountry(i18n.language),i18n.language)}</option>
        <option value="all">{countryUi.all}</option>
        {PUBLIC_COUNTRIES.map(code=><option key={code} value={code}>{countryLabel(code,i18n.language)}</option>)}
      </select></label>
      {suggestedTags.length>0 && <div className="explore-suggestions"><strong>{t('tagSearchResultLabel')}</strong><div className="explore-tags">{suggestedTags.map(tag=><button key={tag} onClick={()=>{change({tags:tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag],search:''});}}>#{t(tag,{ns:'tags'})}</button>)}</div></div>}
      <details className="explore-filters" open>
        <summary>{t('sidebarTitle')}{tags.length>0 && <span>{tags.length}</span>}</summary>
        <div className="explore-filter-tools"><button onClick={()=>{change({tags:[],search:'',sort:'latest',country:undefined});}}>{t('resetBtn')}</button></div>
        <div className="explore-filter-groups">{groups.map(([id,label,values])=><details key={id}><summary>{t(label)}</summary><div className="explore-filter-options">{values.map(tag=><button key={tag} aria-pressed={tags.includes(tag)} onClick={()=>toggleTag(tag)}>{t(tag,{ns:'tags'})}</button>)}</div></details>)}</div>
      </details>
      <div className="explore-results-heading"><h2>{t('totalLabel')}<strong>{loading&&!rows.length?'…':total.toLocaleString(getLanguageTag(i18n.language))}</strong>{t('assetCountLabel')}</h2>{tags.map(tag => <button key={tag} className="explore-active-filter" onClick={() => toggleTag(tag)}>#{t(tag,{ns:'tags'})}<ExploreIcon name="close" /></button>)}</div>
      <details className="jsa-metric-help"><summary>{ui.metricHelp}</summary><p>{ui.metricRules}</p></details>
      {error && <div className="explore-state" role="alert"><p>{ui.error}</p><button onClick={() => setAttempt(n => n + 1)}>{ui.retry}</button></div>}
      {loading && <div className="explore-loading" role="status" aria-label={ui.title}><span /><span /><span /></div>}
      {!loading && !error && rows.length === 0 && <div className="explore-state"><ExploreIcon name="search" /><p>{selectedCountry?countryUi.empty:ui.empty}</p>{selectedCountry&&<button onClick={()=>change({country:'all'})}>{countryUi.all}</button>}</div>}
      <PublicTranslationNotice translation={translation} locale={i18n.language}/>
      <div className="jsa-card-grid explore-grid" aria-busy={loading}>{translation.rows.map(row => <article className="jsa-card explore-card" key={row.id}>
        <div className="explore-card-top"><span className="explore-document-icon"><ExploreIcon name="document" /></span><PublicProjectActions row={row} onChanged={()=>{change({});setAttempt(n=>n+1);}} /></div>
        <h2 lang={getLanguageTag(translation.translated?i18n.language:row.public_locale||i18n.language)}><LanguageLink to={'/public-jsa/' + row.id}>{row.title || ui.detail}</LanguageLink></h2>
        <p className="explore-meta"><ExploreIcon name="steps" />{ui.steps}<strong>{row.analysis_data.length}</strong></p>
        <p className="explore-document-meta"><span>{countryLabel(row.public_country,i18n.language)}</span><span>{row.form_data.jsaType === '3-step' ? t('typeAdvanced') : t('typeBasic')}</span><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString(getLanguageTag(i18n.language))}</time></p>
        <div className="explore-tags">{row.tags.slice(0, 5).map(value => <button key={value} aria-pressed={tags.includes(value)} onClick={() => toggleTag(value)}>#{t(value,{ns:'tags'})}</button>)}</div>
        <dl className="explore-metrics">{[['eye',ui.views,row.view_count],['reuse',ui.reuses,row.reuse_count],['bookmark',ui.scraps,row.scrap_count]].map(([icon,label,count]) => <div key={icon}><dt><ExploreIcon name={icon} />{label}</dt><dd>{count.toLocaleString(getLanguageTag(i18n.language))}</dd></div>)}</dl>
        <div className="explore-card-footer"><LanguageLink className="explore-detail" to={'/public-jsa/' + row.id}>{ui.detail}<ExploreIcon name="arrow" /></LanguageLink></div>
      </article>)}</div>
      <nav className="explore-more">{page>0&&<LanguageLink rel="prev" to={'/explore'+exploreSearch({...query,page:page-1})}>{d.previous}</LanguageLink>}{hasMore&&<LanguageLink rel="next" to={'/explore'+exploreSearch({...query,page:page+1})}>{d.next}</LanguageLink>}</nav>
    </main><CommunityFooter/>
  </div>;
}
