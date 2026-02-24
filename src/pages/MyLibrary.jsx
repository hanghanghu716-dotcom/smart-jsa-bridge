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
  // ✅ [교정] 평면 배열을 트리 구조로 변환하는 헬퍼 함수
  const buildFolderTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildFolderTree(items, item.id) // 재귀 호출로 자식 폴더 탐색
      }));
  };
  const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert("로그인이 필요한 서비스입니다.");
          navigate('/login');
          return;
        }
        fetchLibraryData();
      };

    checkAuth();
  }, [navigate]);


const fetchLibraryData = async () => {
  setIsLoading(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. 카테고리, 즐겨찾기(스크랩), 내가 작성한 JSA(대시보드 데이터)를 동시에 호출
  const [cats, favs, authored] = await Promise.all([
    supabase.from('user_jsa_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id),
    // 기존 Dashboard.jsx에 있던 본인 작성 데이터 호출 로직 통합
    supabase.from('jsa_projects').select('*').eq('author_id', user.id).order('created_at', { ascending: false })
  ]);

  setCategories(cats.data || []);

  // 2. 통합 리스트 생성: 스크랩 데이터와 본인 작성 데이터를 구분하여 합침
    const combined = [
      ...(favs.data || []).map(item => ({ 
        ...item, 
        displayType: 'SCRAP', // 스크랩 식별자
        originData: item.jsa_projects 
      })),
      ...(authored.data || []).map(item => ({ 
        id: `mine-${item.id}`, 
        displayType: 'MY_JSA', // 하단 삭제/이동 로직의 if문과 정확히 일치시킴
        originData: item,
        category_id: item.category_id || null // DB에 저장된 폴더 위치를 무시하지 않고 그대로 가져옴
      }))
    ];

  setFavorites(combined); 
  setIsLoading(false);
};

const createCategory = async () => {
  if (!newCatName.trim()) return;
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('user_jsa_categories')
    .insert({ 
      user_id: user.id, 
      category_name: newCatName,
      parent_id: selectedCatId // ✅ [교정] 현재 선택된 폴더 ID를 부모로 지정 (없으면 null)
    });

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

// ✅ [교정] 내 작성글(jsa_projects)과 스크랩(user_favorites)을 구분하여 폴더 이동
  const moveFavorite = async (favId, catId, displayType) => {
    if (displayType === 'MY_JSA') {
      const realId = favId.replace('mine-', ''); // 'mine-' 접두사 제거 후 실제 ID 추출
      await supabase.from('jsa_projects').update({ category_id: catId || null }).eq('id', realId);
    } else {
      await supabase.from('user_favorites').update({ category_id: catId || null }).eq('id', favId);
    }
    fetchLibraryData();
  };

  // ✅ [교정] 내 작성글과 스크랩을 구분하여 삭제
  const removeFavorite = async (favId, displayType) => {
    if (window.confirm("이 항목을 보관함에서 삭제하시겠습니까?")) {
      if (displayType === 'MY_JSA') {
        const realId = favId.replace('mine-', '');
        await supabase.from('jsa_projects').delete().eq('id', realId);
      } else {
        await supabase.from('user_favorites').delete().eq('id', favId);
      }
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
                {/* ✅ [교정] 트리 구조로 변환된 데이터를 재귀 컴포넌트로 전달 */}
                {buildFolderTree(categories).map(rootFolder => (
                  <FolderItem 
                    key={rootFolder.id} 
                    folder={rootFolder} 
                    selectedId={selectedCatId} 
                    onSelect={setSelectedCatId} 
                    onDelete={deleteCategory}
                    favorites={favorites} // ✅ 추가됨
                  />
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* ✅ 내가 작성한 것과 스크랩을 구분하는 뱃지 추가 */}
                          <span style={{ 
                            fontSize: '0.6rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            backgroundColor: f.displayType === 'MY_JSA' ? '#4caf50' : '#007bff',
                            color: '#fff' 
                          }}>
                            {f.displayType === 'MY_JSA' ? '내 작성' : '스크랩'}
                          </span>
                          <span style={styles.tagBadge}>
                            {f.originData?.tags?.[0] || "일반작업"}
                          </span>
                        </div>
                        <button style={styles.delBtn} onClick={() => removeFavorite(f.id, f.displayType)}>✕</button>
                      </div>
                      
                      {/* ✅ 데이터 참조 경로를 originData로 변경 */}
                      <h4 style={styles.cardTitle}>{f.originData?.title}</h4>
                      
                      <div style={styles.cardActions}>
             {/* 폴더 이동 셀렉트 박스 수정 */}
                            <select 
                              style={styles.moveSelect}
                              value={f.category_id || ""} 
                              onChange={(e) => moveFavorite(f.id, e.target.value, f.displayType)}
                            >
                          <option value="">폴더 이동...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                        </select>
                          {/* ✅ [교정] Analysis.jsx가 요구하는 정확한 데이터 구조(State)로 조립하여 전달 */}
                          <button 
                            style={styles.useBtn} 
                            onClick={() => navigate('/analysis', { 
                              state: { 
                                formData: f.originData?.form_data || {}, 
                                participants: f.originData?.participants || [],
                                analysisData: f.originData?.analysis_data || [],
                                // DB의 analysisData 내부에서 절차(proc) 정보만 추출하여 복원
                                procedures: (f.originData?.analysis_data || []).map(d => d.proc).filter(Boolean),
                                isFork: true 
                              } 
                            })}
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

// ✅ [교정] favorites 속성 추가 및 아이템 수 계산 로직 반영
const FolderItem = ({ folder, selectedId, onSelect, onDelete, favorites, level = 0 }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = folder.children && folder.children.length > 0;

  // 현재 폴더에 속한 아이템 개수 계산
  const itemCount = favorites.filter(f => f.category_id === folder.id).length;

  return (
    <div style={{ marginLeft: `${level * 12}px` }}>
      <div 
        style={selectedId === folder.id ? styles.catItemActive : styles.catItem}
        onClick={() => onSelect(folder.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, overflow: 'hidden' }}>
          {hasChildren && (
            <span onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {hasChildren ? (isExpanded ? '📂' : '📁') : '📁'} {folder.category_name} <span style={{fontSize:'0.75rem', opacity:0.7}}>({itemCount})</span>
          </span>
        </div>
        <button style={styles.catDelBtn} onClick={(e) => onDelete(e, folder.id, folder.category_name)}>🗑️</button>
      </div>

      {isExpanded && folder.children.map(child => (
        <FolderItem 
          key={child.id} 
          folder={child} 
          selectedId={selectedId} 
          onSelect={onSelect} 
          onDelete={onDelete} 
          favorites={favorites} // 자식에게도 전달
          level={level + 1} 
        />
      ))}
    </div>
  );
};

const styles = {
  // 1. 최상위 컨테이너: 배경색을 검은색으로 밀봉하고 최소 높이를 확보
  wrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    minHeight: '100vh', 
    width: '100%', 
    backgroundColor: '#000',
    position: 'relative'
  },

  // 2. 🌟 핵심 교정 (bgWrapper): 레이아웃의 영향을 받지 않도록 fixed로 브라우저에 고정
  bgWrapper: { 
    position: 'fixed', // ✅ 콘텐츠 크기와 상관없이 브라우저 창에 고정
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh', 
    zIndex: 0,         
    pointerEvents: 'none' // 배경이 클릭 이벤트를 방해하지 않도록 설정
  },
  bgImage: { 
    position: 'absolute', 
    inset: 0, // top, left, right, bottom을 0으로 고정
    width: '100%', 
    height: '100%', 
    backgroundImage: 'url(/images/image5.jpg)', 
    backgroundSize: 'cover', 
    backgroundPosition: 'center', 
    filter: 'brightness(0.3)' 
  },
  dimOverlay: { 
    position: 'absolute', 
    inset: 0, 
    background: 'rgba(0,0,0,0.4)', 
    zIndex: 1 
  },
  
  // 3. 헤더 및 메인 레이아웃: 배경 위로 띄우기 위해 zIndex와 position 설정
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  
  mainLayout: { 
    position: 'relative', // ✅ zIndex 적용을 위해 설정
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 5rem 120px', // 푸터 광고 영역 확보
    gap: '4rem', 
    zIndex: 10, 
    overflow: 'hidden' 
  },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  // 4. 폼 카드: 고정 높이(75vh)를 사용하여 데이터가 적어도 화면 구성을 유지
  formCard: { 
    width: '100%', 
    maxWidth: 'none', 
    backgroundColor: 'rgba(18, 18, 18, 0.98)', 
    border: '1px solid rgba(255, 255, 255, 0.12)', 
    borderRadius: '12px', 
    padding: '2.5rem', 
    display: 'flex', 
    flexDirection: 'column', 
    height: '75vh', 
    boxShadow: '0 40px 80px rgba(0,0,0,0.9)', 
    overflow: 'hidden' 
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
  
  // 5. 푸터: 화면 하단에 절대 위치로 고정 (mainLayout의 패딩 덕분에 겹치지 않음)
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

// ✅ 스크롤 기능을 전역적으로 복원하되, 지저분한 스크롤바만 보이지 않게 처리
if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-global-style";
  let styleTag = document.getElementById(styleId);
  
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    /* 1. 브라우저 기본 배경과 높이 설정 (스크롤 차단 해제) */
    html, body, #root { 
      min-height: 100%; 
      margin: 0; 
      padding: 0; 
      background-color: #000 !important;
      overflow-y: auto !important; /* 🌟 핵심: 모든 페이지에서 휠 작동 허용 */
    }

    /* 2. 스크롤바의 시각적 형태만 제거 (모든 브라우저 대응) */
    * { 
      -ms-overflow-style: none !important; 
      scrollbar-width: none !important; 
      outline: none !important; 
    }
    *::-webkit-scrollbar { 
      display: none !important; 
    }
  `;
}