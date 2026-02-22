import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Main() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const slides = [
    '/images/image1.jpg',
    '/images/image2.jpg',
    '/images/image3.jpg',
    '/images/image4.jpg',
    '/images/image5.jpg',
    '/images/image6.jpg'
  ];

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
      alert("해당 기능은 PC 버전에서 최적화되어 있습니다. 상세 작성은 웹을 이용해 주시기 바랍니다.");
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
      {/* 시작 선택 모달 */}
      {isStartModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsStartModalOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>작업안전분석 시작하기</h3>
            <p style={styles.modalSub}>
              현장 데이터를 클라우드에 보관하고 다른 유저와 공유하시겠습니까?<br />
              로그인 시 큐레이션 기능을 이용할 수 있습니다.
            </p>
            <div style={styles.modalBtnGroup}>
              <button style={styles.loginBtn} onClick={() => navigate('/login')}>로그인 및 회원가입</button>
              <button style={styles.guestBtn} onClick={() => navigate('/info', { state: { isMember: false } })}>비회원으로 즉시 시작</button>
            </div>
            <button style={styles.closeText} onClick={() => setIsStartModalOpen(false)}>취소</button>
          </div>
        </div>
      )}

      {/* SECTION 1: HERO */}
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
            
            {/* ✅ [교정] 헤더 영역: 사례 탐색/내 보관함 배치 및 구분선 적용 */}
            <div style={styles.headerRight}>
              <div className="hidden lg:flex items-center">
                <Link to="/explore" style={styles.headerLink}>사례 탐색</Link>
                <Link to="/library" style={styles.headerLink}>내 보관함</Link>
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

        {/* ✅ 가이드바: 원본 디자인 유지 및 인사말 줄바꿈 적용 */}
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
              <div style={styles.userBadge}>
                {/* ✅ 수정: 줄바꿈이 적용된 환영 문구 */}
                <div style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                  <strong>{user.email}</strong> 님<br />
                  환영합니다.
                </div>
                <button onClick={() => supabase.auth.signOut()} style={styles.logoutLink}>로그아웃</button>
              </div>
            ) : (
              <Link to="/login" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>로그인 / 회원가입</Link>
            )}

            <div style={{ ...styles.navCategory, marginTop: '30px' }}>CONTENTS</div>
            <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가 실시규정 가이드</Link>
            <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가(JRA/JSA) 실무 프로세스</Link>
            <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>보호구에 관하여</Link>
            <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>일반 작업/고위험 작업</Link>
            
            <div style={{ ...styles.navCategory, marginTop: '30px' }}>SECTOR GUIDES (50종)</div>
            <Link to="/guideline/common" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>작업 전 위험성평가 예시</Link>
            <Link to="/guideline/construction" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>건설업 JSA (10종)</Link>
            <Link to="/guideline/high-risk" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>고위험 특수작업 JSA (10종)</Link>
            <Link to="/guideline/manufacturing" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>제조업 JSA (10종)</Link>
            <Link to="/guideline/chemical" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>화공·가스 작업 JSA (10종)</Link>
            <Link to="/guideline/general" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>기타 일반작업 JSA (10종)</Link>
          </nav>
        </div>
        {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

        <div style={styles.mainLayout} className="max-lg:!px-6 max-lg:!flex-col">
          <aside className="hidden lg:block" style={styles.sideAd}></aside> 
          <main style={styles.centerContent} className="max-lg:!pl-0">
            <div style={styles.heroContent}>
              <h2 className="text-[28px] lg:text-[clamp(2.5rem,5vw,3.8rem)] font-extrabold leading-tight mb-6" style={styles.mainTitle}>
                데이터로 잇는 안전,<br />사람을 지키는 기술
              </h2>
              <p className="text-[14px] lg:text-[1.2rem]" style={styles.subTitle}>
                현장의 육안 점검과 지능형 분석 데이터를 결합하여,<br />
                놓치기 쉬운 잠재 위험 요인을 정밀하게 도출합니다.
              </p>
              <button onClick={handleStartClick} style={styles.primaryBtn}>
                위험성 평가 작성하기
              </button>
            </div>
          </main>
          <aside className="hidden lg:block" style={styles.sideAd}></aside>
        </div>
      </section>

      {/* SECTION 2: CORE VALUE */}
      <section style={styles.m3Section} className="max-lg:!py-20">
        <div style={styles.container}>
          <div className="flex flex-col lg:flex-row lg:gap-[100px] items-center">
            <div style={styles.valueTextSide} className="w-full lg:flex-[1.2]">
              <span style={styles.m3Tag} className="block mb-4">CORE VALUE</span>
              <h3 className="text-[24px] lg:text-[3.5rem] font-black mb-8 leading-tight" style={styles.m3Title}>
                실질적 위험 발굴을 돕는<br />지능형 안전 분석 파트너
              </h3>
              <div style={styles.valuePoint}>
                <h4 className="text-lg font-bold mb-2">체계적인 데이터 매칭</h4>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  수많은 작업 시나리오 분석을 통해 구축된 데이터베이스를 기반으로 제안합니다.
                </p>
              </div>
            </div>
            <div className="w-full lg:flex-1 lg:shrink-0">
              <div style={{ ...styles.imageCard, backgroundImage: 'url(/images/image5.jpg)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SECTION 3: 9대 고위험 가이드 (원본 데이터 유지 및 복구) */}
      <section style={{ ...styles.m3Section, backgroundColor: '#fcfcfc' }} className="max-lg:!py-20">
        <div style={styles.container}>
          <div style={styles.m3Header} className="px-6 lg:px-0">
            <span style={styles.m3Tag} className="block mb-4">ANALYSIS GUIDES</span>
            <h3 className="text-[24px] lg:text-[3.5rem] font-black text-[#111]" style={styles.m3Title}>9대 고위험 작업별 위험 분석 가이드</h3>
          </div>
          <div style={styles.jsaCardGrid} className="max-lg:!flex max-lg:!flex-col max-lg:!gap-0">
            {[
              { id: '01', title: '일반 및 공통안전', f: '작업자 건강상태 및 심리적 불안정 미확인', m: 'TBM 활용 혈압 측정 및 음주 여부 확인 실시' },
              { id: '02', title: '고소 작업', f: '작업 발판 단부 및 개구부에서의 작업자 추락', m: '그네식 안전대 착용 및 생명줄(Life-line) 체결 철저' },
              { id: '03', title: '화기 작업', f: '용접 불티 비산으로 인한 주변 가연물 화재/폭발', m: '가연물 제거, 비산 방지포 설치 및 화기 감시자 배치' },
              { id: '04', title: '밀폐 공간', f: '내부 산소 결핍 및 유해가스에 의한 질식/중독', m: '진입 전 농도 측정 및 이동식 송풍기 상시 환기 가동' },
              { id: '05', title: '정전 및 전기', f: '전기 정비 중 제3자의 불시 투입에 의한 감전', m: 'LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관' },
              { id: '06', title: '굴착 작업', f: '법면 붕괴로 인한 작업자 매몰 및 장비 전도', m: '지반 안식각 준수 및 흙막이 지보공 설치 상태 점검' },
              { id: '07', title: '중장비 운용', f: '장비 사각지대 위치 보행자와의 충돌 및 끼임', m: '전담 신호수 배치 및 후방 카메라/감지기 작동 확인' },
              { id: '08', title: '중량물 취급', f: '줄걸이 용구 파단으로 인한 인양물 낙하 및 타격', m: '용구 마모 상태 점검 및 유도 로프(Tag Line) 사용' },
              { id: '09', title: '가연성 가스', f: '배관 기밀 시험 중 누출 가스에 의한 인화/폭발', m: '정전기 방지 조치 및 검지기를 활용한 정밀 점검' }
            ].map(item => (
              <div key={item.id} style={styles.jsaCard}>
                <span style={styles.jsaBadge}>{item.id}</span>
                <h5 style={styles.jsaCardTitle}>{item.title}</h5>
                <div style={styles.jsaFactorBox}><strong>위험요인</strong><p className="text-sm mt-1">{item.f}</p></div>
                <div style={styles.jsaMeasureBox}><strong>감소대책</strong><p className="text-sm mt-1">{item.m}</p></div>
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
              <Link to="/privacy" style={styles.fLink}>개인정보처리방침</Link>
              <Link to="/terms" style={styles.fLink}>이용약관</Link>
              <Link to="/about" style={styles.fLink}>서비스 소개</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // ✅ 헤더 우측 영역 레이아웃 및 구분선 스타일
  headerRight: { display: 'flex', alignItems: 'center' },
  headerLink: { color: '#fff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '1px', marginLeft: '2.5rem', opacity: 0.85 },
  separator: { color: 'rgba(255,255,255,0.3)', margin: '0 2.5rem', fontSize: '0.8rem', pointerEvents: 'none' },

  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto' },
  heroSection: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 10 },
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
  
  // ✅ 가이드바: 원본 디자인 100% 준수
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
  imageCard: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '24px' }
};