import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; 
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; 
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage';

export default function Analysis() {
  const navigate = useLanguageNavigate(); 
  const location = useLocation();
  const scrollRef = useRef(null);
  const { t, i18n } = useTranslation(['analysis', 'tags']);

  const { 
    id: existingId = null, 
    procedures = [], 
    formData = {}, 
    participants = [], 
    analysisData: incomingAnalysisData 
  } = location.state || {};
  
  const jsaType = formData.jsaType || '2-step';

  const [dbRisks, setDbRisks] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [analysisData, setAnalysisData] = useState(incomingAnalysisData || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHighRisk, setSelectedHighRisk] = useState(""); 
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
      category: rec.category || t('base.etc')
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
      'ko': 'ko-KR', 'ko-KR': 'ko-KR', 'en-US': 'en-US', 'en-AU': 'en-AU',
      'en-GB': 'en-GB', 'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'de': 'de-DE', 'de-DE': 'de-DE'
    };
    const dbLocale = localeMap[i18n.language] || 'en-US';

    if (type === 'current') {
      if (!risk.db_id) {
          setIsLoading(false);
          return alert(t('alert.manualFactor'));
      }
      
      const { data: origData, error: origError } = await supabase
        .from('Current_Measures')
        .select('id, priority_score')
        .eq('hazard_id', risk.db_id)
        .order('priority_score', { ascending: false });

      if (!origError && origData && origData.length > 0) {
        const measureIds = origData.map(m => m.id);
        const { data: transData, error: transError } = await supabase
          .from('Current_Measures_Translations')
          .select('measure_id, measure_text')
          .in('measure_id', measureIds)
          .eq('locale', dbLocale);

        if (!transError && transData) {
          scored = origData.map(orig => {
            const trans = transData.find(t => t.measure_id === orig.id);
            return trans ? { display: trans.measure_text, measure_db_id: orig.id } : null;
          }).filter(Boolean);
        }
      }
    } else {
      if (!risk.current_measure_db_id) {
          setIsLoading(false);
          return alert(t('alert.needCurrentMeasure'));
      }

      const { data: origData, error: origError } = await supabase
        .from('Advanced_Measures')
        .select('id')
        .eq('measure_id', risk.current_measure_db_id);
        
      if (!origError && origData && origData.length > 0) {
        const advIds = origData.map(m => m.id);
        const { data: transData, error: transError } = await supabase
          .from('Advanced_Measures_Translations')
          .select('advanced_measure_id, solution_text')
          .in('advanced_measure_id', advIds)
          .eq('locale', dbLocale);

        if (!transError && transData) {
          scored = origData.map(orig => {
            const trans = transData.find(t => t.advanced_measure_id === orig.id);
            return trans ? { display: trans.solution_text, advanced_db_id: orig.id } : null;
          }).filter(Boolean);
        }
      }
    }

    setIsLoading(false);
    if (scored.length === 0) return alert(t('alert.noData'));
    setRecModal({ isOpen: true, data: scored, targetRiskId: risk.id, type });
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

