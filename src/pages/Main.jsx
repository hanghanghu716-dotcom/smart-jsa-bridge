import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Main() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: HERO - 원본 디자인 및 규격 보존 */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>

        <header style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
            <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
              <span style={styles.menuText}>MENU</span>
              <div style={styles.hamburger}>
                <div style={styles.bar}></div>
                <div style={styles.bar}></div>
              </div>
            </div>
          </div>
        </header>

        {/* SIDE MENU (사이드바) - 스크롤 및 경로 최적화 */}
        <div style={{
          ...styles.sideDrawer,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          visibility: isMenuOpen ? 'visible' : 'hidden'
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
            
            <div style={{ ...styles.navCategory, marginTop: '30px' }}>SECTOR GUIDES (50종)</div>
            <Link to="/guideline/common" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>작업 전 위험성평가 예시</Link>
            <Link to="/guideline/construction" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>건설업 JSA (10종)</Link>
            <Link to="/guideline/high-risk" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>고위험 특수작업 JSA (10종)</Link>
            <Link to="/guideline/general" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>기타 일반작업 JSA (10종)</Link>
            <Link to="/guideline/manufacturing" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>제조업 JSA (10종)</Link>
            <Link to="/guideline/chemical" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>화공·가스 작업 JSA (10종)</Link>
          </nav>
        </div>
        {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}></aside>
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 지능형 분석 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 도출합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          <aside style={styles.sideAd}></aside>
        </div>

        <div style={styles.scrollGuide}>
          <span style={styles.scrollLabel}>SCROLL TO EXPLORE</span>
          <div style={styles.scrollTrack}><div style={styles.scrollThumb}></div></div>
        </div>
      </section>

      {/* SECTION 2: CORE VALUE */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.valueRow}>
            <div style={styles.valueTextSide}>
              <span style={styles.m3Tag}>CORE VALUE</span>
              <h3 style={styles.m3Title}>실질적 위험 발굴을 돕는<br />지능형 안전 분석 파트너</h3>
              <div style={styles.valuePoint}>
                <h4>체계적인 데이터 매칭</h4>
                <p>수많은 작업 시나리오 분석을 통해 구축된 데이터베이스를 기반으로,<br />현장 상황에 가장 부합하는 유해위험요인을 지능적으로 제안합니다.</p>
              </div>
              <div style={styles.valuePoint}>
                <h4>편집 기반의 무결성 확보</h4>
                <p>제시된 추천 항목을 토대로 사용자가 직접 현장의 특수성을 반영함으로써,<br />실무적 효용성과 법적 준수성을 동시에 갖춘 보고서를 완성합니다.</p>
              </div>
            </div>
            <div style={styles.valueImageSide}>
              <div style={{ ...styles.imageCard, backgroundImage: 'url(/images/image5.jpg)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 고위험 가이드 */}
      <section style={{ ...styles.m3Section, backgroundColor: '#fcfcfc' }}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>ANALYSIS GUIDES</span>
            <h3 style={styles.m3Title}>9대 고위험 작업별 위험 분석 가이드</h3>
          </div>
          <div style={styles.jsaCardGrid}>
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
                <div style={styles.jsaFactorBox}><strong>위험요인</strong><p>{item.f}</p></div>
                <div style={styles.jsaMeasureBox}><strong>감소대책</strong><p>{item.m}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
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
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 80px' },
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
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', wordBreak: 'keep-all' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none' },
  scrollGuide: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollLabel: { color: '#fff', fontSize: '0.7rem', opacity: 0.5, letterSpacing: '3px', display: 'block', marginBottom: '12px' },
  scrollTrack: { width: '1px', height: '60px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto', position: 'relative' },
  scrollThumb: { position: 'absolute', top: 0, left: 0, width: '100%', height: '30%', backgroundColor: '#fff' },

  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  menuText: { color: '#fff', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '2px' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '6px' },
  bar: { width: '24px', height: '2px', backgroundColor: '#fff' },
  sideDrawer: {
    position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh',
    backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch'
  },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px', flexShrink: 0 },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '100px' },
  navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.2rem', fontWeight: '700', padding: '20px 0', borderBottom: '1px solid #f0f0f0' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },

  m3Section: { padding: '160px 0' },
  valueRow: { display: 'flex', gap: '100px', alignItems: 'center' },
  valueTextSide: { flex: 1.2 },
  valuePoint: { marginBottom: '60px' },
  valueImageSide: { flex: 1 },
  imageCard: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' },
  m3Header: { marginBottom: '100px' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px', marginBottom: '24px', display: 'block' },
  m3Title: { fontSize: '3.5rem', fontWeight: '900', marginBottom: '32px', color: '#111' },
  jsaCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' },
  jsaCard: { padding: '48px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  jsaBadge: { position: 'absolute', top: '32px', right: '32px', fontSize: '1.2rem', fontWeight: '900', color: '#f0f0f0' },
  jsaCardTitle: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '32px', color: '#111' },
  jsaFactorBox: { marginBottom: '24px', paddingLeft: '16px', borderLeft: '3px solid #ff4d4d' },
  jsaMeasureBox: { paddingLeft: '16px', borderLeft: '3px solid #007bff' },
  finalFooter: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: '40px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.95rem' }
};