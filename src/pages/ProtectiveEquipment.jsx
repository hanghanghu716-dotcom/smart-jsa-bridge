import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdBanner from '../AdBanner'; 
import { useTranslation } from 'react-i18next';

export default function ProtectiveEquipment() {
  const navigate = useNavigate();
  // 'ppe' 네임스페이스를 사용합니다. (추후 i18n.js에 등록 필요)
  const { t } = useTranslation('ppe');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
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
          <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.regulation')}</Link>
          <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.jrajsa')}</Link>
          <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.ppe')}</Link>
          <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('nav.riskClass')}</Link>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION: 화면 전체 너비 유지 */}
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
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('hero.subTitle3')}</span>
          </p>
        </div>
      </section>

      {/* [스티키 광고]: 스크롤 시 따라오는 Fixed 방식 적용 */}
      {/* 좌측 광고 */}
      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedLeft}>
          <span style={styles.adLabelDark}>AD (LEFT)</span>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </div>
      </aside>

      {/* 우측 광고 */}
      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedRight}>
          <span style={styles.adLabelDark}>AD (RIGHT)</span>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 (중앙 정렬 유지) */}
      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          {/* SECTION 1: 보호구 분류 */}
          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section1.title')}</h3>
              <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const tags = t(`section1.types.item${num}.tags`, { returnObjects: true }) || [];
                  return (
                    <div key={num} style={styles.flowCard} className="max-lg:!p-6">
                      <span style={styles.flowIdx}>{t(`section1.types.item${num}.num`)}</span>
                      <h4 style={styles.flowT}>{t(`section1.types.item${num}.title`)}</h4>
                      <p style={styles.flowC}>{t(`section1.types.item${num}.desc`)}</p>
                      <div style={styles.subTagBox}>
                        {Array.isArray(tags) && tags.map((tag, idx) => (
                          <span key={idx} style={styles.subTag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: 보호구 안전인증 자주 묻는 질문 */}
          <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.container}>
              <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('section3.title')}</h3>
              <div style={styles.checkGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} style={styles.checkItem} className="max-lg:!p-6">
                    <h4 style={styles.itemHeader}>Q. {t(`section3.faq.item${num}.q`)}</h4>
                    <p style={styles.itemContent}>{t(`section3.faq.item${num}.a`)}</p>
                  </div>
                ))}
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

const styles = {
  /* 원본 스타일 유지 */
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

  /* Jrajsa.jsx와 동일한 레이아웃 시스템 적용 */
  mainContentArea: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', alignItems: 'center' },

  m3Section: { padding: '100px 0', width: '100%' },
  sectionTitle: { fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', width: '100%' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '5px solid #007bff', boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)' },
  flowIdx: { fontSize: '0.8rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '10px' },
  flowT: { fontSize: '1.1rem', fontWeight: '800', color: '#111', marginBottom: '10px' },
  flowC: { fontSize: '0.9rem', color: '#555', lineHeight: '1.6', marginBottom: '15px' },
  subTagBox: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  subTag: { padding: '4px 10px', backgroundColor: '#f0f4f8', borderRadius: '4px', fontSize: '0.75rem', color: '#007bff', fontWeight: '700' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', width: '100%' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' },

  /* 스크롤 스티키 광고 스타일 */
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 600px - 160px - 20px)', // (본문 절반 600px) + (광고폭 160px) + (간격 20px)
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
    right: 'calc(50% - 600px - 160px - 20px)', // (본문 절반 600px) + (광고폭 160px) + (간격 20px)
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