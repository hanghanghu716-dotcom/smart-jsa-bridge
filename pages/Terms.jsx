import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>TERMS OF SERVICE</span>
          <h2 style={styles.heading}>서비스 이용약관</h2>
          <p style={styles.subHeading}>Smart JSA Bridge의 이용 원칙과 법적 책임 범위를 간결하게 안내합니다.</p>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>제1조 (목적 및 정체성)</h3>
            <p style={styles.articleP}>본 서비스는 위험성평가 수립의 효율을 높이는 <strong>지능형 교육 보조 도구</strong>입니다. 제공되는 데이터는 표준 지침 기반의 참고 자료입니다.</p>

            <h3 style={styles.articleH3}>제2조 (사용자 편집 및 최종 책임)</h3>
            <p style={styles.articleP}>이용자는 시스템의 추천 데이터를 바탕으로 반드시 <strong>현장의 실제 환경을 반영하여 최종 편집 및 검토</strong>를 수행해야 합니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 보고서의 현장 적합성에 대한 최종 책임은 사용자에게 있습니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 편집되지 않은 결과물로 발생하는 사고에 대해 본 서비스는 일체 면책됩니다.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  /* 레이아웃: 여백 압축 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '1.5rem 10%', borderBottom: '1px solid #f2f2f2' },
  logo: { fontSize: '1.1rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', color: '#000', cursor: 'pointer' },
  
  /* 콘텐츠 섹션: 상하 패딩을 80px로 대폭 축소 (기존 160px) */
  contentSection: { padding: '80px 0', flex: 1 },
  container: { maxWidth: '750px', margin: '0 auto', padding: '0 32px' },

  /* 타이포그래피: 크기 축소 및 가독성 유지 */
  tag: { color: '#007bff', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '3px', marginBottom: '16px', display: 'block' },
  heading: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.2', wordBreak: 'keep-all', color: '#000' },
  subHeading: { fontSize: '1.1rem', lineHeight: '1.6', color: '#49454f', marginBottom: '60px', wordBreak: 'keep-all' },

  /* 본문 영역: 오밀조밀함을 방지하는 최적 간격 */
  articleSection: { marginBottom: '60px' },
  articleH3: { fontSize: '1.3rem', fontWeight: '800', marginTop: '40px', marginBottom: '20px', color: '#000' },
  articleP: { fontSize: '1.05rem', lineHeight: '1.8', color: '#444', marginBottom: '24px', wordBreak: 'keep-all' },
  
  /* 리스트: 수직 간격을 12px로 정돈 (기존 28px) */
  listWrapper: { paddingLeft: '0', marginBottom: '32px', listStyleType: 'none' },
  listItem: { 
    position: 'relative',
    fontSize: '1rem', 
    lineHeight: '1.8', 
    color: '#444', 
    marginBottom: '12px', 
    wordBreak: 'keep-all',
    paddingLeft: '24px'
  },
  listBullet: { position: 'absolute', left: 0, color: '#007bff', fontWeight: 'bold' },

  /* 시각 요소: 이미지 크기 축소 */
  imgContainer: { marginTop: '40px' },
  heroImg: { width: '100%', height: '350px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px' },

  footer: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#666', textAlign: 'center', fontSize: '0.85rem' }
};