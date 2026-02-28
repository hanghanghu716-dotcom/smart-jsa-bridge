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
  
  // ✅ [추가] 서명 및 성함 표시를 위한 사용자 프로필 상태
  const [userProfile, setUserProfile] = useState(null);

  const { 
    id: existingId = null, 
    isFork = false,
    analysisData: initialData = [], 
    formData = {}, 
    participants = [], 
    procedures = [] 
  } = location.state || {};

  const jsaType = formData.jsaType || '2-step'; 
  const [analysisData, setAnalysisData] = useState(initialData);

  // ✅ [추가] 페이지 로드 시 서명 정보 가져오기
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, signature_url')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogoClick = () => {
    if (window.confirm("메인 화면으로 이동하시겠습니까? 작성 중인 데이터가 모두 삭제될 수 있습니다.")) {
      navigate('/');
    }
  };

  const handleCloudAction = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");

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
        // ✅ [참고] 서명 이미지 캡처를 위해 useCORS: true 유지
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
              <h3 style={styles.modalTitle}>{isProcessing ? "리포트 렌더링 중..." : "최종 구성 완료"}</h3>
              <p style={styles.modalSub}>{isProcessing ? "서명 데이터 및 레이아웃을 최적화하고 있습니다." : "문서 준비가 완료되었습니다."}</p>
            </div>
            <div style={styles.modalBtnArea}>
              {isProcessing ? (
                <div style={styles.loaderContainer}><p style={styles.loaderMainText}>시스템 처리 중...</p></div>
              ) : (
                <>
                  <button style={styles.modalActionBtn} onClick={executeFinalAction}>{pendingAction === 'preview' ? "PDF 미리보기" : "PDF 파일 저장"}</button>
                  <button style={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>취소</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print">
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
      </header>

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
                  <div style={styles.approvalSection}>
                    {/* ✅ [수정] 작성란에 서명 및 성함 자동 삽입 */}
                    <div style={styles.approvalBox}>
                      <div style={styles.approvalLabel}>작성</div>
                      <div style={styles.approvalSign}>
                        {userProfile?.signature_url && (
                          <img src={userProfile.signature_url} alt="Sign" style={styles.signatureImg} />
                        )}
                        <div style={styles.signatureName}>{userProfile?.username || '(인)'}</div>
                      </div>
                    </div>
                    <div style={styles.approvalBox}><div style={styles.approvalLabel}>검토</div><div style={styles.approvalSign} /></div>
                    <div style={styles.approvalBox}><div style={styles.approvalLabel}>승인</div><div style={styles.approvalSign} /></div>
                  </div>
                </div>

                <table style={styles.infoGridTable} className="infoGridTable">
                  <tbody>
                    <tr><th style={styles.hLabel}>작업명</th><td style={styles.hValue} colSpan="3"><strong>{formData.projectName}</strong> ({jsaType === '2-step' ? '기본 2단계' : '심화 3단계'})</td></tr>
                    <tr>
                      <th style={styles.hLabel}>작업지역</th><td style={styles.hValue}>{formData.workLocation || '-'}</td>
                      <th style={styles.hLabel}>수행부서</th><td style={styles.hValue}>{formData.department || '-'}</td>
                    </tr>
                    <tr>
                      <th style={styles.hLabel}>작업일자</th><td style={styles.hValue}>{formData.workDate || '-'}</td>
                      <th style={styles.hLabel}>책임자</th><td style={styles.hValueRight}>{formData.managerName || '-'} (인)</td>
                    </tr>
                  </tbody>
                </table>

                <div className="tableSubtitle partSub" style={styles.tableSubtitle}>[ 참여자 확인 ]</div>
                <table className="participantTable" style={styles.participantTable}>
                  <tbody>
                    <tr>{Array.from({ length: 7 }).map((_, i) => (<td key={i} style={styles.pSigCell}>{participants[i] || '.'} (인)</td>))}</tr>
                    <tr>{Array.from({ length: 7 }).map((_, i) => (<td key={i+7} style={styles.pSigCell}>{participants[i+7] || '.'} (인)</td>))}</tr>
                  </tbody>
                </table>

                <div className="tableSubtitle analSub" style={styles.tableSubtitle}>[ 상세 위험성평가 내역 ]</div>
                <table className="analysisTable" style={styles.analysisTable}>
                  <thead>
                    <tr>
                      <th style={styles.atH_No}>No</th>
                      <th style={styles.atH_Step}>작업단계</th>
                      <th style={styles.atH_Content}>유해·위험요인</th>
                      {jsaType === '2-step' ? (
                        <th style={styles.atH_Content}>안전대책 (감소대책)</th>
                      ) : (
                        <>
                          <th style={styles.atH_Content}>현재 안전대책</th>
                          <th style={styles.atH_Content}>추가 감소대책</th>
                        </>
                      )}
                      <th style={styles.atH_Score}>빈도</th>
                      <th style={styles.atH_Score}>강도</th>
                      <th style={styles.atH_Risk}>위험도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.map((step, i) => (
                      <tr key={i}>
                        <td style={styles.atCenterNo}>{i + 1}</td>
                        <td style={styles.atStepTitle}>{step.proc.stepTitle}</td>
                        <td style={styles.atRiskFactor}>
                          {step.risks.map((r, idx) => <div key={idx} style={styles.bulletItem}>• {r.factor}</div>)}
                        </td>
                        {jsaType === '2-step' ? (
                          <td style={styles.atMeasure}>
                            {step.risks.map((r, idx) => <div key={idx} style={styles.bulletItem}>• {r.measure}</div>)}
                          </td>
                        ) : (
                          <>
                            <td style={styles.atMeasure}>
                              {step.risks.map((r, idx) => <div key={idx} style={styles.bulletItem}>• {r.current_measure}</div>)}
                            </td>
                            <td style={styles.atMeasure}>
                              {step.risks.map((r, idx) => <div key={idx} style={styles.bulletItem}>• {r.recommend_measure}</div>)}
                            </td>
                          </>
                        )}
                        <td style={styles.atCenterSmall}>{step.frequency}</td>
                        <td style={styles.atCenterSmall}>{step.severity}</td>
                        <td style={styles.atCenterRisk}>{step.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={() => navigate('/analysis', { state: { existingId, analysisData, formData, participants, procedures } })}>내용 수정</button>
              <button style={styles.nextBtn} onClick={handleCloudAction}>클라우드 저장 (자동 태깅)</button>
              <button style={styles.nextBtn} onClick={() => triggerAction('download')}>PDF 파일 생성 및 저장</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 60px', zIndex: 10, overflow: 'hidden' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '78vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeDone: { width: '26px', height: '26px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeActive: { width: '26px', height: '26px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '40px', height: '1.5px', backgroundColor: '#4caf50' },
  previewArea: { flex: 1, overflowY: 'auto', backgroundColor: '#fff', borderRadius: '4px', padding: '3rem', marginBottom: '1rem' },
  reportPaper: { color: '#000', fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif', width: '100%' },
  reportTopSection: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative' },
  reportTitle: { fontSize: '2.2rem', fontWeight: '900', borderBottom: '3px double #000', paddingBottom: '5px', letterSpacing: '4px' },
  approvalSection: { position: 'absolute', right: 0, top: 0, display: 'flex', border: '1.5px solid #000' },
  approvalBox: { width: '80px', borderLeft: '1px solid #000' },
  approvalLabel: { borderBottom: '1px solid #000', textAlign: 'center', fontSize: '11px', backgroundColor: '#f0f0f0', padding: '3px 0', fontWeight: 'bold' },
  approvalSign: { height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  
  // ✅ [추가] 서명 이미지 및 텍스트 성함 스타일
  signatureImg: { width: '100%', height: '80%', objectFit: 'contain', position: 'absolute', top: '2px' },
  signatureName: { fontSize: '10px', color: '#333', fontWeight: 'bold', zIndex: 2, marginTop: 'auto', paddingBottom: '2px' },
  
  infoGridTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '1.5rem' },
  hLabel: { border: '1px solid #000', backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px', width: '120px', fontWeight: 'bold', textAlign: 'center' },
  hValue: { border: '1px solid #000', padding: '10px', fontSize: '12px', textAlign: 'left' },
  hValueRight: { border: '1px solid #000', padding: '10px', fontSize: '12px', textAlign: 'right', paddingRight: '20px' },
  tableSubtitle: { fontSize: '13px', fontWeight: 'bold', margin: '15px 0 8px', color: '#333' },
  participantTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000' },
  pSigCell: { border: '1px solid #000', width: '14.28%', height: '40px', fontSize: '11px', textAlign: 'right', paddingRight: '10px', verticalAlign: 'middle' },
  analysisTable: { width: '100%', borderCollapse: 'collapse', border: '2px solid #000' },
  atH_No: { border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '10px', fontSize: '12px', fontWeight: 'bold', width: '40px', textAlign: 'center' },
  atH_Step: { border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '10px', fontSize: '12px', fontWeight: 'bold', width: '110px', textAlign: 'center' },
  atH_Content: { border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' },
  atH_Score: { border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '10px', fontSize: '12px', fontWeight: 'bold', width: '35px', textAlign: 'center', whiteSpace: 'nowrap' },
  atH_Risk: { border: '1px solid #000', backgroundColor: '#f0f0f0', padding: '10px', fontSize: '12px', fontWeight: 'bold', width: '50px', textAlign: 'center', whiteSpace: 'nowrap' },
  atCenterNo: { border: '1px solid #000', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' },
  atStepTitle: { border: '1px solid #000', padding: '12px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' },
  atRiskFactor: { border: '1px solid #000', padding: '12px', fontSize: '11px', textAlign: 'left', verticalAlign: 'top', lineHeight: '1.6' },
  atMeasure: { border: '1px solid #000', padding: '12px', fontSize: '11px', textAlign: 'left', verticalAlign: 'top', lineHeight: '1.6' },
  atCenterSmall: { border: '1px solid #000', textAlign: 'center', fontSize: '11px', verticalAlign: 'middle' },
  atCenterRisk: { border: '1px solid #000', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', verticalAlign: 'middle' },
  bulletItem: { marginBottom: '8px', paddingLeft: '15px', textIndent: '-15px' },
  btnArea: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '0.8rem', backgroundColor: 'transparent', color: '#9e9e9e', border: '1px solid #424242', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  nextBtn: { flex: 2, padding: '0.8rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '900', fontSize: '0.9rem' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { width: '400px', backgroundColor: '#111', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #222' },
  modalTitle: { color: '#fff', marginBottom: '10px', fontSize: '1.2rem', fontWeight: '800' },
  modalSub: { color: '#666', fontSize: '0.8rem', marginBottom: '25px' },
  modalBtnArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  modalActionBtn: { padding: '0.8rem', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  modalCloseBtn: { color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' },
  loaderContainer: { padding: '20px' },
  loaderMainText: { color: '#fff', marginTop: '10px', fontSize: '0.85rem' }
};