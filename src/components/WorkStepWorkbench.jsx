import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

const makeDraftKey = () => 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
const makeSourceStepKey = (projectId, stepIndex) => String(projectId) + ':' + stepIndex;
const safeReadIdList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

export default function WorkStepWorkbench({
  isOpen,
  onClose,
  procedures = [],
  analysisData = [],
  onApply,
  maxSteps = 20
}) {
  const { t, i18n } = useTranslation('procedure');
  const isRtl = i18n.dir() === 'rtl';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState([]);
  const [selectedStepKeys, setSelectedStepKeys] = useState([]);
  const [draftSteps, setDraftSteps] = useState([]);
  const [draggedDraftIdx, setDraggedDraftIdx] = useState(null);
  const [importMode, setImportMode] = useState('full');
  const [activeUserId, setActiveUserId] = useState(null);
  const [recentProjectIds, setRecentProjectIds] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [stepSearchTerm, setStepSearchTerm] = useState('');
  const [previewStep, setPreviewStep] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialDraft = procedures
      .map((proc, index) => ({ proc, analysis: analysisData[index] }))
      .filter(item => item.proc?.stepTitle?.trim() || item.proc?.stepDetail?.trim())
      .map(item => {
        const inferredImportMode = item.proc?.composerImportMode
          || item.analysis?.composerImportMode
          || (item.proc?.sourceProjectId != null
            ? ((item.analysis?.risks?.length || 0) > 0 ? 'full' : 'procedure')
            : null);

        return {
          key: makeDraftKey(),
          proc: { ...item.proc, ...(inferredImportMode ? { composerImportMode: inferredImportMode } : {}) },
          importMode: inferredImportMode,
          analysis: item.analysis ? {
            ...item.analysis,
            ...(inferredImportMode ? { composerImportMode: inferredImportMode } : {}),
            proc: { ...item.proc, ...(inferredImportMode ? { composerImportMode: inferredImportMode } : {}) },
            risks: Array.isArray(item.analysis.risks)
              ? item.analysis.risks.map(risk => ({ ...risk }))
              : []
          } : null
        };
      });
    setDraftSteps(initialDraft);
    setSelectedStepKeys([]);
    setSearchTerm('');
    setProjectFilter('all');
    setStepSearchTerm('');
    setPreviewStep(null);

    const fetchProjects = async () => {
      setLoading(true);
      setAuthRequired(false);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProjects([]);
          setPinnedIds([]);
          setRecentProjectIds([]);
          setActiveUserId(null);
          setAuthRequired(true);
          return;
        }

        setActiveUserId(user.id);

        const [authoredRes, favoriteRes] = await Promise.all([
          supabase
            .from('jsa_projects')
            .select('id, title, tags, analysis_data, updated_at')
            .eq('author_id', user.id)
            .order('updated_at', { ascending: false }),
          supabase
            .from('user_favorites')
            .select('id, jsa_projects(id, title, tags, analysis_data, updated_at)')
            .eq('user_id', user.id)
        ]);

        const map = new Map();
        (authoredRes.data || []).forEach(project => {
          if (project?.id) map.set(project.id, { ...project, libraryType: 'MY' });
        });
        (favoriteRes.data || []).forEach(item => {
          const project = item?.jsa_projects;
          if (project?.id && !map.has(project.id)) {
            map.set(project.id, { ...project, libraryType: 'SCRAP' });
          }
        });

        const recentKey = 'smartjsa_step_composer_recent:' + user.id;
        const pinKey = 'smartjsa_step_composer_pins:' + user.id;
        const storedRecent = safeReadIdList(recentKey);
        const recentRank = new Map(storedRecent.map((id, index) => [id, index]));

        const combined = Array.from(map.values())
          .filter(project => Array.isArray(project.analysis_data) && project.analysis_data.length > 0)
          .sort((a, b) => {
            const aRank = recentRank.has(String(a.id)) ? recentRank.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
            const bRank = recentRank.has(String(b.id)) ? recentRank.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
            if (aRank !== bRank) return aRank - bRank;
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
          });

        const availableIds = new Set(combined.map(project => String(project.id)));
        const hasStoredPins = localStorage.getItem(pinKey) !== null;
        const storedPins = safeReadIdList(pinKey).filter(id => availableIds.has(id)).slice(0, 4);
        const initialPins = hasStoredPins
          ? storedPins.map(id => combined.find(project => String(project.id) === id)?.id).filter(Boolean)
          : combined.slice(0, 3).map(project => project.id);

        setProjects(combined);
        setRecentProjectIds(storedRecent.filter(id => availableIds.has(id)));
        setPinnedIds(initialPins);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isOpen, procedures, analysisData]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return projects.filter(project => {
      if (projectFilter === 'my' && project.libraryType !== 'MY') return false;
      if (projectFilter === 'scrap' && project.libraryType !== 'SCRAP') return false;
      if (projectFilter === 'recent' && !recentProjectIds.includes(String(project.id))) return false;

      if (!q) return true;
      const projectText = [
        project.title,
        ...(project.tags || []),
        ...(project.analysis_data || []).flatMap(step => [
          step?.proc?.stepTitle,
          step?.proc?.stepDetail,
          ...(step?.risks || []).flatMap(risk => [
            risk?.factor,
            risk?.risk_factor,
            risk?.measure,
            risk?.current_measure,
            risk?.recommend_measure
          ])
        ])
      ].filter(Boolean).join(' ').toLowerCase();
      return projectText.includes(q);
    });
  }, [projects, searchTerm, projectFilter, recentProjectIds]);

  const pinnedProjects = useMemo(
    () => pinnedIds
      .map(id => projects.find(project => project.id === id))
      .filter(Boolean),
    [pinnedIds, projects]
  );

  const getVisibleSteps = (project) => {
    const q = stepSearchTerm.trim().toLowerCase();
    return (project.analysis_data || [])
      .map((step, stepIndex) => ({ step, stepIndex }))
      .filter(({ step }) => {
        if (!q) return true;
        const text = [
          step?.proc?.stepTitle,
          step?.proc?.stepDetail,
          ...(step?.risks || []).flatMap(risk => [
            risk?.factor,
            risk?.risk_factor,
            risk?.measure,
            risk?.current_measure,
            risk?.recommend_measure
          ])
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
  };

  const openStepPreview = (project, step, stepIndex) => {
    setPreviewStep({ project, step, stepIndex });
  };

  const draftSourceKeys = useMemo(() => new Set(
    draftSteps
      .map(item => {
        const projectId = item.proc?.sourceProjectId;
        const stepIndex = item.proc?.sourceStepIndex;
        return projectId !== undefined && projectId !== null && Number.isInteger(stepIndex)
          ? makeSourceStepKey(projectId, stepIndex)
          : null;
      })
      .filter(Boolean)
  ), [draftSteps]);

  if (!isOpen) return null;

  const togglePinned = (projectId) => {
    setPinnedIds(prev => {
      let next;
      if (prev.includes(projectId)) {
        next = prev.filter(id => id !== projectId);
        if (String(previewStep?.project?.id) === String(projectId)) setPreviewStep(null);
      } else {
        if (prev.length >= 4) {
          alert(t('workbench.pinLimit'));
          return prev;
        }
        next = [...prev, projectId];
      }

      if (activeUserId) {
        localStorage.setItem(
          'smartjsa_step_composer_pins:' + activeUserId,
          JSON.stringify(next.map(String))
        );
      }
      return next;
    });
  };

  const toggleSelected = (projectId, stepIndex) => {
    const key = makeSourceStepKey(projectId, stepIndex);
    setSelectedStepKeys(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  };

  const buildProcedure = (project, step, stepIndex) => ({
    ...(step?.proc || {}),
    stepTitle: step?.proc?.stepTitle || '',
    stepDetail: step?.proc?.stepDetail || '',
    sourceProjectId: project.id,
    sourceProjectTitle: project.title || '',
    sourceStepIndex: stepIndex,
    composerImportMode: importMode
  });

  const buildDraftItem = (project, step, stepIndex) => {
    const proc = buildProcedure(project, step, stepIndex);
    const analysis = importMode === 'full'
      ? {
          ...step,
          proc,
          risks: Array.isArray(step?.risks)
            ? step.risks.map(risk => ({
                ...risk,
                id: 'composer-risk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
              }))
            : []
        }
      : {
          id: null,
          proc,
          risks: [],
          frequency: 1,
          severity: 1,
          riskLevel: 1
        };

    const taggedAnalysis = {
      ...analysis,
      composerImportMode: importMode,
      proc
    };

    return { key: makeDraftKey(), proc, analysis: taggedAnalysis, importMode };
  };

  const addLibraryStep = (project, step, stepIndex) => {
    const sourceKey = makeSourceStepKey(project.id, stepIndex);
    if (draftSourceKeys.has(sourceKey)) {
      alert(t('workbench.alreadyAdded'));
      return;
    }
    if (draftSteps.length >= maxSteps) {
      alert(t('workbench.maxReached'));
      return;
    }
    setDraftSteps(prev => [...prev, buildDraftItem(project, step, stepIndex)]);
    setSelectedStepKeys(prev => prev.filter(key => key !== sourceKey));
  };

  const addSelected = () => {
    const selected = [];
    projects.forEach(project => {
      (project.analysis_data || []).forEach((step, stepIndex) => {
        const sourceKey = makeSourceStepKey(project.id, stepIndex);
        if (selectedStepKeys.includes(sourceKey) && !draftSourceKeys.has(sourceKey)) {
          selected.push({ project, step, stepIndex });
        }
      });
    });

    if (!selected.length) {
      alert(t('workbench.selectedAlreadyAdded'));
      setSelectedStepKeys([]);
      return;
    }

    const available = Math.max(0, maxSteps - draftSteps.length);
    if (selected.length > available) alert(t('workbench.maxReached'));

    setDraftSteps(prev => [
      ...prev,
      ...selected.slice(0, available).map(item => buildDraftItem(item.project, item.step, item.stepIndex))
    ]);
    setSelectedStepKeys([]);
  };

  const handleLibraryDragStart = (event, projectId, stepIndex) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/x-smart-jsa-step',
      JSON.stringify({ projectId, stepIndex })
    );
  };

  const handleDropToToday = (event) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/x-smart-jsa-step');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const project = projects.find(item => String(item.id) === String(payload.projectId));
      const step = project?.analysis_data?.[payload.stepIndex];
      if (project && step) addLibraryStep(project, step, payload.stepIndex);
    } catch {
      // Ignore malformed drag payload.
    }
  };

  const reorderDraft = (targetIdx) => {
    if (draggedDraftIdx === null || draggedDraftIdx === targetIdx) return;
    setDraftSteps(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedDraftIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setDraggedDraftIdx(targetIdx);
  };

  const applyDraft = () => {
    if (activeUserId) {
      const recentKey = 'smartjsa_step_composer_recent:' + activeUserId;
      const usedProjectIds = [...new Set(
        draftSteps.map(item => item.proc?.sourceProjectId).filter(id => id !== undefined && id !== null).map(String)
      )];
      if (usedProjectIds.length) {
        const previous = safeReadIdList(recentKey);
        const nextRecent = [...usedProjectIds, ...previous.filter(id => !usedProjectIds.includes(id))].slice(0, 12);
        localStorage.setItem(recentKey, JSON.stringify(nextRecent));
        setRecentProjectIds(nextRecent);
      }
    }

    const nextProcedures = draftSteps.map(item => ({ ...item.proc }));
    const nextAnalysisData = draftSteps.map((item, index) => {
      const base = item.analysis || {};
      return {
        ...base,
        id: index,
        ...(item.importMode ? { composerImportMode: item.importMode } : {}),
        proc: { ...item.proc, ...(item.importMode ? { composerImportMode: item.importMode } : {}) },
        risks: Array.isArray(base.risks) ? base.risks.map(risk => ({ ...risk })) : [],
        frequency: base.frequency ?? 1,
        severity: base.severity ?? 1,
        riskLevel: base.riskLevel ?? 1
      };
    });
    onApply?.(nextProcedures, nextAnalysisData);
    onClose?.();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <section style={{ ...styles.workspace, direction: isRtl ? 'rtl' : 'ltr' }} onClick={event => event.stopPropagation()}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>{t('workbench.eyebrow')}</div>
            <h2 style={styles.title}>{t('workbench.title')}</h2>
            <p style={styles.subtitle}>{t('workbench.subtitle')}</p>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        {loading ? (
          <div style={styles.centerMessage}>{t('workbench.loading')}</div>
        ) : authRequired ? (
          <div style={styles.centerMessage}>{t('workbench.loginRequired')}</div>
        ) : (
          <div style={styles.body}>
            <aside style={styles.projectRail}>
              <div style={styles.panelTitle}>{t('workbench.projectLibrary')}</div>
              <input
                style={styles.searchInput}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder={t('workbench.search')}
              />
              <div style={styles.filterChips}>
                {[
                  ['all', t('workbench.filterAll')],
                  ['my', t('workbench.filterMy')],
                  ['scrap', t('workbench.filterScrap')],
                  ['recent', t('workbench.filterRecent')]
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    style={projectFilter === value ? styles.filterChipActive : styles.filterChip}
                    onClick={() => setProjectFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={styles.projectList}>
                {filteredProjects.length === 0 ? (
                  <div style={styles.emptySmall}>{t('workbench.noProject')}</div>
                ) : filteredProjects.map(project => {
                  const isPinned = pinnedIds.includes(project.id);
                  return (
                    <button
                      type="button"
                      key={project.id}
                      style={isPinned ? styles.projectBtnActive : styles.projectBtn}
                      onClick={() => togglePinned(project.id)}
                    >
                      <span style={styles.projectType}>
                        {project.libraryType === 'MY' ? t('workbench.own') : t('workbench.scrap')}
                      </span>
                      <span style={styles.projectName}>{project.title}</span>
                      <span style={styles.pinLabel}>
                        {recentProjectIds.includes(String(project.id)) && <span style={styles.recentBadge}>{t('workbench.recent')}</span>}
                        {isPinned ? t('workbench.unpin') : t('workbench.open')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main style={styles.projectBoard}>
              <div style={styles.boardToolbar}>
                <div style={styles.boardSearchAndMode}>
                  <input
                    style={styles.stepSearchInput}
                    value={stepSearchTerm}
                    onChange={event => setStepSearchTerm(event.target.value)}
                    placeholder={t('workbench.stepSearch')}
                  />
                  <div style={styles.importModeGroup}>
                  <span style={styles.importModeLabel}>{t('workbench.importMode')}</span>
                  <button
                    type="button"
                    style={importMode === 'full' ? styles.modeBtnActive : styles.modeBtn}
                    onClick={() => setImportMode('full')}
                  >
                    {t('workbench.importFull')}
                  </button>
                  <button
                    type="button"
                    style={importMode === 'procedure' ? styles.modeBtnActive : styles.modeBtn}
                    onClick={() => setImportMode('procedure')}
                  >
                    {t('workbench.importProcedureOnly')}
                  </button>
                  </div>
                </div>
                <div style={styles.boardActions}>
                  <span>{pinnedProjects.length}/4</span>
                  <button
                    type="button"
                    style={styles.bulkAddBtn}
                    disabled={selectedStepKeys.length === 0}
                    onClick={addSelected}
                  >
                    {t('workbench.addSelected')} ({selectedStepKeys.length})
                  </button>
                </div>
              </div>

              <div style={styles.projectColumns}>
                {pinnedProjects.map(project => (
                  <section key={project.id} style={styles.projectColumn}>
                    <div style={styles.projectColumnHeader}>
                      <div>
                        <div style={styles.projectColumnType}>
                          {project.libraryType === 'MY' ? t('workbench.own') : t('workbench.scrap')}
                        </div>
                        <h3 style={styles.projectColumnTitle}>{project.title}</h3>
                      </div>
                      <button
                        type="button"
                        style={styles.columnClose}
                        onClick={() => togglePinned(project.id)}
                      >
                        ×
                      </button>
                    </div>

                    <div style={styles.stepList}>
                      {getVisibleSteps(project).length === 0 ? (
                        <div style={styles.emptySteps}>{t('workbench.noSteps')}</div>
                      ) : getVisibleSteps(project).map(({ step, stepIndex }) => {
                        const key = makeSourceStepKey(project.id, stepIndex);
                        const checked = selectedStepKeys.includes(key);
                        const alreadyAdded = draftSourceKeys.has(key);
                        return (
                          <article
                            key={key}
                            draggable={!alreadyAdded}
                            onDragStart={event => {
                              if (!alreadyAdded) handleLibraryDragStart(event, project.id, stepIndex);
                            }}
                            style={alreadyAdded ? styles.stepCardAdded : (checked ? styles.stepCardSelected : styles.stepCard)}
                          >
                            <div style={styles.stepCardTop}>
                              <label style={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={alreadyAdded}
                                  onChange={() => toggleSelected(project.id, stepIndex)}
                                />
                                <span>{t('workbench.stepLabel', { number: stepIndex + 1 })}</span>
                              </label>
                              <div style={styles.stepCardActions}>
                                <button
                                  type="button"
                                  style={styles.previewBtn}
                                  onClick={() => openStepPreview(project, step, stepIndex)}
                                >
                                  {t('workbench.preview')}
                                </button>
                                <button
                                  type="button"
                                  style={alreadyAdded ? styles.addStepBtnDisabled : styles.addStepBtn}
                                  disabled={alreadyAdded}
                                  onClick={() => addLibraryStep(project, step, stepIndex)}
                                >
                                  {alreadyAdded ? t('workbench.added') : '+ ' + t('workbench.add')}
                                </button>
                              </div>
                            </div>
                            <strong style={styles.stepTitle}>{step?.proc?.stepTitle || '-'}</strong>
                            <p style={styles.stepDetail}>{step?.proc?.stepDetail || '-'}</p>
                            <div style={styles.riskCount}>
                              {t('workbench.riskCount')} {step?.risks?.length || 0}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {previewStep && (
                <section style={styles.previewInspector}>
                  <div style={styles.previewInspectorHeader}>
                    <div style={styles.previewHeadingGroup}>
                      <span style={styles.previewProjectName}>{previewStep.project.title}</span>
                      <strong style={styles.previewStepName}>
                        {t('workbench.stepLabel', { number: previewStep.stepIndex + 1 })} · {previewStep.step?.proc?.stepTitle || '-'}
                      </strong>
                    </div>
                    <button type="button" style={styles.previewCloseBtn} onClick={() => setPreviewStep(null)}>
                      {t('workbench.closePreview')}
                    </button>
                  </div>
                  <div style={styles.previewDetailText}>{previewStep.step?.proc?.stepDetail || '-'}</div>
                  <div style={styles.previewRiskHeader}>
                    {t('workbench.previewHazards')} ({previewStep.step?.risks?.length || 0})
                  </div>
                  <div style={styles.previewRiskStrip}>
                    {(previewStep.step?.risks || []).length === 0 ? (
                      <div style={styles.previewNoRisk}>{t('workbench.noPreviewHazards')}</div>
                    ) : (previewStep.step?.risks || []).map((risk, riskIndex) => (
                      <div key={risk.id || riskIndex} style={styles.previewRiskCard}>
                        <div style={styles.previewRiskFactor}>
                          <span style={styles.previewFieldLabel}>{t('workbench.hazard')}</span>
                          <span>{risk.factor || risk.risk_factor || '-'}</span>
                        </div>
                        <div style={styles.previewControlText}>
                          <span style={styles.previewFieldLabel}>{t('workbench.currentControl')}</span>
                          <span>{risk.current_measure || risk.measure || '-'}</span>
                        </div>
                        {risk.recommend_measure && (
                          <div style={styles.previewControlText}>
                            <span style={styles.previewFieldLabel}>{t('workbench.recommendedControl')}</span>
                            <span>{risk.recommend_measure}</span>
                          </div>
                        )}
                        {(risk.riskLevel ?? previewStep.step?.riskLevel) != null && (
                          <div style={styles.previewRiskLevel}>
                            {t('workbench.riskLevel')}: {risk.riskLevel ?? previewStep.step?.riskLevel}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>

            <aside
              style={styles.todayPanel}
              onDragOver={event => event.preventDefault()}
              onDrop={handleDropToToday}
            >
              <div style={styles.todayHeader}>
                <div>
                  <div style={styles.panelTitle}>{t('workbench.today')}</div>
                  <div style={styles.todayCount}>{draftSteps.length}/{maxSteps}</div>
                </div>
              </div>
              <div style={styles.todayHint}>{t('workbench.todayHint')}</div>

              <div style={styles.todayList}>
                {draftSteps.length === 0 ? (
                  <div style={styles.todayEmpty}>{t('workbench.emptyToday')}</div>
                ) : draftSteps.map((item, index) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={() => setDraggedDraftIdx(index)}
                    onDragOver={event => {
                      event.preventDefault();
                      reorderDraft(index);
                    }}
                    onDragEnd={() => setDraggedDraftIdx(null)}
                    style={{
                      ...styles.todayStep,
                      ...(item.importMode === 'full' ? styles.todayStepFull : {}),
                      ...(item.importMode === 'procedure' ? styles.todayStepProcedure : {})
                    }}
                  >
                    <div style={styles.dragHandle}>☰</div>
                    <div style={styles.todayStepBody}>
                      <strong style={styles.todayStepTitle}>
                        {index + 1}. {item.proc.stepTitle || '-'}
                      </strong>
                      <div style={styles.todayMetaRow}>
                        {item.importMode === 'full' && (
                          <span style={styles.importBadgeFull}>{t('workbench.badgeFull')}</span>
                        )}
                        {item.importMode === 'procedure' && (
                          <span style={styles.importBadgeProcedure}>{t('workbench.badgeProcedureOnly')}</span>
                        )}
                        <span style={styles.todaySource}>
                          {t('workbench.source')}: {item.proc.sourceProjectTitle || t('workbench.currentJsa')}
                          {item.proc.sourceProjectTitle && Number.isInteger(item.proc.sourceStepIndex)
                            ? ` · ${t('workbench.stepLabel', { number: item.proc.sourceStepIndex + 1 })}`
                            : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      title={t('workbench.remove')}
                      style={styles.removeBtn}
                      onClick={() => setDraftSteps(prev => prev.filter(row => row.key !== item.key))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.actions}>
                <button type="button" style={styles.cancelBtn} onClick={onClose}>
                  {t('workbench.cancel')}
                </button>
                <button type="button" style={styles.applyBtn} onClick={applyDraft}>
                  {t('workbench.apply')}
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 5000,
    background: 'rgba(0,0,0,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2vh 2vw'
  },
  workspace: {
    width: '96vw',
    height: '92vh',
    background: '#0b0b0b',
    border: '1px solid #2b2b2b',
    borderRadius: '16px',
    boxShadow: '0 30px 100px rgba(0,0,0,0.85)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '18px 22px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    alignItems: 'flex-start'
  },
  eyebrow: { fontSize: '0.68rem', color: '#007bff', fontWeight: 900, letterSpacing: '1.5px' },
  title: { margin: '5px 0 4px', fontSize: '1.45rem' },
  subtitle: { margin: 0, color: '#777', fontSize: '0.82rem', lineHeight: 1.5 },
  closeBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#151515',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '1.4rem'
  },
  centerMessage: { margin: 'auto', color: '#888', fontSize: '0.95rem' },
  body: { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '235px minmax(0, 1fr) 340px' },
  projectRail: {
    minWidth: 0,
    padding: '18px',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden'
  },
  panelTitle: { fontSize: '0.76rem', color: '#aaa', fontWeight: 900, letterSpacing: '0.4px' },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 11px',
    background: '#121212',
    border: '1px solid #2d2d2d',
    borderRadius: '7px',
    color: '#fff',
    fontSize: '0.78rem'
  },
  filterChips: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '5px' },
  filterChip: { padding: '6px 7px', borderRadius: '5px', border: '1px solid #252525', background: '#101010', color: '#666', fontSize: '0.62rem', cursor: 'pointer' },
  filterChipActive: { padding: '6px 7px', borderRadius: '5px', border: '1px solid #007bff', background: 'rgba(0,123,255,0.1)', color: '#64adff', fontSize: '0.62rem', cursor: 'pointer', fontWeight: 800 },
  projectList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' },
  projectBtn: {
    width: '100%',
    textAlign: 'left',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #242424',
    background: '#111',
    color: '#aaa',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: '4px 8px',
    alignItems: 'center'
  },
  projectBtnActive: {
    width: '100%',
    textAlign: 'left',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #007bff',
    background: 'rgba(0,123,255,0.09)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: '4px 8px',
    alignItems: 'center'
  },
  projectType: {
    fontSize: '0.58rem',
    background: '#242424',
    color: '#aaa',
    padding: '2px 5px',
    borderRadius: '3px'
  },
  projectName: { fontSize: '0.78rem', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis' },
  pinLabel: { gridColumn: '2', fontSize: '0.62rem', color: '#555', display: 'flex', alignItems: 'center', gap: '5px' },
  recentBadge: { color: '#4caf50', fontSize: '0.56rem', fontWeight: 900, border: '1px solid rgba(76,175,80,0.35)', padding: '1px 4px', borderRadius: '3px' },
  emptySmall: { padding: '20px 4px', color: '#666', fontSize: '0.75rem', lineHeight: 1.5 },
  projectBoard: { minWidth: 0, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  boardToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    color: '#555',
    fontSize: '0.7rem',
    marginBottom: '10px'
  },
  boardSearchAndMode: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 },
  stepSearchInput: { width: '210px', minWidth: '150px', padding: '7px 9px', background: '#121212', border: '1px solid #303030', borderRadius: '6px', color: '#fff', fontSize: '0.68rem', outline: 'none' },
  importModeGroup: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 },
  importModeLabel: { color: '#777', fontSize: '0.68rem', marginRight: '2px', whiteSpace: 'nowrap' },
  modeBtn: { padding: '6px 9px', borderRadius: '6px', border: '1px solid #303030', background: '#151515', color: '#777', fontSize: '0.66rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  modeBtnActive: { padding: '6px 9px', borderRadius: '6px', border: '1px solid #007bff', background: 'rgba(0,123,255,0.12)', color: '#64adff', fontSize: '0.66rem', cursor: 'pointer', fontWeight: 800, whiteSpace: 'nowrap' },
  boardActions: { display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap' },
  bulkAddBtn: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #007bff',
    background: 'rgba(0,123,255,0.12)',
    color: '#4fa3ff',
    fontSize: '0.72rem',
    cursor: 'pointer',
    fontWeight: 800
  },
  projectColumns: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    overflowY: 'hidden',
    alignItems: 'stretch'
  },
  projectColumn: {
    width: '285px',
    minWidth: '285px',
    background: '#101010',
    border: '1px solid #242424',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  projectColumnHeader: {
    padding: '12px',
    borderBottom: '1px solid #222',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  projectColumnType: { fontSize: '0.58rem', color: '#007bff', fontWeight: 900 },
  projectColumnTitle: { margin: '3px 0 0', fontSize: '0.86rem', lineHeight: 1.35 },
  columnClose: { background: 'none', border: 0, color: '#555', cursor: 'pointer', fontSize: '1rem' },
  stepList: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  stepCard: {
    padding: '10px',
    border: '1px solid #282828',
    borderRadius: '8px',
    background: '#151515',
    cursor: 'grab'
  },
  stepCardSelected: {
    padding: '10px',
    border: '1px solid #007bff',
    borderRadius: '8px',
    background: 'rgba(0,123,255,0.08)',
    cursor: 'grab'
  },
  stepCardAdded: {
    padding: '10px',
    border: '1px solid rgba(76,175,80,0.38)',
    borderRadius: '8px',
    background: 'rgba(76,175,80,0.06)',
    cursor: 'default',
    opacity: 0.72
  },
  stepCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' },
  stepCardActions: { display: 'flex', alignItems: 'center', gap: '5px' },
  previewBtn: { background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', padding: '4px 7px', fontSize: '0.62rem', cursor: 'pointer' },
  checkboxLabel: { display: 'flex', gap: '6px', alignItems: 'center', color: '#666', fontSize: '0.62rem', fontWeight: 800 },
  addStepBtn: {
    background: '#202020',
    color: '#ddd',
    border: '1px solid #333',
    borderRadius: '5px',
    padding: '4px 7px',
    fontSize: '0.65rem',
    cursor: 'pointer'
  },
  addStepBtnDisabled: {
    background: 'rgba(76,175,80,0.08)',
    color: '#4caf50',
    border: '1px solid rgba(76,175,80,0.25)',
    borderRadius: '5px',
    padding: '4px 7px',
    fontSize: '0.65rem',
    cursor: 'default'
  },
  stepTitle: { display: 'block', marginTop: '9px', fontSize: '0.82rem', color: '#eee' },
  stepDetail: {
    margin: '5px 0 8px',
    color: '#777',
    fontSize: '0.68rem',
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  riskCount: { fontSize: '0.62rem', color: '#ff7675' },
  emptySteps: { padding: '18px 8px', color: '#555', fontSize: '0.68rem', textAlign: 'center', lineHeight: 1.45 },
  previewInspector: { flexShrink: 0, marginTop: '10px', height: '205px', border: '1px solid #2b2b2b', borderRadius: '10px', background: '#0f0f0f', padding: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewInspectorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  previewHeadingGroup: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  previewProjectName: { color: '#007bff', fontSize: '0.6rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewStepName: { color: '#eee', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  previewCloseBtn: { background: 'transparent', border: '1px solid #303030', color: '#777', borderRadius: '5px', padding: '4px 7px', fontSize: '0.62rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  previewDetailText: { marginTop: '6px', color: '#777', fontSize: '0.68rem', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  previewRiskHeader: { marginTop: '8px', color: '#aaa', fontSize: '0.64rem', fontWeight: 900 },
  previewRiskStrip: { flex: 1, minHeight: 0, marginTop: '6px', display: 'flex', gap: '8px', overflowX: 'auto', overflowY: 'hidden' },
  previewRiskCard: { width: '245px', minWidth: '245px', border: '1px solid #292929', borderRadius: '7px', background: '#151515', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px', overflow: 'hidden' },
  previewRiskFactor: { color: '#eee', fontSize: '0.66rem', lineHeight: 1.35 },
  previewControlText: { color: '#999', fontSize: '0.62rem', lineHeight: 1.35, display: 'flex', flexDirection: 'column', gap: '2px' },
  previewFieldLabel: { color: '#555', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase' },
  previewRiskLevel: { marginTop: 'auto', color: '#ff7675', fontSize: '0.58rem', fontWeight: 800 },
  previewNoRisk: { margin: 'auto', color: '#555', fontSize: '0.68rem' },
  todayPanel: {
    minWidth: 0,
    borderLeft: '1px solid #222',
    background: '#0e0e0e',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  todayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  todayCount: { marginTop: '4px', color: '#007bff', fontSize: '0.7rem', fontWeight: 800 },
  todayHint: {
    margin: '12px 0',
    padding: '10px',
    border: '1px dashed #303030',
    borderRadius: '7px',
    color: '#666',
    fontSize: '0.68rem',
    lineHeight: 1.45
  },
  todayList: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' },
  todayEmpty: { margin: 'auto', padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.75rem' },
  todayStep: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '10px',
    background: '#161616',
    border: '1px solid #292929',
    borderRadius: '8px',
    cursor: 'grab'
  },
  todayStepFull: {
    borderColor: 'rgba(0,123,255,0.42)',
    background: 'linear-gradient(90deg, rgba(0,123,255,0.07), #161616 34%)'
  },
  todayStepProcedure: {
    borderColor: 'rgba(255,193,7,0.38)',
    background: 'linear-gradient(90deg, rgba(255,193,7,0.06), #161616 34%)'
  },
  dragHandle: { color: '#555', fontSize: '0.75rem' },
  todayStepBody: { flex: 1, minWidth: 0 },
  todayStepTitle: {
    display: 'block',
    color: '#eee',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  todayMetaRow: { marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 },
  importBadgeFull: { flexShrink: 0, padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(0,123,255,0.5)', background: 'rgba(0,123,255,0.12)', color: '#64adff', fontSize: '0.54rem', fontWeight: 900 },
  importBadgeProcedure: { flexShrink: 0, padding: '2px 5px', borderRadius: '4px', border: '1px solid rgba(255,193,7,0.42)', background: 'rgba(255,193,7,0.1)', color: '#e9bd45', fontSize: '0.54rem', fontWeight: 900 },
  todaySource: {
    minWidth: 0,
    color: '#555',
    fontSize: '0.6rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  removeBtn: { background: 'none', border: 0, color: '#ff5c5c', cursor: 'pointer', fontSize: '1rem' },
  actions: { display: 'flex', gap: '8px', marginTop: '14px' },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    background: '#171717',
    border: '1px solid #303030',
    borderRadius: '7px',
    color: '#888',
    cursor: 'pointer',
    fontWeight: 800
  },
  applyBtn: {
    flex: 2,
    padding: '11px',
    background: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '7px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 900
  }
};
