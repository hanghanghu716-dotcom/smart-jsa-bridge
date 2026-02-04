import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../AdBanner'; 

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg',
    '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: 사용자님의 기존 Main 화면 (형태 100% 유지) */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div
              key={src}
              style={{
                ...styles.bgImage,
                backgroundImage: `url(${src})`,
                opacity: index === currentSlide ? 1 : 0,
              }}
            />
          ))}
          <div style={styles.dimOverlay} />
        </div>

        <header style={styles.header}>
          <h1 style={styles.logo}>Smart JSA Bridge</h1>
        </header>

        <div style={styles.mainLayout}>
          {/* 기존 3열 구조 유지 (광고-콘텐츠-광고) */}
          <aside style={styles.sideAd}>
            {/* 애드센스 승인 전까지는 아래 AdBanner를 주석 처리하거나 빈 상태로 두는 것이 유리합니다. */}
            <AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside>

          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>
                데이터로 잇는 안전,<br />
                사람을 지키는 기술
              </h2>
              <p style={styles.subTitle}>
                현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br />
                놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.
              </p>
              <div style={styles.buttonWrapper}>
                <Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link>
              </div>
            </div>
          </main>

          <aside style={styles.sideAd}>
            <AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside>
        </div>

        {/* 기존 인디케이터 라인 */}
        <div style={styles.indicatorArea}>
          <div style={styles.bottomLine}>
            {slides.map((_, i) => (
              <div key={i} style={{
                ...styles.lineItem,
                backgroundColor: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.2)'
              }} />
            ))}
          </div>
          <div style={styles.scrollNotice}>SCROLL TO EXPLORE ↓</div>
        </div>
      </section>

      {/* SECTION 2: 추가된 정보 영역 (NEOM 스타일 여백 적용) */}
      <section style={styles.infoSection}>
        <div style={styles.container}>
          <div style={styles.articleHeader}>
            <span style={styles.overline}>ADVANCED SAFETY SYSTEM</span>
            <h3 style={styles.sectionHeading}>작업안전분석(JSA)의 법적 체계와 지능형 솔루션</h3>
          </div>

          <div style={styles.mainArticle}>
            <p style={styles.articleText}>
              대한민국 산업안전보건법 제36조는 사업주의 <strong>'위험성평가'</strong> 실시를 법적 의무로 명시하고 있습니다. 
              단순한 서류 작성이 아닌, 근로자의 생명과 직결된 이 프로세스는 작업 전 단계에서 유해·위험요인을 파악하고 이를 제거하거나 감소시키는 전 과정을 포함합니다.
            </p>
            <p style={styles.articleText}>
              <strong>Smart JSA Bridge</strong>는 고도화된 산업 재해 데이터베이스를 기반으로 현장 관리자가 놓치기 쉬운 미세한 위험까지 포착합니다. 
              특히 NEOM과 같은 대규모 글로벌 프로젝트에서 요구되는 엄격한 안전 기준(International Safety Standards)을 충족할 수 있도록 설계되었습니다.
            </p>
          </div>

          <div style={styles.featureGrid}>
            <div style={styles.featureCard}>
              <h4 style={styles.cardTitle}>위험성 평가 기법</h4>
              <p style={styles.cardDesc}>발생 빈도(P)와 사고 강도(S)를 조합한 5x5 Matrix 기반의 정밀 진단 시스템을 통해 객관적인 위험 등급을 산출합니다.</p>
            </div>
            <div style={styles.featureCard}>
              <h4 style={styles.cardTitle}>단계별 가이드라인</h4>
              <p style={styles.cardDesc}>작업 선정, 단계 분할, 위험 확인, 대책 수립의 4단계 프로세스를 지능형 검색 알고리즘으로 자동 보조합니다.</p>
            </div>
            <div style={styles.featureCard}>
              <h4 style={styles.cardTitle}>실시간 기술 지원</h4>
              <p style={styles.cardDesc}>클라우드 기반의 최신 안전 보건 규칙 및 KOSHA 가이드를 실시간으로 참조하여 최적의 감소 대책을 제안합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FAQ & 상세 가이드 (가독성 최적화) */}
      <section style={styles.darkDetailSection}>
        <div style={styles.container}>
          <h3 style={styles.sectionHeadingWhite}>자주 묻는 질문 (FAQ)</h3>
          <div style={styles.faqList}>
            {[
              { q: "본 시스템으로 생성된 PDF의 법적 증빙은 가능한가요?", a: "네, 생성된 리포트는 산업안전보건법에 따른 위험성평가 기록물로 인정되며, 현장 확인 및 서명을 통해 법적 효력을 갖습니다." },
              { q: "특정 산업군에 특화된 데이터인가요?", a: "본 서비스는 건설, 제조, 화학 등 전 산업 분야의 범용적인 위험 요인 및 각 업종별 특화 키워드를 모두 포괄하고 있습니다." }
            ].map((item, idx) => (
              <div key={idx} style={styles.faqItem}>
                <h5 style={styles.faqQuestion}>Q. {item.q}</h5>
                <p style={styles.faqAnswer}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최종 하단 푸터 */}
      <footer style={styles.finalFooter}>
        <p style={styles.copyrightText}>© 2026 <strong>Smart JSA Bridge</strong>. Created by <strong>yizuno</strong></p>
      </footer>
    </div>
  );
}

