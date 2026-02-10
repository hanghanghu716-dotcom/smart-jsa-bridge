import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProtectiveEquipment() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 8종 보호구 분류 데이터
  const ppeTypes = [
    { t: "01. 머리 보호구", c: "낙하·비래물 및 추락 시 충격 흡수", tags: ["안전모(A/AB/ABE)"] },
    { t: "02. 안구·안면", c: "비산물, 유해광선, 화학물질 차단", tags: ["보안경", "고글", "용접면"] },
    { t: "03. 귀 보호구", c: "고소음 현장의 소음성 난청 예방", tags: ["귀마개", "귀덮개"] },
    { t: "04. 호흡기", c: "분진, 유해가스, 산소결핍 방지", tags: ["방진", "방독", "송기마스크"] },
    { t: "05. 손 보호구", c: "절단, 화상, 감전, 화학물질 보호", tags: ["내절단", "절연", "내화학"] },
    { t: "06. 발 보호구", c: "낙하 압박 및 날카로운 물체 찌름 방지", tags: ["안전화", "정전기화"] },
    { t: "07. 안전대", c: "고소 작업 시 추락 충격 방지", tags: ["그네식", "죔줄", "추락방지대"] },
    { t: "08. 보호복", c: "전신 유해물질 및 고열 노출 차단", tags: ["내화학복", "방열복", "방전복"] }
  ];

  const certificationFaq = [
    { q: "안전인증과 자율안전확인의 차이점", a: "안전인증은 공단이 직접 성능을 시험하며(고위험), 자율안전확인은 제조사가 스스로 확인 후 신고하는 제도입니다." },
    { q: "해외 인증 제품의 국내 사용 가능 여부", a: "해외 인증만으로는 불충분하며, 반드시 국내 법령에 따른 KOSHA 안전인증(KC마크)을 다시 획득해야 합니다." },
    { q: "보호구 안전인증의 유효기간", a: "별도의 유효기간은 없으나, 품질 유지를 위해 주기적인 제품 및 현장 심사를 거쳐 인증을 유지해야 합니다." },
    { q: "인증 제품 확인 방법", a: "보호구의 KC마크와 인증번호를 확인하고, 산업안전보건포털 시스템에서 모델명을 검색하는 것이 가장 정확합니다." }
  ];

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div className="flex justify-between items-center h-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
          <div style={styles.menuTrigger} onClick={() => setIsMenuOpen(true)}>
            <span style={styles.menuText} className="max-lg:hidden">MENU</span>
            <div style={styles.hamburger}>
              <div style={styles.bar}></div>
              <div style={styles.bar}></div>
            </div>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER */}
      <div style={{
        ...styles.sideDrawer,
        transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isMenuOpen ? 'visible' : 'hidden',
        width: window.innerWidth < 1024 ? '100%' : '400px'
      }}>
        <div style={styles.drawerHeader}>
          <div style={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>✕ CLOSE</div>
        </div>
        <nav style={styles.drawerNav}>
          <div style={styles.navCategory}>CONTENTS</div>
          <Link to="/regulation" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가 실시규정 가이드</Link>
          <Link to="/jrajsa" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>위험성평가(JRA/JSA) 실무 프로세스</Link>
          <Link to="/protectiveequipment" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>보호구에 관하여</Link>
          <Link to="/riskclassification" style={styles.drawerLink} onClick={() => setIsMenuOpen(false)}>일반 작업/고위험 작업</Link>
        </nav>
      </div>
      {isMenuOpen && <div style={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} />}

      {/* HERO SECTION: 텍스트 줄바꿈 및 들여쓰기 수정 */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">PERSONAL PROTECTIVE EQUIPMENT</span>
          <h2 style={{...styles.mainTitle, fontSize: undefined}} className="text-[24px] lg:text-[2.8rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">산업용 보호구 종류 및</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">안전인증(KC) 통합 기술 가이드</span>
          </h2>
          
          {/* 요청하신 3단계 줄바꿈 적용 */}
          <p style={styles.subTitle} className="text-[14px] lg:text-[1.15rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">안전인증 확인은 현장 안전의 시작입니다. 부위별 보호구의</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">특성과 KOSHA 인증 기준에 따른 법규를 한눈에</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">확인하십시오.</span>
          </p>
        </div>
      </section>

      {/* SECTION 1: 보호구 분류 (카드 잘림 현상 수정) */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">1. 부위별 보호구 분류 및 세부 유형</h3>
          <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
            {ppeTypes.map((ppe, i) => (
              /* max-lg:!border-x-0 제거하여 카드 형태 유지 */
              <div key={i} style={styles.flowCard} className="max-lg:!p-6">
                <span style={styles.flowIdx}>{ppe.t.split('.')[0]}</span>
                <h4 style={styles.flowT}>{ppe.t.split('. ')[1]}</h4>
                <p style={styles.flowC}>{ppe.c}</p>
                <div style={styles.subTagBox}>
                  {ppe.tags.map((tag, idx) => (
                    <span key={idx} style={styles.subTag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이하 섹션들에도 동일한 카드 레이아웃 적용 */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">3. 보호구 안전인증 자주 묻는 질문</h3>
          <div style={styles.checkGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
            {certificationFaq.map((item, i) => (
              <div key={i} style={styles.checkItem} className="max-lg:!p-6">
                <h4 style={styles.itemHeader}>Q. {item.q}</h4>
                <p style={styles.itemContent}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  /* [기존 스타일 유지] */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  menuTrigger: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  menuText: { color: '#111', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' },
  hamburger: { display: 'flex', flexDirection: 'column', gap: '5px' },
  bar: { width: '20px', height: '2px', backgroundColor: '#111' },
  sideDrawer: { position: 'fixed', top: 0, right: 0, height: '100vh', backgroundColor: '#fff', zIndex: 1000, transition: 'transform 0.4s ease', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', padding: '60px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  drawerHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' },
  closeBtn: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', color: '#111' },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  navCategory: { fontSize: '0.7rem', fontWeight: '900', color: '#888', letterSpacing: '2px', marginBottom: '20px' },
  drawerLink: { textDecoration: 'none', color: '#111', fontSize: '1.1rem', fontWeight: '700', padding: '15px 0', borderBottom: '1px solid #f0f0f0' },
  menuOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(8px)' },
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { opacity: 0.8, lineHeight: '1.8', wordBreak: 'keep-all' },
  m3Section: { padding: '100px 0' },
  sectionTitle: { fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '5px solid #007bff', boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)' },
  flowIdx: { fontSize: '0.8rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '10px' },
  flowT: { fontSize: '1.1rem', fontWeight: '800', color: '#111', marginBottom: '10px' },
  flowC: { fontSize: '0.9rem', color: '#555', lineHeight: '1.6', marginBottom: '15px' },
  subTagBox: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  subTag: { padding: '4px 10px', backgroundColor: '#f0f4f8', borderRadius: '4px', fontSize: '0.75rem', color: '#007bff', fontWeight: '700' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};