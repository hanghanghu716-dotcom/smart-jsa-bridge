import { useNavigate } from 'react-router-dom';
import AdSenseUnit from '../components/AdSenseUnit';

export default function Terms() {
  const navigate = useNavigate();

  const PUBLISHER_ID = 'ca-pub-9791625990220699'; 
  const SIDEBAR_SLOT_ID = '3978298367'; 

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>
      
      <section style={{...styles.contentSection, position: 'relative'}}>
        
        {/* [좌측 광고]: Main.jsx의 Fixed 가동방식 적용 + 위치 조정 */}
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

        {/* [우측 광고]: Main.jsx의 Fixed 가동방식 적용 + 위치 조정 */}
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
          <span style={styles.tag}>TERMS OF SERVICE (GLOBAL REPOSITORY)</span>
          <h2 style={styles.heading}>서비스 이용약관</h2>
          <p style={styles.subHeading}>Smart JSA Bridge는 전 세계 안전 관리자들이 실무 지식을 공유하고 발전시키는 협력형 플랫폼입니다.</p>
          
          <div style={styles.articleSection}>
            <p style={{...styles.articleP, fontSize: '0.9rem', color: '#888'}}>Effective Date: March 19, 2026</p>

            <h3 style={styles.articleH3}>01. Acceptance of Terms / 약관의 동의</h3>
            <p style={styles.articleP}>이용자는 Smart JSA Bridge 계정을 생성함으로써 본 약관 및 커뮤니티 가이드라인에 동의한 것으로 간주됩니다. 본 서비스는 안전 지식의 공유와 상호 발전을 목적으로 합니다.</p>

            <h3 style={styles.articleH3}>02. Service Description / 서비스의 정의</h3>
            <p style={styles.articleP}>본 서비스는 산업 안전 관리자들이 JSA(작업안전분석) 양식을 라이브러리화하여 저장, 공유, 수정 및 활용할 수 있는 <strong>안전 지식 리포지토리(Repository)</strong>를 제공합니다.</p>

            <h3 style={styles.articleH3}>03. User Responsibility / 이용자의 의무</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>Account Security:</strong> Supabase를 통해 관리되는 계정 정보의 보안 책임은 이용자에게 있습니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>Data Cleansing:</strong> 라이브러리에 JSA를 공유(Public)할 경우, 특정 현장명, 설비명, 개인 성명 등 보안 식별 정보를 반드시 제거해야 합니다.</li>
            </ul>

            <h3 style={styles.articleH3}>04. Content Accuracy Disclaimer / 공유 콘텐츠 면책</h3>
            <p style={styles.articleP}>라이브러리에 등록된 모든 JSA 양식은 이용자들이 자발적으로 기여한 정보입니다.</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 플랫폼은 공유된 콘텐츠의 절대적 정확성이나 현장 적합성을 보증하지 않습니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> 이용자는 타인의 양식을 활용할 때 반드시 자신의 현장 상황에 맞춰 재검토 및 최종 편집을 수행해야 하며, 이를 게을리하여 발생한 사고에 대해 플랫폼은 책임을 지지 않습니다.</li>
            </ul>

            <h3 style={styles.articleH3}>05. License & Intellectual Property / 저작권 및 라이선스</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>Platform Rights:</strong> 서비스의 아키텍처, UI 및 로직 데이터베이스에 대한 권리는 회사에 귀속됩니다.</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>Shared Content:</strong> 이용자가 '공개(Public)'로 설정하여 기여한 콘텐츠에 대해, 다른 이용자에게 해당 콘텐츠를 복제, 수정 및 활용할 수 있는 비독점적 라이선스를 부여하는 것으로 간주합니다.</li>
            </ul>

            <h3 style={styles.articleH3}>06. Prohibited Use / 금지 행위</h3>
            <p style={styles.articleP}>타인의 지식 기여물을 대량으로 크롤링하여 별도의 유료 서비스를 구축하거나, 안전 목적 외의 용도로 악용하는 행위는 엄격히 금지됩니다.</p>

            <h3 style={styles.articleH3}>07. Global Compliance / 글로벌 준수</h3>
            <p style={styles.articleP}>본 서비스는 다양한 국가의 이용자가 참여하므로, 각국의 산업안전보건법령을 존중합니다. 이용자는 자신의 국가 법령에 위배되는 콘텐츠를 게시해서는 안 됩니다.</p>

            <h3 style={styles.articleH3}>08. Termination of Access / 서비스 이용 제한</h3>
            <p style={styles.articleP}>부적절한 데이터 게시나 커뮤니티 규정 위반 시, 플랫폼은 사전 고지 없이 해당 콘텐츠를 삭제하거나 계정 이용을 제한할 수 있습니다.</p>

            <h3 style={styles.articleH3}>09. Governing Law / 준거법</h3>
            <p style={styles.articleP}>본 약관은 대한민국 법령을 준거법으로 하며, 국제적 관례에 따른 분쟁 해결 절차를 준수합니다.</p>
          </div>
        </div>
        {/* 원본 내용 유지 끝 */}
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
  /* 원본 스타일 유지 */
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
  footer: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#666', textAlign: 'center', fontSize: '0.85rem' },

  /* 핵심 지침 이행: Main.jsx의 Fixed 방식 유지 + Privacy의 좁은 간격 적용 */
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 375px - 160px - 20px)', // (본문 절반 375px) + (광고폭 160px) + (간격 20px)
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
  },
  adPlaceholderFixedRight: { 
    position: 'fixed',
    top: '50%',
    right: 'calc(50% - 375px - 160px - 20px)', // (본문 절반 375px) + (광고폭 160px) + (간격 20px)
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