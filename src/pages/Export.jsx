import PublicationFields from '../components/PublicationFields';
import StorageVisibilityChoice from '../components/StorageVisibilityChoice';
import { getSaveVisibility } from '../utils/projectPersistence';
import ProjectStorageUsage from '../components/ProjectStorageUsage';
import { isStorageLimitError } from '../services/projectStorageService';
import { getVisibilityUi } from '../locales/visibilityUi';
import { getStorageUi } from '../locales/storageUi';
import { saveProject } from '../services/projectPersistenceService';
import DocumentSignatures from '../components/DocumentSignatures';
import { normalizeDocumentBlocks } from '../utils/documentLayout';
import DocumentContent from '../components/DocumentContent';
import ThemeSwitcher from '../components/ThemeSwitcher';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { captureReport } from '../utils/captureReport';
import jsPDF from 'jspdf'; 
import { supabase } from '../supabaseClient'; 
import { extractAutoTagsFromJSA, DIMENSIONAL_KEYWORD_MAP } from '../utils/TagDictionary'; 
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useLanguageNavigate } from '../hooks/useLanguage'; // ✅ [추가] 다국어 네비게이션 훅
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';
import DraftSaveStatus from '../components/DraftSaveStatus';
import { archiveActiveDraft } from '../services/jsaDraftService';

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
  const location = useLocation();
  const { draft, status } = useJsaDraftRecovery(!location.state?.formData);
  const { t } = useTranslation('common');
  const navigate = useLanguageNavigate();
  if (!location.state?.formData && status !== 'ready') return <div className="theme-workspace" style={{ padding: 40, minHeight: '100vh', background: 'var(--app-bg)' }}><p role="status">{t(status === 'error' ? 'draftSave.error' : status === 'empty' ? 'designer.noWorkSteps' : 'draftSave.pending')}</p><button onClick={() => navigate('/library')}>{t('saveFlow.library')}</button></div>;
  return <ExportEditor recoveredDraft={draft} />;
}

