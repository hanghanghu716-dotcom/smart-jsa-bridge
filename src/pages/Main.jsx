import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import AdBanner from '../AdBanner'; // [심사 전략] 광고 슬롯 전체 주석 처리

export default function Main() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: HERO - 사용자 원본 디자인 (규격 및 로직 100% 보존) */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>
        <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}>
            {/* <AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" /> */}
          </aside>
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 지능형 분석 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 도출합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          <aside style={styles.sideAd}>
            {/* <AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" /> */}
          </aside>
        </div>
        
        {/* 스크롤 유도 인디케이터 (Material Design 3 스타일) */}
        <div style={styles.scrollGuide}>
          <span style={styles.scrollLabel}>SCROLL TO EXPLORE</span>
          <div style={styles.scrollTrack}><div style={styles.scrollThumb}></div></div>
        </div>
      </section>

      {/* SECTION 2: VALUE PROPOSITION - 전문가적 지원 체계 강조 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>CORE VALUE</span>
            <h3 style={styles.m3Title}>실질적 위험 발굴을 돕는<br />지능형 안전 분석 파트너</h3>
            <p style={styles.m3Desc}>단순한 기록을 넘어, 사용자가 현장의 유해위험요인을 다각도로 검토하고<br />최적의 대책을 수립할 수 있도록 전문적인 분석 환경을 제공합니다.</p>
          </div>
          <div style={styles.m3FeatureGrid}>
            <div style={styles.m3FeatureCard}>
              <h4>체계적인 데이터 매칭</h4>
              <p>수많은 작업 시나리오 분석을 통해 구축된 데이터베이스를 기반으로,<br />현장 상황에 가장 부합하는 유해위험요인을 제안합니다.</p>
            </div>
            <div style={styles.m3FeatureCard}>
              <h4>편집 기반의 무결성 확보</h4>
              <p>제시된 추천 항목을 토대로 사용자가 직접 현장의 특수성을 반영함으로써,<br />실무적 효용성과 법적 준수성을 동시에 갖춘 보고서를 완성합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 주요 작업 분석 가이드 (시나리오 및 로직 보강) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>ANALYSIS GUIDES</span>
            <h3 style={styles.m3Title}>9대 고위험 작업별 위험 분석 시나리오</h3>
          </div>
          <div style={styles.jsaCardGrid}>
            {[
              { id: '01', title: '일반 및 공통안전', factor: '작업자 건강상태 및 심리적 불안정 미확인', measure: 'TBM 활용 혈압 측정 및 음주 여부 확인 실시' },
              { id: '02', title: '고소 작업', factor: '작업 발판 단부 및 개구부에서의 작업자 추락', measure: '그네식 안전대 착용 및 생명줄(Life-line) 체결 철저' },
              { id: '03', title: '화기 작업', factor: '용접 불티 비산으로 인한 주변 가연물 화재/폭발', measure: '가연물 제거, 비산 방지포 설치 및 화기 감시자 배치' },
              { id: '04', title: '밀폐 공간', factor: '내부 산소 결핍 및 유해가스에 의한 질식/중독', measure: '진입 전 농도 측정 및 이동식 송풍기 상시 환기 가동' },
              { id: '05', title: '정전 및 전기', factor: '전기 정비 중 제3자의 불시 투입에 의한 감전', measure: 'LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관' },
              { id: '06', title: '굴착 작업', factor: '법면 붕괴로 인한 작업자 매몰 및 장비 전도', measure: '지반 안식각 준수 및 흙막이 지보공 설치 상태 점검' },
              { id: '07', title: '중장비 운용', factor: '장비 사각지대 위치 보행자와의 충돌 및 끼임', measure: '전담 신호수 배치 및 후방 카메라/감지기 작동 확인' },
              { id: '08', title: '중량물 취급', factor: '줄걸이 용구 파단으로 인한 인양물 낙하 및 타격', measure: '용구 마모 상태 점검 및 유도 로프(Tag Line) 사용' },
              { id: '09', title: '가연성 가스', factor: '배관 기밀 시험 중 누출 가스에 의한 인화/폭발', measure: '정전기 방지 조치 및 검지기를 활용한 정밀 점검' }
            ].map(item => (
              <div key={item.id} style={styles.jsaCard}>
                <span style={styles.jsaBadge}>{item.id}</span>
                <h5>{item.title}</h5>
                <div style={styles.jsaContent}>
                  <p><strong>위험요인:</strong> {item.factor}</p>
                  <p><strong>감소대책:</strong> {item.measure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ - 시각적 밀도 및 가독성 최적화 (가장 신경 쓴 부분) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>KNOWLEDGE BASE</span>
            <h3 style={styles.m3Title}>위험성평가 수립 가이드 및 FAQ</h3>
          </div>
          <div style={styles.faqContainer}>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 본 서비스로 생성된 보고서가 법적 효력을 갖습니까?</h5>
              <p style={styles.faqA}>본 도구는 위험성평가 수립을 보조하는 지능형 시스템입니다. 생성된 PDF 보고서에 현장 책임자의 실질적인 검토와 서명이 완료되면, 관련 법령에 따른 정식 안전 기록물로 활용이 가능합니다.</p>
            </div>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 서비스가 법적 책임을 대신해 주나요?</h5>
              <p style={styles.faqA}>아니요. 본 서비스는 안전 관리의 편의와 교육을 목적으로 운영됩니다. 현장의 특수성을 반영하여 최종 내용을 편집하고 검토할 책임은 전적으로 사용자에게 있으며, 본 서비스는 결과물에 대해 법적 책임을 지지 않습니다.</p>
            </div>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 위험도(Risk) 산출 로직은 무엇인가요?</h5>
              <div style={styles.mathCard}>Risk (위험도) = Frequency (빈도) × Severity (강도)</div>
              <p style={styles.faqA}>본 시스템은 사고 발생 가능성과 결과의 중대성을 조합한 정량적 평가 기법을 사용하며, 도출된 점수에 따라 적절한 관리 등급(즉시 개선, 유지 관리 등)을 제안합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p style={styles.footerBrand}>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
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
  /* GLOBAL & HERO (원본 보존) */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1280px', margin: '0 auto', padding: '0 40px' },
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

  /* 스크롤 가이드 (M3) */
  scrollGuide: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollLabel: { color: '#fff', fontSize: '0.7rem', opacity: 0.5, letterSpacing: '3px', display: 'block', marginBottom: '12px' },
  scrollTrack: { width: '1px', height: '60px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto', position: 'relative' },
  scrollThumb: { position: 'absolute', top: 0, left: 0, width: '100%', height: '30%', backgroundColor: '#fff' },

  /* M3 Sections (공간감 확보) */
  m3Section: { padding: '160px 0' },
  m3Header: { marginBottom: '80px', textAlign: 'left' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px', marginBottom: '24px', display: 'block' },
  m3Title: { fontSize: '3.2rem', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1.5px', wordBreak: 'keep-all', color: '#111' },
  m3Desc: { fontSize: '1.3rem', lineHeight: '1.8', color: '#49454f', wordBreak: 'keep-all' },
  m3Grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '48px' },
  m3Card: { padding: '56px', backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '16px' },
  m3CardTitle: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '24px' },
  m3CardText: { fontSize: '1.1rem', lineHeight: '1.8', color: '#444', wordBreak: 'keep-all' },

  /* JSA Grid (정돈된 레이아웃) */
  jsaCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' },
  jsaCard: { padding: '40px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  jsaBadge: { position: 'absolute', top: '24px', right: '24px', fontSize: '1.2rem', fontWeight: '900', color: '#f0f0f0' },
  jsaContent: { fontSize: '1rem', lineHeight: '1.7', color: '#333', wordBreak: 'keep-all', marginTop: '20px' },

  /* [수정] FAQ (오밀조밀하지 않은 쾌적한 가독성) */
  faqContainer: { maxWidth: '900px' },
  faqBlock: { marginBottom: '80px' },
  faqQ: { fontSize: '1.4rem', fontWeight: '800', color: '#007bff', marginBottom: '24px', letterSpacing: '-0.5px' },
  faqA: { fontSize: '1.1rem', lineHeight: '1.8', color: '#444', wordBreak: 'keep-all' },
  mathCard: { backgroundColor: '#111', padding: '28px', borderRadius: '8px', color: '#fff', textAlign: 'center', fontSize: '1.3rem', fontWeight: '700', margin: '24px 0', letterSpacing: '0.5px' },

  /* Footer */
  finalFooter: { padding: '80px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: '40px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.9rem' }
};
