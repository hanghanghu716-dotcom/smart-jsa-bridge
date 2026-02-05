import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>PRIVACY POLICY</span>
          <h2 style={styles.heading}>개인정보처리방침</h2>
          <p style={styles.subHeading}>사용자의 비즈니스 보안을 최우선으로 하며, 식별 가능한 데이터는 수집하지 않습니다.</p>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>01. 데이터 보안 및 미수집 원칙</h3>
            <p style={styles.articleP}>본 서비스는 사용자가 입력하는 <strong>프로젝트명, 개인 성명, 구체적인 설비 명칭 등 사업장 보안과 직결된 데이터는 일절 수집하거나 저장하지 않습니다.</strong> 모든 분석 데이터는 브라우저 세션 종료 시 휘발됩니다.</p>

            <h3 style={styles.articleH3}>02. 분석 로직 수집 및 거부권</h3>
            <p style={styles.articleP}>서비스 고도화를 위해 오직 다음의 익명화된 로직 데이터만을 수집합니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>수집 항목:</strong> 작업 절차(Procedure)에 대응하는 유해위험요인/대책의 편집 매칭 결과</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>이용 목적:</strong> 지능형 추천 알고리즘의 정확도 개선 및 학습</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>거부 방법:</strong> 사용자는 언제든지 해당 데이터 수집을 비희망할 권리가 있으며, 거부 시 수집은 중단됩니다.</li>
            </ul>

            <h3 style={styles.articleH3}>03. 구글 애드센스 고지</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 구글을 포함한 제3자 제공업체는 쿠키를 사용하여 사용자의 방문 기록을 바탕으로 광고를 게재합니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 사용자는 구글의 '광고 설정'을 통해 맞춤형 광고 게재를 제어할 수 있습니다.</li>
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