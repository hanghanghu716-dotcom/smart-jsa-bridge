import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function JraJsa() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fullProcess = [
    { t: "01. 절차서 작성", c: "사업장 특성에 맞는 JSA 표준 운영 지침 수립" },
    { t: "02. 분석 팀 구성", c: "관리감독자, 안전전문가, 현장 숙련 근로자 매칭" },
    { t: "03. 대상 작업 선정", c: "JRA 고위험 작업 및 비일상적 작업 우선순위 결정" },
    { t: "04. 평가 실행", c: "작업단계 구분, 유해위험요인 파악, 안전대책 수립" },
    { t: "05. 검토 및 승인", c: "수립 대책의 현장 적용성 검토 및 최종 승인" },
    { t: "06. 후속 조치", c: "설비 개선 및 안전 장구 확충 등 물리적 대책 이행" },
    { t: "07. 기록 및 교육", c: "분석 결과 DB화 및 현장 근로자 전파 교육 실시" },
    { t: "08. 현장 적용", c: "확정된 안전 작업 절차의 실무 투입 및 가동" },
    { t: "09. 이행 평가", c: "대책 이행 여부 상시 모니터링 및 유효성 검증" }
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

      {/* SIDE DRAWER (Navigation) */}
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

{/* HERO SECTION */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">INTEGRATED SAFETY COMPLIANCE</span>
          
          {/* 제목 부분: '프로세스' 뒤 줄바꿈 및 '및' 정렬 위치 수정 */}
          <h2 style={{...styles.mainTitle, fontSize: undefined}} className="text-[24px] lg:text-[2.8rem] font-extrabold leading-tight mb-6">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">위험성평가(JRA/JSA) 실무 프로세스</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">및 법적 이행 규정 통합 기술 지침</span>
          </h2>

          {/* 서브타이틀 부분: '위한' 뒤 줄바꿈 및 정렬 위치 수정 */}
          <p style={styles.subTitle} className="text-[14px] lg:text-[1.15rem]">
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">산업안전보건법 제36조를 준수하며 현장 무재해를 실현하기 위한</span>
            <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">전문 방법론을 제공합니다.</span>
          </p>
        </div>
      </section>

      {/* SECTION 3: JSA 흐름 (3열 -> 1열 전환) */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">3. JSA 실행 표준 프로세스 9단계</h3>
          <div style={styles.flowGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
            {fullProcess.map((step, i) => (
              <div key={i} style={styles.flowCard} className="max-lg:!p-6 max-lg:!rounded-none">
                <span style={styles.flowIdx}>{step.t.split('.')[0]}</span>
                <h4 style={styles.flowT}>{step.t.split('. ')[1]}</h4>
                <p style={styles.flowC}>{step.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 실시 규정 (3열 -> 1열 전환) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">4. 위험성평가 실시 규정 필수 항목</h3>
          <div style={styles.checkGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
            {[
              { t: "목적 및 방법", c: "추진 목표 및 사업장 특화 기법 선정" },
              { t: "수행 조직/역할", c: "관리책임자 및 근로자의 구체적 R&R" },
              { t: "평가 대상 선정", c: "모든 작업 및 설비의 리스트업" },
              { t: "시기 및 주기", c: "최초/정기/수시 평가 조건 명시" },
              { t: "위험성 결정 기준", c: "수준 산정을 위한 고유 판단 기준" },
              { t: "기록 보존 지침", c: "3년 보존 의무 및 서식 표준화" }
            ].map((item, i) => (
              <div key={i} style={styles.checkItem} className="max-lg:!p-6">
                <h4 style={styles.itemHeader}>● {item.t}</h4>
                <p style={styles.itemContent}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 & 6: 비교 및 체크리스트 (2열 -> 1열 전환 핵심 수정 부분) */}
      <section style={styles.m3Section} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <div style={styles.splitRow} className="max-lg:!flex-col max-lg:!gap-16">
            <div style={styles.splitLeft} className="w-full">
              <h3 style={styles.sectionTitleSmall} className="text-[20px] lg:text-[1.6rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">5. JRA vs JSA 비교 분석</h3>
              <div className="overflow-x-auto">
                <table style={styles.table} className="min-w-[450px]">
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>구분</th>
                      <th style={styles.th}>JRA</th>
                      <th style={styles.th}>JSA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={styles.tdBold}>평가 대상</td>
                      <td style={styles.td}>공정 및 설비 전체</td>
                      <td style={styles.td}>세부 작업 행동</td>
                    </tr>
                    <tr>
                      <td style={styles.tdBold}>참여 주체</td>
                      <td style={styles.td}>관리자 및 전문가</td>
                      <td style={styles.td}>현장 근로자 핵심</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={styles.splitRight} className="w-full">
              <h3 style={styles.sectionTitleSmall} className="text-[20px] lg:text-[1.6rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">6. JSA 필수 수행 체크리스트</h3>
              <ul style={styles.checklist} className="max-lg:!pl-4">
                {[
                  "표준 절차서(SOP)가 부재하거나 불명확한가?",
                  "원하지 않는 사고가 종종 발생하는 작업인가?",
                  "작업자가 해당 공정에 대한 경험이 부족한가?",
                  "고도의 숙련도나 특수 훈련이 필요한 작업인가?"
                ].map((t, i) => <li key={i} style={styles.checkli} className="text-sm lg:text-base">● {t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: 산정 공식 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}} className="max-lg:!py-16 max-lg:!px-6">
        <div style={styles.container}>
          <h3 style={styles.sectionTitle} className="text-[22px] lg:text-[2.2rem] max-lg:before:content-['\00a0\00a0\00a0\00a0']">7. 정량적 위험성 산정 로직</h3>
          <div style={styles.mathCardNormal} className="max-lg:!px-4 max-lg:!py-10">
            <div style={styles.mathDisplay} className="max-lg:!flex-wrap max-lg:!gap-2">
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Risk</span>
              <span style={styles.mathOp} className="max-lg:!mx-2">=</span>
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Frequency</span>
              <span style={styles.mathOp} className="max-lg:!mx-2">×</span>
              <span style={styles.mathVar} className="max-lg:!text-[1.5rem]">Severity</span>
            </div>
            <p style={styles.mathCaption} className="max-lg:text-xs">위험성 = 사고 발생 빈도(확률) × 결과의 중대성(강도)</p>
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
  sectionTitleSmall: { fontWeight: '800', marginBottom: '30px' },
  para: { fontSize: '1.1rem', color: '#333', marginBottom: '35px', wordBreak: 'keep-all' },
  
  infoBox: { padding: '35px', backgroundColor: '#f8f9fa', borderRadius: '16px', borderLeft: '6px solid #007bff' },
  infoList: { paddingLeft: '20px', fontSize: '1.05rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '15px' },

  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  flowCard: { padding: '30px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '5px solid #007bff', boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)' },
  flowIdx: { fontSize: '0.8rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '12px' },
  flowT: { fontSize: '1.15rem', fontWeight: '800', color: '#111', marginBottom: '12px' },
  flowC: { fontSize: '0.95rem', color: '#555', lineHeight: '1.6' },

  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555' },

  splitRow: { display: 'flex', gap: '60px' },
  splitLeft: { flex: 1.2 },
  splitRight: { flex: 1 },
  checklist: { listStyle: 'none', padding: 0 },
  checkli: { color: '#444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '15px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800' },
  td: { padding: '15px', border: '1px solid #eee', color: '#444' },
  tdBold: { padding: '15px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc' },
  
  mathCardNormal: { padding: '60px 40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' },
  mathVar: { fontStyle: 'italic', fontFamily: 'serif', fontSize: '2rem', fontWeight: '600', color: '#111' },
  mathOp: { margin: '0 20px', fontSize: '1.5rem', color: '#888' },
  mathCaption: { fontSize: '0.95rem', color: '#666' },
  
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};