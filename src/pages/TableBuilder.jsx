import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { supabase } from '../supabaseClient';

/**
 * [TableBuilder 컴포넌트]
 * 역할: Step 5. 데이터 표 구성 (위험성 평가 본문 테이블의 컬럼 지정 및 다단 헤더 설정)
 * 에디터 위치: src/pages/TableBuilder.jsx
 */

const TAG_META = {
  // 일반 JSA 및 공통 태그
  'DATA_STEP_NO': { label: '작업번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 4, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_FREQUENCY': { label: '가능성(빈도)', color: '#20c997', width: 3, align: 'center' }, 
  'DATA_SEVERITY': { label: '중대성(강도)', color: '#20c997', width: 3, align: 'center' }, 
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 3, align: 'center' },

  // KRAS 표준 양식 전용 태그
  'DATA_KRAS_STEP': { label: '세부 작업 내용', color: '#0d6efd', width: 4, align: 'center' },
  'DATA_KRAS_HAZARD_CLASS': { label: '위험 분류', color: '#dc3545', width: 3, align: 'center' },
  'DATA_KRAS_HAZARD_DETAIL': { label: '위험발생 상황 및 결과', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_KRAS_BASIS': { label: '관련근거(법적기준)', color: '#6c757d', width: 3, align: 'center' },
  'DATA_KRAS_CURRENT': { label: '현재의 안전보건조치', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_KRAS_RECOMMEND': { label: '위험성 감소대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_KRAS_AFTER': { label: '개선후 위험성', color: '#17a2b8', width: 4, align: 'center' },
  'DATA_KRAS_SCHED': { label: '개선 예정일', color: '#ffc107', width: 4, align: 'center' },
  'DATA_KRAS_COMP': { label: '완료일', color: '#28a745', width: 3, align: 'center' },
  'DATA_KRAS_MANAGER': { label: '담당자', color: '#6610f2', width: 3, align: 'center' },
};

const COLUMN_GROUPS = [
  { label: '유해 위험요인 파악', children: ['DATA_KRAS_HAZARD_CLASS', 'DATA_KRAS_HAZARD_DETAIL'] },
  { label: '위험성', children: ['DATA_FREQUENCY', 'DATA_SEVERITY', 'DATA_RISK'] }
];

const getNormalizedOrder = (order) => {
  const normalized = [];
  const seenGroups = new Set();
  const addedKeys = new Set();
  order.forEach(key => {
    if (addedKeys.has(key)) return;
    const groupDef = COLUMN_GROUPS.find(g => g.children.includes(key));
    if (groupDef) {
      if (!seenGroups.has(groupDef.label)) {
        seenGroups.add(groupDef.label);
        const activeChildren = order.filter(childKey => groupDef.children.includes(childKey));
        activeChildren.forEach(childKey => {
          normalized.push(childKey);
          addedKeys.add(childKey);
        });
      }
    } else {
      normalized.push(key);
      addedKeys.add(key);
    }
  });
  return normalized;
};

export default function TableBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    existingId, analysisData = [], formData = {}, participants = [], procedures = [], 
    savedActiveOrder, savedOrientation, savedUserColumns,
    docTitle, appr1, appr2, appr3, savedSignatureRows
  } = location.state || {};

  const [orientation, setOrientation] = useState(savedOrientation || 'landscape');
  const [zoom, setZoom] = useState(1.0); 
  const COLS = orientation === 'landscape' ? 56 : 40; 
  const PAPER_WIDTH = orientation === 'landscape' ? '1080px' : '750px';

  const [activeOrder, setActiveOrder] = useState(() => {
    const initialOrder = savedActiveOrder || [
      'DATA_STEP_NO', 'DATA_STEP_TITLE', 'DATA_HAZARD', 'DATA_RECOMMEND_MEASURE',
      'DATA_FREQUENCY', 'DATA_SEVERITY', 'DATA_RISK'
    ];
    return getNormalizedOrder(initialOrder);
  }); 

  const [userColumns, setUserColumns] = useState(savedUserColumns || []);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    const normalized = getNormalizedOrder(activeOrder);
    if (JSON.stringify(normalized) !== JSON.stringify(activeOrder)) {
      setActiveOrder(normalized);
    }
  }, [activeOrder]);

  // --- 레이아웃 및 그룹 계산 (사이드바와 테이블에서 공통 사용) ---
  const currentItems = activeOrder.filter(key => TAG_META[key] || userColumns.find(u => u.id === key));
  const fixedWidthTotal = currentItems.reduce((sum, key) => {
    const meta = TAG_META[key] || userColumns.find(u => u.id === key);
    return sum + (meta?.isFlex ? 0 : (parseInt(meta?.width) || 5));
  }, 0);
  const flexItems = currentItems.filter(key => (TAG_META[key]?.isFlex || userColumns.find(u => u.id === key)?.isFlex));
  const remainingSpace = COLS - fixedWidthTotal;

  let layoutGroups = [];
  let tempGroup = null;

  currentItems.forEach(key => {
    const groupDef = COLUMN_GROUPS.find(g => g.children.includes(key));
    if (groupDef) {
      if (tempGroup && tempGroup.label === groupDef.label) {
        tempGroup.keys.push(key);
      } else {
        if (tempGroup) layoutGroups.push(tempGroup);
        tempGroup = { label: groupDef.label, keys: [key], isGroup: true };
      }
    } else {
      if (tempGroup) { layoutGroups.push(tempGroup); tempGroup = null; }
      layoutGroups.push({ label: null, keys: [key], isGroup: false });
    }
  });
  if (tempGroup) layoutGroups.push(tempGroup);

  const hasGroups = layoutGroups.some(g => g.isGroup);

  const handleSaveLayout = async () => {
    if (!saveName.trim()) return alert("양식 이름을 입력해주세요.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");
    const layoutData = { docTitle, appr1, appr2, appr3, signatureRows: savedSignatureRows, orientation, activeOrder, userColumns };
    const { error } = await supabase.from('user_layouts').insert({ user_id: user.id, name: saveName, layout_data: layoutData });
    if (error) { console.error(error); alert("양식 저장 중 오류가 발생했습니다."); } 
    else { alert("전체 양식 설정이 성공적으로 스크랩되었습니다."); setShowSaveModal(false); setSaveName(''); }
  };

  // 그룹 단위 드래그 앤 드롭 핸들러
  const handleDragOver = (e, targetGroupIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetGroupIdx) return;
    
    const newGroups = [...layoutGroups];
    const movedGroup = newGroups.splice(draggedIdx, 1)[0];
    newGroups.splice(targetGroupIdx, 0, movedGroup);
    
    // 다시 평탄화하여 activeOrder 업데이트
    const newOrder = newGroups.flatMap(g => g.keys);
    setActiveOrder(newOrder);
    setDraggedIdx(targetGroupIdx);
  };

  const toggleTag = (key) => {
    // 위험성 그룹 (빈도, 강도, 위험성) 통합 처리
    const riskGroupKeys = ['DATA_FREQUENCY', 'DATA_SEVERITY', 'DATA_RISK'];
    if (riskGroupKeys.includes(key)) {
      const isAnyActive = riskGroupKeys.some(k => activeOrder.includes(k));
      if (isAnyActive) {
        setActiveOrder(prev => prev.filter(k => !riskGroupKeys.includes(k)));
      } else {
        setActiveOrder(prev => [...prev, ...riskGroupKeys]);
      }
    } else {
      if (activeOrder.includes(key)) setActiveOrder(prev => prev.filter(k => k !== key));
      else setActiveOrder(prev => [...prev, key]);
    }
  };

  const addUserColumn = () => {
    const currentSum = userColumns.reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
    if (currentSum + 5 > 40) { alert("사용자 항목들의 총 너비 합계가 한도를 초과할 수 없습니다."); return; }
    const id = `USER_${Date.now()}`;
    setUserColumns([...userColumns, { id, label: '새 항목', width: 5, isFlex: false }]);
    setActiveOrder([...activeOrder, id]);
  };

  const handleWidthChange = (id, rawValue) => {
    const numericValue = rawValue === '' ? '' : parseInt(rawValue);
    setUserColumns(prev => {
      const otherSum = prev.filter(u => u.id !== id).reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
      let finalValue = numericValue;
      if (numericValue !== '' && otherSum + numericValue > 40) finalValue = 40 - otherSum;
      return prev.map(u => u.id === id ? { ...u, width: finalValue } : u);
    });
  };

