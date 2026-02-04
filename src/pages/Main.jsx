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
      {/* SECTION 1: HERO - 원본 규격 100% 유지 */}
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
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성 시작하기</Link></div>
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

      {/* SECTION 2: 비교 우위 및 가치 제안 (Value Proposition) */}
      <section style={styles.valueSection}>
        <div style={styles.container}>
          <span style={styles.overline}>COMPARATIVE ADVANTAGE</span>
          <h3 style={styles.sectionHeading}>기존 방식과는 차원이 다른<br />지능형 안전 관리의 시작</h3>
          <div style={styles.comparisonGrid}>
            <div style={styles.compCard}>
              <h4>수작업 JSA 작성</h4>
              <ul style={styles.compList}>
                <li>평균 작성 시간: 180분 내외</li>
                <li>관리자 개인의 경험에 의존한 위험 식별</li>
                <li>파편화된 서류 관리 및 휴먼 에러 발생</li>
                <li>법적 기준 업데이트 반영 지연</li>
              </ul>
            </div>
            <div style={styles.vsBadge}>VS</div>
            <div style={{...styles.compCard, borderColor: '#007bff', backgroundColor: '#f0f7ff'}}>
              <h4 style={{color: '#007bff'}}>Smart JSA Bridge</h4>
              <ul style={styles.compList}>
                <li>평균 작성 시간: <strong>5분 이내 완료</strong></li>
                <li><strong>10,000+ 건의 전문 DB</strong> 기반 지능형 추천</li>
                <li>데이터 기반의 객관적 위험도 산출</li>
                <li><strong>KOSHA 가이드</strong> 최신본 실시간 반영</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 핵심 작업 & 시나리오 가이드 (시나리오 보강) */}
      <section style={styles.librarySection}>
        <div style={styles.container}>
          <span style={styles.overline}>CORE GUIDELINES & SCENARIOS</span>
          <h3 style={styles.sectionHeading}>9대 핵심 작업별 시나리오 가이드</h3>
          <div style={styles.cardGrid}>
            {[
              { id: '01', title: '일반 및 공통 안전', sc: 'TBM 진행 시', desc: '혈압 측정 및 음주 여부 확인을 통한 작업자 건강 상태를 선행 파악하고 비상 대피로를 확인합니다.' },
              { id: '02', title: '고소 작업', sc: '천장 판넬 설치 시', desc: '안전대 부착 설비를 선설치하고, 사다리 작업 시 반드시 2인 1조를 유지하여 실족 추락을 방지합니다.' },
              { id: '03', title: '화기 작업', sc: '배관 용접/절단 시', desc: '불티 비산 방지포를 설치하고 가연성 가스 농도를 측정하며, 화기 감시자를 전담 배치합니다.' },
              { id: '04', title: '밀폐 공간', sc: '탱크 내부 진입 시', desc: '진입 전 산소 농도를 측정하고 이동식 송풍기를 강제 가동하며 구조용 삼각대를 선설치합니다.' },
              { id: '05', title: '정전 및 전기', sc: '수배전반 점검 시', desc: 'LOTO 잠금장치를 설치하고 검전기로 무전압 상태를 확인하며 절연 장화 등 전용 보호구를 착용합니다.' },
              { id: '06', title: '굴착 작업', sc: '관로 터파기 작업 시', desc: '토사 붕괴 방지를 위해 지반 안식각을 준수하고 굴착 단부에 장비 접근 한계선을 설정합니다.' },
              { id: '07', title: '중장비 운용', sc: '지게차 자재 운반 시', desc: '장비 선회 반경 내 출입 통제 라인을 설치하고 전담 신호수를 배치하여 보행자 충돌을 차단합니다.' },
              { id: '08', title: '중량물 취급', sc: '크레인 양중 작업 시', desc: '와이어로프 파단 여부를 점검하고 인양물 유도 로프(Tag Line)를 사용하여 안전거리를 유지합니다.' },
              { id: '09', title: '가연성 가스', sc: '기밀 시험 및 치환 시', desc: '배관 연결부 리크 테스트를 실시하고 정전기 방지 조치를 통해 가스 폭발 위험을 관리합니다.' }
            ].map((item) => (
              <div key={item.id} style={styles.dataCard}>
                <span style={styles.cardId}>{item.id}</span>
                <h5>{item.title}</h5>
                <p style={styles.scenarioTag}>시나리오: {item.sc}</p>
                <p style={styles.cardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 심층 FAQ (Professional FAQ Depth) */}
      <section style={styles.faqSection}>
        <div style={styles.container}>
          <span style={styles.overline}>TECHNICAL Q&A</span>
          <h3 style={styles.sectionHeading}>자주 묻는 질문 및 상세 답변</h3>
          <div style={styles.faqGrid}>
            <div style={styles.faqItem}>
              <h5>Q. 본 서비스로 생성된 보고서가 법적 효력을 갖습니까?</h5>
              <p>본 도구는 위험성평가 수립을 보조하는 시스템입니다. 생성된 PDF 보고서에 현장 책임자의 실질적인 검토와 서명이 완료되면, 산업안전보건법에 따른 정식 기록물로 활용이 가능합니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5>Q. 지능형 추천 데이터의 출처는 어디인가요?</h5>
              <p>한국산업안전보건공단(KOSHA)의 안전보건기술지침 및 고용노동부의 작업별 위험성평가 사례집을 정밀 분석하여 구축된 신뢰도 높은 데이터베이스입니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5>Q. 서비스가 법적 책임을 대신해 주나요?</h5>
              <p>아니요. 본 서비스는 안전 관리의 편의와 교육을 목적으로 합니다. 현장의 특수성을 반영하여 최종 내용을 편집하고 검토할 책임은 사용자에게 있으며, 본 서비스는 결과물에 대해 법적 책임을 지지 않습니다.</p>
            </div>
            <div style={styles.faqItem}>
              <h5>Q. 데이터 보안은 어떻게 관리되나요?</h5>
              <p>사용자가 입력한 프로젝트 정보와 작업 절차 데이터는 브라우저 세션 내에서 안전하게 처리되며, 리포트 생성 즉시 암호화되어 관리됩니다.</p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <p>© 2026 Smart JSA Bridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  /* 글로벌 */
  wrapper: { width: '100%', backgroundColor: '#000', overflowX: 'hidden' },
  
  /* Hero (기존 규격 유지) */
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

  /* 콘텐츠 레이아웃 */
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 10%' },
  overline: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '4px', display: 'block', marginBottom: '25px' },
  sectionHeading: { fontSize: '3.2rem', fontWeight: '900', marginBottom: '60px', letterSpacing: '-1.5px', wordBreak: 'keep-all', color: '#fff' },

  /* 비교 우위 섹션 */
  valueSection: { padding: '160px 0', backgroundColor: '#000', color: '#fff' },
  comparisonGrid: { display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' },
  compCard: { flex: 1, padding: '50px', border: '1px solid #333', borderRadius: '12px', minWidth: '350px' },
  vsBadge: { fontSize: '1.5rem', fontWeight: '900', color: '#444' },
  compList: { listStyle: 'none', padding: 0, marginTop: '30px' },
  compListLi: { fontSize: '1.1rem', marginBottom: '15px', color: '#888' },

  /* 9대 가이드 & 시나리오 */
  librarySection: { padding: '160px 0', backgroundColor: '#fff', color: '#000' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' },
  dataCard: { padding: '40px', backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px', position: 'relative' },
  cardId: { position: 'absolute', top: '20px', right: '20px', fontSize: '0.8rem', fontWeight: '900', color: '#ddd' },
  scenarioTag: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#007bff', color: '#fff', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '15px' },
  cardDesc: { fontSize: '1.05rem', lineHeight: '1.8', color: '#555', wordBreak: 'keep-all' },

  /* 심층 FAQ */
  faqSection: { padding: '160px 0', backgroundColor: '#f9f9f9', color: '#111' },
  faqGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' },
  faqItem: { borderBottom: '1px solid #eee', paddingBottom: '30px' },

  finalFooter: { padding: '100px 0', backgroundColor: '#000', textAlign: 'center', color: '#444' }
};