import { Link, useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>TERMS OF SERVICE</span>
          <h2 style={styles.heading}>서비스 이용약관</h2>
          <p style={styles.subHeading}>Smart JSA Bridge 이용을 위해 반드시 확인해야 할 법적 권한과 책임 범위를 안내합니다.</p>
          
          <div style={styles.article}>
            <h3>제1조 (목적)</h3>
            <p>본 약관은 Smart JSA Bridge(이하 '서비스')가 제공하는 산업 안전 분석 도구 및 데이터베이스의 이용 조건과 절차를 규정함을 목적으로 합니다.</p>

            <h3>제2조 (서비스의 본질 및 한계)</h3>
            <p>본 서비스는 산업안전보건법 제36조에 따른 위험성평가 수립을 보조하는 <strong>'지능형 교육 및 편의 도구'</strong>입니다. 서비스에서 제안하는 유해위험요인 및 감소대책은 표준 지침을 기반으로 한 <strong>참고용 데이터</strong>이며, 현장의 모든 특수 환경을 대변하지 않습니다.</p>

            <h3>제3조 (이용자의 의무와 법적 책임)</h3>
            <p>이용자는 본 서비스가 제공한 추천 데이터를 바탕으로, 반드시 <strong>당사 사업장의 실제 작업 환경과 설비 상태를 반영하여 최종적인 편집 및 검토</strong>를 수행해야 합니다.</p>
            <ul>
              <li>이용자는 생성된 보고서의 무결성을 확인할 책임이 있습니다.</li>
              <li>편집되지 않은 데이터의 사용으로 인해 발생하는 사고나 법적 분쟁에 대해 본 서비스는 일체의 책임을 지지 않습니다.</li>
            </ul>

            <h3>제4조 (지식재산권)</h3>
            <p>서비스 내의 분석 알고리즘, 위험 데이터베이스 및 UI 디자인에 대한 권리는 Smart JSA Bridge와 창작자 yizuno에게 귀속됩니다.</p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '2.5rem 5rem', borderBottom: '1px solid #f0f0f0' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' },
  contentSection: { padding: '160px 0', flex: 1 },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 40px' },
  tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '3px', marginBottom: '24px', display: 'block' },
  heading: { fontSize: '3.5rem', fontWeight: '900', marginBottom: '32px', letterSpacing: '-1.5px', lineHeight: '1.1', wordBreak: 'keep-all' },
  subHeading: { fontSize: '1.4rem', lineHeight: '1.8', color: '#49454f', marginBottom: '80px', wordBreak: 'keep-all' },
  article: { marginBottom: '100px' },
  // 텍스트 블록의 조잡함을 방지하기 위해 여유로운 줄간격(2.0) 적용
  articleP: { fontSize: '1.1rem', lineHeight: '2.0', color: '#444', marginBottom: '32px', wordBreak: 'keep-all' },
  articleH3: { fontSize: '1.6rem', fontWeight: '800', marginTop: '60px', marginBottom: '24px' },
  heroImg: { width: '100%', height: '500px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '24px', marginTop: '60px' },
  footer: { padding: '80px 0', backgroundColor: '#1c1b1f', color: '#888', textAlign: 'center', fontSize: '0.9rem' }
};