// 👇 [기능 추가] 대책 검색창 열기, DB 검색, 검색된 대책 적용 함수
  const openMeasureSearch = (risk, type) => {
    setMeasureSearchModal({ isOpen: true, data: [], targetRiskId: risk.id, type });
    setMeasureSearchTerm("");
  };

  const executeMeasureSearch = async (term) => {
    if (!term.trim()) {
      setMeasureSearchModal(prev => ({ ...prev, data: [] }));
      return;
    }
    setIsSearchLoading(true); // ✅ 해결: 모달 내부 전용 로딩 상태로 변경

    const localeMap = {
      'ko': 'ko-KR', 'ko-KR': 'ko-KR', 'en-US': 'en-US', 'en-AU': 'en-AU',
      'en-GB': 'en-GB', 'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'de': 'de-DE', 'de-DE': 'de-DE'
    };
    const dbLocale = localeMap[i18n.language] || 'en-US';

    let results = [];
    if (measureSearchModal.type === 'current') {
      const { data, error } = await supabase
        .from('Current_Measures_Translations')
        .select('measure_id, measure_text')
        .eq('locale', dbLocale)
        .ilike('measure_text', `%${term}%`)
        .limit(30);
      if (!error && data) {
        results = data.map(d => ({ display: d.measure_text, db_id: d.measure_id }));
      }
    } else {
      const { data, error } = await supabase
        .from('Advanced_Measures_Translations')
        .select('advanced_measure_id, solution_text')
        .eq('locale', dbLocale)
        .ilike('solution_text', `%${term}%`)
        .limit(30);
      if (!error && data) {
        results = data.map(d => ({ display: d.solution_text, db_id: d.advanced_measure_id }));
      }
    }

  setIsSearchLoading(false);
    setMeasureSearchModal(prev => ({ ...prev, data: results }));
  };

  // 👇 [기능 추가] 검색된 대책 클릭 시 해당 Risk 필드에 값 입력 및 모달 종료
  const applySearchedMeasure = (item) => {
    if (jsaType === '2-step') {
      updateRiskField(measureSearchModal.targetRiskId, 'measure', item.display);
    } else if (measureSearchModal.type === 'current') {
      updateRiskField(measureSearchModal.targetRiskId, 'current_measure', item.display);
      updateRiskField(measureSearchModal.targetRiskId, 'current_measure_db_id', item.db_id);
    } else {
      updateRiskField(measureSearchModal.targetRiskId, 'recommend_measure', item.display);
    }
    
    // 모달 상태 및 검색어 초기화
    setMeasureSearchModal({ isOpen: false, data: [], targetRiskId: null, type: 'current' });
    setMeasureSearchTerm("");
  };

  // ✅ 실시간 타이핑 감지 및 디바운스(0.3초 대기 후 검색 실행) 로직
  useEffect(() => {
    if (!measureSearchModal.isOpen) return;
    
    const delayDebounceFn = setTimeout(() => {
      executeMeasureSearch(measureSearchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [measureSearchTerm, measureSearchModal.isOpen, i18n.language]);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);


  const [myLibraryItems, setMyLibraryItems] = useState([]);
  const [selectedLibProject, setSelectedLibProject] = useState(null);

  useEffect(() => {
    const fetchHazards = async () => {
      setIsLoading(true);
      const localeMap = {
        'ko': 'ko-KR', 'ko-KR': 'ko-KR', 'en-US': 'en-US', 'en-AU': 'en-AU',
        'en-GB': 'en-GB', 'fr': 'fr-FR', 'fr-FR': 'fr-FR', 'de': 'de-DE', 'de-DE': 'de-DE'
      };
      const dbLocale = localeMap[i18n.language] || 'en-US';
      setSelectedHighRisk("");

      const [ { data: origHazards, error: origErr }, { data: transHazards, error: transErr } ] = await Promise.all([
        supabase.from('Hazards').select('*'),
        supabase.from('Hazards_Translations').select('*').eq('locale', dbLocale)
      ]);

      if (!origErr && !transErr && origHazards && transHazards) {
        const mappedData = transHazards.map(trans => {
          const orig = origHazards.find(o => o.id === trans.hazard_id) || {};
          return {
            ...orig, 
            id: trans.hazard_id, 
            risk_factor: trans.hazard_name,
            category: trans.category || orig.category,
            source: 'master'
          };
        });
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

  const fetchMyLibrary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert(t('alert.loginRequired'));
    const { data } = await supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id);
    setMyLibraryItems(data || []);
    setSelectedLibProject(null);
    setIsLibraryModalOpen(true);
  };

  const applyStepData = (stepData) => {
    const mappedRisks = stepData.risks.map(r => ({
      id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      factor: r.factor || r.risk_factor,
      measure: "", current_measure: "", recommend_measure: "",
      category: r.category || t('base.etc'),
      source: '공유'
    }));
    
    setAnalysisData(prev => {
      const newData = [...prev];
      newData[activeIdx] = { ...newData[activeIdx], risks: [...newData[activeIdx].risks, ...mappedRisks] };
      return newData;
    });
    setIsLibraryModalOpen(false);
  };

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

  // ✅ [수정] 검색어, 카테고리, 자동 추천 로직 통합
  useEffect(() => {
    const updateRecommendations = async () => {
      let matched = [];
      if (searchTerm) {
        // 검색어가 있을 경우: 전체 DB에서 검색
        const filtered = dbRisks.filter(r => 
          r.risk_factor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        matched = Array.from(new Map(filtered.map(item => [item.risk_factor, item])).values());
      } else if (selectedHighRisk) {
        // 카테고리가 선택되었을 경우
        const filtered = dbRisks.filter(r => r.category === selectedHighRisk);
        matched = Array.from(new Map(filtered.map(item => [item.risk_factor, item])).values());
      } else {
        // 기본 상태: 자동 추천 (토큰 기반)
        const rawMatched = await getRisksFromDBByTokens(currentStep.proc?.stepTitle || "", currentStep.proc?.stepDetail || "");
        matched = Array.from(new Map(rawMatched.map(item => [item.risk_factor, item])).values());
      }
      setRecommendations(matched);
      setCheckedRisks(new Set()); 
    };
    updateRecommendations();
  }, [activeIdx, currentStep.proc, selectedHighRisk, searchTerm, dbRisks]); // ✅ searchTerm 의존성 추가

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
          category: rec.category || t('base.etc') 
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

  const handlePrev = () => {
    if (activeIdx === 0) navigate('/procedure', { 
      state: { id: existingId, formData, participants, procedures, analysisData,
        isFork: location.state?.isFork, parentId: location.state?.parentId, 
        originalAnalysisData: location.state?.originalAnalysisData } 
    });
    else setActiveIdx(activeIdx - 1);
  };

  return (
    <div style={styles.wrapper}>
      <SEO />
      {isLoading && <div style={styles.dialogOverlay}><div style={styles.spinner} /></div>}
      
      {isLibraryModalOpen && (
        <div style={styles.dialogOverlay} onClick={() => setIsLibraryModalOpen(false)}>
          <div style={styles.libModalContent} onClick={e => e.stopPropagation()}>

            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{t('libModal.title')}</h3>
              <button style={styles.closeBtnSmall} onClick={() => setIsLibraryModalOpen(false)}>✕</button>
            </div>
            <div style={styles.libList}>
              {!selectedLibProject ? (
                myLibraryItems.length === 0 ? <p style={styles.emptyText}>{t('libModal.empty')}</p> :
                myLibraryItems.map(item => (
                  <div key={item.id} style={styles.libItem} onClick={() => setSelectedLibProject(item.jsa_projects)}>
                    <div style={styles.libInfo}>
                      <span style={styles.libCategory}>{item.jsa_projects.tags?.[0] || t('libModal.unclassified')}</span>
                      <span style={styles.libTitleText}>{item.jsa_projects.title}</span>
                    </div>
                    <span>➡️</span>
                  </div>
                ))
              ) : (
                <>
                  <button style={styles.backBtn} onClick={() => setSelectedLibProject(null)}>{t('libModal.backBtn')}</button>
                  {selectedLibProject.analysis_data.map((step, idx) => (
                    <div key={idx} style={styles.libStepItem} onClick={() => applyStepData(step)}>
                      <div style={styles.stepInfo}>
                        <span style={styles.stepIdxBadge}>{t('libModal.step')} {idx + 1}</span>
                        <strong style={styles.stepTitleText}>{step.proc.stepTitle}</strong>
                      </div>
                      <div style={styles.stepPreview}>{step.risks.length}{t('libModal.riskCount')}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
                    <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>{item.display}</div>
                  </div>
                  <span style={{ marginLeft: '10px', color: '#007bff' }}>{t('recModal.selectBtn')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
{/* 👇 [기능 추가] 대책 DB 직접 검색 모달 (실시간 렌더링 방식) */}
      {measureSearchModal.isOpen && (
        <div style={styles.dialogOverlay} onClick={() => setMeasureSearchModal({ ...measureSearchModal, isOpen: false })}>
          <div style={styles.libModalContent} onClick={e => e.stopPropagation()}>


            <div style={styles.modalHeader}>
              {/* 계층 구조 키값으로 통일하여 호출 */}
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

            

        {/* 리스트 컨테이너 높이를 400px로 고정하여 모달 크기가 요동치는 현상 방지 */}
            <div style={{ ...styles.libList, height: '400px' }}>
              {isSearchLoading ? (
                 // 👇 [기능 추가] 타이핑 후 DB를 읽어오는 동안 표시될 로컬 로딩 텍스트
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
      {/* 👆 [기능 추가 끝] */}

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
                <p style={styles.stepDetailText}>{currentStep.proc?.stepDetail}</p>
              </div>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.analysisGrid}>
                <section style={styles.leftPanel}>
                  {/* ✅ [수정] 검색창 추가 및 필터 레이아웃 조정 */}
                  <div style={styles.filterArea}>
                    <input 
                      type="text" 
                      placeholder={t('filter.searchPlaceholder') || "위험요소 검색..."}
                      style={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select style={styles.highRiskSelect} value={selectedHighRisk} onChange={(e) => {setSelectedHighRisk(e.target.value); setSearchTerm("");}}>
                      <option value="">{t('filter.auto')}</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button style={styles.libLoadBtn} onClick={fetchMyLibrary}>{t('filter.loadLibBtn')}</button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  {/* white-space: pre-line 속성을 부여하여 JSON 내 \n 이 실제 줄바꿈으로 작동하게 처리 */}
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
                      <div style={{...styles.riskResultSelect, backgroundColor: currentStep.riskLevel >= 9 ? '#ff4d4d' : '#007bff'}}>{currentStep.riskLevel}</div>
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
                            </td>

                        {jsaType === '2-step' ? (
                            <td style={styles.td}>
                              <div style={{ position: 'relative', width: '100%' }}>
                                <textarea style={styles.inlineInput} value={r.measure} onChange={(e) => updateRiskField(r.id, 'measure', e.target.value)} rows={3} />
                              {!r.measure?.trim() && (
                                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                    <button style={{ backgroundColor: '#222', color: '#ff9800', border: '1px solid #ff9800', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => openMeasureSearch(r, 'current')}>
                                      {t('table.searchBtn')}
                                    </button>
                                    <button style={{ backgroundColor: '#222', color: '#007bff', border: '1px solid #007bff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => handleOpenRecommendation(r, 'current')}>
                                      {t('table.recMeasureBtn')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          ) : (
                            <>
                              <td style={styles.td}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <textarea style={styles.inlineInput} value={r.current_measure} onChange={(e) => updateRiskField(r.id, 'current_measure', e.target.value)} rows={3} />
                                  {!r.current_measure?.trim() && (
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                      <button style={{ backgroundColor: '#222', color: '#ff9800', border: '1px solid #ff9800', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => openMeasureSearch(r, 'current')}>
                                        {t('table.searchBtn')}
                                      </button>
                                      <button style={{ backgroundColor: '#222', color: '#007bff', border: '1px solid #007bff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => handleOpenRecommendation(r, 'current')}>
                                        {t('table.recMeasureBtn')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={styles.td}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <textarea style={styles.inlineInput} value={r.recommend_measure} onChange={(e) => updateRiskField(r.id, 'recommend_measure', e.target.value)} rows={3} />
                                  {!r.recommend_measure?.trim() && (
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                                      <button style={{ backgroundColor: '#222', color: '#ff9800', border: '1px solid #ff9800', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => openMeasureSearch(r, 'advanced')}>
                                        {t('table.searchBtn')}
                                      </button>
                                      <button style={{ backgroundColor: '#222', color: '#4caf50', border: '1px solid #4caf50', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }} onClick={() => handleOpenRecommendation(r, 'advanced')}>
                                        {t('table.recAdvancedBtn')}
                                      </button>
                                    </div>
                                  )}
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
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{activeIdx === 0 ? t('btn.prevStep1') : t('btn.prevStep2')}</button>
              <button style={styles.nextBtn} onClick={() => activeIdx < analysisData.length - 1 ? setActiveIdx(activeIdx + 1) : navigate('/layout-module', { 
                state: { existingId, analysisData, formData, participants, procedures,
                  isFork: location.state?.isFork, parentId: location.state?.parentId, originalAnalysisData: location.state?.originalAnalysisData } 
              })}>
                {activeIdx === analysisData.length - 1 ? t('btn.nextComplete') : t('btn.nextStep')}
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
  // ✅ [추가] 검색창 전용 스타일
  searchInput: { flex: 1.2, backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' },
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
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
  formHeader: { borderLeft: '5px solid #007bff', paddingLeft: '1rem', marginBottom: '1.2rem' },
  headerTitleGroup: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' },
  formTitle: { fontSize: '1.4rem', color: '#fff', fontWeight: '800', margin: 0 },
  stepCountBadge: { backgroundColor: '#333', color: '#aaa', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' },
  stepContext: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '6px' },
  stepTitleRow: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  stepLabel: { fontSize: '0.75rem', color: '#007bff', fontWeight: 'bold' },
  stepValue: { fontSize: '1rem', color: '#fff' },
  stepDetailText: { color: '#888', fontSize: '0.85rem', marginTop: '0.3rem' },
  scrollArea: { flex: 1, overflow: 'hidden' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: '2rem', height: '100%', overflow: 'hidden' },
  leftPanel: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  rightPanel: { display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1.2rem', overflow: 'hidden' },
  filterArea: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' },
  highRiskSelect: { flex: 1, backgroundColor: '#1a1a1a', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' },
libLoadBtn: { padding: '0.6rem 1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 },  recBadge: { fontSize: '0.6rem', color: '#4caf50', border: '1px solid #4caf50', padding: '1px 4px', borderRadius: '3px' },
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
  smallDeleteBtn: { backgroundColor: 'transparent', color: '#444', border: '1px solid #333', cursor: 'pointer', borderRadius: '4px' },
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
  stepPreview: { color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 'bold' }
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-analysis-style";
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement("style");
    styleTag.id = styleId;
    styleTag.innerHTML = ` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `;
    document.head.appendChild(styleTag);
  }
}