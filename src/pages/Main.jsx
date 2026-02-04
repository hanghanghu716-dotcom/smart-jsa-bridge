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
      {/* SECTION 1: HERO - 원본 레이아웃 및 규격 유지 */}
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
              <h2 style={styles.mainTitle}>
                데이터로 잇는 안전,<br />
                사람을 지키는 기술
              </h2>
              <p style={styles.subTitle}>
                현장의 육안 점검과 전문가의 안전 데이터를 결합하여,<br />
                놓치기 쉬운 잠재 위험 요인을 정밀하게 분석합니다.
              </p>
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

      {/* SECTION 2: 법적 책임 및 서비스 목적 - 줄바꿈 및 가독성 최적화 */}
      <section style={styles.noticeSection}>
        <div style={styles.container}>
          <span style={styles.overline}>LEGAL COMPLIANCE & EDUCATION</span>
          <h3 style={styles.sectionHeading}>서비스 이용 안내 및 면책 고지</h3>
          <div style={styles.noticeBox}>
            <p style={styles.articlePara}>
              Smart JSA Bridge가 제공하는 지능형 위험 요인 추천 시스템은 안전 관리자의 업무 편의성을 높이고,<br />
              현장 근로자에게 <strong>잠재적 위험에 대한 교육적 가치를 전달</strong>하는 것을 최우선 목적으로 합니다.
            </p>
            <p style={styles.articlePara}>
              제공되는 모든 데이터베이스는 일반적인 산업 안전 기준을 바탕으로 구성된 '참고용 자료'이며,<br />
              개별 사업장의 고유한 공정 특성, 설비 노후도, 작업 환경의 변화를 완벽하게 반영하지 못할 수 있습니다.
            </p>
            <p style={styles.importantPara}>
              따라서 생성된 결과물은 반드시 <strong>현장 안전 책임자가 실제 환경에 맞춰 최종 편집 및 검토</strong>해야 하며,<br />
              수정되지 않은 데이터 사용으로 발생하는 사고나 법적 문제에 대해 본 서비스는 책임을 지지 않습니다.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: JSA 실무 가이드 - 시각적 위계 및 정렬 보강 */}
      <section style={styles.guideSection}>
        <div style={styles.container}>
          <div style={styles.infoFlex}>
            <div style={styles.textPart}>
              <h3 style={styles.smallTitle}>SAFETY METHODOLOGY</h3>
              <h4 style={styles.guideTitle}>산업안전보건법에 따른 위험성평가</h4>
              <p style={styles.guideText}>
                산업안전보건법 제36조에 의거, 사업주는 작업 절차에서 발생하는 유해·위험요인을 찾아내어<br />
                위험성을 결정하고 근로자의 위험 방지를 위한 조치를 취해야 할 의무가 있습니다.
              </p>
              <ul style={styles.checkList}>
                <li>작업 단계의 논리적 분할 및 세부 공정 정의</li>
                <li>잠재적 위험의 식별 및 재해 형태 분석</li>
                <li>빈도와 강도를 조합한 정량적 위험도 산출</li>
                <li>계층적 통제 전략에 따른 위험 감소 대책 수립</li>
              </ul>
            </div>
            <div style={styles.formulaPart}>
              <div style={styles.formulaCard}>
                <span style={styles.formulaLabel}>RISK ASSESSMENT FORMULA</span>
                <div style={styles.formulaFlex}>
                  <span style={styles.vB}>R</span><span style={styles.vO}>=</span><span style={styles.vB}>F</span><span style={styles.vO}>×</span><span style={styles.vB}>S</span>
                </div>
                <p style={styles.formulaNote}>위험도 = 발생 빈도 × 결과 강도</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: 주요 작업군 DB 개요 - 풍부한 설명 추가 */}
      <section style={styles.librarySection}>
        <div style={styles.container}>
          <h3 style={styles.sectionHeading}>Safety Intelligence Library</h3>
          <div style={styles.cardGrid}>
            <div style={styles.dataCard}>
              <h5>화기 작업 가이드</h5>
              <p>용접/용단 시 발생하는 불티 비산 방지, 가연성 가스 농도 측정,<br />화기 감시자 상주 및 소화 설비 비치 등 핵심 대책을 포함합니다.</p>
            </div>
            <div style={styles.dataCard}>
              <h5>고소 작업 가이드</h5>
              <p>추락 방지를 위한 안전대 부착 설비 설치, 작업 발판의 건전성 확인,<br />단부 및 개구부 방호 조치 등 추락 사고 예방 프로세스를 분석합니다.</p>
            </div>
            <div style={styles.dataCard}>
              <h5>에너지 플랜트 가이드</h5>
              <p>수소 생산 시설의 PSA/SMR 설비 정비 시 고압 유체 방출,<br />LOTO(잠금장치) 적용 및 불활성 가스 치환 절차를 상세히 안내합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <p style={styles.footerText}>© 2026 Smart JSA Bridge. All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles = {
  /* 글로벌 설정 */
  wrapper: { width: '100%', backgroundColor: '#000', overflowX: 'hidden' },
  
  /* Hero Section (기존 유지) */
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
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '2rem', color: '#fff', wordBreak: 'keep-all' },
  subTitle: { fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85, marginBottom: '4rem', fontWeight: '300', color: '#fff', wordBreak: 'keep-all' },
  primaryBtn: { display: 'inline-block', padding: '1.2rem 4rem', backgroundColor: '#fff', color: '#000', borderRadius: '4rem', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none' },
  footerArea: { width: '100%', padding: '0 5rem 2.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2rem' },
  bottomLine: { width: '100%', display: 'flex', gap: '10px', height: '2px', marginBottom: '1.2rem' },
  lineItem: { flex: 1, transition: 'background-color 0.6s' },
  copyright: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' },

  /* 추가 섹션 디자인 및 타이포그래피 최적화 */
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 10%' },
  noticeSection: { padding: '160px 0', backgroundColor: '#fff', color: '#000' },
  overline: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '4px', display: 'block', marginBottom: '25px' },
  sectionHeading: { fontSize: '3.5rem', fontWeight: '900', marginBottom: '50px', letterSpacing: '-1.5px', wordBreak: 'keep-all' },
  noticeBox: { padding: '60px', backgroundColor: '#fdfdfd', borderLeft: '1px solid #000', borderTop: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' },
  articlePara: { fontSize: '1.2rem', lineHeight: '2', color: '#444', marginBottom: '30px', wordBreak: 'keep-all' },
  importantPara: { fontSize: '1.2rem', lineHeight: '2', color: '#111', fontWeight: '600', wordBreak: 'keep-all' },

  guideSection: { padding: '160px 0', backgroundColor: '#f9f9f9', color: '#111' },
  infoFlex: { display: 'flex', gap: '80px', flexWrap: 'wrap', alignItems: 'center' },
  textPart: { flex: 1.2, minWidth: '450px' },
  smallTitle: { fontSize: '0.85rem', fontWeight: '800', color: '#888', letterSpacing: '3px', marginBottom: '20px' },
  guideTitle: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '30px', wordBreak: 'keep-all' },
  guideText: { fontSize: '1.15rem', lineHeight: '1.9', color: '#555', marginBottom: '40px', wordBreak: 'keep-all' },
  checkList: { listStyle: 'none', padding: 0, fontSize: '1.05rem', lineHeight: '2.5' },

  formulaPart: { flex: 1, minWidth: '400px' },
  formulaCard: { backgroundColor: '#111', color: '#fff', padding: '60px', borderRadius: '4px', textAlign: 'center' },
  formulaLabel: { fontSize: '0.75rem', fontWeight: '800', color: '#555', letterSpacing: '2px', display: 'block', marginBottom: '25px' },
  formulaFlex: { fontSize: '4.5rem', fontWeight: '900', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' },
  vB: { color: '#007bff' },
  vO: { color: '#333' },
  formulaNote: { color: '#888', marginTop: '20px', fontSize: '1rem', letterSpacing: '1px' },

  librarySection: { padding: '160px 0', backgroundColor: '#fff', color: '#000' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' },
  dataCard: { padding: '45px', borderTop: '4px solid #111', backgroundColor: '#fcfcfc' },
  finalFooter: { padding: '100px 0', backgroundColor: '#000', borderTop: '1px solid #1a1a1a', textAlign: 'center' },
  footerText: { fontSize: '0.85rem', color: '#444' }
};