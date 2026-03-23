import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { useTranslation } from 'react-i18next'; // ✅ [추가] 다국어 지원 훅 임포트

const DEFAULT_PROCEDURES = Array(8)
  .fill(null)
  .map(() => ({ stepTitle: '', stepDetail: '' }));

export default function Procedure() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['procedure']); // ✅ [추가] procedure 네임스페이스 로드

  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const formData = location.state?.formData;
  const participants = location.state?.participants;
  // 분석 데이터 보존을 위한 상태 참조
  const analysisData = location.state?.analysisData;

  useEffect(() => {
    // 이전 페이지나 다음 페이지에서 돌아왔을 때 기존 절차 데이터가 있다면 복구
    if (location.state?.procedures && location.state.procedures.length > 0) {
      setProcedures(location.state.procedures);
    }
  }, [location.state?.procedures]);

  // ✅ [수정] 홈 버튼 클릭 시 데이터 삭제 경고 로직 다국어 처리
  const handleLogoClick = () => {
    if (window.confirm(t('alert.confirmMain'))) {
      navigate('/');
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
      // ✅ [수정] 필수 절차 단계 알림 다국어 처리
      alert(t('alert.minSteps'));
      return;
    }
    setIsTypeModalOpen(true);
  };

  const startAnalysis = (jsaType) => {
    const validProcs = procedures.filter(
      p => p.stepTitle.trim() && p.stepDetail.trim()
    );

    navigate('/analysis', {
      state: {
        procedures: validProcs,
        formData: { ...formData, jsaType },
        participants,
        analysisData: analysisData,
        isFork: location.state?.isFork,
        parentId: location.state?.parentId, // ✅ [추가] 원본 출처 ID 릴레이
        originalAnalysisData: location.state?.originalAnalysisData // ✅ [추가] 변경률 검증용 원본 데이터 릴레이
      },
    });
  };
  
  const handlePrev = () => {
      navigate('/info', {
        state: {
          formData,
          participants,
          procedures, 
          analysisData: analysisData,
          isFork: location.state?.isFork,
          parentId: location.state?.parentId, // ✅ [추가] 원본 출처 ID 릴레이 유지
          originalAnalysisData: location.state?.originalAnalysisData // ✅ [추가] 변경률 검증용 원본 데이터 릴레이 유지
        },
      });
    };

  return (
    <div style={styles.wrapper}>
      {isTypeModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsTypeModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            {/* ✅ [수정] 모달 내 텍스트 다국어 처리 */}
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
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              {/* ✅ [수정] Stepper 텍스트 다국어 처리 */}
              {/* 1단계: 완료 */}
              <div style={styles.stepItemDone}>
                <div style={styles.stepBadgeDone}>✓</div>
                <span style={styles.stepTextDone}>{t('step.basicInfo')}</span>
              </div>
              <div style={styles.stepLineActive} />

              {/* 2단계: 활성 */}
              <div style={styles.stepItemActive}>
                <div style={styles.stepBadgeActive}>2</div>
                <span style={styles.stepTextActive}>{t('step.procedure')}</span>
              </div>
              <div style={styles.stepLine} />

              {/* 3~6단계: 대기 */}
              <div style={styles.stepItem}><div style={styles.stepBadge}>3</div><span style={styles.stepText}>{t('step.riskAnalysis')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>{t('step.moduleConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>5</div><span style={styles.stepText}>{t('step.tableConfig')}</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>6</div><span style={styles.stepText}>{t('step.finalOutput')}</span></div>
            </nav>

            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>{t('form.title')}</h2> {/* ✅ [수정] 폼 타이틀 다국어 처리 */}
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.procedureContainer}>
                <div style={styles.gridHeader}>
                  <span style={styles.headerLabelShort}>{t('form.stepLabel')}</span> {/* ✅ [수정] 라벨 다국어 처리 */}
                  <span style={styles.headerLabelLong}>{t('form.detailLabel')}</span> {/* ✅ [수정] 라벨 다국어 처리 */}
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
                  {t('btn.addStep')} {/* ✅ [수정] 추가 버튼 다국어 처리 */}
                </button>
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>{t('btn.prev')}</button> {/* ✅ [수정] 버튼 다국어 처리 */}
              <button style={styles.nextBtn} onClick={handleOpenModal}>{t('btn.next')}</button> {/* ✅ [수정] 버튼 다국어 처리 */}
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

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#000' },
  bgWrapper: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' },
  bgImage: { position: 'absolute', inset: 0, backgroundImage: 'url(/images/image2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 },
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  mainLayout: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem 100px', gap: '4rem', zIndex: 10, overflow: 'hidden' },
  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { width: '100%', maxWidth: '1440px', height: '75vh', backgroundColor: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '2rem 2.5rem', boxShadow: '0 40px 80px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepText: { fontSize: '0.85rem', color: '#444' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { width: '30px', height: '1.5px', backgroundColor: '#4caf50' },
  formHeader: { marginBottom: '1.2rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff' },
  procedureContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  gridHeader: { display: 'flex', paddingLeft: '3.2rem', gap: '1rem', marginBottom: '0.5rem' },
  headerLabelShort: { width: '180px', fontSize: '0.85rem', color: '#007bff', fontWeight: 'bold' },
  headerLabelLong: { flex: 1, fontSize: '0.85rem', color: '#007bff', fontWeight: 'bold' },
  rowWrapper: { display: 'flex', alignItems: 'center', gap: '1rem' },
  stepNumberBadge: { width: '2.2rem', fontSize: '0.9rem', color: '#555', fontWeight: '900', textAlign: 'center' },
  inputGroup: { flex: 1, display: 'flex', gap: '1rem' },
  inputTitle: { width: '180px', padding: '0.75rem 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  inputDetail: { flex: 1, padding: '0.75rem 1rem', backgroundColor: '#1d1d1d', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  addBtn: { width: '100%', padding: '1.1rem', backgroundColor: 'transparent', color: '#007bff', border: '1px dashed #007bff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '1rem' },
  btnArea: { marginTop: '1.5rem', display: 'flex', gap: '1.2rem' },
  prevBtn: { flex: 1, padding: '1rem', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
  nextBtn: { flex: 2, padding: '1rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem' },
  footerArea: { width: '100%', padding: '1.5rem 5rem', zIndex: 10, position: 'absolute', bottom: 0, backgroundColor: 'transparent', display: 'flex', justifyContent: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { width: '500px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', padding: '2rem', textAlign: 'center' },
  modalTitle: { fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' },
  modalSub: { fontSize: '0.9rem', color: '#888', marginBottom: '2rem' },
  typeGrid: { display: 'flex', gap: '1.2rem', marginBottom: '2rem' },
  typeCard: { flex: 1, padding: '1.5rem', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
  typeCardHighlight: { flex: 1, padding: '1.5rem', backgroundColor: '#1a1a1a', border: '2px solid #007bff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,123,255,0.2)' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#333', color: '#aaa', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeBadgeActive: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#007bff', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', marginBottom: '1rem' },
  typeLabel: { fontSize: '1rem', color: '#fff', marginBottom: '0.8rem', fontWeight: 'bold' },
  typeDesc: { fontSize: '0.8rem', color: '#666', lineHeight: '1.5' },
  modalCloseBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' },
  modalAdWrapper: {
  width: '100%',
  marginBottom: '1.5rem',
  display: 'flex',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: '8px',
  backgroundColor: 'rgba(255,255,255,0.03)'
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
    html, body, #root { min-height: 100%; margin: 0; padding: 0; background-color: #000 !important; overflow-y: auto !important; }
    * { -ms-overflow-style: none !important; scrollbar-width: none !important; outline: none !important; }
    *::-webkit-scrollbar { display: none !important; }
  `;
}