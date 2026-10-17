import ActionPlanEditor from '../components/ActionPlanEditor';
import { reconcileActionPlans } from '../utils/actionPlan';
import { pickDocumentLayout } from '../utils/documentLayout';
import { mergeKnowledgeRisks, matchingProjectSteps, knowledgeLocale, languageDiffers } from '../utils/analysisKnowledge';
import { assessmentProfile, assessedScore, changeAssessmentProfile, riskProgressBlock } from '../utils/analysisAssessment';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { recommendationContext, localizedHazards, matchesHazardKeywords, updateRiskValue, applyControl, formatSimilarity, loadMeasureRecommendations, searchMeasureTranslations } from '../utils/analysisRecommendations.js';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdBanner from '../AdBanner';
import SEO from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';
import DraftSaveStatus from '../components/DraftSaveStatus';
import { saveWorkStep, listWorkSteps } from '../services/workStepLibraryService';
import { recordPublicEngagement } from '../services/publicEngagementService';
import manifest from '../data/reviewed-recommendations.json';
import { loadCaseRecommendations } from '../utils/caseRecommendations';
import { reconcileProcedureAnalysis } from '../utils/procedureAnalysis';
import { caseRecommendationUi } from '../locales/caseRecommendationUi';
import RecommendationEvidence from '../components/RecommendationEvidence';

const EMPTY_LIST = [];

export default function Analysis() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const shouldRecover = !location.state?.formData && !location.state?.analysisData;
  const { draft, status } = useJsaDraftRecovery(shouldRecover);
  if (shouldRecover && !['ready', 'empty', 'error'].includes(status)) return <div className="theme-workspace"><p role="status">{t('draftSave.pending')}</p></div>;
  return <AnalysisEditor key={location.key} recoveredDraft={draft} />;
}

