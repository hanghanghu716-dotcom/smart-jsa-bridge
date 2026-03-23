import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { useTranslation } from 'react-i18next';

/**
 * [ModuleBuilder 컴포넌트 - 결재 라벨 레이아웃 최적화본]
 * 역할: Step 4. 문서 모듈 구성 (OSHA 영문 결재란 침범 문제 해결)
 * 에디터 위치: src/pages/ModuleBuilder.jsx
 */

export default function ModuleBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['modulebuilder']);
  
  const isEnglish = i18n.language?.startsWith('en');

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

  const [docTitle, setDocTitle] = useState(savedDocTitle || t('default.docTitle', '위험성평가표 (JSA)'));
  const [appr1, setAppr1] = useState(savedAppr1 || t('default.appr1', '작성'));
  const [appr2, setAppr2] = useState(savedAppr2 || t('default.appr2', '검토'));
  const [appr3, setAppr3] = useState(savedAppr3 || t('default.appr3', '승인'));

  const goBackToAnalysis = () => {
    navigate('/analysis', { 
      state: { 
        ...location.state,
        isFork: location.state?.isFork,
        parentId: location.state?.parentId,
        originalAnalysisData: location.state?.originalAnalysisData
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
        parentId: location.state?.parentId,
        originalAnalysisData: location.state?.originalAnalysisData
      } 
    });
  };

  const renderUnifiedHeader = () => {
    const commonTdStyle = { border: '1px solid #000', padding: '6px', fontSize: '11px', textAlign: 'center', color: '#000' };
    
    const labelTdStyle = { 
      ...commonTdStyle, 
      backgroundColor: '#f2f2f2', 
      fontWeight: 'bold', 
      whiteSpace: isEnglish ? 'normal' : 'nowrap',
      fontSize: isEnglish ? '10px' : '11px',
      lineHeight: '1.2'
    };

    const checkboxItemStyle = { display: 'inline-block', marginRight: '10px', whiteSpace: 'nowrap', fontSize: isEnglish ? '10px' : '11px' };

    const ppeOthers = formData?.ppe?.filter(p => !['안전모','안전화','보안경','장갑','방진마스크'].includes(p)).join(', ');
    const permitOthers = formData?.permits?.filter(p => !['일반','화기','밀폐','정전','고소','중량물','굴착'].includes(p)).join(', ');

    const adaptiveContainerStyle = {
      display: isEnglish ? 'grid' : 'flex',
      gridTemplateColumns: isEnglish ? 'repeat(3, 1fr)' : 'none',
      gap: isEnglish ? '4px' : '0',
      width: '100%',
      alignItems: 'center',
      textAlign: 'left'
    };

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: isEnglish ? '15%' : '12%' }} />
          <col style={{ width: isEnglish ? '15%' : '18%' }} />
          <col style={{ width: isEnglish ? '12%' : '10%' }} />
          <col style={{ width: isEnglish ? '28%' : '30%' }} />
          <col style={{ width: isEnglish ? '12%' : '10%' }} />
          <col style={{ width: isEnglish ? '18%' : '20%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={labelTdStyle}>{t('table.projectName')}</td>
            <td style={{...commonTdStyle, fontWeight: 'bold', wordBreak: 'break-all'}}>{formData?.projectName || ''}</td>
            <td colSpan={2} style={{ ...commonTdStyle, fontSize: isEnglish ? '16px' : '18px', fontWeight: 'bold', verticalAlign: 'middle' }}>
              {docTitle}
            </td>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    {/* [기능 추가]: 영문 시 스택 구조 레이아웃 적용으로 텍스트 침범 해결 */}
                    <td rowSpan={2} style={{ 
                      borderRight: '1px solid #000', 
                      width: isEnglish ? '60px' : '20px', 
                      writingMode: isEnglish ? 'horizontal-tb' : 'vertical-rl', 
                      textAlign: 'center', 
                      backgroundColor: '#f2f2f2', 
                      fontWeight: 'bold', 
                      color: '#000', 
                      padding: '4px 2px'
                    }}>
                      {isEnglish ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '9px', lineHeight: '1.1' }}>
                          <span>Compliance</span>
                          <span>Approval</span>
                        </div>
                      ) : t('table.approval')}
                    </td>
                    <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr1}</td>
                    <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr2}</td>
                    <td style={{ borderBottom: '1px solid #000', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none' }}>{appr3}</td>
                  </tr>
                  <tr><td style={{ borderRight: '1px solid #000', height: '45px' }}></td><td style={{ borderRight: '1px solid #000' }}></td><td></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style={labelTdStyle}>{t('table.workLocation')}</td>
            <td style={{...commonTdStyle, wordBreak: 'break-all'}}>{formData?.workLocation || ''}</td>
            <td style={labelTdStyle}>{t('table.department')}</td>
            <td style={commonTdStyle}>{formData?.department || ''}</td>
            <td style={labelTdStyle}>{t('table.workDate')}</td>
            <td style={commonTdStyle}>{formData?.workDate || ''}</td>
          </tr>

          <tr>
            <td style={labelTdStyle}>{t('table.ppe')}</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '8px' }}>
              <div style={adaptiveContainerStyle}>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전모') ? '☑' : '□'} {t('ppe.helmet')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전화') ? '☑' : '□'} {t('ppe.shoes')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('보안경') ? '☑' : '□'} {t('ppe.glasses')}</span>
                <span style={checkboxItemStyle}>□ {t('ppe.safetyBelt')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('방진마스크') ? '☑' : '□'} {t('ppe.mask')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('장갑') ? '☑' : '□'} {t('ppe.gloves')}</span>
                <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: isEnglish ? '10px' : '11px' }}>
                  {ppeOthers ? '☑' : '□'} {t('ppe.etc')}(<span style={{ color: '#000', padding: '0 4px' }}>{ppeOthers}</span>)
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td style={labelTdStyle}>{t('table.highRiskWork')}</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '8px' }}>
              <div style={{...adaptiveContainerStyle, gridTemplateColumns: isEnglish ? 'repeat(4, 1fr)' : 'none'}}>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('화기') ? '☑' : '□'} {t('permit.hotWork')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('밀폐') ? '☑' : '□'} {t('permit.confinedSpace')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('정전') ? '☑' : '□'} {t('permit.electrical')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('고소') ? '☑' : '□'} {t('permit.highElevation')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('중량물') ? '☑' : '□'} {t('permit.heavyLifting')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('굴착') ? '☑' : '□'} {t('permit.excavation')}</span>
                <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: isEnglish ? '10px' : '11px' }}>
                  {permitOthers ? '☑' : '□'} {t('permit.etc')}(<span style={{ color: '#000', padding: '0 4px' }}>{permitOthers}</span>)
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
            <td rowSpan={signatureRows} style={{...labelTdStyle, borderTop: 'none', whiteSpace: isEnglish ? 'normal' : 'nowrap'}}>{t('table.participants')}</td>
            {cols.map(c => {
              const pName = participants?.[c] || '';
              return (
                <td key={`sig-0-${c}`} style={{...commonTdStyle, width: '11.25%', height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'bottom', color: '#000', borderTop: 'none'}}>
                  {pName && <span style={{float: 'left', paddingLeft: '4px', fontWeight: 'bold'}}>{pName}</span>}
                  <span style={{color: '#888'}}>{t('table.signature')}</span>
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
                    <span style={{color: '#888'}}>{t('table.signature')}</span>
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
        <div style={{ color: '#28a745', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }}>{t('preview.tableAreaTitle')}</div>
        <div style={{ textAlign: 'center', color: '#28a745', fontSize: '0.8rem', marginTop: '5px' }}>{t('preview.tableAreaDesc')}</div>
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
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.basicInfo')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.procedure')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.riskAnalysis')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>{t('step.moduleConfig')}</span></div><div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>{t('step.tableConfig')}</span></div><div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>{t('step.finalOutput')}</span></div>
            </nav>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{t('header.title')}</h2>
              <p style={{color: '#aaa', marginTop: '8px', fontSize: '0.9rem'}}>{t('header.subtitle')}</p>
            </div>
            <div style={styles.builderLayout}>
              <aside style={styles.toolbarSliding}>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>{t('toolbar.headerTextSetting')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={styles.inputFieldCompact}><span style={styles.inputLabel}>{t('toolbar.docTitle')}</span><input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} style={styles.panelInput} /></div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={styles.inputFieldCompact}><span style={styles.inputLabel}>{t('toolbar.appr1')}</span><input type="text" value={appr1} onChange={(e) => setAppr1(e.target.value)} style={styles.panelInput} /></div>
                      <div style={styles.inputFieldCompact}><span style={styles.inputLabel}>{t('toolbar.appr2')}</span><input type="text" value={appr2} onChange={(e) => setAppr2(e.target.value)} style={styles.panelInput} /></div>
                      <div style={styles.inputFieldCompact}><span style={styles.inputLabel}>{t('toolbar.appr3')}</span><input type="text" value={appr3} onChange={(e) => setAppr3(e.target.value)} style={styles.panelInput} /></div>
                    </div>
                  </div>
                </div>
                <div style={styles.toolSectionCompact}>
                  <h3 style={styles.toolTitleMini}>{t('toolbar.signatureSetting')}</h3>
                  <div style={{...styles.inputFieldCompact, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <span style={styles.inputLabel}>{t('toolbar.addSignatureRow')}</span>
                    <div style={styles.buttonGroupSmall}>
                      <button onClick={() => setSignatureRows(Math.max(1, signatureRows - 1))} style={styles.miniBtnControl}>-</button>
                      <span style={{ color: '#007bff', fontSize: '1rem', width: '24px', textAlign: 'center', fontWeight: 'bold' }}>{signatureRows}</span>
                      <button onClick={() => setSignatureRows(signatureRows + 1)} style={styles.miniBtnControl}>+</button>
                    </div>
                  </div>
                </div>
              </aside>
              <section style={styles.previewPanel}>
                <div style={styles.previewHeader}>{t('preview.header')}</div>
                <div style={styles.previewCanvas}>
                  <div style={styles.documentSheet}>{renderUnifiedHeader()}<div style={{ width: '100%' }}>{renderDynamicLayout()}</div></div>
                </div>
              </section>
            </div>
            <div style={styles.btnAreaLayout}>
              <button style={styles.prevBtnDark} onClick={goBackToAnalysis}>{t('btn.prev')}</button>
              <button style={styles.nextBtnLight} onClick={goToTableBuilder}>{t('btn.next')}</button>
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
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 },
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
  toolbarSliding: { width: '320px', backgroundColor: 'rgba(24, 24, 24, 0.95)', border: '1px solid #333', borderRadius: '10px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'auto' },
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
  documentSheet: { backgroundColor: '#fff', width: '1080px', minHeight: '750px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', fontFamily: '"Malgun Gothic", sans-serif', margin: '0 auto' },
  previewBlock: { width: '100%', backgroundColor: 'transparent', border: 'none' },
  btnAreaLayout: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
  prevBtnDark: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtnLight: { flex: 2, padding: '1rem', backgroundColor: '#007bff', color: '#fff', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.05rem' }
};