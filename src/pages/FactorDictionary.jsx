import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function FactorDictionary() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 데이터 및 페이지네이션 상태
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // 고유 카테고리 목록 불러오기 (필터용)
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('Risk_Master')
        .select('category');
      
      if (!error && data) {
        const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
    };
    fetchCategories();
  }, []);

  // Supabase 데이터 페칭 로직 (검색, 필터, 페이지네이션 적용)
  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('Risk_Master')
        .select('*', { count: 'exact' });

      // 카테고리 필터
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      // 검색어 필터 (risk_factor 또는 measure에 포함된 경우)
      if (searchTerm) {
        query = query.or(`risk_factor.ilike.%${searchTerm}%,measure.ilike.%${searchTerm}%`);
      }

      // 페이지네이션 (범위 설정)
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
  }, [currentPage, categoryFilter]);

const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 1페이지로 리셋
    fetchData();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 데이터베이스의 keywords 타입 혼재(배열, JSON 문자열, 일반 문자열)를 안전하게 처리하는 함수
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
      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
          <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
            <span style={styles.menuText} className="max-lg:hidden">MENU</span>
            <div style={styles.hamburger}>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
            </div>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER */}
      <div style={{
        ...styles.sideDrawer,
        transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isMenuOpen ? 'visible' : 'hidden',
        width: window.innerWidth < 1024 ? '100%' : '400px'
      }}>
        <div style={styles.drawerHeader}>
          <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ CLOSE</div>
        </div>
        <nav style={styles.drawerNav}>
          <div style={styles.navCategory}>CONTENTS</div>
          <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가 실시규정 가이드</Link>
          <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가(JRA/JSA) 실무 프로세스</Link>
          <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>보호구에 관하여</Link>
          <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>일반 작업/고위험 작업</Link>
          <Link to="/dictionary" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험요인·대책 DB</Link>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION */}
      <section style={styles.heroSection} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag}>INTELLIGENT RISK DATABASE</span>
          <h2 style={styles.mainTitle} className="text-[28px] lg:text-[3rem] font-extrabold leading-tight mb-6">
            표준 유해·위험요인 및<br className="max-lg:hidden" />감소대책 통합 사전
          </h2>
          
          {/* 구글 애드센스 승인을 위한 전문 텍스트 (Valueable Inventory 확보용) */}
          <div style={styles.seoContextBox}>
            <p style={styles.seoText}>
              본 데이터베이스는 KOSHA(안전보건공단) 가이드 및 산업안전보건법에 기초하여 도출된 1,000여 개의 표준 유해·위험요인과 그에 상응하는 감소대책 매칭 데이터를 제공합니다. 현장 안전관리자 및 작업자는 본 사전을 활용하여 공종별 잠재 위험을 사전에 식별하고, 실효성 있는 안전 대책을 수립할 수 있습니다.
            </p>
            <p style={styles.seoText}>
              제공되는 데이터는 사고 예방을 위한 기준 자료이며, 실제 현장의 작업 환경, 설비의 특성, 작업자의 숙련도 등을 종합적으로 고려하여 해당 사업장에 맞게 편집 및 적용하시기 바랍니다. 정밀한 위험성평가는 무재해 현장을 만드는 가장 확고한 교량입니다.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH SECTION */}
      <section style={styles.filterSection} className="max-lg:!px-6">
        <div style={styles.container}>
          <form onSubmit={handleSearch} style={styles.searchForm} className="flex-col lg:flex-row gap-4">
            <select 
              value={categoryFilter} 
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={styles.selectBox}
              className="w-full lg:w-[200px]"
            >
              <option value="">모든 공종 (All)</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="flex w-full gap-2">
              <input 
                type="text" 
                placeholder="위험요인 또는 감소대책 키워드 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn}>검색</button>
            </div>
          </form>
          <div style={styles.resultCount}>총 <strong>{totalCount}</strong>건의 데이터가 검색되었습니다.</div>
        </div>
      </section>

      {/* DATA LIST SECTION */}
      <section style={styles.dataSection} className="max-lg:!px-6 max-lg:!py-10">
        <div style={styles.container}>
          {loading ? (
            <div style={styles.loadingState}>데이터를 불러오는 중입니다...</div>
          ) : data.length === 0 ? (
            <div style={styles.emptyState}>검색 결과가 없습니다. 다른 키워드로 검색해 보세요.</div>
          ) : (
            <div style={styles.dataGrid}>
              {data.map((item) => (
                <div key={item.id} style={styles.dataCard}>
                  <div style={styles.cardCategory}>{item.category}</div>
                  
                  <div style={styles.factorBox}>
                    <strong style={styles.boxLabelRed}>유해·위험요인</strong>
                    <p style={styles.boxContent}>{item.risk_factor}</p>
                  </div>
                  
                  <div style={styles.measureBox}>
                    <strong style={styles.boxLabelBlue}>감소대책</strong>
                    <p style={styles.boxContent}>{item.measure}</p>
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

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                이전
              </button>
              <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
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
  container: { maxWidth: '1000px', margin: '0 auto' }, // 콘텐츠 집중도를 위해 폭을 약간 줄임
  
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
  dataGrid: { display: 'flex', flexDirection: 'column', gap: '24px' },
  dataCard: { padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardCategory: { display: 'inline-block', padding: '6px 14px', backgroundColor: '#f1f3f9', color: '#555', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '20px' },
  
  factorBox: { marginBottom: '20px', paddingLeft: '16px', borderLeft: '4px solid #ff4d4d' },
  measureBox: { paddingLeft: '16px', borderLeft: '4px solid #007bff', marginBottom: '20px' },
  boxLabelRed: { display: 'block', fontSize: '0.85rem', color: '#ff4d4d', marginBottom: '8px' },
  boxLabelBlue: { display: 'block', fontSize: '0.85rem', color: '#007bff', marginBottom: '8px' },
  boxContent: { fontSize: '1.05rem', color: '#111', lineHeight: '1.6', fontWeight: '500', wordBreak: 'keep-all' },
  
  keywordWrap: { display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px dashed #eee', paddingTop: '20px' },
  keywordBadge: { fontSize: '0.8rem', color: '#888', backgroundColor: '#f9f9f9', padding: '4px 8px', borderRadius: '4px' },

  loadingState: { textAlign: 'center', padding: '100px 0', color: '#666', fontSize: '1.1rem', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#999', fontSize: '1.1rem' },

  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '60px' },
  pageBtn: { padding: '10px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#111' },
  pageInfo: { fontSize: '1rem', fontWeight: 'bold', color: '#555' },

  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};