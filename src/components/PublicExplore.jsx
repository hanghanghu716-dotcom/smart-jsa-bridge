import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { listPublicJsa } from '../services/publicJsaService';
import { getPublicUi } from '../locales/publicUi';
import { supabase } from '../supabaseClient';
import SEO from './SEO';
import ThemeSwitcher from './ThemeSwitcher';
import '../styles/workspaces.css';

export default function PublicExplore() {
  const { i18n } = useTranslation();
  const ui = getPublicUi(i18n.language);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const result = await listPublicJsa({ search, tags: tag ? [tag] : [], sort, page });
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
        if (active) {
          const visible = result.rows.filter(row => !blocked.includes(row.author_id) && !hidden.includes(row.id));
          setRows(previous => page ? [...new Map([...previous, ...visible].map(row => [row.id, row])).values()] : visible);
          setHasMore(result.hasMore);
        }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search, sort, tag, page, attempt]);
  return <div className="jsa-workspace" dir={i18n.dir()}>
    <SEO pageTitle={ui.title + ' | Smart JSA Bridge'} pageDescription={ui.intro} noIndex={Boolean(search || tag || error)} />
    <header className="jsa-nav"><LanguageLink to="/">Smart JSA Bridge</LanguageLink><ThemeSwitcher compact /></header>
    <main className="jsa-container">
      <p className="jsa-eyebrow">EXPLORE</p><h1>{ui.title}</h1><p>{ui.intro}</p>
      <div className="jsa-toolbar">
        <input aria-label={ui.search} placeholder={ui.search} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select aria-label={ui.latest} value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}><option value="latest">{ui.latest}</option><option value="popular">{ui.popular}</option></select>
        {tag && <button onClick={() => { setTag(''); setPage(0); }}>{tag} ×</button>}
      </div>
      {error && <p role="alert">{ui.error} <button onClick={() => setAttempt(n => n + 1)}>{ui.retry}</button></p>}
      {loading && <p role="status">…</p>}
      {!loading && !error && rows.length === 0 && <p>{ui.empty}</p>}
      <div className="jsa-card-grid">{rows.map(row => <article className="jsa-card" key={row.id}>
        <span className="jsa-eyebrow">{ui.community}</span><h2><LanguageLink to={'/public-jsa/' + row.id}>{row.title || ui.detail}</LanguageLink></h2>
        <p>{ui.steps}: {row.analysis_data.length} · ★ {row.scrap_count}</p>
        <div className="jsa-toolbar">{row.tags.slice(0, 5).map(value => <button key={value} onClick={() => { setTag(value); setPage(0); }}>#{value}</button>)}</div>
        <LanguageLink className="jsa-primary" to={'/public-jsa/' + row.id}>{ui.detail} →</LanguageLink>
      </article>)}</div>
      {hasMore && <button disabled={loading} onClick={() => setPage(n => n + 1)}>{ui.more}</button>}
    </main>
  </div>;
}
