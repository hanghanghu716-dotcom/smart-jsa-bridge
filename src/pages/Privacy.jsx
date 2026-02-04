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
          <p style={styles.subHeading}>사용자의 데이터를 존중하며, 최상의 보안 표준을 준수하여 안전한 분석 환경을 제공합니다.</p>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>01. 데이터 수집 항목 및 방법</h3>
            <p style={styles.articleP}>본 서비스는 원활한 위험성평가 보고서 생성을 위해 다음과 같은 최소한의 정보를 수집합니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>프로젝트 데이터:</strong> 프로젝트명, 작업 위치, 수행 부서 등</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>참여자 데이터:</strong> 평가 참여자 명단 (보고서 내 서명용 성명 정보)</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>기술 데이터:</strong> 접속 IP, 브라우저 유형, 쿠키 정보를 통한 서비스 이용 기록</li>
            </ul>

            <h3 style={styles.articleH3}>02. 정보의 이용 목적</h3>
            <p style={styles.articleP}>수집된 정보는 다음의 목적 이외의 용도로는 사용되지 않습니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 표준 JSA 워크시트 및 PDF 리포트 생성 보조</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 작업 유형별 유해위험요인 지능형 추천 알고리즘 고도화</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 사용자 경험 개선을 위한 통계 분석 및 서비스 최적화</li>
            </ul>

            <h3 style={styles.articleH3}>03. 데이터 처리 및 보안</h3>
            <p style={styles.articleP}>사용자가 입력한 프로젝트 정보와 작업 상세 내용은 브라우저 세션 내에서 안전하게 처리되며, 리포트 생성 즉시 암호화 기술을 통해 관리됩니다. 본 서비스는 사용자의 명시적인 동의 없이 데이터를 제3자에게 판매하거나 마케팅 용도로 공유하지 않습니다.</p>

            <h3 style={styles.articleH3}>04. 이용자의 권리 및 의무</h3>
            <p style={styles.articleP}>이용자는 언제든지 자신의 데이터를 수정하거나 삭제할 수 있는 권리가 있습니다. 단, 생성된 보고서 내의 정보 정확성에 대한 책임은 입력 주체인 이용자에게 있습니다.</p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  /* 레이아웃 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '3rem 10%', borderBottom: '1px solid #f2f2f2' },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', color: '#000', cursor: 'pointer' },
  
  /* 콘텐츠 섹션 (수직 공간 대폭 확보) */
  contentSection: { padding: '160px 0', flex: 1 },
  container: { maxWidth: '850px', margin: '0 auto', padding: '0 40px' },

  /* 타이포그래피 (NEOM 스타일 볼드 & 라지 폰트) */
  tag: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '32px', display: 'block' },
  heading: { fontSize: '4.5rem', fontWeight: '900', marginBottom: '40px', letterSpacing: '-3px', lineHeight: '1.05', wordBreak: 'keep-all', color: '#000' },
  subHeading: { fontSize: '1.5rem', lineHeight: '1.8', color: '#49454f', marginBottom: '100px', fontWeight: '300', wordBreak: 'keep-all' },

  /* 아티클 본문 (조잡함을 제거하는 여백 설계) */
  articleSection: { marginBottom: '120px' },
  articleH3: { fontSize: '1.8rem', fontWeight: '800', marginTop: '80px', marginBottom: '32px', color: '#000', letterSpacing: '-0.5px' },
  articleP: { fontSize: '1.15rem', lineHeight: '2.1', color: '#444', marginBottom: '32px', wordBreak: 'keep-all' },
  
  /* 리스트 스타일 (불렛 간 간격 대폭 확장) */
  listWrapper: { paddingLeft: '0', marginBottom: '48px', listStyleType: 'none' },
  listItem: { 
    position: 'relative',
    fontSize: '1.1rem', 
    lineHeight: '2.0', 
    color: '#444', 
    marginBottom: '24px', 
    wordBreak: 'keep-all',
    paddingLeft: '28px'
  },
  listBullet: { position: 'absolute', left: 0, color: '#007bff', fontWeight: 'bold' },

  /* 시각 요소 */
  heroImgContainer: { marginTop: '80px' },
  heroImg: { width: '100%', height: '550px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '32px', boxShadow: '0 40px 80px rgba(0,0,0,0.05)' },

  /* 푸터 */
  footer: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#777', textAlign: 'center', fontSize: '0.9rem', letterSpacing: '1px' }
};