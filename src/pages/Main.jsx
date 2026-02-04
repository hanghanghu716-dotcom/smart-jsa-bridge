import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdBanner from '../AdBanner'; 

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: 원본 메인 화면 (규격 100% 유지) */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>
        <header style={styles.header}><h1 style={styles.logo}>Smart JSA Bridge</h1></header>
        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}><AdBanner slot="1000000001" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          <aside style={styles.sideAd}><AdBanner slot="1000000002" style={{ width: '160px', height: '600px' }} format="vertical" /></aside>
        </div>
        <footer style={styles.footerArea}>
          <div style={styles.bottomAdWrapper}><AdBanner slot="1000000003" style={{ width: '728px', height: '90px' }} format="horizontal" /></div>
          <div style={styles.bottomLine}>{slides.map((_, i) => (<div key={i} style={{ ...styles.lineItem, backgroundColor: i === currentSlide ? '#fff' : 'rgba(255,255,255,0.2)' }} />))}</div>
          <p style={styles.copyright}>© 2026 <strong>Smart JSA Bridge</strong>. Created by <strong>yizuno</strong></p>
        </footer>
      </section>

      {/* SECTION 2: 법적 책임 및 서비스 목적 (사용자님 요청 반영) */}
      <section style={styles.noticeSection}>
        <div style={styles.container}>
          <span style={styles.overline}>IMPORTANT NOTICE</span>
          <h3 style={styles.sectionHeading}>서비스 이용 안내 및 면책 고지</h3>
          <div style={styles.noticeBox}>
            <p style={styles.importantText}>
              Smart JSA Bridge에서 제공하는 위험요인 추천 및 데이터베이스는 사용자의 편의와 <strong>안전 교육적 가치 전달</strong>을 목적으로 합니다. 
              본 서비스는 범용적인 데이터를 제공할 뿐, 각 사업장의 고유한 작업 환경과 특수성을 완벽히 반영할 수 없습니다.
            </p>
            <p style={styles.importantText}>
              따라서, 본 도구를 통해 생성된 결과물은 반드시 <strong>현장 안전 관리자 및 당사자 사업장의 환경에 맞춰 최종 편집 및 검토</strong>되어야 합니다. 
              수정되지 않은 결과물로 인하여 발생하는 사고나 법적 문제에 대해 본 서비스는 어떠한 책임도 지지 않음을 알려드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: JSA 방법론 및 상세 가이드 (콘텐츠 보강) */}
      <section style={styles.guideSection}>
        <div style={styles.container}>
          <h3 style={styles.sectionHeading}>JSA(작업안전분석) 실무 및 원리</h3>
          <div style={styles.contentGrid}>
            <article style={styles.article}>
              <h4>위험성평가의 5단계 절차</h4>
              <p>산업안전보건법 제36조에 의거한 위험성평가는 다음의 절차를 준수해야 합니다.</p>
              <ul style={styles.list}>
                <li>사전준비: 평가 대상의 선정 및 팀 구성</li>
                <li>유해·위험요인 파악: 작업 단계별 잠재 위험 식별</li>
                <li>위험성 결정: 빈도와 강도를 조합한 위험도 산출</li>
                <li>위험성 감소대책 수립 및 시행: 허용 불가능한 위험에 대한 개선</li>
                <li>기록 및 공유: 분석 결과의 문서화 및 근로자 전파</li>
              </ul>
            </article>

            <article style={styles.article}>
              <h4>위험도 산출 공식</h4>
              <p>Smart JSA Bridge는 국제적으로 통용되는 5x5 Matrix법을 사용하여 위험성을 정량화합니다.</p>
              <div style={styles.formula}>
                $$R(Risk) = F(Frequency) \times S(Severity)$$
              </div>
              <p>산출된 $R$값이 9 이상일 경우 '상당한 위험'으로 간주하여 즉각적인 작업 중지 또는 공학적 개선 대책이 선행되어야 합니다.</p>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 4: 위험요인 라이브러리 (콘텐츠 보강) */}
      <section style={styles.librarySection}>
        <div style={styles.container}>
          <h3 style={styles.sectionHeading}>주요 작업별 위험 요인 DB 개요</h3>
          <p style={styles.subPara}>본 시스템은 다음과 같은 핵심 키워드를 기반으로 안전 대책을 제안합니다.</p>
          <div style={styles.keywordGrid}>
            <div style={styles.keywordCard}><h5>화기 작업</h5><p>용접 불티 비산, 가스 누출 폭발, 질식 사고 등</p></div>
            <div style={styles.keywordCard}><h5>고소 작업</h5><p>작업자 추락, 자재 낙하(낙래), 비계 붕괴 등</p></div>
            <div style={styles.keywordCard}><h5>중량물 취급</h5><p>줄걸이 파단, 인양물 충돌, 장비 전도 등</p></div>
            <div style={styles.keywordCard}><h5>밀폐 공간</h5><p>산소 결핍, 유해가스 중독, 비상 대피 지연 등</p></div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  wrapper: { width: '100%', backgroundColor: '#000', overflowX: 'hidden' },
  heroSection: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease-in-out' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)', zIndex: 1 },
  header: { padding: '2.5rem 5rem', zIndex: 10 },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5rem', gap: '4rem', zIndex: 10 },
  sideAd: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '160px' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem' },
  heroContent: { maxWidth: '750px' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', color: '#fff' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', fontWeight: '300', color: '#fff' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none' },
  footerArea: { width: '100%', padding: '0 5rem 2.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2rem' },
  bottomLine: { width: '100%', display: 'flex', gap: '10px', height: '2px', marginBottom: '1.2rem' },
  lineItem: { flex: 1, transition: 'background-color 0.6s' },
  copyright: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' },

  /* 보강된 디자인 섹션 (넓은 여백 적용) */
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 10%' },
  noticeSection: { padding: '160px 0', backgroundColor: '#fff', color: '#000' },
  overline: { color: '#ff4d4d', fontWeight: '800', letterSpacing: '3px', fontSize: '0.8rem', display: 'block', marginBottom: '20px' },
  sectionHeading: { fontSize: '3rem', fontWeight: '900', marginBottom: '40px', letterSpacing: '-1.5px' },
  noticeBox: { padding: '40px', backgroundColor: '#fff5f5', borderLeft: '10px solid #ff4d4d', borderRadius: '4px' },
  importantText: { fontSize: '1.15rem', lineHeight: '1.9', color: '#333', marginBottom: '20px' },

  guideSection: { padding: '160px 0', backgroundColor: '#f9f9f9', color: '#111' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px' },
  article: { fontSize: '1.1rem', lineHeight: '1.8' },
  list: { marginTop: '20px', paddingLeft: '20px' },
  formula: { margin: '40px 0', padding: '30px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', fontSize: '1.8rem' },

  librarySection: { padding: '160px 0', backgroundColor: '#fff', color: '#000' },
  subPara: { fontSize: '1.2rem', color: '#666', marginBottom: '60px' },
  keywordGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px' },
  keywordCard: { padding: '30px', border: '1px solid #eee', borderRadius: '8px' },

  finalFooter: { padding: '100px 0', backgroundColor: '#000', color: '#444', textAlign: 'center', borderTop: '1px solid #222' }
};