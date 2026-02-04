import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// AdBanner 컴포넌트는 승인 전까지 아래와 같이 주석 처리하여 배치만 유지합니다.

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
      {/* SECTION 1: 기존 히로 섹션 (레이아웃 보존) */}
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
          {/* 광고 영역은 승인을 위해 주석 처리된 상태로 구조만 유지합니다. */}
          <aside style={styles.sideAd}></aside>

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

          <aside style={styles.sideAd}></aside>
        </div>

        <div style={styles.scrollDownIndicator}>SCROLL DOWN FOR GUIDE ↓</div>
      </section>

      {/* SECTION 2: JSA 전문 가이드 및 법적 근거 (방대한 데이터 영역) */}
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <div style={styles.textBlock}>
            <h3 style={styles.sectionTitle}>작업안전분석(JSA) 지침 및 법적 준수</h3>
            <p style={styles.paragraph}>
              산업안전보건법 제36조(위험성평가의 실시)에 의거하여, 사업주는 건설물, 기계, 설비, 원재료 등에 의한 유해·위험요인을 찾아내어 위험성을 결정하고 조치를 취해야 합니다. Smart JSA Bridge는 이러한 법적 절차를 체계적으로 지원하는 전문 도구입니다.
            </p>
          </div>

          <div style={styles.gridContainer}>
            <div style={styles.gridItem}>
              <h4>1. JSA의 정의 및 목적</h4>
              <p>작업안전분석(Job Safety Analysis)은 특정 작업을 수행할 때 발생할 수 있는 잠재적 위험을 단계별로 파악하여 사고를 미연에 방지하는 핵심 안전 기법입니다. 이는 표준 작업 절차(SOP)의 근간이 되며 근로자의 안전 보건 교육 자료로 활용됩니다.</p>
            </div>
            <div style={styles.gridItem}>
              <h4>2. 분석 대상의 선정 기준</h4>
              <p>재해 발생 빈도가 높거나 중대재해 발생 가능성이 있는 작업, 새로운 기계·설비 도입 시, 혹은 작업 절차가 복잡하여 오류 발생 가능성이 높은 공정을 우선적으로 선정하여 분석을 수행해야 합니다.</p>
            </div>
            <div style={styles.gridItem}>
              <h4>3. 위험성 결정(Risk Assessment)</h4>
              <p>본 시스템은 사고 발생 빈도(Frequency)와 사고 시의 강도(Severity)를 조합한 5x5 행렬 모델을 활용합니다. 결정된 위험 등급에 따라 즉시 개선, 계획적 개선, 유지 관리 등의 관리 기준을 명확히 제시합니다.</p>
            </div>
          </div>

          <div style={styles.detailArticle}>
            <h4 style={styles.articleSub}>지능형 위험 요인 라이브러리 활용법</h4>
            <p style={styles.paragraph}>
              사용자가 입력한 작업 절차 키워드를 기반으로 시스템은 과거 재해 사례와 안전 보건 규칙을 대조합니다. 예를 들어 '용접' 작업 입력 시 화재, 아크 광선 노출, 흄 흡입 등의 위험을 자동으로 제안하며, 이에 대응하는 화기 작업 허가서 발행, 비산방지포 설치 등의 표준 대책을 즉시 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: 안전 기술 리포트 및 프로세스 */}
      <section style={styles.darkInfoSection}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitleWhite}>Smart JSA Bridge 분석 프로세스</h3>
          <div style={styles.processSteps}>
            <div style={styles.stepCard}>
              <span style={styles.stepNum}>01</span>
              <h5>정보 입력</h5>
              <p>작업명, 위치, 참여자 등 기본 안전 보건 정보를 정의합니다.</p>
            </div>
            <div style={styles.stepCard}>
              <span style={styles.stepNum}>02</span>
              <h5>절차 상세화</h5>
              <p>현장의 실제 작업 흐름에 맞게 단계를 세분화합니다.</p>
            </div>
            <div style={styles.stepCard}>
              <span style={styles.stepNum}>03</span>
              <h5>위험 요인 식별</h5>
              <p>데이터베이스 기반의 추천 항목을 통해 누락 없는 위험을 파악합니다.</p>
            </div>
            <div style={styles.stepCard}>
              <span style={styles.stepNum}>04</span>
              <h5>최종 승인 및 출력</h5>
              <p>검토를 거쳐 표준 양식의 PDF 리포트를 생성하고 서명을 완료합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.footerArea}>
        <div style={styles.footerContainer}>
          <p style={styles.copyright}>© 2026 <strong>Smart JSA Bridge</strong>. Created by <strong>yizuno</strong></p>
          <p style={styles.footerNote}>본 서비스는 산업안전보건법 및 KOSHA 가이드를 준수하여 설계되었습니다.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  // 스크롤이 가능하도록 wrapper의 overflow와 height 속성 조정
  wrapper: { width: '100%', overflowX: 'hidden', backgroundColor: '#000' },
  
  /* Hero Section Styles */
  heroSection: { position: 'relative', height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { width: '160px', flexShrink: 0 },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem' },
  heroContent: { maxWidth: '750px', textAlign: 'left' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', color: '#fff', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', fontWeight: '300', color: '#fff', wordBreak: 'keep-all' },
  buttonWrapper: { display: 'flex', justifyContent: 'flex-start' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' },
  scrollDownIndicator: { position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '0.8rem', opacity: 0.5, letterSpacing: '2px', zIndex: 10 },

  /* Content Section Styles (Light) */
  contentSection: { padding: '100px 5rem', backgroundColor: '#ffffff', color: '#000' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  textBlock: { marginBottom: '60px' },
  sectionTitle: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', borderLeft: '8px solid #007bff', paddingLeft: '1.5rem' },
  paragraph: { fontSize: '1.15rem', lineHeight: '1.8', color: '#333', marginBottom: '1.5rem' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginBottom: '80px' },
  gridItem: { backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '12px', border: '1px solid #eee' },
  detailArticle: { backgroundColor: '#e9ecef', padding: '40px', borderRadius: '15px' },
  articleSub: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem' },

  /* Dark Info Section Styles */
  darkInfoSection: { padding: '100px 5rem', backgroundColor: '#111', color: '#fff' },
  sectionTitleWhite: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '4rem', textAlign: 'center' },
  processSteps: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px' },
  stepCard: { textAlign: 'center', padding: '20px' },
  stepNum: { fontSize: '3rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '1rem' },

  /* Footer Area Styles */
  footerArea: { width: '100%', padding: '60px 5rem', backgroundColor: '#000', borderTop: '1px solid #222' },
  footerContainer: { textAlign: 'center' },
  copyright: { fontSize: '0.9rem', color: '#666', marginBottom: '10px' },
  footerNote: { fontSize: '0.8rem', color: '#444' }
};