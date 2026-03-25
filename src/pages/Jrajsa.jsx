import { useState } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import AdBanner from '../AdBanner';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useTranslation } from 'react-i18next';
// ✅ [추가] 다국어 전용 라우팅 도구
import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';

export default function JraJsa() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 네비게이트 적용
  const { t } = useTranslation('jrajsa');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}

      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
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

      {/* SIDE DRAWER (Navigation) */}
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
          {/* ✅ [변경] LanguageLink를 사용하여 다국어 경로 유지 */}
          <LanguageLink to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.regulation')}</LanguageLink>
          <LanguageLink to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.jrajsa')}</LanguageLink>
          <LanguageLink to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.ppe')}</LanguageLink>
          <LanguageLink to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.riskClass')}</LanguageLink>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.tag')}</span>
          <h2 style={{...styles.mainTitle, fontSize: undefined}} className="text-[24px] lg:text-[2.8rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.title1')}</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.title2')}</span>
          </h2>
          <p style={styles.subTitle} className="text-[14px] lg:text-[1.15rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.subTitle1')}</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.subTitle2')}</span>
          </p>
        </div>
      </section>

      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedLeft}>
          <span style={styles.adLabelDark}>AD (LEFT)</span>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </div>
      </aside>

      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedRight}>
          <span style={styles.adLabelDark}>AD (RIGHT)</span>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </div>
      </aside>

      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section3.title')}</h3>
              <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div key={num} style={styles.flowCard} className="max-lg:!p-6 max-lg:!rounded-none">
                    <span style={styles.flowIdx}>{t(`section3.process.step${num}.idx`)}</span>
                    <h4 style={styles.flowT}>{t(`section3.process.step${num}.title`)}</h4>
                    <p style={styles.flowC}>{t(`section3.process.step${num}.desc`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{...styles.m3Section, backgroundColor: '#fcfcfc', width: '100%'}} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section4.title')}</h3>
              <div style={styles.checkGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} style={styles.checkItem} className="max-lg:!p-6">
                    <h4 style={styles.itemHeader}>● {t(`section4.rules.item${num}.title`)}</h4>
                    <p style={styles.itemContent}>{t(`section4.rules.item${num}.desc`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <div style={styles.splitRow} className="max-lg:!flex-col max-lg:!gap-16">
                <div style={styles.splitLeft} className="w-full">
                  <h3 style={styles.sectionTitleSmall} className="text-[20px] lg:text-[1.6rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section5.title')}</h3>
                  <div className="overflow-x-auto">
                    <table style={styles.table} className="min-w-[450px]">
                      <thead>
                        <tr style={styles.tableHeadRow}>
                          <th style={styles.th}>{t('section5.table.header.col1')}</th>
                          <th style={styles.th}>{t('section5.table.header.col2')}</th>
                          <th style={styles.th}>{t('section5.table.header.col3')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2].map((num) => (
                          <tr key={num}>
                            <td style={styles.tdBold}>{t(`section5.table.rows.row${num}.col1`)}</td>
                            <td style={styles.td}>{t(`section5.table.rows.row${num}.col2`)}</td>
                            <td style={styles.td}>{t(`section5.table.rows.row${num}.col3`)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={styles.splitRight} className="w-full">
                  <h3 style={styles.sectionTitleSmall} className="text-[20px] lg:text-[1.6rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section6.title')}</h3>
                  <ul style={styles.checklist} className="max-lg:!pl-4">
                    {[1, 2, 3, 4].map((num) => (
                      <li key={num} style={styles.checkli} className="text-sm lg:text-base">● {t(`section6.checklist.item${num}`)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section style={{...styles.m3Section, backgroundColor: '#fcfcfc', width: '100%'}} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section7.title')}</h3>
              <div style={styles.mathCardNormal} className="max-lg:!px-4 max-lg:!py-10">
                <div style={styles.mathDisplay} className="max-lg:!flex-wrap max-lg:!gap-2">
                  <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">{t('section7.math.risk')}</span>
                  <span style={styles.mathOp} className="max-lg:!mx-2">=</span>
                  <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">{t('section7.math.frequency')}</span>
                  <span style={styles.mathOp} className="max-lg:!mx-2">×</span>
                  <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">{t('section7.math.severity')}</span>
                </div>
                <p style={styles.mathCaption} className="max-lg:text-xs">{t('section7.math.caption')}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60" dangerouslySetInnerHTML={{ __html: t('footer') }} />
        </div>
      </footer>
    </div>
  );
}

// 스타일 객체는 원본 데이터를 그대로 유지합니다.
const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden', position: 'relative' },
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
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff', width: '100%', position: 'relative', zIndex: 10 },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { opacity: 0.8, lineHeight: '1.8', wordBreak: 'keep-all' },
  mainContentArea: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', alignItems: 'center' },
  m3Section: { padding: '100px 0', width: '100%' },
  sectionTitle: { fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  sectionTitleSmall: { fontWeight: '800', marginBottom: '30px' },
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', width: '100%' },
  flowCard: { padding: '30px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '5px solid #007bff', boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)' },
  flowIdx: { fontSize: '0.8rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '12px' },
  flowT: { fontSize: '1.15rem', fontWeight: '800', color: '#111', marginBottom: '12px' },
  flowC: { fontSize: '0.95rem', color: '#555', lineHeight: '1.6' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', width: '100%' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },
  splitRow: { display: 'flex', gap: '60px', width: '100%' },
  splitLeft: { flex: 1.2 },
  splitRight: { flex: 1 },
  checklist: { listStyle: 'none', padding: 0 },
  checkli: { color: '#444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '15px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800' },
  td: { padding: '15px', border: '1px solid #eee', color: '#444' },
  tdBold: { padding: '15px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc' },
  mathCardNormal: { padding: '60px 40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center', width: '100%' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' },
  mathVar: { fontStyle: 'italic', fontFamily: 'serif', fontSize: '2rem', fontWeight: '600', color: '#111' },
  mathOp: { margin: '0 20px', fontSize: '1.5rem', color: '#888' },
  mathCaption: { fontSize: '0.95rem', color: '#666' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 600px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: '#f5f5f5', 
    border: '1px dashed #ddd', 
    borderRadius: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '10px 0',
    zIndex: 100
  },
  adPlaceholderFixedRight: { 
    position: 'fixed',
    top: '50%',
    right: 'calc(50% - 600px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: '#f5f5f5', 
    border: '1px dashed #ddd', 
    borderRadius: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '10px 0',
    zIndex: 100
  }
};