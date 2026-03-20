import { useNavigate } from 'react-router-dom';
import AdSenseUnit from '../components/AdSenseUnit'; // [수정] 광고 컴포넌트 임포트 (Main과 동일)

export default function About() {
  const navigate = useNavigate();

  // [수정] 애드센스 설정 정보 추가 (Main과 동일한 ID 사용)
  const PUBLISHER_ID = 'ca-pub-9791625990220699'; 
  const SIDEBAR_SLOT_ID = '3978298367'; // Main의 MAIN_SIDE_SLOT_ID와 동일

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>
      
      {/* [수정] 광고 배치를 위해 최상위 컨테이너에 relative 속성 부여 */}
      <section style={{...styles.contentSection, position: 'relative'}}>
        
        {/* [수정] 좌측 고정 광고 영역 추가 (LG 해상도 이상에서만 노출) */}
        <aside className="hidden lg:block">
          <div style={styles.adPlaceholderFixedLeft}>
            <span style={styles.adLabelDark}>AD (LEFT)</span>
            <AdSenseUnit 
              client={PUBLISHER_ID} 
              slot={SIDEBAR_SLOT_ID} 
              format="vertical" 
              style={{ width: '160px', height: '600px' }} 
            />
          </div>
        </aside>

        {/* [수정] 우측 고정 광고 영역 추가 (LG 해상도 이상에서만 노출) */}
        <aside className="hidden lg:block">
          <div style={styles.adPlaceholderFixedRight}>
            <span style={styles.adLabelDark}>AD (RIGHT)</span>
            <AdSenseUnit 
              client={PUBLISHER_ID} 
              slot={SIDEBAR_SLOT_ID} 
              format="vertical" 
              style={{ width: '160px', height: '600px' }} 
            />
          </div>
        </aside>

        {/* 원본 내용 절대 유지 시작 */}
        <div style={styles.container}>
          
          <span style={styles.tag}>THE SAFETY REPOSITORY</span>
          <h2 style={styles.heading}>파편화된 안전 지식을<br />라이브러리로 연결하다</h2>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>The Library for Safety Managers</h3>
            <p style={styles.articleP}>
              Smart JSA Bridge는 개별 PC 속에 잠들어 있던 실제 JSA 양식들을 양지로 끌어올려, <strong>안전 관리자들이 서로의 노하우를 라이브러리화하고 공유하는 오픈 소스형 저장소</strong>입니다.
              단순한 서류 작성을 넘어, 전국의 산업 현장에서 검증된 최적의 안전 로직을 누구나 활용하고 개선할 수 있는 기술적 교량이 되고자 합니다.
            </p>

            <h3 style={styles.articleH3}>Core Values / 핵심 가치</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>검증된 실무 데이터 기반:</strong> 추상적인 가이드가 아닌, 현장 전문가들이 직접 작성하고 사용한 실질적인 JSA 템플릿을 기반으로 합니다.
              </li>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>지식의 선순환(Fork & Contribute):</strong> 우수한 JSA 양식을 자신의 현장에 맞춰 수정하여 활용하고, 이를 다시 라이브러리에 기여함으로써 전체 산업 안전 수준을 상향 평준화합니다.
              </li>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>고위험군 특화 라이브러리:</strong> 9대 고위험 작업군을 포함하여 업종별, 설비별로 세분화된 분석 시나리오 저장소를 구축합니다.
              </li>
            </ul>

            <h3 style={styles.articleH3}>How It Works / 서비스 흐름</h3>
            <p style={styles.articleP}>Smart JSA Bridge는 커뮤니티의 힘으로 안전을 지킵니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>1.</span> <strong>Browse Library:</strong> 방대한 저장소에서 현재 필요한 작업 종류에 맞는 JSA 양식을 검색합니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>2.</span> <strong>Adopt & Customize:</strong> 적합한 양식을 선택하여 내 작업 환경의 특성에 맞게 세부 수치를 조정합니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>3.</span> <strong>Export & Share:</strong> 완성된 JSA를 출력하여 현장에 적용하고, 개선된 로직은 다시 커뮤니티에 공유할 수 있습니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>4.</span> <strong>Standardization:</strong> 수많은 피드백을 거친 양식은 해당 업종의 '골든 스탠다드'로 자리 잡습니다.</li>
            </ul>

            <h3 style={styles.articleH3}>Data Security Philosophy</h3>
            <p style={styles.articleP}>
              공유의 가치는 안전한 보안 위에서만 존재할 수 있습니다. 
              Smart JSA Bridge는 <strong>'민감 정보 비저장 원칙'</strong>에 따라 프로젝트명, 실제 성명, 설비 상세 명칭 등 식별 가능한 데이터는 수집하지 않으며, 오직 '작업-위험-대책'으로 이어지는 순수한 기술적 로직만을 라이브러리화합니다.
            </p>
          </div>

          <div style={styles.imgContainer}>
             <div style={{...styles.heroImg, backgroundImage: 'url(/images/image6.jpg)'}} />
             <p style={{...styles.articleP, fontSize: '0.85rem', color: '#888', textAlign: 'center', marginTop: '12px'}}>
               Smart JSA Bridge: 집단 지성으로 완성하는 무재해 현장의 파트너
             </p>
          </div>
        </div>
        {/* 원본 내용 절대 유지 끝 */}
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  // 원본 스타일 유지
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '1.5rem 10%', borderBottom: '1px solid #f2f2f2' },
  logo: { fontSize: '1.1rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', color: '#000', cursor: 'pointer' },
  contentSection: { padding: '80px 0', flex: 1 },
  container: { maxWidth: '750px', margin: '0 auto', padding: '0 32px' },
  tag: { color: '#007bff', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '3px', marginBottom: '16px', display: 'block' },
  heading: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.2', wordBreak: 'keep-all', color: '#000' },
  subHeading: { fontSize: '1.1rem', lineHeight: '1.6', color: '#49454f', marginBottom: '60px', wordBreak: 'keep-all' },
  articleSection: { marginBottom: '60px' },
  articleH3: { fontSize: '1.3rem', fontWeight: '800', marginTop: '40px', marginBottom: '20px', color: '#000' },
  articleP: { fontSize: '1.05rem', lineHeight: '1.8', color: '#444', marginBottom: '24px', wordBreak: 'keep-all' },
  listWrapper: { paddingLeft: '0', marginBottom: '32px', listStyleType: 'none' },
  listItem: { position: 'relative', fontSize: '1rem', lineHeight: '1.8', color: '#444', marginBottom: '12px', wordBreak: 'keep-all', paddingLeft: '24px' },
  listBullet: { position: 'absolute', left: 0, color: '#007bff', fontWeight: 'bold' },
  imgContainer: { marginTop: '40px' },
  heroImg: { width: '100%', height: '350px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px' },
  footer: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#666', textAlign: 'center', fontSize: '0.85rem' },

  // [수정] 광고 가시성 스타일 추가 (About 페이지 블러 처리 해제를 위해 adPlaceholder 스타일을 가시적인 회색 박스로 변경)
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  
  // Main의 adPlaceholderFixedLeft/Right 스타일을 가져와서 적용
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: '20px', // 화면 왼쪽 끝에서 20px 띄움
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: '#f5f5f5', // About 페이지 배경색(흰색)에 맞춘 회색 박스
    border: '1px dashed #ddd', 
    borderRadius: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '10px 0',
    zIndex: 100 // 다른 콘텐츠보다 위에 오도록 설정
  },
  adPlaceholderFixedRight: { 
    position: 'fixed',
    top: '50%',
    right: '20px', // 화면 오른쪽 끝에서 20px 띄움
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    backgroundColor: '#f5f5f5', 
    border: '1px dashed #ddd', 
    borderRadius: '8px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '10px 0',
    zIndex: 100
  }
};