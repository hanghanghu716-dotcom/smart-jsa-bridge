import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';
import { DIMENSIONAL_KEYWORD_MAP } from '../utils/TagDictionary';
import { useTranslation } from 'react-i18next';

const allTags = Object.keys(DIMENSIONAL_KEYWORD_MAP);

export default function PublicExplore() {
  const navigate = useNavigate();
  // [수정] 네임스페이스를 명시적으로 배열 형태로 주입합니다. 첫 번째 요소인 'explore'가 기본값이 됩니다.
  const { t, i18n } = useTranslation(['explore', 'tags']);
  
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [isBlockUser, setIsBlockUser] = useState(false);
  const [isHideProject, setIsHideProject] = useState(true);

  // [수정] 'explore.' 접두사를 제거하고 직접 키를 호출합니다.
  const FILTER_CATEGORIES = [
    { id: 'industry', name: t('categoryIndustry'), tags: allTags.filter(t => !t.startsWith('설비(') && !t.startsWith('사고(') && !/^(관리|준비|보호구|절차|마무리|기타)\(/.test(t)) },
    { id: 'safety', name: t('categorySafety'), tags: allTags.filter(t => /^(관리|준비|보호구|절차|마무리|기타)\(/.test(t)) },
    { id: 'machine', name: t('categoryMachine'), tags: allTags.filter(t => t.startsWith('설비(')) },
    { id: 'accident', name: t('categoryAccident'), tags: allTags.filter(t => t.startsWith('사고(')) }
  ];

  const [expandedGroups, setExpandedGroups] = useState({ industry: true });

  useEffect(() => {
    const checkUserAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(t('alertLoginRequired'));
        navigate('/login'); 
        return;
      }
      fetchPublicProjects();
    };

    checkUserAndFetch();
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [sortBy, navigate, t]);

  const fetchPublicProjects = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let blockedUserIds = [];
    let hiddenProjectIds = [];

    if (user) {
      const [blockRes, hideRes] = await Promise.all([
        supabase.from('user_blocks').select('blocked_user_id').eq('blocker_id', user.id),
        supabase.from('user_project_blocks').select('project_id').eq('user_id', user.id)
      ]);
      blockedUserIds = blockRes.data?.map(b => b.blocked_user_id) || [];
      hiddenProjectIds = hideRes.data?.map(h => h.project_id) || [];
    }

    let query = supabase.from('jsa_projects').select('*, profiles(username, company_name)').eq('is_public', true);
    if (sortBy === 'latest') query = query.order('created_at', { ascending: false });
    else query = query.order('scrap_count', { ascending: false });

    const { data: resultData, error: resultError } = await query;
    if (!resultError) {
      setProjects(resultData.filter(p => !blockedUserIds.includes(p.author_id) && !hiddenProjectIds.includes(p.id)));
    }
    setIsLoading(false);
  };

  const handleFavorite = async (projectId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert(t('alertLoginRequired'));
    const { error } = await supabase.from('user_favorites').upsert({ user_id: user.id, project_id: projectId });
    if (!error) {
      await supabase.rpc('increment_scrap_count', { target_project_id: projectId });
      alert(t('alertSavedToLibrary'));
      fetchPublicProjects();
    }
  };

  const submitReport = async (e) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert(t('alertReportLoginRequired'));
      return;
    }
    try {
      await supabase.from('user_reports').insert({ reporter_id: user.id, project_id: reportTarget.id, reason: reportReason });
      if (isHideProject) await supabase.from('user_project_blocks').upsert({ user_id: user.id, project_id: reportTarget.id });
      if (isBlockUser) await supabase.from('user_blocks').upsert({ blocker_id: user.id, blocked_user_id: reportTarget.author_id });
      alert(t('alertActionCompleted'));
      setReportTarget(null);
      fetchPublicProjects();
    } catch (e) { alert(t('alertErrorOccurred')); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleLogoClick = () => { navigate('/'); };

  const suggestedTags = searchTerm.trim() !== ""
    ? allTags
        .filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedTags.includes(tag))
        .sort((a, b) => a.length - b.length)
        .slice(0, 10)
    : [];

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (selectedTags.length === 0 || selectedTags.every(tag => p.tags?.includes(tag)))
  );

  const startWithProject = (p) => {
    navigate('/info', { 
      state: { 
        formData: p.form_data, 
        participants: p.participants, 
        analysisData: p.analysis_data, 
        procedures: p.analysis_data.map(d=>d.proc), 
        isFork: true,
        parentId: p.id,
        originalAnalysisData: p.analysis_data
      } 
    });
  };

  return (
    <div style={styles.wrapper}>
      {reportTarget && (
        <div style={styles.modalOverlay} onClick={() => setReportTarget(null)}>
          <div style={styles.reportModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('reportModalTitle')}</h3>
            <textarea 
              style={styles.reportInput} 
              placeholder={t('reportPlaceholder')}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div style={styles.optionGroup}>
              <label style={styles.optionLabel}>
                <input type="checkbox" checked={isHideProject} onChange={(e)=>setIsHideProject(e.target.checked)} />
                {t('hideProjectOption')}
              </label>
              <label style={styles.optionLabel}>
                <input type="checkbox" checked={isBlockUser} onChange={(e)=>setIsBlockUser(e.target.checked)} />
                {t('blockUserOption')}
              </label>
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.reportSubmitBtn} onClick={submitReport}>{t('submitReportBtn')}</button>
              <button style={styles.modalCloseBtn} onClick={() => setReportTarget(null)}>{t('cancelBtn')}</button>
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            style={styles.searchInput} 
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {suggestedTags.length > 0 && (
            <div style={styles.tagSuggestionsDropdown}>
              <div style={styles.suggestionTitle}>{t('tagSearchResultLabel')} ({suggestedTags.length})</div>
              {suggestedTags.map(tag => (
                <div 
                  key={tag} 
                  style={styles.suggestionItem} 
                  onClick={() => {
                    setSelectedTags(prev => [...prev, tag]); 
                    setSearchTerm(""); 
                  }}
                >
                  {/* [수정] tags 네임스페이스를 명시적으로 타겟팅합니다. */}
                  #{t(tag, { ns: 'tags' })}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>{t('sidebarTitle')}</span> 
            <button style={styles.resetBtn} onClick={() => setSelectedTags([])}>{t('resetBtn')}</button>         
          </div>
          
          <div style={styles.sortSection}>
            <select style={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">{t('sortLatest')}</option>
              <option value="popular">{t('sortPopular')}</option>
            </select>
          </div>

          {FILTER_CATEGORIES.map(cat => (
            <div key={cat.id} style={styles.filterGroup}>
              <div style={styles.groupHeader} onClick={() => setExpandedGroups(p => ({...p, [cat.id]: !p[cat.id]}))}>
                <h4 style={styles.groupLabel}>{cat.name}</h4>
                <span style={styles.chevron}>{expandedGroups[cat.id] ? '▼' : '▶'}</span>
              </div>
              {expandedGroups[cat.id] && (
                <div style={styles.tagGrid}>
                  {cat.tags.map(tag => (
                    <button 
                      key={tag} 
                      style={selectedTags.includes(tag) ? styles.tagItemActive : styles.tagItem}
                      onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    >
                      {/* [수정] tags 네임스페이스를 명시적으로 타겟팅합니다. */}
                      {t(tag, { ns: 'tags' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={styles.sidebarAdWrapper}>
            <AdBanner slot="3978298367" style={{ width: '100%', height: '250px' }} format="vertical" />
          </div>
        </aside>

        <main style={styles.content}>
          {selectedTags.length > 0 && (
            <div style={styles.selectedTagsContainer}>
              {selectedTags.map(tag => (
                <span key={tag} style={styles.selectedTagBadge}>
                  {/* [수정] tags 네임스페이스를 명시적으로 타겟팅합니다. */}
                  {t(tag, { ns: 'tags' })}
                  <span 
                    style={styles.tagRemoveBtn} 
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  >✕</span>
                </span>
              ))}
            </div>
          )}

          <div style={styles.resultsHeader}>
            <span>{t('totalLabel')}<strong>{filteredProjects.length}</strong>{t('assetCountLabel')}</span>
          </div>

          {isLoading ? (
            <div style={styles.loader}>{t('loadingLabel')}</div>
              ) : (
            <div style={styles.grid}>
              {filteredProjects.map((p, index) => (
                <React.Fragment key={p.id}>
                  {index % 8 === 0 && index !== 0 && (
                    <div style={styles.gridAdCard}>
                      <span style={styles.adBadge}>SPONSORED</span>
                      <AdBanner slot="9761676307" style={{ width: '100%', height: '200px' }} format="rectangle" />
                    </div>
                  )}
                
                <div key={p.id} style={styles.card} className="card">
                  <div style={styles.cardTop}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: p.form_data?.jsaType === '3-step' ? '#ff4d4d' : '#444'
                      }}>
                        {p.form_data?.jsaType === '3-step' ? t('typeAdvanced') : t('typeBasic')}
                      </span>
                      {p.form_data?.permits?.slice(0, 2).map(permit => (
                        <span key={permit} style={styles.permitBadge}>{permit}</span>
                      ))}
                    </div>
                    
                    <div style={styles.menuWrapper}>
                      <button style={styles.menuBtn} onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === p.id ? null : p.id);
                      }}>⋮</button>
                      {activeMenuId === p.id && (
                        <div style={styles.dropdown}>
                          <div style={styles.dropdownItem} onClick={() => handleFavorite(p.id)}>⭐ {t('saveLibrary')}</div>
                          <button style={styles.actionButton} onClick={() => startWithProject(p)}>{t('startWithThis')}</button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h4 style={styles.cardTitle}>{p.title}</h4>
                  <div style={styles.dateLabel}>{formatDate(p.created_at)}</div>

                  <div style={styles.cardTags}>
                    {/* [수정] tags 네임스페이스를 명시적으로 타겟팅합니다. */}
                    {p.tags?.slice(0, 3).map(tag => <span key={tag} style={styles.miniTag}>#{t(tag, { ns: 'tags' })}</span>)}
                  </div>

                  <div style={styles.cardFooter}>
                    <button style={styles.useBtn} onClick={() => startWithProject(p)}>
                      {t('startWithThis')}
                    </button>
                    <div style={styles.scrapRow}>
                       SCRAP <strong>{p.scrap_count || 0}</strong>
                    </div>
                  </div>
                </div>
                </React.Fragment>
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
  header: { padding: '1rem 3rem', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '2rem' },
  logo: { fontSize: '1rem', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px' },
  searchContainer: { flex: 1, maxWidth: '400px', position: 'relative' },
  searchInput: { width: '100%', padding: '0.6rem 1rem', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', color: '#fff', fontSize: '0.85rem', outline: 'none' },
  mainLayout: { display: 'flex', padding: '1.5rem 3rem', gap: '2.5rem' },
  sidebar: { width: '240px', flexShrink: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sidebarTitle: { fontSize: '0.75rem', color: '#444', fontWeight: 'bold' },
  resetBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.7rem' },
  sortSection: { marginBottom: '1.5rem' },
  sortSelect: { width: '100%', padding: '0.5rem', backgroundColor: '#0a0a0a', border: '1px solid #222', color: '#888', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' },
  filterGroup: { marginBottom: '1rem' },
  groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.5rem', backgroundColor: '#050505', borderRadius: '4px', border: '1px solid #111' },
  groupLabel: { fontSize: '0.75rem', margin: 0, color: '#999' },
  chevron: { fontSize: '0.5rem', color: '#333' },
  tagGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' },
  tagItem: { padding: '0.3rem 0.5rem', backgroundColor: '#050505', border: '1px solid #111', borderRadius: '3px', fontSize: '0.65rem', color: '#444', cursor: 'pointer' },
  tagItemActive: { padding: '0.3rem 0.5rem', backgroundColor: '#007bff', border: '1px solid #007bff', borderRadius: '3px', fontSize: '0.65rem', color: '#fff' },
  content: { flex: 1 },
  resultsHeader: { marginBottom: '1.2rem', color: '#333', fontSize: '0.8rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  card: { backgroundColor: '#050505', border: '1px solid #111', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'all 0.2s ease' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  typeBadge: { fontSize: '0.55rem', fontWeight: 'bold', color: '#fff', padding: '1px 5px', borderRadius: '3px' },
  permitBadge: { fontSize: '0.55rem', color: '#007bff', border: '1px solid #007bff', padding: '0px 4px', borderRadius: '3px' },
  menuWrapper: { position: 'relative' },
  menuBtn: { background: 'none', border: 'none', color: '#333', fontSize: '1.2rem', cursor: 'pointer' },
  dropdown: { position: 'absolute', top: '100%', right: 0, width: '150px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '0.3rem', zIndex: 100 },
  dropdownItem: { padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: '#888', cursor: 'pointer', borderRadius: '3px' },
  actionButton: { width: '100%', padding: '0.5rem 0.8rem', backgroundColor: 'transparent', border: 'none', textAlign: 'left', fontSize: '0.75rem', color: '#888', cursor: 'pointer', borderRadius: '3px' },
  cardTitle: { fontSize: '1rem', fontWeight: '800', margin: '0 0 0.3rem', color: '#eee', lineHeight: '1.3' },
  dateLabel: { fontSize: '0.7rem', color: '#666', marginBottom: '1rem' }, 
  cardTags: { display: 'flex', gap: '6px', marginBottom: '1.8rem', flexWrap: 'wrap' },
  miniTag: { fontSize: '0.65rem', color: '#555' }, 
  cardFooter: { marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  useBtn: { width: '100%', padding: '0.8rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' },
  scrapRow: { marginTop: '8px', fontSize: '0.6rem', color: '#444', letterSpacing: '0.5px' }, 
  loader: { textAlign: 'center', padding: '6rem', color: '#333', fontSize: '0.8rem' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  reportModal: { width: '360px', backgroundColor: '#050505', border: '1px solid #111', padding: '2rem', borderRadius: '12px' },
  modalTitle: { fontSize: '1rem', color: '#fff', marginBottom: '1.2rem', textAlign: 'center' },
  reportInput: { width: '100%', height: '100px', backgroundColor: '#000', border: '1px solid #222', color: '#fff', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.2rem', resize: 'none', fontSize: '0.85rem', outline: 'none' },
  optionGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' },
  optionLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#444', cursor: 'pointer' },
  modalBtns: { display: 'flex', gap: '10px' },
  reportSubmitBtn: { flex: 1, padding: '0.8rem', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  modalCloseBtn: { flex: 1, padding: '0.8rem', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  sidebarAdWrapper: { marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #111', paddingTop: '1.5rem' },
  gridAdCard: { backgroundColor: '#050505', border: '1px solid #111', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' },
  adBadge: { alignSelf: 'flex-start', fontSize: '0.55rem', color: '#333', marginBottom: '10px', fontWeight: 'bold' },
  selectedTagsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111' },
  selectedTagBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#007bff22', border: '1px solid #007bff', borderRadius: '20px', color: '#007bff', fontSize: '0.75rem', fontWeight: 'bold' },
  tagRemoveBtn: { cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7, padding: '2px' },
  tagSuggestionsDropdown: { position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '0 0 8px 8px', zIndex: 1000, padding: '0.5rem', borderTop: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.8)', maxHeight: '300px', overflowY: 'auto' },
  suggestionItem: { padding: '0.6rem 0.8rem', fontSize: '0.8rem', color: '#aaa', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' },
  suggestionTitle: { fontSize: '0.65rem', color: '#333', padding: '0.3rem 0.6rem', fontWeight: 'bold' },
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-explore-compact-final";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    .card:hover { border-color: #222 !important; background-color: #080808 !important; transform: translateY(-3px); }
    .dropdownItem:hover { background-color: #111; color: #fff !important; }
    .tagRemoveBtn:hover { opacity: 1; color: #fff; }
    .suggestionItem:hover { background-color: #111; color: #fff !important; }
  `;
}