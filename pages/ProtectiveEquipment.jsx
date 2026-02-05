import { useNavigate } from 'react-router-dom';

export default function ProtectiveEquipment() {
  const navigate = useNavigate();

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

  // KOSHA 인증 FAQ 데이터
  const certificationFaq = [
    { q: "안전인증과 자율안전확인의 차이점", a: "안전인증은 공단이 직접 성능을 시험하며(고위험), 자율안전확인은 제조사가 스스로 확인 후 신고하는 제도입니다." },
    { q: "해외 인증 제품의 국내 사용 가능 여부", a: "해외 인증만으로는 불충분하며, 반드시 국내 법령에 따른 KOSHA 안전인증(KC마크)을 다시 획득해야 합니다." },
    { q: "보호구 안전인증의 유효기간", a: "별도의 유효기간은 없으나, 품질 유지를 위해 주기적인 제품 및 현장 심사를 거쳐 인증을 유지해야 합니다." },
    { q: "인증 제품 확인 방법", a: "보호구의 KC마크와 인증번호를 확인하고, 산업안전보건포털 시스템에서 모델명을 검색하는 것이 가장 정확합니다." }
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
          <span style={styles.m3Tag}>PERSONAL PROTECTIVE EQUIPMENT & CERTIFICATION</span>
          <h2 style={styles.mainTitle}>산업용 보호구 종류 및<br />안전인증(KC) 통합 기술 가이드</h2>
          <p style={styles.subTitle}>
            안전인증 확인은 현장 안전의 시작입니다. 부위별 보호구의 특성과<br />
            KOSHA 인증 기준에 따른 법적 준수 사항을 한눈에 확인하십시오.
          </p>
        </div>
      </section>

      {/* SECTION 1: 보호구 8종 분류 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>1. 부위별 보호구 분류 및 세부 유형</h3>
          <div style={styles.flowGrid}>
            {ppeTypes.map((ppe, i) => (
              <div key={i} style={styles.flowCard}>
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

      {/* SECTION 2: 안전인증 제도 비교 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>2. 법적 안전인증 체계 비교</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>구분</th>
                  <th style={styles.th}>안전인증 (고위험)</th>
                  <th style={styles.th}>자율안전확인 (중·저위험)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tdBold}>확인 주체</td>
                  <td style={styles.td}>안전보건공단 직접 심사</td>
                  <td style={styles.td}>제조사 자체 신고</td>
                </tr>
                <tr>
                  <td style={styles.tdBold}>주요 품목</td>
                  <td style={styles.td}>안전모, 안전화, 안전대, 마스크</td>
                  <td style={styles.td}>보안경, 보안면, 잠수기 등</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 3: KOSHA FAQ (인증 행정) */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>3. 보호구 안전인증 자주 묻는 질문</h3>
          <div style={styles.checkGrid}>
            {certificationFaq.map((item, i) => (
              <div key={i} style={styles.checkItem}>
                <h4 style={styles.itemHeader}>Q. {item.q}</h4>
                <p style={styles.itemContent}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: 법적 의무 및 수칙 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>4. 보호구 지급 의무 및 관리 3대 수칙</h3>
          <div style={styles.checkGrid}>
            {[
              { t: "무상 지급 의무", c: "사업주는 유해·위험 작업에 적합한 보호구를 근로자에게 무상 지급해야 함" },
              { t: "착용 및 교육", c: "근로자는 지급된 보호구를 반드시 착용해야 하며, 관련 교육이 병행되어야 함" },
              { t: "유지 관리", c: "파손되거나 성능이 저하된 보호구는 즉시 폐기하고 신규 제품으로 교체" }
            ].map((item, i) => (
              <div key={i} style={styles.checkItem}>
                <h4 style={styles.itemHeader}>● {item.t}</h4>
                <p style={styles.itemContent}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: 결론 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>5. 결론 및 제언</h3>
          <p style={styles.para}>
            적절한 보호구의 선택과 국가 안전인증(KC) 확인은 사고 예방의 마지막 보루입니다. 
            <strong> Smart JSA Bridge</strong>에서 도출된 위험성평가 결과에 맞춰 최적의 보호구를 매칭하고, 정기적인 점검을 통해 근로자의 생명을 보호하시기 바랍니다.
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
  /* 가독성 최적화 및 디자인 통일 규격 */
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
  para: { fontSize: '1.15rem', color: '#333', marginBottom: '35px', wordBreak: 'keep-all' },
  
  /* 카드 디자인 패턴 통일 */
  flowGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  flowCard: { padding: '25px', backgroundColor: '#fff', borderRadius: '16px', borderTop: '5px solid #007bff', boxShadow: '0 8px 25px rgba(0, 123, 255, 0.08)' },
  flowIdx: { fontSize: '0.9rem', fontWeight: '900', color: '#007bff', display: 'block', marginBottom: '10px' },
  flowT: { fontSize: '1.15rem', fontWeight: '800', color: '#111', marginBottom: '10px' },
  flowC: { fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '15px' },
  subTagBox: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  subTag: { padding: '4px 10px', backgroundColor: '#f0f4f8', borderRadius: '4px', fontSize: '0.8rem', color: '#007bff', fontWeight: '700' },

  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' },
  checkItem: { padding: '30px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  itemHeader: { fontSize: '1.15rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '1rem', color: '#555', lineHeight: '1.6' },

  tableWrapper: { overflowX: 'auto', marginTop: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '18px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800', fontSize: '1.1rem' },
  td: { padding: '18px', border: '1px solid #eee', fontSize: '1.05rem', color: '#444' },
  tdBold: { padding: '18px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc' },
  
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center', fontSize: '1rem' }
};