function ExportEditor({ recoveredDraft }) {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 다국어 네비게이트 사용
  const location = useLocation();
  const { t, i18n } = useTranslation(['export', 'common']); 
  const isEnglish = i18n.language?.startsWith('en');
  const isFrench = i18n.language?.startsWith('fr');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(Boolean(location.state?.openSaveDialog));
  const [publicationConsent,setPublicationConsent]=useState(false);
  const [publicationContext,setPublicationContext]=useState({});

  const state = location.state || {};
  const recoveredLayout = recoveredDraft?.layout_data || {};

  const existingId = state.existingId ?? recoveredDraft?.source_project_id ?? null;
  const analysisData = state.analysisData || recoveredDraft?.analysis_data || [];
  const sourceFormData = state.formData || recoveredDraft?.form_data || {};
  const [saveVisibility, setSaveVisibility] = useState(() => getSaveVisibility(sourceFormData, state.projectSaveContext || recoveredLayout.projectSaveContext));
  const formData = { ...sourceFormData, saveVisibility };
  const participants = state.participants || recoveredDraft?.participants || [];
  const procedures = state.procedures || recoveredDraft?.procedures || [];
  const savedActiveOrder = state.savedActiveOrder || recoveredLayout.savedActiveOrder || [];
  const savedUserColumns = state.savedUserColumns || recoveredLayout.savedUserColumns || [];
  const savedOrientation = state.savedOrientation || recoveredLayout.savedOrientation || 'landscape';
  const isModuleSkipped = state.isModuleSkipped ?? recoveredLayout.isModuleSkipped;
  const docTitle = state.docTitle ?? recoveredLayout.docTitle ?? t('default.docTitle', '위험성평가표 (JSA)');
  const appr1 = state.appr1 ?? recoveredLayout.appr1 ?? t('default.appr1', '작성');
  const appr2 = state.appr2 ?? recoveredLayout.appr2 ?? t('default.appr2', '검토');
  const appr3 = state.appr3 ?? recoveredLayout.appr3 ?? t('default.appr3', '승인');
  const savedSignatureRows = state.savedSignatureRows || recoveredLayout.savedSignatureRows || 1;
  const documentBlocks = normalizeDocumentBlocks(state.documentBlocks || recoveredLayout.documentBlocks || []);
  const savedColumnOverrides = state.savedColumnOverrides || recoveredLayout.savedColumnOverrides || {};
  const documentNotes = state.documentNotes ?? recoveredLayout.documentNotes ?? '';
  const hasDesignerLayout = Array.isArray(documentBlocks) && documentBlocks.length > 0;
  const savedContext = state.projectSaveContext || recoveredLayout.projectSaveContext;
  const isFork = state.isFork ?? (savedContext ? !savedContext.own : false);
  const parentId = savedContext ? (savedContext.own ? savedContext.parentId || null : savedContext.id) : state.parentId || recoveredDraft?.source_project_id || null;
  const originalAnalysisData = state.originalAnalysisData || savedContext?.originalAnalysisData || null;

  const [stepPhotos, setStepPhotos] = useState(state.stepPhotos || recoveredLayout.stepPhotos || {});
  const [projectTarget, setProjectTarget] = useState(state.projectSaveContext || recoveredLayout.projectSaveContext || null);
  const cloudBusy = useRef(false);
  const [storageUsage,setStorageUsage]=useState(null);
  const [storageRefresh,setStorageRefresh]=useState(0);
  const [storageLimited,setStorageLimited]=useState(false);
  useEffect(() => {
    if (!existingId || projectTarget || isFork) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('jsa_projects').select('id,updated_at,is_public').eq('id', existingId).eq('author_id', user.id).maybeSingle();
      if (active && data) setProjectTarget({ id: data.id, updatedAt: data.updated_at, isPublic: data.is_public, own: true });
    });
    return () => { active = false; };
  }, [existingId, projectTarget, isFork]);
  const canUpdate = projectTarget?.own && !projectTarget.isPublic && !isFork;

  const totalRisks = analysisData.reduce((sum, step) => sum + (step.risks?.length || 0), 0);
  const originalTotalRisks = originalAnalysisData ? originalAnalysisData.reduce((sum, step) => sum + (step.risks?.length || 0), 0) : 0;
  const isValuableFork = isFork && originalAnalysisData && (
    (analysisData.length > originalAnalysisData.length) || 
    (totalRisks >= originalTotalRisks + 2)
  );

  const draftSave = useJsaDraftAutosave({
    enabled: Boolean(location.state?.formData || recoveredDraft),
    stage: 'export',
    formData,
    participants,
    procedures,
    analysisData,
    layoutData: {
      savedSignatureRows,
      docTitle,
      appr1,
      appr2,
      appr3,
      savedActiveOrder,
      savedUserColumns,
      savedColumnOverrides,
      savedOrientation,
      documentBlocks,
      documentNotes,
      isModuleSkipped, stepPhotos, projectSaveContext: projectTarget
    },
    sourceProjectId: parentId || existingId || null,
  });

  const jsaType = formData.jsaType || '2-step';
  const COLS = savedOrientation === 'landscape' ? 56 : 40; 
  const PAPER_WIDTH = savedOrientation === 'landscape' ? '1080px' : '750px';


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

  const handleLogoClick = () => { navigate('/'); }; // ✅ 언어 경로 자동 유지

  const handleCloudAction = async (mode) => {
    if (cloudBusy.current) return;
    if ((mode === 'public') !== (saveVisibility === 'public')) return;
    if (mode === 'public' && !publicationConsent) return;
    cloudBusy.current = true; setIsProcessing(true);
    let savedProject = null;
    try {
      const draftResult = await draftSave.flushAndPause();
      const rawTags = extractAutoTagsFromJSA(formData.projectName || '', analysisData);
      const tags = rawTags.filter(tag => Object.keys(DIMENSIONAL_KEYWORD_MAP).includes(tag));
      savedProject = await saveProject({
        mode, targetId: projectTarget?.id, expectedUpdatedAt: projectTarget?.updatedAt, tags,
        parentId: mode === 'public' ? (parentId || projectTarget?.id) : parentId,
        snapshot: { publicationConsent, publicationContext, locale: i18n.language, formData, participants, analysisData, procedures, layoutData: { docTitle, appr1, appr2, appr3, savedSignatureRows, savedActiveOrder, savedUserColumns, savedColumnOverrides, savedOrientation, documentBlocks, documentNotes, isModuleSkipped, stepPhotos } }
      });
      if (mode !== 'public') {
        try { await archiveActiveDraft(draftResult.version); }
        catch { alert(t('common:saveFlow.archiveWarning')); }
      }
      setShowPublishModal(false);
      navigate('/library');
    } catch (error) {
      console.error('[Project save]', error);
      if (isStorageLimitError(error)) { setStorageLimited(true); setStorageRefresh(n=>n+1); }
      else alert(t(error.message === 'PROJECT_CHANGED' ? 'common:saveFlow.changed' : 'common:saveFlow.failed'));
    } finally {
      if (!savedProject) draftSave.resume();
      cloudBusy.current = false; setIsProcessing(false);
    }
  };

  const generatePDF = async () => {
    setIsProcessing(true); const paper = document.querySelector('.reportPaper'); if (!paper) return setIsProcessing(false);
    try {
      window.scrollTo(0, 0); const canvas = await captureReport(paper);
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
    } catch (error) { console.error(error); alert(t('alert.pdfError')); } finally { setIsProcessing(false); }
  };

  const handlePdfDownload = async () => { await generatePDF(); };

  const handleCopyToClipboard = async () => {
      const paper = document.querySelector('.reportPaper');
      if (!paper) return;
      try {
        const htmlData = paper.outerHTML;
        const textData = paper.innerText;
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlData], { type: 'text/html' }),
          'text/plain': new Blob([textData], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
        alert(t('alert.copySuccess'));
      } catch (error) {
        console.error('Clipboard injection failed:', error);
        alert(t('alert.copyError'));      }
    };

  const renderUnifiedHeader = () => {
    const commonTdStyle = { border: '1px solid #888', padding: '2px 6px 10px 6px', fontSize: isEnglish ? '10px' : '11px', textAlign: 'center', verticalAlign: 'middle', color: '#000', wordBreak: 'break-word' };
    const labelTdStyle = { ...commonTdStyle, backgroundColor: '#f2f2f2', fontWeight: 'bold', whiteSpace: isEnglish ? 'normal' : 'nowrap', lineHeight: '1.2' };
    const checkboxItemStyle = { display: 'inline-block', marginRight: '10px', whiteSpace: 'nowrap' };
    const ppeOthers = formData?.ppe?.filter(p => !['안전모','안전화','보안경','장갑','방진마스크'].includes(p)).join(', ');
    const permitOthers = formData?.permits?.filter(p => !['일반','화기','밀폐','정전','고소','중량물','굴착'].includes(p)).join(', ');
    
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed', position: 'relative', zIndex: 1 }}>
        <colgroup><col style={{ width: '10%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '30%' }} /><col style={{ width: '10%' }} /><col style={{ width: '20%' }} /></colgroup>
        <tbody>
          <tr>
            <td style={{...labelTdStyle, width: '10%'}}>{t('header.projectName')}</td>
            <td style={{...commonTdStyle, fontWeight: 'bold', width: '20%'}}>{formData?.projectName || ''}</td>
            <td colSpan={2} style={{ ...commonTdStyle, width: '40%', fontSize: isEnglish ? '16px' : '18px', fontWeight: 'bold', verticalAlign: 'middle', padding: '0px 6px 14px 6px' }}>{docTitle}</td>
            <td colSpan={2} style={{ padding: 0, border: '1px solid #888', width: '30%' }}>
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td rowSpan={2} style={{ borderRight: '1px solid #888', width: (isEnglish || isFrench) ? '55px' : '35px', textAlign: 'center', backgroundColor: '#f2f2f2', fontWeight: 'bold', color: '#000', borderTop: 'none', borderBottom: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0', writingMode: (isEnglish || isFrench) ? 'horizontal-tb' : 'vertical-rl' }}>
                      {isEnglish ? <div style={{lineHeight:'1.1', fontSize:'9px', display:'flex', flexDirection:'column'}}><span>Compliance</span><span>Approval</span></div> : t('header.approval')}
                    </td>
                    <td style={{ borderRight: '1px solid #888', borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0', wordBreak: 'break-word', fontSize: isEnglish ? '9px' : '10px', lineHeight: '1.1' }}>{appr1}</td>
                    <td style={{ borderRight: '1px solid #888', borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0', wordBreak: 'break-word', fontSize: isEnglish ? '9px' : '10px', lineHeight: '1.1' }}>{appr2}</td>
                    <td style={{ borderBottom: '1px solid #888', height: '26px', textAlign: 'center', color: '#000', borderTop: 'none', verticalAlign: 'middle', padding: '2px 0 10px 0', wordBreak: 'break-word', fontSize: isEnglish ? '9px' : '10px', lineHeight: '1.1' }}>{appr3}</td>
                  </tr>
                  <tr><td style={{ borderRight: '1px solid #888', height: '45px' }}></td><td style={{ borderRight: '1px solid #888' }}></td><td></td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={labelTdStyle}>{t('header.workLocation')}</td><td style={commonTdStyle}>{formData?.workLocation || ''}</td>
            <td style={labelTdStyle}>{t('header.department')}</td><td style={commonTdStyle}>{formData?.department || ''}</td>
            <td style={labelTdStyle}>{t('header.workDate')}</td><td style={commonTdStyle}>{formData?.workDate || ''}</td>
          </tr>
          <tr>
            <td style={labelTdStyle}>{t('header.ppe')}</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '2px 8px 10px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: isEnglish ? '4px' : '0' }}>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전모') ? '☑' : '□'} {t('ppe.helmet')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('안전화') ? '☑' : '□'} {t('ppe.shoes')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('보안경') ? '☑' : '□'} {t('ppe.glasses')}</span>
                <span style={checkboxItemStyle}>□ {t('ppe.safetyBelt')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('방진마스크') ? '☑' : '□'} {t('ppe.mask')}</span>
                <span style={checkboxItemStyle}>{formData?.ppe?.includes('장갑') ? '☑' : '□'} {t('ppe.gloves')}</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>{ppeOthers ? '☑' : '□'} {t('ppe.etc')}(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{ppeOthers}</span>)</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style={labelTdStyle}>{t('header.highRiskWork')}</td>
            <td colSpan={5} style={{ ...commonTdStyle, padding: '2px 8px 10px 8px' }}>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: isEnglish ? '4px' : '0' }}>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('화기') ? '☑' : '□'} {t('permit.hotWork')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('밀폐') ? '☑' : '□'} {t('permit.confinedSpace')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('정전') ? '☑' : '□'} {t('permit.electrical')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('고소') ? '☑' : '□'} {t('permit.highElevation')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('중량물') ? '☑' : '□'} {t('permit.heavyLifting')}</span>
                <span style={checkboxItemStyle}>{formData?.permits?.includes('굴착') ? '☑' : '□'} {t('permit.excavation')}</span>
                <span style={{ display: 'flex', flex: 1, alignItems: 'center', whiteSpace: 'nowrap' }}>{permitOthers ? '☑' : '□'} {t('permit.etc')}(<span style={{ flex: 1, minWidth: '30px', color: '#000', padding: '0 4px', textAlign: 'left' }}>{permitOthers}</span>)</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderSignatureTable = () => <DocumentSignatures participants={participants} rows={savedSignatureRows} orientation={savedOrientation} />;

  const getColumnMeta = (key) => {
    const custom = savedUserColumns.find(u => u.id === key);
    if (custom) return custom;
    const system = TAG_META[key];
    if (!system) return null;
    return { ...system, ...(savedColumnOverrides[key] || {}) };
  };

  const getColumnLabel = (key, meta) => {
    if (key.startsWith('USER_')) return meta?.label || key;
    if (savedColumnOverrides[key]?.label) return savedColumnOverrides[key].label;
    return t(`tags.${key}`, meta?.label || key);
  };

  const renderDataTable = () => {
      const isEuroLang = ['en', 'fr', 'de'].some(lang => i18n.language?.startsWith(lang));

      const commonTdStyle = { 
        border: '1px solid #888', 
        padding: '4px 4px 12px 4px', 
        // 👇 [수정] 유럽권 언어일 경우 폰트 크기를 9px로 일괄 축소하여 공간 확보
        fontSize: isEuroLang ? '9px' : '10.5px', 
        verticalAlign: 'middle', 
        lineHeight: '1.2', 
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
        // 👇 [기능 추가] 긴 단어 자동 하이픈 처리 (브라우저 지원 시)
        hyphens: 'auto'
      };
    if (!savedActiveOrder || savedActiveOrder.length === 0) return null;
    const currentItems = savedActiveOrder.filter(key => getColumnMeta(key));
    const fixedWidth = currentItems.reduce((sum, key) => {
      const meta = getColumnMeta(key);
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
            const meta = getColumnMeta(key);
            let pct = meta.isFlex ? (remaining / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
            return <col key={key} style={{ width: `${pct}%` }} />;
          })}</colgroup>
        <thead>
          <tr>{groups.map((group, idx) => {
              if (group.isGroup) { 
                const groupLabel = group.label === '유해 위험요인 파악' ? t('groups.hazard') : t('groups.risk');
                return ( <th key={`th-group-${idx}`} colSpan={group.keys.length} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold' }}>{groupLabel}</th> ); 
              } 
              else {
                const key = group.keys[0]; const meta = getColumnMeta(key); 
                let label = getColumnLabel(key, meta);
                if (key === 'DATA_FREQUENCY') label = t('preview.freqBreak'); 
                if (key === 'DATA_SEVERITY') label = t('preview.sevBreak');
                if (key === 'DATA_KRAS_AFTER') label = t('preview.afterBreak');
                if (key === 'DATA_KRAS_SCHED') label = t('preview.schedBreak');
                return ( <th key={`th-${key}`} rowSpan={hasGroups ? 2 : 1} style={{ ...commonTdStyle, backgroundColor: '#f0f0f0', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{label}</th> );
              }
            })}</tr>
          {hasGroups && (
            <tr>
              {groups.filter(g => g.isGroup).flatMap(group =>
                group.keys.map(key => {
                  const meta = getColumnMeta(key);
                  let label = getColumnLabel(key, meta);
                  if (key === 'DATA_FREQUENCY') label = t('preview.freqBreak');
                  if (key === 'DATA_SEVERITY') label = t('preview.sevBreak');
                  if (key === 'DATA_KRAS_AFTER') label = t('preview.afterBreak');
                  if (key === 'DATA_KRAS_SCHED') label = t('preview.schedBreak');
                return (
                    <th key={`th-sub-${key}`} style={{ 
                      ...commonTdStyle, 
                      backgroundColor: '#f9f9f9', 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'keep-all',
                      fontSize: isEuroLang ? '8px' : '10.5px'                    }}>
                      {label}
                    </th>
                  );
                })
              )}
            </tr>
          )}
        </thead>
        <tbody>
        <tr style={{ height: 0, visibility: 'hidden', border: 'none' }}>
            {currentItems.map(key => {
              const meta = getColumnMeta(key);
              let pct = meta.isFlex ? (remaining / flexItems.length / COLS) * 100 : (meta.width / COLS) * 100;
              return <td key={`ghost-${key}`} style={{ width: `${pct}%`, height: 0, padding: 0, margin: 0, border: 'none' }}></td>;
            })}
          </tr>

          {analysisData.map((stepData, stepIdx) => (
            <tr key={`tr-${stepIdx}`}>
              {currentItems.map((key) => {
                const meta = getColumnMeta(key); let content = "";
                if (key === 'DATA_STEP_NO') content = String(stepIdx + 1);
                else if (key === 'DATA_STEP_TITLE' || key === 'DATA_KRAS_STEP') content = stepData.proc?.stepTitle || "";
                else if (key === 'DATA_HAZARD' || key === 'DATA_KRAS_HAZARD_DETAIL') content = stepData.risks.map(r => `• ${r.factor}`).join('\n');
                else if (key === 'DATA_CURRENT_MEASURE' || key === 'DATA_KRAS_CURRENT') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.current_measure}`).join('\n');
                else if (key === 'DATA_RECOMMEND_MEASURE' || key === 'DATA_KRAS_RECOMMEND') content = stepData.risks.map(r => `• ${jsaType === '2-step' ? r.measure : r.recommend_measure}`).join('\n');
                else if (key === 'DATA_SEVERITY' || key === 'DATA_KRAS_SEV') content = String(stepData.severity || "-");
                else if (key === 'DATA_FREQUENCY' || key === 'DATA_KRAS_FREQ') content = String(stepData.frequency || "-");
                else if (key === 'DATA_RISK' || key === 'DATA_KRAS_RISK') content = String(stepData.riskLevel || "-");
                else if (key === 'DATA_KRAS_HAZARD_CLASS') content = stepData.risks[0]?.category || "";
                else if (key.startsWith('USER_')) {
                  const raw = stepData.customFields?.[key];
                  if (raw !== undefined && raw !== null) content = typeof raw === 'boolean' ? (raw ? '☑' : '☐') : String(raw);
                  else if (meta.fieldType === 'checkbox') content = '☐';
                  else content = '';
                }
                if (key === 'DATA_PHOTO') { return ( <td key={`td-${key}-${stepIdx}`} onClick={() => { setActivePhotoRow(stepIdx); fileInputRef.current.click(); }} style={{ border: '1px solid #000', padding: '0', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer', overflow: 'hidden' }}> {stepPhotos[stepIdx] ? <img src={stepPhotos[stepIdx]} style={{width:'100%', height:'100%', objectFit:'contain', display: 'block'}} alt="Photo" /> : <span style={{color:'#ccc', fontSize:'10px'}}>+ {t('table.addPhoto')}</span>} </td> ); }
                return ( <td key={`td-${key}-${stepIdx}`} style={{ ...commonTdStyle, textAlign: meta.align || 'center', whiteSpace: 'pre-wrap' }}>{content}</td> );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="theme-workspace" style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} /> {/* ✅ [추가] 기능 추가 */}
      {isProcessing && <div style={styles.processingOverlay}><div style={styles.loaderText}>{t('ui.processing')}</div></div>}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
      <div style={styles.bgWrapper} className="no-print"><div style={styles.bgImage} /><div style={styles.dimOverlay} /></div>
      <header style={styles.header} className="no-print"><h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1><ThemeSwitcher compact /></header>
      <div style={styles.mainLayout}>
        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper} className="no-print">
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.basicInfo')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.procedure')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.riskAnalysis')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.moduleConfig')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>{t('step.tableConfig')}</span></div><div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>6</div><span style={styles.stepTextActive}>{t('step.finalOutput')}</span></div>
            </nav>
            <div style={styles.formHeader}><h2 style={styles.formTitle}>{t('title.main')}</h2></div>
            <div style={styles.previewArea}>
            {/* 가상의 A4 용지 영역 */}
        <div className="reportPaper theme-paper" style={{...styles.reportPaper, width: PAPER_WIDTH}}>
          {hasDesignerLayout ? (
            <DocumentContent formData={formData} participants={participants} analysisData={analysisData}
              layout={{ documentBlocks, savedActiveOrder, savedUserColumns, savedColumnOverrides, savedOrientation, savedSignatureRows, docTitle, appr1, appr2, appr3, documentNotes }}
              stepPhotos={stepPhotos} onPhotoClick={index => { setActivePhotoRow(index); fileInputRef.current.click(); }} />
          ) : (
            <>
              {/* Keep signatures between safety information and the assessment on the legacy path too. */}
              {!isModuleSkipped && renderUnifiedHeader()}
              {!isModuleSkipped && renderSignatureTable()}
              {renderDataTable()}
            </>
          )}        
        </div>
            </div>
            <div style={styles.btnArea} className="no-print">
              <button style={styles.prevBtn} onClick={() => navigate(hasDesignerLayout ? '/document-designer' : '/layout-table', { state: { ...state, existingId, formData, participants, procedures, analysisData, documentBlocks, savedActiveOrder, savedUserColumns, savedColumnOverrides, savedOrientation, savedSignatureRows, docTitle, appr1, appr2, appr3, documentNotes, stepPhotos, projectSaveContext: projectTarget } })}>{hasDesignerLayout ? t('common:designer.title') : t('btn.prev')}</button>
              <button style={styles.cloudSaveBtn} onClick={() => setShowPublishModal(true)}>{t('common:saveFlow.saveDocument')}</button>
              <button style={styles.pdfBtn} onClick={handlePdfDownload}>{t('btn.pdfSave')}</button>
              <button style={{...styles.pdfBtn, backgroundColor: "var(--success-action)", color: "var(--on-accent)"}} onClick={handleCopyToClipboard}>{t('btn.copyTable')}</button>

            </div>
          </div>
        </main>
      </div>

      {showPublishModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPublishModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('common:saveFlow.saveDocument')}</h3>
            <StorageVisibilityChoice value={saveVisibility} disabled={isProcessing} onChange={value => { setSaveVisibility(value); setPublicationConsent(false); }} />
            <ProjectStorageUsage refreshKey={storageRefresh} onStatus={setStorageUsage} />
            {storageLimited && !storageUsage?.can_create && <p role="alert" dir={i18n.dir()} style={{color:'var(--danger)'}}>{getStorageUi(i18n.language).limitError}</p>}
            {saveVisibility === 'public' && <PublicationFields consent={publicationConsent} onConsent={setPublicationConsent} context={publicationContext} onContext={setPublicationContext} />}
            <div style={{ ...styles.typeGrid, pointerEvents: isProcessing ? 'none' : 'auto', opacity: isProcessing ? 0.6 : 1 }}>
              {saveVisibility === 'private' && canUpdate && <button type="button" data-save-mode="update" style={styles.typeCard} disabled={isProcessing} onClick={() => handleCloudAction('update')}><h4 style={styles.typeLabel}>{t('common:saveFlow.updatePrivate')}</h4><p style={styles.typeDesc}>{formData.projectName}</p></button>}
              {saveVisibility === 'public' && ((isFork && !isValuableFork) ? (
                <div style={{...styles.typeCard, opacity: 0.5, cursor: 'not-allowed'}}>
                  <div style={{...styles.typeBadge, backgroundColor: "var(--surface-hover)"}}>{t('modal.pubBadgeLimited')}</div>
                  <h4 style={{...styles.typeLabel, color: "var(--text-muted)"}}>{getVisibilityUi(i18n.language).public}</h4>
                  <p style={{...styles.typeDesc, color: "var(--danger)", fontWeight: 'bold'}} dangerouslySetInnerHTML={{ __html: t('modal.pubForkLimit') }}></p>
                </div>
              ) : totalRisks < 3 ? (
                <div style={{...styles.typeCard, opacity: 0.5, cursor: 'not-allowed'}}>
                  <div style={{...styles.typeBadge, backgroundColor: "var(--surface-hover)"}}>{t('modal.pubBadgeLimited')}</div>
                  <h4 style={{...styles.typeLabel, color: "var(--text-muted)"}}>{getVisibilityUi(i18n.language).public}</h4>
                  <p style={{...styles.typeDesc, color: "var(--danger)", fontWeight: 'bold'}} dangerouslySetInnerHTML={{ __html: t('modal.pubRiskLimit') }}></p>
                </div>
              ) : (
                <button type="button" disabled={isProcessing || !publicationConsent} data-save-mode="public" style={styles.typeCardHighlight} onClick={() => handleCloudAction('public')}>
                  <div style={styles.typeBadgeActive}>Public</div>
                  <h4 style={styles.typeLabel}>{getVisibilityUi(i18n.language).public}</h4>
                  <p style={styles.typeDesc} dangerouslySetInnerHTML={{ __html: t('common:saveFlow.publicHint') }}></p>
                </button>
              ))}
              
              {saveVisibility === 'private' && <button type="button" disabled={isProcessing || storageUsage?.can_create === false} data-save-mode="private" style={styles.typeCard} onClick={() => handleCloudAction('private')}>
                <div style={styles.typeBadge}>Private</div>
                <h4 style={styles.typeLabel}>{t('common:saveFlow.newPrivate')}</h4>
                <p style={styles.typeDesc} dangerouslySetInnerHTML={{ __html: t('common:saveFlow.privateHint') }}></p>
              </button>}
            </div>

            <button style={styles.modalCloseBtn} onClick={() => setShowPublishModal(false)}>{t('modal.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  /* 원본 스타일 절대 유지 */
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' },
  bgWrapper: { position: 'fixed', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image4.jpg)', backgroundSize: 'cover', filter: 'brightness(0.12)', backgroundPosition: 'center' },
  dimOverlay: { position: 'absolute', inset: 0, background: "var(--workspace-overlay)", zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  logo: { fontSize: '1.4rem', fontWeight: '900', color: "var(--text-primary)", cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', padding: '0 5rem 60px', zIndex: 10, gap: '3rem', overflow: 'hidden', alignItems: 'center' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1550px', height: '82vh', backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '12px', padding: '1.5rem 2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: "var(--shadow-panel)" },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: '0.4rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeDone: { width: '18px', height: '18px', backgroundColor: "var(--success-action)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--on-accent)", fontSize: '0.65rem' },
  stepTextDone: { fontSize: '0.75rem', color: "var(--success)", fontWeight: '700' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  stepBadgeActive: { width: '18px', height: '18px', backgroundColor: "var(--action-bg)", borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--on-accent)", fontSize: '0.7rem', fontWeight: 'bold' },
  stepTextActive: { fontSize: '0.75rem', color: "var(--text-primary)", fontWeight: '700' },
  stepLineActive: { width: '20px', height: '1px', backgroundColor: "var(--success-action)" },
  formHeader: { marginBottom: '1.2rem', borderLeft: "5px solid var(--accent)", paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: "var(--text-primary)" },
  previewArea: { flex: 1, overflow: 'auto', backgroundColor: "var(--card-bg)", borderRadius: '10px', padding: '3rem', border: "1px solid var(--border-default)" },
  reportPaper: { color: '#000', backgroundColor: '#fff', height: 'auto', display: 'flex', flexDirection: 'column', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', boxSizing: 'border-box', fontFamily: '"Malgun Gothic", sans-serif', margin: '0 auto' },
  btnArea: { display: 'flex', gap: '1.2rem', marginTop: '1.5rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: "var(--text-muted)", border: "1px solid var(--border-default)", borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  cloudSaveBtn: { flex: 2, padding: '1rem', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  pdfBtn: { flex: 2, padding: '1rem', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  processingOverlay: { position: 'fixed', inset: 0, backgroundColor: "var(--overlay)", display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  loaderText: { color: "var(--on-accent)", fontSize: '1.2rem', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: "var(--overlay)", display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: 'min(900px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', backgroundColor: "var(--panel-bg)", border: "1px solid var(--border-default)", borderRadius: '16px', padding: '2rem', textAlign: 'center' },
  modalTitle: { fontSize: '1.5rem', color: "var(--text-primary)", marginBottom: '0.5rem', fontWeight: '800' },
  modalSub: { fontSize: '0.9rem', color: "var(--text-muted)", marginBottom: '2rem' },
  modalAdWrapper: { width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px', backgroundColor: "var(--app-bg)" },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1.2rem', marginBottom: '2rem' },
  typeCard: { flex: 1, padding: '1.5rem', backgroundColor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
  typeCardHighlight: { flex: 1, padding: '1.5rem', backgroundColor: "var(--card-bg)", border: "2px solid var(--accent)", borderRadius: '12px', cursor: 'pointer', boxShadow: "var(--shadow-panel)" },
  typeBadge: { display: 'inline-block', padding: '2px 8px', backgroundColor: "var(--surface-hover)", color: "var(--on-accent)", borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeBadgeActive: { display: 'inline-block', padding: '2px 8px', backgroundColor: "var(--action-bg)", color: "var(--on-accent)", borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeLabel: { fontSize: '1rem', color: "var(--text-primary)", marginBottom: '0.8rem', fontWeight: 'bold' },
  typeDesc: { fontSize: '0.8rem', color: "var(--text-muted)", lineHeight: '1.5' },
  modalCloseBtn: { background: 'none', border: 'none', color: "var(--text-muted)", cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' },
};
