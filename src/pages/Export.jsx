import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf'; 
import { supabase } from '../supabaseClient'; 
import AdBanner from '../AdBanner';
import { extractAutoTagsFromJSA, DIMENSIONAL_KEYWORD_MAP } from '../utils/TagDictionary'; 

const TAG_META = {
  'DATA_STEP_NO': { label: '작업\n번호', color: '#6c757d', width: 2, align: 'center' },
  'DATA_STEP_TITLE': { label: '작업단계', color: '#0d6efd', width: 4, align: 'left' },
  'DATA_PHOTO': { label: '관련사진', color: '#6f42c1', width: 3, align: 'center' },
  'DATA_HAZARD': { label: '유해위험요인', color: '#dc3545', isFlex: true, align: 'left' },
  'DATA_CURRENT_MEASURE': { label: '현재 안전대책', color: '#fd7e14', isFlex: true, align: 'left' },
  'DATA_RECOMMEND_MEASURE': { label: '감소권고대책', color: '#198754', isFlex: true, align: 'left' },
  'DATA_FREQUENCY': { label: '가능성(빈도)', color: '#20c997', width: 3, align: 'center' }, 
  'DATA_SEVERITY': { label: '중대성(강도)', color: '#20c997', width: 3, align: 'center' }, 
  'DATA_RISK': { label: '위험성', color: '#e83e8c', width: 3, align: 'center' },
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

export default function Export() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPdfAdModal, setShowPdfAdModal] = useState(false); 

  const { 
    existingId = null, 
    analysisData = [], 
    formData = {}, 
    participants = [], 
    procedures = [], 
    savedActiveOrder = [],
    savedUserColumns = [],
    savedOrientation = 'landscape',
    docTitle = '위험성평가표 (JSA)',
    appr1 = '작성',
    appr2 = '검토',
    appr3 = '승인',
    savedSignatureRows = 1
  } = location.state || {};

  const jsaType = formData.jsaType || '2-step';
  const COLS = savedOrientation === 'landscape' ? 56 : 40; 
  const PAPER_WIDTH = savedOrientation === 'landscape' ? '1080px' : '750px';

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

  const handleLogoClick = () => { navigate('/'); };

  const handleCloudAction = async (isPublic) => {
    setIsProcessing(true);
    setShowPublishModal(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("로그인이 필요한 서비스입니다.");

      // ✅ [보안 강화] 민감 정보(장소, 부서, 날짜, 작성자 등) 제거 로직
      const securedFormData = {
        ...formData,
        department: "",
        workLocation: "",
        workDate: "",
        managerName: "",
        equipment: "",
        additionalItems: ""
      };

      const rawAutoTags = extractAutoTagsFromJSA(formData.projectName || "", analysisData);
      const validTagKeys = Object.keys(DIMENSIONAL_KEYWORD_MAP);
      const standardizedTags = rawAutoTags.filter(tag => validTagKeys.includes(tag));

      const projectData = { 
        user_id: user.id, 
        author_id: user.id, 
        title: formData.projectName, 
        tags: standardizedTags, 
        is_public: isPublic, 
        project_name: formData.projectName, 
        auto_tags: standardizedTags, 
        form_data: securedFormData, // 보안 처리된 데이터 저장
        analysis_data: analysisData, 
        participants: [], // 참여자 명단 공란 처리
        custom_layout: { docTitle, appr1, appr2, appr3, savedSignatureRows, savedActiveOrder, savedUserColumns, savedOrientation }, 
        updated_at: new Date() 
      };

      const { error } = await supabase.from('jsa_projects').upsert(projectData);
      if (error) throw error;
      alert(isPublic ? "Explore에 보안 저장되었습니다." : "내 보관함에 보안 저장되었습니다.");
    } catch (err) { alert("저장 중 오류 발생: " + err.message); } finally { setIsProcessing(false); }
  };

  const generatePDF = async () => {
    setIsProcessing(true); const paper = document.querySelector('.reportPaper'); if (!paper) return setIsProcessing(false);
    try {
      window.scrollTo(0, 0); const canvas = await html2canvas(paper, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, imageTimeout: 0, scrollY: 0 });
      const imgWidthPx = canvas.width; const imgHeightPx = canvas.height; const doc = new jsPDF(savedOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 10; const contentWidth = pageWidth - (margin * 2); const pxToMm = contentWidth / imgWidthPx;
      const contentHeightMm = imgHeightPx * pxToMm; let leftHeightMm = contentHeightMm; let positionMm = 0; const paperRect = paper.getBoundingClientRect();
      const trElements = paper.querySelectorAll('tr'); const cutPointRatios = Array.from(trElements).map(el => (el.getBoundingClientRect().bottom - paperRect.top) / paperRect.height).sort((a, b) => a - b);
      while (leftHeightMm > 0) {
        let maxPageHeightMm = pageHeight - (margin * 2); let sliceHeightMm = leftHeightMm > maxPageHeightMm ? maxPageHeightMm : leftHeightMm;
        if (leftHeightMm > maxPageHeightMm) {
          const currentCanvasY = positionMm / pxToMm; const maxCanvasY = currentCanvasY + (maxPageHeightMm / pxToMm); let bestCutCanvasY = maxCanvasY; let foundCutPoint = false;
          for (let i = 0; i < cutPointRatios.length; i++) {
            const elBottomPx = cutPointRatios[i] * imgHeightPx;
            if (elBottomPx > currentCanvasY + 20 && elBottomPx <= maxCanvasY) { bestCutCanvasY = elBottomPx; foundCutPoint = true; } else if (elBottomPx > maxCanvasY) { break; }
          }
          if (foundCutPoint) sliceHeightMm = (bestCutCanvasY - currentCanvasY) * pxToMm;
        }
        const sourceY = positionMm / pxToMm; const sourceH = sliceHeightMm / pxToMm; const tempCanvas = document.createElement('canvas'); tempCanvas.width = imgWidthPx; tempCanvas.height = sourceH;
        const ctx = tempCanvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, Math.floor(sourceY), Math.floor(imgWidthPx), Math.floor(sourceH), 0, 0, Math.floor(imgWidthPx), Math.floor(sourceH));
        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeightMm);
        leftHeightMm -= sliceHeightMm; positionMm += sliceHeightMm; if (leftHeightMm > 0.1) doc.addPage();
      }
      doc.save(`JSA_Report_${formData.projectName || 'final'}.pdf`);
    } catch (error) { console.error(error); alert("PDF 생성 실패"); } finally { setIsProcessing(false); }
  };

  const handlePdfDownload = async () => { setShowPdfAdModal(false); await generatePDF(); };

  const renderUnifiedHeader = () => {
    const commonTdStyle = { border: '1px solid #888', padding: '2px 6px 10px 6px', fontSize: '11px', textAlign: 'center', verticalAlign: 'middle', color: '#000' };
    const labelTdStyle = { ...commonTdStyle, backgroundColor: '#f2f2f2', fontWeight: 'bold', whiteSpace: 'nowrap' };
    const checkboxItemStyle = { display: 'inline-block', marginRight: '10px', whiteSpace: 'nowrap' };
    const ppeOthers = formData?.ppe?.filter(p => !['안전모','안전화','보안경','장갑','방진마스크'].includes(p)).join(', ');
    const permitOthers = formData?.permits?.filter(p => !['일반','화기','밀폐','정전','고소','중량물','굴착'].includes(p)).join(', ');
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed', position: 'relative', zIndex: 1 }}>
        <colgroup><col style={{ width: '10%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '30%' }} /><col style={{ width: '10%' }} /><col style={{ width: '20%' }} /></colgroup>
        <tbody>
          <tr>
            <td style={labelTdStyle}>작업명</td>
            <td style={{...commonTdStyle, fontWeight: 'bold'}}>{formData?.projectName || ''}</td>
            <td colSpan={2} style={{ ...commonTdStyle, fontSize: '18px', fontWeight: 'bold', verticalAlign: 'middle', padding: '0px 6px 14px 6px' }}>{docTitle}</td>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #888' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ borderRight: '1px solid #888', width: '35px', textAlign: 'center', backgroundColor: '#f2f2f2', fontWeight: 'bold', color: '#000', borderTop: 'none', borderBottom: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0' }}>결<br />재</td>
                    <td style={{ borderRight: '1px solid #888', borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0' }}>{appr1}</td>
                    <td style={{ borderRight: '1px solid #888', borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0' }}>{appr2}</td>
                    <td style={{ borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0' }}>{appr3}</td>
                  </tr>
                  <tr><td style={{ borderRight: '1px solid #888', height: '45px' }}></td><td style={{ borderRight: '1px solid #888' }}></td><td></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={labelTdStyle}>작업구역</td><td style={commonTdStyle}>{formData?.workLocation || ''}</td>
            <td style={labelTdStyle}>수행부서</td><td style={commonTdStyle}>{formData?.department || ''}</td>
            <td style={labelTdStyle}>수행일자</td><td style={commonTdStyle}>{formData?.workDate || ''}</td>
          </tr>
          <tr>
            <td style={labelTdStyle}>개인보호구</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '2px 8px 10px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전모') ? '☑' : '□'} 안전모</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전화') ? '☑' : '□'} 안전화</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('보안경') ? '☑' : '□'} 보안경</span>
                <span style={checkboxItemStyle}>□ 안전대</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('방진마스크') ? '☑' : '□'} 방진/방독마스크</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('장갑') ? '☑' : '□'} 안전장갑</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>{ppeOthers ? '☑' : '□'} 기타(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{ppeOthers}</span>)</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={labelTdStyle}>고위험작업</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '2px 8px 10px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('화기') ? '☑' : '□'} 화기</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('밀폐') ? '☑' : '□'} 밀폐</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('정전') ? '☑' : '□'} 정전/활선</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('고소') ? '☑' : '□'} 고소</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('중량물') ? '☑' : '□'} 중량물취급</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('굴착') ? '☑' : '□'} 굴착</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>{permitOthers ? '☑' : '□'} 기타(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{permitOthers}</span>)</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderSignatureTable = () => {
    const commonTdStyle = { border: '1px solid #888', padding: '2px 6px 10px 6px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle', color: '#000' };
    const labelTdStyle = { ...commonTdStyle, border: '1px solid #888', backgroundColor: '#f2f2f2', fontWeight: 'bold', width: '10%' };
    const sigRows = Array.from({ length: savedSignatureRows }, (_, i) => i);
    const cols = Array.from({ length: 8 }, (_, i) => i);
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #888', tableLayout: 'fixed', marginTop: '-1px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>        
        <tbody>
          <tr>
            <td rowSpan={savedSignatureRows} style={labelTdStyle}>참여자</td>
            {cols.map(c => {
              const pName = participants?.[c] || '';
              return (
                <td key={`sig-0-${c}`} style={{...commonTdStyle, width: '11.25%', height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'middle', color: '#000'}}>
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
                  <td key={`sig-${r}-${c}`} style={{...commonTdStyle, height: '28px', textAlign: 'right', paddingRight: '4px', verticalAlign: 'middle', color: '#000'}}>
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

  const renderDataTable = () => {
    const commonTdStyle = { border: '1px solid #888', padding: '4px 4px 12px 4px', fontSize: '10.5px', verticalAlign: 'middle' };
    if (!savedActiveOrder || savedActiveOrder.length === 0) return null;
    const currentItems = savedActiveOrder.filter(key => TAG_META[key] || savedUserColumns.find(u => u.id === key));
    const fixedWidth = currentItems.reduce((sum, key) => {
      const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
      return sum + (meta?.isFlex ? 0 : (parseInt(meta?.width) || 5));
    }, 0);
    const flexItems = currentItems.filter(key => (TAG_META[key]?.isFlex || savedUserColumns.find(u => u.id === key)?.isFlex));
    const remaining = COLS - fixedWidth;
    let groups = []; let currentGroup = null;
    currentItems.forEach(key => {
      const groupDef = COLUMN_GROUPS.find(g => g.children.includes(key));
      if (groupDef) {
        if (currentGroup && currentGroup.label === groupDef.label) { currentGroup.keys.push(key); }
        else { if (currentGroup) groups.push(currentGroup); currentGroup = { label: groupDef.label, keys: [key], isGroup: true }; }
      } else { if (currentGroup) { groups.push(currentGroup); currentGroup = null; } groups.push({ label: null, keys: [key], isGroup: false }); }
    });
    if (currentGroup) groups.push(currentGroup);
    const hasGroups = groups.some(g => g.isGroup);
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
        <colgroup>{currentItems.map(key => {
            const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key);
            let pct = meta.isFlex ? (remaining / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
            return <col key={key} style={{ width: `${pct}%` }} />;
          })}</colgroup>
        <thead>
          <tr>{groups.map((group, idx) => {
              if (group.isGroup) { return ( <th key={`th-group-${idx}`} colSpan={group.keys.length} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold' }}>{group.label}</th> ); } 
              else {
                const key = group.keys[0]; const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key); let label = meta.label;
                if (key === 'DATA_FREQUENCY') label = "가능성\n(빈도)"; if (key === 'DATA_SEVERITY') label = "중대성\n(강도)";
                return ( <th key={`th-${key}`} rowSpan={hasGroups ? 2 : 1} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{label}</th> );
              }
            })}</tr>
        </thead>
        <tbody>
          {analysisData.map((stepData, stepIdx) => (
            <tr key={`tr-${stepIdx}`}>
              {currentItems.map((key) => {
                const meta = TAG_META[key] || savedUserColumns.find(u => u.id === key); let content = "";
                if (key === 'DATA_STEP_NO') content = String(stepIdx + 1);
                else if (key === 'DATA_STEP_TITLE' || key === 'DATA_KRAS_STEP') content = stepData.proc?.stepTitle || "";
                else if (key === 'DATA_HAZARD' || key === 'DATA_KRAS_HAZARD_DETAIL') content = stepData.risks.map(r => `• ${r.factor}`).join('\n');
                else if (key === 'DATA_CURRENT_MEASURE' || key === 'DATA_KRAS_CURRENT') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.current_measure}`).join('\n');
                else if (key === 'DATA_RECOMMEND_MEASURE' || key === 'DATA_KRAS_RECOMMEND') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.recommend_measure}`).join('\n');
                else if (key === 'DATA_SEVERITY' || key === 'DATA_KRAS_SEV') content = String(stepData.severity || "-");
                else if (key === 'DATA_FREQUENCY' || key === 'DATA_KRAS_FREQ') content = String(stepData.frequency || "-");
                else if (key === 'DATA_RISK' || key === 'DATA_KRAS_RISK') content = String(stepData.riskLevel || "-");
                else if (key === 'DATA_KRAS_HAZARD_CLASS') content = stepData.risks[0]?.category || "";
                if (key === 'DATA_PHOTO') { return ( <td key={`td-${key}-${stepIdx}`} onClick={() => { setActivePhotoRow(stepIdx); fileInputRef.current.click(); }} style={{ border: '1px solid #000', padding: '0', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer', overflow: 'hidden' }}> {stepPhotos[stepIdx] ? <img src={stepPhotos[stepIdx]} style={{width:'100%', height:'100%', objectFit:'contain', display: 'block'}} alt="Photo" /> : <span style={{color:'#ccc', fontSize:'10px'}}>+ 사진</span>} </td> ); }
                return ( <td key={`td-${key}-${stepIdx}`} style={{ ...commonTdStyle, textAlign: meta.align || 'center', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word' }}>{content}</td> );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={styles.wrapper}>
      {isProcessing && <div style={styles.processingOverlay}><div style={styles.loaderText}>데이터 처리 중...</div></div>}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print"><h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1></header>
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}><AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper} className="no-print">
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>위험 분석</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>모듈 구성</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>표 구성</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>6</div><span style={styles.stepTextActive}>최종 출력</span></div>
            </nav>
            <div style={styles.formHeader}><h2 style={styles.formTitle}>| 06. 최종 출력</h2></div>
            <div style={styles.previewArea}>
              <div className="reportPaper" style={{...styles.reportPaper, width: PAPER_WIDTH}}>
                {renderUnifiedHeader()}
                {renderSignatureTable()}
                {renderDataTable()}
              </div>
            </div>
            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={() => navigate('/layout-table', { state: location.state })}>테이블 구성 수정</button>
              <button style={styles.cloudSaveBtn} onClick={() => setShowPublishModal(true)}>클라우드 저장 (공개 범위 선택)</button>
              <button style={styles.pdfBtn} onClick={() => setShowPdfAdModal(true)}>PDF 파일 생성 및 저장</button>
            </div>
          </div>
        </main>
        <aside style={styles.sideAd}><AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
      </div>

      {showPdfAdModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPdfAdModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>PDF 리포트 생성</h3>
            <p style={styles.modalSub}>최종 결과물을 PDF 파일로 변환하여 다운로드합니다.</p>
            <div style={styles.modalAdWrapper}><AdBanner slot="9761676307" style={{ width: '100%', height: '90px' }} format="horizontal" /></div>
            <div style={{...styles.typeCardHighlight, marginBottom: '2rem'}} onClick={handlePdfDownload}>
              <div style={styles.typeBadgeActive}>Download</div>
              <h4 style={styles.typeLabel}>리포트 다운로드 시작</h4>
              <p style={styles.typeDesc}>고해상도 PDF 파일을 생성합니다.<br/>잠시만 기다려 주십시오.</p>
            </div>
            <button style={styles.modalCloseBtn} onClick={() => setShowPdfAdModal(false)}>닫기 (취소)</button>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPublishModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>클라우드 저장 설정</h3>
            {/* ✅ [안내 문구 추가] 보안 처리 알림 */}
              <p style={{
                ...styles.modalSub, 
                color: '#ff7675', 
                fontWeight: 'bold', 
                whiteSpace: 'pre-wrap', // 줄바꿈 활성화 속성
                lineHeight: '1.6'       // 줄 간격 최적화
              }}>
                ⚠️ 보안을 위해 부서, 장소, 날짜, 참여자 명단은 {"\n"} 공란으로 처리되어 저장됩니다.
              </p>
            <p style={styles.modalSub}>저장할 작업물의 공개 범위를 선택해 주십시오.</p>
            <div style={styles.modalAdWrapper}><AdBanner slot="9761676307" style={{ width: '100%', height: '90px' }} format="horizontal" /></div>
            <div style={styles.typeGrid}>
              <div style={styles.typeCardHighlight} onClick={() => handleCloudAction(true)}>
                <div style={styles.typeBadgeActive}>Public</div>
                <h4 style={styles.typeLabel}>Explore에 공개</h4>
                <p style={styles.typeDesc}>모든 사용자가 조회 가능하며<br/>안전 지식 공유에 기여합니다.</p>
              </div>
              <div style={styles.typeCard} onClick={() => handleCloudAction(false)}>
                <div style={styles.typeBadge}>Private</div>
                <h4 style={styles.typeLabel}>내 보관함 저장</h4>
                <p style={styles.typeDesc}>작성자 본인만 확인 가능하며<br/>개인 프로젝트로 관리됩니다.</p>
              </div>
            </div>
            <button style={styles.modalCloseBtn} onClick={() => setShowPublishModal(false)}>닫기 (취소)</button>
          </div>
        </div>
      )}
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
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.4rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeDone: { width: '18px', height: '18px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem' },
  stepTextDone: { fontSize: '0.75rem', color: '#4caf50', fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeActive: { width: '18px', height: '18px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.75rem', color: '#fff', fontWeight: '700' },
  stepLineActive: { width: '20px', height: '1px', backgroundColor: '#4caf50' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  previewArea: { flex: 1, overflow: 'auto', backgroundColor: '#111', borderRadius: '10px', padding: '3rem', border: '1px solid #333' },
  reportPaper: { color: '#000', backgroundColor: '#fff', height: 'auto', display: 'flex', flexDirection: 'column', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', boxSizing: 'border-box', fontFamily: '"Malgun Gothic", sans-serif', margin: '0 auto' },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  cloudSaveBtn: { flex: 2, padding: '1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  pdfBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  processingOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  loaderText: { color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: '500px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', padding: '2rem', textAlign: 'center' },
  modalTitle: { fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem', fontWeight: '800' },
  modalSub: { fontSize: '0.9rem', color: '#888', marginBottom: '2rem' },
  modalAdWrapper: { width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' },
  typeGrid: { display: 'flex', gap: '1.2rem', marginBottom: '2rem' },
  typeCard: { flex: 1, padding: '1.5rem', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
  typeCardHighlight: { flex: 1, padding: '1.5rem', backgroundColor: '#1a1a1a', border: '2px solid #007bff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,123,255,0.2)' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#333', color: '#aaa', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeBadgeActive: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeLabel: { fontSize: '1rem', color: '#fff', marginBottom: '0.8rem', fontWeight: 'bold' },
  typeDesc: { fontSize: '0.8rem', color: '#666', lineHeight: '1.5' },
  modalCloseBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' },
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-export-style-v2";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) { styleTag = document.createElement("style"); styleTag.id = styleId; document.head.appendChild(styleTag); }
  styleTag.innerHTML = `html, body, #root { min-height: 100%; margin: 0; padding: 0; background-color: #000 !important; overflow-y: auto !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; outline: none !important; } *::-webkit-scrollbar { display: none !important; }`;
}