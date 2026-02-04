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
          <p style={styles.subHeading}>Smart JSA Bridge는 사용자의 비즈니스 보안을 최우선으로 하며, 필요한 최소한의 데이터만을 투명하게 처리합니다.</p>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>01. 수집하는 데이터의 범위 및 목적</h3>
            <p style={styles.articleP}>본 서비스는 사용자의 프로젝트명, 개인 성명, 구체적인 설비 명칭 등 <strong>사업장 보안 및 개인 식별과 직결되는 데이터는 일절 서버에 수집하거나 저장하지 않습니다.</strong></p>
            <p style={styles.articleP}>오직 서비스의 지능형 추천 알고리즘 고도화를 위해 다음의 정보만을 수집합니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>분석 로직 데이터:</strong> 입력된 작업 절차(Procedure)에 대해 위험 요인과 대책이 어떻게 편집(Analysis)되었는지에 대한 논리적 매칭 데이터</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>수집 목적:</strong> 유사 작업에 대한 더 정확한 안전 대책 추천 엔진 학습</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>사용자 제어권:</strong> 이용자는 설정 메뉴를 통해 해당 로직 데이터의 수집 여부를 언제든지 거부(Opt-out)할 수 있습니다.</li>
            </ul>

            <h3 style={styles.articleH3}>02. 구글 애드센스 및 제3자 쿠키 고지</h3>
            <p style={styles.articleP}>본 서비스는 구글(Google)에서 제공하는 광고 서비스인 '애드센스'를 이용합니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 구글을 포함한 제3자 제공업체는 쿠키를 사용하여 사용자의 이전 방문 기록을 바탕으로 광고를 게재합니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 사용자는 구글의 '광고 설정' 페이지를 방문하여 맞춤형 광고 게재를 중단할 수 있습니다.</li>
            </ul>

            <h3 style={styles.articleH3}>03. 데이터의 보유 및 보안 조치</h3>
            <p style={styles.articleP}>수집된 분석 로직 데이터는 식별 불가능한 형태로 암호화되어 관리되며, 서비스 개선 목적이 달성된 후 즉시 파기됩니다. 브라우저 세션 내에서 처리되는 임시 프로젝트 데이터는 리포트 생성 종료 시 서버에 남지 않고 소멸됩니다.</p>

            <h3 style={styles.articleH3}>04. 개인정보 보호책임자</h3>
            <p style={styles.articleP}>문의사항이 있으신 경우 다음의 담당자에게 연락해 주시기 바랍니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>담당자:</strong> yizuno</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>이메일:</strong> yizuno9@naver.com</li>
            </ul>
          </div>
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

// 스타일은 하단 공통 정의 참고
const styles = {
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '3rem 10%', borderBottom: '1px solid #f2f2f2' },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', color: '#000', cursor: 'pointer' },
  
  contentSection: { padding: '160px 0', flex: 1 },
  container: { maxWidth: '850px', margin: '0 auto', padding: '0 40px' },

  tag: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '32px', display: 'block' },
  heading: { fontSize: '4.5rem', fontWeight: '900', marginBottom: '40px', letterSpacing: '-3px', lineHeight: '1.05', wordBreak: 'keep-all', color: '#000' },
  subHeading: { fontSize: '1.5rem', lineHeight: '1.8', color: '#49454f', marginBottom: '100px', fontWeight: '300', wordBreak: 'keep-all' },

  articleSection: { marginBottom: '120px' },
  articleH3: { fontSize: '1.8rem', fontWeight: '800', marginTop: '80px', marginBottom: '32px', color: '#000', letterSpacing: '-0.5px' },
  articleP: { fontSize: '1.15rem', lineHeight: '2.1', color: '#444', marginBottom: '32px', wordBreak: 'keep-all' },
  
  /* [수정 핵심] 리스트 여백을 넓혀 오밀조밀함을 해결 */
  listWrapper: { paddingLeft: '0', marginBottom: '48px', listStyleType: 'none' },
  listItem: { 
    position: 'relative',
    fontSize: '1.1rem', 
    lineHeight: '2.0', 
    color: '#444', 
    marginBottom: '28px', // 항목 간 간격 확장
    wordBreak: 'keep-all',
    paddingLeft: '28px'
  },
  listBullet: { position: 'absolute', left: 0, color: '#007bff', fontWeight: 'bold' },

  heroImgContainer: { marginTop: '80px' },
  heroImg: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '32px', boxShadow: '0 40px 80px rgba(0,0,0,0.05)' },

  footer: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#777', textAlign: 'center', fontSize: '0.9rem', letterSpacing: '1px' }
};