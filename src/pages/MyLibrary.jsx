import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';

export default function MyLibrary() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reports, setReports] = useState([]); 
  const [blocks, setBlocks] = useState([]);   
  const [projectBlocks, setProjectBlocks] = useState([]); 
  
  const [newCatName, setNewCatName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null); // 점 세 개 메뉴 상태

  const buildFolderTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildFolderTree(items, item.id)
      }));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      fetchLibraryData();
    };
    checkAuth();
    
    // 메뉴 외 클릭 시 닫기
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [navigate]);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [cats, favs, authored, reps, blks, pBlks] = await Promise.all([
      supabase.from('user_jsa_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id),
      supabase.from('jsa_projects').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_reports').select('*, jsa_projects(title)').eq('reporter_id', user.id),
      supabase.from('user_blocks').select('*, profiles:blocked_user_id(username)').eq('blocker_id', user.id),
      supabase.from('user_project_blocks').select('*, jsa_projects(title)').eq('user_id', user.id)
    ]);

    setCategories(cats.data || []);
    setReports(reps.data || []);
    setBlocks(blks.data || []);
    setProjectBlocks(pBlks.data || []);

    const combined = [
      ...(favs.data || []).map(item => ({ ...item, displayType: 'SCRAP', originData: item.jsa_projects })),
      ...(authored.data || []).map(item => ({ id: `mine-${item.id}`, displayType: 'MY_JSA', originData: item, category_id: item.category_id || null }))
    ];

    setFavorites(combined); 
    setIsLoading(false);
  };

  const handleClone = async (project) => {
    if (!window.confirm("이 작업물을 내 보관함으로 복제하시겠습니까?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    const cloneData = {
      author_id: user.id,
      title: `[복제] ${project.title}`,
      form_data: project.form_data,
      participants: project.participants,
      analysis_data: project.analysis_data,
      tags: project.tags,
      is_public: false,
    };
    const { error } = await supabase.from('jsa_projects').insert(cloneData);
    if (!error) { alert("복제가 완료되었습니다."); fetchLibraryData(); }
  };

  const handleWithdraw = async (type, id) => {
    if (!window.confirm("해당 조치를 철회하시겠습니까?")) return;
    const tableMap = { report: 'user_reports', block: 'user_blocks', projectBlock: 'user_project_blocks' };
    await supabase.from(tableMap[type]).delete().eq('id', id);
    fetchLibraryData();
  };

  const handleLogoClick = () => {
    if (window.confirm("메인 화면으로 이동하시겠습니까? 작성 중인 데이터가 모두 삭제될 수 있습니다.")) {
      navigate('/');
    }
  };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('user_jsa_categories').insert({ 
      user_id: user.id, 
      category_name: newCatName, 
      parent_id: (selectedCatId && selectedCatId !== 'SYSTEM_FOLDER') ? selectedCatId : null 
    });
    setNewCatName(""); fetchLibraryData();
  };

  const deleteCategory = async (e, catId) => {
    e.stopPropagation();
    if (window.confirm("폴더를 삭제하시겠습니까?")) {
      await supabase.from('user_jsa_categories').delete().eq('id', catId);
      if (selectedCatId === catId) setSelectedCatId(null);
      fetchLibraryData();
    }
  };

  const moveFavorite = async (favId, catId, displayType) => {
    if (displayType === 'MY_JSA') {
      const realId = favId.replace('mine-', '');
      await supabase.from('jsa_projects').update({ category_id: catId || null }).eq('id', realId);
    } else {
      await supabase.from('user_favorites').update({ category_id: catId || null }).eq('id', favId);
    }
    fetchLibraryData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <div style={styles.libHeader}>
              <h2 style={styles.title}>내 지식 보관함</h2>
              <div style={styles.addCategoryBox}>
                <input style={styles.catInput} value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder="새 폴더 이름" />
                <button style={styles.catAddBtn} onClick={createCategory}>폴더 추가</button>
              </div>
            </div>

            <div style={styles.contentGrid}>
              <aside style={styles.catSidebar}>
                <div 
                  style={selectedCatId === 'SYSTEM_FOLDER' ? styles.systemCatActive : styles.systemCat}
                  onClick={() => setSelectedCatId('SYSTEM_FOLDER')}
                >
                  신고 및 차단 관리
                </div>
                <div style={styles.catDivider} />
                <div style={!selectedCatId ? styles.catItemActive : styles.catItem} onClick={() => setSelectedCatId(null)}>
                  전체 보기 ({favorites.length})
                </div>
                <div style={styles.catScrollArea}>
                  {buildFolderTree(categories).map(root => (
                    <FolderItem key={root.id} folder={root} selectedId={selectedCatId} onSelect={setSelectedCatId} onDelete={deleteCategory} favorites={favorites} />
                  ))}
                </div>
              </aside>

              <section style={styles.listSection}>
                {isLoading ? (
                  <div style={styles.loader}>지식 자산 로딩 중...</div>
                ) : selectedCatId === 'SYSTEM_FOLDER' ? (
                  <div style={styles.managementView}>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>내 신고 내역</h4>
                      {reports.map(r => (
                        <div key={r.id} style={styles.mRow}>
                          <span>[신고] {r.jsa_projects?.title} - {r.reason}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('report', r.id)}>철회</button>
                        </div>
                      ))}
                    </div>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>차단 및 숨김 관리</h4>
                      {blocks.map(b => (
                        <div key={b.id} style={styles.mRow}>
                          <span>사용자 차단: {b.profiles?.username || "익명"}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('block', b.id)}>해제</button>
                        </div>
                      ))}
                      {projectBlocks.map(p => (
                        <div key={p.id} style={styles.mRow}>
                          <span>작업물 숨김: {p.jsa_projects?.title}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('projectBlock', p.id)}>해제</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={styles.jsaGrid}>
                    {favorites.filter(f => !selectedCatId || f.category_id === selectedCatId).map(f => (
                      <div key={f.id} style={styles.jsaCard} className="card">
                        <div style={styles.cardTop}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
                            <span style={{...styles.typeBadge, backgroundColor: f.displayType === 'MY_JSA' ? '#4caf50' : '#007bff'}}>
                              {f.displayType === 'MY_JSA' ? '내 작성' : '스크랩'}
                            </span>
                            <span style={{
                              ...styles.typeBadge,
                              backgroundColor: f.originData?.form_data?.jsaType === '3-step' ? '#ff4d4d' : '#444'
                            }}>
                              {f.originData?.form_data?.jsaType === '3-step' ? '심화' : '기본'}
                            </span>
                            {f.originData?.form_data?.permits?.slice(0, 2).map(permit => (
                              <span key={permit} style={styles.permitBadge}>{permit}</span>
                            ))}
                          </div>

                          {/* ✅ 점 세 개 메뉴로 기능 통합 */}
                          <div style={styles.menuWrapper}>
                            <button style={styles.menuBtn} onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === f.id ? null : f.id);
                            }}>⋮</button>
                            {activeMenuId === f.id && (
                              <div style={styles.dropdown}>
                                {f.displayType === 'SCRAP' && (
                                  <>
                                    <div style={styles.dropdownItem} onClick={() => navigate('/export', { state: { analysisData: f.originData.analysis_data, formData: f.originData.form_data, participants: f.originData.participants } })}>보고서 보기</div>
                                    <div style={styles.dropdownItem} onClick={() => handleClone(f.originData)}>복제하기</div>
                                  </>
                                )}
                                <div style={{...styles.dropdownItem, color: '#ff4d4d'}} onClick={async () => {
                                  if(window.confirm("삭제하시겠습니까?")) {
                                    const table = f.displayType === 'MY_JSA' ? 'jsa_projects' : 'user_favorites';
                                    const id = f.displayType === 'MY_JSA' ? f.id.replace('mine-','') : f.id;
                                    await supabase.from(table).delete().eq('id', id); fetchLibraryData();
                                  }
                                }}>삭제하기</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <h4 style={styles.cardTitle}>{f.originData?.title}</h4>
                        <div style={styles.dateLabel}>{formatDate(f.originData?.created_at)}</div>
                        
                        <div style={styles.cardTags}>
                          {f.originData?.tags?.slice(0, 2).map(t => <span key={t} style={styles.miniTag}>#{t}</span>)}
                        </div>
                        
                        <div style={styles.cardFooter}>
                          <select style={styles.moveSelect} value={f.category_id || ""} onChange={(e) => moveFavorite(f.id, e.target.value, f.displayType)}>
                            <option value="">폴더 이동 선택</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                          </select>
                          
                          <button 
                            style={styles.useBtn} 
                            onClick={() => {
                              const targetId = f.displayType === 'MY_JSA' ? f.id.replace('mine-','') : null;
                              navigate('/analysis', { 
                                state: { 
                                  id: targetId,
                                  formData: f.originData?.form_data || {}, 
                                  participants: f.originData?.participants || [],
                                  analysisData: f.originData?.analysis_data || [],
                                  procedures: (f.originData?.analysis_data || []).map(d => d.proc).filter(Boolean),
                                  isFork: f.displayType === 'SCRAP' 
                                } 
                              });
                            }}
                          >
                            {f.displayType === 'SCRAP' ? '참조하여 작성' : '수정 및 편집'}
                          </button>
                          
                          {/* ✅ 스크랩 수 디자인 일치 (버튼 하단 우측) */}
                          <div style={styles.scrapRow}>
                             SCRAP {f.originData?.scrap_count || 0}
                          </div>
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
          <AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="4000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const FolderItem = ({ folder, selectedId, onSelect, onDelete, favorites, level = 0 }) => {
  const itemCount = favorites.filter(f => f.category_id === folder.id).length;
  return (
    <div style={{ marginLeft: `${level * 10}px` }}>
      <div style={selectedId === folder.id ? styles.catItemActive : styles.catItem} onClick={() => onSelect(folder.id)}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>[폴더] {folder.category_name} ({itemCount})</span>
        <button style={styles.catDelBtn} onClick={(e) => onDelete(e, folder.id)}>삭제</button>
      </div>
      {folder.children?.map(child => <FolderItem key={child.id} folder={child} selectedId={selectedId} onSelect={onSelect} onDelete={deleteCategory} favorites={favorites} level={level + 1} />)}
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#000', position: 'relative' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 120px', gap: '4rem', zIndex: 10 },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2.5rem', display: 'flex', flexDirection: 'column', height: '75vh', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', overflow: 'hidden' },
  libHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #222' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#fff' },
  addCategoryBox: { display: 'flex', gap: '10px' },
  catInput: { backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' },
  catAddBtn: { backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  contentGrid: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', flex: 1, overflow: 'hidden' },
  catSidebar: { borderRight: '1px solid #222', paddingRight: '1rem', overflowY: 'auto' },
  systemCat: { padding: '1rem', color: '#ff4d4d', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #331111', marginBottom: '10px' },
  systemCatActive: { padding: '1rem', color: '#fff', backgroundColor: '#ff4d4d', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' },
  catDivider: { height: '1px', backgroundColor: '#222', margin: '10px 0' },
  catItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', color: '#888', cursor: 'pointer', fontSize: '0.85rem' },
  catItemActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', color: '#fff', backgroundColor: '#222', borderRadius: '8px', fontSize: '0.85rem' },
  catDelBtn: { background: 'none', border: 'none', color: '#555', fontSize: '0.75rem', cursor: 'pointer' },
  listSection: { overflowY: 'auto', paddingRight: '10px' },
  jsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  
  // ✅ 디자인 통일된 카드 스타일
  jsaCard: { backgroundColor: '#050505', border: '1px solid #111', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'all 0.2s ease' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  typeBadge: { fontSize: '0.55rem', fontWeight: 'bold', color: '#fff', padding: '1px 5px', borderRadius: '3px' },
  permitBadge: { fontSize: '0.55rem', color: '#007bff', border: '1px solid #007bff', padding: '0px 4px', borderRadius: '3px' },
  menuWrapper: { position: 'relative' },
  menuBtn: { background: 'none', border: 'none', color: '#333', fontSize: '1.2rem', cursor: 'pointer' },
  dropdown: { position: 'absolute', top: '100%', right: 0, width: '150px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '0.3rem', zIndex: 100 },
  dropdownItem: { padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: '#888', cursor: 'pointer', borderRadius: '3px' },
  
  cardTitle: { fontSize: '1rem', fontWeight: '800', margin: '0 0 0.3rem', color: '#eee', lineHeight: '1.3' },
  dateLabel: { fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }, 
  cardTags: { display: 'flex', gap: '6px', marginBottom: '1.8rem', flexWrap: 'wrap' },
  miniTag: { fontSize: '0.65rem', color: '#555' },
  
  cardFooter: { marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' },
  moveSelect: { width: '100%', backgroundColor: '#000', color: '#555', border: '1px solid #222', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '10px' },
  useBtn: { width: '100%', padding: '0.8rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' },
  scrapRow: { marginTop: '8px', fontSize: '0.6rem', color: '#444', letterSpacing: '0.5px' }, 
  
  managementView: { padding: '1rem' },
  mGroup: { marginBottom: '2rem' },
  mTitle: { fontSize: '0.95rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '5px', fontWeight: 'bold' },
  mRow: { display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#111', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem' },
  mBtn: { padding: '4px 10px', backgroundColor: '#222', color: '#ff4d4d', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' },
  loader: { textAlign: 'center', padding: '5rem', color: '#444' },
  footerArea: { width: '100%', position: 'absolute', bottom: 0, padding: '1.5rem 5rem', display: 'flex', justifyContent: 'center' },
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-lib-unified";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    .card:hover { border-color: #222 !important; background-color: #080808 !important; transform: translateY(-3px); }
    .dropdownItem:hover { background-color: #111; color: #fff !important; }
    *::-webkit-scrollbar { display: none !important; }
  `;
}