const renderDataTablePreview = () => {
    if (currentItems.length === 0) return null;
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed', backgroundColor: '#fff', color: '#000' }}>
        <colgroup>
          {currentItems.map(key => {
            const meta = TAG_META[key] || userColumns.find(u => u.id === key);
            let pct = meta.isFlex ? (remainingSpace / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
            return <col key={key} style={{ width: `${pct}%` }} />;
          })}
        </colgroup>
        <thead>
          <tr>
            {layoutGroups.map((group, idx) => {
              if (group.isGroup) {
                return <th key={`th-group-${idx}`} colSpan={group.keys.length} style={{ border: '1px solid #000', padding: '6px 4px', backgroundColor: '#f0f0f0', fontSize: '11px', textAlign: 'center', color: '#000' }}>{group.label}</th>;
              } else {
                const key = group.keys[0];
                const meta = TAG_META[key] || userColumns.find(u => u.id === key);
                let label = meta.label;
                if (key === 'DATA_FREQUENCY') label = "가능성\n(빈도)";
                if (key === 'DATA_SEVERITY') label = "중대성\n(강도)";
                return <th key={`th-${key}`} rowSpan={hasGroups ? 2 : 1} style={{ border: '1px solid #000', padding: '6px 4px', backgroundColor: '#f0f0f0', fontSize: '11px', textAlign: 'center', whiteSpace: 'pre-wrap', color: '#000' }}>{label}</th>;
              }
            })}
          </tr>
          {hasGroups && (
            <tr>
              {layoutGroups.filter(g => g.isGroup).flatMap(group =>
                group.keys.map(key => {
                  const meta = TAG_META[key] || userColumns.find(u => u.id === key);
                  let label = meta.label;
                  if (key === 'DATA_KRAS_AFTER') label = "개선후\n위험성";
                  if (key === 'DATA_KRAS_SCHED') label = "개선\n예정일";
                  return <th key={`th-sub-${key}`} style={{ border: '1px solid #000', padding: '6px 4px', backgroundColor: '#f9f9f9', fontSize: '11px', textAlign: 'center', whiteSpace: 'pre-wrap', color: '#000' }}>{label}</th>;
                })
              )}
            </tr>
          )}
        </thead>
        <tbody>
          <tr>
            {currentItems.map((key, i) => {
              const meta = TAG_META[key] || userColumns.find(u => u.id === key);
              return (
                <td key={`dummy-${key}`} style={{ border: '1px solid #000', padding: '10px 4px', fontSize: '11px', color: '#000', textAlign: meta.align || 'center', verticalAlign: 'middle', wordBreak: 'break-all' }}>
                  (작성 예시)
                </td>
              );
            })}
          </tr>
          <tr>
             <td colSpan={currentItems.length} style={{ border: '1px solid #000', padding: '20px', textAlign: 'center', color: '#000', fontSize: '12px', backgroundColor: '#fafafa' }}>
               ... 실제 위험성 평가 데이터 전개 영역 ...
             </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const goBackToModuleBuilder = () => navigate('/layout-module', { state: { ...location.state, savedActiveOrder: activeOrder, savedOrientation: orientation, savedUserColumns: userColumns } });
  const goToExport = () => navigate('/export', { state: { ...location.state, savedActiveOrder: activeOrder, savedOrientation: orientation, savedUserColumns: userColumns } });

  return (
    <div style={styles.wrapper}>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .canvas-container { 
          transform-origin: top center; transition: transform 0.2s ease; margin: 0 auto; background-color: #fff; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.7); width: fit-content; 
          box-sizing: border-box; font-family: "Malgun Gothic", sans-serif;
        }
        .tag-item { transition: transform 0.2s ease, background 0.2s; }
      `}</style>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>문서 모듈 구성</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>5</div><span style={styles.stepTextActive}>데이터 표 구성</span></div><div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>최종 출력</span></div>
            </nav>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>| 05. 데이터 표 구성</h2>
              <p style={{color: '#aaa', marginTop: '8px', fontSize: '0.9rem'}}>위험성 평가 본문이 전개될 표의 항목(Column) 순서와 너비를 정밀하게 조율합니다.</p>
            </div>
            <div style={styles.builderLayout}>
              <aside style={styles.toolbarSliding}>
                <div style={styles.toolSectionCompact}><h3 style={styles.toolTitleMini}>전체 통합 저장</h3><button style={{...styles.miniBtn, backgroundColor: '#4caf50', padding: '12px'}} onClick={() => setShowSaveModal(true)}>현재까지의 전체 설정 스크랩하기</button><span style={{ fontSize: '0.65rem', color: '#888', marginTop: '4px' }}>* Step 4의 모듈 설정과 현재의 테이블 설정이 함께 저장됩니다.</span></div>
                <div style={styles.toolSectionCompact}><h3 style={styles.toolTitleMini}>테이블 용지 방향</h3><div style={styles.buttonGroupSmall}><button style={{...styles.miniBtn, backgroundColor: orientation === 'landscape' ? '#444' : '#222'}} onClick={() => setOrientation('landscape')}>가로형 (권장)</button><button style={{...styles.miniBtn, backgroundColor: orientation === 'portrait' ? '#444' : '#222'}} onClick={() => setOrientation('portrait')}>세로형</button></div><div style={styles.inputFieldCompact}><span style={{fontSize:'0.6rem', color:'#888'}}>미리보기 확대/축소</span><input type="range" min="0.5" max="1.5" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={styles.rangeInputCompact} /></div></div>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>컬럼 항목 구성 (Drag & Drop)</h3>
                  
                  {/* 통합 토글 영역: 위험성(3개 항목)은 하나로 표시 */}
                  <div style={styles.tagToggleContainerCompact}>
                    {Object.keys(TAG_META)
                      .filter(key => !['DATA_FREQUENCY', 'DATA_SEVERITY'].includes(key)) // 개별 버튼 제외
                      .map(key => {
                        const isActive = activeOrder.includes(key);
                        const label = key === 'DATA_RISK' ? '위험성 (통합)' : TAG_META[key].label;
                        return (
                          <button 
                            key={key} 
                            onClick={() => toggleTag(key)} 
                            style={{...styles.tagBtnSmall, backgroundColor: isActive ? TAG_META[key].color : '#161616', color: isActive ? '#fff' : '#666', borderColor: TAG_META[key].color, opacity: 1}}
                          >
                            {label}
                          </button>
                        );
                    })}
                  </div>

                  {/* 드래그 앤 드롭 영역: layoutGroups를 순회하여 위험성을 한 묶음으로 취급 */}
                  <div style={styles.dragScrollArea}>
                    {layoutGroups.map((group, idx) => {
                      const isRiskGroup = group.isGroup && group.label === '위험성';
                      const key = group.keys[0];
                      const meta = isRiskGroup 
                        ? { label: '위험성 (가능성·중대성·산정)', color: TAG_META['DATA_RISK'].color }
                        : (TAG_META[key] || userColumns.find(u => u.id === key));
                      
                      if (!meta) return null;
                      const isUser = key.startsWith('USER_');

                      return (
                        <div 
                          key={isRiskGroup ? 'group-risk' : key} 
                          draggable 
                          onDragStart={() => setDraggedIdx(idx)} 
                          onDragOver={(e) => handleDragOver(e, idx)} 
                          className="tag-item" 
                          style={{...styles.dragTagMini, borderColor: meta.color || '#444', backgroundColor: meta.color ? `${meta.color}33` : '#222'}}
                        >
                          <span style={{cursor:'grab', color:'#888', marginRight:'8px'}}>☰</span>
                          {isUser ? (
                            <div style={{display:'flex', gap:'4px', flex:1, alignItems:'center'}}>
                              <input style={styles.miniInputNoBorder} value={meta.label} onChange={(e) => setUserColumns(prev => prev.map(u => u.id === key ? {...u, label: e.target.value} : u))} />
                              <div style={{display:'flex', alignItems:'center', gap:'2px', backgroundColor:'rgba(0,0,0,0.5)', padding:'0 4px', borderRadius:'4px'}}><span style={{fontSize:'0.6rem', color:'#555'}}>너비</span><input type="number" style={styles.numInputPure} value={meta.width} onChange={(e) => handleWidthChange(key, e.target.value)} /></div>
                              <button onClick={() => { setActiveOrder(prev => prev.filter(k=>k!==key)); setUserColumns(prev => prev.filter(u=>u.id!==key)); }} style={styles.miniDelBtnActive}>×</button>
                            </div>
                          ) : (
                            <span style={{flex:1, fontSize:'0.75rem', color:'#eee'}}>{meta.label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <button style={styles.addBtnMini} onClick={addUserColumn}>+ 커스텀 항목 추가</button>
                </div>
              </aside>
              <section style={styles.gridCanvasWrapper}>
                <div style={styles.canvasScrollArea}>
                  <div className="canvas-container" style={{ transform: `scale(${zoom})`, width: PAPER_WIDTH }}>
                    
                    <div style={{ padding: '20px', backgroundColor: '#f1f3f5', border: '1px dashed #adb5bd', textAlign: 'center', color: '#6c757d', marginBottom: '20px', fontSize: '13px' }}>[문서 통합 헤더 영역]</div>
                    
                    {renderDataTablePreview()}
                    
                    <div style={{ padding: '20px', backgroundColor: '#f1f3f5', border: '1px dashed #adb5bd', textAlign: 'center', color: '#6c757d', marginTop: '20px', fontSize: '13px' }}>[참여자 서명란 영역]</div>
                  
                  </div>
                </div>
              </section>
            </div>
            <div style={styles.btnAreaLayout}><button style={styles.prevBtnDark} onClick={goBackToModuleBuilder}>이전: 문서 모듈 구성 (Step 4)</button><button style={styles.nextBtnLight} onClick={goToExport}>최종 출력 단계로 이동 (Step 6)</button></div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>
      {showSaveModal && ( <div style={styles.modalOverlay}><div style={styles.modalContent}><h3 style={styles.modalTitle}>전체 양식 스크랩에 추가</h3><p style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '-10px', textAlign: 'center' }}>Step 4의 문서 모듈과 현재 구성한 테이블 설정이 병합되어 저장됩니다.</p><input style={styles.modalInput} placeholder="스크랩할 이름을 입력하세요" value={saveName} onChange={(e) => setSaveName(e.target.value)} /><div style={styles.modalBtnGroup}><button style={styles.modalBtnSecondary} onClick={() => setShowSaveModal(false)}>취소</button><button style={styles.modalBtnPrimary} onClick={handleSaveLayout}>저장하기</button></div></div></div> )}
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
  formCard: { width: '100%', maxWidth: '1550px', height: '85vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.8)' },
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
  builderLayout: { display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden' },
  toolbarSliding: { width: '320px', backgroundColor: 'rgba(24, 24, 24, 0.95)', border: '1px solid #333', borderRadius: '10px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' },
  toolSectionCompact: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  toolTitleMini: { color: '#aaa', fontSize: '0.85rem', fontWeight: '900', borderLeft: '3px solid #007bff', paddingLeft: '8px' },
  buttonGroupSmall: { display: 'flex', gap: '6px' },
  miniBtn: { flex: 1, padding: '10px', backgroundColor: '#222', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  rangeInputCompact: { width: '100%', height: '4px', cursor: 'pointer', accentColor: '#007bff' },
  tagToggleContainerCompact: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tagBtnSmall: { padding: '6px 10px', border: '1px solid #333', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  dragScrollArea: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' },
  dragTagMini: { padding: '10px', border: '1px solid', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center' },
  miniInputNoBorder: { background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', fontSize: '0.8rem', outline: 'none', flex: 1, padding: '4px 6px', borderRadius: '3px', maxWidth: '100px' },
  numInputPure: { width: '30px', background: 'none', border: 'none', color: '#007bff', fontSize: '0.85rem', textAlign: 'center', outline: 'none', fontWeight: 'bold' },
  miniDelBtnActive: { background: 'transparent', color: '#ff4d4d', border: 'none', borderRadius: '4px', width: '22px', height: '22px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', fontWeight: 'bold' },
  addBtnMini: { width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #444', color: '#aaa', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  gridCanvasWrapper: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  canvasScrollArea: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '30px' },
  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#007bff', color: '#fff', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' },
  inputFieldCompact: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', border: '1px solid #333' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '2.5rem', width: '450px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' },
  modalTitle: { fontSize: '1.3rem', color: '#fff', fontWeight: 'bold', margin: 0, textAlign: 'center' },
  modalInput: { backgroundColor: '#0a0a0a', border: '1px solid #444', color: '#fff', padding: '1rem', borderRadius: '6px', fontSize: '1rem', outline: 'none' },
  modalBtnGroup: { display: 'flex', gap: '10px' },
  modalBtnPrimary: { flex: 1, backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  modalBtnSecondary: { flex: 1, backgroundColor: '#333', color: '#fff', border: 'none', padding: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }
};