import { useNavigate } from 'react-router-dom';
import AdSenseUnit from '../components/AdSenseUnit';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const navigate = useNavigate();
  const { t } = useTranslation('terms');

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
          <span style={styles.tag}>{t('pageTag')}</span>
          <h2 style={styles.heading}>{t('heading')}</h2>
          <p style={styles.subHeading}>{t('subHeading')}</p>
          
          <div style={styles.articleSection}>
            <p style={{...styles.articleP, fontSize: '0.9rem', color: '#888'}}>{t('effectiveDate')}</p>

            <h3 style={styles.articleH3}>{t('section1.title')}</h3>
            <p style={styles.articleP}>{t('section1.content')}</p>

            <h3 style={styles.articleH3}>{t('section2.title')}</h3>
            <p style={styles.articleP} dangerouslySetInnerHTML={{ __html: t('section2.content') }} />

            <h3 style={styles.articleH3}>{t('section3.title')}</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>{t('section3.item1.bold')}</strong> {t('section3.item1.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>{t('section3.item2.bold')}</strong> {t('section3.item2.desc')}</li>
            </ul>

            <h3 style={styles.articleH3}>{t('section4.title')}</h3>
            <p style={styles.articleP}>{t('section4.content')}</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> {t('section4.item1.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> {t('section4.item2.desc')}</li>
            </ul>

            <h3 style={styles.articleH3}>{t('section5.title')}</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>{t('section5.item1.bold')}</strong> {t('section5.item1.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>•</span> <strong>{t('section5.item2.bold')}</strong> {t('section5.item2.desc')}</li>
            </ul>

            <h3 style={styles.articleH3}>{t('section6.title')}</h3>
            <p style={styles.articleP}>{t('section6.content')}</p>

            <h3 style={styles.articleH3}>{t('section7.title')}</h3>
            <p style={styles.articleP}>{t('section7.content')}</p>

            <h3 style={styles.articleH3}>{t('section8.title')}</h3>
            <p style={styles.articleP}>{t('section8.content')}</p>

            <h3 style={styles.articleH3}>{t('section9.title')}</h3>
            <p style={styles.articleP}>{t('section9.content')}</p>
          </div>
        </div>
        {/* 원본 내용 유지 끝 */}
      </section>

      <footer style={styles.footer}><p>{t('footer')}</p></footer>
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