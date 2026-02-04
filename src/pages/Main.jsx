import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// AdBanner는 승인 전까지 주석 처리를 권장합니다.

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
      {/* 1. Hero Section: NEOM 스타일의 몰입형 배경 */}
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
          {/* [좌측 광고 주석 처리]
          <aside style={styles.sideAd}>
            <AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside> 
          */}

          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>
                THE FUTURE OF<br />
                INDUSTRIAL SAFETY
              </h2>
              <p style={styles.subTitle}>
                데이터와 기술로 구현하는 무재해 사업장.<br />
                Smart JSA Bridge가 안전의 새로운 기준을 제시합니다.
              </p>
              <div style={styles.buttonWrapper}>
                <Link to="/info" style={styles.primaryBtn}>START ANALYSIS</Link>
              </div>
            </div>
          </main>

          {/* [우측 광고 주석 처리]
          <aside style={styles.sideAd}>
            <AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
          </aside> 
          */}
        </div>
        
        {/* 스크롤 유도 아이콘 */}
        <div style={styles.scrollIndicator}>SCROLL TO EXPLORE</div>
      </section>

      {/* 2. Content Section: 애드센스 승인을 위한 정보성 영역 */}
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <div style={styles.textBlock}>
            <span style={styles.overline}>WHAT IS JSA</span>
            <h3 style={styles.contentTitle}>작업안전분석(JSA)의 혁신</h3>
            <p style={styles.contentPara}>
              Smart JSA Bridge는 전통적인 안전 관리 방식을 디지털로 전환합니다. 
              단순한 서류 작성을 넘어, 방대한 안전 데이터베이스를 기반으로 현장의 잠재적 위험 요인을 
              실시간으로 식별하고 최적화된 감소 대책을 제안합니다.
            </p>
          </div>

          <div style={styles.featureGrid}>
            <div style={styles.featureItem}>
              <h4 style={styles.featureTab}>01. DATA DRIVEN</h4>
              <p style={styles.featureDesc}>수천 건의 산업 재해 사례 분석을 통해 도출된 정밀한 위험 요인 DB를 제공합니다.</p>
            </div>
            <div style={styles.featureItem}>
              <h4 style={styles.featureTab}>02. COMPLIANCE</h4>
              <p style={styles.featureDesc}>고용노동부 및 국제 안전 기준을 준수하는 표준화된 보고서 형식을 보장합니다.</p>
            </div>
            <div style={styles.featureItem}>
              <h4 style={styles.featureTab}>03. EFFICIENCY</h4>
              <p style={styles.featureDesc}>지능형 검색 알고리즘을 통해 JSA 수립 시간을 기존 대비 70% 이상 단축합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.footerArea}>
        <p style={styles.copyright}>© 2026 <strong>Smart JSA Bridge</strong>. Inspired by Future Technology.</p>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#000', color: '#fff', width: '100%', overflowX: 'hidden' },
  heroSection: { position: 'relative', height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.9) 100%)', zIndex: 1 },
  
  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase' },

  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', zIndex: 10 },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', textAlign: 'center' },
  heroContent: { maxWidth: '900px' },
  mainTitle: { fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: '800', lineHeight: '1', letterSpacing: '-2px', marginBottom: '2rem' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.6', opacity: 0.8, marginBottom: '3rem', fontWeight: '300' },
  primaryBtn: { display: 'inline-block', padding: '1rem 3rem', border: '1px solid #fff', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '2px', transition: '0.3s' },

  scrollIndicator: { position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', letterSpacing: '3px', opacity: 0.5, zIndex: 10 },

  /* Content Section */
  contentSection: { padding: '10rem 5rem', backgroundColor: '#fff', color: '#000' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  textBlock: { maxWidth: '800px', marginBottom: '6rem' },
  overline: { fontSize: '0.8rem', fontWeight: '700', letterSpacing: '3px', color: '#888', display: 'block', marginBottom: '1rem' },
  contentTitle: { fontSize: '3rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-1px' },
  contentPara: { fontSize: '1.25rem', lineHeight: '1.7', color: '#333', fontWeight: '400' },
  
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem' },
  featureItem: { borderTop: '1px solid #eee', paddingTop: '2rem' },
  featureTab: { fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '1px' },
  featureDesc: { fontSize: '1rem', lineHeight: '1.6', color: '#666' },

  footerArea: { padding: '4rem 5rem', backgroundColor: '#000', textAlign: 'center' },
  copyright: { fontSize: '0.7rem', color: '#444', letterSpacing: '1px' }
};