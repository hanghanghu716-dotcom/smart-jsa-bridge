import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import AdBanner from '../AdBanner'; // [심사 전략] 광고 슬롯 전체 주석 처리

export default function Main() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/images/image1.jpg', '/images/image2.jpg', '/images/image3.jpg', '/images/image4.jpg', '/images/image5.jpg', '/images/image6.jpg'];

  useEffect(() => {
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % slides.length); }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div style={styles.wrapper}>
      {/* SECTION 1: HERO - 사용자 원본 디자인 (규격 및 로직 100% 보존) */}
      <section style={styles.heroSection}>
        <div style={styles.bgWrapper}>
          {slides.map((src, index) => (
            <div key={src} style={{ ...styles.bgImage, backgroundImage: `url(${src})`, opacity: index === currentSlide ? 1 : 0 }} />
          ))}
          <div style={styles.dimOverlay} />
        </div>
        <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
        <div style={styles.mainLayout}>
          <aside style={styles.sideAd}></aside>
          <main style={styles.centerContent}>
            <div style={styles.heroContent}>
              <h2 style={styles.mainTitle}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
              <p style={styles.subTitle}>현장의 육안 점검과 지능형 분석 데이터를 결합하여,<br />놓치기 쉬운 잠재 위험 요인을 정밀하게 도출합니다.</p>
              <div style={styles.buttonWrapper}><Link to="/info" style={styles.primaryBtn}>위험성 평가 작성하기</Link></div>
            </div>
          </main>
          <aside style={styles.sideAd}></aside>
        </div>
        <div style={styles.scrollGuide}>
          <span style={styles.scrollLabel}>SCROLL TO EXPLORE</span>
          <div style={styles.scrollTrack}><div style={styles.scrollThumb}></div></div>
        </div>
      </section>

      {/* SECTION 2: VALUE PROPOSITION - 줄간격 개선 및 이미지 삽입 (Material Design 3) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.valueRow}>
            <div style={styles.valueTextSide}>
              <span style={styles.m3Tag}>CORE VALUE</span>
              <h3 style={styles.m3Title}>실질적 위험 발굴을 돕는<br />지능형 안전 분석 파트너</h3>
              <div style={styles.valuePoint}>
                <h4>체계적인 데이터 매칭</h4>
                <p>수많은 작업 시나리오 분석을 통해 구축된 데이터베이스를 기반으로,<br />현장 상황에 가장 부합하는 유해위험요인을 지능적으로 제안합니다.</p>
              </div>
              <div style={styles.valuePoint}>
                <h4>편집 기반의 무결성 확보</h4>
                <p>제시된 추천 항목을 토대로 사용자가 직접 현장의 특수성을 반영함으로써,<br />실무적 효용성과 법적 준수성을 동시에 갖춘 보고서를 완성합니다.</p>
              </div>
            </div>
            <div style={styles.valueImageSide}>
              <div style={{...styles.imageCard, backgroundImage: 'url(/images/image5.jpg)'}} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 9대 핵심 작업 분석 가이드 (가독성 및 로직 강화) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>ANALYSIS GUIDES</span>
            <h3 style={styles.m3Title}>9대 고위험 작업별 위험 분석 가이드</h3>
          </div>
          <div style={styles.jsaCardGrid}>
            {[
              { id: '01', title: '일반 및 공통안전', f: '작업자 건강상태 및 심리적 불안정 미확인', m: 'TBM 활용 혈압 측정 및 음주 여부 확인 실시' },
              { id: '02', title: '고소 작업', f: '작업 발판 단부 및 개구부에서의 작업자 추락', m: '그네식 안전대 착용 및 생명줄(Life-line) 체결 철저' },
              { id: '03', title: '화기 작업', f: '용접 불티 비산으로 인한 주변 가연물 화재/폭발', m: '가연물 제거, 비산 방지포 설치 및 화기 감시자 배치' },
              { id: '04', title: '밀폐 공간', f: '내부 산소 결핍 및 유해가스에 의한 질식/중독', m: '진입 전 농도 측정 및 이동식 송풍기 상시 환기 가동' },
              { id: '05', title: '정전 및 전기', f: '전기 정비 중 제3자의 불시 투입에 의한 감전', m: 'LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관' },
              { id: '06', title: '굴착 작업', f: '법면 붕괴로 인한 작업자 매몰 및 장비 전도', m: '지반 안식각 준수 및 흙막이 지보공 설치 상태 점검' },
              { id: '07', title: '중장비 운용', f: '장비 사각지대 위치 보행자와의 충돌 및 끼임', m: '전담 신호수 배치 및 후방 카메라/감지기 작동 확인' },
              { id: '08', title: '중량물 취급', f: '줄걸이 용구 파단으로 인한 인양물 낙하 및 타격', m: '용구 마모 상태 점검 및 유도 로프(Tag Line) 사용' },
              { id: '09', title: '가연성 가스', f: '배관 기밀 시험 중 누출 가스에 의한 인화/폭발', m: '정전기 방지 조치 및 검지기를 활용한 정밀 점검' }
            ].map(item => (
              <div key={item.id} style={styles.jsaCard}>
                <span style={styles.jsaBadge}>{item.id}</span>
                <h5 style={styles.jsaCardTitle}>{item.title}</h5>
                <div style={styles.jsaFactorBox}><strong>위험요인</strong><p>{item.f}</p></div>
                <div style={styles.jsaMeasureBox}><strong>감소대책</strong><p>{item.m}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: FAQ - 풍성한 답변 및 최적화된 밀도 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.m3Header}>
            <span style={styles.m3Tag}>KNOWLEDGE BASE</span>
            <h3 style={styles.m3Title}>위험성평가 수립 가이드 및 FAQ</h3>
          </div>
          <div style={styles.faqWrapper}>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 본 서비스로 생성된 보고서가 법적 효력을 갖습니까?</h5>
              <p style={styles.faqA}>
                네, 산업안전보건법 제36조(위험성평가의 실시)에 따르면 사업주는 유해·위험요인을 찾아내어 위험성을 결정하고 조치를 취한 뒤 그 결과를 기록·보존해야 합니다. 
                Smart JSA Bridge를 통해 생성된 PDF 리포트는 이러한 법적 절차를 준수하여 작성된 결과물로써, 현장 관리자의 최종 검토와 근로자 공유(서명)가 완료되면 공신력 있는 안전 보건 기록물로 인정됩니다.
              </p>
            </div>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 서비스가 법적 책임을 대신해 주나요?</h5>
              <p style={styles.faqA}>
                아니요. 본 서비스는 안전 관리 업무의 효율성을 높이고 올바른 위험 식별을 돕는 '전문가 조력 도구'이자 '교육 플랫폼'입니다. 
                현장의 기계 상태, 작업 환경, 기상 조건 등은 실시간으로 변화하며 이는 시스템이 모두 파악할 수 없는 변수입니다. 
                따라서 최종 보고서의 내용을 당사 사업장의 실제 환경에 맞춰 검토하고 편집할 최종적인 권한과 책임은 사용자(사업주 및 안전관리자)에게 있습니다.
              </p>
            </div>
            <div style={styles.faqBlock}>
              <h5 style={styles.faqQ}>Q. 위험도(Risk) 산출 로직은 무엇인가요?</h5>
              <div style={styles.mathCard}>Risk (위험도) = Frequency (빈도) × Severity (강도)</div>
              <p style={styles.faqA}>
                본 시스템은 고용노동부의 '위험성평가 가이드'에 따른 5x5 Matrix법을 차용합니다. 사고가 발생할 확률(빈도)과 발생 시 초래되는 부상의 정도(강도)를 곱하여 수치화하며, 
                계산된 위험도 점수에 따라 '허용 불가(즉시 중단)', '상당한 위험(계획적 개선)', '경미한 위험(유지 관리)' 등의 등급을 사용자에게 제안합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
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
  /* GLOBAL & HERO (원본 1:1 복구) */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1440px', margin: '0 auto', padding: '0 80px' },
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

  scrollGuide: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 },
  scrollLabel: { color: '#fff', fontSize: '0.7rem', opacity: 0.5, letterSpacing: '3px', display: 'block', marginBottom: '12px' },
  scrollTrack: { width: '1px', height: '60px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto', position: 'relative' },
  scrollThumb: { position: 'absolute', top: 0, left: 0, width: '100%', height: '30%', backgroundColor: '#fff' },

  /* M3 Sections (공간감 확보 및 줄간격 개선) */
  m3Section: { padding: '160px 0' },
  valueRow: { display: 'flex', gap: '100px', alignItems: 'center' },
  valueTextSide: { flex: 1.2 },
  valuePoint: { marginBottom: '60px' },
  valueImageSide: { flex: 1 },
  imageCard: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' },
  
  m3Header: { marginBottom: '100px' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px', marginBottom: '24px', display: 'block' },
  m3Title: { fontSize: '3.5rem', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1.5px', wordBreak: 'keep-all', color: '#111' },
  m3Desc: { fontSize: '1.4rem', lineHeight: '2.0', color: '#49454f', wordBreak: 'keep-all' },
  
  valuePointTitle: { fontSize: '1.8rem', fontWeight: '800', marginBottom: '20px' },
  valuePointPara: { fontSize: '1.15rem', lineHeight: '2.0', color: '#444', wordBreak: 'keep-all' },

  /* JSA Grid (가독성 개선) */
  jsaCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' },
  jsaCard: { padding: '48px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  jsaBadge: { position: 'absolute', top: '32px', right: '32px', fontSize: '1.2rem', fontWeight: '900', color: '#f0f0f0' },
  jsaCardTitle: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '32px', color: '#111' },
  jsaFactorBox: { marginBottom: '24px', paddingLeft: '16px', borderLeft: '3px solid #ff4d4d' },
  jsaMeasureBox: { paddingLeft: '16px', borderLeft: '3px solid #007bff' },

  /* FAQ (오밀조밀함 해결 및 풍성한 내용) */
  faqWrapper: { maxWidth: '1000px' },
  faqBlock: { marginBottom: '100px' },
  faqQ: { fontSize: '1.6rem', fontWeight: '800', color: '#007bff', marginBottom: '32px', letterSpacing: '-0.5px' },
  faqA: { fontSize: '1.2rem', lineHeight: '2.1', color: '#444', wordBreak: 'keep-all' },
  mathCard: { backgroundColor: '#111', padding: '32px', borderRadius: '12px', color: '#fff', textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', margin: '32px 0', letterSpacing: '0.5px' },

  /* Footer */
  finalFooter: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLinks: { display: 'flex', gap: '40px' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.95rem' }
};