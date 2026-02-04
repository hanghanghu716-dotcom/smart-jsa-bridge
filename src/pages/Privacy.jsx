import { Link, useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}><h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1></header>
      
      <section style={styles.contentSection}>
        <div style={styles.container}>
          <span style={styles.tag}>PRIVACY POLICY</span>
          <h2 style={styles.heading}>개인정보처리방침</h2>
          <p style={styles.subHeading}>Smart JSA Bridge는 사용자의 데이터를 존중하며, 최상의 보안 표준을 준수하여 안전한 분석 환경을 제공합니다.</p>
          
          <div style={styles.article}>
            <h3>01. 데이터 수집 항목 및 방법</h3>
            <p>본 서비스는 원활한 위험성평가 보고서 생성을 위해 다음과 같은 최소한의 정보를 수집합니다.</p>
            <ul>
              <li><strong>프로젝트 데이터:</strong> 프로젝트명, 작업 위치, 수행 부서, 현장 책임자 성명 등</li>
              <li><strong>참여자 데이터:</strong> 평가 참여자 명단 (보고서 내 서명용 성명 정보)</li>
              <li><strong>기술 데이터:</strong> 접속 IP, 브라우저 유형, 쿠키 정보를 통한 서비스 이용 기록</li>
            </ul>

            <h3>02. 정보의 이용 목적</h3>
            <p>수집된 정보는 다음의 목적 이외의 용도로는 사용되지 않습니다.</p>
            <ul>
              <li>표준 JSA(작업안전분석) 워크시트 및 PDF 리포트 생성 보조</li>
              <li>작업 유형별 유해위험요인 지능형 추천 알고리즘 고도화</li>
              <li>사용자 경험 개선을 위한 통계 분석 및 서비스 최적화</li>
            </ul>

            <h3>03. 데이터 처리 및 보안</h3>
            <p>사용자가 입력한 프로젝트 정보와 작업 상세 내용은 브라우저 세션 내에서 안전하게 처리되며, 리포트 생성 즉시 암호화 기술을 통해 관리됩니다. 본 서비스는 사용자의 명시적인 동의 없이 데이터를 제3자에게 판매하거나 마케팅 용도로 공유하지 않습니다.</p>

            <h3>04. 이용자의 권리 및 의무</h3>
            <p>이용자는 언제든지 자신의 데이터를 수정하거나 삭제할 수 있는 권리가 있습니다. 단, 생성된 보고서 내의 정보 정확성에 대한 책임은 입력 주체인 이용자에게 있습니다.</p>
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
// 스타일 정의는 하단에 통합 기재