const styles = {
  /* 전체 스크롤 활성화 */
  wrapper: { width: '100%', backgroundColor: '#000', overflowX: 'hidden' },

  /* Hero Section (기존 wrapper 스타일을 섹션으로 이동) */
  heroSection: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '160px' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem' },
  heroContent: { maxWidth: '750px', textAlign: 'left' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', color: '#fff', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', fontWeight: '300', color: '#fff', wordBreak: 'keep-all' },
  buttonWrapper: { display: 'flex', justifyContent: 'flex-start' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' },
  indicatorArea: { width: '100%', padding: '0 5rem 2.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bottomLine: { width: '100%', display: 'flex', gap: '10px', height: '2px', marginBottom: '1rem' },
  lineItem: { flex: 1, transition: 'background-color 0.6s' },
  scrollNotice: { color: '#fff', fontSize: '0.7rem', opacity: 0.4, letterSpacing: '2px' },

  /* [수정] Info Section - NEOM 스타일의 여유로운 여백 설계 */
  infoSection: { padding: '160px 0', backgroundColor: '#ffffff', color: '#000' },
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 10%' },
  articleHeader: { marginBottom: '80px' },
  overline: { fontSize: '0.8rem', fontWeight: '800', color: '#007bff', letterSpacing: '4px', display: 'block', marginBottom: '20px' },
  sectionHeading: { fontSize: '3rem', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-1px' },
  mainArticle: { marginBottom: '100px', borderLeft: '1px solid #eee', paddingLeft: '50px' },
  articleText: { fontSize: '1.2rem', lineHeight: '1.9', color: '#333', marginBottom: '30px', maxWidth: '900px' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' },
  featureCard: { padding: '40px', border: '1px solid #f0f0f0', borderRadius: '8px', transition: 'box-shadow 0.3s' },
  cardTitle: { fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', color: '#111' },
  cardDesc: { fontSize: '1rem', lineHeight: '1.7', color: '#666' },

  /* Dark Detail Section */
  darkDetailSection: { padding: '120px 0', backgroundColor: '#111', color: '#fff' },
  sectionHeadingWhite: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '60px', textAlign: 'center' },
  faqList: { maxWidth: '900px', margin: '0 auto' },
  faqItem: { marginBottom: '50px', borderBottom: '1px solid #222', paddingBottom: '30px' },
  faqQuestion: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '15px', color: '#007bff' },
  faqAnswer: { fontSize: '1.05rem', lineHeight: '1.7', color: '#888' },

  /* Footer */
  finalFooter: { padding: '80px 0', backgroundColor: '#000', textAlign: 'center', borderTop: '1px solid #222' },
  copyrightText: { fontSize: '0.85rem', color: '#444', marginBottom: '10px' },
  footerNote: { fontSize: '0.75rem', color: '#222' }
};