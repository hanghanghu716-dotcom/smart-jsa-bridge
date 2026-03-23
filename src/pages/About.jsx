import { useNavigate } from 'react-router-dom';
import AdSenseUnit from '../components/AdSenseUnit';
import { useTranslation } from 'react-i18next';

export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

  // 애드센스 설정 정보
  const PUBLISHER_ID = 'ca-pub-9791625990220699'; 
  const LEFT_SIDEBAR_SLOT_ID = '3978298367'; 
  const RIGHT_SIDEBAR_SLOT_ID = '3978298367';
  
  // [기능 추가]: 모바일 전용 광고 슬롯 ID
  const MOBILE_IN_FEED_SLOT_ID = '이곳에_모바일_중간_광고_슬롯ID_입력';

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header} className="max-lg:!px-6">
        <div style={styles.container} className="flex justify-between items-center h-full w-full">
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>
      
      <section style={styles.contentSection} className="max-lg:!py-10">
        <div style={{ ...styles.container, position: 'relative' }}>
          
          {/* [데스크탑 전용]: 왼쪽 사이드바 광고 (Main.jsx Fixed 방식 + Privacy 위치 20px) */}
          <aside className="max-lg:hidden" style={styles.adSlotFixedLeft}>
            <div style={styles.adPlaceholderBox}>
              <span style={styles.adLabel}>AD (LEFT)</span>
              <AdSenseUnit 
                client={PUBLISHER_ID} 
                slot={LEFT_SIDEBAR_SLOT_ID} 
                format="vertical" 
                style={{ width: '160px', height: '600px' }} 
              />
            </div>
          </aside>

          {/* [데스크탑 전용]: 오른쪽 사이드바 광고 (Main.jsx Fixed 방식 + Privacy 위치 20px) */}
          <aside className="max-lg:hidden" style={styles.adSlotFixedRight}>
            <div style={styles.adPlaceholderBox}>
              <span style={styles.adLabel}>AD (RIGHT)</span>
              <AdSenseUnit 
                client={PUBLISHER_ID} 
                slot={RIGHT_SIDEBAR_SLOT_ID} 
                format="vertical" 
                style={{ width: '160px', height: '600px' }} 
              />
            </div>
          </aside>

          {/* 다국어 처리 반영 시작 */}
          <span style={styles.tag}>{t('pageTag')}</span>
          <h2 style={styles.heading} className="max-lg:!text-[2rem]">{t('mainHeading.line1')}<br />{t('mainHeading.line2')}</h2>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>{t('section1.title')}</h3>
            <p style={styles.articleP} dangerouslySetInnerHTML={{ __html: t('section1.content') }} />

            <h3 style={styles.articleH3}>{t('section2.title')}</h3>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>{t('section2.item1.bold')}</strong> {t('section2.item1.desc')}
              </li>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>{t('section2.item2.bold')}</strong> {t('section2.item2.desc')}
              </li>
              <li style={styles.listItem}>
                <span style={styles.listBullet}>•</span> 
                <strong>{t('section2.item3.bold')}</strong> {t('section2.item3.desc')}
              </li>
            </ul>

            {/* [기능 유지]: 모바일 전용 중간 광고 영역 */}
            <div className="lg:hidden" style={styles.mobileAdWrapper}>
               <div style={styles.mobileAdPlaceholder}>
                  <span style={styles.adLabel}>MOBILE AD (IN-FEED)</span>
                  <AdSenseUnit 
                    client={PUBLISHER_ID} 
                    slot={MOBILE_IN_FEED_SLOT_ID} 
                    format="fluid" 
                    style={{ display: 'block' }} 
                  />
               </div>
            </div>

            <h3 style={styles.articleH3}>{t('section3.title')}</h3>
            <p style={styles.articleP}>{t('section3.subtitle')}</p>
            <ul style={styles.listWrapper}>
              <li style={styles.listItem}><span style={styles.listBullet}>1.</span> <strong>{t('section3.step1.bold')}</strong> {t('section3.step1.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>2.</span> <strong>{t('section3.step2.bold')}</strong> {t('section3.step2.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>3.</span> <strong>{t('section3.step3.bold')}</strong> {t('section3.step3.desc')}</li>
              <li style={styles.listItem}><span style={styles.listBullet}>4.</span> <strong>{t('section3.step4.bold')}</strong> {t('section3.step4.desc')}</li>
            </ul>

            <h3 style={styles.articleH3}>{t('section4.title')}</h3>
            <p style={styles.articleP} dangerouslySetInnerHTML={{ __html: t('section4.content') }} />
          </div>

          <div style={styles.imgContainer}>
             <div style={{...styles.heroImg, backgroundImage: 'url(/images/image6.jpg)'}} />
             <p style={{...styles.articleP, fontSize: '0.85rem', color: '#888', textAlign: 'center', marginTop: '12px'}}>
               {t('imageCaption')}
             </p>
          </div>
          {/* 다국어 처리 반영 끝 */}
        </div>
      </section>

      <footer style={styles.footer}><p>© 2026 Smart JSA Bridge. All rights reserved.</p></footer>
    </div>
  );
}

const styles = {
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

  adPlaceholderBox: { width: '160px', minHeight: '600px', backgroundColor: '#f5f5f5', border: '1px dashed #ddd', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' },
  adLabel: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },

  mobileAdWrapper: { margin: '40px 0', width: '100%' },
  mobileAdPlaceholder: { width: '100%', minHeight: '250px', backgroundColor: '#f9f9f9', border: '1px dashed #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' },

  adSlotFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 375px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    zIndex: 100
  },
  adSlotFixedRight: { 
    position: 'fixed',
    top: '50%',
    right: 'calc(50% - 375px - 160px - 20px)', 
    transform: 'translateY(-50%)',
    width: '160px', 
    minHeight: '600px', 
    zIndex: 100
  }
};