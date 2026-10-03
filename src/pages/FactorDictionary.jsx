import { getDataLocale } from '../locales/config.js';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { findDictionaryHazards, readDictionaryGroups } from '../utils/dictionaryGroups';
import { getDictionaryGroupUi } from '../locales/dictionaryGroupUi';
import '../styles/dictionary-groups.css';
import { getSiteUi } from '../locales/siteUi.js';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';

export default function FactorDictionary() {
  const navigate = useLanguageNavigate();
  const { t, i18n } = useTranslation('dictionary'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Keep only the current server-side page in memory.
  const [data, setData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const indexCache = useRef(null);
  const [loadedKey, setLoadedKey] = useState(null);
  const groupUi = getDictionaryGroupUi(i18n.language);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const ui = getSiteUi(i18n.language);
  
  // Page by complete hazards, never by flattened combinations.
  const ITEMS_PER_PAGE = 10;

  const [draftSearch, setDraftSearch] = useState({ locale: null, value: '' });
  const [categoryData, setCategoryData] = useState({ locale: null, values: [] });

  const getDbLocale = (lang) => {
    if (!lang) return 'ko-KR';
    if (lang.includes('ko')) return 'ko-KR';
    if (lang === 'en-CA') return 'en-CA';
    if (lang.includes('en-AU')) return 'en-AU';
    if (lang.includes('en-GB')) return 'en-GB';
    if (lang.includes('en')) return 'en-US'; 
    if (lang.includes('fr')) return 'fr-FR';
    if (lang.includes('de')) return 'de-DE';
    if (lang.includes('es')) return 'es-ES';
    if (lang.includes('ru')) return 'ru-RU';
    if (lang.includes('ja')) return 'ja-JP';
    if (lang.includes('pt')) return 'pt-BR';
    if (lang.includes('ar')) return 'ar-SA';
    if (lang.includes('it')) return 'it-IT';
    if (lang.includes('zh-TW')) return 'zh-TW';
    if (lang.includes('zh')) return 'zh-CN';

    return 'ko-KR'; 
  };
  const currentLocale = getDbLocale(getDataLocale(i18n.language));
  const submittedSearch = (searchParams.get('q') || '').trim();
  const searchTerm = draftSearch.locale === currentLocale && draftSearch.baseSearch === submittedSearch ? draftSearch.value : submittedSearch;
  const categories = categoryData.locale === currentLocale ? categoryData.values : [];
  const requestedPage = /^\d+$/.test(searchParams.get('page') || '') ? Math.max(1, Math.min(1000000, Number(searchParams.get('page')))) : 1;
  const categoryFilter = searchParams.get('category') || '';
  const requestKey = JSON.stringify([currentLocale, categoryFilter, submittedSearch, requestedPage, retry]);
  const queryFor = updates => {
    const values = { page: requestedPage, category: categoryFilter, search: submittedSearch, ...updates };
    const params = new URLSearchParams();
    if (values.category) params.set('category', values.category);
    if (values.search) params.set('q', values.search);
    if (values.page > 1) params.set('page', String(values.page));
    return params;
  };
  const updateRequest = updates => setSearchParams(queryFor(updates));

  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      const result = [];
      const size = 1000;
      for (let from = 0; active; from += size) {
        const { data: rows, error } = await supabase.from('Hazards_Translations')
          .select('category').eq('locale', currentLocale)
          .order('category', { ascending: true }).range(from, from + size - 1);
        if (error) { console.error('Category lookup failed:', error.message); return; }
        result.push(...(rows || []));
        if (!rows || rows.length < size) break;
      }
      if (active) setCategoryData({ locale: currentLocale, values: [...new Set(result.map(item => item.category).filter(Boolean))] });
    };
    fetchCategories();
    return () => { active = false; };
  }, [currentLocale]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true); setLoadError(false);
      try {
        const indexKey = JSON.stringify([currentLocale, categoryFilter, submittedSearch, retry]);
        let ids = indexCache.current?.key === indexKey ? indexCache.current.ids : null;
        if (!ids) {
          ids = await findDictionaryHazards(supabase, { locale: currentLocale, category: categoryFilter, search: submittedSearch, signal: controller.signal });
          if (controller.signal.aborted) return;
          indexCache.current = { key: indexKey, ids };
        }
        const page = Math.min(requestedPage, Math.max(1, Math.ceil(ids.length / ITEMS_PER_PAGE)));
        const pageIds = ids.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
        const groups = await readDictionaryGroups(supabase, { locale: currentLocale, ids: pageIds, signal: controller.signal });
        if (!controller.signal.aborted) { setData(groups); setTotalCount(ids.length); }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Dictionary lookup failed:', error.message);
          indexCache.current = null;
          setData([]); setTotalCount(0); setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) { setLoading(false); setLoadedKey(requestKey); }
      }
    };
    fetchData();
    return () => controller.abort();
  }, [categoryFilter, currentLocale, requestedPage, submittedSearch, retry, requestKey]);

  const handleSearch = (event) => {
    event.preventDefault();
    updateRequest({ page: 1, search: searchTerm.trim() });
    setDraftSearch({ locale: null, value: '' });
    setRetry(value => value + 1);
  };
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
  const pending = loading || loadedKey !== requestKey;

  return (
    <div style={styles.wrapper} dir={i18n.dir()}>
      <SEO pageDescription={groupUi.intro} noIndex={Boolean(submittedSearch || categoryFilter || loadError || (!pending && totalCount === 0))} canonicalSearch={!submittedSearch && !categoryFilter && currentPage > 1 ? '?page=' + currentPage : ''} />
      
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
          <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
            <span style={styles.menuText} className="max-lg:hidden">{t('ui.menu')}</span>
            <div style={styles.hamburger}>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
            </div>
          </div>
        </div>
      </header>

      <div style={{
        ...styles.sideDrawer,
        transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isMenuOpen ? 'visible' : 'hidden',
        width: window.innerWidth < 1024 ? '100%' : '400px'
      }}>
        <div style={styles.drawerHeader}>
          <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>{t('ui.close')}</div>
        </div>
        <nav style={styles.drawerNav}>
          <div style={styles.navCategory}>{t('drawer.contents')}</div>
          <LanguageLink to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.regulation')}</LanguageLink>
          <LanguageLink to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.jrajsa')}</LanguageLink>
          <LanguageLink to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.protectiveEquipment')}</LanguageLink>
          <LanguageLink to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.riskClassification')}</LanguageLink>
          <LanguageLink to="/dictionary" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.dictionary')}</LanguageLink>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      <section style={styles.heroSection} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag}>{t('hero.tag')}</span>
          <h2 style={styles.mainTitle} className="text-[28px] lg:text-[3rem] font-extrabold leading-tight mb-6">
            {t('hero.titleLine1')}{' '}<br className="max-lg:hidden" />{t('hero.titleLine2')}
          </h2>
          
          <div style={styles.seoContextBox}>
            <p style={styles.seoText}>{groupUi.intro}</p>
            <p style={styles.seoText}>{groupUi.howTo}</p>
          </div>
        </div>
      </section>

      <section style={styles.filterSection} className="max-lg:!px-6">
        <div style={styles.container}>
          <form onSubmit={handleSearch} style={styles.searchForm} className="flex-col lg:flex-row gap-4">
            <select 
              aria-label={t('filter.allCategories')}
              value={categoryFilter} 
              onChange={(e) => updateRequest({ category: e.target.value, page: 1 })}
              style={styles.selectBox}
              className="w-full lg:w-[200px]"
            >
              <option value="">{t('filter.allCategories')}</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="flex w-full gap-2">
              <input 
                type="text" 
                placeholder={t('filter.searchPlaceholder')} 
                aria-label={t('filter.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setDraftSearch({ locale: currentLocale, baseSearch: submittedSearch, value: e.target.value })}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn}>{t('filter.searchBtn')}</button>
            </div>
          </form>
          <div style={styles.resultCount} role="status">{pending ? t('data.loading') : !loadError && groupUi.count.replace('{{count}}', String(totalCount))}</div>
        </div>
      </section>

      <section style={styles.dataSection} className="max-lg:!px-6 max-lg:!py-10">
        <div style={styles.mainLayout} className="max-lg:!px-0 max-lg:!gap-0">

          <div style={styles.centerContent} id="dictionary-results" className="dictionary-results" aria-busy={pending}>
            <p className="dictionary-usage">{groupUi.groupHint}<br />{groupUi.reference}<br /><LanguageLink to="/guideline/common">{groupUi.guide}</LanguageLink> · <LanguageLink to="/archive">{groupUi.cases}</LanguageLink></p>
            {pending ? (
              <div role="status" style={styles.loadingState}>{t('data.loading')}</div>
            ) : loadError ? (
              <div role="alert" style={styles.emptyState}>{ui.loadError} <button type="button" onClick={() => setRetry(value => value + 1)}>{ui.retry}</button></div>

            ) : data.length === 0 ? (
              <div style={styles.emptyState}>{t('data.empty')}</div>
            ) : (
              <div style={styles.dataGrid}>
                {data.map(hazard => (
                  <article key={hazard.id} id={'hazard-' + hazard.id} className="dictionary-hazard">
                    <span style={styles.cardCategory}>{hazard.category}</span>
                    <strong style={styles.boxLabelRed}>{t('data.riskFactorLabel')}</strong>
                    <h3>{hazard.name || 'ID ' + hazard.id}</h3>
                    <ol className="dictionary-measures">
                      {hazard.measures.map((measure, index) => <li key={index} className="dictionary-measure">
                        <h4>{t('data.currentMeasureLabel')} · {index + 1}</h4>
                        <p>{measure.text || groupUi.missingMeasure}</p>
                        <div className="dictionary-solutions">
                          <strong>{t('data.advancedMeasureLabel')}</strong>
                          {measure.solutions.length ? <ul>{measure.solutions.map(solution => <li key={solution}>{solution}</li>)}</ul> : <p>{groupUi.missingSolutions}</p>}
                        </div>
                      </li>)}
                    </ol>
                    {hazard.keywords.length > 0 && <div style={styles.keywordWrap}>{hazard.keywords.map(keyword => <span key={keyword} style={styles.keywordBadge}>#{keyword}</span>)}</div>}
                  </article>
                ))}
              </div>
            )}

            {!pending && !loadError && totalPages > 1 && (
              <nav className="dictionary-pager" aria-label={groupUi.pageLabel}>
                {currentPage > 1 ? <LanguageLink to={'/dictionary?' + queryFor({ page: currentPage - 1 }) + '#dictionary-results'}>{t('pagination.prev')}</LanguageLink> : <span aria-disabled="true">{t('pagination.prev')}</span>}
                <span role="status">{currentPage} / {totalPages}</span>
                {currentPage < totalPages ? <LanguageLink to={'/dictionary?' + queryFor({ page: currentPage + 1 }) + '#dictionary-results'}>{t('pagination.next')}</LanguageLink> : <span aria-disabled="true">{t('pagination.next')}</span>}
              </nav>
            )}
          </div>

        </div>
      </section>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', overflowX: 'hidden', fontFamily: 'Pretendard, sans-serif' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  menuText: { color: '#111', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '5px' },
  bar: { width: '20px', height: '2px', backgroundColor: '#111' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },
  heroSection: { padding: '80px 0 60px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { wordBreak: 'keep-all' },
  seoContextBox: { borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px' },
  seoText: { fontSize: '0.95rem', lineHeight: '1.8', color: '#aaa', marginBottom: '16px', wordBreak: 'keep-all' },
  filterSection: { padding: '40px 0 20px 0', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
  searchForm: { display: 'flex', width: '100%', marginBottom: '16px' },
  selectBox: { padding: '14px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.95rem', backgroundColor: '#fafafa', outline: 'none' },
  searchInput: { flex: 1, minWidth: 0, padding: '14px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  searchBtn: { padding: '0 30px', backgroundColor: '#1c1b1f', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  resultCount: { fontSize: '0.9rem', color: '#666', textAlign: 'right' },
  dataSection: { padding: '60px 0 100px 0' },
  mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '0', zIndex: 10, justifyContent: 'center' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' },
  centerContent: { flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', maxWidth: '1000px', alignItems: 'center' },
  dataGrid: { display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' },
  dataCard: { padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardCategory: { display: 'inline-block', padding: '6px 14px', backgroundColor: '#f1f3f9', color: '#555', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '20px' },
  factorBox: { marginBottom: '20px', paddingLeft: '16px', borderLeft: '4px solid #ff4d4d' },
  measureBox: { paddingLeft: '16px', borderLeft: '4px solid #007bff', marginBottom: '20px' },
  advancedMeasureBox: { paddingLeft: '16px', borderLeft: '4px solid #28a745', marginBottom: '20px' },
  boxLabelRed: { display: 'block', fontSize: '0.85rem', color: '#ff4d4d', marginBottom: '8px' },
  boxLabelBlue: { display: 'block', fontSize: '0.85rem', color: '#007bff', marginBottom: '8px' },
  boxLabelGreen: { display: 'block', fontSize: '0.85rem', color: '#28a745', marginBottom: '8px' },
  boxContent: { fontSize: '1.05rem', color: '#111', lineHeight: '1.6', fontWeight: '700', wordBreak: 'keep-all' },
  boxDesc: { fontSize: '0.9rem', color: '#666', marginTop: '8px', lineHeight: '1.6', wordBreak: 'keep-all' },
  keywordWrap: { display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px dashed #eee', paddingTop: '20px' },
  keywordBadge: { fontSize: '0.8rem', color: '#888', backgroundColor: '#f9f9f9', padding: '4px 8px', borderRadius: '4px' },
  loadingState: { textAlign: 'center', padding: '100px 0', color: '#666', fontSize: '1.1rem', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#999', fontSize: '1.1rem' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '60px' },
  pageBtn: { padding: '10px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#111' },
  pageInfo: { fontSize: '1rem', fontWeight: 'bold', color: '#555' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};
