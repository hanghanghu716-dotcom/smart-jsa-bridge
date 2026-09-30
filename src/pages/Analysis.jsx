import { getDataLocale } from '../locales/config.js';
import React, { useState, useRef, useEffect } from 'react';
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

export default function Analysis() {
  const navigate = useLanguageNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const { t, i18n } = useTranslation(['analysis', 'tags']);
  const [isFastTrackModalOpen, setIsFastTrackModalOpen] = useState(false);

  const state = location.state || {};
  const shouldRecoverDraft = !state.formData && !state.analysisData;
  const { draft: recoveredDraft, status: recoveryStatus } = useJsaDraftRecovery(shouldRecoverDraft);
  const recoverySettled = !shouldRecoverDraft || ['ready', 'empty', 'error'].includes(recoveryStatus);

  const existingId = state.id ?? recoveredDraft?.source_project_id ?? null;
  const procedures = state.procedures || recoveredDraft?.procedures || [];
  const formData = state.formData || recoveredDraft?.form_data || {};
  const participants = state.participants || recoveredDraft?.participants || [];
  const incomingAnalysisData = state.analysisData || recoveredDraft?.analysis_data || [];

  const jsaType = formData.jsaType || '2-step';
  useEffect(() => {
    if (state.isFastTrack !== undefined) {
      localStorage.setItem('jsa_isFastTrack', JSON.stringify(state.isFastTrack));
    }
  }, [state.isFastTrack]);

  const isFastTrack = JSON.parse(localStorage.getItem('jsa_isFastTrack') || 'false');
  const [dbRisks, setDbRisks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analysisData, setAnalysisData] = useState(incomingAnalysisData || []);

  useEffect(() => {
    if (analysisData.length === 0 && incomingAnalysisData.length > 0) {
      setAnalysisData(incomingAnalysisData);
    }
  }, [incomingAnalysisData, analysisData.length]);

  const draftSave = useJsaDraftAutosave({
    enabled: recoverySettled && Boolean(
      formData?.projectName?.trim() || procedures.length || analysisData.length || state.draftId || recoveredDraft?.id
    ),
    stage: 'analysis',
    formData,
    participants,
    procedures,
    analysisData,
    sourceProjectId: state.parentId || recoveredDraft?.source_project_id || existingId || null,
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const autoFilledRef = useRef(new Set());

  const [recModal, setRecModal] = useState({
    isOpen: false,
    data: [],
    targetRiskId: null,
    type: 'advanced'
  });

  const toggleCheck = (rec) => {
    const newSet = new Set(checkedRisks);
    if (newSet.has(rec)) newSet.delete(rec);
    else newSet.add(rec);
    setCheckedRisks(newSet);
  };

  const handleBulkAdd = () => {
    if (checkedRisks.size === 0) return alert(t('alert.selectItem'));
    const newRisks = Array.from(checkedRisks).map((rec) => ({
      id: `risk-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      db_id: rec.id,
      factor: rec.risk_factor || rec.factor || "",
      measure: "",
      current_measure: "",
      recommend_measure: "",
      category: rec.category || t('base.etc'),
      source: rec.source || 'master'
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

  const handleOpenRecommendation = async (risk, type = 'advanced') => {
    if (type === 'current' && !risk.factor) return alert(t('alert.enterFactor'));
    if (type === 'advanced' && !risk.current_measure) return alert(t('alert.selectCurrentMeasure'));

    setIsLoading(true);
    let scored = [];

  const localeMap = {
      'ko': 'ko-KR', 'ko-KR': 'ko-KR', 
      'en-US': 'en-US', 'en-CA': 'en-CA', 'en-AU': 'en-AU', 'en-GB': 'en-GB', 
      'de': 'de-DE', 'de-DE': 'de-DE', 'ja': 'ja-JP', 'ja-JP': 'ja-JP', 
      'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'it': 'it-IT', 'it-IT': 'it-IT',
      'es': 'es-ES', 'es-ES': 'es-ES', 'ar': 'ar-SA', 'ar-SA': 'ar-SA', 
      'pt': 'pt-BR', 'pt-BR': 'pt-BR', 'ru': 'ru-RU', 'ru-RU': 'ru-RU'
    };
    const dbLocale = localeMap[getDataLocale(i18n.language)] || 'en-US';

    try {
      if (type === 'current') {
        if (!risk.db_id) {
          setIsLoading(false);
          return alert(t('alert.manualFactor'));
        }

        const { data: hazardTrans } = await supabase
          .from('Hazards_Translations')
          .select('id')
          .eq('hazard_id', risk.db_id);

        let hazardSearchIds = [risk.db_id];
        if (hazardTrans) {
          hazardSearchIds.push(...hazardTrans.map(t => t.id));
        }

        const { data: mapData } = await supabase
          .from('hazard_measure_mappings')
          .select('measure_translation_id, similarity_score')
          .in('hazard_translation_id', hazardSearchIds)
          .order('similarity_score', { ascending: false });

        if (mapData && mapData.length > 0) {
          const mappedIds = [...new Set(mapData.map(m => m.measure_translation_id))];
          const { data: transById } = await supabase.from('Current_Measures_Translations').select('id, measure_id').in('id', mappedIds);
          const { data: transByMaster } = await supabase.from('Current_Measures_Translations').select('id, measure_id').in('measure_id', mappedIds);

          const masterIdScoreMap = {};
          let masterIds = [];
          let directTransIds = [];

          for (const m of mapData) {
            const mId = m.measure_translation_id;
            const score = m.similarity_score;

            const foundById = transById?.find(t => t.id === mId);
            if (foundById) {
              if (foundById.measure_id) {
                masterIds.push(foundById.measure_id);
                if (!masterIdScoreMap[foundById.measure_id] || masterIdScoreMap[foundById.measure_id] < score) masterIdScoreMap[foundById.measure_id] = score;
              } else {
                directTransIds.push(mId);
                if (!masterIdScoreMap[mId] || masterIdScoreMap[mId] < score) masterIdScoreMap[mId] = score;
              }
            } else {
              const foundByMaster = transByMaster?.find(t => t.measure_id === mId);
              if (foundByMaster && foundByMaster.measure_id) {
                masterIds.push(foundByMaster.measure_id);
                if (!masterIdScoreMap[foundByMaster.measure_id] || masterIdScoreMap[foundByMaster.measure_id] < score) masterIdScoreMap[foundByMaster.measure_id] = score;
              }
            }
          }

          masterIds = [...new Set(masterIds)].filter(Boolean);
          directTransIds = [...new Set(directTransIds)].filter(Boolean);

          let finalMeasures = [];
          if (masterIds.length > 0) {
            const { data: masterMeasures } = await supabase.from('Current_Measures_Translations').select('*').in('measure_id', masterIds).eq('locale', dbLocale);
            if (masterMeasures) finalMeasures.push(...masterMeasures);
          }
          if (directTransIds.length > 0) {
            const { data: directMeasures } = await supabase.from('Current_Measures_Translations').select('*').in('id', directTransIds).eq('locale', dbLocale);
            if (directMeasures) finalMeasures.push(...directMeasures);
          }

          if (finalMeasures.length > 0) {
            const uniqueMeasuresMap = new Map();
            finalMeasures.forEach(trans => {
              const mapId = trans.measure_id || trans.id;
              if (!uniqueMeasuresMap.has(trans.id)) {
                uniqueMeasuresMap.set(trans.id, {
                  display: trans.measure_text,
                  measure_db_id: mapId,
                  similarity_score: masterIdScoreMap[mapId] || 0
                });
              }
            });
            scored = Array.from(uniqueMeasuresMap.values()).sort((a, b) => b.similarity_score - a.similarity_score);
          }
        }
      } else {
        if (!risk.current_measure_db_id) {
          setIsLoading(false);
          return alert(t('alert.needCurrentMeasure'));
        }

        const { data: currTrans } = await supabase.from('Current_Measures_Translations').select('id').eq('measure_id', risk.current_measure_db_id);
        let currSearchIds = [risk.current_measure_db_id];
        if (currTrans) {
          currSearchIds.push(...currTrans.map(t => t.id));
        }

        const { data: mapData } = await supabase
          .from('current_advanced_measure_mappings')
          .select('advanced_measure_translation_id, similarity_score')
          .in('current_measure_translation_id', currSearchIds)
          .order('similarity_score', { ascending: false });

        if (mapData && mapData.length > 0) {
          const mappedIds = [...new Set(mapData.map(m => m.advanced_measure_translation_id))];
          const { data: transById } = await supabase.from('Advanced_Measures_Translations').select('id, advanced_measure_id').in('id', mappedIds);
          const { data: transByMaster } = await supabase.from('Advanced_Measures_Translations').select('id, advanced_measure_id').in('advanced_measure_id', mappedIds);

          const masterIdScoreMap = {};
          let masterIds = [];
          let directTransIds = [];

          for (const m of mapData) {
            const mId = m.advanced_measure_translation_id;
            const score = m.similarity_score;

            const foundById = transById?.find(t => t.id === mId);
            if (foundById) {
              if (foundById.advanced_measure_id) {
                masterIds.push(foundById.advanced_measure_id);
                if (!masterIdScoreMap[foundById.advanced_measure_id] || masterIdScoreMap[foundById.advanced_measure_id] < score) masterIdScoreMap[foundById.advanced_measure_id] = score;
              } else {
                directTransIds.push(mId);
                if (!masterIdScoreMap[mId] || masterIdScoreMap[mId] < score) masterIdScoreMap[mId] = score;
              }
            } else {
              const foundByMaster = transByMaster?.find(t => t.advanced_measure_id === mId);
              if (foundByMaster && foundByMaster.advanced_measure_id) {
                masterIds.push(foundByMaster.advanced_measure_id);
                if (!masterIdScoreMap[foundByMaster.advanced_measure_id] || masterIdScoreMap[foundByMaster.advanced_measure_id] < score) masterIdScoreMap[foundByMaster.advanced_measure_id] = score;
              }
            }
          }

          masterIds = [...new Set(masterIds)].filter(Boolean);
          directTransIds = [...new Set(directTransIds)].filter(Boolean);

          let finalAdvMeasures = [];
          if (masterIds.length > 0) {
            const { data: masterMeasures } = await supabase.from('Advanced_Measures_Translations').select('*').in('advanced_measure_id', masterIds).eq('locale', dbLocale);
            if (masterMeasures) finalAdvMeasures.push(...masterMeasures);
          }
          if (directTransIds.length > 0) {
            const { data: directMeasures } = await supabase.from('Advanced_Measures_Translations').select('*').in('id', directTransIds).eq('locale', dbLocale);
            if (directMeasures) finalAdvMeasures.push(...directMeasures);
          }

          if (finalAdvMeasures.length > 0) {
            const uniqueAdvMap = new Map();
            finalAdvMeasures.forEach(trans => {
              const mapId = trans.advanced_measure_id || trans.id;
              if (!uniqueAdvMap.has(trans.id)) {
                uniqueAdvMap.set(trans.id, {
                  display: trans.solution_text,
                  advanced_db_id: mapId,
                  similarity_score: masterIdScoreMap[mapId] || 0
                });
              }
            });
            scored = Array.from(uniqueAdvMap.values()).sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 3);
          }
        }
      }
    } catch (err) {
      console.error("Critical Error in handleOpenRecommendation:", err);
    } finally {
      setIsLoading(false);
      if (scored.length === 0) return alert(t('alert.noData'));
      setRecModal({ isOpen: true, data: scored, targetRiskId: risk.id, type });
    }
  };

  const applyRecommendedMeasure = (item) => {
    if (jsaType === '2-step') {
      updateRiskField(recModal.targetRiskId, 'measure', item.display);
    } else if (recModal.type === 'current') {
      updateRiskField(recModal.targetRiskId, 'current_measure', item.display);
      updateRiskField(recModal.targetRiskId, 'current_measure_db_id', item.measure_db_id);
    } else {
      updateRiskField(recModal.targetRiskId, 'recommend_measure', item.display);
    }
    setRecModal({ isOpen: false, data: [], targetRiskId: null, type: 'advanced' });
  };

  const openMeasureSearch = (risk, type) => {
    setMeasureSearchModal({ isOpen: true, data: [], targetRiskId: risk.id, type });
    setMeasureSearchTerm("");
  };

  const executeMeasureSearch = async (term) => {
    if (!term.trim()) {
      setMeasureSearchModal(prev => ({ ...prev, data: [] }));
      return;
    }
    setIsSearchLoading(true);

  const localeMap = {
        'ko': 'ko-KR', 'ko-KR': 'ko-KR', 
        'en-US': 'en-US', 'en-CA': 'en-CA', 'en-AU': 'en-AU', 'en-GB': 'en-GB', 
        'de': 'de-DE', 'de-DE': 'de-DE', 'ja': 'ja-JP', 'ja-JP': 'ja-JP', 
        'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'it': 'it-IT', 'it-IT': 'it-IT',
        'es': 'es-ES', 'es-ES': 'es-ES', 'ar': 'ar-SA', 'ar-SA': 'ar-SA', 
        'pt': 'pt-BR', 'pt-BR': 'pt-BR', 'ru': 'ru-RU', 'ru-RU': 'ru-RU'
      };
      const dbLocale = localeMap[getDataLocale(i18n.language)] || 'en-US';

    let results = [];
    const tokens = term.trim().split(/\s+/).filter(t => t.length > 0);

    if (measureSearchModal.type === 'current') {
      let query = supabase
        .from('Current_Measures_Translations')
        .select('id, measure_id, measure_text')
        .eq('locale', dbLocale);

      tokens.forEach(token => {
        query = query.ilike('measure_text', `%${token}%`);
      });

      const { data, error } = await query.limit(30);
      if (!error && data) {
        results = data.map(d => ({ display: d.measure_text, db_id: d.measure_id || d.id }));
      }
    } else {
      let query = supabase
        .from('Advanced_Measures_Translations')
        .select('id, advanced_measure_id, solution_text')
        .eq('locale', dbLocale);

      tokens.forEach(token => {
        query = query.ilike('solution_text', `%${token}%`);
      });

      const { data, error } = await query.limit(30);
      if (!error && data) {
        results = data.map(d => ({ display: d.solution_text, db_id: d.advanced_measure_id || d.id }));
      }
    }

    setIsSearchLoading(false);
    setMeasureSearchModal(prev => ({ ...prev, data: results }));
  };

  const applySearchedMeasure = (item) => {
    if (jsaType === '2-step') {
      updateRiskField(measureSearchModal.targetRiskId, 'measure', item.display);
    } else if (measureSearchModal.type === 'current') {
      updateRiskField(measureSearchModal.targetRiskId, 'current_measure', item.display);
      updateRiskField(measureSearchModal.targetRiskId, 'current_measure_db_id', item.db_id);
    } else {
      updateRiskField(measureSearchModal.targetRiskId, 'recommend_measure', item.display);
    }

    setMeasureSearchModal({ isOpen: false, data: [], targetRiskId: null, type: 'current' });
    setMeasureSearchTerm("");
  };

  useEffect(() => {
    if (!measureSearchModal.isOpen) return;

    const delayDebounceFn = setTimeout(() => {
      executeMeasureSearch(measureSearchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [measureSearchTerm, measureSearchModal.isOpen, i18n.language]);

  const [isKnowledgeDockOpen, setIsKnowledgeDockOpen] = useState(false);
  const [knowledgeTab, setKnowledgeTab] = useState('steps');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [savedWorkSteps, setSavedWorkSteps] = useState([]);
  const [myLibraryItems, setMyLibraryItems] = useState([]);
  const [selectedLibProject, setSelectedLibProject] = useState(null);
  const [knowledgeNotice, setKnowledgeNotice] = useState('');

  useEffect(() => {
    const fetchHazards = async () => {
      setIsLoading(true);
      const localeMap = {
      'ko': 'ko-KR', 'ko-KR': 'ko-KR', 
      'en-US': 'en-US', 'en-CA': 'en-CA', 'en-AU': 'en-AU', 'en-GB': 'en-GB', 
      'de': 'de-DE', 'de-DE': 'de-DE', 'ja': 'ja-JP', 'ja-JP': 'ja-JP', 
      'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'it': 'it-IT', 'it-IT': 'it-IT',
      'es': 'es-ES', 'es-ES': 'es-ES', 'ar': 'ar-SA', 'ar-SA': 'ar-SA', 
      'pt': 'pt-BR', 'pt-BR': 'pt-BR', 'ru': 'ru-RU', 'ru-RU': 'ru-RU'
    };
    const dbLocale = localeMap[getDataLocale(i18n.language)] || 'en-US';
      setSelectedHighRisk("");

      const [{ data: origHazards, error: origErr }, { data: transHazards, error: transErr }] = await Promise.all([
        supabase.from('Hazards').select('*'),
        supabase.from('Hazards_Translations').select('*').eq('locale', dbLocale)
      ]);

      if (!origErr && !transErr && origHazards && transHazards) {
        const mappedData = transHazards.map(trans => {
          const orig = origHazards.find(o => o.id === trans.hazard_id) || {};
          return {
            ...orig,
            id: trans.hazard_id || trans.id,
            risk_factor: trans.hazard_name,
            category: trans.category || orig.category,
            source: 'master'
          };
        });
        // [정정 조치 완료] 함수 호출 구문을 명확하게 정정하여 무한 로딩 요인 제거
        setDbRisks(mappedData);
        const uniqueCats = [...new Set(mappedData.map(item => item.category))].filter(Boolean);
        setCategories(uniqueCats);
      }
      setIsLoading(false);
    };
    fetchHazards();
  }, [i18n.language]);

  const handleLogoClick = () => {
    if (window.confirm(t('alert.confirmMain'))) navigate('/');
  };

  const openKnowledgeDock = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert(t('alert.loginRequired'));

    setIsKnowledgeDockOpen(true);
    try {
      const [steps, favoritesRes, authoredRes] = await Promise.all([
        listWorkSteps({ limit: 100 }),
        supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id),
        supabase
          .from('jsa_projects')
          .select('id, title, tags, analysis_data, form_data, updated_at')
          .eq('author_id', user.id)
          .order('updated_at', { ascending: false })
      ]);

      const projectMap = new Map();
      (authoredRes.data || []).forEach(project => {
        projectMap.set(String(project.id), { id: `mine-${project.id}`, jsa_projects: project, libraryType: 'MY' });
      });
      (favoritesRes.data || []).forEach(item => {
        const project = item?.jsa_projects;
        if (project?.id && !projectMap.has(String(project.id))) {
          projectMap.set(String(project.id), { ...item, libraryType: 'SCRAP' });
        }
      });

      setSavedWorkSteps(steps || []);
      setMyLibraryItems(Array.from(projectMap.values()));
      setSelectedLibProject(null);
      setKnowledgeNotice('');
    } catch (error) {
      console.error('[Analysis Knowledge Dock] load failed:', error);
    }
  };

  const mergeStepData = (stepData, mode = 'full', sourceMeta = {}) => {
    const sourceRisks = Array.isArray(stepData?.risks) ? stepData.risks : [];
    if (!sourceRisks.length) {
      setKnowledgeNotice(t('knowledgeDock.noRisksToMerge'));
      return;
    }

    setAnalysisData(prev => {
      const newData = [...prev];
      const target = newData[activeIdx] || { proc: {}, risks: [], frequency: 1, severity: 1, riskLevel: 1 };
      const existingFactors = new Set(
        (target.risks || [])
          .map(risk => (risk.factor || '').trim().toLowerCase())
          .filter(Boolean)
      );
      const seenSourceFactors = new Set();

      const mappedRisks = sourceRisks
        .filter(risk => {
          const factor = (risk.factor || risk.risk_factor || '').trim().toLowerCase();
          if (!factor || existingFactors.has(factor) || seenSourceFactors.has(factor)) return false;
          seenSourceFactors.add(factor);
          return true;
        })
        .map(risk => {
          const isFull = mode === 'full';
          const twoStepMeasure = risk.measure || risk.recommend_measure || risk.current_measure || '';
          const threeStepCurrent = risk.current_measure || risk.measure || '';
          const threeStepRecommended = risk.recommend_measure || '';

          return {
            ...risk,
            id: `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            factor: risk.factor || risk.risk_factor || '',
            measure: isFull && jsaType === '2-step' ? twoStepMeasure : '',
            current_measure: isFull && jsaType === '3-step' ? threeStepCurrent : '',
            recommend_measure: isFull && jsaType === '3-step' ? threeStepRecommended : '',
            current_measure_db_id: isFull && jsaType === '3-step' ? risk.current_measure_db_id : undefined,
            category: risk.category || t('base.etc'),
            source: sourceMeta.type || 'library',
            sourceLabel: sourceMeta.label || '',
            sourceWorkStepId: sourceMeta.workStepId || null
          };
        });

      newData[activeIdx] = {
        ...target,
        risks: [...(target.risks || []), ...mappedRisks]
      };

      const skipped = Math.max(0, sourceRisks.length - mappedRisks.length);
      setKnowledgeNotice(t('knowledgeDock.mergeResult', {
        added: mappedRisks.length,
        skipped
      }));
      return newData;
    });
  };

  const mergeSingleRisk = (risk, mode = 'full', sourceMeta = {}) => {
    mergeStepData({ risks: [risk] }, mode, sourceMeta);
  };

  const filteredSavedWorkSteps = savedWorkSteps.filter(step => {
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

  const getRisksFromDBByTokens = async (title = "", detail = "") => {
    const combinedText = `${title} ${detail}`.trim();
    if (!combinedText) return [];
    const tokens = combinedText.split(/[\s,./]+/).filter(t => t.trim().length >= 2);
    const uniqueTokens = [...new Set(tokens.map(t => t.toLowerCase()))];
    let matchedRisks = [];
    const seenFactors = new Set();
    dbRisks.forEach(item => {
      const isMatched = item.keywords?.some(kw => uniqueTokens.some(token => token.includes(kw.toLowerCase())));
      if (isMatched && !seenFactors.has(item.risk_factor)) {
        matchedRisks.push({ ...item, source: 'master' });
        seenFactors.add(item.risk_factor);
      }
    });
    return matchedRisks;
  };

  useEffect(() => {
    if (procedures?.length > 0) {
      setAnalysisData(prevData => procedures.map((newProc, idx) => {
        const existingData = prevData.find(d => d.id === idx) || (incomingAnalysisData || []).find(d => d.id === idx);
        return existingData ? { ...existingData, proc: newProc } : { id: idx, proc: newProc, risks: [], frequency: 1, severity: 1, riskLevel: 1 };
      }));
    }
  }, [procedures, incomingAnalysisData]);

  const currentStep = analysisData[activeIdx] || { proc: {}, risks: [], frequency: 1, severity: 1, riskLevel: 1 };

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
        locale: i18n.language || 'en-US',
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

  useEffect(() => {
    const updateRecommendations = async () => {
      let matched = [];
      if (searchTerm) {
        const filtered = dbRisks.filter(r =>
          r.risk_factor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        matched = Array.from(new Map(filtered.map(item => [item.risk_factor, item])).values());
      } else if (selectedHighRisk) {
        const filtered = dbRisks.filter(r => r.category === selectedHighRisk);
        matched = Array.from(new Map(filtered.map(item => [item.risk_factor, item])).values());
      } else {
        const rawMatched = await getRisksFromDBByTokens(currentStep.proc?.stepTitle || "", currentStep.proc?.stepDetail || "");
        matched = Array.from(new Map(rawMatched.map(item => [item.risk_factor, item])).values());
      }
      setRecommendations(matched);
      setCheckedRisks(new Set());
    };
    updateRecommendations();
  }, [activeIdx, currentStep.proc, selectedHighRisk, searchTerm, dbRisks]);

  const addRisk = (rec) => {
    setAnalysisData(prev => {
      const newData = [...prev];
      newData[activeIdx] = {
        ...newData[activeIdx],
        risks: [...newData[activeIdx].risks, {
          id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          db_id: rec.id,
          factor: rec.risk_factor || rec.factor || "",
          measure: "", current_measure: "", recommend_measure: "",
          category: rec.category || t('base.etc'),
          source: rec.source || (rec.factor || rec.risk_factor ? 'master' : 'manual')
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
        risks: newData[activeIdx].risks.map(r => r.id === riskId ? { ...r, [field]: value } : r)
      };
      return newData;
    });
  };

  const updateStepRisk = (field, value) => {
    setAnalysisData(prev => {
      const newData = [...prev];
      const newFreq = field === 'frequency' ? parseInt(value) : newData[activeIdx].frequency;
      const newSev = field === 'severity' ? parseInt(value) : newData[activeIdx].severity;
      newData[activeIdx] = {
        ...newData[activeIdx],
        [field]: parseInt(value),
        riskLevel: newFreq * newSev
      };
      return newData;
    });
  };

  // [원상 복귀 완료] 사용자님의 고유 순수 오리지널 스텝 제어 로직 보존
  const handlePrev = () => {
    if (activeIdx === 0) navigate('/procedure', {
      state: { 
        ...location.state, // [핵심] 현재 가지고 있는 모든 state를 유지하여 전달
        id: existingId, 
        formData, 
        participants, 
        procedures, 
        analysisData 
      }
    });
    else setActiveIdx(activeIdx - 1);
  };

  return (
    <div style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} />
      {isLoading && <div style={styles.dialogOverlay}><div style={styles.spinner} /></div>}


      {recModal.isOpen && (
        <div style={styles.dialogOverlay} onClick={() => setRecModal({ ...recModal, isOpen: false })}>
          <div style={styles.libModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{recModal.type === 'current' ? t('recModal.titleCurrent') : t('recModal.titleAdvanced')}</h3>
              <button style={styles.closeBtnSmall} onClick={() => setRecModal({ ...recModal, isOpen: false })}>✕</button>
            </div>
            <div style={styles.libList}>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '10px' }}>
                {recModal.type === 'current' ? t('recModal.descCurrent') : t('recModal.descAdvanced')}
              </p>
              {recModal.data.map((item, idx) => (
                <div key={idx} style={styles.libItem} onClick={() => applyRecommendedMeasure(item)}>
                  <div style={{ ...styles.libInfo, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {item.similarity_score && (
                        <span style={{ color: '#007bff', marginRight: '8px', fontWight: 'bold' }}>
                          [{parseFloat(item.similarity_score * 100).toFixed(1)}%]
                        </span>
                      )}
                      {item.display}
                    </div>
                  </div>
                  <span style={{ marginLeft: '10px', color: '#007bff' }}>{t('recModal.selectBtn')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {measureSearchModal.isOpen && (
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
                onChange={(e) => setMeasureSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ ...styles.libList, height: '400px' }}>
              {isSearchLoading ? (
                <p style={styles.emptyText}>{t('base.searching', '검색 중...')}</p>
              ) : measureSearchTerm && measureSearchModal.data.length === 0 ? (
                <p style={styles.emptyText}>{t('base.emptyRec')}</p>
              ) : (
                measureSearchModal.data.map((item, idx) => (
                  <div key={idx} style={styles.libItem} onClick={() => applySearchedMeasure(item)}>
                    <div style={{ ...styles.libInfo, flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>{item.display}</div>
                    </div>
                    <span style={{ marginLeft: '10px', color: '#007bff' }}>{t('recModal.selectBtn')}</span>
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
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
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
                  style={idx === activeIdx ? styles.quickStepBtnActive : styles.quickStepBtn}
                  onClick={() => setActiveIdx(idx)}
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
                <section style={styles.leftPanel}>
                  <div style={styles.filterArea}>
                    <input
                      type="text"
                      placeholder={t('filter.searchPlaceholder') || "위험요소 검색..."}
                      style={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select style={styles.highRiskSelect} value={selectedHighRisk} onChange={(e) => { setSelectedHighRisk(e.target.value); setSearchTerm(""); }}>
                      <option value="">{t('filter.auto')}</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button style={styles.libLoadBtn} onClick={openKnowledgeDock}>
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
                      <button style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => addRisk({ factor: '', measure: '' })}>{t('base.addEmptyBtn')}</button>
                      <button style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleBulkAdd}>{t('base.addBulkBtn')}</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
                    {recommendations.length === 0 ? (
                      <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0', fontSize: '0.8rem' }}>{t('base.emptyRec')}</p>
                    ) : (
                      recommendations.map((rec, i) => (
                        <label key={`rec-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#161616', border: checkedRisks.has(rec) ? '1px solid #007bff' : '1px solid #333', borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={checkedRisks.has(rec)} onChange={() => toggleCheck(rec)} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{rec.risk_factor || rec.factor}</div>
                          </div>
                          <div style={styles.recBadge}>{rec.category || t('base.etc')}</div>
                        </label>
                      ))
                    )}
                  </div>
                </section>

                <section style={styles.rightPanel}>
                  <div style={styles.rightHeader}>
                    <span style={styles.label}>{t('result.label')} ({currentStep.risks.length})</span>
                    <div style={styles.riskScoreContainer}>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>{t('result.freq')}</span><select style={styles.miniSelect} value={currentStep.frequency} onChange={(e) => updateStepRisk('frequency', e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskMultiply}>×</div>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>{t('result.sev')}</span><select style={styles.miniSelect} value={currentStep.severity} onChange={(e) => updateStepRisk('severity', e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskEqual}>=</div>
                      <div style={{ ...styles.riskResultSelect, backgroundColor: currentStep.riskLevel >= 9 ? '#ff4d4d' : '#007bff' }}>{currentStep.riskLevel}</div>
                    </div>
                  </div>

                  <div style={styles.selectedListScroll}>
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
                                    <button style={styles.controlRecommendBtn} onClick={() => handleOpenRecommendation(r, 'current')}>
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
                                      <button style={styles.controlRecommendBtn} onClick={() => handleOpenRecommendation(r, 'current')}>
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
                                      <button style={styles.controlAdvancedBtn} onClick={() => handleOpenRecommendation(r, 'advanced')}>
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
                  </div>
                </section>

                {isKnowledgeDockOpen && (
                  <aside className="knowledge-dock" style={styles.knowledgeDock}>
                    <div style={styles.knowledgeDockHeader}>
                      <div>
                        <div style={styles.knowledgeDockEyebrow}>{t('knowledgeDock.eyebrow')}</div>
                        <strong style={styles.knowledgeDockTitle}>{t('knowledgeDock.title')}</strong>
                      </div>
                      <button type="button" style={styles.knowledgeCloseBtn} onClick={() => setIsKnowledgeDockOpen(false)}>×</button>
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
                      style={styles.knowledgeSearchInput}
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      placeholder={t('knowledgeDock.search')}
                    />

                    {knowledgeNotice && (
                      <div style={styles.knowledgeNotice}>{knowledgeNotice}</div>
                    )}

                    <div style={styles.knowledgeScroll}>
                      {knowledgeTab === 'steps' ? (
                        filteredSavedWorkSteps.length === 0 ? (
                          <div style={styles.knowledgeEmpty}>{t('knowledgeDock.emptySteps')}</div>
                        ) : filteredSavedWorkSteps.map(step => {
                          const stepData = step.analysis_data || {};
                          const risks = Array.isArray(stepData.risks) ? stepData.risks : [];
                          return (
                            <article key={step.id} style={styles.knowledgeCard}>
                              <div style={styles.knowledgeCardHeader}>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={styles.knowledgeCardTitle}>{step.title}</strong>
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
                                      <span style={styles.knowledgeHazardText}>{risk.factor || risk.risk_factor || '-'}</span>
                                      <span style={styles.knowledgeControlText}>
                                        {risk.measure || risk.current_measure || risk.recommend_measure || t('knowledgeDock.noControl')}
                                      </span>
                                    </div>
                                    <div style={styles.knowledgeRiskActions}>
                                      <button
                                        type="button"
                                        style={styles.knowledgeMiniBtn}
                                        onClick={() => mergeSingleRisk(risk, 'hazards', {
                                          type: 'work-step',
                                          label: step.title,
                                          workStepId: step.id
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
                                          workStepId: step.id
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
                                    workStepId: step.id
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
                                    workStepId: step.id
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
                          <div style={styles.knowledgeEmpty}>{t('knowledgeDock.emptyProjects')}</div>
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
                          {(selectedLibProject.analysis_data || [])
                            .filter(step => {
                              const q = knowledgeSearch.trim().toLowerCase();
                              if (!q) return true;
                              return [
                                step?.proc?.stepTitle,
                                step?.proc?.stepDetail,
                                ...(step?.risks || []).flatMap(risk => [
                                  risk?.factor,
                                  risk?.risk_factor,
                                  risk?.measure,
                                  risk?.current_measure,
                                  risk?.recommend_measure
                                ])
                              ].filter(Boolean).join(' ').toLowerCase().includes(q);
                            })
                            .map((step, idx) => (
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
                                <p style={styles.knowledgeDetail}>{step.proc?.stepDetail || '-'}</p>
                                <div style={styles.knowledgeRiskPreview}>
                                  {(step.risks || []).map((risk, riskIdx) => (
                                    <div key={risk.id || riskIdx} style={styles.knowledgeRiskLine}>
                                      <div style={styles.knowledgeRiskCopy}>
                                        <span style={styles.knowledgeHazardText}>{risk.factor || risk.risk_factor || '-'}</span>
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
                                            label: selectedLibProject.title
                                          })}
                                        >
                                          {t('knowledgeDock.mergeOneHazard')}
                                        </button>
                                        <button
                                          type="button"
                                          style={styles.knowledgeMiniBtnActive}
                                          onClick={() => mergeSingleRisk(risk, 'full', {
                                            type: 'project',
                                            label: selectedLibProject.title
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
                                      label: selectedLibProject.title
                                    })}
                                  >
                                    {t('knowledgeDock.mergeHazards')}
                                  </button>
                                  <button
                                    type="button"
                                    style={styles.knowledgePrimaryBtn}
                                    onClick={() => mergeStepData(step, 'full', {
                                      type: 'project',
                                      label: selectedLibProject.title
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
              <div style={styles.dialogOverlay} onClick={() => setIsFastTrackModalOpen(false)}>
                <div style={{ ...styles.libModalContent, width: '750px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
                  <div style={styles.modalHeader}>
                    <h3 style={{ margin: 0, color: '#007bff' }}>⚡ {t('fastTrackModal.title', '초고속 텍스트 복사 툴킷')}</h3>
                    <button style={styles.closeBtnSmall} onClick={() => setIsFastTrackModalOpen(false)}>✕</button>
                  </div>
                  
                  <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                    {t('fastTrackModal.desc', '작성된 위험성평가 본문 데이터입니다. 우측 상단의 복사 버튼을 눌러 소중한 서식에 자유롭게 붙여넣으십시오.')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>


                  {analysisData.map((step, sIdx) => (
                    <div key={sIdx} style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.8rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
                        STEP {String(sIdx + 1).padStart(2, '0')}: {step.proc?.stepTitle}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {step.risks?.map((r, rIdx) => (
                          <div key={r.id || rIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', position: 'relative' }}>
                            <div style={{ backgroundColor: '#1d1d1d', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                              <span style={{ fontSize: '0.65rem', color: '#ff4d4d', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('fastTrackModal.hazardFactor')}</span>
                              <div style={{ color: '#eee', fontSize: '0.85rem', paddingRight: '45px', whiteSpace: 'pre-wrap' }}>{r.factor}</div>
                              <button style={styles.clipboardCopyBtn} onClick={() => { navigator.clipboard.writeText(r.factor); alert(t('fastTrackModal.copied')); }} title="Copy Hazard">📋</button>
                            </div>
                            <div style={{ backgroundColor: '#1d1d1d', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '10px', position: 'relative' }}>
                              <span style={{ fontSize: '0.65rem', color: '#007bff', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('fastTrackModal.safetyMeasure')}</span>
                              <div style={{ color: '#eee', fontSize: '0.85rem', paddingRight: '45px', whiteSpace: 'pre-wrap' }}>{r.measure || r.current_measure}</div>
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
                    {t('fastTrackModal.goHome', '복사 완료 후 홈으로 이동')}
                  </button>
                  


                  
                </div>
              </div>
            )}

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{activeIdx === 0 ? t('btn.prevStep1') : t('btn.prevStep2')}</button>
              <button 
                style={styles.nextBtn} 
                onClick={() => {
                  if (activeIdx < analysisData.length - 1) {
                    setActiveIdx(activeIdx + 1);
                  } else {
                    if (isFastTrack) {
                      setIsFastTrackModalOpen(true);
                    } else {
                      navigate('/layout-module', {
                        state: {
                          existingId, analysisData, formData, participants, procedures,
                          isFork: location.state?.isFork, parentId: location.state?.parentId, originalAnalysisData: location.state?.originalAnalysisData
                        }
                      });
                    }
                  }
                }}
              >
                {activeIdx === analysisData.length - 1 ? (isFastTrack ? t('btn.fastTrackComplete', '분석 완료 및 텍스트 복사') : t('btn.nextComplete')) : t('btn.nextStep')}
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
  searchInput: { flex: 1.2, minWidth: 0, backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }, wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10, position: 'relative' },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { flex: 1, display: 'flex', padding: '0 5rem 80px', zIndex: 10, overflow: 'hidden', gap: '3rem' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '80vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', overflow: 'hidden' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.6rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepBadgeActive: { width: '20px', height: '20px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff' },
  stepBadgeDone: { width: '20px', height: '20px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepTextActive: { fontSize: '0.8rem', color: '#fff', fontWeight: '700' },
  stepTextDone: { fontSize: '0.8rem', color: '#4caf50', fontWeight: '700' },
  stepLineActive: { width: '20px', height: '1.5px', backgroundColor: '#4caf50' },
  stepLine: { width: '20px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.3 },
  stepBadge: { width: '20px', height: '20px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.75rem' },
  stepText: { fontSize: '0.8rem', color: '#aaa' },
  formHeader: { borderLeft: '5px solid #007bff', paddingLeft: '1rem', marginBottom: '0.8rem' },
  quickStepNav: { display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 0 0.8rem', marginBottom: '0.3rem', flexShrink: 0 },
  quickStepBtn: { minWidth: '110px', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', border: '1px solid #2b2b2b', borderRadius: '6px', background: '#111', color: '#666', cursor: 'pointer', fontSize: '0.65rem' },
  quickStepBtnActive: { minWidth: '110px', maxWidth: '180px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', border: '1px solid #007bff', borderRadius: '6px', background: 'rgba(0,123,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '0.65rem' },
  quickStepNo: { width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#242424', color: '#aaa', flexShrink: 0, fontWeight: 900 },
  quickStepTitle: { flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'left' },
  quickStepRiskCount: { flexShrink: 0, minWidth: '18px', padding: '1px 4px', borderRadius: '8px', background: '#242424', color: '#888', fontSize: '0.55rem', textAlign: 'center' },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' },
  formTitle: { fontSize: '1.4rem', color: '#fff', fontWeight: '800', margin: 0 },
  stepCountBadge: { backgroundColor: '#333', color: '#aaa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' },
  stepContext: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '6px' },
  stepOriginRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' },
  stepOriginBadge: { fontSize: '0.55rem', color: '#64adff', border: '1px solid rgba(0,123,255,0.35)', background: 'rgba(0,123,255,0.08)', padding: '2px 5px', borderRadius: '4px' },
  stepImportFullBadge: { fontSize: '0.55rem', color: '#64adff', border: '1px solid rgba(0,123,255,0.45)', background: 'rgba(0,123,255,0.12)', padding: '2px 5px', borderRadius: '4px', fontWeight: 800 },
  stepImportOnlyBadge: { fontSize: '0.55rem', color: '#e9bd45', border: '1px solid rgba(233,189,69,0.4)', background: 'rgba(233,189,69,0.08)', padding: '2px 5px', borderRadius: '4px', fontWeight: 800 },
  stepTitleRow: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  stepLabel: { fontSize: '0.75rem', color: '#007bff', fontWeight: 'bold' },
  stepValue: { fontSize: '1rem', color: '#fff' },
  stepDetailText: { color: '#888', fontSize: '0.85rem', marginTop: '0.3rem' },
  scrollArea: { flex: 1, overflow: 'hidden' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: '2rem', height: '100%', overflow: 'hidden' },
  analysisGridWithDock: { gridTemplateColumns: 'minmax(250px, 0.9fr) minmax(430px, 1.45fr) minmax(285px, 0.8fr)', gap: '1rem' },
  leftPanel: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  rightPanel: { display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '1.2rem', overflow: 'hidden' },
  filterArea: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' },
  highRiskSelect: { flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: '#1a1a1a', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' }, libLoadBtn: { padding: '0.6rem 1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }, recBadge: { fontSize: '0.6rem', color: '#4caf50', border: '1px solid #4caf50', padding: '1px 4px', borderRadius: '3px' },
  rightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  riskScoreContainer: { display: 'flex', gap: '1rem', alignItems: 'center' },
  riskInputSet: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  miniLabel: { fontSize: '0.6rem', color: '#666' },
  miniSelect: { backgroundColor: '#111', color: '#fff', border: '1px solid #444', padding: '2px 5px', borderRadius: '4px' },
  riskResultSelect: { width: '40px', height: '30px', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', lineHeight: '30px' },
  riskMultiply: { color: '#444' },
  riskEqual: { color: '#444' },
  selectedListScroll: { flex: 1, overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#fff' },
  th: { padding: '8px', borderBottom: '1px solid #333', fontSize: '0.75rem', color: '#888', textAlign: 'left' },
  td: { padding: '8px', borderBottom: '1px solid #1a1a1a' },
  inlineInput: { width: '100%', backgroundColor: '#111', color: '#ddd', border: '1px solid #222', padding: '0.5rem', borderRadius: '4px', resize: 'none', fontSize: '0.8rem' },
  controlActionRow: { display: 'flex', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' },
  controlSearchBtn: { backgroundColor: '#191919', color: '#ffb04d', border: '1px solid rgba(255,152,0,0.55)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.58rem', cursor: 'pointer' },
  controlRecommendBtn: { backgroundColor: '#191919', color: '#64adff', border: '1px solid rgba(0,123,255,0.55)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.58rem', cursor: 'pointer' },
  controlAdvancedBtn: { backgroundColor: '#191919', color: '#65c96b', border: '1px solid rgba(76,175,80,0.55)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.58rem', cursor: 'pointer' },
  smallDeleteBtn: { backgroundColor: 'transparent', color: '#444', border: '1px solid #333', cursor: 'pointer', borderRadius: '4px' },
  riskSourceRow: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', minWidth: 0 },
  riskSourceBadge: { flexShrink: 0, fontSize: '0.52rem', color: '#64adff', border: '1px solid rgba(0,123,255,0.35)', background: 'rgba(0,123,255,0.08)', borderRadius: '3px', padding: '1px 4px', fontWeight: 800 },
  riskSourceText: { color: '#555', fontSize: '0.55rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  knowledgeDock: { display: 'flex', flexDirection: 'column', minWidth: 0, background: '#0d0d0d', border: '1px solid #292929', borderRadius: '10px', padding: '10px', overflow: 'hidden' },
  knowledgeDockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #242424' },
  knowledgeDockEyebrow: { color: '#007bff', fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.8px' },
  knowledgeDockTitle: { display: 'block', marginTop: '2px', color: '#eee', fontSize: '0.8rem' },
  knowledgeCloseBtn: { width: '28px', height: '28px', background: '#151515', border: '1px solid #303030', borderRadius: '5px', color: '#777', cursor: 'pointer' },
  knowledgeTabs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '8px' },
  knowledgeTab: { padding: '6px', background: '#141414', color: '#666', border: '1px solid #292929', borderRadius: '5px', cursor: 'pointer', fontSize: '0.6rem' },
  knowledgeTabActive: { padding: '6px', background: 'rgba(0,123,255,0.1)', color: '#64adff', border: '1px solid #007bff', borderRadius: '5px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800 },
  knowledgeNotice: { marginTop: '7px', padding: '6px 8px', borderRadius: '6px', background: 'rgba(0,123,255,0.08)', border: '1px solid rgba(0,123,255,0.22)', color: '#78b7ff', fontSize: '0.58rem', lineHeight: 1.35 },
  knowledgeSearchInput: { width: '100%', boxSizing: 'border-box', marginTop: '8px', padding: '7px 8px', background: '#151515', border: '1px solid #2d2d2d', borderRadius: '5px', color: '#fff', fontSize: '0.65rem', outline: 'none' },
  knowledgeScroll: { flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '8px' },
  knowledgeEmpty: { margin: 'auto', padding: '18px 8px', color: '#555', fontSize: '0.68rem', textAlign: 'center', lineHeight: 1.45 },
  knowledgeCard: { padding: '9px', background: '#151515', border: '1px solid #292929', borderRadius: '7px' },
  knowledgeCardHeader: { display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' },
  knowledgeCardTitle: { display: 'block', color: '#eee', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  knowledgeMeta: { marginTop: '3px', color: '#555', fontSize: '0.55rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  knowledgeFavorite: { color: '#e9bd45', flexShrink: 0 },
  knowledgeDetail: { color: '#777', fontSize: '0.6rem', lineHeight: 1.35, margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  knowledgeRiskPreview: { display: 'flex', flexDirection: 'column', gap: '4px' },
  knowledgeRiskLine: { display: 'grid', gridTemplateColumns: '0.8fr 1fr', gap: '5px', padding: '5px', background: '#101010', borderRadius: '4px' },
  knowledgeHazardText: { color: '#ff8b8b', fontSize: '0.56rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  knowledgeControlText: { color: '#7fb5ff', fontSize: '0.56rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  knowledgeActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '7px' },
  knowledgeSecondaryBtn: { padding: '6px', background: '#171717', color: '#aaa', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer', fontSize: '0.58rem' },
  knowledgePrimaryBtn: { padding: '6px', background: '#007bff', color: '#fff', border: '1px solid #007bff', borderRadius: '5px', cursor: 'pointer', fontSize: '0.58rem', fontWeight: 800 },
  knowledgeProjectBtn: { width: '100%', padding: '9px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px', background: '#151515', border: '1px solid #292929', borderRadius: '7px', cursor: 'pointer', textAlign: 'left' },
  knowledgeProjectTitle: { color: '#eee', fontSize: '0.7rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
  knowledgeProjectMeta: { color: '#555', fontSize: '0.56rem' },
  knowledgeBackBtn: { background: 'transparent', color: '#64adff', border: 0, padding: '4px 0', cursor: 'pointer', fontSize: '0.62rem', textAlign: 'left' },
  knowledgeSelectedProject: { color: '#aaa', fontSize: '0.65rem', fontWeight: 800, paddingBottom: '4px', borderBottom: '1px solid #252525' },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' },
  footerArea: { width: '100%', padding: '1rem 5rem', zIndex: 10, position: 'absolute', bottom: 0, backgroundColor: 'transparent' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  label: { fontSize: '0.8rem', color: '#888', fontWeight: '700' },
  dialogOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  spinner: { width: '40px', height: '40px', border: '4px solid #333', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  libModalContent: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '2rem', width: '600px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '1rem' },
  closeBtnSmall: { backgroundColor: 'transparent', color: '#aaa', border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  libList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  libItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333' },
  libInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  libCategory: { fontSize: '0.7rem', color: '#007bff', fontWeight: 'bold' },
  libTitleText: { color: '#fff', fontSize: '0.9rem' },
  emptyText: { color: '#888', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' },
  backBtn: { backgroundColor: 'transparent', color: '#aaa', border: 'none', textAlign: 'left', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.85rem' },
  libStepItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '1rem', borderRadius: '8px', cursor: 'pointer', border: '1px dashed #444' },
  stepInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  stepIdxBadge: { backgroundColor: '#333', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' },
  stepTitleText: { color: '#fff', fontSize: '0.9rem' },
  stepPreview: { color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 'bold' },
  clipboardCopyBtn: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.85rem',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: '#007bff',
      borderColor: '#007bff'
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
    @media (max-width: 1500px) {
      .analysis-grid.has-knowledge-dock {
        grid-template-columns: minmax(260px, .9fr) minmax(420px, 1.3fr) !important;
        overflow-y: auto !important;
      }
      .analysis-grid.has-knowledge-dock .knowledge-dock {
        grid-column: 1 / -1;
        min-height: 220px;
        max-height: 260px;
      }
    }
  `;
}