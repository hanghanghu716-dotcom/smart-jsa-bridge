import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';

/**
 * [ModuleBuilder 컴포넌트]
 * 역할: Step 4. 문서 모듈 구성 (통합 고정 헤더 및 부가 문서 블록 설정)
 * 에디터 위치: src/pages/ModuleBuilder.jsx
 */

export default function ModuleBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    existingId = null,
    analysisData = [],
    procedures = [],
    formData = {}, 
    participants = [],
    savedSignatureRows,
    docTitle: savedDocTitle,
    appr1: savedAppr1,
    appr2: savedAppr2,
    appr3: savedAppr3
  } = location.state || {};

  const [signatureRows, setSignatureRows] = useState(savedSignatureRows || 1);

  // 문서 타이틀 및 결재란 헤더 수정용 상태 관리
  const [docTitle, setDocTitle] = useState(savedDocTitle || '위험성평가표 (JSA)');
  const [appr1, setAppr1] = useState(savedAppr1 || '작성');
  const [appr2, setAppr2] = useState(savedAppr2 || '검토');
  const [appr3, setAppr3] = useState(savedAppr3 || '승인');

  const goBackToAnalysis = () => {
    navigate('/analysis', { 
      state: { 
        ...location.state,
        isFork: location.state?.isFork,
        parentId: location.state?.parentId, // ✅ [추가] 원본 출처 ID 릴레이 유지
        originalAnalysisData: location.state?.originalAnalysisData // ✅ [추가] 변경률 검증용 원본 데이터 릴레이 유지
      } 
    });
  };

  const goToTableBuilder = () => {
    navigate('/layout-table', { 
      state: { 
        ...location.state, 
        savedSignatureRows: signatureRows,
        docTitle,
        appr1,
        appr2,
        appr3,
        isFork: location.state?.isFork,
        parentId: location.state?.parentId, // ✅ [추가] 다음 단계로 원본 출처 ID 릴레이
        originalAnalysisData: location.state?.originalAnalysisData // ✅ [추가] 다음 단계로 변경률 검증용 원본 데이터 릴레이
      } 
    });
  };

  // 6분할 Colgroup을 활용한 수평적 행 구조 렌더링 및 Info 데이터 바인딩
  const renderUnifiedHeader = () => {
    const commonTdStyle = { border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center', color: '#000' };
    const labelTdStyle = { ...commonTdStyle, backgroundColor: '#f2f2f2', fontWeight: 'bold', whiteSpace: 'nowrap' };
    const checkboxItemStyle = { display: 'inline-block', marginRight: '10px', whiteSpace: 'nowrap' };

    const ppeOthers = formData?.ppe?.filter(p => !['안전모','안전화','보안경','장갑','방진마스크'].includes(p)).join(', ');
    const permitOthers = formData?.permits?.filter(p => !['일반','화기','밀폐','정전','고소','중량물','굴착'].includes(p)).join(', ');

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={labelTdStyle}>작업명</td>
            <td style={{...commonTdStyle, fontWeight: 'bold'}}>{formData?.projectName || ''}</td>
            <td colSpan={2} style={{ ...commonTdStyle, fontSize: '18px', fontWeight: 'bold', verticalAlign: 'middle' }}>
              {docTitle}
            </td>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ borderRight: '1px solid #000', width: '20px', writingMode: 'vertical-rl', textAlign: 'center', backgroundColor: '#f2f2f2', fontWeight: 'bold', color: '#000', borderTop: 'none', borderBottom: 'none' }}>결재</td>
                    <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr1}</td>
                    <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr2}</td>
                    <td style={{ borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr3}</td>
                  </tr>
                  <tr>
                    <td style={{ borderRight: '1px solid #000', height: '45px' }}></td>
                    <td style={{ borderRight: '1px solid #000' }}></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style={labelTdStyle}>작업구역</td>
            <td style={commonTdStyle}>{formData?.workLocation || ''}</td>
            <td style={labelTdStyle}>수행부서</td>
            <td style={commonTdStyle}>{formData?.department || ''}</td>
            <td style={labelTdStyle}>수행일자</td>
            <td style={commonTdStyle}>{formData?.workDate || ''}</td>
          </tr>

          <tr>
            <td style={labelTdStyle}>개인보호구</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '6px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전모') ? '☑' : '□'} 안전모</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전화') ? '☑' : '□'} 안전화</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('보안경') ? '☑' : '□'} 보안경</span>
                <span style={checkboxItemStyle}>□ 안전대</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('방진마스크') ? '☑' : '□'} 방진/방독마스크</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('장갑') ? '☑' : '□'} 안전장갑</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {ppeOthers ? '☑' : '□'} 기타(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{ppeOthers}</span>)
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td style={labelTdStyle}>고위험작업</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '6px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('화기') ? '☑' : '□'} 화기</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('밀폐') ? '☑' : '□'} 밀폐</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('정전') ? '☑' : '□'} 정전/활선</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('고소') ? '☑' : '□'} 고소</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('중량물') ? '☑' : '□'} 중량물취급</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('굴착') ? '☑' : '□'} 굴착</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {permitOthers ? '☑' : '□'} 기타(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{permitOthers}</span>)
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderModulePreview = () => {
    const commonTdStyle = { border: '1px solid #000', padding: '6px', fontSize: '10px', textAlign: 'center', color: '#000' };
    const labelTdStyle = { ...commonTdStyle, backgroundColor: '#f2f2f2', fontWeight: 'bold', width: '10%' };

    const sigRows = Array.from({ length: signatureRows }, (_, i) => i);
    const cols = Array.from({ length: 8 }, (_, i) => i);
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td rowSpan={signatureRows} style={{...labelTdStyle, borderTop: 'none'}}>참여자</td>
            {cols.map(c => {
              const pName = participants?.[c] || '';
              return (
                <td key={`sig-0-${c}`} style={{...commonTdStyle, width: '11.25%', height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'bottom', color: '#000', borderTop: 'none'}}>
                  {pName && <span style={{float: 'left', paddingLeft: '4px', fontWeight: 'bold'}}>{pName}</span>}
                  <span style={{color: '#888'}}>(인)</span>
                </td>
              );
            })}
          </tr>
          {sigRows.slice(1).map(r => (
            <tr key={`sig-row-${r}`}>
              {cols.map(c => {
                const pIdx = r * 8 + c;
                const pName = participants?.[pIdx] || '';
                return (
                  <td key={`sig-${r}-${c}`} style={{...commonTdStyle, height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'bottom', color: '#000'}}>
                    {pName && <span style={{float: 'left', paddingLeft: '4px', fontWeight: 'bold'}}>{pName}</span>}
                    <span style={{color: '#888'}}>(인)</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderDynamicLayout = () => {
    const TableBlock = (
      <div key="table-block" style={{...styles.previewBlock, backgroundColor: 'rgba(40, 167, 69, 0.05)', border: '2px dashed #28a745', borderTop: 'none', padding: '40px 10px', margin: '0 0 -1px 0'}}>
        <div style={{ color: '#28a745', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}>[위험성 평가 데이터 테이블 구역]</div>
        <div style={{ textAlign: 'center', color: '#28a745', fontSize: '0.8rem', marginTop: '5px' }}>Step 5에서 설정한 컬럼 데이터가 이 위치에 자동으로 삽입됩니다.</div>
      </div>
    );

    let layoutElements = [];
    layoutElements.push(renderModulePreview());
    layoutElements.push(TableBlock);

    return layoutElements;
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            
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
              <p style={{color: '#aaa', marginTop: '8px', fontSize: '0.9rem'}}>JSA 본문 헤더 정보 및 안전작업허가(PTW) 부가 요소를 설정합니다.</p>
            </div>

            <div style={styles.builderLayout}>
              <aside style={styles.toolbarSliding}>
                
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>문서 헤더 텍스트 설정</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={styles.inputFieldCompact}>
                      <span style={styles.inputLabel}>문서 제목</span>
                      <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} style={styles.panelInput} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={styles.inputFieldCompact}>
                        <span style={styles.inputLabel}>결재란 1</span>
                        <input type="text" value={appr1} onChange={(e) => setAppr1(e.target.value)} style={styles.panelInput} />
                      </div>
                      <div style={styles.inputFieldCompact}>
                        <span style={styles.inputLabel}>결재란 2</span>
                        <input type="text" value={appr2} onChange={(e) => setAppr2(e.target.value)} style={styles.panelInput} />
                      </div>
                      <div style={styles.inputFieldCompact}>
                        <span style={styles.inputLabel}>결재란 3</span>
                        <input type="text" value={appr3} onChange={(e) => setAppr3(e.target.value)} style={styles.panelInput} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>서명란 설정</h3>
                  <div style={{...styles.inputFieldCompact, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <span style={styles.inputLabel}>서명란 줄 추가 (1줄 = 8명)</span>
                    <div style={styles.buttonGroupSmall}>
                      <button onClick={() => setSignatureRows(Math.max(1, signatureRows - 1))} style={styles.miniBtnControl}>-</button>
                      <span style={{ color: '#007bff', fontSize: '1rem', width: '24px', textAlign: 'center', fontWeight: 'bold' }}>{signatureRows}</span>
                      <button onClick={() => setSignatureRows(signatureRows + 1)} style={styles.miniBtnControl}>+</button>
                    </div>
                  </div>
                </div>

              </aside>

              <section style={styles.previewPanel}>
                <div style={styles.previewHeader}>문서 구조 미리보기 (구상도)</div>
                <div style={styles.previewCanvas}>
                  {/* 통합된 너비 및 폰트 세팅 반영 */}
                  <div style={styles.documentSheet}>
                    {renderUnifiedHeader()}
                    <div style={{ width: '100%' }}>
                      {renderDynamicLayout()}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div style={styles.btnAreaLayout}>
              <button style={styles.prevBtnDark} onClick={goBackToAnalysis}>이전 단계 (위험 분석)</button>
              <button style={styles.nextBtnLight} onClick={goToTableBuilder}>다음: 데이터 표 구성 (Step 5)</button>
            </div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
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
mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 2rem 20px', zIndex: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '160px' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 },  formCard: { width: '100%', maxWidth: '1550px', height: '85vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.8)' },
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
  toolTitleMini: { color: '#aaa', fontSize: '0.85rem', fontWeight: '900', borderLeft: '3px solid #007bff', paddingLeft: '8px', margin: 0 },
  inputFieldCompact: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  inputLabel: { fontSize: '0.75rem', color: '#ccc', fontWeight: 'bold' },
  panelInput: { width: '100%', padding: '6px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  buttonGroupSmall: { display: 'flex', gap: '6px', alignItems: 'center' },
  miniBtnControl: { width: '28px', height: '28px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewPanel: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  previewHeader: { padding: '1rem', backgroundColor: '#111', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #333', textAlign: 'center' },
  previewCanvas: { flex: 1, overflow: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#333' },
  
  // Export 화면과 일치하도록 폭, 폰트, Box-sizing 등 속성 통일
  documentSheet: { 
    backgroundColor: '#fff', 
    width: '1080px', 
    minHeight: '750px', 
    padding: '40px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
    display: 'flex', 
    flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: '"Malgun Gothic", sans-serif',
    margin: '0 auto'
  },
  
  previewBlock: { width: '100%', backgroundColor: 'transparent', border: 'none' },
  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#007bff', color: '#fff', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' }
};