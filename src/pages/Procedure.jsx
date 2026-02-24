import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner'; // [추가] 광고 컴포넌트 불러오기

const DEFAULT_PROCEDURES = Array(8)
  .fill(null)
  .map(() => ({ stepTitle: '', stepDetail: '' }));

export default function Procedure() {
  const navigate = useNavigate();
  const location = useLocation();

  const [procedures, setProcedures] = useState(DEFAULT_PROCEDURES);

  const formData = location.state?.formData;
  const participants = location.state?.participants;

  /* ✅ 뒤로 가기 / 재진입 시 절차 복원 */
  useEffect(() => {
    if (location.state?.procedures) {
      setProcedures(location.state.procedures);
    }
  }, [location.state?.procedures]);

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

  const handleNext = () => {
    const validProcs = procedures.filter(
      p => p.stepTitle.trim() && p.stepDetail.trim()
    );

    if (validProcs.length < 3) {
      alert('최소 3단계 이상의 절차를 입력해 주십시오.');
      return;
    }

    navigate('/analysis', {
      state: {
        procedures: validProcs,
        formData,
        participants,
        // 🔑 항상 최신 analysisData를 직접 전달
        analysisData: location.state?.analysisData,
      },
    });
  };

  const handlePrev = () => {
    navigate('/info', {
      state: {
        formData,
        participants,
        procedures,
        // 🔑 스냅샷 금지, location.state 직접 전달
        analysisData: location.state?.analysisData,
      },
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>
          Smart JSA Bridge
        </h1>
      </header>

      <div style={styles.mainLayout}>
        {/* [좌측 광고] */}
        <aside style={styles.sideAd}>
          {/* 슬롯 번호는 나중에 애드센스에서 새 광고 단위를 만들어 교체하세요 */}
          <AdBanner slot="3000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}>
                <div style={styles.stepBadgeDone}>✓</div>
                <span style={styles.stepTextDone}>기본 정보</span>
              </div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}>
                <div style={styles.stepBadgeActive}>2</div>
                <span style={styles.stepTextActive}>작업 절차</span>
              </div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}>
                <div style={styles.stepBadge}>3</div>
                <span style={styles.stepText}>위험 분석</span>
              </div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}>
                <div style={styles.stepBadge}>4</div>
                <span style={styles.stepText}>최종 출력</span>
              </div>
            </nav>

            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>02. 작업 절차 상세 정의</h2>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.procedureContainer}>
                <div style={styles.gridHeader}>
                  <span style={styles.headerLabelShort}>작업 단계</span>
                  <span style={styles.headerLabelLong}>상세 작업 내용</span>
                </div>

                {procedures.map((proc, idx) => (
                  <div key={idx} style={styles.rowWrapper}>
                    <div style={styles.stepNumberBadge}>{idx + 1}</div>
                    <div style={styles.inputGroup}>
                      <input
                        style={styles.inputTitle}
                        value={proc.stepTitle}
                        placeholder="단계명"
                        maxLength={12}
                        onChange={(e) =>
                          updateProcedure(idx, 'stepTitle', e.target.value)
                        }
                      />
                      <input
                        style={styles.inputDetail}
                        value={proc.stepDetail}
                        placeholder="상세 내용"
                        onChange={(e) =>
                          updateProcedure(idx, 'stepDetail', e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                <button style={styles.addBtn} onClick={addStep}>
                  + 작업 절차 추가 (최대 20단계)
                </button>
              </div>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>
                이전으로
              </button>
              <button style={styles.nextBtn} onClick={handleNext}>
                지능형 위험 분석 시작
              </button>
            </div>
          </div>
        </main>

        {/* [우측 광고] */}
        <aside style={styles.sideAd}>
          <AdBanner slot="3000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        {/* [하단 광고] */}
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="3000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}


const styles = {
  // 1. 래퍼: 최소 높이만 지정하고, z-index 컨텍스트를 생성하지 않도록 복원
  wrapper: { 
    display: 'flex', 
    flexDirection: 'column',
    minHeight: '100vh', 
    width: '100%',
    backgroundColor: '#000' 
  },

  // 2. 🌟 배경 래퍼: 창(Viewport) 전체에 완전히 고정시킴
  bgWrapper: { 
    position: 'fixed', // 스크롤이나 내부 콘텐츠 수축에 절대 영향 받지 않음
    top: 0, 
    left: 0, 
    width: '100vw',  
    height: '100vh', 
    zIndex: 0,       // -1이 아니라 0으로 두어 숨겨지지 않게 함
    pointerEvents: 'none' // 배경이 클릭 등 마우스 이벤트를 방해하지 않게 함
  },

  // 3. 배경 이미지: 화면에 꽉 차게 채움
  bgImage: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100%', 
    height: '100%', 
    backgroundImage: 'url(/images/image2.jpg)', 
    backgroundSize: 'cover', 
    backgroundPosition: 'center', 
    filter: 'brightness(0.3)' 
  },
  
  // 4. 어두운 오버레이
  dimOverlay: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100%', 
    height: '100%', 
    background: 'rgba(0,0,0,0.4)', 
    zIndex: 1 
  },

  // 5. 헤더: 배경 위로 올라오도록 zIndex 조정
  header: { position: 'relative', padding: '1.2rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  
  // 6. 메인 레이아웃: 배경 위로 올라오도록 포지션과 zIndex 조정
  mainLayout: { 
    position: 'relative', // 중요: zIndex가 먹히려면 position이 필요함
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    padding: '0 5rem 100px', 
    gap: '4rem', 
    zIndex: 10, 
    overflow: 'hidden' 
  },

  sideAd: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  // 7. 폼 카드: 수축 방지를 위해 고정 높이 유지
  formCard: { 
    width: '100%', 
    maxWidth: '1440px', 
    height: '75vh', 
    backgroundColor: 'rgba(18, 18, 18, 0.98)', 
    border: '1px solid rgba(255, 255, 255, 0.12)', 
    borderRadius: '12px', 
    padding: '2rem 2.5rem', 
    boxShadow: '0 40px 80px rgba(0,0,0,0.9)', 
    display: 'flex', 
    flexDirection: 'column',
    overflow: 'hidden'
  },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '1rem' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.3 },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepText: { fontSize: '0.85rem', color: '#aaa' },
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
  // ✅ [교정] 푸터를 절대 위치(Absolute)로 고정하여 화면 높이 계산을 방해하지 않게 함
  footerArea: { 
    width: '100%', 
    padding: '1.5rem 5rem', 
    zIndex: 10, 
    position: 'absolute', 
    bottom: 0, 
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center'
  },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
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