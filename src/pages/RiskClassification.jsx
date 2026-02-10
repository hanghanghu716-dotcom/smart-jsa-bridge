import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function RiskClassification() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 고위험 작업 9대 유형 데이터
  const highRiskTasks = [
    { t: "고소 작업", c: "추락 위험이 있는 2m 이상의 높은 장소 작업" },
    { t: "밀폐공간 작업", c: "산소결핍, 유해가스 체류 위험이 있는 공간" },
    { t: "화기 작업", c: "용접, 용단 등 불꽃이나 열이 발생하는 작업" },
    { t: "중량물 취급", c: "크레인, 지게차 등을 이용한 화물 인양 작업" },
    { t: "전기 작업", c: "특고압/저압 선로 근접 및 활선 관련 작업" },
    { t: "굴착 작업", c: "지반 붕괴 및 매설물 파손 위험이 있는 작업" },
    { t: "방사선 작업", c: "비파괴 검사 등 방사선 노출 위험 작업" },
    { t: "화학물질 취급", c: "독성, 인화성 물질의 충전 및 이송 작업" },
    { t: "정비/보수 작업", c: "설비 가동 중지 후 내부 점검 및 수리 작업" }
  ];

  const frequencyLabels = { 5: "빈번함", 4: "높음", 3: "있음", 2: "낮음", 1: "거의없음" };
  const severityLabels = { 1: "영향없음", 2: "경미한 불휴업", 3: "경미한 휴업", 4: "중대재해" };

  const getRiskConfig = (score) => {
    if (score >= 16) return { bg: '#FFF1F1', color: '#D32F2F', label: '허용불가', border: '#FFCDD2' };
    if (score >= 12) return { bg: '#FFF8F1', color: '#E65100', label: '중대한 위험', border: '#FFE0B2' };
    if (score >= 9) return { bg: '#FFFDF1', color: '#F57F17', label: '상당한 위험', border: '#FFF9C4' };
    if (score === 8) return { bg: '#F9FBE7', color: '#827717', label: '경미한 위험', border: '#F0F4C3' };
    if (score >= 4) return { bg: '#F1F8E9', color: '#388E3C', label: '미미한 위험', border: '#DCEDC8' };
    return { bg: '#F5F5F5', color: '#616161', label: '무시 가능', border: '#E0E0E0' };
  };

  return (
    <div style={styles.wrapper}>
      {/* HEADER: 내비게이션 메뉴 통합 */}
      <header style={styles.header} className="max-lg:!px-6">
        <div className="flex justify-between items-center h-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
          <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
            <span style={styles.menuText} className="max-lg:hidden">MENU</span>
            <div style={styles.hamburger}>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
            </div>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER */}
      <div style={{
        ...styles.sideDrawer,
        transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isMenuOpen ? 'visible' : 'hidden',
        width: window.innerWidth < 1024 ? '100%' : '400px'
      }}>
        <div style={styles.drawerHeader}>
          <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ CLOSE</div>
        </div>
        <nav style={styles.drawerNav}>
          <div style={styles.navCategory}>CONTENTS</div>
          <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가 실시규정 가이드</Link>
          <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가(JRA/JSA) 실무 프로세스</Link>
          <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>보호구에 관하여</Link>
          <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>일반 작업/고위험 작업</Link>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION: 줄바꿈 및 들여쓰기 정밀 조정 */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">KOSHA & MOEL STANDARD</span>
          <h2 style={{...styles.mainTitle, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">위험도 분류 및</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">리스크 매트릭스 가이드</span>
          </h2>
          <p style={styles.subTitle} className="text-[14px] lg:text-[1.1rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">고용노동부 지침에 따른 빈도와 강도의 조합을 통해</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">과학적이고 객관적인 안전 관리 체계를 수립하십시오.</span>
          </p>
        </div>
      </section>

      {/* SECTION 1: DEFINITION (2열 -> 1열) */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">1. 작업 성격에 따른 기본 정의</h3>
          <div style={styles.splitRow} className="max-lg:!flex-col max-lg:!gap-6">
            <div style={styles.cardHalf} className="w-full max-lg:!p-6">
              <h4 style={styles.itemHeader}>일반작업 (General Work)</h4>
              <p style={styles.itemContent}>상시 발생하는 반복적 작업으로, 기존 표준작업절차서(SOP) 내에서 위험 요인이 충분히 통제되는 작업을 의미합니다.</p>
            </div>
            <div style={styles.cardHalfHighlight} className="w-full max-lg:!p-6">
              <h4 style={styles.itemHeader}>고위험작업 (High-Risk Work)</h4>
              <p style={styles.itemContent}>단 한 번의 실수가 중대재해로 직결될 수 있는 에너지를 다루거나, 비일상적으로 수행되는 고난도 작업을 의미합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: RISK MATRIX (표 스크롤 및 공식 최적화) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">2. 정량적 분류 기준 (Risk Matrix)</h3>
          
          <div style={styles.mathCardNormal} className="max-lg:!px-4 max-lg:!py-10 max-lg:!mb-10">
            <div style={styles.mathDisplay} className="max-lg:!flex-wrap max-lg:!gap-2">
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Risk Score</span>
              <span style={styles.mathOp} className="max-lg:!mx-2">=</span>
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Frequency</span>
              <span style={styles.mathOp} className="max-lg:!mx-2">×</span>
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Severity</span>
            </div>
          </div>

          <div style={styles.matrixContainer} className="max-lg:!p-4">
            <h4 style={styles.matrixTitle} className="text-lg lg:text-xl">리스크 매트릭스 (5단계 빈도 × 4단계 강도)</h4>
            <div className="overflow-x-auto">
              <table style={styles.matrixTable} className="min-w-[700px]">
                {/* ... 매트릭스 테이블 내부 로직 동일 ... */}
                <thead>
                  <tr>
                    <th colSpan="2" rowSpan="2" style={styles.matrixCorner}>빈도 \ 강도</th>
                    <th colSpan="4" style={styles.matrixMainHeader}>강도 (Severity)</th>
                  </tr>
                  <tr>
                    {[1, 2, 3, 4].map(s => (
                      <th key={s} style={styles.matrixSubHeader}>
                        <div style={styles.headerNum}>{s}</div>
                        <div style={styles.headerLabel}>{severityLabels[s]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[5, 4, 3, 2, 1].map((f) => (
                    <tr key={f}>
                      {f === 5 && (
                        <td rowSpan="5" style={styles.matrixAxisY}>
                          <div style={styles.verticalText}>빈도 (Frequency)</div>
                        </td>
                      )}
                      <td style={styles.matrixSideHeader}>
                        <div style={styles.sideNum}>{f}</div>
                        <div style={styles.sideLabel}>{frequencyLabels[f]}</div>
                      </td>
                      {[1, 2, 3, 4].map((s) => {
                        const score = f * s;
                        const config = getRiskConfig(score);
                        return (
                          <td key={s} style={{...styles.matrixCell, backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`}}>
                            <div style={styles.scoreNum}>{score}</div>
                            <div style={styles.scoreLabel}>{config.label}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 작업 (3열 -> 1열 전환) */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">3. 현장 9대 고위험 작업 유형</h3>
          <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
            {highRiskTasks.map((task, i) => (
              <div key={i} style={styles.flowCard} className="max-lg:!p-6">
                <h4 style={styles.flowT}>{task.t}</h4>
                <p style={styles.flowC}>{task.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  /* 스타일 규격 통일 (Main.jsx 참조) */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden', fontFamily: 'Pretendard, sans-serif' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  
  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  menuText: { color: '#111', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '5px' },
  bar: { width: '20px', height: '2px', backgroundColor: '#111' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },

  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#448AFF', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { opacity: 0.8, lineHeight: '1.8', wordBreak: 'keep-all' },
  
  m3Section: { padding: '100px 0' },
  sectionTitle: { fontWeight: '800', marginBottom: '40px', letterSpacing: '-0.5px' },
  
  splitRow: { display: 'flex', gap: '24px' },
  cardHalf: { flex: 1, padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '1px solid #eee' },
  cardHalfHighlight: { flex: 1, padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', borderTop: '6px solid #FF5252', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  itemHeader: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },
  
  mathCardNormal: { padding: '40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center', marginBottom: '50px' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' },
  mathVar: { fontSize: '2rem', fontWeight: '700', color: '#111', fontStyle: 'italic' },
  mathOp: { fontSize: '1.5rem', color: '#bbb' },
  
  matrixContainer: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '40px' },
  matrixTitle: { fontWeight: '800', marginBottom: '30px', textAlign: 'center' },
  matrixTable: { width: '100%', borderCollapse: 'separate', borderSpacing: '8px' },
  matrixCorner: { fontSize: '0.8rem', color: '#999' },
  matrixMainHeader: { padding: '12px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '8px' },
  matrixSubHeader: { padding: '12px', backgroundColor: '#F5F5F5', borderRadius: '8px' },
  headerNum: { fontSize: '1.1rem', fontWeight: '800' },
  headerLabel: { fontSize: '0.75rem', color: '#666' },
  matrixAxisY: { width: '40px', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', borderRadius: '8px' },
  verticalText: { writingMode: 'vertical-rl', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '2px' },
  matrixSideHeader: { padding: '10px', backgroundColor: '#F5F5F5', borderRadius: '8px' },
  sideNum: { fontSize: '1.1rem', fontWeight: '800' },
  sideLabel: { fontSize: '0.75rem', color: '#666' },
  matrixCell: { padding: '15px', textAlign: 'center', borderRadius: '12px' },
  scoreNum: { fontSize: '1.5rem', fontWeight: '900' },
  scoreLabel: { fontSize: '0.75rem', fontWeight: '800' },

  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '4px solid #448AFF', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  flowT: { fontSize: '1.15rem', fontWeight: '800', marginBottom: '10px' },
  flowC: { fontSize: '0.9rem', color: '#666', lineHeight: '1.6' },

  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};