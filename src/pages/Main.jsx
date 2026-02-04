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
      {/* SECTION 1: HERO (원본 레이아웃 유지 및 스크롤 유도 추가) */}
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
        
        {/* 스크롤 유도 인디케이터 (Material 스타일) */}
        <div style={styles.scrollIndicator}>
          <span style={styles.scrollText}>SCROLL TO EXPLORE</span>
          <div style={styles.scrollArrow}></div>
        </div>
      </section>

      {/* SECTION 2: VALUE PROPOSITION (정량적 비교 우위 섹션) */}
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <div style={styles.centeredHeader}>
            <span style={styles.label}>EFFICIENCY & VALUE</span>
            <h3 style={styles.heading}>기존 방식을 압도하는 지능형 솔루션</h3>
          </div>
          <div style={styles.valueGrid}>
            <div style={styles.valueCard}>
              <h4 style={styles.cardHeader}>Traditional JSA</h4>
              <ul style={styles.cardList}>
                <li>작업당 평균 180분 이상 소요</li>
                <li>관리자의 주관적 판단에 의존</li>
                <li>파편화된 서류 및 수작업 관리</li>
                <li>법적 기준 변화 반영의 한계</li>
              </ul>
            </div>
            <div style={styles.vsCircle}>VS</div>
            <div style={{...styles.valueCard, border: '1px solid #2196f3', backgroundColor: '#f0f7ff'}}>
              <h4 style={{...styles.cardHeader, color: '#2196f3'}}>Smart JSA Bridge</h4>
              <ul style={styles.cardList}>
                <li><strong>평균 5분 이내</strong> 작성 완료</li>
                <li><strong>10,000+</strong> 안전 보건 전문 DB</li>
                <li>데이터 기반 <strong>객관적 위험 평가</strong></li>
                <li><strong>KOSHA 가이드</strong> 실시간 연동</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 핵심 작업 시나리오 (Material Grid 디자인) */}
      <section style={{...styles.contentSection, backgroundColor: '#f8f9fa'}}>
        <div style={styles.container}>
          <div style={styles.centeredHeader}>
            <span style={styles.label}>CORE GUIDELINES</span>
            <h3 style={styles.heading}>9대 고위험 작업군 정밀 시나리오</h3>
          </div>
          <div style={styles.scenarioGrid}>
            {[
              { id: '01', title: '일반 안전', sc: 'TBM 진행', desc: '혈압 측정 및 음주 확인을 통한 건강 상태 파악 및 대피로 확인' },
              { id: '02', title: '고소 작업', sc: '판넬 설치', desc: '안전대 부착 설비 선설치 및 2인 1조 사다리 작업 준수' },
              { id: '03', title: '화기 작업', sc: '배관 용접', desc: '불티 비산 방지포 설치 및 가연성 가스 농도 측정 후 감시인 배치' },
              { id: '04', title: '밀폐 공간', sc: '탱크 진입', desc: '진입 전 산소 농도 측정 및 강제 환기 시설 상시 가동 확인' },
              { id: '05', title: '정전 작업', sc: '수배전 점검', desc: 'LOTO 잠금장치 설치 및 검전기로 무전압 상태 최종 확인' },
              { id: '06', title: '굴착 작업', sc: '관로 터파기', desc: '토사 붕괴 방지를 위한 안식각 준수 및 장비 한계선 설정' },
              { id: '07', title: '중장비 운용', sc: '지게차 운반', desc: '장비 선회 반경 내 출입 통제 라인 및 전담 신호수 상주' },
              { id: '08', title: '중량물 양중', sc: '크레인 인양', desc: '줄걸이 파단 점검 및 인양물 유도 로프(Tag Line) 거리 유지' },
              { id: '09', title: '가연성 가스', sc: '배관 기밀', desc: '리크 테스트 시 정전기 방지 조치 및 폭발 위험 구역 통제' }
            ].map(item => (
              <div key={item.id} style={styles.scenarioCard}>
                <span style={styles.scenarioNum}>{item.id}</span>
                <h5 style={styles.scenarioTitle}>{item.title}</h5>
                <div style={styles.scenarioTag}>시나리오: {item.sc}</div>
                <p style={styles.scenarioDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ (Material Accordion 스타일의 깊이 있는 문답) */}
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <div style={styles.centeredHeader}>
            <span style={styles.label}>EXPERT Q&A</span>
            <h3 style={styles.heading}>자주 묻는 질문 및 법적 유의사항</h3>
          </div>
          <div style={styles.faqWrapper}>
            {[
              { q: "본 도구로 생성된 보고서의 법적 효력은 어떠한가요?", a: "산업안전보건법 제36조에 의거한 위험성평가는 기록 보존의 의무가 있습니다. 생성된 PDF를 현장 실정에 맞춰 검토 후 서명하면 법적 기록물로 인정됩니다." },
              { q: "시스템의 추천 데이터만 그대로 사용해도 되나요?", a: "안됩니다. 본 서비스는 교육과 편의를 위한 '제안'을 제공합니다. 현장의 특수성(설비 노후도 등)을 반영해 반드시 사용자가 직접 편집해야 법적 책임을 다할 수 있습니다." },
              { q: "데이터베이스는 얼마나 자주 업데이트되나요?", a: "고용노동부 및 KOSHA 가이드라인의 주요 변경 사항 발생 시 즉각적으로 알고리즘에 반영하여 최신 트렌드를 제공합니다." }
            ].map((faq, i) => (
              <div key={i} style={styles.faqItem}>
                <div style={styles.faqQ}>Q. {faq.q}</div>
                <div style={styles.faqA}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  /* 글로벌 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  
  /* Hero Section */
  heroSection: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' },
  bgWrapper: { position: 'absolute', inset: 0, zIndex: 0 },
  bgImage: { position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 2s ease' },
  dimOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)' },
  header: { padding: '24px 5%', zIndex: 10 },
  logo: { color: '#fff', fontSize: '1.25rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 5%', zIndex: 10, gap: '48px' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', justifyContent: 'center' },
  centerContent: { flex: 1, color: '#fff' },
  heroContent: { maxWidth: '800px' },
  mainTitle: { fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px' },
  subTitle: { fontSize: '1.15rem', lineHeight: 1.6, opacity: 0.8, marginBottom: '40px' },
  primaryBtn: { padding: '16px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '100px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' },

  /* 스크롤 인디케이터 */
  scrollIndicator: { position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollText: { color: '#fff', fontSize: '0.75rem', opacity: 0.6, letterSpacing: '2px' },
  scrollArrow: { width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '8px auto', position: 'relative' },

  /* Content Sections */
  contentSection: { padding: '120px 0' },
  centeredHeader: { textAlign: 'center', marginBottom: '80px' },
  label: { color: '#2196f3', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px', display: 'block' },
  heading: { fontSize: '2.5rem', fontWeight: '800', color: '#1c1b1f', wordBreak: 'keep-all' },

  /* 비교 섹션 */
  valueGrid: { display: 'flex', alignItems: 'stretch', gap: '24px', flexWrap: 'wrap' },
  valueCard: { flex: 1, padding: '48px', backgroundColor: '#fdfdfd', border: '1px solid #e0e0e0', borderRadius: '16px', minWidth: '320px' },
  cardHeader: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '32px' },
  cardList: { listStyle: 'none', padding: 0 },
  vsCircle: { alignSelf: 'center', fontSize: '1rem', fontWeight: '900', color: '#888' },

  /* 9대 가이드 그리드 */
  scenarioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' },
  scenarioCard: { padding: '32px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee', position: 'relative' },
  scenarioNum: { position: 'absolute', top: '24px', right: '24px', fontSize: '1.5rem', fontWeight: '900', color: '#f0f0f0' },
  scenarioTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' },
  scenarioTag: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '16px' },
  scenarioDesc: { fontSize: '0.95rem', lineHeight: 1.7, color: '#49454f', wordBreak: 'keep-all' },

  /* FAQ */
  faqWrapper: { maxWidth: '800px', margin: '0 auto' },
  faqItem: { marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '32px' },
  faqQ: { fontSize: '1.15rem', fontWeight: '700', color: '#2196f3', marginBottom: '16px' },
  faqA: { fontSize: '1rem', lineHeight: 1.8, color: '#49454f' },

  footer: { padding: '64px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', fontSize: '0.85rem' }
};