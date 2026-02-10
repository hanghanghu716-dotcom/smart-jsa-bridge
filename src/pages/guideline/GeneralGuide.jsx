import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 법적 고지 컴포넌트: 모바일 폰트 및 패딩 최적화
const LegalDisclaimer = () => (
  <div style={styles.disclaimer} className="max-lg:!px-6 max-lg:!py-4">
    <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
      ⚠️ [주의] 본 견본은 참고용 자료이며, 위험성평가는 각 사업장의 공정 특성 및 환경에 맞게 반드시 실제 점검을 바탕으로 작성되어야 합니다. <br className="hidden lg:block" />
      Smart JSA Bridge는 본 자료의 활용으로 발생하는 법적 결과에 대해 책임을 지지 않습니다.
    </p>
  </div>
);

export default function GeneralGuide() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 기타 일반작업 JSA 10종 상세 데이터
  const generalJsaList = [
    { id: "GEN-01", title: "물류 창고 내 지게차 파레트 화물 적재 및 이송 작업", hazard: "급회전 시 지게차 전도, 전방 시야 미확보로 인한 보행자 충돌 협착", measure: "사내 제한속도(10km/h) 준수, 유도자 배치 및 마스트 틸팅 안착 확인", pages: 1 },
    { id: "GEN-02", title: "병동 내 환자 거동 보조 및 의료폐기물 취급 작업", hazard: "환자 이송 중 낙상 사고, 주사침 자상에 의한 감염", measure: "휠체어/침대 바퀴 잠금 확인, 사용한 주사침 리캡(Re-capping) 절대 금지", pages: 1 },
    { id: "GEN-03", title: "사업장 내 녹지대 예초 작업 및 수목 전지 정비 공사", hazard: "예초기 칼날 파손 비래물 타격, 인근 고압선 접촉에 의한 감전", measure: "망사형 안면보호구 착용, 전기시설물 이격 거리(2m) 확보 및 접근 통제", pages: 1 },
    { id: "GEN-04", title: "취약지역 도보 순찰 및 출입 차량 유도·통제 작업", hazard: "진입 차량과의 충돌 사고, 야간 순찰 중 거동수상자 폭행 상해", measure: "고휘도 반사조끼 착용, 2인 1조 순찰 원칙 준수 및 호신용 장구 휴대", pages: 1 },
    { id: "GEN-05", title: "실험실 내 유해 화학 시약 조제 및 분석 장비 운용 작업", hazard: "후드 성능 저하 시 유독 가스 실내 유출, 시약 비산에 의한 화학적 화상", measure: "흄 후드(Fume Hood) 내 작업 준수, MSDS 교육 이수 및 전용 보호구 착용", pages: 1 },
    { id: "GEN-06", title: "지하주차장 바닥 찌든 때 제거 및 고압 물청소 작업", hazard: "통제되지 않은 주행 차량과의 충돌, 습윤 장소 전동기기 사용 중 감전", measure: "작업 구역 라바콘 설치, 누전차단기 경유 전원 사용 및 절연 장화 착용", pages: 1 },
    { id: "GEN-07", title: "폐기물 파쇄기 가동 및 투입구 이물질 제거 작업", hazard: "파쇄기 개구부 신체 일부 유입, 정비 중 타 작업자의 불시 가동 협착", measure: "주전원 차단 후 LOTO(잠금/표지) 실시, 손 대신 전용 수공구 사용", pages: 1 },
    { id: "GEN-08", title: "건물 외벽 유리 세정 및 달비계 운용 작업", hazard: "로프 마모 및 파단에 의한 추락, 작업 도구 낙하로 인한 보행자 타격", measure: "수직구명줄 별도 설치 및 안전대 체결, 하부 통제원 배치 및 경계선 설정", pages: 1 },
    { id: "GEN-09", title: "단체 급식소 식자재 전처리 및 대형 국솥 조리 작업", hazard: "바닥 물기에 의한 미끄러짐 전도, 고온 기름/증기 접촉 시 화상", measure: "인증된 미끄럼 방지 조리화 착용, K급 화재 소화기 비치 및 수분 제거", pages: 1 },
    { id: "GEN-10", title: "데이터센터 내 서버 랙 신규 설치 및 트레이 포설 작업", hazard: "중량 랙 이동 중 관성에 의한 협착, 높은 곳 작업 시 사다리 전도 추락", measure: "3인 1조 작업 실시, 사다리 최상단 탑승 금지 및 하부 조력자 배치", pages: 1 }
  ];

  return (
    <div style={styles.wrapper}>
      {/* HEADER: 메뉴 기능 통합 */}
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
      
      {/* HERO SECTION: 줄바꿈 및 정밀 정렬 적용 */}
      <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.headerBox}>
          <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">GENERAL & FACILITY SAFETY</span>
          <h2 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">기타·일반작업 JSA</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">견본 가이드 (10종)</span>
          </h2>
          <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">일상적인 시설 관리, 물류, 보건 분야에서 발생할 수 있는</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">잠재 위험을 분석한 데이터입니다. 상세 이미지를 확인하십시오.</span>
          </p>
        </div>

        <div style={styles.listContainer}>
          {generalJsaList.map((item) => (
            <div key={item.id} style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
              <div style={styles.cardHeader}>
                <span style={styles.jsaId}>{item.id}</span>
                <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.6rem]">{item.title}</h4>
              </div>

              {/* infoGrid: 2열 -> 1열 전환 핵심 부분 */}
              <div style={styles.infoGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                <div style={styles.infoBox} className="max-lg:!p-4">
                  <strong style={styles.labelRed}>⚠ 핵심위험</strong>
                  <p style={styles.infoText}>{item.hazard}</p>
                </div>
                <div style={styles.infoBox} className="max-lg:!p-4">
                  <strong style={styles.labelBlue}>🛡 감소대책</strong>
                  <p style={styles.infoText}>{item.measure}</p>
                </div>
              </div>

              <div style={styles.imageContainer}>
                <p style={styles.previewLabel}>JSA 리포트 미리보기</p>
                {Array.from({ length: item.pages || 1 }, (_, i) => (
                  <img 
                    key={i}
                    src={`/assets/pdf/general/${item.id}/${item.id}_00${i + 1}.jpg`}
                    alt={`${item.title} 미리보기`}
                    style={styles.previewImage}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>

              <div style={styles.cardFooter}>
                <a href={`/assets/pdf/general/${item.id}.pdf`} download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                  원본 PDF 견본 다운로드
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
  /* [Main.jsx 스타일 시스템과 동기화] */
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
  categoryTag: { color: '#28a745', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '20px' },
  title: { fontWeight: '900', color: '#111' },
  description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#28a745', fontWeight: '900', fontSize: '0.85rem' },
  jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#28a745', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5', wordBreak: 'keep-all' },

  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' },
  previewLabel: { fontSize: '0.7rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },

  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};