import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';

export default function MyLibrary() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 카테고리(폴더)와 즐겨찾기 목록 동시 호출
    const [cats, favs] = await Promise.all([
      supabase.from('user_jsa_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id)
    ]);

    setCategories(cats.data || []);
    setFavorites(favs.data || []);
    setIsLoading(false);
  };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('user_jsa_categories')
      .insert({ user_id: user.id, category_name: newCatName });

    if (!error) { setNewCatName(""); fetchLibraryData(); }
  };

  const deleteCategory = async (e, catId, catName) => {
    e.stopPropagation();
    if (window.confirm(`'${catName}' 폴더를 삭제하시겠습니까?\n폴더 내 항목은 '전체 보기'에서 계속 확인 가능합니다.`)) {
      // 1. 해당 폴더의 항목들을 '폴더 없음' 상태로 변경
      await supabase.from('user_favorites').update({ category_id: null }).eq('category_id', catId);
      // 2. 폴더 삭제
      const { error } = await supabase.from('user_jsa_categories').delete().eq('id', catId);
      
      if (!error) {
        if (selectedCatId === catId) setSelectedCatId(null);
        fetchLibraryData();
      }
    }
  };

  const moveFavorite = async (favId, catId) => {
    const { error } = await supabase
      .from('user_favorites')
      .update({ category_id: catId || null })
      .eq('id', favId);
    if (!error) fetchLibraryData();
  };

  const removeFavorite = async (favId) => {
    if (window.confirm("이 항목을 보관함에서 삭제하시겠습니까?")) {
      await supabase.from('user_favorites').delete().eq('id', favId);
      fetchLibraryData();
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* ✅ Info.jsx의 배경 로직과 동일하게 구성 (배경 가림 방지) */}
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="4000000001" style={{ width: '160px', height: '600px', backgroundColor: 'transparent' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <div style={styles.libHeader}>
              <h2 style={styles.title}>내 지식 보관함 (Personal Library)</h2>
              <div style={styles.addCategoryBox}>
                <input 
                  style={styles.catInput} 
                  value={newCatName} 
                  onChange={(e)=>setNewCatName(e.target.value)} 
                  placeholder="새 폴더 이름..." 
                />
                <button style={styles.catAddBtn} onClick={createCategory}>폴더 추가</button>
              </div>
            </div>

            <div style={styles.contentGrid}>
              {/* 좌측: 폴더 리스트 (스크롤 가능) */}
              <aside style={styles.catSidebar}>
                <div 
                  style={!selectedCatId ? styles.catItemActive : styles.catItem}
                  onClick={() => setSelectedCatId(null)}
                >
                  📂 전체 보기 ({favorites.length})
                </div>
                <div style={styles.catScrollArea}>
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      style={selectedCatId === cat.id ? styles.catItemActive : styles.catItem}
                      onClick={() => setSelectedCatId(cat.id)}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📁 {cat.category_name}
                      </span>
                      <button 
                        style={styles.catDelBtn} 
                        onClick={(e) => deleteCategory(e, cat.id, cat.category_name)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </aside>

              {/* 우측: JSA 카드 리스트 */}
              <section style={styles.listSection}>
                {isLoading ? (
                  <div style={styles.loader}>지식 자산 로딩 중...</div>
                ) : (
                  <div style={styles.jsaGrid}>
                    {favorites
                      .filter(f => !selectedCatId || f.category_id === selectedCatId)
                      .map(f => (
                        <div key={f.id} style={styles.jsaCard}>
                          <div style={styles.cardTop}>
                            <span style={styles.tagBadge}>
                              {f.jsa_projects?.tags?.[0] || "일반작업"}
                            </span>
                            <button style={styles.delBtn} onClick={() => removeFavorite(f.id)}>✕</button>
                          </div>
                          <h4 style={styles.cardTitle}>{f.jsa_projects?.title}</h4>
                          
                          <div style={styles.cardActions}>
                            <select 
                              style={styles.moveSelect}
                              value={f.category_id || ""} 
                              onChange={(e) => moveFavorite(f.id, e.target.value)}
                            >
                              <option value="">폴더 이동...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                            </select>
                            <button 
                              style={styles.useBtn} 
                              onClick={() => navigate('/analysis', { state: { ...f.jsa_projects.form_data, analysisData: f.jsa_projects.analysis_data, isFork: true } })}
                            >
                              작성 시작
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="4000000002" style={{ width: '160px', height: '600px', backgroundColor: 'transparent' }} format="vertical" />
        </aside>
      </div>

      {/* ✅ 푸터: 배경을 가리지 않도록 절대 위치 및 투명 배경 설정 */}
      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner 
            slot="4000000003" 
            style={{ width: '728px', height: '90px', backgroundColor: 'transparent' }} 
            format="horizontal" 
          />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // Info.jsx 배경 스타일 그대로 적용
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'url(/images/image5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  
  mainLayout: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 5rem 120px', // 푸터 광고를 고려한 여백
    gap: '4rem', 
    zIndex: 10, 
    overflow: 'hidden' 
  },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  // 레이아웃 최대화 (maxWidth: 'none')
  formCard: { 
    width: '100%', maxWidth: 'none', backgroundColor: 'rgba(18, 18, 18, 0.98)', 
    border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2.5rem', 
    display: 'flex', flexDirection: 'column', height: '75vh', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', overflow: 'hidden' 
  },
  
  libHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #222', paddingBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#fff', margin: 0 },
  addCategoryBox: { display: 'flex', gap: '10px' },
  catInput: { backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none' },
  catAddBtn: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  
  contentGrid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', flex: 1, overflow: 'hidden' },
  catSidebar: { borderRight: '1px solid #222', paddingRight: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  catScrollArea: { flex: 1, overflowY: 'auto', paddingRight: '5px' },
  catItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', color: '#888', cursor: 'pointer', borderRadius: '8px', transition: '0.2s', marginBottom: '5px' },
  catItemActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', color: '#fff', backgroundColor: '#222', fontWeight: 'bold', borderRadius: '8px', marginBottom: '5px' },
  catDelBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.5 },
  
  listSection: { overflowY: 'auto', paddingRight: '10px' },
  jsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
  jsaCard: { backgroundColor: '#161616', border: '1px solid #333', padding: '1.5rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tagBadge: { fontSize: '0.65rem', color: '#007bff', border: '1px solid #007bff', padding: '2px 6px', borderRadius: '4px' },
  delBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '700', color: '#eee', margin: 0, lineHeight: '1.4' },
  cardActions: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  moveSelect: { backgroundColor: '#000', color: '#666', border: '1px solid #222', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem' },
  useBtn: { backgroundColor: '#fff', color: '#000', border: 'none', padding: '0.7rem', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' },
  
  loader: { textAlign: 'center', padding: '5rem', color: '#444' },
  
  // ✅ 푸터 수정: 하단 흰색 바 제거를 위해 absolute 위치와 투명도 적용
  footerArea: { 
    width: '100%', 
    zIndex: 10, 
    backgroundColor: 'transparent', 
    position: 'absolute', 
    bottom: 0, 
    padding: '1.5rem 5rem',
    display: 'flex',
    justifyContent: 'center'
  },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
};

// 전역 스타일로 스크롤바 숨김 처리
if (typeof document !== 'undefined') {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `* { -ms-overflow-style: none !important; scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`;
  document.head.appendChild(styleTag);
}