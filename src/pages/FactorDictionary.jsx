import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner'; 
import { useTranslation } from 'react-i18next';

export default function FactorDictionary() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('dictionary'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const getDbLocale = (lang) => {
    if (lang?.includes('ko')) return 'ko-KR';
    if (lang?.includes('en')) return 'en-US';
    return 'ko-KR'; 
  };
  const currentLocale = getDbLocale(i18n.language);

  useEffect(() => {
    const fetchCategories = async () => {
      // 카테고리 목록도 새로운 뷰에서 가져옵니다.
      const { data, error } = await supabase
        .from('v_factor_dictionary_detail') 
        .select('category')
        .eq('locale', currentLocale); 
      
      if (!error && data) {
        const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
    };
    fetchCategories();
  }, [currentLocale]); 

  const fetchData = async () => {
    setLoading(true);
    try {
      // ✅ SQL Editor에서 만든 새로운 통합 뷰 단일 호출
      let query = supabase
        .from('v_factor_dictionary_detail')
        .select('*', { count: 'exact' })
        .eq('locale', currentLocale);

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      if (searchTerm) {
        // 평탄화된 컬럼명에 맞춰 검색 조건 단순화
        query = query.or(`hazard_name.ilike.%${searchTerm}%,measure_text.ilike.%${searchTerm}%,solution_text.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query.order('id', { ascending: true }).range(from, to);

      const { data: resultData, count, error } = await query;

      if (error) throw error;

      setData(resultData || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('데이터를 불러오는 중 오류 발생:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, categoryFilter, currentLocale]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); 
    fetchData();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getParsedKeywords = (keywords) => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords;
    if (typeof keywords === 'string') {
      try {
        if (keywords.trim().startsWith('[')) {
          return JSON.parse(keywords);
        }
        return keywords.split(',').map(k => k.trim());
      } catch (e) {
        console.error("키워드 파싱 오류:", e);
        return [];
      }
    }
    return [];
  };

  return (
    <div style={styles.wrapper}>
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
          <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.regulation')}</Link>
          <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.jrajsa')}</Link>
          <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.protectiveEquipment')}</Link>
          <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.riskClassification')}</Link>
          <Link to="/dictionary" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('drawer.dictionary')}</Link>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      <section style={styles.heroSection} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag}>{t('hero.tag')}</span>
          <h2 style={styles.mainTitle} className="text-[28px] lg:text-[3rem] font-extrabold leading-tight mb-6">
            {t('hero.titleLine1')}<br className="max-lg:hidden" />{t('hero.titleLine2')}
          </h2>
          
          <div style={styles.seoContextBox}>
            <p style={styles.seoText}>{t('hero.seoText1')}</p>
            <p style={styles.seoText}>{t('hero.seoText2')}</p>
          </div>
        </div>
      </section>

      <section style={styles.filterSection} className="max-lg:!px-6">
        <div style={styles.container}>
          <form onSubmit={handleSearch} style={styles.searchForm} className="flex-col lg:flex-row gap-4">
            <select 
              value={categoryFilter} 
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn}>{t('filter.searchBtn')}</button>
            </div>
          </form>
          <div style={styles.resultCount}>{t('filter.resultPrefix')} <strong>{totalCount}</strong>{t('filter.resultSuffix')}</div>
        </div>
      </section>

      <section style={styles.dataSection} className="max-lg:!px-6 max-lg:!py-10">
        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}>
            <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside>

          <div style={styles.centerContent}>
            {loading ? (
              <div style={styles.loadingState}>{t('data.loading')}</div>
            ) : data.length === 0 ? (
              <div style={styles.emptyState}>{t('data.empty')}</div>
            ) : (
              <div style={styles.dataGrid}>
                {data.map((item) => (
                  <div key={item.id} style={styles.dataCard}>
                    <div style={styles.cardCategory}>{item.category}</div>
                    
                    {/* ✅ 유해위험요인 (뷰의 hazard_name 컬럼) */}
                    <div style={styles.factorBox}>
                      <strong style={styles.boxLabelRed}>{t('data.riskFactorLabel')}</strong>
                      <p style={styles.boxContent}>{item.hazard_name || t('data.empty')}</p>
                    </div>
                    
                    {/* ✅ 현재 안전대책 (뷰의 measure_text 컬럼) */}
                    <div style={styles.measureBox}>
                      <strong style={styles.boxLabelBlue}>{t('data.currentMeasureLabel')}</strong>
                      <p style={styles.boxContent}>{item.measure_text || t('data.empty')}</p>
                    </div>

                    {/* ✅ 추가 안전대책 (뷰의 solution_text 컬럼) */}
                    <div style={styles.advancedMeasureBox}>
                      <strong style={styles.boxLabelGreen}>{t('data.advancedMeasureLabel')}</strong>
                      <p style={styles.boxContent}>{item.solution_text || t('data.empty')}</p>
                    </div>
                    
                    {item.keywords && getParsedKeywords(item.keywords).length > 0 && (
                      <div style={styles.keywordWrap}>
                        {getParsedKeywords(item.keywords).map((kw, idx) => (
                          <span key={idx} style={styles.keywordBadge}>#{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  {t('pagination.prev')}
                </button>
                <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  {t('pagination.next')}
                </button>
              </div>
            )}
          </div>

          <aside style={styles.sideAd}>
            <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside>
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
  searchInput: { flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  searchBtn: { padding: '0 30px', backgroundColor: '#1c1b1f', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  resultCount: { fontSize: '0.9rem', color: '#666', textAlign: 'right' },
  dataSection: { padding: '60px 0 100px 0' },
  mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '4rem', zIndex: 10, justifyContent: 'center' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '40px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', alignItems: 'center' },
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