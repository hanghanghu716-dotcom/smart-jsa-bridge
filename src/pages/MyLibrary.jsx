import { getLanguageTag } from '../locales/config.js';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useTranslation } from 'react-i18next';
// ✅ [추가] 다국어 전용 라우팅 도구[cite: 11]
import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';
import { listRecentDrafts, setActiveDraftId, archiveDraft, deleteDraft } from '../services/jsaDraftService';
import { listWorkSteps, deleteWorkStep, updateWorkStep, setWorkStepFavorite, saveProjectWorkSteps, markWorkStepUsed, cloneWorkStep, listWorkStepVersions, restoreWorkStepVersion } from '../services/workStepLibraryService';

export default function MyLibrary() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 네비게이트 적용[cite: 11]
  const location = useLocation();
  const { t, i18n } = useTranslation('library');
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reports, setReports] = useState([]); 
  const [blocks, setBlocks] = useState([]);   
  const [projectBlocks, setProjectBlocks] = useState([]); 
  const [layouts, setLayouts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [workSteps, setWorkSteps] = useState([]); 
  
  const [newCatName, setNewCatName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [workStepSearch, setWorkStepSearch] = useState('');
  const [workStepFavoritesOnly, setWorkStepFavoritesOnly] = useState(false);
  const [editingWorkStepId, setEditingWorkStepId] = useState(null);
  const [workStepEditForm, setWorkStepEditForm] = useState({ title: '', detail: '', tags: '' });
  const [historyWorkStepId, setHistoryWorkStepId] = useState(null);
  const [workStepVersions, setWorkStepVersions] = useState([]);
  const [isVersionHistoryLoading, setIsVersionHistoryLoading] = useState(false);
  const [bulkSavingProjectId, setBulkSavingProjectId] = useState(null); 

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
    
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [navigate]);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [cats, favs, authored, reps, blks, pBlks, userLayouts, draftRows, stepRows] = await Promise.all([
      supabase.from('user_jsa_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id),
      supabase.from('jsa_projects').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_reports').select('*, jsa_projects(title)').eq('reporter_id', user.id),
      supabase.from('user_blocks').select('*, profiles:blocked_user_id(username)').eq('blocker_id', user.id),
      supabase.from('user_project_blocks').select('*, jsa_projects(title)').eq('user_id', user.id),
      supabase.from('user_layouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      listRecentDrafts(20),
      listWorkSteps({ limit: 100 })
    ]);

    setCategories(cats.data || []);
    setReports(reps.data || []);
    setBlocks(blks.data || []);
    setProjectBlocks(pBlks.data || []);
    setLayouts(userLayouts.data || []);
    setDrafts(draftRows || []);
    setWorkSteps(stepRows || []);

    const combined = [
      ...(favs.data || []).map(item => ({ ...item, displayType: 'SCRAP', originData: item.jsa_projects })),
      ...(authored.data || []).map(item => ({ id: `mine-${item.id}`, displayType: 'MY_JSA', originData: item, category_id: item.category_id || null }))
    ];

    setFavorites(combined); 
    setIsLoading(false);
  };

  const handleTogglePublic = async (projectId, currentStatus) => {
    const realId = projectId.replace('mine-', '');
    const { error } = await supabase
      .from('jsa_projects')
      .update({ is_public: !currentStatus })
      .eq('id', realId);

    if (error) {
      alert(t('errorStatusChange'));
    } else {
      fetchLibraryData();
    }
  };

  const handleClone = async (project) => {
    if (!window.confirm(t('confirmClone'))) return;
    const { data: { user } } = await supabase.auth.getUser();
    const cloneData = {
      author_id: user.id,
      title: `[${t('clonedPrefix')}] ${project.title}`,
      form_data: project.form_data,
      participants: project.participants,
      analysis_data: project.analysis_data,
      tags: project.tags,
      is_public: false,
    };
    const { error } = await supabase.from('jsa_projects').insert(cloneData);
    if (!error) { alert(t('cloneSuccess')); fetchLibraryData(); }
  };

  const handleWithdraw = async (type, id) => {
    if (!window.confirm(t('confirmWithdraw'))) return;
    const tableMap = { report: 'user_reports', block: 'user_blocks', projectBlock: 'user_project_blocks' };
    await supabase.from(tableMap[type]).delete().eq('id', id);
    fetchLibraryData();
  };

  const handleLogoClick = () => { navigate('/'); };

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('user_jsa_categories').insert({ 
      user_id: user.id, 
      category_name: newCatName, 
      parent_id: (
        selectedCatId
        && !['SYSTEM_FOLDER', 'LAYOUT_FOLDER', 'DRAFT_FOLDER', 'WORK_STEP_FOLDER'].includes(selectedCatId)
      ) ? selectedCatId : null 
    });
    setNewCatName(""); fetchLibraryData();
  };

  const deleteCategory = async (e, catId) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDeleteFolder'))) {
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

  const resumeDraft = (draft) => {
    if (!draft?.id) return;
    setActiveDraftId(draft.id, draft.version || null);

    const routeMap = {
      info: '/info',
      procedure: '/procedure',
      analysis: '/analysis',
      module: '/layout-module',
      table: '/layout-table',
      export: '/export'
    };

    navigate(routeMap[draft.current_stage] || '/info', {
      state: {
        draftId: draft.id,
        formData: draft.form_data || {},
        participants: draft.participants || [],
        procedures: draft.procedures || [],
        analysisData: draft.analysis_data || [],
        parentId: draft.source_project_id || null,
        ...(draft.layout_data || {})
      }
    });
  };

  const useSavedWorkStep = (step) => {
    markWorkStepUsed(step).catch(error =>
      console.error('[Work Step Library] usage update failed:', error)
    );
    const proc = {
      stepTitle: step.title || '',
      stepDetail: step.detail || '',
      savedWorkStepId: step.id,
      sourceProjectId: step.source_project_id || null,
      sourceProjectTitle: step.source_project_title || '',
      sourceStepIndex: step.source_step_index
    };

    const analysis = {
      ...(step.analysis_data || {}),
      id: 0,
      proc,
      risks: Array.isArray(step.analysis_data?.risks)
        ? step.analysis_data.risks.map(risk => ({ ...risk }))
        : []
    };

    navigate('/procedure', {
      state: {
        formData: {},
        participants: [],
        procedures: [proc],
        analysisData: [analysis]
      }
    });
  };

  const handleArchiveDraft = async (draftId) => {
    if (!window.confirm(t('confirmArchiveDraft'))) return;
    try {
      await archiveDraft(draftId);
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
    } catch (error) {
      console.error('[JSA Draft] archive failed:', error);
      alert(t('draftArchiveError'));
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm(t('confirmDeleteDraft'))) return;
    try {
      await deleteDraft(draftId);
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
    } catch (error) {
      console.error('[JSA Draft] delete failed:', error);
      alert(t('draftDeleteError'));
    }
  };

  const beginEditWorkStep = (step) => {
    setEditingWorkStepId(step.id);
    setWorkStepEditForm({
      title: step.title || '',
      detail: step.detail || '',
      tags: (step.tags || []).join(', ')
    });
  };

  const saveWorkStepEdits = async (id) => {
    if (!workStepEditForm.title.trim()) return;
    try {
      const updated = await updateWorkStep(id, {
        title: workStepEditForm.title.trim(),
        detail: workStepEditForm.detail || '',
        tags: workStepEditForm.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
      });
      setWorkSteps(prev => prev.map(step => step.id === id ? updated : step));
      setEditingWorkStepId(null);
    } catch (error) {
      console.error('[Work Step Library] update failed:', error);
      alert(t('workStepUpdateError'));
    }
  };

  const handleCloneWorkStep = async (step) => {
    try {
      const cloned = await cloneWorkStep(step);
      if (cloned) {
        setWorkSteps(prev => [cloned, ...prev]);
        alert(t('workStepCloneSuccess'));
      }
    } catch (error) {
      console.error('[Work Step Library] clone failed:', error);
      alert(t('workStepCloneError'));
    }
  };

  const toggleWorkStepFavorite = async (step) => {
    try {
      const updated = await setWorkStepFavorite(step, !step.is_favorite);
      setWorkSteps(prev => prev
        .map(item => item.id === step.id ? updated : item)
        .sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite)
          || new Date(b.last_used_at || b.updated_at || 0) - new Date(a.last_used_at || a.updated_at || 0)));
    } catch (error) {
      console.error('[Work Step Library] favorite update failed:', error);
      alert(t('workStepUpdateError'));
    }
  };

  const handleSaveProjectSteps = async (project) => {
    if (!project?.id || !Array.isArray(project.analysis_data)) return;
    setBulkSavingProjectId(project.id);
    try {
      const saved = await saveProjectWorkSteps(project);
      await fetchLibraryData();
      alert(t('bulkStepSaveSuccess', { count: saved.length }));
      setActiveMenuId(null);
    } catch (error) {
      console.error('[Work Step Library] bulk save failed:', error);
      alert(t('bulkStepSaveError'));
    } finally {
      setBulkSavingProjectId(null);
    }
  };

  const toggleWorkStepHistory = async (step) => {
    if (historyWorkStepId === step.id) {
      setHistoryWorkStepId(null);
      setWorkStepVersions([]);
      return;
    }

    setHistoryWorkStepId(step.id);
    setIsVersionHistoryLoading(true);
    try {
      const versions = await listWorkStepVersions(step.id, 20);
      setWorkStepVersions(versions);
    } catch (error) {
      console.error('[Work Step Library] version history failed:', error);
      alert(t('workStepHistoryError'));
      setHistoryWorkStepId(null);
    } finally {
      setIsVersionHistoryLoading(false);
    }
  };

  const handleRestoreWorkStepVersion = async (step, versionRow) => {
    if (!window.confirm(t('confirmRestoreWorkStepVersion', { version: versionRow.version }))) return;

    try {
      const restored = await restoreWorkStepVersion(step.id, versionRow);
      if (restored) {
        setWorkSteps(prev => prev.map(item => item.id === step.id ? restored : item));
        const versions = await listWorkStepVersions(step.id, 20);
        setWorkStepVersions(versions);
        alert(t('workStepVersionRestored'));
      }
    } catch (error) {
      console.error('[Work Step Library] version restore failed:', error);
      alert(t('workStepVersionRestoreError'));
    }
  };

  const removeWorkStep = async (id) => {
    if (!window.confirm(t('confirmDeleteWorkStep'))) return;
    try {
      await deleteWorkStep(id);
      setWorkSteps(prev => prev.filter(step => step.id !== id));
    } catch (error) {
      console.error('[Work Step Library] delete failed:', error);
      alert(t('workStepDeleteError'));
    }
  };

  const visibleWorkSteps = workSteps.filter(step => {
    if (workStepFavoritesOnly && !step.is_favorite) return false;
    const q = workStepSearch.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      step.title,
      step.detail,
      step.source_project_title,
      ...(step.tags || []),
      ...(step.analysis_data?.risks || []).flatMap(risk => [
        risk?.factor,
        risk?.risk_factor,
        risk?.measure,
        risk?.current_measure,
        risk?.recommend_measure
      ])
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(getLanguageTag(i18n.language), { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <div style={styles.libHeader}>
              <h2 style={styles.title}>{t('pageTitle')}</h2>
              <div style={styles.addCategoryBox}>
                <input style={styles.catInput} value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder={t('newFolderPlaceholder')} />
                <button style={styles.catAddBtn} onClick={createCategory}>{t('addFolderBtn')}</button>
              </div>
            </div>

            <div style={styles.contentGrid}>
              <aside style={styles.catSidebar}>
                <div style={selectedCatId === 'SYSTEM_FOLDER' ? styles.systemCatActive : styles.systemCat} onClick={() => setSelectedCatId('SYSTEM_FOLDER')}>{t('menuSystem')}</div>
                <div style={selectedCatId === 'DRAFT_FOLDER' ? styles.draftCatActive : styles.draftCat} onClick={() => setSelectedCatId('DRAFT_FOLDER')}>{t('menuDrafts')} ({drafts.length})</div>
                <div style={selectedCatId === 'WORK_STEP_FOLDER' ? styles.workStepCatActive : styles.workStepCat} onClick={() => setSelectedCatId('WORK_STEP_FOLDER')}>{t('menuWorkSteps')} ({workSteps.length})</div>
                <div style={selectedCatId === 'LAYOUT_FOLDER' ? styles.layoutCatActive : styles.layoutCat} onClick={() => setSelectedCatId('LAYOUT_FOLDER')}>{t('menuLayout')} ({layouts.length})</div>
                <div style={styles.catDivider} />
                <div style={!selectedCatId ? styles.catItemActive : styles.catItem} onClick={() => setSelectedCatId(null)}>{t('menuViewAll')} ({favorites.length})</div>
                <div style={styles.catScrollArea}>
                  {buildFolderTree(categories).map(root => (
                    <FolderItem key={root.id} folder={root} selectedId={selectedCatId} onSelect={setSelectedCatId} onDelete={deleteCategory} favorites={favorites} />
                  ))}
                </div>
              </aside>

              <section style={styles.listSection}>
                {isLoading ? (
                  <div style={styles.loader}>{t('loading')}</div>
                ) : selectedCatId === 'SYSTEM_FOLDER' ? (
                  <div style={styles.managementView}>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>{t('reportHistoryTitle')}</h4>
                      {reports.map(r => (
                        <div key={r.id} style={styles.mRow}>
                          <span>[{t('reportLabel')}] {r.jsa_projects?.title} - {r.reason}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('report', r.id)}>{t('withdrawBtn')}</button>
                        </div>
                      ))}
                    </div>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>{t('blockManagementTitle')}</h4>
                      {blocks.map(b => (
                        <div key={b.id} style={styles.mRow}>
                          <span>{t('userBlockLabel')}: {b.profiles?.username || t('anonymous')}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('block', b.id)}>{t('releaseBtn')}</button>
                        </div>
                      ))}
                      {projectBlocks.map(p => (
                        <div key={p.id} style={styles.mRow}>
                          <span>{t('projectHideLabel')}: {p.jsa_projects?.title}</span>
                          <button style={styles.mBtn} onClick={() => handleWithdraw('projectBlock', p.id)}>{t('releaseBtn')}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedCatId === 'DRAFT_FOLDER' ? (
                  <div style={styles.managementView}>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>{t('draftListTitle')}</h4>
                      {drafts.length === 0 && <div style={styles.emptyAsset}>{t('noDrafts')}</div>}
                      {drafts.map(draft => (
                        <div key={draft.id} style={styles.assetRow}>
                          <div style={styles.assetInfo}>
                            <strong style={styles.assetTitle}>{draft.title}</strong>
                            <span style={styles.assetMeta}>
                              {t('draftStage')}: {t(`draftStages.${draft.current_stage}`, draft.current_stage)} · {formatDate(draft.updated_at)}
                            </span>
                          </div>
                          <div style={styles.assetActions}>
                            <button style={styles.assetPrimaryBtn} onClick={() => resumeDraft(draft)}>{t('resumeDraft')}</button>
                            <button style={styles.assetSecondaryBtn} onClick={() => handleArchiveDraft(draft.id)}>{t('archiveDraft')}</button>
                            <button style={styles.assetDeleteBtn} onClick={() => handleDeleteDraft(draft.id)}>{t('deleteBtn')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedCatId === 'WORK_STEP_FOLDER' ? (
                  <div style={styles.managementView}>
                    <div style={styles.mGroup}>
                      <div style={styles.workStepHeaderRow}>
                        <h4 style={{ ...styles.mTitle, marginBottom: 0, flex: 1 }}>{t('workStepListTitle')}</h4>
                        <label style={styles.favoriteFilterLabel}>
                          <input
                            type="checkbox"
                            checked={workStepFavoritesOnly}
                            onChange={(e) => setWorkStepFavoritesOnly(e.target.checked)}
                          />
                          {t('favoritesOnly')}
                        </label>
                      </div>
                      <input
                        style={styles.workStepSearchInput}
                        value={workStepSearch}
                        onChange={(e) => setWorkStepSearch(e.target.value)}
                        placeholder={t('searchWorkSteps')}
                      />
                      {visibleWorkSteps.length === 0 && <div style={styles.emptyAsset}>{t('noWorkSteps')}</div>}
                      {visibleWorkSteps.map(step => (
                        <div key={step.id} style={styles.assetRow}>
                          <div style={styles.assetInfo}>
                            {editingWorkStepId === step.id ? (
                              <>
                                <input
                                  style={styles.inlineEditInput}
                                  value={workStepEditForm.title}
                                  onChange={(e) => setWorkStepEditForm(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <textarea
                                  style={styles.inlineEditTextarea}
                                  value={workStepEditForm.detail}
                                  onChange={(e) => setWorkStepEditForm(prev => ({ ...prev, detail: e.target.value }))}
                                />
                                <input
                                  style={styles.inlineEditInput}
                                  value={workStepEditForm.tags}
                                  onChange={(e) => setWorkStepEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                  placeholder={t('workStepTagsPlaceholder')}
                                />
                              </>
                            ) : (
                              <>
                                <div style={styles.assetTitleRow}>
                                  <strong style={styles.assetTitle}>{step.title}</strong>
                                  {step.is_favorite && <span style={styles.favoriteBadge}>★</span>}
                                </div>
                                <span style={styles.assetDescription}>{step.detail || '-'}</span>
                              </>
                            )}
                            <span style={styles.assetMeta}>
                              {t('hazardsCount')}: {step.analysis_data?.risks?.length || 0}
                              {step.source_project_title ? ` · ${step.source_project_title}` : ''}
                              {step.use_count ? ` · ${t('usedCount')}: ${step.use_count}` : ''}
                              {step.version ? ` · v${step.version}` : ''}
                            </span>
                            {historyWorkStepId === step.id && (
                              <div style={styles.versionPanel}>
                                <div style={styles.versionPanelHeader}>
                                  <strong>{t('workStepHistoryTitle')}</strong>
                                  {isVersionHistoryLoading && <span>{t('loading')}</span>}
                                </div>
                                {!isVersionHistoryLoading && workStepVersions.length === 0 && (
                                  <div style={styles.versionEmpty}>{t('workStepHistoryEmpty')}</div>
                                )}
                                {!isVersionHistoryLoading && workStepVersions.map(versionRow => (
                                  <div key={versionRow.id} style={styles.versionRow}>
                                    <div style={styles.versionInfo}>
                                      <strong>v{versionRow.version}</strong>
                                      <span>{formatDate(versionRow.created_at)}</span>
                                    </div>
                                    <button
                                      style={styles.versionRestoreBtn}
                                      onClick={() => handleRestoreWorkStepVersion(step, versionRow)}
                                    >
                                      {t('restoreVersion')}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={styles.assetActions}>
                            <button
                              style={step.is_favorite ? styles.favoriteBtnActive : styles.favoriteBtn}
                              onClick={() => toggleWorkStepFavorite(step)}
                              title={step.is_favorite ? t('removeFavorite') : t('addFavorite')}
                            >★</button>
                            {editingWorkStepId === step.id ? (
                              <>
                                <button style={styles.assetPrimaryBtn} onClick={() => saveWorkStepEdits(step.id)}>{t('saveChanges')}</button>
                                <button style={styles.assetSecondaryBtn} onClick={() => setEditingWorkStepId(null)}>{t('cancelEdit')}</button>
                              </>
                            ) : (
                              <>
                                <button style={styles.assetSecondaryBtn} onClick={() => beginEditWorkStep(step)}>{t('editWorkStep')}</button>
                                <button style={styles.assetSecondaryBtn} onClick={() => toggleWorkStepHistory(step)}>{t('workStepHistory')}</button>
                                <button style={styles.assetSecondaryBtn} onClick={() => handleCloneWorkStep(step)}>{t('cloneWorkStep')}</button>
                                <button style={styles.assetPrimaryBtn} onClick={() => useSavedWorkStep(step)}>{t('useWorkStep')}</button>
                                <button style={styles.assetDeleteBtn} onClick={() => removeWorkStep(step.id)}>{t('deleteBtn')}</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedCatId === 'LAYOUT_FOLDER' ? (
                  <div style={styles.managementView}>
                    <div style={styles.mGroup}>
                      <h4 style={styles.mTitle}>{t('layoutListTitle')}</h4>
                      {layouts.length === 0 && <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>{t('noLayouts')}</div>}
                      {layouts.map(l => (
                        <div key={l.id} style={styles.mRow}>
                          <span>[{t('layoutLabel')}] {l.name} <span style={{fontSize:'0.75rem', color:'#666', marginLeft:'10px'}}>{formatDate(l.created_at)}</span></span>
                          <button style={styles.mBtn} onClick={async () => {
                            if(window.confirm(t('confirmDeleteLayout'))) {
                              await supabase.from('user_layouts').delete().eq('id', l.id); fetchLibraryData();
                            }
                          }}>{t('deleteBtn')}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={styles.jsaGrid}>
                    {favorites.filter(f => !selectedCatId || f.category_id === selectedCatId).map(f => (
                      <div key={f.id} style={styles.jsaCard} className="card">
                        <div style={styles.cardTop}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                            <span style={{...styles.typeBadge, backgroundColor: f.displayType === 'MY_JSA' ? '#4caf50' : '#007bff'}}>
                              {f.displayType === 'MY_JSA' ? t('typeMyJsa') : t('typeScrap')}
                            </span>
                            
                            {f.displayType === 'MY_JSA' && (
                              <span style={{
                                ...styles.typeBadge, 
                                backgroundColor: f.originData?.is_public ? 'var(--accent-soft)' : 'var(--surface-3)',
                                color: f.originData?.is_public ? '#007bff' : '#666',
                                border: f.originData?.is_public ? '1px solid var(--accent)' : '1px solid var(--border-default)'
                              }}>
                                {f.originData?.is_public ? 'Public' : 'Private'}
                              </span>
                            )}

                            <span style={{
                              ...styles.typeBadge,
                              backgroundColor: f.originData?.form_data?.jsaType === '3-step' ? '#ff4d4d' : '#444'
                            }}>
                              {f.originData?.form_data?.jsaType === '3-step' ? t('typeAdvanced') : t('typeBasic')}
                            </span>
                          </div>

                          <div style={styles.menuWrapper}>
                            <button style={styles.menuBtn} onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === f.id ? null : f.id);
                            }}>⋮</button>
                            {activeMenuId === f.id && (
                              <div style={styles.dropdown}>
                                {f.displayType === 'MY_JSA' && (
                                  <div style={{...styles.dropdownItem, color: 'var(--accent)', fontWeight: 'bold'}} onClick={() => handleTogglePublic(f.id, f.originData?.is_public)}>
                                    {f.originData?.is_public ? t('menuToPrivate') : t('menuToPublic')}
                                  </div>
                                )}
                                {f.displayType === 'SCRAP' && (
                                  <>
                                    <div style={styles.dropdownItem} onClick={() => navigate('/export', { state: { analysisData: f.originData.analysis_data, formData: f.originData.form_data, participants: f.originData.participants } })}>{t('menuViewReport')}</div>
                                    <div style={styles.dropdownItem} onClick={() => handleClone(f.originData)}>{t('menuClone')}</div>
                                  </>
                                )}
                                {f.originData?.analysis_data?.length > 0 && (
                                  <div
                                    style={{ ...styles.dropdownItem, color: 'var(--success)', fontWeight: 'bold' }}
                                    onClick={() => handleSaveProjectSteps(f.originData)}
                                  >
                                    {bulkSavingProjectId === f.originData?.id ? t('bulkSavingSteps') : t('menuSaveWorkSteps')}
                                  </div>
                                )}
                                <div style={{...styles.dropdownItem, color: 'var(--danger)'}} onClick={async () => {
                                  if(window.confirm(t('confirmDeleteItem'))) {
                                    const table = f.displayType === 'MY_JSA' ? 'jsa_projects' : 'user_favorites';
                                    const id = f.displayType === 'MY_JSA' ? f.id.replace('mine-','') : f.id;
                                    await supabase.from(table).delete().eq('id', id); fetchLibraryData();
                                  }
                                }}>{t('menuDelete')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <h4 style={styles.cardTitle}>{f.originData?.title}</h4>
                        <div style={styles.dateLabel}>{formatDate(f.originData?.created_at)}</div>
                        <div style={styles.cardTags}>{f.originData?.tags?.slice(0, 2).map(t => <span key={t} style={styles.miniTag}>#{t}</span>)}</div>
                        
                        <div style={styles.cardFooter}>
                          <select style={styles.moveSelect} value={f.category_id || ""} onChange={(e) => moveFavorite(f.id, e.target.value, f.displayType)}>
                            <option value="">{t('moveFolderSelect')}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                          </select>
                          <button style={styles.useBtn} onClick={() => {
                            const targetId = f.displayType === 'MY_JSA' ? f.id.replace('mine-','') : null;
                            navigate('/analysis', { state: { id: targetId, formData: f.originData?.form_data || {}, participants: f.originData?.participants || [], analysisData: f.originData?.analysis_data || [], procedures: (f.originData?.analysis_data || []).map(d => d.proc).filter(Boolean), isFork: f.displayType === 'SCRAP' } });
                          }}>
                            {f.displayType === 'SCRAP' ? t('btnReference') : t('btnEdit')}
                          </button>
                          <div style={styles.scrapRow}>SCRAP {f.originData?.scrap_count || 0}</div>
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
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>
      <footer style={styles.footerArea}><div style={styles.bottomAdWrapper}><AdBanner slot="1284119169" style={{ width: '728px', height: '90px' }} format="horizontal" /></div></footer>
    </div>
  );
}

const FolderItem = ({ folder, selectedId, onSelect, onDelete, favorites, level = 0 }) => {
  const { t } = useTranslation('library');
  const itemCount = favorites.filter(f => f.category_id === folder.id).length;
  return (
    <div style={{ marginLeft: `${level * 10}px` }}>
      <div style={selectedId === folder.id ? styles.catItemActive : styles.catItem} onClick={() => onSelect(folder.id)}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>[{t('folderLabel')}] {folder.category_name} ({itemCount})</span>
        <button style={styles.catDelBtn} onClick={(e) => onDelete(e, folder.id)}>{t('deleteBtn')}</button>
      </div>
      {folder.children?.map(child => <FolderItem key={child.id} folder={child} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} favorites={favorites} level={level + 1} />)}
    </div>
  );
};

// 스타일 객체는 원본 소스코드를 절대적으로 유지합니다.[cite: 16]
const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'var(--app-bg)', position: 'relative' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: 'var(--hero-text)', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 120px', gap: '4rem', zIndex: 10 },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '2.5rem', display: 'flex', flexDirection: 'column', height: '75vh', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' },
  libHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-default)' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' },
  addCategoryBox: { display: 'flex', gap: '10px' },
  catInput: { backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '0.6rem 1rem', borderRadius: '6px', outline: 'none', fontSize: '0.85rem' },
  catAddBtn: { backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  contentGrid: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', flex: 1, overflow: 'hidden' },
  catSidebar: { borderRight: '1px solid var(--border-default)', paddingRight: '1rem', overflowY: 'auto' },
  systemCat: { padding: '1rem', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #331111', marginBottom: '10px' },
  systemCatActive: { padding: '1rem', color: 'var(--text-primary)', backgroundColor: '#ff4d4d', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' },
  draftCat: { padding: '1rem', color: '#e9bd45', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid rgba(233,189,69,0.25)', marginBottom: '10px' },
  draftCatActive: { padding: '1rem', color: 'var(--warning-contrast)', backgroundColor: 'var(--warning)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' },
  workStepCat: { padding: '1rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid rgba(76,175,80,0.25)', marginBottom: '10px' },
  workStepCatActive: { padding: '1rem', color: 'var(--text-primary)', backgroundColor: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' },
  layoutCat: { padding: '1rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: '1px solid #002244', marginBottom: '10px' },
  layoutCatActive: { padding: '1rem', color: 'var(--text-primary)', backgroundColor: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' },
  catDivider: { height: '1px', backgroundColor: 'var(--surface-3)', margin: '10px 0' },
  catItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' },
  catItemActive: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', color: 'var(--text-primary)', backgroundColor: 'var(--surface-3)', borderRadius: '8px', fontSize: '0.85rem' },
  catDelBtn: { background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '0.75rem', cursor: 'pointer' },
  catScrollArea: { overflowY: 'auto' },
  listSection: { overflowY: 'auto', paddingRight: '10px' },
  jsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  jsaCard: { backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'all 0.2s ease' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  typeBadge: { fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--text-primary)', padding: '1px 5px', borderRadius: '3px' },
  menuWrapper: { position: 'relative' },
  menuBtn: { background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: '1.2rem', cursor: 'pointer' },
  dropdown: { position: 'absolute', top: '100%', right: 0, width: '150px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '0.3rem', zIndex: 100 },
  dropdownItem: { padding: '0.5rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '3px' },
  cardTitle: { fontSize: '1rem', fontWeight: '800', margin: '0 0 0.3rem', color: 'var(--text-primary)', lineHeight: '1.3' },
  dateLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }, 
  cardTags: { display: 'flex', gap: '6px', marginBottom: '1.8rem', flexWrap: 'wrap' },
  miniTag: { fontSize: '0.65rem', color: 'var(--text-faint)' },
  cardFooter: { marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' },
  moveSelect: { width: '100%', backgroundColor: 'var(--app-bg)', color: 'var(--text-faint)', border: '1px solid var(--border-default)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '10px' },
  useBtn: { width: '100%', padding: '0.8rem', backgroundColor: 'var(--button-strong-bg)', color: 'var(--button-strong-text)', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer', fontSize: '0.85rem' },
  scrapRow: { marginTop: '8px', fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.5px' }, 
  managementView: { padding: '1rem' },
  mGroup: { marginBottom: '2rem' },
  mTitle: { fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '5px', fontWeight: 'bold' },
  mRow: { display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem' },
  mBtn: { padding: '4px 10px', backgroundColor: 'var(--surface-3)', color: 'var(--danger)', border: '1px solid var(--border-default)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' },
  emptyAsset: { padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', border: '1px dashed #2a2a2a', borderRadius: '8px' },
  assetRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '8px', marginBottom: '8px' },
  assetInfo: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  assetTitleRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  assetTitle: { color: 'var(--text-primary)', fontSize: '0.88rem' },
  assetDescription: { color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  assetMeta: { color: 'var(--text-faint)', fontSize: '0.65rem' },
  favoriteBadge: { color: '#e9bd45', fontSize: '0.75rem' },
  assetActions: { display: 'flex', gap: '6px', flexShrink: 0 },
  assetPrimaryBtn: { padding: '7px 11px', backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' },
  assetDeleteBtn: { padding: '7px 11px', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid #4a2424', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem' },
  assetSecondaryBtn: { padding: '7px 11px', backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem' },
  favoriteBtn: { width: '32px', height: '32px', backgroundColor: 'transparent', color: 'var(--text-faint)', border: '1px solid var(--border-default)', borderRadius: '5px', cursor: 'pointer' },
  favoriteBtnActive: { width: '32px', height: '32px', backgroundColor: 'rgba(233,189,69,0.12)', color: '#e9bd45', border: '1px solid rgba(233,189,69,0.4)', borderRadius: '5px', cursor: 'pointer' },
  workStepHeaderRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', borderBottom: '1px solid var(--border-default)', paddingBottom: '6px' },
  favoriteFilterLabel: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' },
  workStepSearchInput: { width: '100%', boxSizing: 'border-box', marginBottom: '12px', padding: '0.65rem 0.8rem', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: '6px', outline: 'none', fontSize: '0.78rem' },
  inlineEditInput: { width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid #3b3b3b', borderRadius: '5px', fontSize: '0.8rem' },
  inlineEditTextarea: { width: '100%', minHeight: '58px', boxSizing: 'border-box', padding: '0.55rem 0.7rem', resize: 'vertical', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid #3b3b3b', borderRadius: '5px', fontSize: '0.72rem', fontFamily: 'inherit' },
  versionPanel: { marginTop: '8px', padding: '9px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '7px' },
  versionPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.66rem', marginBottom: '7px' },
  versionEmpty: { color: 'var(--text-faint)', fontSize: '0.65rem', padding: '6px 0' },
  versionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '1px solid var(--border-subtle)' },
  versionInfo: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.62rem' },
  versionRestoreBtn: { padding: '4px 8px', backgroundColor: 'rgba(0,123,255,0.1)', color: 'var(--accent-text)', border: '1px solid rgba(0,123,255,0.35)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.62rem' },
  loader: { textAlign: 'center', padding: '5rem', color: 'var(--text-faint)' },
  footerArea: { width: '100%', position: 'absolute', bottom: 0, padding: '1.5rem 5rem', display: 'flex', justifyContent: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
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
    .card:hover { border-color: var(--border-default) !important; background-color: var(--surface-2) !important; transform: translateY(-3px); }
    .dropdownItem:hover { background-color: var(--surface); color: var(--text-primary) !important; }
    *::-webkit-scrollbar { display: none !important; }
  `;
}