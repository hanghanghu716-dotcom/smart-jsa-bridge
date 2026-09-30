import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate } from '../hooks/useLanguage'; // ✅ [추가] 다국어 네비게이션 훅
import WorkStepWorkbench from '../components/WorkStepWorkbench';
import useJsaDraftAutosave from '../hooks/useJsaDraftAutosave';
import useJsaDraftRecovery from '../hooks/useJsaDraftRecovery';
import DraftSaveStatus from '../components/DraftSaveStatus';
import ThemeSwitcher from '../components/ThemeSwitcher';

const DEFAULT_PROCEDURES = Array(8)
  .fill(null)
  .map(() => ({ stepTitle: '', stepDetail: '' }));

export default function Procedure() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 다국어 네비게이트 사용
  const location = useLocation();
  const { t } = useTranslation(['procedure']); 

  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [composerTouched, setComposerTouched] = useState(false);
  const [composedAnalysisData, setComposedAnalysisData] = useState(null);

  const shouldRecoverDraft = !location.state?.formData && !location.state?.procedures;
  const { draft: recoveredDraft, status: recoveryStatus } = useJsaDraftRecovery(shouldRecoverDraft);
  const recoverySettled = !shouldRecoverDraft || ['ready', 'empty', 'error'].includes(recoveryStatus);

  const formData = location.state?.formData || recoveredDraft?.form_data || {};
  const participants = location.state?.participants || recoveredDraft?.participants || [];
  const analysisData = location.state?.analysisData || recoveredDraft?.analysis_data || [];
  const isFastTrack = location.state?.isFastTrack ?? false;
  const effectiveAnalysisData = composerTouched ? (composedAnalysisData || []) : analysisData;
  const hasMeaningfulProcedure = procedures.some(
    proc => proc?.stepTitle?.trim() || proc?.stepDetail?.trim()
  );

  const draftSave = useJsaDraftAutosave({
    enabled: recoverySettled && Boolean(
      formData?.projectName?.trim() || hasMeaningfulProcedure || location.state?.draftId || recoveredDraft?.id
    ),
    stage: 'procedure',
    formData,
    participants,
    procedures,
    analysisData: effectiveAnalysisData,
    sourceProjectId: location.state?.parentId || recoveredDraft?.source_project_id || null,
  });

  useEffect(() => {
    const restoredProcedures = location.state?.procedures || recoveredDraft?.procedures;
    if (restoredProcedures && restoredProcedures.length > 0) {
      setProcedures(restoredProcedures);
    }
  }, [location.state?.procedures, recoveredDraft]);

  const handleLogoClick = () => {
    if (window.confirm(t('alert.confirmMain'))) {
      navigate('/'); // ✅ 언어 경로 자동 유지
    }
  };

  const updateProcedure = (index, field, value) => {
    setProcedures(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addStep = () => {
    setProcedures(prev =>
      prev.length < 20 ? [...prev, { stepTitle: '', stepDetail: '' }] : prev
    );
  };

  const handleOpenModal = () => {
    const validProcs = procedures.filter(
      p => p.stepTitle.trim() && p.stepDetail.trim()
    );

    if (validProcs.length < 3) {
      alert(t('alert.minSteps'));
      return;
    }
    setIsTypeModalOpen(true);
  };

const startAnalysis = (jsaType) => {
    const validEntries = procedures
      .map((proc, index) => ({ proc, analysis: composedAnalysisData?.[index] }))
      .filter(({ proc }) => proc.stepTitle.trim() && proc.stepDetail.trim());

    const validProcs = validEntries.map(({ proc }) => proc);
    const nextAnalysisData = composerTouched
      ? validEntries.map(({ proc, analysis }, index) => ({
          ...(analysis || {}),
          id: index,
          proc,
          risks: Array.isArray(analysis?.risks) ? analysis.risks : [],
          frequency: analysis?.frequency ?? 1,
          severity: analysis?.severity ?? 1,
          riskLevel: analysis?.riskLevel ?? 1,
        }))
      : analysisData;

    navigate('/analysis', {
      state: {
        ...location.state, // [핵심] 이전 페이지에서 넘어온 모든 state를 보존
        procedures: validProcs,
        formData: { ...formData, jsaType },
        participants,
        analysisData: nextAnalysisData,
        isFastTrack // 명시적 전달
      },
    });
  };


  const handlePrev = () => {
      // [기능 추가] 초고속 모드일 경우 Info 단계를 역으로 패스하고 바로 메인 화면으로 복귀
      if (isFastTrack) {
        navigate('/');
        return;
      }

      navigate('/info', {
        state: {
          formData,
          participants,
          procedures, 
          analysisData: composerTouched ? (composedAnalysisData || []) : analysisData,
          isFork: location.state?.isFork,
          parentId: location.state?.parentId,
          originalAnalysisData: location.state?.originalAnalysisData 
        },
      });
    };

  return (
    <div style={styles.wrapper}>
      <SEO />
      <DraftSaveStatus status={draftSave.status} lastSavedAt={draftSave.lastSavedAt} /> {/* ✅ [추가] 페이지별 hreflang 태그 자동 삽입 및 SEO 최적화 */}

      <WorkStepWorkbench
        isOpen={isWorkbenchOpen}
        onClose={() => setIsWorkbenchOpen(false)}
        procedures={procedures}
        analysisData={effectiveAnalysisData}
        maxSteps={20}
        onApply={(nextProcedures, nextAnalysisData) => {
          setProcedures(nextProcedures);
          setComposedAnalysisData(nextAnalysisData);
          setComposerTouched(true);
        }}
      />

      {isTypeModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsTypeModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('modal.title')}</h3>
            <p style={styles.modalSub}>{t('modal.sub')}</p>
            
            <div style={styles.modalAdWrapper}>
              <AdBanner slot="9761676307" style={{ width: '100%', height: '90px' }} format="horizontal" />
            </div>

            <div style={styles.typeGrid}>
              <div style={styles.typeCard} onClick={() => startAnalysis('2-step')}>
                <div style={styles.typeBadge}>Standard</div>
                <h4 style={styles.typeLabel}>{t('modal.standardLabel')}</h4>
                <p style={styles.typeDesc}>{t('modal.standardDesc1')}<br/>{t('modal.standardDesc2')}</p>
              </div>
              
              <div style={styles.typeCardHighlight} onClick={() => startAnalysis('3-step')}>
                <div style={styles.typeBadgeActive}>Advanced</div>
                <h4 style={styles.typeLabel}>{t('modal.advancedLabel')}</h4>
                <p style={styles.typeDesc}>{t('modal.advancedDesc1')}<br/>{t('modal.advancedDesc2')}</p>
              </div>
            </div>
            
            <button style={styles.modalCloseBtn} onClick={() => setIsTypeModalOpen(false)}>{t('modal.closeBtn')}</button>
          </div>
        </div>
      )}

      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={handleLogoClick}>Smart JSA Bridge</h1>
        <ThemeSwitcher compact />
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}>
                <div style={styles.stepBadgeDone}>✓</div>
                <span style={styles.stepTextDone}>{t('step.basicInfo')}</span>
              </div>
              <div style={styles.stepLineActive} />

              <div style={styles.stepItemActive}>
                <div style={styles.stepBadgeActive}>2</div>
                <span style={styles.stepTextActive}>{t('step.procedure')}</span>
              </div>
              <div style={styles.stepLine} />

              <div style={styles.stepItem}><div style={styles.stepBadge}>3</div><span style={styles.stepText}>{t('step.riskAnalysis')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>{t('step.moduleConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>{t('step.tableConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>{t('step.finalOutput')}</span></div>
            </nav>

            <div style={styles.formHeader}>
              <div>
                <h2 style={styles.formTitle}>{t('form.title')}</h2>
                <div style={styles.formSubTitle}>{t('workbench.hint')}</div>
              </div>
              <button type="button" style={styles.workbenchBtn} onClick={() => setIsWorkbenchOpen(true)}>
                {t('workbench.openButton')}
              </button>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.procedureContainer}>
                <div style={styles.gridHeader}>
                  <span style={styles.headerLabelShort}>{t('form.stepLabel')}</span>
                  <span style={styles.headerLabelLong}>{t('form.detailLabel')}</span>
                </div>

                {procedures.map((proc, idx) => (
                  <div key={idx} style={styles.rowWrapper}>
                    <div style={styles.stepNumberBadge}>{idx + 1}</div>
                    <div style={styles.inputGroup}>
                      <input
                        style={styles.inputTitle}
                        value={proc.stepTitle}
                        placeholder={t('form.placeholderTitle')} 
                        maxLength={12}
                        onChange={(e) => updateProcedure(idx, 'stepTitle', e.target.value)}
                      />
                      <input
                        style={styles.inputDetail}
                        value={proc.stepDetail}
                        placeholder={t('form.placeholderDetail')}
                        onChange={(e) => updateProcedure(idx, 'stepDetail', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <button style={styles.addBtn} onClick={addStep}>
                  {t('btn.addStep')}
                </button>
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{t('btn.prev')}</button>
              <button style={styles.nextBtn} onClick={handleOpenModal}>{t('btn.next')}</button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="1284119169" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

// 스타일 객체는 원본 그대로 유지합니다[cite: 14].
const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'var(--app-bg)' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--hero-text)', cursor: 'pointer' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 100px', gap: '4rem', zIndex: 10, overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '75vh', backgroundColor: 'var(--surface-panel)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '2rem 2.5rem', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadge: { width: '22px', height: '22px', backgroundColor: 'var(--surface-3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-on-accent)', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-accent)', fontSize: '0.7rem' },
  stepText: { fontSize: '0.85rem', color: 'var(--text-faint)' },
  stepTextActive: { fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700' },
  stepTextDone: { fontSize: '0.85rem', color: 'var(--success)', fontWeight: '700' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { width: '30px', height: '1.5px', backgroundColor: 'var(--success)' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 },
  formSubTitle: { marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.72rem' },
  workbenchBtn: { padding: '0.7rem 1rem', backgroundColor: 'rgba(0,123,255,0.12)', color: 'var(--accent-text)', border: '1px solid var(--accent)', borderRadius: '7px', cursor: 'pointer', fontWeight: '800', fontSize: '0.78rem', whiteSpace: 'nowrap' },
  procedureContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  gridHeader: { display: 'flex', paddingLeft: '3.2rem', gap: '1rem', marginBottom: '0.5rem' },
  headerLabelShort: { width: '180px', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' },
  headerLabelLong: { flex: 1, fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' },
  rowWrapper: { display: 'flex', alignItems: 'center', gap: '1rem' },
  stepNumberBadge: { width: '2.2rem', fontSize: '0.9rem', color: 'var(--text-faint)', fontWeight: '900', textAlign: 'center' },
  inputGroup: { flex: 1, display: 'flex', gap: '1rem' },
  inputTitle: { width: '180px', padding: '0.75rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' },
  inputDetail: { flex: 1, padding: '0.75rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' },
  addBtn: { width: '100%', padding: '1.1rem', backgroundColor: 'transparent', color: 'var(--accent)', border: '1px dashed #007bff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem' },
  btnArea: { marginTop: '1.5rem', display: 'flex', gap: '1.2rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: 'var(--button-strong-bg)', color: 'var(--button-strong-text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  footerArea: { width: '100%', padding: '1.5rem 5rem', zIndex: 10, position: 'absolute', bottom: 0, backgroundColor: 'transparent', display: 'flex', justifyContent: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: '500px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '2rem', textAlign: 'center' },
  modalTitle: { fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  modalSub: { fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' },
  typeGrid: { display: 'flex', gap: '1.2rem', marginBottom: '2rem' },
  typeCard: { flex: 1, padding: '1.5rem', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
  typeCardHighlight: { flex: 1, padding: '1.5rem', backgroundColor: 'var(--surface-2)', border: '2px solid var(--accent)', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,123,255,0.2)' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', backgroundColor: 'var(--surface-3)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeBadgeActive: { display: 'inline-block', padding: '2px 8px', backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeLabel: { fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.8rem', fontWeight: 'bold' },
  typeDesc: { fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' },
  modalCloseBtn: { background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', textDecoration: 'underline' },
  modalAdWrapper: {
    width: '100%',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '8px',
    backgroundColor: 'var(--border-subtle)'
  },
};

if (typeof document !== 'undefined') {
  const styleId = "jsa-bridge-global-style";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = `
    html, body, #root { min-height: 100%; margin: 0; padding: 0; background-color: var(--app-bg) !important; overflow-y: auto !important; }
    * { -ms-overflow-style: none !important; scrollbar-width: none !important; outline: none !important; }
    *::-webkit-scrollbar { display: none !important; }
  `;
}