function AnalysisEditor({ recoveredDraft }) {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['analysis', 'tags']);
  const [isFastTrackModalOpen, setIsFastTrackModalOpen] = useState(false);

  const state = location.state || {};
  const existingId = state.existingId ?? state.id ?? recoveredDraft?.source_project_id ?? null;
  const procedures = state.procedures || recoveredDraft?.procedures || EMPTY_LIST;
  const originalFormData = state.formData || recoveredDraft?.form_data || {};
  const [assessmentOverride, setAssessmentOverride] = useState(null);
  const assessment = assessmentProfile(assessmentOverride || originalFormData.assessment);
  const formData = { ...originalFormData, assessment };
  const participants = state.participants || recoveredDraft?.participants || [];
  const incomingAnalysisData = state.analysisData || recoveredDraft?.analysis_data || EMPTY_LIST;

  const jsaType = formData.jsaType || '2-step';
  const context = recommendationContext(formData, i18n.language);
  const { documentLocale, dataLocale, jurisdiction } = context;
  const recommendationRequest = useRef(0);
  useEffect(() => {
    if (state.isFastTrack !== undefined) {
      localStorage.setItem('jsa_isFastTrack', JSON.stringify(state.isFastTrack));
    }
  }, [state.isFastTrack]);

  const isFastTrack = JSON.parse(localStorage.getItem('jsa_isFastTrack') || 'false');
  const [dbRisks, setDbRisks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analysisData, setAnalysisState] = useState(() => procedures.length ? procedures.map((proc, id) =>
    reconcileProcedureAnalysis(incomingAnalysisData.find(step => step.id === id), proc, id)) : incomingAnalysisData);

  const setAnalysisData = update => setAnalysisState(before => reconcileActionPlans(before, typeof update === 'function' ? update(before) : update));

  const draftSave = useJsaDraftAutosave({
    enabled: Boolean(
      formData?.projectName?.trim() || procedures.length || analysisData.length || state.draftId || recoveredDraft?.id
    ),
    stage: 'analysis',
    layoutData: pickDocumentLayout(state, recoveredDraft?.layout_data),
    formData,
    participants,
    procedures,
    analysisData,
    sourceProjectId: state.parentId || recoveredDraft?.source_project_id || existingId || null,
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isHazardsLoading, setIsHazardsLoading] = useState(false);
  const [hazardsError, setHazardsError] = useState(false);
  const [hazardsAttempt, setHazardsAttempt] = useState(0);
  const [selectedHighRisk, setSelectedHighRisk] = useState("");
  const [isSavingWorkStep, setIsSavingWorkStep] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [measureSearchModal, setMeasureSearchModal] = useState({
    isOpen: false,
    data: [],
    targetRiskId: null,
    type: 'current'
  });
  const [measureSearchTerm, setMeasureSearchTerm] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [checkedRisks, setCheckedRisks] = useState(new Set());
  const [knowledgeLanguageFilter, setKnowledgeLanguageFilter] = useState('all');

  const [recModal, setRecModal] = useState({
    isOpen: false,
    data: [],
    targetRiskId: null,
    type: 'advanced'
  });

  const interactionKey = JSON.stringify([activeIdx, analysisData, documentLocale, dataLocale, jurisdiction]);
  const isSearchOpen = measureSearchModal.isOpen && measureSearchModal.contextKey === interactionKey;

  const currentStep = analysisData[activeIdx] || { proc: {}, risks: [], frequency: null, severity: null, riskLevel: null };
  const unacceptableScore = riskProgressBlock([currentStep], 0, assessment)?.score ?? null;
  const recommendations = useMemo(() => {
    const query = searchTerm.toLowerCase();
    const text = [currentStep.proc?.stepTitle, currentStep.proc?.stepDetail].filter(Boolean).join(' ');
    const filtered = dbRisks.filter(risk => query
      ? risk.risk_factor.toLowerCase().includes(query) || risk.category.toLowerCase().includes(query)
      : selectedHighRisk ? risk.category === selectedHighRisk : matchesHazardKeywords(risk, text));
    return [...new Map(filtered.map(item => [item.risk_factor, item])).values()];
  }, [currentStep.proc, selectedHighRisk, searchTerm, dbRisks]);

  const toggleCheck = (rec) => {
    const newSet = new Set(checkedRisks);
    if (newSet.has(rec)) newSet.delete(rec);
    else newSet.add(rec);
    setCheckedRisks(newSet);
  };

  const handleBulkAdd = () => {
    const selected = recommendations.filter(rec => checkedRisks.has(rec));
    if (selected.length === 0) return alert(t('alert.selectItem'));
    const newRisks = selected.map((rec) => ({
      id: `risk-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      db_id: rec.db_id ?? null,
      hazard_reference: rec.hazard_reference ?? null,
      factor: rec.risk_factor || rec.factor || "",
      measure: "",
      current_measure: "",
      recommend_measure: "",
      category: rec.category || t('base.etc'),
      source: rec.source || 'master', contentLocale: documentLocale
    }));

    setAnalysisData(prev => {
      const newData = [...prev];
      newData[activeIdx] = {
        ...newData[activeIdx],
        risks: [...newData[activeIdx].risks, ...newRisks]
      };
      return newData;
    });
    setCheckedRisks(new Set());
  };

  useEffect(() => () => { recommendationRequest.current += 1; }, [interactionKey]);

  const handleOpenRecommendation = async (risk, type = 'advanced') => {
    if (!risk.factor) return alert(t('alert.enterFactor'));
    if (type === 'advanced' && !risk.current_measure) return alert(t('alert.selectCurrentMeasure'));
    const request = ++recommendationRequest.current;
    setIsLoading(interactionKey);
    try {
      const scored = risk.source === 'case'
        ? await loadCaseRecommendations(supabase, manifest, { risk, type, formData, proc: currentStep.proc })
        : await loadMeasureRecommendations(supabase, { risk, type, context });
      if (request !== recommendationRequest.current) return;
      if (!scored.length) return alert(risk.source === 'case' ? caseRecommendationUi(i18n.language).unavailable : t('alert.noData'));
      setRecModal({ isOpen: true, data: scored, targetRiskId: risk.id, type, contextKey: interactionKey });
    } catch {
      if (request === recommendationRequest.current) alert(t('recommendation.loadError'));
    } finally {
      if (request === recommendationRequest.current) setIsLoading(false);
    }
  };

  const applyRecommendedMeasure = item => {
    setAnalysisData(prev => prev.map((step, index) => index !== activeIdx ? step : {
      ...step, risks: step.risks.map(risk => risk.id === recModal.targetRiskId
        ? applyControl(risk, item, { type: recModal.type, jsaType }) : risk)
    }));
    setRecModal({ isOpen: false, data: [], targetRiskId: null, type: 'advanced' });
  };

  const openMeasureSearch = (risk, type) => {
    setMeasureSearchModal({ isOpen: true, data: [], targetRiskId: risk.id, type, contextKey: interactionKey });
    setMeasureSearchTerm("");
    setIsSearchLoading(false);
  };

  const applySearchedMeasure = item => {
    setAnalysisData(prev => prev.map((step, index) => index !== activeIdx ? step : {
      ...step, risks: step.risks.map(risk => risk.id === measureSearchModal.targetRiskId
        ? applyControl(risk, item, { type: measureSearchModal.type, jsaType }) : risk)
    }));
    setMeasureSearchModal({ isOpen: false, data: [], targetRiskId: null, type: 'current' });
    setMeasureSearchTerm('');
  };

  useEffect(() => {
    if (!isSearchOpen) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await searchMeasureTranslations(supabase, {
          term: measureSearchTerm, type: measureSearchModal.type, locale: dataLocale
        });
        if (!cancelled) setMeasureSearchModal(prev => ({ ...prev, data }));
      } catch {
        if (!cancelled) alert(t('recommendation.loadError'));
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [measureSearchTerm, isSearchOpen, measureSearchModal.type, dataLocale, t]);

  const [isKnowledgeDockOpen, setIsKnowledgeDockOpen] = useState(false);
  const [knowledgeTab, setKnowledgeTab] = useState('steps');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [savedWorkSteps, setSavedWorkSteps] = useState([]);
  const [myLibraryItems, setMyLibraryItems] = useState([]);
  const [selectedLibProject, setSelectedLibProject] = useState(null);
  const [knowledgeNotice, setKnowledgeNotice] = useState('');
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchHazards = async () => {
      setIsHazardsLoading(true);
      setHazardsError(false);
      setDbRisks([]);
      setCategories([]);
      setCheckedRisks(new Set());
      setSelectedHighRisk('');
      try {
        const { data, error } = await supabase.from('Hazards_Translations').select('*').eq('locale', dataLocale);
        if (error) throw error;
        if (!cancelled) {
          const mapped = localizedHazards(data || []);
          setDbRisks(mapped);
          setCategories([...new Set(mapped.map(item => item.category).filter(Boolean))]);
        }
      } catch {
        if (!cancelled) setHazardsError(true);
      } finally {
        if (!cancelled) setIsHazardsLoading(false);
      }
    };
    void fetchHazards();
    return () => { cancelled = true; };
  }, [dataLocale, hazardsAttempt]);

  const handleLogoClick = () => {
    if (window.confirm(t('alert.confirmMain'))) navigate('/');
  };

  const openKnowledgeDock = async () => {
    if (knowledgeLoading) return;
    setIsKnowledgeDockOpen(true);
    setKnowledgeLoading(true);
    setKnowledgeError(false);
    setKnowledgeNotice('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { setIsKnowledgeDockOpen(false); alert(t('alert.loginRequired')); return; }
      const [steps, favoritesRes, authoredRes] = await Promise.all([
        listWorkSteps({ limit: 100 }),
        supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id),
        supabase
          .from('jsa_projects')
          .select('id, title, tags, analysis_data, form_data, updated_at')
          .eq('author_id', user.id)
          .order('updated_at', { ascending: false })
      ]);

      if (favoritesRes.error) throw favoritesRes.error;
      if (authoredRes.error) throw authoredRes.error;
      const projectMap = new Map();
      (authoredRes.data || []).forEach(project => {
        projectMap.set(String(project.id), { id: `mine-${project.id}`, jsa_projects: project, libraryType: 'MY' });
      });
      (favoritesRes.data || []).forEach(item => {
        const project = item?.jsa_projects;
        if (project?.id && project.reuse_license === 'community-v1' && !projectMap.has(String(project.id))) {
          projectMap.set(String(project.id), { ...item, libraryType: 'SCRAP' });
        }
      });

      setSavedWorkSteps(steps || []);
      setMyLibraryItems(Array.from(projectMap.values()));
      setSelectedLibProject(null);
      setKnowledgeNotice('');
    } catch (error) {
      console.error('[Analysis Knowledge Dock] load failed:', error);
      setKnowledgeError(true);
      setSavedWorkSteps([]);
      setMyLibraryItems([]);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const mergeStepData = (stepData, mode = 'full', sourceMeta = {}) => {
    const sourceRisks = Array.isArray(stepData?.risks) ? stepData.risks : [];
    if (!sourceRisks.length) {
      setKnowledgeNotice(t('knowledgeDock.noRisksToMerge'));
      return;
    }

    const sourceLocale = sourceMeta.locale || (sourceMeta.workStepId
      ? knowledgeLocale(savedWorkSteps.find(step => step.id === sourceMeta.workStepId))
      : knowledgeLocale(myLibraryItems.find(item => item.jsa_projects?.id === sourceMeta.projectId)?.jsa_projects));
    const result = mergeKnowledgeRisks(analysisData[activeIdx], stepData, {

      mode, jsaType, sourceMeta: { ...sourceMeta, locale: sourceLocale }, category: t('base.etc')
    });
    setAnalysisData(prev => prev.map((step, index) => index === activeIdx ? result.step : step));
    if (result.added > 0 && Number.isInteger(sourceMeta.stepIndex)) {
      void recordPublicEngagement(sourceMeta.projectId, 'reuse', [sourceMeta.stepIndex]);
    }
    setKnowledgeNotice(t('knowledgeDock.mergeResult', { added: result.added, skipped: result.skipped }));
  };

  const mergeSingleRisk = (risk, mode = 'full', sourceMeta = {}) => {
    mergeStepData({ risks: [risk] }, mode, sourceMeta);
  };

  const filteredSavedWorkSteps = savedWorkSteps.filter(step => {
    if (knowledgeLanguageFilter === 'same' && knowledgeLocale(step) !== documentLocale) return false;
    const q = knowledgeSearch.trim().toLowerCase();
    if (!q) return true;
    const text = [
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
    return text.includes(q);
  });

  const filteredLibraryProjects = myLibraryItems.filter(item => {
    const project = item?.jsa_projects;
    if (knowledgeLanguageFilter === 'same' && knowledgeLocale(project) !== documentLocale) return false;
    const q = knowledgeSearch.trim().toLowerCase();
    if (!project || !q) return Boolean(project);
    const text = [
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
    return text.includes(q);
  });

  const handleSaveCurrentWorkStep = async () => {
    if (!currentStep?.proc?.stepTitle?.trim()) return;

    setIsSavingWorkStep(true);
    try {
      await saveWorkStep({
        title: currentStep.proc.stepTitle,
        detail: currentStep.proc.stepDetail || '',
        analysisData: {
          ...currentStep,
          proc: {
            stepTitle: currentStep.proc.stepTitle,
            stepDetail: currentStep.proc.stepDetail || ''
          },
          risks: Array.isArray(currentStep.risks)
            ? currentStep.risks.map(risk => ({ ...risk }))
            : []
        },
        tags: formData?.tags || [],
        locale: documentLocale,
        sourceProjectId: currentStep.proc.sourceProjectId || existingId || null,
        sourceProjectTitle: currentStep.proc.sourceProjectTitle || formData?.projectName || '',
        sourceStepIndex: Number.isInteger(currentStep.proc.sourceStepIndex)
          ? currentStep.proc.sourceStepIndex
          : activeIdx,
      });
      alert(t('alert.stepSaved'));
    } catch (error) {
      console.error('[Work Step Library] save failed:', error);
      alert(error?.message === 'LOGIN_REQUIRED' ? t('alert.loginRequired') : t('alert.stepSaveFailed'));
    } finally {
      setIsSavingWorkStep(false);
    }
  };

  const addRisk = (rec) => {
    setAnalysisData(prev => {
      const newData = [...prev];
      newData[activeIdx] = {
        ...newData[activeIdx],
        risks: [...newData[activeIdx].risks, {
          id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          db_id: rec.db_id ?? null,
          hazard_reference: rec.hazard_reference ?? null,
          factor: rec.risk_factor || rec.factor || "",
          measure: "", current_measure: "", recommend_measure: "",
          category: rec.category || t('base.etc'),
          source: rec.source || (rec.factor || rec.risk_factor ? 'master' : 'manual'), contentLocale: documentLocale
        }]
      };
      return newData;
    });
  };

  const updateRiskField = (riskId, field, value) => {
    setAnalysisData(prev => {
      const newData = [...prev];
      newData[activeIdx] = {
        ...newData[activeIdx],
        risks: newData[activeIdx].risks.map(r => r.id === riskId ? updateRiskValue(r, field, value) : r)
      };
      return newData;
    });
  };

  const updateStepRisk = (field, value) => {
    setAnalysisData(prev => {
      const newData = [...prev];
      const newFreq = field === 'frequency' ? value : newData[activeIdx].frequency;
      const newSev = field === 'severity' ? value : newData[activeIdx].severity;
      newData[activeIdx] = {
        ...newData[activeIdx],
        [field]: value === '' ? null : Number(value),
        riskLevel: assessedScore(newFreq, newSev, assessment)
      };
      return newData;
    });
  };

  const updateAssessment = (field, value) => {
    const next = assessmentProfile({ ...assessment, [field]: value });
    setAnalysisData(prev => changeAssessmentProfile(prev, assessment, next));
    setAssessmentOverride(next);
  };

  const blockRiskProgress = (complete = false) => {
    const blocked = riskProgressBlock(analysisData, activeIdx, assessment, complete);
    if (!blocked) return false;
    setCheckedRisks(new Set());
    setActiveIdx(blocked.index);
    alert(t('alert.riskProgressBlocked', { step: blocked.index + 1, score: blocked.score, limit: blocked.limit }));
    return true;
  };

  // [원상 복귀 완료] 사용자님의 고유 순수 오리지널 스텝 제어 로직 보존
  const handlePrev = () => {
    if (activeIdx === 0) navigate('/procedure', {
      state: {
        ...recoveredDraft?.layout_data, ...location.state, // [핵심] 현재 가지고 있는 모든 state를 유지하여 전달
        id: existingId,
        formData,
        participants,
        procedures,
        analysisData
      }
    });
    else { setCheckedRisks(new Set()); setActiveIdx(activeIdx - 1); }
  };

  return (
    <div className="theme-workspace analysis-workspace" style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} />
      {(isLoading === interactionKey || isHazardsLoading) && <div style={styles.dialogOverlay}><div style={styles.spinner} /></div>}


      {recModal.isOpen && recModal.contextKey === interactionKey && (
        <div style={styles.dialogOverlay} onClick={() => setRecModal({ ...recModal, isOpen: false })}>
          <div role="dialog" aria-modal="true" data-recommendation-dialog style={styles.libModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{recModal.type === 'current' ? t('recModal.titleCurrent') : t('recModal.titleAdvanced')}</h3>
              <button style={styles.closeBtnSmall} onClick={() => setRecModal({ ...recModal, isOpen: false })}>✕</button>
            </div>
            <div style={styles.libList}>
              <p style={{ color: "var(--text-muted)", fontSize: '0.85rem', marginBottom: '10px' }}>
                {recModal.type === 'current' ? t('recModal.descCurrent') : t('recModal.descAdvanced')}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('recommendation.scoreHelp')}</p>
              {recModal.data.map((item, idx) => (
                <div key={idx} role="button" tabIndex={0} data-recommendation-item data-score={item.similarity_score} style={styles.libItem} onClick={() => applyRecommendedMeasure(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); applyRecommendedMeasure(item); } }}>
                  <div style={{ ...styles.libInfo, flex: 1 }}>
                    <div style={{ color: "var(--text-primary)", fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {formatSimilarity(item.similarity_score, i18n.language) !== null && (
                        <span style={{ color: "var(--accent)", marginRight: '8px', fontWeight: 'bold' }}>
                          {t('recommendation.similarity')} {formatSimilarity(item.similarity_score, i18n.language)}
                        </span>
                      )}
                      {item.display}
                    </div>
                    <small>{t('review.linkedHazard')}: {item.evidence?.hazard}</small>
                    {item.evidence?.sourceType === 'reviewed_case'
                      ? <RecommendationEvidence evidence={item.evidence} locale={i18n.language} />
                      : <><small>{t('review.unknownSource')}</small><small>{t('review.conditionsUnknown')}</small></>}
                  </div>
                  <span style={{ marginLeft: '10px', color: "var(--accent)" }}>{t('recModal.selectBtn')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div style={styles.dialogOverlay} onClick={() => setMeasureSearchModal({ ...measureSearchModal, isOpen: false })}>
          <div style={styles.libModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{t('searchModal.title')}</h3>
              <button style={styles.closeBtnSmall} onClick={() => setMeasureSearchModal({ ...measureSearchModal, isOpen: false })}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                style={styles.searchInput}
                placeholder={t('searchModal.placeholder')}
                value={measureSearchTerm}
                onChange={(e) => {
                  setMeasureSearchTerm(e.target.value);
                  setIsSearchLoading(Boolean(e.target.value.trim()));
                  setMeasureSearchModal(prev => ({ ...prev, data: [] }));
                }}
              />
            </div>

            <div style={{ ...styles.libList, height: '400px' }}>
              {isSearchLoading ? (
                <p style={styles.emptyText}>{t('base.searching')}</p>
              ) : measureSearchTerm && measureSearchModal.data.length === 0 ? (
                <p style={styles.emptyText}>{t('base.emptyRec')}</p>
              ) : (
                measureSearchModal.data.map((item, idx) => (
                  <div key={idx} style={styles.libItem} onClick={() => applySearchedMeasure(item)}>
                    <div style={{ ...styles.libInfo, flex: 1 }}>
                      <div style={{ color: "var(--text-primary)", fontSize: '0.9rem', lineHeight: '1.4' }}>{item.display}</div>
                    </div>
                    <span style={{ marginLeft: '10px', color: "var(--accent)" }}>{t('recModal.selectBtn')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
        <ThemeSwitcher compact />
      </header>

      <div className="analysis-main" style={styles.mainLayout}>
        <aside className="analysis-ad" style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div className="analysis-card" style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.basicInfo')}</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.procedure')}</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>3</div><span style={styles.stepTextActive}>{t('step.riskAnalysis')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>{t('step.moduleConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>{t('step.tableConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>{t('step.finalOutput')}</span></div>
            </nav>

            <div style={styles.formHeader}>
              <div style={styles.headerTitleGroup}>
                <h2 style={styles.formTitle}>{t('form.title')} {jsaType === '2-step' ? t('form.typeStandard') : t('form.typeAdvanced')}</h2>
                <span style={styles.stepCountBadge}>{activeIdx + 1} / {analysisData.length}</span>
              </div>
              <div style={styles.stepContext}>
                <div style={styles.stepTitleRow}><span style={styles.stepLabel}>{t('form.currentStep')}</span><strong style={styles.stepValue}>{currentStep.proc?.stepTitle}</strong></div>
                {(currentStep.proc?.sourceProjectTitle || currentStep.proc?.composerImportMode || currentStep.proc?.savedWorkStepId) && (
                  <div style={styles.stepOriginRow}>
                    {(currentStep.proc?.sourceProjectTitle || currentStep.proc?.savedWorkStepId) && (
                      <span style={styles.stepOriginBadge}>
                        {t('knowledgeDock.sourceLibrary')}
                        {currentStep.proc?.sourceProjectTitle ? ` · ${currentStep.proc.sourceProjectTitle}` : ''}
                      </span>
                    )}
                    {currentStep.proc?.composerImportMode === 'full' && (
                      <span style={styles.stepImportFullBadge}>{t('knowledgeDock.analysisIncluded')}</span>
                    )}
                    {currentStep.proc?.composerImportMode === 'procedure' && (
                      <span style={styles.stepImportOnlyBadge}>{t('knowledgeDock.stepOnly')}</span>
                    )}
                  </div>
                )}
                <p style={styles.stepDetailText}>{currentStep.proc?.stepDetail}</p>
              </div>
            </div>

            <div style={styles.quickStepNav}>
              {analysisData.map((step, idx) => (
                <button
                  type="button"
                  key={idx}
                  aria-current={idx === activeIdx ? 'step' : undefined}
                  style={idx === activeIdx ? styles.quickStepBtnActive : styles.quickStepBtn}
                  data-analysis-step={idx}
                  onClick={() => { if (idx > activeIdx && blockRiskProgress()) return; setCheckedRisks(new Set()); setActiveIdx(idx); setKnowledgeNotice(''); }}
                  title={step.proc?.stepTitle || ''}
                >
                  <span style={styles.quickStepNo}>{idx + 1}</span>
                  <span style={styles.quickStepTitle}>{step.proc?.stepTitle || t('knowledgeDock.untitledStep')}</span>
                  <span style={styles.quickStepRiskCount}>{step.risks?.length || 0}</span>
                </button>
              ))}
            </div>

            <div style={styles.scrollArea}>
              <div
                className={isKnowledgeDockOpen ? 'analysis-grid has-knowledge-dock' : 'analysis-grid'}
                style={{ ...styles.analysisGrid, ...(isKnowledgeDockOpen ? styles.analysisGridWithDock : {}) }}
              >
                <section className="analysis-candidates" style={styles.leftPanel}>
                  {context.sharedLanguage && <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('recommendation.sharedData', { locale: dataLocale })}</p>}
                  {hazardsError && <p role="alert">{t('recommendation.loadError')} <button type="button" onClick={() => setHazardsAttempt(n => n + 1)}>{t('knowledgeDock.retry')}</button></p>}
                  <div style={styles.filterArea}>
                    <input
                      type="text"
                      placeholder={t('filter.searchPlaceholder')}
                      style={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select style={styles.highRiskSelect} value={selectedHighRisk} onChange={(e) => { setSelectedHighRisk(e.target.value); setSearchTerm(""); }}>
                      <option value="">{t('filter.auto')}</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button type="button" style={styles.libLoadBtn} aria-expanded={isKnowledgeDockOpen} aria-controls="analysis-knowledge-dock" disabled={knowledgeLoading} onClick={openKnowledgeDock}>
                      {isKnowledgeDockOpen ? t('knowledgeDock.opened') : t('knowledgeDock.openBtn')}
                    </button>
                    <button
                      style={styles.saveStepBtn}
                      onClick={handleSaveCurrentWorkStep}
                      disabled={isSavingWorkStep || !currentStep?.proc?.stepTitle?.trim()}
                    >
                      {isSavingWorkStep ? t('filter.savingStepBtn') : t('filter.saveStepBtn')}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ ...styles.label, whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                      {t('base.label')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ backgroundColor: "var(--card-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => addRisk({ factor: '', measure: '' })}>{t('base.addEmptyBtn')}</button>
                      <button data-add-selected style={{ backgroundColor: "var(--action-bg)", color: "var(--on-accent)", border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleBulkAdd}>{t('base.addBulkBtn')}</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
                    {recommendations.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", textAlign: 'center', padding: '2rem 0', fontSize: '0.8rem' }}>{t('base.emptyRec')}</p>
                    ) : (
                      recommendations.map((rec, i) => (
                        <label key={`rec-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: "var(--card-bg)", border: checkedRisks.has(rec) ? "1px solid var(--accent)" : "1px solid var(--border-default)", borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={checkedRisks.has(rec)} onChange={() => toggleCheck(rec)} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "var(--text-primary)", fontSize: '0.85rem', fontWeight: 'bold' }}>{rec.risk_factor || rec.factor}</div>
                          </div>
                          <div style={styles.recBadge}>{rec.category || t('base.etc')}</div>
                        </label>
                      ))
                    )}
                  </div>
                </section>

                <section className="analysis-selected" style={styles.rightPanel}>
                  <div style={styles.rightHeader}>
                    <span style={styles.label}>{t('result.label')} ({currentStep.risks.length})</span>
                    <div style={styles.riskScoreContainer}>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>{t('result.freq')}</span><select data-assessed-frequency aria-label={t('result.freq')} style={styles.miniSelect} value={currentStep.frequency ?? ''} onChange={(e) => updateStepRisk('frequency', e.target.value)}><option value=""></option>{Array.from({ length: assessment.frequencyMax }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskMultiply}>×</div>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>{t('result.sev')}</span><select data-assessed-severity aria-label={t('result.sev')} style={styles.miniSelect} value={currentStep.severity ?? ''} onChange={(e) => updateStepRisk('severity', e.target.value)}><option value=""></option>{Array.from({ length: assessment.severityMax }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskEqual}>=</div>
                      <div data-assessed-score style={{ ...styles.riskResultSelect, backgroundColor: assessedScore(currentStep.frequency, currentStep.severity, assessment) >= assessment.highFrom ? "var(--danger-action)" : "var(--action-bg)" }}>{assessedScore(currentStep.frequency, currentStep.severity, assessment) ?? ''}</div>
                    </div>
                  </div>

                  {unacceptableScore !== null && <div role="alert" data-risk-limit-warning style={{ margin: '10px 0', padding: '10px 12px', border: '1px solid var(--danger-action)', borderRadius: '8px', color: 'var(--danger-action)', fontSize: '.85rem', lineHeight: 1.5 }}>
                    {t('review.riskLimitWarning', { score: unacceptableScore, limit: 15 })}
                  </div>}

                  <div style={styles.selectedListScroll}>
                    <details style={{ fontSize: '.8rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                      <summary>{t('review.profileLabel')}: {assessment.name} ({assessment.frequencyMax} × {assessment.severityMax}; {t('review.highFrom')} {assessment.highFrom})</summary>
                      <p>{t('review.profileHelp')}</p>
                      <label>{t('review.profileLabel')}<input value={assessment.name} onChange={event => updateAssessment('name', event.target.value)} /></label>
                      {['frequencyMax', 'severityMax', 'highFrom'].map(field => <label key={field} style={{ display: 'block' }}>{t(`review.${field}`)}<input type="number" min="1" max={field === 'highFrom' ? assessment.frequencyMax * assessment.severityMax : 10} value={assessment[field]} onChange={event => updateAssessment(field, Number(event.target.value))} /></label>)}
                      <label>{t('review.criteria')}<textarea value={assessment.criteria} onChange={event => updateAssessment('criteria', event.target.value)} /></label>
                    </details>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>{t('table.factor')}</th>
                          {jsaType === '2-step' ? (
                            <th style={styles.th}>{t('table.measure')}</th>
                          ) : (
                            <>
                              <th style={styles.th}>{t('table.currentMeasure')}</th>
                              <th style={styles.th}>{t('table.advancedMeasure')}</th>
                            </>
                          )}
                          <th style={styles.th}>{t('table.delete')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStep.risks.map(r => (
                          <tr key={r.id}>
                            <td style={styles.td}>
                              <textarea style={styles.inlineInput} value={r.factor} onChange={(e) => updateRiskField(r.id, 'factor', e.target.value)} rows={3} />
                              <div style={styles.riskSourceRow}>
                                <span style={styles.riskSourceBadge}>
                                  {!r.source
                                    ? t('knowledgeDock.sourceCurrent')
                                    : r.source === 'manual'
                                      ? t('knowledgeDock.sourceManual')
                                      : r.source === 'master'
                                        ? t('knowledgeDock.sourceDatabase')
                                        : t('knowledgeDock.sourceLibrary')}
                                </span>
                                {r.sourceLabel && <span style={styles.riskSourceText}>{r.sourceLabel}</span>}
                                {r.recommendation_review_required && <span role="status" style={styles.riskSourceText}>{t('recommendation.reviewRequired')}</span>}
                                {languageDiffers(r.contentLocale || r.sourceLocale, documentLocale) && <span role="status" style={styles.riskSourceText}>{t('review.languageChanged')} ({r.contentLocale || r.sourceLocale || t('review.unknownLanguage')} → {documentLocale})</span>}
                              </div>
                            </td>

                            {jsaType === '2-step' ? (
                              <td style={styles.td}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <textarea style={styles.inlineInput} value={r.measure} onChange={(e) => updateRiskField(r.id, 'measure', e.target.value)} rows={3} />
                                  <div style={styles.controlActionRow}>
                                    <button style={styles.controlSearchBtn} onClick={() => openMeasureSearch(r, 'current')}>
                                      {t('table.searchBtn')}
                                    </button>
                                    <button data-recommend-current style={styles.controlRecommendBtn} onClick={() => handleOpenRecommendation(r, 'current')}>
                                      {t('table.recMeasureBtn')}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td style={styles.td}>
                                  <div style={{ position: 'relative', width: '100%' }}>
                                    <textarea style={styles.inlineInput} value={r.current_measure} onChange={(e) => updateRiskField(r.id, 'current_measure', e.target.value)} rows={3} />
                                    <div style={styles.controlActionRow}>
                                      <button style={styles.controlSearchBtn} onClick={() => openMeasureSearch(r, 'current')}>
                                        {t('table.searchBtn')}
                                      </button>
                                      <button data-recommend-current style={styles.controlRecommendBtn} onClick={() => handleOpenRecommendation(r, 'current')}>
                                        {t('table.recMeasureBtn')}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td style={styles.td}>
                                  <div style={{ position: 'relative', width: '100%' }}>
                                    <textarea style={styles.inlineInput} value={r.recommend_measure} onChange={(e) => updateRiskField(r.id, 'recommend_measure', e.target.value)} rows={3} />
                                    <div style={styles.controlActionRow}>
                                      <button style={styles.controlSearchBtn} onClick={() => openMeasureSearch(r, 'advanced')}>
                                        {t('table.searchBtn')}
                                      </button>
                                      <button data-recommend-advanced style={styles.controlAdvancedBtn} onClick={() => handleOpenRecommendation(r, 'advanced')}>
                                        {t('table.recAdvancedBtn')}
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </>
                            )}

                            <td style={{ textAlign: 'center' }}>
                              <button style={styles.smallDeleteBtn} onClick={() => {
                                setAnalysisData(prev => {
                                  const newData = [...prev];
                                  newData[activeIdx] = { ...newData[activeIdx], risks: newData[activeIdx].risks.filter(risk => risk.id !== r.id) };
                                  return newData;
                                });
                              }}>×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <ActionPlanEditor step={currentStep} jsaType={jsaType} assessment={assessment} locale={i18n.language}
                      onChange={actionPlan => setAnalysisData(prev => prev.map((step, index) => index === activeIdx ? { ...step, actionPlan } : step))} />
                  </div>
                </section>

                {isKnowledgeDockOpen && (
                  <aside id="analysis-knowledge-dock" className="knowledge-dock" aria-label={t('knowledgeDock.title')} aria-busy={knowledgeLoading} style={styles.knowledgeDock}>
                    <div style={styles.knowledgeDockHeader}>
                      <div>
                        <div style={styles.knowledgeDockEyebrow}>{t('knowledgeDock.eyebrow')}</div>
                        <strong style={styles.knowledgeDockTitle}>{t('knowledgeDock.title')}</strong>
                      </div>
                      <button type="button" aria-label={t('knowledgeDock.close')} style={styles.knowledgeCloseBtn} onClick={() => setIsKnowledgeDockOpen(false)}>×</button>
                    </div>

                    <div style={styles.knowledgeTabs}>
                      <button
                        type="button"
                        style={knowledgeTab === 'steps' ? styles.knowledgeTabActive : styles.knowledgeTab}
                        onClick={() => { setKnowledgeTab('steps'); setSelectedLibProject(null); }}
                      >
                        {t('knowledgeDock.savedSteps')} ({savedWorkSteps.length})
                      </button>
                      <button
                        type="button"
                        style={knowledgeTab === 'projects' ? styles.knowledgeTabActive : styles.knowledgeTab}
                        onClick={() => { setKnowledgeTab('projects'); setSelectedLibProject(null); }}
                      >
                        {t('knowledgeDock.projects')} ({myLibraryItems.length})
                      </button>
                    </div>

                    <input
                      aria-label={t('knowledgeDock.search')} style={styles.knowledgeSearchInput}
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      placeholder={t('knowledgeDock.search')}
                    />
                    <label style={styles.knowledgeMeta}>{t('review.targetLanguage')}: {documentLocale}
                      <select aria-label={t('review.sourceLanguage')} value={knowledgeLanguageFilter} onChange={event => { setKnowledgeLanguageFilter(event.target.value); setSelectedLibProject(null); }}>
                        <option value="all">{t('review.allLanguages')}</option><option value="same">{t('review.sameLanguage')}</option>
                      </select>
                    </label>

                    {knowledgeNotice && (
                      <div role="status" style={styles.knowledgeNotice}>{knowledgeNotice}</div>
                    )}

                    <div style={styles.knowledgeScroll}>
                      {knowledgeLoading ? <div role="status" style={styles.knowledgeEmpty}>{t('knowledgeDock.loading')}</div>
                        : knowledgeError ? <div role="alert" style={styles.knowledgeEmpty}>
                          <p>{t('knowledgeDock.loadError')}</p>
                          <button type="button" style={styles.knowledgeSecondaryBtn} onClick={openKnowledgeDock}>{t('knowledgeDock.retry')}</button>
                        </div> : knowledgeTab === 'steps' ? (
                        filteredSavedWorkSteps.length === 0 ? (
                          <div style={styles.knowledgeEmpty}>{t(knowledgeSearch.trim() ? 'knowledgeDock.noMatches' : 'knowledgeDock.emptySteps')}</div>
                        ) : filteredSavedWorkSteps.map(step => {
                          const stepData = step.analysis_data || {};
                          const risks = Array.isArray(stepData.risks) ? stepData.risks : [];
                          return (
                            <article key={step.id} style={styles.knowledgeCard}>
                              <div style={styles.knowledgeCardHeader}>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={styles.knowledgeCardTitle}>{step.title}</strong>
                                  <div style={styles.knowledgeMeta}>{t('review.sourceLanguage')}: {knowledgeLocale(step) || t('review.unknownLanguage')}{languageDiffers(knowledgeLocale(step), documentLocale) && ` — ${t('review.languageChanged')}`}</div>
                                  <div style={styles.knowledgeMeta}>
                                    {step.source_project_title || t('knowledgeDock.independentStep')} · {risks.length} {t('knowledgeDock.hazards')}
                                  </div>
                                </div>
                                {step.is_favorite && <span style={styles.knowledgeFavorite}>★</span>}
                              </div>
                              {step.detail && <p style={styles.knowledgeDetail}>{step.detail}</p>}
                              <div style={styles.knowledgeRiskPreview}>
                                {risks.map((risk, idx) => (
                                  <div key={risk.id || idx} style={styles.knowledgeRiskLine}>
                                    <div style={styles.knowledgeRiskCopy}>
                                      <span style={styles.knowledgeHazardText}>{risk.factor || risk.risk_factor || ''}</span>
                                      <span style={styles.knowledgeControlText}>
                                        {risk.measure || [risk.current_measure, risk.recommend_measure].filter(Boolean).join('\n') || t('knowledgeDock.noControl')}
                                      </span>
                                    </div>
                                    <div style={styles.knowledgeRiskActions}>
                                      <button
                                        type="button"
                                        style={styles.knowledgeMiniBtn}
                                        onClick={() => mergeSingleRisk(risk, 'hazards', {
                                          type: 'work-step',
                                          label: step.title,
                                          workStepId: step.id,
                                          projectId: step.source_project_id, stepIndex: step.source_step_index
                                        })}
                                      >
                                        {t('knowledgeDock.mergeOneHazard')}
                                      </button>
                                      <button
                                        type="button"
                                        style={styles.knowledgeMiniBtnActive}
                                        onClick={() => mergeSingleRisk(risk, 'full', {
                                          type: 'work-step',
                                          label: step.title,
                                          workStepId: step.id,
                                          projectId: step.source_project_id, stepIndex: step.source_step_index
                                        })}
                                      >
                                        {t('knowledgeDock.mergeOneFull')}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div style={styles.knowledgeActions}>
                                <button
                                  type="button"
                                  style={styles.knowledgeSecondaryBtn}
                                  onClick={() => mergeStepData(stepData, 'hazards', {
                                    type: 'work-step',
                                    label: step.title,
                                    workStepId: step.id,
                                          projectId: step.source_project_id, stepIndex: step.source_step_index
                                  })}
                                >
                                  {t('knowledgeDock.mergeHazards')}
                                </button>
                                <button
                                  type="button"
                                  style={styles.knowledgePrimaryBtn}
                                  onClick={() => mergeStepData(stepData, 'full', {
                                    type: 'work-step',
                                    label: step.title,
                                    workStepId: step.id,
                                          projectId: step.source_project_id, stepIndex: step.source_step_index
                                  })}
                                >
                                  {t('knowledgeDock.mergeFull')}
                                </button>
                              </div>
                            </article>
                          );
                        })
                      ) : !selectedLibProject ? (
                        filteredLibraryProjects.length === 0 ? (
                          <div style={styles.knowledgeEmpty}>{t(knowledgeSearch.trim() ? 'knowledgeDock.noMatches' : 'knowledgeDock.emptyProjects')}</div>
                        ) : filteredLibraryProjects.map(item => {
                          const project = item.jsa_projects;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              style={styles.knowledgeProjectBtn}
                              onClick={() => setSelectedLibProject(project)}
                            >
                              <span style={styles.knowledgeProjectTitle}>{project.title}</span>
                              <span style={styles.knowledgeProjectMeta}>{t('review.sourceLanguage')}: {knowledgeLocale(project) || t('review.unknownLanguage')}{languageDiffers(knowledgeLocale(project), documentLocale) && ` — ${t('review.languageChanged')}`}</span>
                              <span style={styles.knowledgeProjectMeta}>
                                {(project.analysis_data || []).length} {t('knowledgeDock.steps')}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <>
                          <button
                            type="button"
                            style={styles.knowledgeBackBtn}
                            onClick={() => setSelectedLibProject(null)}
                          >
                            ← {t('knowledgeDock.backProjects')}
                          </button>
                          <div style={styles.knowledgeSelectedProject}>{selectedLibProject.title}</div>
                          {matchingProjectSteps(selectedLibProject, knowledgeSearch).map(({ step, index: idx }) => (
                              <article key={idx} style={styles.knowledgeCard}>
                                <div style={styles.knowledgeCardHeader}>
                                  <div style={{ minWidth: 0 }}>
                                    <strong style={styles.knowledgeCardTitle}>
                                      {idx + 1}. {step.proc?.stepTitle || t('knowledgeDock.untitledStep')}
                                    </strong>
                                    <div style={styles.knowledgeMeta}>
                                      {(step.risks || []).length} {t('knowledgeDock.hazards')}
                                    </div>
                                  </div>
                                </div>
                                <p style={styles.knowledgeDetail}>{step.proc?.stepDetail || ''}</p>
                                <div style={styles.knowledgeRiskPreview}>
                                  {(step.risks || []).map((risk, riskIdx) => (
                                    <div key={risk.id || riskIdx} style={styles.knowledgeRiskLine}>
                                      <div style={styles.knowledgeRiskCopy}>
                                        <span style={styles.knowledgeHazardText}>{risk.factor || risk.risk_factor || ''}</span>
                                        <span style={styles.knowledgeControlText}>
                                          {risk.measure || risk.current_measure || risk.recommend_measure || t('knowledgeDock.noControl')}
                                        </span>
                                      </div>
                                      <div style={styles.knowledgeRiskActions}>
                                        <button
                                          type="button"
                                          style={styles.knowledgeMiniBtn}
                                          onClick={() => mergeSingleRisk(risk, 'hazards', {
                                            type: 'project',
                                            label: `${selectedLibProject.title} · ${idx + 1}`,
                                            projectId: selectedLibProject.id, stepIndex: idx
                                          })}
                                        >
                                          {t('knowledgeDock.mergeOneHazard')}
                                        </button>
                                        <button
                                          type="button"
                                          style={styles.knowledgeMiniBtnActive}
                                          onClick={() => mergeSingleRisk(risk, 'full', {
                                            type: 'project',
                                            label: `${selectedLibProject.title} · ${idx + 1}`,
                                            projectId: selectedLibProject.id, stepIndex: idx
                                          })}
                                        >
                                          {t('knowledgeDock.mergeOneFull')}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div style={styles.knowledgeActions}>
                                  <button
                                    type="button"
                                    style={styles.knowledgeSecondaryBtn}
                                    onClick={() => mergeStepData(step, 'hazards', {
                                      type: 'project',
                                      label: `${selectedLibProject.title} · ${idx + 1}`,
                                            projectId: selectedLibProject.id, stepIndex: idx
                                    })}
                                  >
                                    {t('knowledgeDock.mergeHazards')}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.knowledgePrimaryBtn}
                                    onClick={() => mergeStepData(step, 'full', {
                                      type: 'project',
                                      label: `${selectedLibProject.title} · ${idx + 1}`,
                                            projectId: selectedLibProject.id, stepIndex: idx
                                    })}
                                  >
                                    {t('knowledgeDock.mergeFull')}
                                  </button>
                                </div>
                              </article>
                            ))}
                        </>
                      )}
                    </div>
                  </aside>
                )}
              </div>
            </div>

            {/* 패스트트랙 모달 레이아웃 바인딩 */}
            {isFastTrack && isFastTrackModalOpen && (
              <div data-fast-track-result style={styles.dialogOverlay} onClick={() => setIsFastTrackModalOpen(false)}>
                <div style={{ ...styles.libModalContent, width: '750px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
                  <div style={styles.modalHeader}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>⚡ {t('fastTrackModal.title')}</h3>
                    <button style={styles.closeBtnSmall} onClick={() => setIsFastTrackModalOpen(false)}>✕</button>
                  </div>

                  <p style={{ color: "var(--text-secondary)", fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                    {t('fastTrackModal.desc')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>


                  {analysisData.map((step, sIdx) => (
                    <div key={sIdx} style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: "var(--text-primary)", marginBottom: '0.8rem', borderBottom: "1px solid var(--border-default)", paddingBottom: '0.5rem' }}>
                        STEP {String(sIdx + 1).padStart(2, '0')}: {step.proc?.stepTitle}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {step.risks?.map((r, rIdx) => (
                          <div key={r.id || rIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', position: 'relative' }}>
                            <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', padding: '10px', position: 'relative' }}>
                              <span style={{ fontSize: '0.65rem', color: "var(--danger)", display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('fastTrackModal.hazardFactor')}</span>
                              <div style={{ color: "var(--text-primary)", fontSize: '0.85rem', paddingRight: '45px', whiteSpace: 'pre-wrap' }}>{r.factor}</div>
                              <button style={styles.clipboardCopyBtn} onClick={() => { navigator.clipboard.writeText(r.factor); alert(t('fastTrackModal.copied')); }} title="Copy Hazard">📋</button>
                            </div>
                            <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '6px', padding: '10px', position: 'relative' }}>
                              <span style={{ fontSize: '0.65rem', color: "var(--accent)", display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('fastTrackModal.safetyMeasure')}</span>
                              <div style={{ color: "var(--text-primary)", fontSize: '0.85rem', paddingRight: '45px', whiteSpace: 'pre-wrap' }}>{r.measure || r.current_measure}</div>
                              <button style={styles.clipboardCopyBtn} onClick={() => { navigator.clipboard.writeText(r.measure || r.current_measure); alert(t('fastTrackModal.measureCopied')); }} title="Copy Measure">📋</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button style={{ ...styles.nextBtn, padding: '0.8rem', fontSize: '0.95rem', marginTop: '10px' }} onClick={() => navigate('/')}>
                    {t('fastTrackModal.goHome')}
                  </button>



                  </div>

                  <button
                    style={{ ...styles.nextBtn, padding: '0.8rem', fontSize: '0.95rem', marginTop: '10px' }}
                    onClick={() => navigate('/')}
                  >
                    {t('fastTrackModal.goHome')}
                  </button>




                </div>
              </div>
            )}

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{activeIdx === 0 ? t('btn.prevStep1') : t('btn.prevStep2')}</button>
              <button
                data-analysis-next style={styles.nextBtn}
                onClick={() => {
                  if (blockRiskProgress(activeIdx === analysisData.length - 1)) return;
                  if (activeIdx < analysisData.length - 1) {
                    setCheckedRisks(new Set());
                    setActiveIdx(activeIdx + 1);
                  } else {
                    if (isFastTrack) {
                      setIsFastTrackModalOpen(true);
                    } else {
                      navigate('/document-designer', {
                        state: {
                          ...recoveredDraft?.layout_data, ...state, existingId, analysisData, formData, participants, procedures,
                          isFork: location.state?.isFork, parentId: location.state?.parentId, originalAnalysisData: location.state?.originalAnalysisData
                        }
                      });
                    }
                  }
                }}
              >
                {activeIdx === analysisData.length - 1 ? (isFastTrack ? t('btn.fastTrackComplete') : t('common:designer.title')) : t('btn.nextStep')}
              </button>
            </div>

          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="1284119169" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  searchInput: { flex: 1.2, minWidth: 0, backgroundColor: "var(--input-bg)", border: "1px solid var(--border-default)", color: "var(--text-primary)", padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }, wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: "var(--app-bg)" },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: "var(--workspace-overlay)", zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: "var(--text-primary)", cursor: 'pointer', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { flex: 1, display: 'flex', padding: '0 5rem 80px', zIndex: 10, overflow: 'hidden', gap: '3rem' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { minWidth: 0, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '80vh', backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '12px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', boxShadow: "var(--shadow-panel)", overflow: 'hidden' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.6rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepBadgeActive: { width: '20px', height: '20px', backgroundColor: "var(--action-bg)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: "var(--on-accent)" },
  stepBadgeDone: { width: '20px', height: '20px', backgroundColor: "var(--success-action)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--on-accent)", fontSize: '0.7rem' },
  stepTextActive: { fontSize: '0.8rem', color: "var(--text-primary)", fontWeight: '700' },
  stepTextDone: { fontSize: '0.8rem', color: "var(--success)", fontWeight: '700' },
  stepLineActive: { width: '20px', height: '1.5px', backgroundColor: "var(--success-action)" },
  stepLine: { width: '20px', height: '1px', backgroundColor: "var(--border-default)" },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 1 },
  stepBadge: { width: '20px', height: '20px', backgroundColor: "var(--surface-hover)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--text-secondary)", fontSize: '0.75rem' },
  stepText: { fontSize: '0.8rem', color: "var(--text-secondary)" },
  formHeader: { borderLeft: "5px solid var(--accent)", paddingLeft: '1rem', marginBottom: '0.8rem' },
  quickStepNav: { display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 0 0.8rem', marginBottom: '0.3rem', flexShrink: 0 },
  quickStepBtn: { minWidth: '110px', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', border: "1px solid var(--border-default)", borderRadius: '6px', background: "var(--card-bg)", color: "var(--text-muted)", cursor: 'pointer', fontSize: '0.65rem' },
  quickStepBtnActive: { minWidth: '110px', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', border: "1px solid var(--accent)", borderRadius: '6px', background: 'var(--accent-soft)', color: "var(--text-primary)", cursor: 'pointer', fontSize: '0.65rem' },
  quickStepNo: { width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: "var(--card-bg)", color: "var(--text-secondary)", flexShrink: 0, fontWeight: 900 },
  quickStepTitle: { flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'left' },
  quickStepRiskCount: { flexShrink: 0, minWidth: '18px', padding: '1px 4px', borderRadius: '8px', background: "var(--card-bg)", color: "var(--text-muted)", fontSize: '0.55rem', textAlign: 'center' },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' },
  formTitle: { fontSize: '1.4rem', color: "var(--text-primary)", fontWeight: '800', margin: 0 },
  stepCountBadge: { backgroundColor: "var(--surface-hover)", color: "var(--text-secondary)", padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' },
  stepContext: { backgroundColor: "var(--card-bg)", padding: '0.8rem 1rem', borderRadius: '6px' },
  stepOriginRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' },
  stepOriginBadge: { fontSize: '0.55rem', color: "var(--accent)", border: '1px solid var(--accent)', background: 'var(--accent-soft)', padding: '2px 5px', borderRadius: '4px' },
  stepImportFullBadge: { fontSize: '0.55rem', color: "var(--accent)", border: '1px solid var(--accent)', background: 'var(--accent-soft)', padding: '2px 5px', borderRadius: '4px', fontWeight: 800 },
  stepImportOnlyBadge: { fontSize: '0.55rem', color: "var(--warning)", border: '1px solid rgba(233,189,69,0.4)', background: 'rgba(233,189,69,0.08)', padding: '2px 5px', borderRadius: '4px', fontWeight: 800 },
  stepTitleRow: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  stepLabel: { fontSize: '0.75rem', color: "var(--accent)", fontWeight: 'bold' },
  stepValue: { fontSize: '1rem', color: "var(--text-primary)" },
  stepDetailText: { color: "var(--text-muted)", fontSize: '0.85rem', marginTop: '0.3rem' },
  scrollArea: { minHeight: 0, flex: 1, overflow: 'hidden' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: '2rem', height: '100%', overflow: 'hidden' },
  analysisGridWithDock: { gridTemplateColumns: 'minmax(250px, 0.9fr) minmax(430px, 1.45fr) minmax(285px, 0.8fr)', gap: '1rem' },
  leftPanel: { minHeight: 280, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  rightPanel: { minHeight: 300, minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '10px', padding: '1.2rem', overflow: 'hidden' },
  filterArea: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem' },
  highRiskSelect: { flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: "var(--input-bg)", border: "1px solid var(--danger)", color: "var(--danger)", padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }, libLoadBtn: { padding: '0.6rem 1rem', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }, recBadge: { fontSize: '0.6rem', color: "var(--success)", border: "1px solid var(--success)", padding: '1px 4px', borderRadius: '3px' },
  rightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  riskScoreContainer: { display: 'flex', gap: '1rem', alignItems: 'center' },
  riskInputSet: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  miniLabel: { fontSize: '0.6rem', color: "var(--text-muted)" },
  miniSelect: { backgroundColor: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", padding: '2px 5px', borderRadius: '4px' },
  riskResultSelect: { width: '40px', height: '30px', color: "var(--on-accent)", border: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '30px' },
  riskMultiply: { color: "var(--text-muted)" },
  riskEqual: { color: "var(--text-muted)" },
  selectedListScroll: { flex: 1, overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', color: "var(--text-primary)" },
  th: { padding: '8px', borderBottom: "1px solid var(--border-default)", fontSize: '0.75rem', color: "var(--text-muted)", textAlign: 'left' },
  td: { padding: '8px', borderBottom: "1px solid var(--border-default)" },
  inlineInput: { width: '100%', backgroundColor: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-default)", padding: '0.5rem', borderRadius: '4px', resize: 'none', fontSize: '0.8rem' },
  controlActionRow: { flexWrap: 'wrap', display: 'flex', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' },
  controlSearchBtn: { backgroundColor: "var(--card-bg)", color: 'var(--warning)', border: '1px solid var(--warning)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer' },
  controlRecommendBtn: { backgroundColor: "var(--card-bg)", color: "var(--accent)", border: '1px solid var(--accent)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.58rem', cursor: 'pointer' },
  controlAdvancedBtn: { backgroundColor: "var(--card-bg)", color: "var(--success)", border: '1px solid rgba(76,175,80,0.55)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.58rem', cursor: 'pointer' },
  smallDeleteBtn: { backgroundColor: 'transparent', color: "var(--text-muted)", border: "1px solid var(--border-default)", cursor: 'pointer', borderRadius: '4px' },
  riskSourceRow: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', minWidth: 0 },
  riskSourceBadge: { flexShrink: 0, fontSize: '0.7rem', color: "var(--accent)", border: '1px solid var(--accent)', background: 'var(--accent-soft)', borderRadius: '3px', padding: '1px 4px', fontWeight: 800 },
  riskSourceText: { color: "var(--text-muted)", fontSize: '0.7rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  knowledgeDock: { display: 'flex', flexDirection: 'column', minWidth: 0, background: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '10px', padding: '10px', overflow: 'hidden' },
  knowledgeDockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', paddingBottom: '8px', borderBottom: "1px solid var(--border-default)" },
  knowledgeDockEyebrow: { color: "var(--accent)", fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.8px' },
  knowledgeDockTitle: { display: 'block', marginTop: '2px', color: "var(--text-primary)", fontSize: '0.8rem' },
  knowledgeCloseBtn: { width: '28px', height: '28px', background: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '5px', color: "var(--text-muted)", cursor: 'pointer' },
  knowledgeTabs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '8px' },
  knowledgeTab: { padding: '6px', background: "var(--card-bg)", color: "var(--text-muted)", border: "1px solid var(--border-default)", borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem' },
  knowledgeTabActive: { padding: '6px', background: 'var(--accent-soft)', color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800 },
  knowledgeNotice: { marginTop: '7px', padding: '6px 8px', borderRadius: '6px', background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.78rem', lineHeight: 1.35 },
  knowledgeSearchInput: { width: '100%', boxSizing: 'border-box', marginTop: '8px', padding: '7px 8px', background: "var(--input-bg)", border: "1px solid var(--border-default)", borderRadius: '5px', color: "var(--text-primary)", fontSize: '0.78rem', outline: 'none' },
  knowledgeScroll: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '8px' },
  knowledgeEmpty: { margin: 'auto', padding: '18px 8px', color: "var(--text-muted)", fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.45 },
  knowledgeCard: { padding: '9px', background: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '7px' },
  knowledgeCardHeader: { display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' },
  knowledgeCardTitle: { display: 'block', color: "var(--text-primary)", fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  knowledgeMeta: { marginTop: '3px', color: "var(--text-muted)", fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  knowledgeFavorite: { color: "var(--warning)", flexShrink: 0 },
  knowledgeDetail: { color: "var(--text-muted)", fontSize: '0.78rem', lineHeight: 1.35, margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  knowledgeRiskPreview: { display: 'flex', flexDirection: 'column', gap: '4px' },
  knowledgeRiskLine: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '5px', padding: '5px', background: "var(--card-bg)", borderRadius: '4px' },
  knowledgeHazardText: { color: 'var(--danger)', fontSize: '0.8rem', overflowWrap: 'anywhere' },
  knowledgeControlText: { color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  knowledgeRiskCopy: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  knowledgeRiskActions: { display: 'flex', justifyContent: 'flex-end', gap: '6px' },
  knowledgeMiniBtn: { padding: '5px 8px', color: 'var(--text-secondary)', background: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '4px', cursor: 'pointer', fontSize: '.75rem' },
  knowledgeMiniBtnActive: { padding: '5px 8px', color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: '4px', cursor: 'pointer', fontSize: '.75rem' },
  knowledgeActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '7px' },
  knowledgeSecondaryBtn: { padding: '6px', background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem' },
  knowledgePrimaryBtn: { padding: '6px', background: "var(--action-bg)", color: "var(--on-accent)", border: "1px solid var(--accent)", borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 800 },
  knowledgeProjectBtn: { width: '100%', padding: '9px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px', background: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '7px', cursor: 'pointer', textAlign: 'left' },
  knowledgeProjectTitle: { color: "var(--text-primary)", fontSize: '0.78rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
  knowledgeProjectMeta: { color: "var(--text-muted)", fontSize: '0.78rem' },
  knowledgeBackBtn: { background: 'transparent', color: "var(--accent)", border: 0, padding: '4px 0', cursor: 'pointer', fontSize: '0.78rem', textAlign: 'left' },
  knowledgeSelectedProject: { color: "var(--text-secondary)", fontSize: '0.78rem', fontWeight: 800, paddingBottom: '4px', borderBottom: "1px solid var(--border-default)" },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: "var(--text-muted)", border: "1px solid var(--border-default)", borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", fontWeight: '800', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' },
  footerArea: { width: '100%', padding: '1rem 5rem', zIndex: 10, position: 'absolute', bottom: 0, backgroundColor: 'transparent' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  label: { fontSize: '0.8rem', color: "var(--text-muted)", fontWeight: '700' },
  dialogOverlay: { position: 'fixed', inset: 0, backgroundColor: "var(--overlay)", display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  spinner: { width: '40px', height: '40px', border: "4px solid var(--border-default)", borderTop: "4px solid var(--accent)", borderRadius: '50%', animation: 'spin 1s linear infinite' },
  libModalContent: { backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '12px', padding: '2rem', width: '600px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: "var(--shadow-panel)" },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: "var(--text-primary)", borderBottom: "1px solid var(--border-default)", paddingBottom: '1rem' },
  closeBtnSmall: { backgroundColor: 'transparent', color: "var(--text-secondary)", border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  libList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  libItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: "var(--card-bg)", padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: "1px solid var(--border-default)" },
  libInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  libCategory: { fontSize: '0.7rem', color: "var(--accent)", fontWeight: 'bold' },
  libTitleText: { color: "var(--text-primary)", fontSize: '0.9rem' },
  emptyText: { color: "var(--text-muted)", textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' },
  backBtn: { backgroundColor: 'transparent', color: "var(--text-secondary)", border: 'none', textAlign: 'left', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.85rem' },
  libStepItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: "var(--card-bg)", padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: "1px dashed var(--border-default)" },
  stepInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  stepIdxBadge: { backgroundColor: "var(--surface-hover)", color: "var(--text-primary)", padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' },
  stepTitleText: { color: "var(--text-primary)", fontSize: '0.9rem' },
  stepPreview: { color: "var(--danger)", fontSize: '0.75rem', fontWeight: 'bold' },
  clipboardCopyBtn: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--border-default)",
    borderRadius: '4px',
    color: "var(--text-primary)",
    fontSize: '0.85rem',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: "var(--action-bg)",
      borderColor: "var(--accent)"
    }
  }
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-analysis-style";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @media (max-width: 1200px) {
      .analysis-grid.has-knowledge-dock {
        grid-template-columns: minmax(260px, .9fr) minmax(420px, 1.3fr) !important;
        overflow-y: auto !important;
      }
      .analysis-grid.has-knowledge-dock .knowledge-dock {
        grid-column: 1 / -1;
        min-height: 320px;
        max-height: 420px;
      }
    }
    @media (max-width: 1800px) {
      .analysis-workspace .analysis-ad { display: none !important; }
      .analysis-workspace .analysis-main { padding: 0 20px 80px !important; }
    }
    @media (max-height: 800px) {
      .analysis-workspace .analysis-card { height: calc(100vh - 160px) !important; padding: 18px !important; }
    }
  `;
}
