import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';

/**
 * [Export 컴포넌트]
 * 역할: Step 5. 관리용 스타일을 중화하고 실무용 흑백 양식으로 최종 PDF를 출력합니다.
 * 에디터 위치: src/pages/Export.jsx
 */
export default function Export() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 
  
  const { existingId = null, analysisData = [], formData = {}, participants = [], procedures = [], customLayout = {}, savedBindingStartRow = 17, savedOrientation = 'landscape' } = location.state || {};

  const jsaType = formData.jsaType || '2-step';
  const COLS = savedOrientation === 'landscape' ? 56 : 40; 
  const BASE_CELL_SIZE = 20;
  const BINDING_ROW_HEIGHT = 3; 

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('username, signature_url').eq('id', user.id).single();
          setUserProfile(data);
        }
      } catch (err) { console.error("Profile fetch error:", err); }
    };
    fetchProfile();
  }, []);

  const [stepPhotos, setStepPhotos] = useState({});
  const [activePhotoRow, setActivePhotoRow] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setStepPhotos(prev => ({ ...prev, [activePhotoRow]: event.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogoClick = () => { if (window.confirm("메인 화면으로 이동하시겠습니까?")) navigate('/'); };

  const handleCloudAction = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");
      const autoTags = [formData.projectName, ...(analysisData.map(d => d.proc?.stepTitle))].filter(Boolean);
      const projectData = { user_id: user.id, project_name: formData.projectName, form_data: formData, analysis_data: analysisData, custom_layout: customLayout, auto_tags: autoTags, updated_at: new Date() };
      const { error } = await supabase.from('jsa_projects').upsert(projectData);
      if (error) throw error;
      alert("클라우드 저장 및 자동 태깅이 완료되었습니다.");
    } catch (err) { alert("저장 중 오류 발생: " + err.message); } finally { setIsProcessing(false); }
  };

  const renderCell = (cell, targetR, targetC, stepIdx = -1, stepData = null) => {
    if (cell.hidden) return null;
    let content = cell.text || "";
    const isBinding = !!cell.bindingType;
    
    const finalBg = isBinding ? '#fff' : (cell.bg || '#fff');
    const finalBorder = isBinding ? '1px solid #000' : (cell.border || 'none');
    const finalColor = isBinding ? '#000' : (cell.color || '#000');

    if (isBinding && stepData) {
      if (cell.bindingType === 'DATA_STEP_NO') content = String(stepIdx + 1);
      else if (cell.bindingType === 'DATA_STEP_TITLE') content = stepData.proc?.stepTitle || "";
      else if (cell.bindingType === 'DATA_HAZARD') content = stepData.risks.map(r => `• ${r.factor}`).join('\n');
      else if (cell.bindingType === 'DATA_CURRENT_MEASURE') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.current_measure}`).join('\n');
      else if (cell.bindingType === 'DATA_RECOMMEND_MEASURE') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.recommend_measure}`).join('\n');
      else if (cell.bindingType === 'DATA_SEVERITY') content = String(stepData.severity || "-");
      else if (cell.bindingType === 'DATA_FREQUENCY') content = String(stepData.frequency || "-");
      else if (cell.bindingType === 'DATA_RISK') content = String(stepData.riskLevel || "-");
      if (cell.bindingType === 'DATA_PHOTO') {
        return ( <div key={`photo-${stepIdx}`} onClick={() => { setActivePhotoRow(stepIdx); fileInputRef.current.click(); }} style={{ gridRow: `${targetR + 1} / span 1`, gridColumn: `${targetC + 1} / span ${cell.colSpan || 1}`, border: '1px solid #000', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}> {stepPhotos[stepIdx] ? <img src={stepPhotos[stepIdx]} style={{width:'100%', height:'100%', objectFit:'contain'}} alt="Sign" /> : <span style={{color:'#ccc', fontSize:'10px'}}>+ 사진</span>} </div> );
      }
    }
    if (cell.bindingType?.startsWith('USER_')) content = cell.text ? cell.text.replace(/\[|\]/g, "") : "";
    const finalRowSpan = isBinding ? 1 : (cell.rowSpan || 1);

    // ✅ [교정] 첫 문장 치우침 현상 해결을 위해 textIndent 제거 및 padding 정렬
    const hasBullet = content.includes('•');

    return (
      <div key={`${targetR}-${targetC}`} style={{
        gridRow: `${targetR + 1} / span ${finalRowSpan}`, gridColumn: `${targetC + 1} / span ${cell.colSpan || 1}`,
        border: finalBorder, backgroundColor: finalBg, color: finalColor,
        padding: '6px 4px', fontSize: cell.fontSize || '11px', fontWeight: cell.bold ? 'bold' : 'normal', textDecoration: cell.underline ? 'underline' : 'none', 
        display: 'flex', alignItems: 'center', justifyContent: cell.align || 'center',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', boxSizing: 'border-box',
        paddingLeft: hasBullet ? '14px' : '6px', // 일관된 왼쪽 여백 부여
        textIndent: '0' // 첫 문장만 튀어나가는 현상 방지
      }}>{content}</div>
    );
  };

  const renderFinalGrid = () => {
    const elements = [];
    const cellEntries = Object.entries(customLayout).map(([key, val]) => ({ r: parseInt(key.split('-')[0]), c: parseInt(key.split('-')[1]), ...val }));
    cellEntries.filter(c => c.r < savedBindingStartRow).forEach(c => elements.push(renderCell(c, c.r, c.c)));
    const bindingRootCells = cellEntries.filter(c => c.r === savedBindingStartRow && c.bindingType);
    analysisData.forEach((step, idx) => {
      const currentR = savedBindingStartRow + idx;
      bindingRootCells.forEach(c => elements.push(renderCell(c, currentR, c.c, idx, step)));
    });
    const rowOffset = (analysisData.length - 1) - (BINDING_ROW_HEIGHT - 1);
    cellEntries.filter(c => c.r >= savedBindingStartRow + BINDING_ROW_HEIGHT).forEach(c => elements.push(renderCell(c, c.r + rowOffset, c.c)));
    
    return ( 
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${COLS}, ${BASE_CELL_SIZE}px)`, 
        gridAutoRows: `minmax(${BASE_CELL_SIZE}px, auto)`, 
        width: `${COLS * BASE_CELL_SIZE}px`, 
        backgroundColor: '#fff', 
        margin: '0 auto'
      }}> 
        {elements} 
      </div> 
    );
  };

  const generatePDF = async () => {
    setIsProcessing(true);
    const paper = document.querySelector('.reportPaper');
    const grid = paper?.querySelector('div[style*="display: grid"]');
    if (!paper || !grid) return setIsProcessing(false);

    try {
      const canvas = await html2canvas(paper, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      const doc = new jsPDF(savedOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const pxToMm = contentWidth / (imgWidthPx / 2);
      const contentHeightMm = (imgHeightPx / 2) * pxToMm;

      const paperRect = paper.getBoundingClientRect();
      const cellBottoms = Array.from(grid.children)
        .map(c => (c.getBoundingClientRect().bottom - paperRect.top) * pxToMm)
        .sort((a, b) => a - b);

      let leftHeightMm = contentHeightMm;
      let positionMm = 0;

      // ✅ [교정] 루프 조건 강화하여 잔여 여백 무시 (빈 페이지 방지)
      while (leftHeightMm > 2) {
        let maxPageHeightMm = pageHeight - (margin * 2);
        let sliceHeightMm = leftHeightMm > maxPageHeightMm ? maxPageHeightMm : leftHeightMm;
        
        // ✅ [교정] 행 잘림 방지를 위해 현재 페이지 한계점 내 최적 절단면 탐색
        if (leftHeightMm > maxPageHeightMm) {
          const targetBottom = positionMm + maxPageHeightMm;
          const validBottoms = cellBottoms.filter(b => b > positionMm + 2 && b <= targetBottom);
          
          if (validBottoms.length > 0) {
            sliceHeightMm = Math.max(...validBottoms) - positionMm;
          }
        }

        const sourceY = (positionMm / pxToMm) * 2;
        const sourceH = (sliceHeightMm / pxToMm) * 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidthPx;
        tempCanvas.height = sourceH;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, imgWidthPx, sourceH, 0, 0, imgWidthPx, sourceH);
        
        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeightMm);
        
        leftHeightMm -= sliceHeightMm;
        positionMm += sliceHeightMm;

        // ✅ [교정] 남은 컨텐츠가 확실히 있을 때만 새 페이지 추가
        if (leftHeightMm > 2) {
          doc.addPage();
        }
      }

      doc.save(`JSA_Report_${formData.projectName || 'final'}.pdf`);
    } catch (error) { alert("PDF 생성 실패"); } finally { setIsProcessing(false); }
  };

  return (
    <div style={styles.wrapper}>
      {isProcessing && <div style={styles.modalOverlay}><div style={styles.loaderText}>데이터 처리 중...</div></div>}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print"><h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="5000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper} className="no-print"><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>양식 설정</span></div><div style={styles.stepLineActive} /><div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>5</div><span style={styles.stepTextActive}>최종 출력</span></div></nav>
            <div style={styles.formHeader}><h2 style={styles.formTitle}>| 05. 최종 출력</h2></div>
            <div style={styles.previewArea}><div className="reportPaper" style={styles.reportPaper}>{renderFinalGrid()}</div></div>
            <div style={styles.btnArea} className="no-print"><button style={styles.prevBtn} onClick={() => navigate('/layoutbuilder', { state: location.state })}>내용 수정</button><button style={{...styles.nextBtn, backgroundColor: '#007bff', color: '#fff'}} onClick={handleCloudAction}>클라우드 저장 (자동 태깅)</button><button style={styles.nextBtn} onClick={generatePDF}>PDF 파일 생성 및 저장</button></div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="5000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' },
  bgWrapper: { position: 'fixed', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', filter: 'brightness(0.12)', backgroundPosition: 'center' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: '#fff', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 5rem 60px', zIndex: 10, gap: '3rem', overflow: 'hidden', alignItems: 'center' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1550px', height: '82vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.8rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '30px', height: '1px', backgroundColor: '#4caf50' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  previewArea: { flex: 1, overflowY: 'auto', backgroundColor: '#111', borderRadius: '10px', padding: '3rem', display: 'flex', justifyContent: 'center', border: '1px solid #333' },
  reportPaper: { 
    color: '#000', 
    backgroundColor: '#fff', 
    width: 'max-content', 
    height: 'auto', 
    display: 'table', 
    padding: '40px', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)', 
    boxSizing: 'border-box', 
    fontFamily: '"Malgun Gothic", sans-serif' 
  },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  loaderText: { color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-global-style";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) { styleTag = document.createElement("style"); styleTag.id = styleId; document.head.appendChild(styleTag); }
  styleTag.innerHTML = ` html, body, #root { min-height: 100%; margin: 0; padding: 0; background-color: #000 !important; overflow-y: auto !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; outline: none !important; } *::-webkit-scrollbar { display: none !important; } `;
}