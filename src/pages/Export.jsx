import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner'; 

// [핵심] 지능형 키워드 맵 - 실제 산업현장 JSA 및 9대 고위험 가이드 반영
const EXTENDED_KEYWORD_MAP = {
  "건설/토목": ["건축", "토목", "콘크리트", "철근", "거푸집", "타설", "철골", "조적", "미장", "도장", "가설"],
  "제조/가공": ["컨베이어", "회전체", "프레스", "사출", "압출", "조립", "가공", "기계설비", "동력원"],
  "화공/플랜트": ["배관", "밸브", "펌프", "반응기", "열교환기", "컴프레서", "퍼지", "기밀시험", "블라인드", "플랜지", "누출"],
  "전기/통신": ["배전반", "수배전반", "전신주", "케이블", "포설", "통신망"],
  "고소작업": ["사다리", "비계", "고소작업대", "렌탈", "달비계", "지붕", "개구부", "슬라브", "추락", "떨어짐", "안전대", "생명줄"],
  "화기작업": ["용접", "절단", "그라인더", "산소", "아세틸렌", "불티", "토치", "화재", "폭발", "용단", "비산방지포"],
  "밀폐공간": ["맨홀", "탱크", "핏트", "반응기", "산소결핍", "황화수소", "유해가스", "환기", "송풍기", "질식", "농도측정"],
  "전기/정전작업": ["정전", "활선", "LOTO", "감전", "접지", "차단기", "절연", "아크", "검전기"],
  "중장비운용": ["지게차", "굴착기", "포크레인", "덤프트럭", "펌프카", "고소작업차", "사각지대", "충돌", "부딪힘", "협착", "신호수"],
  "중량물취급": ["크레인", "호이스트", "슬링벨트", "샤클", "인양", "줄걸이", "타워크레인", "낙하", "유도로프", "타격"],
  "굴착작업": ["터파기", "흙막이", "붕괴", "매몰", "동바리", "사면", "안식각", "지보공"],
  "유해화학/가스": ["가연성", "인화성", "독성", "산", "알칼리", "MSDS", "화상", "중독", "방독마스크", "가스검지기"],
  "끼임/협착": ["말림", "끼임", "협착", "회전부", "기어", "롤러", "방호덮개", "연동장치"],
  "전도/넘어짐": ["미끄러짐", "넘어짐", "전도", "정리정돈", "장애물", "통로", "조도", "결빙"]
};

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

  // [신규 로직] 자동 태그 추출 함수
  const extractAutoTags = () => {
    // 분석 데이터 전체(위험요인+대책)와 프로젝트 제목을 하나의 텍스트로 결합
    const combinedContent = (JSON.stringify(analysisData) + (formData.projectName || "")).toLowerCase();
    const tags = new Set();

    Object.entries(EXTENDED_KEYWORD_MAP).forEach(([tag, keywords]) => {
      if (keywords.some(kw => combinedContent.includes(kw))) {
        tags.add(tag);
      }
    });

    return Array.from(tags);
  };

  const handleCloudAction = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");

      // 1. 저장 시 자동 태깅 수행
      const autoTags = extractAutoTags();

      const projectData = {
        author_id: user.id,
        title: isFork ? `[복제] ${formData.projectName}` : (formData.projectName || "제목 없는 JSA"),
        form_data: formData,
        participants: participants,
        analysis_data: analysisData,
        tags: autoTags, // 🔑 추출된 태그 배열 저장
        is_public: true, 
        updated_at: new Date(),
      };

      if (existingId && !isFork) { projectData.id = existingId; }

      const { error: projectError } = await supabase
        .from('jsa_projects')
        .upsert(projectData, { onConflict: 'id' });

      if (projectError) throw projectError;

      alert("클라우드 저장 및 자동 태그 분류가 완료되었습니다.");
      navigate('/dashboard');
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
}

const styles = {
  // [기존 디자인 규격 유지]
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', zIndex: 10, overflow: 'hidden' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', height: '94%' },
  formCard: { width: '100%', maxWidth: '1440px', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' },
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

// 스크롤바/애니메이션 스타일
if (typeof document !== 'undefined') {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } } .loader-spinner { width: 32px; height: 32px; border: 3px solid rgba(0, 123, 255, 0.2); border-top-color: #007bff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }`;
  document.head.appendChild(styleTag);
}