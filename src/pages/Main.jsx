import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import AdBanner from '../AdBanner'; // [심사 대기] 광고 슬롯 주석 처리

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: HERO - 사용자 원본 디자인 규격 및 로직 100% 보존 */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>
        <header style={styles.header}><h1 style={styles.logo}>Smart JSA Bridge</h1></header>
        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}>
            {/* <AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" /> */}
          </aside>
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          <aside style={styles.sideAd}>
            {/* <AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" /> */}
          </aside>
        </div>
        
        {/* 스크롤 유도 인디케이터 (Material Design 반영) */}
        <div style={styles.scrollIndicator}>
          <span style={styles.scrollText}>EXPLORE SAFETY KNOWLEDGE</span>
          <div style={styles.scrollLine}></div>
        </div>
      </section>

      {/* SECTION 2: VALUE PROPOSITION - 서비스 가치 제안 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>VALUE PROPOSITION</span>
            <h3 style={styles.m3Heading}>실질적 위험 발굴에 집중하는<br />지능형 분석 환경</h3>
            <p style={styles.m3SubHeading}>행정적인 소모를 줄이고 현장의 본질적인 안전 확보에 전념할 수 있도록 설계되었습니다.</p>
          </div>
          <div style={styles.m3Grid}>
            <div style={styles.m3Card}>
              <h4 style={styles.m3CardTitle}>정밀 안전 데이터베이스</h4>
              <p style={styles.m3CardText}>전문가가 검증한 방대한 안전 지침과 사고 사례를 분석하여,<br />작업 단계별 유해위험요인을 정확하게 식별합니다.</p>
            </div>
            <div style={styles.m3Card}>
              <h4 style={styles.m3CardTitle}>사용자 중심의 가변적 분석</h4>
              <p style={styles.m3CardText}>시스템의 추천을 바탕으로 현장 관리자가 실제 환경에 맞춰 내용을 편집하여<br />현장에 즉시 적용 가능한 실효성 있는 대책을 수립합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 핵심 작업 가이드 - 유해위험요인 및 감소대책 (보강됨) */}
      <section style={{...styles.m3Section, backgroundColor: '#f9f9f9'}}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>CORE ANALYSIS GUIDES</span>
            <h3 style={styles.m3Heading}>9대 주요 작업별 유해위험요인 및 대책</h3>
          </div>
          <div style={styles.jsaGrid}>
            {[
              { id: '01', title: '일반 안전', f: '작업자 건강상태 및 심리적 불안정 미확인', m: 'TBM 활용 혈압 측정 및 음주 여부 확인 실시' },
              { id: '02', title: '고소 작업', f: '작업 발판 단부 및 개구부에서의 작업자 추락', m: '그네식 안전대 착용 및 생명줄(Life-line) 체결 철저' },
              { id: '03', title: '화기 작업', f: '용접 불티 비산으로 인한 주변 가연물 화재/폭발', m: '가연물 제거, 비산 방지포 설치 및 화기 감시자 배치' },
              { id: '04', title: '밀폐 공간', f: '내부 산소 결핍 및 유해가스에 의한 질식/중독', m: '진입 전 농도 측정 및 이동식 송풍기 상시 환기 가동' },
              { id: '05', title: '정전 작업', f: '전기 정비 중 제3자의 불시 투입에 의한 감전', m: 'LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관' },
              { id: '06', title: '굴착 작업', f: '법면 붕괴로 인한 작업자 매몰 및 장비 전도', m: '지반 안식각 준수 및 흙막이 지보공 설치 상태 점검' },
              { id: '07', title: '중장비 운용', f: '장비 사각지대 위치 보행자와의 충돌 및 끼임', m: '전담 신호수 배치 및 후방 카메라/감지기 작동 확인' },
              { id: '08', title: '중량물 취급', f: '줄걸이 용구 파단으로 인한 인양물 낙하 및 타격', m: '용구 마모 상태 점검 및 유도 로프(Tag Line) 사용' },
              { id: '09', title: '가연성 가스', f: '배관 기밀 시험 중 누출 가스에 의한 인화/폭발', m: '정전기 방지 조치 및 검지기를 활용한 정밀 점검' }
            ].map(item => (
              <div key={item.id} style={styles.jsaCard}>
                <span style={styles.jsaId}>{item.id}</span>
                <h5 style={styles.jsaTitle}>{item.title}</h5>
                <div style={styles.jsaContext}>
                  <p><strong>위험요인:</strong> {item.f}</p>
                  <p><strong>감소대책:</strong> {item.m}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ - 법적 책임 및 효력 (고도화됨) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Label}>LEGAL & KNOWLEDGE</span>
            <h3 style={styles.m3Heading}>위험성평가 가이드 및 FAQ</h3>
          </div>
          <div style={styles.faqWrapper}>
            <div style={styles.faqItem}>
              <h5 style={styles.faqQ}>Q. 본 서비스로 생성된 보고서가 법적 효력을 갖습니까?</h5>
              <p style={styles.faqA}>본 도구는 위험성평가 수립을 보조하는 시스템입니다. 생성된 PDF 보고서에 현장 책임자의 실질적인 검토와 서명이 완료되면, 산업안전보건법에 따른 정식 기록물로 활용이 가능합니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5 style={styles.faqQ}>Q. 서비스가 법적 책임을 대신해 주나요?</h5>
              <p style={styles.faqA}>아니요. 본 서비스는 안전 관리의 편의와 교육을 목적으로 합니다. 현장의 특수성을 반영하여 최종 내용을 편집하고 검토할 책임은 사용자에게 있으며, 본 서비스는 결과물에 대해 법적 책임을 지지 않습니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5 style={styles.faqQ}>Q. 위험도(Risk) 산출 원리는 무엇인가요?</h5>
              <div style={styles.mathBox}>
                <span style={styles.mathText}>Risk (위험도) = Frequency (빈도) × Severity (강도)</span>
              </div>
              <p style={styles.faqA}>고용노동부 가이드라인에 따른 5x5 Matrix법을 차용하여 위험성을 계량화하며, 산출된 점수에 따라 즉시 개선 또는 유지 관리 등급을 제안합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p style={styles.footerCopy}>© 2026 <strong>Smart JSA Bridge</strong>. Created by <strong>yizuno</strong></p>
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
  /* 글로벌 및 Material Design 3 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 80px' },
  
  /* Hero (원본 유지) */
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

  /* 스크롤 유도 */
  scrollIndicator: { position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollText: { color: '#fff', fontSize: '0.75rem', opacity: 0.5, letterSpacing: '4px', display: 'block', marginBottom: '12px' },
  scrollLine: { width: '1px', height: '80px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 auto' },

  /* M3 Sections */
  m3Section: { padding: '160px 0' },
  m3Header: { marginBottom: '80px' },
  m3Label: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '24px', display: 'block' },
  m3Heading: { fontSize: '3.5rem', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1.5px', wordBreak: 'keep-all' },
  m3SubHeading: { fontSize: '1.4rem', lineHeight: '1.8', color: '#49454f', maxWidth: '900px', wordBreak: 'keep-all' },
  m3Grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '48px' },
  m3Card: { padding: '56px', backgroundColor: '#fdfdfd', border: '1px solid #eee', borderRadius: '16px' },
  m3CardTitle: { fontSize: '1.75rem', fontWeight: '800', marginBottom: '24px' },
  m3CardText: { fontSize: '1.15rem', lineHeight: '1.9', color: '#444', wordBreak: 'keep-all' },

  /* JSA Grid */
  jsaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' },
  jsaCard: { padding: '48px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', position: 'relative' },
  jsaId: { position: 'absolute', top: '32px', right: '32px', fontSize: '1.5rem', fontWeight: '900', color: '#f0f0f0' },
  jsaTitle: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', color: '#111' },
  jsaContext: { fontSize: '1.05rem', lineHeight: '1.8', color: '#333', wordBreak: 'keep-all' },

  /* FAQ */
  faqWrapper: { maxWidth: '1000px' },
  faqItem: { marginBottom: '80px', borderBottom: '1px solid #eee', paddingBottom: '48px' },
  faqQ: { fontSize: '1.5rem', fontWeight: '800', color: '#007bff', marginBottom: '24px' },
  faqA: { fontSize: '1.2rem', lineHeight: '1.9', color: '#444', wordBreak: 'keep-all' },
  mathBox: { backgroundColor: '#111', padding: '32px', borderRadius: '8px', color: '#fff', textAlign: 'center', margin: '24px 0' },
  mathText: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px' },

  /* Footer */
  finalFooter: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerCopy: { fontSize: '1rem', color: '#888' },
  footerLinks: { display: 'flex', gap: '40px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.95rem' }
};
