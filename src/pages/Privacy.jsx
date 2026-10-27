import { getSiteUi } from '../locales/siteUi.js';
import { getAnalyticsText } from '../locales/analyticsText.js';
import AnalyticsSettings from '../components/AnalyticsSettings';
import CommunityFooter from '../components/CommunityFooter';
import '../styles/community.css';
import { useTranslation } from 'react-i18next';
import PublicSiteHeader from '../components/PublicSiteHeader';
import OperatorContact from '../components/OperatorContact';
import { supportChannelText } from '../locales/supportChannelText';
import { feedbackUi } from '../locales/feedbackUi.js';
import SEO from '../components/SEO'; // ✅ 글로벌 SEO 컴포넌트 임포트
// ✅ 커스텀 다국어 라우팅 훅 임포트[cite: 12]

export default function Privacy() {
  const { t, i18n } = useTranslation('privacy');
  const ui = getSiteUi(i18n.language); // ✅ 'privacy' 네임스페이스 로드[cite: 12]

  

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ 페이지별 hreflang 태그 자동 삽입 및 SEO 최적화 수행 */}

      {/* HEADER[cite: 12] */}
      <PublicSiteHeader/>
      
      <section style={styles.contentSection} className="max-lg:!py-10">
        <div style={{ ...styles.container, position: 'relative' }}>
          


          {/* 다국어 처리 반영 영역[cite: 12] */}
          <span style={styles.tag}>{t('pageTag')}</span>
          <h1 style={styles.heading} className="max-lg:!text-[2rem]">
            {t('heading.line1')}<br />{t('heading.line2')}
          </h1>
          
          <div style={styles.articleSection}>
            <h3 style={styles.articleH3}>{getAnalyticsText(i18n.language).title}</h3>
            <p style={styles.articleP}>{getAnalyticsText(i18n.language).body}</p>
            <p style={styles.articleP}>{getAnalyticsText(i18n.language).detail}</p>
            <AnalyticsSettings />
            <h3 style={styles.articleH3}>{feedbackUi(i18n.language).launcher}</h3>
            <p style={styles.articleP}>{feedbackUi(i18n.language).privacyNotice}</p>
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

            <h3 style={styles.articleH3}>{t('section3.title')}</h3>
            <p style={styles.articleP}>{t('section3.subtitle')}</p>


            <h3 style={styles.articleH3}>{t('section4.title')}</h3>
            <p style={styles.articleP}>{getAnalyticsText(i18n.language).body} {supportChannelText(i18n.language).metrics}</p>
            <ul style={styles.listWrapper}>
              <li><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">{ui.googlePrivacy}</a></li>
              <li><a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">{ui.adSettings}</a></li>
            </ul>
          </div>

          <OperatorContact locale={i18n.language}/>
          <div style={styles.imgContainer}>
             <div style={{...styles.heroImg, backgroundImage: 'url(/images/image6.jpg)'}} />
             <p style={{...styles.articleP, fontSize: '0.85rem', color: '#888', textAlign: 'center', marginTop: '12px'}}>
               {t('imageCaption')}
             </p>
          </div>
        </div>
      </section><CommunityFooter/>


    </div>
  );
}

// 스타일 객체는 기존 소스코드의 레이아웃을 정확히 유지합니다[cite: 12].
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
