import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../AdBanner'; // [추가됨] 광고 컴포넌트 가져오기

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
      {/* 1. 배경 슬라이드 레이어 */}
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

      {/* 2. 상단 헤더 */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Smart JSA Bridge</h1>
      </header>

      {/* 3. 메인 레이아웃 (3열 구조) */}
      <div style={styles.mainLayout}>
        
        {/* [좌측 광고] 이미지 -> AdBanner 교체 */}
        <aside style={styles.sideAd}>
          {/* slot 번호는 나중에 애드센스에서 발급받아 넣으면 됩니다 */}
          <AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        {/* [중앙 콘텐츠] */}
        <main style={styles.centerContent}>
          <div style={styles.heroContent}>
            <h2 style={styles.mainTitle}>
              데이터로 잇는 안전,<br/>
              사람을 지키는 기술
            </h2>
            <p style={styles.subTitle}>
              현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br/>
              놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.
            </p>
            <div style={styles.buttonWrapper}>
              <Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link>
            </div>
          </div>
        </main>

        {/* [우측 광고] 이미지 -> AdBanner 교체 */}
        <aside style={styles.sideAd}>
          <AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      {/* 4. 하단 영역 (광고 + 인디케이터) */}
      <footer style={styles.footerArea}>
        {/* [하단 광고] 이미지 -> AdBanner 교체 */}
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="1000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
        
        <div style={styles.bottomLine}>
          {slides.map((_, i) => (
            <div key={i} style={{
              ...styles.lineItem,
              backgroundColor: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.2)'
            }} />
          ))}
        </div>
        <p style={styles.copyright}>© 2026 Smart JSA Bridge. 대한민국 산업안전의 디지털 전환</p>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },

  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' },

  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  /* 광고 이미지가 사라지므로 adImg 스타일은 삭제해도 되지만 혹시 몰라 유지 */
  adImg: { display: 'block', width: 'auto', height: 'auto', maxHeight: '650px', borderRadius: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },

  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem' },
  heroContent: { maxWidth: '750px', textAlign: 'left' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', color: '#fff', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', fontWeight: '300', color: '#fff', wordBreak: 'keep-all' },
  buttonWrapper: { display: 'flex', justifyContent: 'flex-start' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' },

  footerArea: { width: '100%', padding: '0 5rem 2.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2rem' },
  
  bottomLine: { width: '100%', display: 'flex', gap: '10px', height: '2px', marginBottom: '1.2rem' },
  lineItem: { flex: 1, transition: 'background-color 0.6s' },
  copyright: { textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }
};