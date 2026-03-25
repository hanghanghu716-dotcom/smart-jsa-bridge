import { useState } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { useTranslation } from 'react-i18next';
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
// ✅ [추가] 다국어 전용 라우팅 도구
import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';

export default function RiskClassification() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 네비게이트 적용
  const { t } = useTranslation('risk'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 고위험 작업 유형 데이터 (다국어 연동)[cite: 17]
  const highRiskTasks = t('tasks', { returnObjects: true });

  const frequencyLabels = { 
    5: t('matrix.f5'), 4: t('matrix.f4'), 3: t('matrix.f3'), 2: t('matrix.f2'), 1: t('matrix.f1') 
  };
  const severityLabels = { 
    1: t('matrix.s1'), 2: t('matrix.s2'), 3: t('matrix.s3'), 4: t('matrix.s4') 
  };

  const getRiskConfig = (score) => {
    if (score >= 16) return { bg: '#FFF1F1', color: '#D32F2F', label: t('matrix.l1'), border: '#FFCDD2' };
    if (score >= 12) return { bg: '#FFF8F1', color: '#E65100', label: t('matrix.l2'), border: '#FFE0B2' };
    if (score >= 9) return { bg: '#FFFDF1', color: '#F57F17', label: t('matrix.l3'), border: '#FFF9C4' };
    if (score === 8) return { bg: '#F9FBE7', color: '#827717', label: t('matrix.l4'), border: '#F0F4C3' };
    if (score >= 4) return { bg: '#F1F8E9', color: '#388E3C', label: t('matrix.l5'), border: '#DCEDC8' };
    return { bg: '#F5F5F5', color: '#616161', label: t('matrix.l6'), border: '#E0E0E0' };
  };

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}

      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
          {/* ✅ 햄버거 메뉴 트리거 (기능 보존) */}
          <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
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
        width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : '400px'
      }}>
        <div style={styles.drawerHeader}>
          <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ CLOSE</div>
        </div>
        <nav style={styles.drawerNav}>
          <div style={styles.navCategory}>CONTENTS</div>
          {/* ✅ [변경] LanguageLink를 사용하여 다국어 경로 유지 */}
          <LanguageLink to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.regulation', '위험성평가 실시규정 가이드')}</LanguageLink>
          <LanguageLink to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.jrajsa', '위험성평가(JRA/JSA) 실무 프로세스')}</LanguageLink>
          <LanguageLink to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.ppe', '보호구에 관하여')}</LanguageLink>
          <LanguageLink to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.riskClass', '일반 작업/고위험 작업')}</LanguageLink>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.heroTag')}</span>
          <h2 style={{...styles.mainTitle, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.mainTitle1')}</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.mainTitle2')}</span>
          </h2>
          <p style={styles.subTitle} className="text-[14px] lg:text-[1.1rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.subTitle1')}</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.subTitle2')}</span>
          </p>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <div style={styles.centerContent}>
          {/* SECTION 1: DEFINITION */}
          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.section1')}</h3>
              <div style={styles.splitRow} className="max-lg:!flex-col max-lg:!gap-6">
                <div style={styles.cardHalf} className="w-full max-lg:!p-6">
                  <h4 style={styles.itemHeader}>{t('def.generalTitle')}</h4>
                  <p style={styles.itemContent}>{t('def.generalContent')}</p>
                </div>
                <div style={styles.cardHalfHighlight} className="w-full max-lg:!p-6">
                  <h4 style={styles.itemHeader}>{t('def.highTitle')}</h4>
                  <p style={styles.itemContent}>{t('def.highContent')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: RISK MATRIX */}
          <section style={{...styles.m3Section, backgroundColor: '#fcfcfc', width: '100%'}} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.section2')}</h3>
              
              <div style={styles.mathCardNormal} className="max-lg:!px-4 max-lg:!py-10 max-lg:!mb-10">
                <div style={styles.mathDisplay} className="max-lg:!flex-wrap max-lg:!gap-2">
                  <span style={styles.mathVar}>Risk Score</span>
                  <span style={styles.mathOp}>=</span>
                  <span style={styles.mathVar}>{t('matrix.axisY')}</span>
                  <span style={styles.mathOp}>×</span>
                  <span style={styles.mathVar}>{t('matrix.axisX')}</span>
                </div>
              </div>

              <div style={styles.matrixContainer} className="max-lg:!p-4">
                <h4 style={styles.matrixTitle}>{t('matrix.title')}</h4>
                <div className="overflow-x-auto">
                  <table style={styles.matrixTable} className="min-w-[700px]">
                    <thead>
                      <tr>
                        <th colSpan="2" rowSpan="2" style={styles.matrixCorner}>{t('matrix.axisY')} \ {t('matrix.axisX')}</th>
                        <th colSpan="4" style={styles.matrixMainHeader}>{t('matrix.axisX')}</th>
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
                              <div style={styles.verticalText}>{t('matrix.axisY')}</div>
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

          {/* SECTION 3: HIGH RISK TASKS */}
          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.section3')}</h3>
              <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                {Array.isArray(highRiskTasks) && highRiskTasks.map((task, i) => (
                  <div key={i} style={styles.flowCard} className="max-lg:!p-6">
                    <h4 style={styles.flowT}>{task.t}</h4>
                    <p style={styles.flowC}>{task.c}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

// 스타일 객체는 원본 데이터를 절대적으로 유지합니다[cite: 17].
const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden', fontFamily: 'Pretendard, sans-serif' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff', width: '100%' },
  m3Tag: { color: '#448AFF', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { opacity: 0.8, lineHeight: '1.8', wordBreak: 'keep-all' },
  mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '4rem', zIndex: 10, justifyContent: 'center' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1200px', alignItems: 'center' },
  m3Section: { padding: '100px 0', width: '100%' },
  sectionTitle: { fontWeight: '800', marginBottom: '40px', letterSpacing: '-0.5px' },
  splitRow: { display: 'flex', gap: '24px', width: '100%' },
  cardHalf: { flex: 1, padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '1px solid #eee' },
  cardHalfHighlight: { flex: 1, padding: '30px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', borderTop: '6px solid #FF5252', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  itemHeader: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },
  mathCardNormal: { padding: '40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center', marginBottom: '50px', width: '100%' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' },
  mathVar: { fontSize: '2rem', fontWeight: '700', color: '#111', fontStyle: 'italic' },
  mathOp: { fontSize: '1.5rem', color: '#bbb' },
  matrixContainer: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '40px', width: '100%' },
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
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '4px solid #448AFF', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  flowT: { fontSize: '1.15rem', fontWeight: '800', marginBottom: '10px' },
  flowC: { fontSize: '0.9rem', color: '#666', lineHeight: '1.6' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  // 햄버거 메뉴 스타일 추가[cite: 11]
  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '5px' },
  bar: { width: '20px', height: '2px', backgroundColor: '#111' }
};