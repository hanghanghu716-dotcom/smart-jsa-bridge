import { useState } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ useNavigate 제거
import { useTranslation } from 'react-i18next';
import AdBanner from '../../AdBanner';
import SEO from '../../components/SEO'; // ✅ [추가] 글로벌 SEO 컴포넌트
import { useLanguageNavigate } from '../../hooks/useLanguage'; // ✅ [추가] 다국어 네비게이션 훅

/**
 * [ConstructionGuide 컴포넌트]
 * 역할: 건설 공정 JSA 견본 가이드 제공 (글로벌 표준 마이그레이션 완료)
 */

// 법적 고지 컴포넌트: 다국어 적용 및 전달받은 t 사용
const LegalDisclaimer = ({ t }) => (
  <div style={{...styles.disclaimer, width: '100%', margin: 0}} className="max-lg:!px-6 max-lg:!py-4">
    <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
      {t('disclaimer.text1')} <br className="hidden lg:block" />
      {t('disclaimer.text2')}
    </p>
  </div>
);

export default function ConstructionGuide() {
  const navigate = useLanguageNavigate(); // ✅ [변경] 커스텀 다국어 네비게이트 사용
  const { t } = useTranslation('const'); // const 네임스페이스 사용
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ [수정] 하드코딩된 리스트를 다국어 리소스에서 호출
  const constructionJsaList = t('list', { returnObjects: true }) || [];

  return (
    <div style={styles.wrapper}>
      <SEO /> {/* ✅ [추가] 글로벌 SEO 태그 자동 삽입 */}

      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      {/* 법적 고지: t 객체 전달 */}
      <LegalDisclaimer t={t} />
      
      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <div style={styles.centerContent}>
          <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
            <div style={styles.headerBox}>
              <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.category')}</span>
              <h2 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.mainTitle1')}</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.mainTitle2')}</span>
              </h2>
              <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.description1')}</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.description2')}</span>
              </p>
            </div>

            <div style={styles.listContainer}>
              {Array.isArray(constructionJsaList) && constructionJsaList.map((item) => (
                <div key={item.id} style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
                  <div style={styles.cardHeader}>
                    <span style={styles.jsaId}>{item.id}</span>
                    <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.6rem]">{item.title}</h4>
                  </div>

                  <div style={styles.infoGrid} className="max-lg:!grid-cols-1 max-lg:!gap-4">
                    <div style={styles.infoBox} className="max-lg:!p-4">
                      <strong style={styles.labelRed}>{t('ui.labelRed')}</strong>
                      <p style={styles.infoText}>{item.hazard}</p>
                    </div>
                    <div style={styles.infoBox} className="max-lg:!p-4">
                      <strong style={styles.labelBlue}>{t('ui.labelBlue')}</strong>
                      <p style={styles.infoText}>{item.measure}</p>
                    </div>
                  </div>

                  <div style={styles.imageContainer}>
                    <p style={styles.previewLabel}>{t('ui.previewLabel')}</p>
                    {Array.from({ length: item.pages || 1 }, (_, i) => (
                      <img 
                        key={i}
                        src={`/assets/pdf/const/${item.id}/${item.id}_00${i + 1}.jpg`}
                        alt={`${item.title} Preview`}
                        style={styles.previewImage}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                  </div>

                  <div style={styles.cardFooter}>
                    <a href={`/assets/pdf/const/${item.id}.pdf`} download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                      {t('ui.downloadBtn')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside style={styles.sideAd}>
          <AdBanner slot="3978298367" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.finalFooter} className="max-lg:!py-12">
        <div style={styles.container} className="max-lg:!px-6 text-center">
          <p className="m-0 text-sm opacity-60">© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
        </div>
      </footer>
    </div>
  );
}

// 스타일 객체는 원본 데이터를 절대적으로 유지합니다.
const styles = {
  wrapper: { backgroundColor: '#f9f9f9', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
  mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '4rem', zIndex: 10, justifyContent: 'center' },
  sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', alignItems: 'center' },
  disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
  disclaimerText: { color: '#d32f2f', fontWeight: '800', margin: 0, wordBreak: 'keep-all', lineHeight: '1.6' },
  section: { padding: '60px 0', width: '100%' },
  headerBox: { textAlign: 'left', marginBottom: '60px', width: '100%' },
  categoryTag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', display: 'block', marginBottom: '20px' },
  title: { fontWeight: '900', color: '#111' },
  description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '50px', width: '100%' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  cardHeader: { borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#007bff', fontWeight: '900', fontSize: '0.85rem' },
  jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0' },
  labelRed: { color: '#d32f2f', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  labelBlue: { color: '#007bff', fontSize: '0.8rem', display: 'block', marginBottom: '8px' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '500', lineHeight: '1.5', wordBreak: 'keep-all' },
  imageContainer: { marginTop: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0', width: '100%' },
  previewLabel: { fontSize: '0.7rem', color: '#999', padding: '10px 15px', margin: 0, backgroundColor: '#fff' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },
  cardFooter: { marginTop: '30px', textAlign: 'center' },
  downloadBtn: { display: 'inline-block', padding: '14px 40px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
  finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};