import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';

/**
 * [Analysis 컴포넌트 - 6단계 개편 반영본]
 * 역할: Step 3. 유해·위험요인 분석 및 대책 수립
 * 에디터 위치: src/pages/Analysis.jsx
 */

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

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

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [myLibraryItems, setMyLibraryItems] = useState([]);
  const [selectedLibProject, setSelectedLibProject] = useState(null);

  useEffect(() => {
    const fetchRiskMaster = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('Risk_Master').select('*');
      if (!error && data) {
        setDbRisks(data.map(d => ({ ...d, source: 'master' })));
        const uniqueCats = [...new Set(data.map(item => item.category))].filter(Boolean);
        setCategories(uniqueCats);
      }
      setIsLoading(false);
    };
    fetchRiskMaster();
  }, []);

  const handleLogoClick = () => {
    if (window.confirm("메인 화면으로 이동하시겠습니까? 작성 중인 데이터가 모두 삭제될 수 있습니다.")) {
      navigate('/');
    }
  };

  const fetchMyLibrary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");
    const { data } = await supabase.from('user_favorites').select('*, jsa_projects(*)').eq('user_id', user.id);
    setMyLibraryItems(data || []);
    setSelectedLibProject(null);
    setIsLibraryModalOpen(true);
  };

  const applyStepData = (stepData) => {
    const mappedRisks = stepData.risks.map(r => ({
      id: `lib-${Date.now()}-${Math.random()}`,
      factor: r.factor || r.risk_factor,
      measure: r.measure || "",
      current_measure: r.current_measure || r.measure || "",
      recommend_measure: r.recommend_measure || "",
      category: r.category || "기타",
      source: '공유'
    }));
    
    const newData = [...analysisData];
    newData[activeIdx].risks = [...newData[activeIdx].risks, ...mappedRisks];
    setAnalysisData(newData);
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

  useEffect(() => {
    const updateRecommendations = async () => {
      if (selectedHighRisk) {
        setRecommendations(dbRisks.filter(r => r.category === selectedHighRisk).map(r => ({ ...r, source: 'master' })));
      } else {
        const matched = await getRisksFromDBByTokens(currentStep.proc?.stepTitle || "", currentStep.proc?.stepDetail || "");
        setRecommendations(matched);
      }
    };
    updateRecommendations();
  }, [activeIdx, currentStep.proc, selectedHighRisk, dbRisks]);

  const addRisk = (rec) => {
    const baseMeasure = rec.measure || "";
    const autoRecommend = (m) => {
      if (!m) return "관리감독 강화 및 작업 전 TBM 시 해당 위험요인 집중 교육";
      return `[보완] ${m.split(',')[0]} 상태 주기적 점검 및 작업 책임자 상주 확인`;
    };

    const newData = [...analysisData];
    newData[activeIdx].risks.push({ 
      id: `risk-${Date.now()}`, 
      factor: rec.risk_factor || rec.factor || "", 
      measure: baseMeasure, 
      current_measure: baseMeasure, 
      recommend_measure: autoRecommend(baseMeasure), 
      category: rec.category || "기타" 
    });
    setAnalysisData(newData);
  };

  const updateRiskField = (riskId, field, value) => {
    const newData = [...analysisData];
    newData[activeIdx].risks = newData[activeIdx].risks.map(r => 
      r.id === riskId ? { ...r, [field]: value } : r
    );
    setAnalysisData(newData);
  };

  const updateStepRisk = (field, value) => {
    const newData = [...analysisData];
    const target = newData[activeIdx];
    target[field] = parseInt(value);
    target.riskLevel = target.frequency * target.severity;
    setAnalysisData(newData);
  };

  const handlePrev = () => {
    if (activeIdx === 0) navigate('/procedure', { state: { id: existingId, formData, participants, procedures, analysisData } });
    else setActiveIdx(activeIdx - 1);
  };

  return (
    <div style={styles.wrapper}>
      {isLoading && <div style={styles.dialogOverlay}><div style={styles.spinner} /></div>}
      
      {isLibraryModalOpen && (
        <div style={styles.dialogOverlay} onClick={() => setIsLibraryModalOpen(false)}>
          <div style={styles.libModalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>작업 단계 라이브러리 호출</h3>
              <button style={styles.closeBtnSmall} onClick={() => setIsLibraryModalOpen(false)}>✕</button>
            </div>
            <div style={styles.libList}>
              {!selectedLibProject ? (
                myLibraryItems.length === 0 ? <p style={styles.emptyText}>저장된 라이브러리가 없습니다.</p> :
                myLibraryItems.map(item => (
                  <div key={item.id} style={styles.libItem} onClick={() => setSelectedLibProject(item.jsa_projects)}>
                    <div style={styles.libInfo}>
                      <span style={styles.libCategory}>{item.jsa_projects.tags?.[0] || "미분류"}</span>
                      <strong style={styles.libTitleText}>{item.jsa_projects.title}</strong>
                    </div>
                    <span>➡️</span>
                  </div>
                ))
              ) : (
                <>
                  <button style={styles.backBtn} onClick={() => setSelectedLibProject(null)}>⬅️ 목록 돌아가기</button>
                  {selectedLibProject.analysis_data.map((step, idx) => (
                    <div key={idx} style={styles.libStepItem} onClick={() => applyStepData(step)}>
                      <div style={styles.stepInfo}>
                        <span style={styles.stepIdxBadge}>Step {idx + 1}</span>
                        <strong style={styles.stepTitleText}>{step.proc.stepTitle}</strong>
                      </div>
                      <div style={styles.stepPreview}>{step.risks.length}개 위험요인 포함</div>
                    </div>
                  ))}
                </>
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
          <AdBanner slot="39782983673978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            
            {/* [변경됨] 6단계 Stepper 적용 */}
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>3</div><span style={styles.stepTextActive}>위험 분석</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>문서 모듈 구성</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>데이터 표 구성</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>최종 출력</span></div>
            </nav>

            <div style={styles.formHeader}>
              <div style={styles.headerTitleGroup}>
                <h2 style={styles.formTitle}>03. 유해·위험요인 분석 ({jsaType === '2-step' ? '표준형' : '심화형'})</h2>
                <span style={styles.stepCountBadge}>{activeIdx + 1} / {analysisData.length}</span>
              </div>
              <div style={styles.stepContext}>
                <div style={styles.stepTitleRow}><span style={styles.stepLabel}>현재 단계</span><strong style={styles.stepValue}>{currentStep.proc?.stepTitle}</strong></div>
                <p style={styles.stepDetailText}>{currentStep.proc?.stepDetail}</p>
              </div>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.analysisGrid}>
                <section style={styles.leftPanel}>
                  <div style={styles.filterArea}>
                    <label style={styles.label}>⚠️ 고위험 필터</label>
                    <select style={styles.highRiskSelect} value={selectedHighRisk} onChange={(e) => setSelectedHighRisk(e.target.value)}>
                      <option value="">(자동 제안)</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button style={styles.libLoadBtn} onClick={fetchMyLibrary}>📂 라이브러리 스텝 호출</button>
                  </div>

                  <div style={styles.recHeader}>
                    <span style={styles.label}>안전 지식 베이스 (표준/공유)</span>
                    <div style={styles.arrowBox}><button style={styles.arrowBtn} onClick={() => scroll('left')}>←</button><button style={styles.arrowBtn} onClick={() => scroll('right')}>→</button></div>
                  </div>

                  <div style={styles.sliderContainer} ref={scrollRef}>
                    <div style={styles.manualAddCard} onClick={() => addRisk({ factor: '', measure: '' })}><div style={styles.plusIcon}>+</div><p style={styles.manualText}>수동 작성</p></div>
                    {recommendations.map((rec, i) => (
                      <div key={`rec-${i}`} style={styles.recommendCard} onClick={() => addRisk(rec)}>
                        <div style={styles.badgeGroup}><div style={styles.recBadge}>{rec.source === 'master' ? "공식" : "공유"}</div></div>
                        <p style={styles.recFactor}>{rec.risk_factor || rec.factor}</p>
                        <p style={styles.recMeasure}>{rec.measure}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={styles.rightPanel}>
                  <div style={styles.rightHeader}>
                    <span style={styles.label}>평가 결과 및 대책 ({currentStep.risks.length})</span>
                    <div style={styles.riskScoreContainer}>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>빈도</span><select style={styles.miniSelect} value={currentStep.frequency} onChange={(e) => updateStepRisk('frequency', e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskMultiply}>×</div>
                      <div style={styles.riskInputSet}><span style={styles.miniLabel}>강도</span><select style={styles.miniSelect} value={currentStep.severity} onChange={(e) => updateStepRisk('severity', e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                      <div style={styles.riskEqual}>=</div>
                      <div style={{...styles.riskResultSelect, backgroundColor: currentStep.riskLevel >= 9 ? '#ff4d4d' : '#007bff'}}>{currentStep.riskLevel}</div>
                    </div>
                  </div>
                  
                  <div style={styles.selectedListScroll}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>유해·위험요인</th>
                          {jsaType === '2-step' ? (
                            <th style={styles.th}>감소대책</th>
                          ) : (
                            <>
                              <th style={styles.th}>현재 안전대책</th>
                              <th style={styles.th}>추가 감소대책</th>
                            </>
                          )}
                          <th style={styles.th}>삭제</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStep.risks.map(r => (
                          <tr key={r.id}>
                            <td style={styles.td}><textarea style={styles.inlineInput} value={r.factor} onChange={(e) => updateRiskField(r.id, 'factor', e.target.value)} rows={3} /></td>
                            {jsaType === '2-step' ? (
                              <td style={styles.td}><textarea style={styles.inlineInput} value={r.measure} onChange={(e) => updateRiskField(r.id, 'measure', e.target.value)} rows={3} /></td>
                            ) : (
                              <>
                                <td style={styles.td}><textarea style={styles.inlineInput} value={r.current_measure} onChange={(e) => updateRiskField(r.id, 'current_measure', e.target.value)} rows={3} /></td>
                                <td style={styles.td}><textarea style={styles.inlineInput} value={r.recommend_measure} onChange={(e) => updateRiskField(r.id, 'recommend_measure', e.target.value)} rows={3} /></td>
                              </>
                            )}
                            <td style={{ textAlign: 'center' }}><button style={styles.smallDeleteBtn} onClick={() => { const nd = [...analysisData]; nd[activeIdx].risks = nd[activeIdx].risks.filter(risk => risk.id !== r.id); setAnalysisData(nd); }}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{activeIdx === 0 ? '이전 단계(작업 절차)' : '이전 작업 단계'}</button>
              {/* [변경됨] 다음 라우팅 경로를 /layoutbuilder 에서 /layout-module 로 변경 */}
              <button style={styles.nextBtn} onClick={() => activeIdx < analysisData.length - 1 ? setActiveIdx(activeIdx + 1) : navigate('/layout-module', { state: { existingId, analysisData, formData, participants, procedures } })}>
                {activeIdx === analysisData.length - 1 ? '분석 완료 및 모듈 설정으로 이동' : '다음 작업 단계 분석'}
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
          <AdBanner slot="12841191691284119169" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
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
  libLoadBtn: { padding: '0.6rem 1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' },
  recHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' },
  arrowBox: { display: 'flex', gap: '0.4rem' },
  arrowBtn: { backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' },
  sliderContainer: { display: 'grid', gridTemplateRows: 'repeat(2, 140px)', gridAutoFlow: 'column', gap: '10px', overflowX: 'auto', paddingBottom: '1rem', justifyContent: 'start', gridAutoColumns: '220px' },
  recommendCard: { width: '220px', height: '140px', backgroundColor: '#161616', border: '1px solid #333', borderRadius: '8px', padding: '1rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  manualAddCard: { width: '220px', height: '140px', border: '1px dashed #007bff', backgroundColor: 'rgba(0,123,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#007bff', cursor: 'pointer' },
  plusIcon: { fontSize: '1.5rem' },
  manualText: { fontSize: '0.8rem', fontWeight: 'bold' },
  badgeGroup: { position: 'absolute', top: '10px', right: '10px' },
  recBadge: { fontSize: '0.6rem', color: '#4caf50', border: '1px solid #4caf50', padding: '1px 4px', borderRadius: '3px' },
  recFactor: { marginTop: '1.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  recMeasure: { color: '#777', fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
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