import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';

/**
 * [ModuleBuilder 컴포넌트]
 * 역할: Step 4. 문서 모듈 구성 (JSA 데이터 표를 제외한 PTW 및 부가 문서 블록 설정)
 * 에디터 위치: src/pages/ModuleBuilder.jsx
 */

// [프리셋 정의]
const HEADER_PRESETS = [
  { id: 'h_kras', label: 'KRAS 표준 (안전보건공단)' },
  { id: 'h_standard', label: '일반 JSA 헤더 (결재란 포함)' },
  { id: 'h_simple', label: '간편 헤더 (문서 정보만)' },
  { id: 'h_none', label: '헤더 없음' }
];

const FOOTER_PRESETS = [
  { id: 'f_standard', label: '표준 푸터 (서명란 포함)' },
  { id: 'f_notice', label: '주의사항 및 범례' },
  { id: 'f_none', label: '푸터 없음' }
];

// [신규 추가: 부가 모듈 리스트]
const OPTIONAL_MODULES = [
  { id: 'mod_job_info', label: '작업 개요 블록', desc: '작업명, 작업지역, 수행부서, 수행일자' },
  { id: 'mod_ppe', label: '개인보호구(PPE) 및 장비', desc: '필수 개인보호구 리스트 및 필요 장비/공구' },
  { id: 'mod_high_risk', label: '허가 대상 고위험작업', desc: '화기, 밀폐, 정전 등 9대 고위험작업 체크란' },
  { id: 'mod_loto', label: '에너지 차단 및 격리(LOTO)', desc: '차단 개소 및 LOTO 자물쇠 확인란' },
  { id: 'mod_watcher', label: '작업지휘자 및 감시인', desc: '신호수, 화재감시자 등 지정 및 서명란' },
  { id: 'mod_gas', label: '환경 및 가스 농도 측정', desc: 'O2, LEL, 독성가스 측정 기록표' },
  { id: 'mod_simops', label: '동시작업(SIMOPS) 간섭 확인', desc: '인접 구역 타 작업 유무 및 안전조치' },
  { id: 'mod_tbm', label: 'TBM 참석자 명부', desc: '작업 전 교육 전달사항 및 근로자 서명란' }
];

