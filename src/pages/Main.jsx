
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdSenseUnit from '../components/AdSenseUnit';
import { useTranslation } from 'react-i18next';

export default function Main() {
  const navigate = useNavigate();
  // 'main' 네임스페이스만 로드하여 300여 개의 태그 로딩 부하를 방지합니다.
  const { t, i18n } = useTranslation('main'); 
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [user, setUser] = useState(null);

  const languages = [
    { code: 'ko', label: ' 한국어' },
    { code: 'en-US', label: ' English (US)' },
    { code: 'en-GB', label: ' English (UK)' },
    { code: 'en-AU', label: ' English (AU)' },
    { code: 'de-DE', label: ' Deutsch' },
    { code: 'fr-FR', label: ' Français' },
  ];

  const handleLanguageChange = (lngCode) => {
    i18n.changeLanguage(lngCode);
    setIsLanguageOpen(false);
  };

  const slides = [
    '/images/image1.jpg',
    '/images/image2.jpg',
    '/images/image3.jpg',
    '/images/image4.jpg',
    '/images/image5.jpg',
    '/images/image6.jpg'
  ];

  const PUBLISHER_ID = 'ca-pub-9791625990220699';
  const MAIN_SIDE_SLOT_ID = '3978298367';
  const MAIN_MOBILE_BRIDGE_SLOT_ID = '1284119169';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      subscription.unsubscribe();
    };
  }, [slides.length]);

  const handleStartClick = () => {
    if (window.innerWidth < 1024) {
      alert(t('mobileAlert'));
      return;
    }
    if (user) {
      navigate('/info', { state: { isMember: true } });
    } else {
      setIsStartModalOpen(true);
    }
  };

  return (
    <div style={styles.wrapper}>
      {isStartModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsStartModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{t('modalTitle')}</h3>
            <p style={styles.modalSub}>
              {t('modalSub1')}<br />
              {t('modalSub2')}
            </p>
            <div style={styles.modalBtnGroup}>
              <button style={styles.loginBtn} onClick={() => navigate('/login')}>{t('loginBtn')}</button>
              <button style={styles.guestBtn} onClick={() => navigate('/info', { state: { isMember: false } })}>{t('guestBtn')}</button>
            </div>
            <button style={styles.closeText} onClick={() => setIsStartModalOpen(false)}>{t('cancelBtn')}</button>
          </div>
        </div>
      )}

      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>

        <header style={styles.header} className="max-lg:!px-6">
          <div className="flex justify-between items-center h-full">
            <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
            
            <div style={styles.headerRight}>
              <div className="hidden lg:flex items-center">
                <Link to="/explore" style={styles.headerLink}>{t('navExplore')}</Link>
                <span 
                  style={{ ...styles.headerLink, cursor: 'pointer' }} 
                  onClick={() => {
                    if (user) { navigate('/library'); } 
                    else { setIsStartModalOpen(true); }
                  }}
                >
                  {t('navLibrary')}
                </span>
              </div>
              <span style={styles.separator}>|</span>
              
              <div style={styles.languageSelectorWrapper}>
                <div 
                  style={styles.activeLanguageDisplay} 
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                >
                  {/* 현재 i18n 언어 설정과 매칭되는 라벨을 표시합니다. */}
                  {languages.find(lng => lng.code === i18n.language)?.label || 'Language'} 
                  <span style={{...styles.dropdownArrow, transform: isLanguageOpen ? 'rotate(180deg)' : 'rotate(0)'}}>▼</span>
                </div>
                {isLanguageOpen && (
                  <div style={styles.dropdownMenu}>
                    {languages.map(lng => (
                      <div 
                        key={lng.code} 
                        style={styles.dropdownItem} 
                        onClick={() => handleLanguageChange(lng.code)}
                      >
                        {lng.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span style={styles.separator}>|</span>
              <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
                <span style={styles.menuText} className="max-lg:hidden">MENU</span>
                <div style={styles.hamburger}>
                  <div style={styles.bar}></div>
                  <div style={styles.bar}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Side Drawer 부분 */}
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
            <div style={styles.navCategory}>USER ACCOUNT</div>
            {user ? (
              <>
                <div style={styles.userBadge}>
                  <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                    <strong>{user.email}</strong> {t('welcomeSuffix1')}<br />
                    {t('welcomeSuffix2')}
                  </div>
                  <button onClick={() => supabase.auth.signOut()} style={styles.logoutLink}>{t('logout')}</button>
                </div>
                <Link to="/profile" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>
                  {t('profileEdit')}
                </Link>
              </>
            ) : (
              <Link to="/login" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('loginSignup')}</Link>
            )}

            <div style={{ ...styles.navCategory, marginTop: '30px' }}>CONTENTS</div>
            <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navRegulation')}</Link>
            <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navProcess')}</Link>
            <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navPPE')}</Link>
            <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navRiskClass')}</Link>
            <Link to="/dictionary" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navDB')}</Link>
            
            <div style={{ ...styles.navCategory, marginTop: '30px' }}>SECTOR GUIDES (50종)</div>
            <Link to="/guideline/common" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideCommon')}</Link>
            <Link to="/guideline/construction" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideConstruction')}</Link>
            <Link to="/guideline/high-risk" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideHighRisk')}</Link>
            <Link to="/guideline/manufacturing" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideManufacturing')}</Link>
            <Link to="/guideline/chemical" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideChemical')}</Link>
            <Link to="/guideline/general" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideGeneral')}</Link>
          </nav>
        </div>
        {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

        <div style={styles.mainLayout} className="max-lg:!px-6 max-lg:!flex-col">
          <aside className="hidden lg:block" style={styles.sideAd}>
            <div style={styles.adPlaceholderFixedLeft}>
              <span style={styles.adLabel}>AD (LEFT)</span>
              <AdSenseUnit client={PUBLISHER_ID} slot={MAIN_SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
            </div>
          </aside> 

          <main style={styles.centerContent} className="max-lg:!pl-0">
            <div style={styles.heroContent}>
              <h2 className="text-[28px] lg:text-[clamp(2.5rem,5vw,3.8rem)] font-extrabold leading-tight mb-6" style={styles.mainTitle}>
                {t('heroTitle1')}<br />{t('heroTitle2')}
              </h2>
              <p className="text-[14px] lg:text-[1.2rem]" style={styles.subTitle}>
                {t('heroSub1')}<br />
                {t('heroSub2')}
              </p>
              <button onClick={handleStartClick} style={styles.primaryBtn}>
                {t('heroBtn')}
              </button>
            </div>
          </main>

          <aside className="hidden lg:block" style={styles.sideAd}>
            <div style={styles.adPlaceholderFixedRight}>
              <span style={styles.adLabel}>AD (RIGHT)</span>
              <AdSenseUnit client={PUBLISHER_ID} slot={MAIN_SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
            </div>
          </aside>
        </div>
      </section>

      {/* 모바일 광고 섹션 */}
      <div className="lg:hidden" style={styles.mobileAdSector}>
        <div style={styles.mobileAdBox}>
           <span style={styles.adLabelDark}>MOBILE BRIDGE AD</span>
           <AdSenseUnit client={PUBLISHER_ID} slot={MAIN_MOBILE_BRIDGE_SLOT_ID} format="horizontal" style={{ display: 'block' }} />
        </div>
      </div>

      {/* CORE VALUE 섹션 */}
      <section style={styles.m3Section} className="max-lg:!py-20">
        <div style={styles.container}>
          <div className="flex flex-col lg:flex-row lg:gap-[100px] items-center">
            <div style={styles.valueTextSide} className="w-full lg:flex-[1.2]">
              <span style={styles.m3Tag} className="block mb-4">CORE VALUE</span>
              <h3 className="text-[24px] lg:text-[3.5rem] font-black mb-8 leading-tight" style={styles.m3Title}>
                {t('coreValueTitle1')}<br />{t('coreValueTitle2')}
              </h3>
              <div style={styles.valuePoint}>
                <h4 className="text-lg font-bold mb-2">{t('coreValueSubtitle')}</h4>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  {t('coreValueDesc')}
                </p>
              </div>
            </div>
            <div className="w-full lg:flex-1 lg:shrink-0">
              <div style={{ ...styles.imageCard, backgroundImage: 'url(/images/image5.jpg)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ANALYSIS GUIDES 섹션 */}
      <section style={{ ...styles.m3Section, backgroundColor: '#fcfcfc' }} className="max-lg:!py-20">
        <div style={styles.container}>
          <div style={styles.m3Header} className="px-6 lg:px-0">
            <span style={styles.m3Tag} className="block mb-4">ANALYSIS GUIDES</span>
            <h3 className="text-[24px] lg:text-[3.5rem] font-black text-[#111]" style={styles.m3Title}>{t('analysisGuideTitle')}</h3>
          </div>
          <div style={styles.jsaCardGrid} className="max-lg:!flex max-lg:!flex-col max-lg:!gap-0">
            {['01', '02', '03', '04', '05', '06', '07', '08', '09'].map(id => (
              <div key={id} style={styles.jsaCard}>
                <span style={styles.jsaBadge}>{id}</span>
                <h5 style={styles.jsaCardTitle}>{t(`jsaCard.${id}.title`)}</h5>
                <div style={styles.jsaFactorBox}>
                  <strong>{t('hazardFactor')}</strong>
                  <p className="text-sm mt-1">{t(`jsaCard.${id}.f`)}</p>
                </div>
                <div style={styles.jsaMeasureBox}>
                  <strong>{t('reductionMeasure')}</strong>
                  <p className="text-sm mt-1">{t(`jsaCard.${id}.m`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
            <div style={styles.footerLinks}>
              <Link to="/privacy" style={styles.fLink}>{t('footerPrivacy')}</Link>
              <Link to="/terms" style={styles.fLink}>{t('footerTerms')}</Link>
              <Link to="/about" style={styles.fLink}>{t('footerAbout')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


const styles = {
  headerRight: { display: 'flex', alignItems: 'center' },
  headerLink: { color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '1px', marginLeft: '2.5rem', opacity: 0.85 },
  separator: { color: 'rgba(255,255,255,0.3)', margin: '0 2.5rem', fontSize: '0.8rem', pointerEvents: 'none' },
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto' },
  heroSection: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 1000, position: 'relative' }, 
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { width: '160px', flexShrink: 0 },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem', color: '#fff' },
  heroContent: { maxWidth: '750px' },
  mainTitle: { fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem' },
  subTitle: { lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4.5rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' },
  modalContent: { backgroundColor: '#111', padding: '3.5rem', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '480px', border: '1px solid #333' },
  modalTitle: { color: '#fff', fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.2rem' },
  modalSub: { color: '#999', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.6' },
  modalBtnGroup: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  loginBtn: { padding: '1.2rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  guestBtn: { padding: '1.2rem', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  closeText: { marginTop: '1.5rem', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' },
  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  menuText: { color: '#fff', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '2px' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '6px' },
  bar: { width: '24px', height: '2px', backgroundColor: '#fff' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.75rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '15px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f5f5f5' },
  userBadge: { backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', color: '#111' },
  logoutLink: { display: 'block', marginTop: '10px', color: '#ff4d4d', border: 'none', background: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999 },
  m3Section: { padding: '160px 0' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px' },
  m3Title: { fontSize: '3.5rem', fontWeight: '900', color: '#111' },
  jsaCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' },
  jsaCard: { padding: '48px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', position: 'relative' },
  jsaBadge: { position: 'absolute', top: '32px', right: '32px', fontSize: '1.2rem', fontWeight: '900', color: '#f0f0f0' },
  jsaCardTitle: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '32px', color: '#111' },
  jsaFactorBox: { marginBottom: '24px', paddingLeft: '16px', borderLeft: '3px solid #ff4d4d' },
  jsaMeasureBox: { paddingLeft: '16px', borderLeft: '3px solid #007bff' },
  finalFooter: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: '40px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.95rem' },
  imageCard: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '24px' },
  adLabel: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold', marginBottom: '8px' },
  adLabelDark: { fontSize: '10px', color: '#ccc', fontWeight: 'bold', marginBottom: '8px' },
  mobileAdSector: { width: '100%', padding: '20px 24px', backgroundColor: '#fff' },
  mobileAdBox: { width: '100%', minHeight: '100px', backgroundColor: '#f9f9f9', border: '1px dashed #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px 0' },
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: '20px',
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    border: '1px dashed rgba(255,255,255,0.2)', 
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
    right: '20px',
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    border: '1px dashed rgba(255,255,255,0.2)', 
    borderRadius: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '10px 0',
    zIndex: 100
  },
  languageSelectorWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  activeLanguageDisplay: {
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '5px 10px',
    opacity: 0.85,
    userSelect: 'none'
  },
  dropdownArrow: {
    fontSize: '10px',
    marginLeft: '6px',
    transition: 'transform 0.2s',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '120%',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    width: '120px',
    overflow: 'hidden',
    zIndex: 2000, 
  },
  dropdownItem: {
    color: '#111111',
    padding: '12px 15px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  }
};