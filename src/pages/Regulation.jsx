import { useNavigate } from 'react-router-dom';

export default function Regulation() {
  const navigate = useNavigate();

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
          <span style={styles.m3Tag}>ADMINISTRATIVE SAFETY GUIDE</span>
          <h2 style={styles.mainTitle}>위험성평가 실시규정 수립 및<br />법적 관리 지침 전문 가이드</h2>
          <p style={styles.subTitle}>
            사업장 안전보건관리체계 구축의 핵심인 '실시규정' 작성 방법과<br />
            산업안전보건법에 따른 행정적 준수 사항을 상세히 안내합니다.
          </p>
        </div>
      </section>

      {/* SECTION 1: 실시규정의 정의 및 의무 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>1. 위험성평가 실시규정이란?</h3>
          <p style={styles.para}>
            위험성평가 실시규정은 사업주가 해당 사업장의 유해·위험요인을 파악하고 위험성을 결정하여 감소대책을 수립·시행하기 위한 <strong>사내 표준 지침</strong>입니다. 이는 단순한 권고 사항이 아닌, 산업안전보건법에 의거한 법적 필수 요건입니다.
          </p>
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>실시규정 비치의 목적</h4>
            <ul style={styles.infoList}>
              <li>안전보건관리체계 구축을 위한 책임과 권한의 명확화</li>
              <li>일관성 있는 위험성평가 프로세스 유지 및 관리</li>
              <li>근로자 참여를 통한 실질적인 현장 위험 발굴 및 개선</li>
              <li>법적 점검 및 감사 시 대응 가능한 증빙 자료 확보</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: 실시규정 필수 포함 10대 항목 (블로그 내용 반영) */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>2. 실시규정 작성 시 필수 포함 항목</h3>
          <p style={styles.para}>고용노동부 고시 및 행정 지침에 따라 사내 실시규정에는 다음 10가지 사항이 구체적으로 명시되어야 합니다.</p>
          <div style={styles.checkGrid}>
            {[
              { t: "평가의 목적 및 방법", c: "위험성평가의 목표 및 사업장에 특화된 평가 기법의 선정" },
              { t: "수행 조직 및 역할", c: "사업주, 관리감독자, 근로자의 구체적인 역할과 책임(R&R) 정의" },
              { t: "평가 대상 선정", c: "건설물, 기계, 설비 및 모든 일상적·비일상적 작업의 포함 범위" },
              { t: "실시 시기 결정", c: "최초, 정기, 수시 평가의 구체적 발생 조건 및 주기 설정" },
              { t: "유해·위험요인 파악", c: "현장 순회 점검, 청취 조사 등 실무적인 위험 요인 도출 방법" },
              { t: "위험성 추정 및 결정", c: "빈도·강도법 등 위험 수준을 결정하기 위한 객관적 기준 수립" },
              { t: "감소 대책 수립/실행", c: "위험 수준별 개선 우선순위 선정 및 개선 후 확인 절차" },
              { t: "근로자 참여 방식", c: "위험요인 파악 및 대책 수립 시 근로자 의견을 수렴하는 체계" },
              { t: "기록 보존 및 관리", c: "평가 결과물에 대한 작성 양식 및 3년 이상 보존 지침" },
              { t: "교육 및 전파 절차", c: "평가 결과를 현장 근로자에게 알리고 관련 교육을 실시하는 절차" }
            ].map((item, i) => (
              <div key={i} style={styles.checkItem}>
                <h4 style={styles.itemHeader}>● {item.t}</h4>
                <p style={styles.itemContent}>{item.c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: 실시 시기 상세 가이드 */}
      <section style={styles.m3Section}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>3. 위험성평가의 종류 및 실시 시기</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>평가 종류</th>
                  <th style={styles.th}>실시 시기 및 조건</th>
                  <th style={styles.th}>핵심 비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tdBold}>최초평가</td>
                  <td style={styles.td}>사업장 개시 후 1개월 이내 전체 공정 대상</td>
                  <td style={styles.td}>법적 필수 전체 평가</td>
                </tr>
                <tr>
                  <td style={styles.tdBold}>정기평가</td>
                  <td style={styles.td}>최초평가 이후 매년 1회 주기적 실시</td>
                  <td style={styles.td}>연 1회 이상 반복</td>
                </tr>
                <tr>
                  <td style={styles.tdBold}>수시평가</td>
                  <td style={styles.td}>설비 도입, 공정 변경, 중대재해 발생 시</td>
                  <td style={styles.td}>사유 발생 시 즉시</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4: 미이행 시 벌칙 규정 */}
      <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>4. 법적 책임 및 과태료 규정</h3>
          <p style={styles.para}>위험성평가 의무 위반 시 산업안전보건법에 따라 다음과 같은 행정적·형사적 책임이 발생할 수 있습니다.</p>
          <div style={styles.legalBox}>
            <ul style={styles.infoList}>
              <li><strong>위험성평가 미실시</strong>: 시정 명령 및 위반 정도에 따른 과태료 부과 (최대 500만원)</li>
              <li><strong>기록 미보존 (3년)</strong>: 관련 증빙 서류 미비 시 행정 처분</li>
              <li><strong>중대재해 발생 시</strong>: 위험성평가 미실시가 확인될 경우 사업주 처벌 강화 (중대재해처벌법 연계)</li>
            </ul>
          </div>
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
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', lineHeight: '1.7' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px' },
  header: { padding: '2rem 0', borderBottom: '1px solid #eee' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#111', cursor: 'pointer' },
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff' },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '30px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { fontSize: '1.1rem', opacity: 0.8, lineHeight: '1.8' },
  m3Section: { padding: '80px 0' },
  sectionTitle: { fontSize: '2rem', fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  para: { fontSize: '1.1rem', color: '#333', marginBottom: '35px' },
  infoBox: { padding: '35px', backgroundColor: '#f8f9fa', borderRadius: '16px', borderLeft: '6px solid #007bff' },
  infoTitle: { fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' },
  infoList: { paddingLeft: '20px', fontSize: '1.05rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '15px' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' },
  checkItem: { padding: '25px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555', lineHeight: '1.6' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '18px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800' },
  td: { padding: '18px', border: '1px solid #eee', fontSize: '1rem' },
  tdBold: { padding: '18px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc' },
  legalBox: { padding: '35px', backgroundColor: '#f1f3f9', borderRadius: '16px', borderLeft: '6px solid #1c1b1f' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center' }
};