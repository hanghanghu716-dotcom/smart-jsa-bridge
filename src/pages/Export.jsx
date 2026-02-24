import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner'; 
import { extractAutoTagsFromJSA } from '../utils/TagDictionary';

export default function Export() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { 
    id: existingId = null, 
    isFork = false,
    analysisData: initialData = [], 
    formData = {}, 
    participants = [], 
    procedures = [] 
  } = location.state || {};

  const [analysisData, setAnalysisData] = useState(initialData);

  // ✅ [교정] 구형 함수의 잔재(return Array.from(tags); };)를 삭제하여 함수 흐름을 정상화함

  const handleCloudAction = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");

      // ✅ [교정] 300종 다차원 태그 모듈을 사용하여 정밀 태깅 수행
      const autoTags = extractAutoTagsFromJSA(formData.projectName || "", analysisData);

      const projectData = {
        author_id: user.id,
        title: isFork ? `[복제] ${formData.projectName}` : (formData.projectName || "제목 없는 JSA"),
        form_data: formData,
        participants: participants,
        analysis_data: analysisData,
        tags: autoTags, 
        is_public: true, 
        updated_at: new Date(),
      };

      if (existingId && !isFork) { projectData.id = existingId; }

      const { error: projectError } = await supabase
        .from('jsa_projects')
        .upsert(projectData, { onConflict: 'id' });

      if (projectError) throw projectError;

      alert("클라우드 저장 및 자동 태그 분류가 완료되었습니다.");
      navigate('/library');
    } catch (error) {
      alert(`처리 실패: ${error.message}`);
    } finally { setIsProcessing(false); }
  };

  const generatePDF = async () => {
    const paper = document.querySelector('.reportPaper');
    if (!paper) return null;
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297; const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      const pageLimitY = 210 - margin;

      const capture = async (query) => {
        const el = paper.querySelector(query);
        if (!el) return null;
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        return { img: canvas.toDataURL('image/png'), h: (canvas.height * contentWidth) / canvas.width };
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
          doc.addPage(); currentY = margin;
          doc.addImage(tableHeaderImg, 'PNG', margin, currentY, contentWidth, tableHeaderH);
          currentY += tableHeaderH;
        }
        doc.addImage(rowImg, 'PNG', margin, currentY, contentWidth, rowH);
        currentY += rowH;
      }
      return doc;
    } catch (error) { return null; }
  };

  const triggerAction = (type) => {
    setPendingAction(type); setIsModalOpen(true); setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); }, 2500);
  };

  const executeFinalAction = async () => {
    setIsProcessing(true);
    const doc = await generatePDF();
    if (doc) {
      if (pendingAction === 'preview') window.open(URL.createObjectURL(doc.output('blob')), '_blank');
      else doc.save(`JSA_Report_${formData.projectName || 'export'}.pdf`);
      setIsProcessing(false); setIsModalOpen(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{isProcessing ? "데이터 정밀 처리 중..." : "리포트 구성 완료"}</h3>
              <p style={styles.modalSub}>{isProcessing ? "A4 규격 최적화 및 레이아웃 분할 중입니다." : "데이터 준비가 완료되었습니다."}</p>
            </div>
            <div style={styles.modalBtnArea}>
              {isProcessing ? (
                <div style={styles.loaderContainer}><div className="loader-spinner"></div><p style={styles.loaderMainText}>시스템 처리 중...</p></div>
              ) : (
                <>
                  <button style={styles.modalActionBtn} onClick={executeFinalAction}>{pendingAction === 'preview' ? "PDF 미리보기" : "PDF 저장"}</button>
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
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper} className="no-print">
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div>
              <div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div>
              <div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div>
              <div style={styles.stepLineActive} /><div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>4</div><span style={styles.stepTextActive}>최종 출력</span></div>
            </nav>

            <div style={styles.previewArea}>
              <div className="reportPaper" style={styles.reportPaper}>
                <div className="reportTopSection" style={styles.reportTopSection}>
                  <div style={styles.titleWrapper}><h2 style={styles.reportTitle}>작업안전분석(JSA) 작업시트</h2></div>
                  <div style={styles.approvalSection}><div style={styles.approvalBox}><div style={styles.approvalLabel}>검토</div><div style={styles.approvalSign}></div></div><div style={styles.approvalBox}><div style={styles.approvalLabel}>승인</div><div style={styles.approvalSign}></div></div></div>
                </div>
                <table style={styles.infoGridTable} className="infoGridTable">
                  <tbody>
                    <tr><th style={styles.hLabel}>작업명</th><td style={styles.hValue} colSpan="3">{formData.projectName}</td></tr>
                    <tr><th style={styles.hLabel}>작업지역</th><td style={styles.hValue}>{formData.workLocation}</td><th style={styles.hLabel}>수행부서</th><td style={styles.hValue}>{formData.department}</td></tr>
                  </tbody>
                </table>
                <div className="tableSubtitle partSub" style={styles.tableSubtitle}>[ 참여자 확인 ]</div>
                <table className="participantTable" style={styles.participantTable}><tbody><tr>{Array.from({ length: 10 }).map((_, i) => (<td key={i} style={styles.pSigCell}>{participants[i] || '.'} (인)</td>))}</tr></tbody></table>
                <div className="tableSubtitle analSub" style={styles.tableSubtitle}>[ 상세 분석 내역 ]</div>
                <table className="analysisTable" style={styles.analysisTable}>
                  <thead>
                    <tr><th style={styles.atH}>No</th><th style={styles.atH}>작업단계</th><th style={styles.atH}>위험요인</th><th style={styles.atH}>안전대책</th><th style={styles.atH}>위험도</th></tr>
                  </thead>
                  <tbody>
                    {analysisData.map((step, i) => (
                      <tr key={i}>
                        <td style={styles.atCenterNo}>{i + 1}</td><td style={styles.atStepTitle}>{step.proc.stepTitle}</td>
                        <td style={styles.atRiskFactor}>{step.risks.map((r, idx) => <div key={idx}>• {r.factor}</div>)}</td>
                        <td style={styles.atMeasure}>{step.risks.map((r, idx) => <div key={idx}>• {r.measure}</div>)}</td>
                        <td style={styles.atCenterSmall}>{step.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={() => navigate('/analysis', { state: { id: existingId, analysisData, formData, participants, procedures } })}>내용 수정</button>
              <button style={styles.nextBtn} onClick={handleCloudAction}>클라우드 저장 (자동 태깅)</button>
              <button style={styles.nextBtn} onClick={() => triggerAction('download')}>PDF 저장</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} // ✅ [교정] 컴포넌트 함수가 여기서 정상적으로 닫힘

const styles = {
  // ✅ [교정] 하단 흰색 공란 방지를 위해 배경색을 검은색으로 고정
  wrapper: { 
    position: 'relative', 
    height: '100vh', 
    width: '100%', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    backgroundColor: '#000' 
  },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  // ✅ [교정] 배경 이미지를 최상단/좌측에 고정
  bgImage: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100%', 
    height: '100%', 
    backgroundImage: 'url(/images/image4.jpg)', 
    backgroundSize: 'cover', 
    backgroundPosition: 'center', // 추가: 이미지 중앙 정렬
    filter: 'brightness(0.3)' 
  },
  dimOverlay: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    inset: 0, 
    background: 'rgba(0,0,0,0.4)', 
    zIndex: 1 
  },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer' },
  // ✅ [교정] 하단 여백을 충분히 확보하여 공란 발생 억제
  mainLayout: { 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 5rem 60px', 
    zIndex: 10, 
    overflow: 'hidden' 
  },
  centerContent: { 
    flex: 1, 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center' // height '94%' 제거 후 중앙 정렬로 대체
  },
  // ✅ [교정] 항목 수에 상관없이 카드 크기를 유지하여 하단 공란 수축 방지
  formCard: { 
    width: '100%', 
    maxWidth: '1440px', 
    height: '78vh', // 고정 높이 부여
    backgroundColor: 'rgba(18, 18, 18, 0.98)', 
    border: '1px solid rgba(255, 255, 255, 0.12)', 
    borderRadius: '12px', 
    padding: '2rem 2.5rem', 
    display: 'flex', 
    flexDirection: 'column',
    overflow: 'hidden', // 내부 요소 넘침 방지
    boxShadow: '0 40px 80px rgba(0,0,0,0.9)'
  },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeDone: { width: '26px', height: '26px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeActive: { width: '26px', height: '26px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '40px', height: '1.5px', backgroundColor: '#4caf50' },
  previewArea: { flex: 1, overflowY: 'auto', backgroundColor: '#fff', borderRadius: '4px', padding: '2.5rem', marginBottom: '1rem' },
  reportPaper: { color: '#000', fontFamily: '"Malgun Gothic", sans-serif' },
  reportTopSection: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative' },
  reportTitle: { fontSize: '2rem', fontWeight: '900', borderBottom: '2px solid #000' },
  approvalSection: { position: 'absolute', right: 0, top: 0, display: 'flex', border: '1px solid #000' },
  approvalBox: { width: '70px', borderLeft: '1px solid #000' },
  approvalLabel: { borderBottom: '1px solid #000', textAlign: 'center', fontSize: '10px', backgroundColor: '#f5f5f5' },
  approvalSign: { height: '50px' },
  infoGridTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '1rem' },
  hLabel: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', width: '100px', fontWeight: 'bold' },
  hValue: { border: '1px solid #000', padding: '8px', fontSize: '11px' },
  tableSubtitle: { fontSize: '11px', fontWeight: 'bold', margin: '10px 0 5px' },
  participantTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000' },
  pSigCell: { border: '1px solid #000', width: '10%', height: '30px', fontSize: '10px', textAlign: 'center' },
  analysisTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000' },
  atH: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '8px', fontSize: '11px', fontWeight: 'bold' },
  atCenterNo: { border: '1px solid #000', textAlign: 'center', fontSize: '11px', width: '30px' },
  atStepTitle: { border: '1px solid #000', padding: '8px', fontSize: '11px', width: '120px' },
  atRiskFactor: { border: '1px solid #000', padding: '8px', fontSize: '10px' },
  atMeasure: { border: '1px solid #000', padding: '8px', fontSize: '10px' },
  atCenterSmall: { border: '1px solid #000', textAlign: 'center', fontSize: '11px', width: '40px' },
  btnArea: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '0.8rem', backgroundColor: 'transparent', color: '#9e9e9e', border: '1px solid #424242', borderRadius: '4px', cursor: 'pointer' },
  nextBtn: { flex: 2, padding: '0.8rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { width: '400px', backgroundColor: '#111', padding: '2rem', borderRadius: '12px', textAlign: 'center' },
  modalTitle: { color: '#fff', marginBottom: '10px' },
  modalSub: { color: '#666', fontSize: '0.8rem', marginBottom: '20px' },
  modalBtnArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  modalActionBtn: { padding: '0.8rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  modalCloseBtn: { color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
  loaderContainer: { padding: '20px' },
  loaderMainText: { color: '#fff', marginTop: '10px' }
};

// ✅ 스크롤 기능을 전역적으로 복원하되, 지저분한 스크롤바만 보이지 않게 처리
if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-global-style";
  let styleTag = document.getElementById(styleId);
  
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    /* 1. 브라우저 기본 배경과 높이 설정 (스크롤 차단 해제) */
    html, body, #root { 
      min-height: 100%; 
      margin: 0; 
      padding: 0; 
      background-color: #000 !important;
      overflow-y: auto !important; /* 🌟 핵심: 모든 페이지에서 휠 작동 허용 */
    }

    /* 2. 스크롤바의 시각적 형태만 제거 (모든 브라우저 대응) */
    * { 
      -ms-overflow-style: none !important; 
      scrollbar-width: none !important; 
      outline: none !important; 
    }
    *::-webkit-scrollbar { 
      display: none !important; 
    }
  `;
}