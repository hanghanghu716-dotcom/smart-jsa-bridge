import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 법적 고지 컴포넌트: 모바일 환경에 맞춘 패딩 및 폰트 축소
const LegalDisclaimer = () => (
  <div style={styles.disclaimer} className="max-lg:!px-6 max-lg:!py-4">
    <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br className="hidden lg:block" />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function HighRiskGuide() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 고위험 특수작업 7종 데이터
  const highRiskList = [
    { id: "HR-01", title: "노후 배관 구간 교체 및 플랜지 용접 보수 작업", hazard: "잔류 인화성 가스 폭발, 용접 불꽃에 의한 화재", measure: "LEL 0% 확인 후 작업, 11m 이내 가연물 격리 및 화재감시자 배치", pages: 1 },
    { id: "HR-02", title: "변전실 고압 수배전반 정기 점검 및 케이블 교체 공사", hazard: "차단기 오조작 감전, 잔류 전하에 의한 아크 발생", measure: "개인별 LOTO 실시, 검전기 활용 무전압 확인 및 접지봉 방전", pages: 1 },
    { id: "HR-03", title: "배관로 매설을 위한 터파기 및 흙막이 지보공 설치", hazard: "기존 지하매설물 파손 폭발, 법면 붕괴로 인한 매몰", measure: "지장물 탐지 및 인력 굴착 병행, 안전 기울기 준수 및 계측기 모니터링", pages: 1 },
    { id: "HR-04", title: "신규 배관 용접부 품질 검사용 방사선 투과시험(RT)", hazard: "방사선 피폭, 야간 작업 시 통제 구역 무단 침범", measure: "안전거리 산출 후 경계 로프 설치, 전담 감시인 배치 및 서베이 미터 휴대", pages: 1 },
    { id: "HR-05", title: "질소 치환 탱크 내부 정밀 점검 및 잔류물 제거 작업", hazard: "잔류 질소에 의한 산소 결핍 질식, 밀폐공간 고립", measure: "진입 전/중 강제 환기 및 산소 농도 측정, 외부 감시인 배치 필수", pages: 1 },
    { id: "HR-06", title: "고중량 설비 설치를 위한 크레인 인양 및 이동 작업", hazard: "지반 지지력 부족으로 인한 장비 전도, 화물 낙하 협착", measure: "아웃트리거 깔판 보강, 2줄 걸이 준수 및 10cm 시험 인양 실시", pages: 1 },
    { id: "HR-07", title: "공장 지붕 판넬 보수 및 고소작업대(렌탈) 운용 작업", hazard: "지붕 판넬 부식 부위 파손 추락, 고압선 접촉 감전", measure: "하중 분산용 발판 설치, 안전대 2중 체결 및 전력선 이격 거리 확보", pages: 1 }
  ];

  return (
    <div style={styles.wrapper}>
      {/* HEADER: 서비스 공통 메뉴 통합 */}
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

      <LegalDisclaimer />
      
      {/* HERO SECTION: 고위험 가이드 전용 텍스트 정렬 */}
      <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.headerBox}>
          <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">HIGH RISK SPECIALIST</span>
          <h2 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">고위험 특수작업 JSA</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">견본 가이드 (7종)</span>
          </h2>
          <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">생명과 직결된 고위험 공종의 표준 위험 분석 데이터입니다.</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">이미지를 확인하신 후 원본 PDF를 다운로드하십시오.</span>
          </p>
        </div>

        <div style={styles.listContainer}>
          {highRiskList.map((item) => (
            <div key={item.id} style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
              <div style={styles.cardHeader}>
                <span style={styles.jsaId}>{item.id}</span>
                <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.6rem]">{item.title}</h4>
              </div>

              {/* infoGrid: 2열 -> 1열 전환을 통한 텍스트 겹침 방지 */}
              <div style={styles.infoGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                <div style={styles.infoBox} className="max-lg:!p-4">
                  <strong style={styles.labelRed}>⚠ 중대위험 요인</strong>
                  <p style={styles.infoText}>{item.hazard}</p>
                </div>
                <div style={styles.infoBox} className="max-lg:!p-4">
                  <strong style={styles.labelBlue}>🛡 필수 안전대책</strong>
                  <p style={styles.infoText}>{item.measure}</p>
                </div>
              </div>

              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>JSA 리포트 미리보기</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/highrisk/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a href={`/assets/pdf/highrisk/${item.id}.pdf`} download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                  원본 PDF 전문 다운로드
                </a>
              </div>
            </div>
          ))}
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
  /* 스타일 시스템 동기화 및 테마 컬러(Red) 유지 */
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' },
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

  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontWeight: '800', margin: 0, wordBreak: 'keep-all', lineHeight: '1.6' },
  section: { padding: '60px 0', maxWidth: '1000px', margin: '0 auto' },
  headerBox: { textAlign: 'left', marginBottom: '60px' },
  categoryTag: { color: '#d32f2f', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '20px' },
  title: { fontWeight: '900', color: '#111' },
  description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#d32f2f', fontWeight: '900', fontSize: '0.85rem' },
  jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#d32f2f', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5', wordBreak: 'keep-all' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  previewLabel: { fontSize: '0.7rem', color: '#aaa', padding: '10px 20px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#d32f2f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};