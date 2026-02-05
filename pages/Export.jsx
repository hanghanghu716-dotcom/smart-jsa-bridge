import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AdBanner from '../AdBanner'; 

export default function Export() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { 
    analysisData: initialData = [], 
    formData = {}, 
    participants = [], 
    procedures = [] 
  } = location.state || {};

  const [analysisData, setAnalysisData] = useState(initialData);

  // 애니메이션 스피너 주입
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      @keyframes spin { to { transform: rotate(360deg); } }
      .loader-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0, 123, 255, 0.2);
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  const handleEdit = () => {
    navigate('/analysis', { state: { analysisData, formData, participants, procedures } });
  };

  const handleCheck = (index, value) => {
    const newData = [...analysisData];
    newData[index].checkStatus = newData[index].checkStatus === value ? null : value;
    setAnalysisData(newData);
  };

  const generatePDF = async () => {
    const paper = document.querySelector('.reportPaper');
    if (!paper) return null;

    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      const pageLimitY = 210 - margin;

      const capture = async (query) => {
        const el = paper.querySelector(query);
        if (!el) return null;
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        return {
          img: canvas.toDataURL('image/png'),
          h: (canvas.height * contentWidth) / canvas.width
        };
      };

      let currentY = margin;
      const sections = ['.reportTopSection', '.infoGridTable', '.partSub', '.participantTable', '.analSub'];

      for (const selector of sections) {
        const data = await capture(selector);
        if (data) {
          doc.addImage(data.img, 'PNG', margin, currentY, contentWidth, data.h);
          currentY += data.h + (selector.includes('Sub') ? 1 : 4);
        }
      }

      const tableHeaderCanvas = await html2canvas(paper.querySelector('.analysisTable thead'), { scale: 3 });
      const tableHeaderImg = tableHeaderCanvas.toDataURL('image/png');
      const tableHeaderH = (tableHeaderCanvas.height * contentWidth) / tableHeaderCanvas.width;
      doc.addImage(tableHeaderImg, 'PNG', margin, currentY, contentWidth, tableHeaderH);
      currentY += tableHeaderH;

      const rows = paper.querySelectorAll('.analysisTable tbody tr');
      for (const row of rows) {
        const rowCanvas = await html2canvas(row, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const rowImg = rowCanvas.toDataURL('image/png');
        const rowH = (rowCanvas.height * contentWidth) / rowCanvas.width;

        if (currentY + rowH > pageLimitY) {
          doc.addPage();
          currentY = margin;
          doc.addImage(tableHeaderImg, 'PNG', margin, currentY, contentWidth, tableHeaderH);
          currentY += tableHeaderH;
        }
        doc.addImage(rowImg, 'PNG', margin, currentY, contentWidth, rowH);
        currentY += rowH;
      }
      return doc;
    } catch (error) {
      console.error("PDF 생성 오류:", error);
      return null;
    }
  };

  const triggerAction = (type) => {
    setPendingAction(type);
    setIsModalOpen(true);
    setIsProcessing(true);
    // 인위적인 지연을 주어 광고 노출 및 처리 프로세스 시각화
    setTimeout(() => { setIsProcessing(false); }, 3000);
  };

  const executeFinalAction = async () => {
    setIsProcessing(true); // 실제 생성 단계에서 다시 활성화
    const doc = await generatePDF();
    if (doc) {
      if (pendingAction === 'preview') {
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
      } else {
        doc.save(`JSA_Report_${formData.projectName || 'export'}.pdf`);
      }
      setIsProcessing(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{isProcessing ? "데이터 정밀 처리 중..." : "리포트 구성 완료"}</h3>
              <p style={styles.modalSub}>{isProcessing ? "A4 규격에 맞춰 행 분할 및 무결성 검사를 진행 중입니다." : "선언하신 작업의 보고서 데이터가 준비되었습니다."}</p>
            </div>
            
            <div style={styles.virtualAdBox}>
              <div style={styles.adBadge}>AD</div>
              <div style={styles.adContent}>
                <h4 style={styles.adTitle}>SafeWork AI Cloud</h4>
                <p style={styles.adText}>더 빠르고 정밀한 위험성 평가, Smart JSA Bridge Pro로 업그레이드 하세요.</p>
                <div style={styles.adMockBtn}>무료 체험하기</div>
              </div>
            </div>

            <div style={styles.modalBtnArea}>
              {isProcessing ? (
                <div style={styles.loaderContainer}>
                  <div className="loader-spinner"></div>
                  <div style={styles.loaderTexts}>
                    <p style={styles.loaderMainText}>시스템이 페이지 레이아웃을 최적화하고 있습니다.</p>
                    <p style={styles.loaderSubText}>잠시만 기다려 주십시오...</p>
                  </div>
                </div>
              ) : (
                <>
                  <button style={styles.modalActionBtn} onClick={executeFinalAction}>
                    {pendingAction === 'preview' ? "PDF 미리보기 열기" : "보고서 PDF 저장"}
                  </button>
                  <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>취소</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print"><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd} className="no-print">
          <AdBanner slot="5000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper} className="no-print">
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>최종 출력</span></div>
            </nav>

            <div style={styles.previewArea} className="preview-area">
              <div className="reportPaper" style={styles.reportPaper}>
                {/* 보고서 내부 테이블 및 레이아웃은 기존 코드 유지 */}
                <div className="reportTopSection" style={styles.reportTopSection}>
                  <div style={styles.titleWrapper}>
                    <h2 style={styles.reportTitle}>작업안전분석(JSA) 작업시트</h2>
                    <p style={styles.reportSubTitle}>(Job Safety Analysis Worksheet)</p>
                  </div>
                  <div style={styles.approvalSection}>
                    <div style={styles.approvalBox}><div style={styles.approvalLabel}>검토</div><div style={styles.approvalSign}></div></div>
                    <div style={styles.approvalBox}><div style={styles.approvalLabel}>승인</div><div style={styles.approvalSign}></div></div>
                  </div>
                </div>

                <table className="infoGridTable" style={styles.infoGridTable}>
                  <tbody>
                    <tr><th style={styles.hLabel}>작업명</th><td style={styles.hValue} colSpan="3">{formData.projectName}</td></tr>
                    <tr><th style={styles.hLabel}>작업지역</th><td style={styles.hValue}>{formData.workLocation}</td><th style={styles.hLabel}>수행부서</th><td style={styles.hValue}>{formData.department}</td></tr>
                  </tbody>
                </table>

                <div className="tableSubtitle partSub" style={styles.tableSubtitle}>[ 위험성 평가 참여자 확인 ]</div>
                <table className="participantTable" style={styles.participantTable}>
                  <tbody>
                    <tr>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <td key={i} style={styles.pSigCell}>
                          <span style={styles.pSigName}>{participants[i] || '.'}</span>
                          <span style={styles.pSigMark}>(인)</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                <div className="tableSubtitle analSub" style={styles.tableSubtitle}>[ 상세 유해·위험요인 분석 및 안전대책 ]</div>
                <table className="analysisTable" style={styles.analysisTable}>
                  <thead>
                    <tr><th style={styles.atH} rowSpan="2">No</th><th style={styles.atH} rowSpan="2">작업단계</th><th style={styles.atH} rowSpan="2">유해·위험요인</th><th style={styles.atH} rowSpan="2">감소권고대책</th><th style={styles.atH} colSpan="3">리스크 평가</th><th style={styles.atH} rowSpan="2">확인</th></tr>
                    <tr><th style={styles.atHSmall}>중대성</th><th style={styles.atHSmall}>기능성</th><th style={styles.atHSmall}>위험성</th></tr>
                  </thead>
                  <tbody>
                    {analysisData.map((step, i) => (
                      <tr key={i}>
                        <td style={styles.atCenterNo}>{i + 1}</td>
                        <td style={styles.atStepTitle}>{step.proc.stepTitle}</td>
                        <td style={styles.atRiskFactor}>{step.risks.map((r, idx) => <div key={idx}>• {r.factor}</div>)}</td>
                        <td style={styles.atMeasure}>{step.risks.map((r, idx) => <div key={idx}>• {r.measure}</div>)}</td>
                        <td style={styles.atCenterSmall}>{step.frequency}</td>
                        <td style={styles.atCenterSmall}>{step.severity}</td>
                        <td style={{ ...styles.atCenterSmall, fontWeight: '700', color: step.riskLevel >= 9 ? '#d32f2f' : '#1976d2' }}>{step.riskLevel}</td>
                        <td style={styles.atCheck}>
                          <div style={styles.checkWrap}>
                            <label style={styles.miniLabel}><input type="checkbox" checked={step.checkStatus === 'YES'} onChange={() => handleCheck(i, 'YES')} style={styles.rectInput} /> YES</label>
                            <label style={styles.miniLabel}><input type="checkbox" checked={step.checkStatus === 'NO'} onChange={() => handleCheck(i, 'NO')} style={styles.rectInput} /> NO</label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={handleEdit}>내용 수정</button>
              <button style={{ ...styles.prevBtn, flex: 1, backgroundColor: '#f4f4f4', color: '#333' }} onClick={() => triggerAction('preview')}>PDF 미리보기</button>
              <button style={styles.nextBtn} onClick={() => triggerAction('download')}>JSA 보고서 저장</button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd} className="no-print">
          <AdBanner slot="5000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea} className="no-print">
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="5000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // 스테퍼 교정: flex-shrink 추가 및 정렬 보정
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 },
  stepBadgeDone: { width: '26px', height: '26px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', flexShrink: 0 },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 },
  stepBadgeActive: { width: '26px', height: '26px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', flexShrink: 0 },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '40px', height: '1.5px', backgroundColor: '#4caf50', flexShrink: 0 },

  // 모달 및 로딩 레이아웃
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  modalContent: { width: '550px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' },
  modalHeader: { marginBottom: '1.5rem' },
  modalTitle: { color: '#fff', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.6rem' },
  modalSub: { color: '#666', fontSize: '0.85rem' },
  
  virtualAdBox: { backgroundColor: '#000', border: '1px solid #222', borderRadius: '10px', padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' },
  adBadge: { fontSize: '0.6rem', color: '#444', border: '1px solid #444', padding: '1px 5px', borderRadius: '3px', float: 'right' },
  adTitle: { color: '#007bff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' },
  adText: { color: '#888', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' },
  adMockBtn: { display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#222', color: '#fff', borderRadius: '4px', fontSize: '0.75rem' },
  
  loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' },
  loaderTexts: { textAlign: 'center' },
  loaderMainText: { color: '#fff', fontSize: '0.95rem', fontWeight: '600', margin: '0 0 4px 0' },
  loaderSubText: { color: '#555', fontSize: '0.8rem', margin: 0 },

  modalBtnArea: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  modalActionBtn: { width: '100%', padding: '1.1rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '800', fontSize: '1rem' },
  modalCloseBtn: { color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' },

  // 기존 래퍼 및 레이아웃 스타일
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10, overflow: 'hidden' },
  sideAd: { flexShrink: 0, width: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', height: '94%' },
  formCard: { width: '100%', maxWidth: '1440px', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' },
  previewArea: { flex: 1, overflowY: 'auto', backgroundColor: '#fff', borderRadius: '4px', padding: '2.5rem', marginBottom: '1rem' },
  reportPaper: { color: '#000', fontFamily: '"Malgun Gothic", sans-serif' },
  infoGridTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000', marginBottom: '1rem' },
  participantTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000' },
  analysisTable: { width: '100%', borderCollapse: 'collapse', border: '2.5px solid #000' },
  pSigCell: { border: '1px solid #000', width: '10%', height: '28px', padding: '0 6px', verticalAlign: 'middle', textAlign: 'center' },
  pSigName: { fontSize: '11px', fontWeight: '500', display: 'inline-block' },
  pSigMark: { float: 'right', fontSize: '11px', fontWeight: 'bold', color: '#333', lineHeight: '28px' },
  atRiskFactor: { border: '1px solid #000', padding: '8px', verticalAlign: 'top', minWidth: '300px', fontSize: '9px', lineHeight: '1.4' },
  atMeasure: { border: '1px solid #000', padding: '8px', verticalAlign: 'top', minWidth: '350px', fontSize: '9px', lineHeight: '1.4' },
  reportTopSection: { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '1.5rem', minHeight: '90px' },
  reportTitle: { fontSize: '2.2rem', fontWeight: '900', margin: 0, borderBottom: '2px solid #000', paddingBottom: '5px' },
  reportSubTitle: { fontSize: '0.95rem', color: '#666', marginTop: '0.5rem' },
  approvalSection: { position: 'absolute', right: 0, top: 0, display: 'flex', border: '1.5px solid #000' },
  approvalBox: { width: '75px', borderLeft: '1px solid #000' },
  approvalLabel: { borderBottom: '1px solid #000', textAlign: 'center', padding: '3px', backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '11px' },
  approvalSign: { height: '60px' },
  hLabel: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', width: '100px', textAlign: 'center', fontWeight: 'bold' },
  hValue: { border: '1px solid #000', padding: '8px', fontSize: '12px', textAlign: 'left' },
  tableSubtitle: { fontSize: '12px', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.4rem', color: '#444' },
  atH: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' },
  atHSmall: { border: '1px solid #000', backgroundColor: '#fafafa', padding: '4px', fontSize: '10px', textAlign: 'center', width: '40px' },
  atCenterNo: { border: '1px solid #000', textAlign: 'center', padding: '8px', fontSize: '11px', width: '35px' },
  atStepTitle: { border: '1px solid #000', padding: '8px', fontSize: '11px', fontWeight: '500', width: '120px', backgroundColor: '#fcfcfc' },
  atCenterSmall: { border: '1px solid #000', textAlign: 'center', padding: '8px', fontSize: '11px', width: '40px' },
  atCheck: { border: '1px solid #000', width: '85px', textAlign: 'center', padding: '4px 0' },
  checkWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  miniLabel: { fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  rectInput: { width: '13px', height: '13px', margin: '0 3px 0 0', cursor: 'pointer' },
  btnArea: { marginTop: '1.5rem', display: 'flex', gap: '1.2rem' },
  prevBtn: { flex: 1, padding: '0.9rem', backgroundColor: 'transparent', color: '#9e9e9e', border: '1px solid #424242', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '0.9rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  footerArea: { width: '100%', padding: '0.5rem 5rem 1.5rem', zIndex: 10 },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
};