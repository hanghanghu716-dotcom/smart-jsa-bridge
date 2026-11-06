import RegionalGuidancePage from '../components/RegionalGuidancePage';
import PlanOverview from '../components/PlanOverview';
import OperatorProfile from '../components/OperatorProfile';
import {getPlansUi} from '../locales/plansUi';
import { useFixedGuidance } from '../hooks/useFixedGuidance';
import UsGuidanceReferences from '../components/UsGuidanceReferences';
import SEO from '../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트 임포트
import PublicSiteHeader from '../components/PublicSiteHeader';
import CommunityFooter from '../components/CommunityFooter'; // ✅ 커스텀 다국어 라우팅 훅[cite: 19]

export default function About() {
  const { t, i18n, guidance, regional } = useFixedGuidance('about');
  const Heading = guidance ? 'h1' : 'h2';

  if (regional) return <RegionalGuidancePage guidance={regional}/>;
  return (
    <div style={styles.wrapper}>
      <SEO pageTitle={guidance?.title} pageDescription={guidance?.description} />

      {/* HEADER[cite: 19] */}
      <PublicSiteHeader />

      <section style={styles.contentSection} className="max-lg:!py-10">
        <div style={{ ...styles.container, position: 'relative' }}>

          {/* 다국어 처리 반영 영역[cite: 19] */}
          <span style={styles.tag}>{t('pageTag')}</span>
          <Heading style={styles.heading} className="max-lg:!text-[2rem]">
            {t('mainHeading.line1')}<br />{t('mainHeading.line2')}
          </Heading>

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
             <p style={{...styles.articleP, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px'}}>
               {t('imageCaption')}
             </p>
          </div>
        </div>
      </section>

      <UsGuidanceReferences guidance={guidance} />
      <section className="jsa-workspace" style={{padding:"32px 24px"}}><div style={{maxWidth:1100,margin:"auto"}}><h2>{getPlansUi(i18n.language).title}</h2><p>{getPlansUi(i18n.language).intro}</p><PlanOverview/></div></section>
      <div className="about-operator-footer"><OperatorProfile locale={i18n.language} collapsed/></div>
      <CommunityFooter />
    </div>
  );
}

// 스타일 객체는 기존 소스코드와 동일하게 유지합니다.[cite: 19]
const styles = {
  wrapper: { backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { padding: '1.5rem 10%', borderBottom: '1px solid var(--border-default)' },
  logo: { fontSize: '1.1rem', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-primary)', cursor: 'pointer' },
  contentSection: { padding: '80px 0', flex: 1 },
  container: { maxWidth: '750px', margin: '0 auto', padding: '0 32px' },
  tag: { color: 'var(--accent)', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '3px', marginBottom: '16px', display: 'block' },
  heading: { fontSize: '2.5rem', fontWeight: '900', marginBottom: '24px', letterSpacing: '-1.5px', lineHeight: '1.2', wordBreak: 'keep-all', color: 'var(--text-primary)' },
  subHeading: { fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '60px', wordBreak: 'keep-all' },
  articleSection: { marginBottom: '60px' },
  articleH3: { fontSize: '1.3rem', fontWeight: '800', marginTop: '40px', marginBottom: '20px', color: 'var(--text-primary)' },
  articleP: { fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '24px', wordBreak: 'keep-all' },
  listWrapper: { paddingLeft: '0', marginBottom: '32px', listStyleType: 'none' },
  listItem: { position: 'relative', fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '12px', wordBreak: 'keep-all', paddingLeft: '24px' },
  listBullet: { position: 'absolute', left: 0, color: 'var(--accent)', fontWeight: 'bold' },
  imgContainer: { marginTop: '40px' },
  heroImg: { width: '100%', height: '350px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px' },
  footer: { padding: '60px 0', backgroundColor: 'var(--panel-bg)', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' },

};
