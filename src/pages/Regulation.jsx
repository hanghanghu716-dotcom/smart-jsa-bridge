import { useNavigate } from 'react-router-dom';
import AdBanner from '../AdBanner';
import { useTranslation } from 'react-i18next';

export default function Regulation() {
  const navigate = useNavigate();
  const { t } = useTranslation('regulation');

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={styles.heroSection}>
        <div style={styles.container}>
          <span style={styles.m3Tag}>{t('hero.tag')}</span>
          <h2 style={styles.mainTitle} dangerouslySetInnerHTML={{ __html: t('hero.mainTitle') }} />
          <p style={styles.subTitle} dangerouslySetInnerHTML={{ __html: t('hero.subTitle') }} />
        </div>
      </section>

      {/* [스티키 광고]: Main.jsx 및 Terms.jsx의 Fixed 가동방식 적용 + 위치 조정 */}
      {/* [좌측 광고] */}
      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedLeft}>
          <span style={styles.adLabelDark}>AD (LEFT)</span>
          <AdBanner 
            slot="3978298367" 
            style={{ width: '160px', height: '600px' }} 
            format="vertical" 
          />
        </div>
      </aside>

      {/* [우측 광고] */}
      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedRight}>
          <span style={styles.adLabelDark}>AD (RIGHT)</span>
          <AdBanner 
            slot="3978298367" 
            style={{ width: '160px', height: '600px' }} 
            format="vertical" 
          />
        </div>
      </aside>

      {/* 메인 콘텐츠 영역: 원본 내용과 스타일 절대 유지 */}
      <div style={styles.mainContentArea}>
        {/* SECTION 1: 실시규정의 정의 및 의무 */}
        <section style={styles.m3Section}>
          <div style={styles.container}>
            <h3 style={styles.sectionTitle}>{t('section1.title')}</h3>
            <p style={styles.para} dangerouslySetInnerHTML={{ __html: t('section1.para') }} />
            <div style={styles.infoBox}>
              <h4 style={styles.infoTitle}>{t('section1.infoTitle')}</h4>
              <ul style={styles.infoList}>
                <li>{t('section1.infoList.item1')}</li>
                <li>{t('section1.infoList.item2')}</li>
                <li>{t('section1.infoList.item3')}</li>
                <li>{t('section1.infoList.item4')}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: 실시규정 필수 포함 10대 항목 */}
        <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
          <div style={styles.container}>
            <h3 style={styles.sectionTitle}>{t('section2.title')}</h3>
            <p style={styles.para}>{t('section2.para')}</p>
            <div style={styles.checkGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div key={num} style={styles.checkItem}>
                  <h4 style={styles.itemHeader}>● {t(`section2.items.item${num}.title`)}</h4>
                  <p style={styles.itemContent}>{t(`section2.items.item${num}.content`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: 실시 시기 상세 가이드 */}
        <section style={styles.m3Section}>
          <div style={styles.container}>
            <h3 style={styles.sectionTitle}>{t('section3.title')}</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>{t('section3.table.header.col1')}</th>
                    <th style={styles.th}>{t('section3.table.header.col2')}</th>
                    <th style={styles.th}>{t('section3.table.header.col3')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((num) => (
                    <tr key={num}>
                      <td style={styles.tdBold}>{t(`section3.table.rows.row${num}.col1`)}</td>
                      <td style={styles.td}>{t(`section3.table.rows.row${num}.col2`)}</td>
                      <td style={styles.td}>{t(`section3.table.rows.row${num}.col3`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: 미이행 시 벌칙 규정 */}
        <section style={{...styles.m3Section, backgroundColor: '#fcfcfc'}}>
          <div style={styles.container}>
            <h3 style={styles.sectionTitle}>{t('section4.title')}</h3>
            <p style={styles.para}>{t('section4.para')}</p>
            <div style={styles.legalBox}>
              <ul style={styles.infoList}>
                <li dangerouslySetInnerHTML={{ __html: t('section4.legalList.item1') }} />
                <li dangerouslySetInnerHTML={{ __html: t('section4.legalList.item2') }} />
                <li dangerouslySetInnerHTML={{ __html: t('section4.legalList.item3') }} />
              </ul>
            </div>
          </div>
        </section>
      </div>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <p dangerouslySetInnerHTML={{ __html: t('footer') }} />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  /* 원본 스타일 유지 */
  wrapper: { backgroundColor: '#fff', color: '#1c1b1f', width: '100%', lineHeight: '1.7', position: 'relative' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 40px' },
  header: { padding: '2rem 0', borderBottom: '1px solid #eee' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#111', cursor: 'pointer' },
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff', width: '100%', position: 'relative', zIndex: 10 },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '30px', wordBreak: 'keep-all', lineHeight: '1.3' },
  subTitle: { fontSize: '1.1rem', opacity: 0.8, lineHeight: '1.8' },
  m3Section: { padding: '80px 0' },
  sectionTitle: { fontSize: '2rem', fontWeight: '800', marginBottom: '40px', letterSpacing: '-1px' },
  para: { fontSize: '1.1rem', color: '#333', marginBottom: '35px' },
  infoBox: { padding: '35px', backgroundColor: '#f8f9fa', borderRadius: '16px', borderLeft: '6px solid #007bff' },
  infoTitle: { fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' },
  infoList: { paddingLeft: '20px', fontSize: '1.05rem', color: '#333', display: 'flex', flexDirection: 'column', gap: '15px' },
  checkGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' },
  checkItem: { padding: '25px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  itemHeader: { fontSize: '1.1rem', fontWeight: '800', color: '#007bff', marginBottom: '12px' },
  itemContent: { fontSize: '0.95rem', color: '#555', lineHeight: '1.6' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { backgroundColor: '#f8f9fa' },
  th: { padding: '18px', border: '1px solid #eee', textAlign: 'left', fontWeight: '800' },
  td: { padding: '18px', border: '1px solid #eee', fontSize: '1rem' },
  tdBold: { padding: '18px', border: '1px solid #eee', fontWeight: '800', backgroundColor: '#fcfcfc' },
  legalBox: { padding: '35px', backgroundColor: '#f1f3f9', borderRadius: '16px', borderLeft: '6px solid #1c1b1f' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff', textAlign: 'center' },

  mainContentArea: { position: 'relative', display: 'flex', flexDirection: 'column' },

  /* 핵심 지침 이행: Main.jsx의 Fixed 방식 적용 + Regulation의 간격 적용 */
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  adPlaceholderFixedLeft: { 
    position: 'fixed',
    top: '50%',
    left: 'calc(50% - 600px - 160px - 20px)', // (본문 절반 600px) + (광고폭 160px) + (간격 20px)
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
    right: 'calc(50% - 600px - 160px - 20px)', // (본문 절반 600px) + (광고폭 160px) + (간격 20px)
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