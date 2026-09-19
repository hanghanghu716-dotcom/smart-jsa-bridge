import { LANGUAGE_OPTIONS, SUPPORTED_LANGS, getCaseLanguages, selectLocalizedCases } from '../locales/config.js';
import { useState, useEffect, useLayoutEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdSenseUnit from '../components/AdSenseUnit';
import SEO from '../components/SEO'; 
import { useTranslation } from 'react-i18next';
import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';
import { AuthContext } from '../contexts/AuthContext'; 

// Compact header copy is kept here so this file can be replaced independently.
// Optional main:header.* translations take precedence over these defaults.
const HEADER_COPY = {
  ko: ['규정 가이드', 'JSA 절차', '위험요인 DB', '사례 탐색', '현장 사례', '내 보관함', '언어 및 지역', '전체 메뉴', '닫기'],
  en: ['Regulations', 'JSA Process', 'Hazard DB', 'Explore', 'Case Studies', 'My Library', 'Language & region', 'Menu', 'Close'],
  de: ['Vorschriften', 'JSA-Ablauf', 'Gefahren-DB', 'Entdecken', 'Fallstudien', 'Meine Bibliothek', 'Sprache & Region', 'Menü', 'Schließen'],
  ja: ['規程ガイド', 'JSA手順', '危険要因DB', '事例検索', '現場事例', 'マイライブラリ', '言語・地域', 'メニュー', '閉じる'],
  fr: ['Réglementation', 'Procédure JSA', 'Base de risques', 'Explorer', 'Études de cas', 'Ma bibliothèque', 'Langue et région', 'Menu', 'Fermer'],
  it: ['Normative', 'Procedura JSA', 'DB rischi', 'Esplora', 'Casi studio', 'La mia raccolta', 'Lingua e regione', 'Menu', 'Chiudi'],
  es: ['Normativa', 'Proceso JSA', 'BD de riesgos', 'Explorar', 'Casos prácticos', 'Mi biblioteca', 'Idioma y región', 'Menú', 'Cerrar'],
  ar: ['اللوائح', 'إجراءات JSA', 'قاعدة المخاطر', 'استكشاف', 'دراسات حالة', 'مكتبتي', 'اللغة والمنطقة', 'القائمة', 'إغلاق'],
  pt: ['Normas', 'Processo APR', 'BD de riscos', 'Explorar', 'Estudos de caso', 'Minha biblioteca', 'Idioma e região', 'Menu', 'Fechar'],
  ru: ['Нормативы', 'Процесс JSA', 'База рисков', 'Поиск', 'Примеры', 'Моя библиотека', 'Язык и регион', 'Меню', 'Закрыть'],
};
const HEADER_KEYS = ['regulation', 'process', 'database', 'explore', 'cases', 'library', 'language', 'menu', 'close'];
const HEADER_CSS = `
  .main-header { padding: 28px clamp(16px, 3vw, 48px) !important; }
  .main-header-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; position: relative; }
  .main-brand { flex: 0 0 auto; white-space: nowrap; margin: 0; font-size: clamp(14px, 1.5vw, 22px); letter-spacing: 1px; font-weight: 900; color: white; }
  .main-brand a { color: inherit; text-decoration: none; }
  .main-header-nav { display: flex; align-items: center; gap: clamp(16px, 1.5vw, 24px); width: max-content; flex: 0 0 auto; }
  .main-header-nav.is-collapsed { position: absolute; visibility: hidden; pointer-events: none; }
  .main-header-link { appearance: none; background: none; border: 0; padding: 10px 0; font: inherit; font-size: .9rem; font-weight: 700; line-height: 1.4; color: white; text-decoration: none; white-space: nowrap; flex: 0 0 auto; cursor: pointer; opacity: .9; }
  .main-header-actions { display: flex; align-items: center; gap: 16px; flex: 0 0 auto; }
  .main-language-button, .main-menu-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; color: white; background: rgba(0,0,0,.18); font: inherit; font-size: .875rem; font-weight: 700; line-height: 1.4; white-space: nowrap; flex-shrink: 0; cursor: pointer; }
  .main-menu-button { min-width: 44px; padding: 10px; }
  .main-language-panel { position: absolute; top: calc(100% + 10px); inset-inline-end: 0; width: min(320px, calc(100vw - 32px)); max-height: min(65dvh, 480px); overflow-y: auto; overscroll-behavior: contain; background: white; color: #111; padding: 8px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.22); z-index: 2000; }
  .main-language-heading { padding: 8px 12px; font-size: .8rem; font-weight: 700; color: #606975; }
  .main-language-option { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; min-height: 44px; text-align: start; border: 0; border-radius: 6px; background: white; color: #111; font: inherit; font-size: .875rem; line-height: 1.5; cursor: pointer; }
  .main-language-option[aria-current="true"] { background: #edf5ff; color: #0759b6; font-weight: 700; }
  .main-language-option:hover { background: #f1f5f9; }
  .main-header-link:hover { opacity: 1; }
  .main-header button:focus-visible, .main-header a:focus-visible { outline: 2px solid #60a5fa; outline-offset: 4px; }
  .main-language-option:focus-visible { outline-offset: -2px !important; }
  .main-side-drawer { width: min(400px, 100vw); }
  .main-drawer-action { background: none; border: 0; text-align: start; font-family: inherit; cursor: pointer; }
  @media (max-width: 639px) {
    .main-header { padding: 16px 12px !important; }
    .main-header-row { gap: 8px; }
    .main-brand { font-size: 14px; letter-spacing: 0; }
    .main-header-actions { gap: 6px; }
    .main-language-button { padding: 8px; gap: 4px; font-size: .75rem; }
    .main-language-globe, .main-menu-label { display: none; }
    .main-language-panel { position: fixed; top: 72px; left: 12px; right: 12px; width: auto; }
    .main-side-drawer { width: 100%; padding: 28px 24px !important; }
  }
`;

export default function Main() {
  const navigate = useLanguageNavigate(); 
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [showHeaderNav, setShowHeaderNav] = useState(false);
  const headerRowRef = useRef(null);
  const brandRef = useRef(null);
  const headerNavRef = useRef(null);
  const headerActionsRef = useRef(null);
  const languageWrapperRef = useRef(null);
  const languageButtonRef = useRef(null);
  const languagePanelRef = useRef(null);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const [caseStudies, setCaseStudies] = useState([]);
  // 검색 및 페이지네이션을 위한 새로운 상태 변수 선언
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const { user } = useContext(AuthContext);

// 언어 및 캐나다 주 선택
  const pathLanguage = location.pathname.split('/')[1];
  const currentLanguage = SUPPORTED_LANGS.includes(pathLanguage)
    ? pathLanguage : (i18n.language || 'ko');
  const languages = currentLanguage === 'en-CA'
    ? [{ code: 'en-CA', label: 'English (Canada)' }, ...LANGUAGE_OPTIONS]
    : LANGUAGE_OPTIONS;
  const baseLanguage = currentLanguage.split('-')[0];
  const headerDefaults = HEADER_COPY[baseLanguage] || HEADER_COPY.en;
  const headerLabels = Object.fromEntries(HEADER_KEYS.map((key, index) => [
    key, t('header.' + key, { defaultValue: headerDefaults[index] }),
  ]));
  const activeLanguageLabel = languages.find(lng => lng.code === currentLanguage)?.label
    || (currentLanguage === 'en-CA' ? 'English (Canada)' : currentLanguage);
  const shortLanguageLabel = currentLanguage === 'ko' ? '한국어'
    : currentLanguage === 'ja-JP' ? '日本語'
    : currentLanguage.toUpperCase().replace('-', ' · ');

  // Measure the actual translated labels, including after a font or viewport change.
  useLayoutEffect(() => {
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const row = headerRowRef.current;
      const brand = brandRef.current;
      const nav = headerNavRef.current;
      const actions = headerActionsRef.current;
      if (!row || !brand || !nav || !actions) return;
      const gap = parseFloat(window.getComputedStyle(row).columnGap) || 24;
      const requiredWidth = brand.getBoundingClientRect().width
        + nav.getBoundingClientRect().width + actions.getBoundingClientRect().width + gap * 2;
      setShowHeaderNav(window.innerWidth >= 960 && requiredWidth + 8 <= row.clientWidth);
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    [headerRowRef, brandRef, headerNavRef, headerActionsRef].forEach(ref => {
      if (ref.current) observer?.observe(ref.current);
    });
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    measure();
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [currentLanguage, t]);

  useEffect(() => {
    if (!isLanguageOpen) return;
    const panel = languagePanelRef.current;
    (panel?.querySelector('[aria-current="true"]') || panel?.querySelector('button'))?.focus();
    const closeOutside = event => {
      if (!languageWrapperRef.current?.contains(event.target)) setIsLanguageOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsLanguageOpen(false);
        languageButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isLanguageOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const drawer = drawerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawer?.querySelector('button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
      }
      if (event.key !== 'Tab') return;
      const controls = [...(drawer?.querySelectorAll('a[href], button:not([disabled])') || [])];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [isMenuOpen]);

  const openLibrary = () => {
    setIsMenuOpen(false);
    if (user) navigate('/library');
    else setIsStartModalOpen(true);
  };

  const handleLanguageKeyDown = event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [...languagePanelRef.current.querySelectorAll('button')];
    const index = options.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  };

  const handleLanguageChange = (lngCode) => {
    const segments = location.pathname.split('/');
    const supportedCodes = SUPPORTED_LANGS;

    if (supportedCodes.includes(segments[1])) {
      segments[1] = lngCode;
    } else {
      segments.splice(1, 0, lngCode);
    }

    const newPath = segments.join('/') || '/';
    window.location.href = newPath + location.search + location.hash;
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
    const fetchRecentCases = async () => {
      const pathLang = window.location.pathname.split('/')[1];
      const supportedCodes = SUPPORTED_LANGS;
      const currentLang = supportedCodes.includes(pathLang) ? pathLang : (i18n.language || 'ko');

      const { data, error } = await supabase
        .from('case_studies')
        .select('post_group_id, title, meta_description, created_at, language_code')
        .in('language_code', getCaseLanguages(currentLang))
        .order('created_at', { ascending: false }); // 구글 봇 탐색 권장 조건에 맞춰 제한 없이 전량 확보

      if (error) {
        console.error('Case studies fetch error:', error);
      } else {
        setCaseStudies(selectLocalizedCases(data || [], currentLang));
      }
    };
    fetchRecentCases();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [slides.length, i18n.language]);

  const handleStartClick = () => {
    if (user) {
      navigate('/info', { state: { isMember: true } });
    } else {
      setIsStartModalOpen(true);
    }
  };

  // 실시간 검색어 기반 데이터 필터링 정의
  const filteredCaseStudies = caseStudies.filter(caseItem => {
    const query = searchQuery.toLowerCase();
    return (
      caseItem.title?.toLowerCase().includes(query) ||
      caseItem.meta_description?.toLowerCase().includes(query)
    );
  });

  // 필터링된 결과 데이터를 기준으로 페이지네이션 계산 처리
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredCaseStudies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCaseStudies.length / ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const element = document.getElementById('case-studies');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.wrapper}>
      <SEO />
      <style>{HEADER_CSS}</style>

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

        <header style={styles.header} className="main-header">
          <div ref={headerRowRef} className="main-header-row">
            <h1 ref={brandRef} className="main-brand">
              <LanguageLink to="/">Smart JSA Bridge</LanguageLink>
            </h1>
            <nav
              ref={headerNavRef}
              className={'main-header-nav' + (showHeaderNav ? '' : ' is-collapsed')}
              aria-label={headerLabels.menu}
              aria-hidden={!showHeaderNav}
              inert={!showHeaderNav}
            >
              <LanguageLink to="/regulation" className="main-header-link">{headerLabels.regulation}</LanguageLink>
              <LanguageLink to="/jrajsa" className="main-header-link">{headerLabels.process}</LanguageLink>
              <LanguageLink to="/dictionary" className="main-header-link">{headerLabels.database}</LanguageLink>
              <LanguageLink to="/explore" className="main-header-link">{headerLabels.explore}</LanguageLink>
              <a href="#case-studies" className="main-header-link">{headerLabels.cases}</a>
              <button type="button" className="main-header-link" onClick={openLibrary}>{headerLabels.library}</button>
            </nav>
            <div ref={headerActionsRef} className="main-header-actions">
              <div
                ref={languageWrapperRef}
                style={styles.languageSelectorWrapper}
                onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setIsLanguageOpen(false);
                }}
              >
                <button
                  ref={languageButtonRef}
                  type="button"
                  className="main-language-button"
                  aria-label={headerLabels.language + ': ' + activeLanguageLabel}
                  aria-expanded={isLanguageOpen}
                  aria-controls="main-language-panel"
                  title={activeLanguageLabel}
                  onClick={() => setIsLanguageOpen(open => !open)}
                  onKeyDown={event => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setIsLanguageOpen(true);
                    }
                  }}
                >
                  <svg className="main-language-globe" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" />
                  </svg>
                  <bdi>{shortLanguageLabel}</bdi>
                  <span aria-hidden="true" style={{ ...styles.dropdownArrow, marginLeft: 0, transform: isLanguageOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </button>
                {isLanguageOpen && (
                  <div id="main-language-panel" ref={languagePanelRef} className="main-language-panel" onKeyDown={handleLanguageKeyDown}>
                    <div className="main-language-heading">{headerLabels.language}</div>
                    {languages.map(lng => (
                      <button
                        type="button"
                        key={lng.code}
                        className="main-language-option"
                        aria-current={lng.code === currentLanguage ? 'true' : undefined}
                        onClick={() => handleLanguageChange(lng.code)}
                      >
                        <bdi>{lng.label}</bdi>
                        <span aria-hidden="true">{lng.code === currentLanguage ? '✓' : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                ref={menuButtonRef}
                type="button"
                className="main-menu-button"
                aria-label={headerLabels.menu}
                aria-expanded={isMenuOpen}
                aria-controls="main-side-drawer"
                onClick={() => { setIsLanguageOpen(false); setIsMenuOpen(true); }}
              >
                <span className="main-menu-label">{headerLabels.menu}</span>
                <span style={styles.hamburger} aria-hidden="true"><span style={styles.bar} /><span style={styles.bar} /></span>
              </button>
            </div>
          </div>
        </header>

        <div
          id="main-side-drawer"
          ref={drawerRef}
          className="main-side-drawer"
          role="dialog"
          aria-modal={isMenuOpen ? true : undefined}
          aria-label={headerLabels.menu}
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen}
          style={{
            ...styles.sideDrawer,
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            visibility: isMenuOpen ? 'visible' : 'hidden',
          }}
        >
          <div style={styles.drawerHeader}>
            <button type="button" className="main-drawer-action" style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ {headerLabels.close}</button>
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
                <LanguageLink to="/profile" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>
                  {t('profileEdit')}
                </LanguageLink>
              </>
            ) : (
              <LanguageLink to="/login" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('loginSignup')}</LanguageLink>
            )}

            <div style={{ ...styles.navCategory, marginTop: '30px' }}>CONTENTS</div>
            <LanguageLink to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navRegulation')}</LanguageLink>
            <LanguageLink to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navProcess')}</LanguageLink>
            <LanguageLink to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navPPE')}</LanguageLink>
            <LanguageLink to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navRiskClass')}</LanguageLink>
            <LanguageLink to="/dictionary" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navDB')}</LanguageLink>
            <a href="#case-studies" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>
              {t('navCaseStudy', { defaultValue: 'Case Studies' })}
            </a>
            <LanguageLink to="/explore" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navExplore')}</LanguageLink>
            <button type="button" className="main-drawer-action" style={styles.drawerLink} onClick={openLibrary}>{t('navLibrary')}</button>
            <div style={{ ...styles.navCategory, marginTop: '30px' }}>SECTOR GUIDES (50종)</div>
            <LanguageLink to="/guideline/common" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideCommon')}</LanguageLink>
            <LanguageLink to="/guideline/construction" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideConstruction')}</LanguageLink>
            <LanguageLink to="/guideline/high-risk" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideHighRisk')}</LanguageLink>
            <LanguageLink to="/guideline/manufacturing" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideManufacturing')}</LanguageLink>
            <LanguageLink to="/guideline/chemical" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideChemical')}</LanguageLink>
            <LanguageLink to="/guideline/general" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>{t('navGuideGeneral')}</LanguageLink>
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

            <div style={styles.heroBtnGroup}>
                <button 
                  onClick={() => navigate('/procedure', { 
                    state: { 
                      isMember: !!user, 
                      isFastTrack: true,
                      formData: {
                        projectName: t('fastTrackDefaultTitle', { defaultValue: '초고속 자동 위험성평가 작업' }),
                        department: '',
                        workLocation: '',
                        workDate: new Date().toISOString().split('T')[0],
                        managerName: '',
                        workType: '정기작업',
                        weather: '맑음',
                        hasNewWorker: false,
                        ppe: [],
                        permits: [],
                        equipment: '',
                        additionalItems: '',
                        jsaType: '2-step'
                      },
                      participants: Array(14).fill('')
                    } 
                  })} 
                  style={styles.fastTrackBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                    e.currentTarget.style.borderColor = '#0056b3';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 123, 255, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                    e.currentTarget.style.borderColor = '#007bff';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.3)';
                  }}
                >
                  {t('heroFastTrackBtn')}
                </button>

                <button 
                  onClick={handleStartClick} 
                  style={styles.primaryBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(24, 24, 24, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  {t('heroBtn')}
                </button>
              </div>
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

      <div className="lg:hidden" style={styles.mobileAdSector}>
        <div style={styles.mobileAdBox}>
          <span style={styles.adLabelDark}>MOBILE BRIDGE AD</span>
          <AdSenseUnit client={PUBLISHER_ID} slot={MAIN_MOBILE_BRIDGE_SLOT_ID} format="horizontal" style={{ display: 'block' }} />
        </div>
      </div>

      <section style={styles.m3Section} className="max-lg:!py-20">
        <div style={styles.container} className="max-lg:!px-6">
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

      <section style={{ ...styles.m3Section, backgroundColor: '#fcfcfc' }} className="max-lg:!py-20">
        <div style={styles.container} className="max-lg:!px-6">
          <div style={styles.m3Header} className="lg:px-0">
            <span style={styles.m3Tag} className="block mb-4">ANALYSIS GUIDES</span>
            <h3 className="text-[24px] lg:text-[3.5rem] font-black text-[#111]" style={styles.m3Title}>{t('analysisGuideTitle')}</h3>
          </div>
            <div style={styles.jsaCardGrid} className="max-lg:!flex max-lg:!flex-col max-lg:!gap-0">
            {['01', '02', '03', '04', '05', '06', '07', '08', '09'].map(id => {
              const guidePaths = {
                '01': '/guideline/common',
                '02': '/guideline/construction',
                '03': '/guideline/manufacturing',
                '04': '/guideline/chemical',
                '05': '/guideline/high-risk',
                '06': '/guideline/general',
                '07': '/guideline/common',
                '08': '/guideline/construction',
                '09': '/guideline/manufacturing'
              };
              const targetPath = guidePaths[id] || '/guideline/common';

              return (
                <LanguageLink key={id} to={targetPath} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ ...styles.jsaCard, cursor: 'pointer' }}>
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
                </LanguageLink>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* 구글 애드센스 대응 및 통합 탐색 Case Studies 섹션 */}
      <section id="case-studies" style={{ ...styles.m3Section, backgroundColor: '#ffffff' }} className="max-lg:!py-20">
        <div style={styles.container} className="max-lg:!px-6">
          <div style={styles.m3Header} className="lg:px-0 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
            <div>
              <span style={styles.m3Tag} className="block mb-4">{t('caseStudySectionTag', { defaultValue: 'LATEST CASE STUDIES' })}</span>
              <h3 className="text-[24px] lg:text-[3.5rem] font-black text-[#111]" style={styles.m3Title}>
                {t('caseStudySectionTitle', { defaultValue: '현장 사례 연구' })}
              </h3>
            </div>
          {/* 동적 검색 인프라 구조 배치 */}
            <div style={styles.searchContainer}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={styles.searchIcon}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="사례 제목 또는 내용 검색..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); 
                }}
                style={styles.searchInput}
              />
            </div>
          </div>

          {currentItems.length > 0 ? (
            <>
              <div style={styles.jsaCardGrid} className="max-lg:!flex max-lg:!flex-col max-lg:!gap-0 mt-8 lg:px-0">
                {currentItems.map((caseItem) => (
                  <LanguageLink 
                    key={caseItem.post_group_id} 
                    to={`/case-study/${caseItem.post_group_id}`} 
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{ ...styles.jsaCard, cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <h5 style={{ ...styles.jsaCardTitle, fontSize: '1.4rem', marginBottom: '16px' }}>{caseItem.title}</h5>
                      <p style={{ color: '#555', fontSize: '1rem', lineHeight: '1.6', flex: 1, marginBottom: '24px' }}>
                        {caseItem.meta_description}
                      </p>
                      <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 'bold' }}>
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </LanguageLink>
                ))}
              </div>

              {/* 페이지네이션 인터페이스 제어 요소 */}
              {totalPages > 1 && (
                <div style={styles.paginationContainer}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      style={{
                        ...styles.paginationButton,
                        backgroundColor: currentPage === pageNumber ? '#007bff' : '#ffffff',
                        color: currentPage === pageNumber ? '#ffffff' : '#111111',
                        borderColor: currentPage === pageNumber ? '#007bff' : '#eee'
                      }}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
              )}

              {/* 검색엔진 크롤러 전용 전체 게시물 링크 트리 (UI 화면에는 미노출) */}
              <div style={{ display: 'none' }} aria-hidden="true">
                {caseStudies.map((caseItem) => (
                  <LanguageLink 
                    key={`crawler-${caseItem.post_group_id}`} 
                    to={`/case-study/${caseItem.post_group_id}`}
                  >
                    {caseItem.title}
                  </LanguageLink>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.noResultBox}>
              검색 조건과 일치하는 현장 사례 연구 내역이 존재하지 않습니다.
            </div>
          )}
        </div>
      </section>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6">
          <div style={styles.footerFlex} className="max-lg:!flex-col max-lg:!items-start max-lg:!gap-6">
            <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
            <div style={styles.footerLinks} className="max-lg:!flex-wrap max-lg:gap-y-4">
              <LanguageLink to="/regulation" style={styles.fLink}>{t('navRegulation')}</LanguageLink>
              <LanguageLink to="/jrajsa" style={styles.fLink}>{t('navProcess')}</LanguageLink>
              <LanguageLink to="/dictionary" style={styles.fLink}>{t('navDB')}</LanguageLink>
              <span className="max-lg:hidden" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.95rem' }}>|</span>
              <LanguageLink to="/privacy" style={styles.fLink}>{t('footerPrivacy')}</LanguageLink>
              <LanguageLink to="/terms" style={styles.fLink}>{t('footerTerms')}</LanguageLink>
              <LanguageLink to="/about" style={styles.fLink}>{t('footerAbout')}</LanguageLink>
              <LanguageLink to="/archive" style={styles.fLink}>{t('footerArchive', { defaultValue: 'Archive' })}</LanguageLink>            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto' },
  heroSection: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 1000, position: 'relative' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { width: '160px', flexShrink: 0 },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem', color: '#fff' },
  heroContent: { maxWidth: '750px' },
  mainTitle: { fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem' },
  subTitle: { lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem' },
  primaryBtn: { 
    display: 'inline-block', 
    padding: '1.2rem 4.5rem', 
    backgroundColor: 'rgba(24, 24, 24, 0.6)', 
    color: '#ffffff', 
    borderRadius: '4rem', 
    fontSize: '1.1rem', 
    fontWeight: 'bold', 
    border: '1px solid rgba(255, 255, 255, 0.2)', 
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  fastTrackBtn: {
    display: 'inline-block',
    padding: '1.2rem 4.5rem',
    backgroundColor: '#007bff',
    color: '#ffffff',
    borderRadius: '4rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    border: '1px solid #007bff',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 15px rgba(0, 123, 255, 0.3)'
  },
  heroBtnGroup: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginTop: '1rem'
  },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' },
  modalContent: { backgroundColor: '#111', padding: '3.5rem', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '480px', border: '1px solid #333' },
  modalTitle: { color: '#fff', fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.2rem' },
  modalSub: { color: '#999', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.6' },
  modalBtnGroup: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  loginBtn: { padding: '1.2rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  guestBtn: { padding: '1.2rem', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  closeText: { marginTop: '1.5rem', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '6px' },
  bar: { width: '24px', height: '2px', backgroundColor: '#fff' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 2500, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.75rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '15px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f5f5f5' },
  userBadge: { backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', color: '#111' },
  logoutLink: { display: 'block', marginTop: '10px', color: '#ff4d4d', border: 'none', background: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2499 },
  m3Section: { padding: '160px 0' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px' },
  m3Title: { fontWeight: '900', color: '#111' },
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
    position: 'fixed', top: '50%', left: '20px', transform: 'translateY(-50%)',
    width: '160px', minHeight: '600px', backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', zIndex: 100
  },
  adPlaceholderFixedRight: {
    position: 'fixed', top: '50%', right: '20px', transform: 'translateY(-50%)',
    width: '160px', minHeight: '600px', backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', zIndex: 100
  },
  languageSelectorWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  dropdownArrow: { fontSize: '10px', marginLeft: '6px', transition: 'transform 0.2s' },
  
  searchContainer: { 
    minWidth: '280px', 
    position: 'relative', 
    marginBottom: '20px' // 리스트와의 이격 확보를 위한 하단 여백 추가
  },
  searchInput: {
    width: '100%', 
    padding: '12px 20px 12px 44px', // 좌측 아이콘이 위치할 패딩 공간 확보
    fontSize: '0.95rem', 
    color: '#111',
    border: '1px solid #e0e0e0', 
    borderRadius: '30px', 
    outline: 'none', 
    backgroundColor: '#f4f5f7', // 시각적 구분을 위한 미세한 음영(밝은 회색) 적용
    transition: 'all 0.2s ease-in-out'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    color: '#888',
    pointerEvents: 'none' // 아이콘 클릭 시에도 인풋 창에 포커스가 가도록 설정
  },
  paginationContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '50px', width: '100%' },
  paginationButton: {
    padding: '10px 18px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid',
    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease-in-out'
  },
  noResultBox: { width: '100%', textAlign: 'center', padding: '80px 0', color: '#666', fontSize: '1.1rem' }
};
