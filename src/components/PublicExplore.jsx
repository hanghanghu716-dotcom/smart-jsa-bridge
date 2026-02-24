import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';

// ✅ [교정] 300종 태그 임포트 및 접두사(Prefix) 기반 동적 카테고리 그룹화
import { DIMENSIONAL_KEYWORD_MAP } from '../utils/TagDictionary';

const allTags = Object.keys(DIMENSIONAL_KEYWORD_MAP);

const FILTER_CATEGORIES = [
  {
    name: "산업 / 공정 / 일반작업",
    tags: allTags.filter(t => !t.startsWith('설비(') && !t.startsWith('사고(') && !/^(관리|준비|보호구|절차|마무리|기타)\(/.test(t))
  },
  {
    name: "안전 보건 관리 및 절차",
    tags: allTags.filter(t => /^(관리|준비|보호구|절차|마무리|기타)\(/.test(t))
  },
  {
    name: "기계 및 설비 (80종)",
    tags: allTags.filter(t => t.startsWith('설비('))
  },
  {
    name: "표준 사고 유형",
    tags: allTags.filter(t => t.startsWith('사고('))
  }
];
export default function PublicExplore() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // 다중 선택 태그
  const [isLoading, setIsLoading] = useState(true);

  const [expandedGroups, setExpandedGroups] = useState({ "산업 / 공정 / 일반작업": true });

  const toggleGroup = (name) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const fetchPublicProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('jsa_projects')
      .select('*, profiles(username, company_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (!error) setProjects(data);
    setIsLoading(false);
  };

  // [핵심] AND 필터링 로직: 선택된 모든 태그를 포함하고 검색어와 일치해야 함
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => p.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleFavorite = async (projectId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");
    const { error } = await supabase.from('user_favorites').upsert({ user_id: user.id, project_id: projectId });
    alert(error ? "이미 저장되었거나 오류가 발생했습니다." : "내 라이브러리에 저장되었습니다.");
  };

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        <div style={styles.searchContainer}>
          <input 
            style={styles.searchInput} 
            placeholder="제목이나 키워드를 입력하세요 (예: 사다리, 펌프...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* 좌측: 다면 필터 사이드바 */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>필터링 도구</span>
            <button style={styles.resetBtn} onClick={() => setSelectedTags([])}>초기화</button>
          </div>
          
        {/* ✅ [교정] 사이드바 태그 리스트에 아코디언 UI 적용 */}
        {FILTER_CATEGORIES.map(cat => (
          <div key={cat.name} style={styles.filterGroup}>
            <div style={styles.groupHeader} onClick={() => toggleGroup(cat.name)}>
              <h4 style={styles.groupLabel}>{cat.name}</h4>
              <span style={styles.accordionIcon}>{expandedGroups[cat.name] ? '▼' : '▶'}</span>
            </div>
            
            {expandedGroups[cat.name] && (
              <div style={styles.tagGrid}>
                {cat.tags.map(tag => (
                  <button 
                    key={tag} 
                    style={selectedTags.includes(tag) ? styles.tagItemActive : styles.tagItem}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        </aside>

        {/* 우측: 검색 결과 리스트 */}
        <main style={styles.content}>
          <div style={styles.resultsHeader}>
            <span>검색 결과 <strong>{filteredProjects.length}</strong>건</span>
            {selectedTags.length > 0 && (
              <div style={styles.activeFilters}>
                {selectedTags.map(t => <span key={t} style={styles.filterChip}>#{t}</span>)}
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={styles.loader}>데이터를 불러오는 중입니다...</div>
          ) : (
            <div style={styles.grid}>
              {filteredProjects.map(p => (
                <div key={p.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <span style={styles.compBadge}>{p.profiles?.company_name || "현장 전문가"}</span>
                    <button style={styles.favBtn} onClick={() => handleFavorite(p.id)}>⭐</button>
                  </div>
                  <h4 style={styles.cardTitle}>{p.title}</h4>
                  <div style={styles.cardTags}>
                    {p.tags?.map(t => <span key={t} style={styles.miniTag}>#{t}</span>)}
                  </div>
                  <div style={styles.cardFooter}>
                    <button style={styles.useBtn} onClick={() => navigate('/analysis', { state: { ...p.form_data, isFork: true } })}>
                      이 자료로 작성 시작
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#000', color: '#fff' },
  header: { padding: '1.5rem 5rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '3rem' },
  logo: { fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px' },
  searchContainer: { flex: 1, maxWidth: '600px' },
  searchInput: { width: '100%', padding: '0.8rem 1.2rem', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' },
  mainLayout: { display: 'flex', padding: '2rem 5rem', gap: '3rem' },
// ✅ [교정] 아코디언 관련 스타일 추가 및 사이드바 스크롤 최적화
  sidebar: { width: '320px', flexShrink: 0, backgroundColor: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222', maxHeight: '80vh', overflowY: 'auto' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', position: 'sticky', top: 0, backgroundColor: '#0a0a0a', paddingBottom: '10px', zIndex: 10 },
  sidebarTitle: { fontSize: '0.9rem', color: '#888', fontWeight: 'bold' },
  resetBtn: { background: 'none', border: 'none', color: '#007bff', fontSize: '0.75rem', cursor: 'pointer' },
  filterGroup: { marginBottom: '1.5rem' },
  groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.8rem', padding: '0.5rem', backgroundColor: '#111', borderRadius: '6px' },
  groupLabel: { fontSize: '0.85rem', color: '#fff', borderLeft: '3px solid #007bff', paddingLeft: '8px', margin: 0, fontWeight: 'bold' },
  accordionIcon: { fontSize: '0.7rem', color: '#888' },
  tagGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  tagItem: { padding: '0.4rem 0.7rem', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', fontSize: '0.75rem', color: '#aaa', cursor: 'pointer' },
  tagItemActive: { padding: '0.4rem 0.7rem', backgroundColor: '#007bff', border: '1px solid #007bff', borderRadius: '4px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  content: { flex: 1 },
  resultsHeader: { marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#888' },
  activeFilters: { display: 'flex', gap: '8px' },
  filterChip: { color: '#007bff', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', transition: 'border 0.2s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' },
  compBadge: { fontSize: '0.7rem', color: '#4caf50', border: '1px solid #4caf50', padding: '2px 6px', borderRadius: '4px' },
  favBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' },
  cardTitle: { fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.8rem' },
  cardTags: { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1.5rem' },
  miniTag: { fontSize: '0.7rem', color: '#555' },
  cardFooter: { marginTop: 'auto' },
  useBtn: { width: '100%', padding: '0.8rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' },
  loader: { textAlign: 'center', padding: '5rem', color: '#444' }
};