export default function ModuleBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    savedHeaderPreset, savedFooterPreset, savedModules
  } = location.state || {};

  const [headerPreset, setHeaderPreset] = useState(savedHeaderPreset || 'h_kras');
  const [footerPreset, setFooterPreset] = useState(savedFooterPreset || 'f_none');
  
  // 모듈 활성화 상태 관리 (기본값으로 작업개요, PPE, TBM 활성화)
  const [activeModules, setActiveModules] = useState(
    savedModules || ['mod_job_info', 'mod_ppe', 'mod_tbm']
  );

  const toggleModule = (moduleId) => {
    setActiveModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const goBackToAnalysis = () => {
    navigate('/analysis', { state: location.state });
  };

  const goToTableBuilder = () => {
    // 다음 단계인 Step 5 (TableBuilder)로 상태 전달
    navigate('/layout-table', { 
      state: { 
        ...location.state, 
        savedHeaderPreset: headerPreset,
        savedFooterPreset: footerPreset,
        savedModules: activeModules
      } 
    });
  };

  // 모듈 시각화 렌더러 (미리보기용 블록)
  const renderModulePreview = (moduleId) => {
    const moduleInfo = OPTIONAL_MODULES.find(m => m.id === moduleId);
    if (!moduleInfo) return null;

    return (
      <div key={moduleId} style={styles.previewBlock}>
        <div style={styles.previewBlockHeader}>{moduleInfo.label}</div>
        <div style={styles.previewBlockDesc}>{moduleInfo.desc}</div>
      </div>
    );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            
            {/* 6단계로 확장된 Stepper */}
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>문서 모듈 구성</span></div><div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>데이터 표 구성</span></div><div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>최종 출력</span></div>
            </nav>
            
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>| 04. 문서 모듈 구성</h2>
              <p style={{color: '#aaa', marginTop: '8px', fontSize: '0.9rem'}}>JSA 본문 데이터 표를 제외한 헤더/푸터 및 안전작업허가(PTW) 부가 요소를 선택합니다.</p>
            </div>

            <div style={styles.builderLayout}>
              {/* 좌측: 모듈 설정 패널 */}
              <aside style={styles.configPanel}>
                
                <div style={styles.configSection}>
                  <h3 style={styles.configTitle}>1. 기본 프리셋 설정</h3>
                  <div style={styles.selectGroup}>
                    <label style={styles.selectLabel}>상단 헤더(머리말) 양식</label>
                    <select style={styles.selectBox} value={headerPreset} onChange={(e) => setHeaderPreset(e.target.value)}>
                      {HEADER_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                    </select>
                  </div>
                  <div style={styles.selectGroup}>
                    <label style={styles.selectLabel}>하단 푸터(꼬리말) 양식</label>
                    <select style={styles.selectBox} value={footerPreset} onChange={(e) => setFooterPreset(e.target.value)}>
                      {FOOTER_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={styles.configSection}>
                  <h3 style={styles.configTitle}>2. 부가 모듈 선택 (토글)</h3>
                  <div style={styles.toggleList}>
                    {OPTIONAL_MODULES.map(module => {
                      const isActive = activeModules.includes(module.id);
                      return (
                        <div key={module.id} style={{...styles.toggleItem, borderColor: isActive ? '#007bff' : '#333', backgroundColor: isActive ? 'rgba(0,123,255,0.1)' : '#1e1e1e'}} onClick={() => toggleModule(module.id)}>
                          <div style={{ flex: 1 }}>
                            <div style={{...styles.toggleTitle, color: isActive ? '#fff' : '#aaa'}}>{module.label}</div>
                            <div style={styles.toggleDesc}>{module.desc}</div>
                          </div>
                          <div style={{...styles.switchWrapper, backgroundColor: isActive ? '#007bff' : '#444'}}>
                            <div style={{...styles.switchHandle, transform: isActive ? 'translateX(20px)' : 'translateX(0)'}} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </aside>

              {/* 우측: 모듈 레이아웃 미리보기 */}
              <section style={styles.previewPanel}>
                <div style={styles.previewHeader}>문서 구조 미리보기 (구상도)</div>
                <div style={styles.previewCanvas}>
                  
                  {headerPreset !== 'h_none' && (
                    <div style={{...styles.previewBlock, backgroundColor: '#2b2b2b', border: '1px solid #555'}}>
                      <div style={styles.previewBlockHeader}>[헤더 구역] {HEADER_PRESETS.find(p=>p.id===headerPreset)?.label}</div>
                    </div>
                  )}

                  {OPTIONAL_MODULES.map(m => activeModules.includes(m.id) ? renderModulePreview(m.id) : null)}

                  <div style={{...styles.previewBlock, backgroundColor: 'rgba(40, 167, 69, 0.1)', border: '2px dashed #28a745', padding: '30px 10px'}}>
                    <div style={{...styles.previewBlockHeader, color: '#28a745', textAlign: 'center'}}>[위험성 평가 데이터 테이블 구역]</div>
                    <div style={{...styles.previewBlockDesc, textAlign: 'center', color: '#28a745'}}>다음 단계(Step 5)에서 상세 구조를 구성합니다.</div>
                  </div>

                  {footerPreset !== 'f_none' && (
                    <div style={{...styles.previewBlock, backgroundColor: '#2b2b2b', border: '1px solid #555'}}>
                      <div style={styles.previewBlockHeader}>[푸터 구역] {FOOTER_PRESETS.find(p=>p.id===footerPreset)?.label}</div>
                    </div>
                  )}

                </div>
              </section>
            </div>

            <div style={styles.btnAreaLayout}>
              <button style={styles.prevBtnDark} onClick={goBackToAnalysis}>이전 단계 (위험 분석)</button>
              <button style={styles.nextBtnLight} onClick={goToTableBuilder}>다음: 데이터 표 구성 (Step 5)</button>
            </div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' },
  bgWrapper: { position: 'fixed', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', filter: 'brightness(0.12)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 5rem 20px', zIndex: 10, gap: '3rem', overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1400px', height: '85vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.8)' },
  
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.5rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepBadgeDone: { width: '20px', height: '20px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepTextDone: { fontSize: '0.8rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  stepBadgeActive: { width: '20px', height: '20px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.8rem', color: '#fff', fontWeight: '700' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.3 },
  stepBadge: { width: '20px', height: '20px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.75rem' },
  stepText: { fontSize: '0.8rem', color: '#aaa' },
  stepLine: { width: '20px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { width: '20px', height: '1px', backgroundColor: '#4caf50' },
  
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  builderLayout: { display: 'flex', flex: 1, gap: '2rem', overflow: 'hidden' },
  
  configPanel: { width: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '10px' },
  configSection: { backgroundColor: 'rgba(30, 30, 30, 0.95)', border: '1px solid #333', borderRadius: '10px', padding: '1.5rem' },
  configTitle: { color: '#fff', fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 1rem 0', borderBottom: '1px solid #444', paddingBottom: '0.8rem' },
  
  selectGroup: { marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' },
  selectLabel: { color: '#bbb', fontSize: '0.85rem', fontWeight: 'bold' },
  selectBox: { width: '100%', padding: '10px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' },

  toggleList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  toggleItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
  toggleTitle: { fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '4px' },
  toggleDesc: { fontSize: '0.75rem', color: '#888' },
  switchWrapper: { width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s' },
  switchHandle: { width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s ease' },

  previewPanel: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHeader: { padding: '1rem', backgroundColor: '#111', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #333', textAlign: 'center' },
  previewCanvas: { flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' },
  
  previewBlock: { width: '80%', maxWidth: '700px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '6px', padding: '15px', transition: 'all 0.3s ease' },
  previewBlockHeader: { color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' },
  previewBlockDesc: { color: '#888', fontSize: '0.75rem' },

  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#007bff', color: '#fff', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' }
};