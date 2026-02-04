import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import AdBanner from '../AdBanner'; // 광고 슬롯 주석 처리

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: HERO - 사용자 원본 디자인 (규격 및 로직 보존) */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>
        <header style={styles.header}><h1 style={styles.logo}>Smart JSA Bridge</h1></header>
        <div style={styles.mainLayout}>
          {/* [좌측 광고 주석] <aside style={styles.sideAd}><AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside> */}
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          {/* [우측 광고 주석] <aside style={styles.sideAd}><AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside> */}
        </div>
        
        {/* 스크롤 유도 인디케이터 (Material Design 3 반영) */}
        <div style={styles.scrollIndicator}>
          <span style={styles.scrollText}>안전 보건 지식 라이브러리 탐색</span>
          <div style={styles.scrollBar}></div>
        </div>
      </section>

      {/* SECTION 2: VALUE PROPOSITION (수작업 대비 전문성 강화) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>TECHNOLOGY VALUE</span>
            <h3 style={styles.m3Heading}>단순 기록을 넘어 실질적 위험 발굴로</h3>
            <p style={styles.m3SubHeading}>Smart JSA Bridge는 관리자의 행정 부담을 최소화하여,<br />현장의 실질적인 유해위험요인을 파악하는 데 모든 역량을 집중하게 합니다.</p>
          </div>
          <div style={styles.m3Grid}>
            <div style={styles.m3Card}>
              <h4 style={styles.m3CardTitle}>전문 데이터 기반 분석</h4>
              <p style={styles.m3CardText}>10,000건 이상의 산업 재해 사례와 안전 보건 지침을 분석하여,<br />작업 단계에 최적화된 유해 요인을 도출합니다.</p>
            </div>
            <div style={styles.m3Card}>
              <h4 style={styles.m3CardTitle}>현장 맞춤형 솔루션</h4>
              <p style={styles.m3CardText}>제시된 추천 대책을 바탕으로 사용자가 현장 환경을 반영하여<br />최종 편집함으로써 실효성 있는 안전 대책을 수립합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 핵심 작업 JSA 가이드 (유해위험요인 및 대책 중심) */}
      <section style={{...styles.m3Section, backgroundColor: '#f9f9f9'}}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>CORE ANALYSIS GUIDES</span>
            <h3 style={styles.m3Heading}>9대 고위험 작업별 정밀 분석 시나리오</h3>
          </div>
          <div style={styles.jsaGrid}>
            {[
              { id: '01', title: '일반 및 공통안전', factor: '개인 보호구(PPE) 미착용 및 건강상태 미확인', measure: 'TBM을 통한 혈압/음주 확인 및 작업별 적정 보호구 착용' },
              { id: '02', title: '고소 작업', factor: '작업 발판 단부 및 개구부에서의 작업자 추락', measure: '그네식 안전대 착용 및 생명줄(Life-line) 2개소 고정 철저' },
              { id: '03', title: '화기 작업', factor: '용접 불티 비산으로 인한 가연물 화재 및 폭발', measure: '가연물 제거, 비산 방지포 설치 및 화기 감시자 전담 배치' },
              { id: '04', title: '밀폐 공간', factor: '산소 결핍 및 유해 가스에 의한 중독·질식', measure: '진입 전 농도 측정 및 이동식 송풍기를 이용한 상시 강제 환기' },
              { id: '05', title: '정전 및 전기', factor: '정비 중 불시 전원 투입에 의한 협착 및 감전', measure: 'LOTO(잠금장치) 설치 및 검전기를 이용한 무전압 상태 확인' },
              { id: '06', title: '굴착 작업', factor: '법면 붕괴로 인한 작업자 매몰 및 장비 추락', measure: '지반 안식각 준수, 흙막이 지보공 설치 및 단부 접근 통제' },
              { id: '07', title: '중장비 운용', factor: '장비 선회 반경 내 보행 작업자 충돌 및 끼임', measure: '전담 신호수 배치 및 후방 카메라/감지기 정상 작동 확인' },
              { id: '08', title: '중량물 취급', factor: '줄걸이 용구 파단 및 편하중에 의한 인양물 낙하', measure: '마모/변형 로프 폐기 및 유도 로프(Tag Line) 활용 이격' },
              { id: '09', title: '가연성 가스', factor: '배관 기밀 시험 중 누출 가스에 의한 인화/폭발', measure: '정전기 방지 조치 및 방폭형 검지기를 활용한 정밀 누출 점검' }
            ].map(item => (
              <div key={item.id} style={styles.jsaCard}>
                <span style={styles.jsaId}>{item.id}</span>
                <h5 style={styles.jsaTitle}>{item.title}</h5>
                <div style={styles.jsaFactor}><small>위험요인:</small> {item.factor}</div>
                <div style={styles.jsaMeasure}><small>개선대책:</small> {item.measure}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ (심층 분석 및 원리 설명) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>KNOWLEDGE BASE</span>
            <h3 style={styles.m3Heading}>위험성평가 수립 가이드 및 FAQ</h3>
          </div>
          <div style={styles.faqWrapper}>
            <div style={styles.faqItem}>
              <h5>위험도(Risk) 산출은 어떤 논리로 이루어지나요?</h5>
              <p>Smart JSA Bridge는 국제 표준 5x5 Matrix법을 차용합니다. $$Risk(위험도) = Frequency(빈도) \times Severity(강도)$$ 수식을 통해 위험을 계량화하며, 산출된 점수에 따라 즉시 개선 또는 유지 관리의 등급을 제안합니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5>추천된 감소대책을 반드시 편집해야 하는 이유는 무엇인가요?</h5>
              <p>현장의 물리적 환경(온도, 습도, 설비 노후도)은 매 순간 변화합니다. 시스템의 데이터는 전문가가 검증한 '최적의 표준'을 제시하는 것이며, 사용자는 이를 바탕으로 실제 현장의 특이사항을 반영하여 분석의 완성도를 높여야 합니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5>산업안전보건법 제36조와의 연관성은?</h5>
              <p>법 제36조에 명시된 위험성평가 실시 의무는 '근로자의 위험 방지를 위한 실질적 조치'를 목적으로 합니다. 본 서비스는 이러한 법적 절차의 체계적인 기록 보존과 안전 대책의 구체화를 지원합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p>© 2026 Smart JSA Bridge. Created by yizuno</p>
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
  /* 글로벌 및 Material Design 3 규격 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 80px' },

  /* Hero Section (기본 유지) */
  heroSection: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem', color: '#fff' },
  heroContent: { maxWidth: '750px' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', wordBreak: 'keep-all' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none' },

  /* 스크롤 유도 */
  scrollIndicator: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollText: { color: '#fff', fontSize: '0.75rem', opacity: 0.5, letterSpacing: '2px', display: 'block', marginBottom: '10px' },
  scrollBar: { width: '1px', height: '60px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 auto' },

  /* M3 Sections */
  m3Section: { padding: '160px 0' },
  m3Header: { marginBottom: '80px' },
  m3Label: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '4px', marginBottom: '20px', display: 'block' },
  m3Heading: { fontSize: '3rem', fontWeight: '900', marginBottom: '30px', letterSpacing: '-1px', wordBreak: 'keep-all' },
  m3SubHeading: { fontSize: '1.25rem', lineHeight: '1.8', color: '#49454f', wordBreak: 'keep-all' },
  m3Grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' },
  m3Card: { padding: '48px', backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '16px' },
  m3CardTitle: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' },
  m3CardText: { fontSize: '1.1rem', lineHeight: '1.8', color: '#444' },

  /* JSA Grid */
  jsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' },
  jsaCard: { padding: '32px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', position: 'relative' },
  jsaId: { position: 'absolute', top: '24px', right: '24px', fontSize: '1.5rem', fontWeight: '900', color: '#f0f0f0' },
  jsaTitle: { fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', color: '#111' },
  jsaFactor: { fontSize: '0.95rem', lineHeight: '1.6', color: '#d32f2f', marginBottom: '12px', wordBreak: 'keep-all' },
  jsaMeasure: { fontSize: '0.95rem', lineHeight: '1.6', color: '#1976d2', wordBreak: 'keep-all' },

  /* FAQ */
  faqWrapper: { maxWidth: '1000px' },
  faqItem: { marginBottom: '60px', borderBottom: '1px solid #eee', paddingBottom: '40px' },
  finalFooter: { padding: '80px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: '30px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.9rem' }
};