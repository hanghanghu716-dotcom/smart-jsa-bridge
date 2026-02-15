import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  const { procedures = [], formData = {}, participants = [], analysisData: incomingAnalysisData } = location.state || {};
  
  const [dbRisks, setDbRisks] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [analysisData, setAnalysisData] = useState(incomingAnalysisData || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHighRisk, setSelectedHighRisk] = useState(""); 

  useEffect(() => {
    const fetchRiskMaster = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('Risk_Master').select('*');
      if (!error && data) {
        setDbRisks(data);
        const uniqueCats = [...new Set(data.map(item => item.category))].filter(Boolean);
        setCategories(uniqueCats);
      }
      setIsLoading(false);
    };
    fetchRiskMaster();
  }, []);

  const getRisksFromDBByTokens = (title = "", detail = "", currentFormData = {}) => {
    const combinedText = `${title} ${detail}`.trim();
    if (!combinedText || dbRisks.length === 0) return [];

    const tokens = combinedText.split(/[\s,./]+/).filter(t => t.trim().length > 0);
    const uniqueTokens = [...new Set(tokens.map(t => t.toLowerCase()))];
    
    let matchedRisks = [];
    const seenFactors = new Set(); 

    uniqueTokens.forEach(token => {
      dbRisks.forEach(item => {
        if (!item.keywords || !Array.isArray(item.keywords)) return;
        const isMatched = item.keywords.some(kw => {
          const cleanKw = kw.toString().replace(/\s+/g, "").toLowerCase();
          return token.includes(cleanKw) || cleanKw.includes(token);
        });
        if (isMatched && !seenFactors.has(item.risk_factor)) {
          matchedRisks.push({ factor: item.risk_factor, measure: item.measure, category: item.category });
          seenFactors.add(item.risk_factor);
        }
      });
    });

    if (currentFormData.hasNewWorker) {
      matchedRisks.unshift({
        factor: "신입 및 미숙련 작업자의 작업 숙련도 부족으로 인한 돌발 사고",
        measure: "작업 전담 멘토(사수) 지정 및 작업 전 절차 재교육, 현장 밀착 감시 수행"
      });
    }
    return matchedRisks;
  };

  useEffect(() => {
    if (procedures?.length > 0) {
      setAnalysisData(prevData => {
        const baseData = prevData.length > 0 ? prevData : (incomingAnalysisData || []);
        return procedures.map((newProc, idx) => {
          const existingData = baseData.find(d => d.id === idx);
          if (existingData) return { ...existingData, proc: newProc };
          return { id: idx, proc: newProc, risks: [], frequency: 1, severity: 1, riskLevel: 1 };
        });
      });
    }
  }, [procedures]);

  const currentStep = analysisData[activeIdx] || { proc: {}, risks: [], frequency: 1, severity: 1, riskLevel: 1 };

  useEffect(() => {
    if (selectedHighRisk) {
      const filtered = dbRisks
        .filter(r => r.category === selectedHighRisk)
        .map(r => ({ factor: r.risk_factor, measure: r.measure, category: r.category }));
      setRecommendations(filtered);
    } else {
      const searchTimer = setTimeout(() => {
        setRecommendations(getRisksFromDBByTokens(currentStep.proc?.stepTitle || "", currentStep.proc?.stepDetail || "", formData));
      }, 300);
      return () => clearTimeout(searchTimer);
    }
  }, [activeIdx, currentStep.proc, selectedHighRisk, dbRisks, formData]);

  const handlePrev = () => {
    if (activeIdx === 0) navigate('/procedure', { state: { formData, participants, procedures, analysisData } });
    else setActiveIdx(activeIdx - 1);
  };

  const addRisk = (rec) => {
    const newData = [...analysisData];
    newData[activeIdx].risks.push({ id: `risk-${Date.now()}`, factor: rec.factor, measure: rec.measure });
    setAnalysisData(newData);
  };

  const deleteRisk = (riskId) => {
    const newData = [...analysisData];
    newData[activeIdx].risks = newData[activeIdx].risks.filter(r => r.id !== riskId);
    setAnalysisData(newData);
  };

  const updateRiskContent = (riskId, field, value) => {
    const newData = [...analysisData];
    newData[activeIdx].risks = newData[activeIdx].risks.map(r => r.id === riskId ? { ...r, [field]: value } : r);
    setAnalysisData(newData);
  };

  const updateStepRisk = (field, value) => {
    const newData = [...analysisData];
    const target = newData[activeIdx];
    target[field] = parseInt(value);
    target.riskLevel = target.frequency * target.severity;
    setAnalysisData(newData);
  };

  const scroll = (dir) => { if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' }); };

  return (
    <div style={styles.wrapper}>
      {isLoading && <div style={styles.dialogOverlay}><div style={styles.dialogBox}><div style={styles.spinner} /><h3>데이터 동기화 중...</h3></div></div>}
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      <div style={styles.mainLayout}>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>3</div><span style={styles.stepTextActive}>위험 분석</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>최종 출력</span></div>
            </nav>

            <div style={styles.formHeader}>
              <div style={styles.headerTitleGroup}>
                <h2 style={styles.formTitle}>03. 유해·위험요인 분석</h2>
                <span style={styles.stepCountBadge}>{activeIdx + 1} / {analysisData.length}</span>
              </div>
              <div style={styles.stepContext}>
                <div style={styles.stepTitleRow}>
                  <span style={styles.stepLabel}>현재 단계</span>
                  <strong style={styles.stepValue}>{currentStep.proc?.stepTitle}</strong>
                </div>
                <p style={styles.stepDetailText}>{currentStep.proc?.stepDetail}</p>
              </div>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.analysisGrid}>
                <section style={styles.leftPanel}>
                  <div style={styles.filterArea}>
                    <label style={styles.label}>⚠️ 고위험 작업 필터</label>
                    <select style={styles.highRiskSelect} value={selectedHighRisk} onChange={(e) => setSelectedHighRisk(e.target.value)}>
                      <option value="">(자동 제안)</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div style={styles.recHeader}>
                    <span style={styles.label}>추천 위험요인 DB</span>
                    <div style={styles.arrowBox}>
                      <button style={styles.arrowBtn} onClick={() => scroll('left')}>←</button>
                      <button style={styles.arrowBtn} onClick={() => scroll('right')}>→</button>
                    </div>
                  </div>

                  <div style={styles.sliderContainer} ref={scrollRef}>
                    <div style={styles.manualAddCard} onClick={() => addRisk({ factor: '', measure: '' })}>
                      <div style={styles.plusIcon}>+</div><p style={styles.manualText}>수동 작성</p>
                    </div>
                    {recommendations.map((rec, i) => (
                      <div key={`rec-${i}`} style={{...styles.recommendCard, borderColor: selectedHighRisk ? '#ff4d4d' : '#333'}} onClick={() => addRisk(rec)}>
                        <div style={styles.badgeGroup}>
                           <div style={selectedHighRisk ? styles.recBadgeHigh : styles.recBadge}>{selectedHighRisk ? "고위험" : "추천"}</div>
                           {rec.category && <div style={styles.categoryBadge}>{rec.category}</div>}
                        </div>
                        <p style={styles.recFactor}>{rec.factor}</p>
                        <p style={styles.recMeasure}>{rec.measure}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section style={styles.rightPanel}>
                  <div style={styles.rightHeader}>
                    <span style={styles.label}>평가 결과 및 대책 ({currentStep.risks.length})</span>
                    <div style={styles.riskScoreContainer}>
                      <div style={styles.riskInputSet}>
                        <span style={styles.miniLabel}>빈도(F)</span>
                        <select style={styles.miniSelect} value={currentStep.frequency} onChange={(e) => updateStepRisk('frequency', e.target.value)}>
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} style={styles.selectOption}>{n}</option>)}
                        </select>
                      </div>
                      <div style={styles.riskMultiply}>×</div>
                      <div style={styles.riskInputSet}>
                        <span style={styles.miniLabel}>강도(S)</span>
                        <select style={styles.miniSelect} value={currentStep.severity} onChange={(e) => updateStepRisk('severity', e.target.value)}>
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} style={styles.selectOption}>{n}</option>)}
                        </select>
                      </div>
                      <div style={styles.riskEqual}>=</div>
                      <div style={styles.riskInputSet}>
                        <span style={styles.miniLabel}>위험도(R)</span>
                        <select
                          style={{...styles.riskResultSelect, backgroundColor: currentStep.riskLevel >= 9 ? '#ff4d4d' : '#007bff'}}
                          value={currentStep.riskLevel}
                          onChange={(e) => updateStepRisk('riskLevel', e.target.value)}
                        >
                          {Array.from({ length: 25 }, (_, i) => i + 1).map(n => <option key={n} value={n} style={styles.selectOption}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div style={styles.selectedListScroll}>
                    <table style={styles.table}>
                      <thead>
                        <tr><th style={{ width: '45%' }}>유해·위험요인</th><th style={{ width: '45%' }}>감소대책</th><th style={{ width: '10%' }}>삭제</th></tr>
                      </thead>
                      <tbody>
                        {currentStep.risks.length === 0 ? <tr><td colSpan="3" style={styles.emptyTd}>좌측 카드를 클릭하여 추가하세요.</td></tr> :
                          currentStep.risks.map(r => (
                            <tr key={r.id}>
                              <td style={styles.td}><textarea style={styles.inlineInput} value={r.factor} onChange={(e) => updateRiskContent(r.id, 'factor', e.target.value)} rows={3} /></td>
                              <td style={styles.td}><textarea style={styles.inlineInput} value={r.measure} onChange={(e) => updateRiskContent(r.id, 'measure', e.target.value)} rows={3} /></td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}><button style={styles.smallDeleteBtn} onClick={() => deleteRisk(r.id)}>×</button></td>
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
              <button style={styles.nextBtn} onClick={() => activeIdx < analysisData.length - 1 ? setActiveIdx(activeIdx + 1) : navigate('/export', { state: { analysisData, formData, participants, procedures } })}>
                {activeIdx === analysisData.length - 1 ? '분석 완료 및 보고서 생성' : '다음 작업 단계 분석'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  // [원본 디자인 스타일 100% 동일 유지 + 버튼 커서 pointer 추가]
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { flex: 1, display: 'flex', padding: '0 5rem', zIndex: 10, overflow: 'hidden' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', maxHeight: '85vh', height: '750px', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', overflowY: 'auto' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '30px', height: '1.5px', backgroundColor: '#4caf50' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.3 },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#aaa' },
  stepText: { fontSize: '0.85rem', color: '#aaa' },
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
  analysisGrid: { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', height: '100%', overflow: 'hidden' },
  leftPanel: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  rightPanel: { display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1.2rem', overflow: 'hidden' },
  filterArea: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' },
  highRiskSelect: { width: '100%', maxWidth: '220px', backgroundColor: '#1a1a1a', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', outline: 'none' },
  recHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' },
  arrowBox: { display: 'flex', gap: '0.4rem' },
  arrowBtn: { backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  sliderContainer: { display: 'grid', gridTemplateRows: 'repeat(2, 130px)', gridAutoFlow: 'column', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' },
  recommendCard: { minWidth: '220px', height: '130px', backgroundColor: '#161616', border: '1px solid #333', borderRadius: '8px', padding: '1rem', cursor: 'pointer', position: 'relative' },
  manualAddCard: { width: '220px', height: '130px', border: '1px dashed #007bff', backgroundColor: 'rgba(0,123,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#007bff', cursor: 'pointer' },
  plusIcon: { fontSize: '1.5rem' },
  manualText: { fontSize: '0.8rem', fontWeight: 'bold' },
  badgeGroup: { position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' },
  recBadge: { fontSize: '0.6rem', color: '#4caf50', border: '1px solid #4caf50', padding: '1px 4px', borderRadius: '3px' },
  recBadgeHigh: { fontSize: '0.6rem', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '1px 4px', borderRadius: '3px' },
  categoryBadge: { fontSize: '0.6rem', color: '#007bff', border: '1px solid #007bff', padding: '1px 4px', borderRadius: '3px' },
  recFactor: { marginTop: '1.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  recMeasure: { color: '#777', fontSize: '0.75rem' },
  rightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  riskScoreContainer: { display: 'flex', gap: '1rem', alignItems: 'center' },
  riskInputSet: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  miniLabel: { fontSize: '0.6rem', color: '#666', marginBottom: '2px' },
  miniSelect: { backgroundColor: '#111', color: '#fff', border: '1px solid #444', padding: '2px 5px', borderRadius: '4px' },
  riskResultSelect: { width: '40px', height: '30px', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' },
  riskMultiply: { color: '#444' },
  riskEqual: { color: '#444' },
  selectedListScroll: { flex: 1, overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', color: '#fff' },
  td: { padding: '8px', borderBottom: '1px solid #1a1a1a' },
  inlineInput: { width: '100%', backgroundColor: '#111', color: '#ddd', border: '1px solid #222', padding: '0.5rem', borderRadius: '4px', resize: 'none', fontSize: '0.8rem' },
  smallDeleteBtn: { backgroundColor: 'transparent', color: '#444', border: '1px solid #333', cursor: 'pointer', borderRadius: '4px' },
  emptyTd: { padding: '3rem 0', color: '#444', textAlign: 'center' },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', fontWeight: '800', borderRadius: '8px', cursor: 'pointer' },
  label: { fontSize: '0.8rem', color: '#888', fontWeight: '700' },
  dialogOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  dialogBox: { textAlign: 'center', color: '#fff' },
  spinner: { width: '40px', height: '40px', border: '3px solid #007bff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } } .selectedListScroll::-webkit-scrollbar { width: 4px; } .selectedListScroll::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }`;
document.head.appendChild(styleTag);