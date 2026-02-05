import { useNavigate } from 'react-router-dom';

export default function JraJsa() {
  const navigate = useNavigate();

  // JSA 실행 상세 흐름 데이터
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
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={styles.heroSection}>
        <div style={styles.container}>
          <span style={styles.m3Tag}>INTEGRATED SAFETY COMPLIANCE</span>
          <h2 style={styles.mainTitle}>위험성평가(JRA/JSA) 실무 프로세스 및<br />법적 이행 규정 통합 기술 지침</h2>
          <p style={styles.subTitle}>
            산업안전보건법 제36조를 완벽히 준수하며 현장 무재해를 실현하기 위한<br />
            전문적인 분석 방법론과 상세 실행 절차를 통합 제공합니다.
          </p>
        </div>
      </section>

      {/* SECTION 1: JRA 원칙 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>1. 작업위험성평가(JRA) 수행 원칙</h3>
          <p style={styles.para}>
            <strong>JRA(Job Risk Assessment)</strong>는 모든 작업을 대상으로 사업장 내 근원적 위험을 파악하여 사고를 미연에 방지하는 핵심 절차입니다.
          </p>
          <div style={styles.infoBox}>
            <ul style={styles.infoList}>
              <li>작업절차서 제·개정 시 반드시 위험성평가를 선행해야 함</li>
              <li>작업 조건 및 방법 변경 시 즉시 중지 후 재평가 실시 필수</li>
              <li>중대재해 발생 혹은 공정 변경 시 수시평가를 통해 안전 무결성 확보</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: 법적 근거 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>2. 산업안전보건법 제36조 및 의무 사항</h3>
          <div style={styles.legalBox}>
            <p style={styles.legalText}>
              <strong>제36조(위험성평가의 실시)</strong> ① 사업주는 건설물, 설비, 원재료, 작업행동 등으로 인한 유해·위험요인을 파악하여 위험성을 결정하고 조치를 취하여야 한다.
            </p>
            <p style={styles.legalText}>
              ② 실시 시 반드시 <strong>근로자를 참여</strong>시켜야 하며, 결과물은 <strong>최소 3년 이상 보존</strong>해야 합니다.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: JSA 흐름 (모든 카드 파란색 강조 적용) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>3. JSA 실행 표준 프로세스 9단계</h3>
          <div style={styles.flowGrid}>
            {fullProcess.map((step, i) => (
              <div key={i} style={styles.flowCard}>
                <span style={styles.flowIdx}>{step.t.split('.')[0]}</span>
                <h4 style={styles.flowT}>{step.t.split('. ')[1]}</h4>
                <p style={styles.flowC}>{step.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 실시 규정 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>4. 위험성평가 실시 규정 필수 항목</h3>
          <div style={styles.checkGrid}>
            {[
              { t: "목적 및 방법", c: "추진 목표 및 사업장 특화 기법 선정" },
              { t: "수행 조직/역할", c: "관리책임자 및 근로자의 구체적 R&R" },
              { t: "평가 대상 선정", c: "모든 작업 및 설비의 리스트업" },
              { t: "시기 및 주기", c: "최초/정기/수시 평가 조건 명시" },
              { t: "위험성 결정 기준", c: "수준 산정을 위한 고유 판단 기준" },
              { t: "기록 보존 지침", c: "3년 보존 의무 및 서식 표준화" }
            ].map((item, i) => (
              <div key={i} style={styles.checkItem}>
                <h4 style={styles.itemHeader}>● {item.t}</h4>
                <p style={styles.itemContent}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 & 6: 비교 및 체크리스트 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <div style={styles.splitRow}>
            <div style={styles.splitLeft}>
              <h3 style={styles.sectionTitleSmall}>5. JRA vs JSA 비교 분석</h3>
              <table style={styles.table}>
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
            <div style={styles.splitRight}>
              <h3 style={styles.sectionTitleSmall}>6. JSA 필수 수행 체크리스트</h3>
              <ul style={styles.checklist}>
                {[
                  "표준 절차서(SOP)가 부재하거나 불명확한가?",
                  "원하지 않는 사고가 종종 발생하는 작업인가?",
                  "작업자가 해당 공정에 대한 경험이 부족한가?",
                  "고도의 숙련도나 특수 훈련이 필요한 작업인가?"
                ].map((t, i) => <li key={i} style={styles.checkli}>● {t}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: 산정 공식 (디자인 통일) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>7. 정량적 위험성 산정 로직</h3>
          <p style={styles.para}>위험도를 수치화하여 객관적인 개선 우선순위를 결정하는 표준 공식입니다.</p>
          <div style={styles.mathCardNormal}>
            <div style={styles.mathDisplay}>
              <span style={styles.mathVar}>Risk</span>
              <span style={styles.mathOp}>=</span>
              <span style={styles.mathVar}>Frequency</span>
              <span style={styles.mathOp}>×</span>
              <span style={styles.mathVar}>Severity</span>
            </div>
            <p style={styles.mathCaption}>위험성 = 사고 발생 빈도(확률) × 결과의 중대성(강도)</p>
          </div>
        </div>
      </section>

      {/* SECTION 8: 마무리 결언 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>8. 결론 및 제언</h3>
          <p style={styles.para}>
            위험성평가는 단순한 법적 절차를 넘어 근로자의 안전을 실질적으로 보장하는 가장 강력한 예방 도구입니다. 
            현장의 끊임없는 유해 요인 발굴과 안전 대책의 철저한 이행을 통해 사고 없는 사업장을 구축하시기 바랍니다. 
            <strong> Smart JSA Bridge</strong>는 데이터 기반의 정밀한 분석으로 사용자님의 안전 관리를 끝까지 지원하겠습니다.
          </p>
        </div>
      </section>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <p>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  /* 글로벌 폰트 및 레이아웃 최적화 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', lineHeight: '1.7' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px' },
  header: { padding: '2rem 0', borderBottom: '1px solid #eee' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' },
  
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontSize: '2.8rem', fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { fontSize: '1.15rem', opacity: 0.8, lineHeight: '1.8' },
  
  m3Section: { padding: '100px 0' },
  sectionTitle: { fontSize: '2.2rem', fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  sectionTitleSmall: { fontSize: '1.6rem', fontWeight: '800', marginBottom: '30px' },
  para: { fontSize: '1.15rem', color: '#333', marginBottom: '35px', wordBreak: 'keep-all' },
  
  infoBox: { padding: '35px', backgroundColor: '#f8f9fa', borderRadius: '16px', borderLeft: '6px solid #007bff' },
  infoList: { paddingLeft: '20px', fontSize: '1.1rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '15px' },

  legalBox: { padding: '40px', backgroundColor: '#f1f3f9', borderRadius: '16px', borderLeft: '6px solid #1c1b1f' },
  legalText: { fontSize: '1.1rem', color: '#333', marginBottom: '15px', lineHeight: '1.8' },
  
  /* 9단계 카드: 모든 카드 파란색 강조 및 그림자 적용 */
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  flowCard: { 
    padding: '30px', 
    backgroundColor: '#fff', 
    borderRadius: '16px', 
    borderTop: '5px solid #007bff', 
    boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)',
    transition: 'transform 0.3s ease'
  },
  flowIdx: { fontSize: '0.9rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '12px' },
  flowT: { fontSize: '1.25rem', fontWeight: '800', color: '#111', marginBottom: '12px' },
  flowC: { fontSize: '1rem', color: '#555', lineHeight: '1.6' },

  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  itemHeader: { fontSize: '1.15rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '1rem', color: '#555', lineHeight: '1.6' },
  
  splitRow: { display: 'flex', gap: '60px' },
  splitLeft: { flex: 1.2 },
  splitRight: { flex: 1 },
  checklist: { listStyle: 'none', padding: 0 },
  checkli: { fontSize: '1.1rem', color: '#444', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '18px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800', fontSize: '1.1rem' },
  td: { padding: '18px', border: '1px solid #eee', fontSize: '1.05rem', color: '#444' },
  tdBold: { padding: '18px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc', fontSize: '1.05rem' },
  
  /* 산정 공식 패턴 통일 */
  mathCardNormal: { padding: '60px 40px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' },
  mathDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' },
  mathVar: { fontStyle: 'italic', fontFamily: '"Times New Roman", serif', fontSize: '2.4rem', fontWeight: '600', color: '#111' },
  mathOp: { margin: '0 25px', fontSize: '2rem', color: '#888' },
  mathCaption: { fontSize: '1.1rem', color: '#666', opacity: 0.8 },
  
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', fontSize: '1rem' }
};