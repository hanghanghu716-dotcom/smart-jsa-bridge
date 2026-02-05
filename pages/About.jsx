import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>ABOUT US</span>
          <h2 style={styles.heading}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
          
          <div style={styles.articleSection}>
            <p style={styles.articleP}>Smart JSA Bridge는 관리자가 단순 서류 작업의 부담을 덜고, <strong>본질적인 현장 위험 발굴에만 집중할 수 있는 기술적 교량</strong>이 되고자 합니다.</p>
            <p style={styles.articleP}>9대 고위험 작업군을 비롯한 수많은 분석 시나리오를 바탕으로 지능형 위험 식별 환경을 제공하여, 무재해 현장을 향한 가장 빠른 경로를 제시합니다.</p>
          </div>

          <div style={styles.imgContainer}>
             <div style={{...styles.heroImg, backgroundImage: 'url(/images/image6.jpg)'}} />
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