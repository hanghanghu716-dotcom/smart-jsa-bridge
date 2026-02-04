import { Link, useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>ABOUT US</span>
          <h2 style={styles.heading}>데이터로 잇는 안전,<br />사람을 지키는 기술</h2>
          <p style={styles.subHeading}>Smart JSA Bridge는 현장의 경험과 지능형 데이터를 연결하여 무재해 사업장의 미래를 설계합니다.</p>
          
          <div style={styles.article}>
            <h3>Bridging the Safety Gap</h3>
            <p>산업 현장의 안전은 단순한 기록이 아닌, 치열한 분석과 예방에서 시작됩니다. Smart JSA Bridge는 관리자가 행정적인 번거로움에서 벗어나, <strong>본질적인 위험을 발굴하고 제거하는 데 집중할 수 있도록 돕는 기술적 교량(Bridge)</strong>이 되고자 합니다.</p>

            <h3>Core Intelligence</h3>
            <p>우리는 화기, 고소, 밀폐 등 고위험 공정의 수많은 시나리오를 분석하여 유의미한 안전 지표를 제공합니다. 지능형 검색 엔진은 사용자가 입력한 단 한 줄의 작업 내용에서도 숨겨진 위험의 실마리를 찾아내며, 이를 통해 현장의 안전 사각지대를 최소화합니다.</p>

            <h3>Safety Partnership</h3>
            <p>기술은 사람을 보조할 때 가장 큰 가치를 갖습니다. Smart JSA Bridge는 단순한 자동화 툴이 아닌, 관리자의 전문적인 판단을 지원하는 <strong>지능형 파트너</strong>로서 안전 문화를 선도하겠습니다.</p>
          </div>

          <div style={styles.imageSection}>
             <div style={{...styles.heroImg, backgroundImage: 'url(/images/image6.jpg)'}} />
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