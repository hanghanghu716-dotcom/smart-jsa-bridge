import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 추가
import AdBanner from '../../AdBanner';

// 법적 고지 컴포넌트: 다국어 적용
const LegalDisclaimer = ({ t }) => (
    <div style={{...styles.disclaimer, width: '100%'}} className="max-lg:!px-6 max-lg:!py-4">
        <p style={styles.disclaimerText} className="text-[12px] lg:text-[0.9rem]">
            {t('disclaimer.text1')} <br className="hidden lg:block" />
            {t('disclaimer.text2')}
        </p>
    </div>
);

export default function CommonGuide() {
    const navigate = useNavigate();
    const { t } = useTranslation('common'); // common 네임스페이스 로드
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // JSON 배열 데이터 로드
    const stepSummary = t('steps', { returnObjects: true });

    return (
        <div style={styles.wrapper}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.container}>
                    <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
                </div>
            </header>

            {/* 법적 고지 */}
            <LegalDisclaimer t={t} />

            <div style={styles.mainLayout}>
                {/* 좌측 광고 */}
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

                        <div style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl">
                            <div style={styles.cardHeader}>
                                <span style={styles.jsaId}>{t('ui.jsaId')}</span>
                                <h4 style={styles.jsaTitle} className="text-[18px] lg:text-[1.8rem]">
                                    <span className="max-lg:block">{t('ui.jsaTitle1')}</span>
                                    <span className="max-lg:block">{t('ui.jsaTitle2')}</span>
                                </h4>
                            </div>

                            <div style={styles.summaryGrid} className="max-lg:!p-4">
                                <div style={styles.summaryTitle} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">{t('ui.summaryTitle')}</div>
                                <div style={styles.stepContainer} className="max-lg:!grid-cols-1 max-lg:!gap-6">
                                    {Array.isArray(stepSummary) && stepSummary.map((item) => (
                                        <div key={item.step} style={styles.stepRow}>
                                            <span style={styles.stepNum}>{item.step}</span>
                                            <div style={styles.stepContent}>
                                                <strong className="text-[14px] lg:text-[0.95rem]">{item.task}</strong>
                                                <p className="text-[13px] lg:text-[0.85rem] opacity-70">{item.hazard}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={styles.imageWrapper}>
                                <p style={styles.previewLabel}>{t('ui.previewLabel')}</p>
                                {[1, 2].map((num) => (
                                    <img
                                        key={num}
                                        src={`/assets/pdf/COMMON-01/COMMON-01_00${num}.jpg`}
                                        alt={`Preview ${num}`}
                                        style={styles.previewImage}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ))}
                            </div>

                            <div style={styles.cardFooter}>
                                <a href="/assets/pdf/COMMON-01.pdf" download style={styles.downloadBtn} className="max-lg:!w-full max-lg:!text-sm">
                                    {t('ui.downloadBtn')}
                                </a>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 우측 광고 */}
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

const styles = {
    wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', overflowX: 'hidden' },
    container: { maxWidth: '1000px', margin: '0 auto' },
    disclaimer: { backgroundColor: '#fff4f4', padding: '20px', borderBottom: '1px solid #ffcccc', textAlign: 'center' },
    disclaimerText: { color: '#d32f2f', fontWeight: '800', margin: 0, wordBreak: 'keep-all', lineHeight: '1.6' },
    header: { padding: '2.5rem 0', zIndex: 10, borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' },
    logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', color: '#111' },
    mainLayout: { position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '0 5rem', gap: '4rem', zIndex: 10 },
    sideAd: { width: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' },
    centerContent: { flex: 1, display: 'flex', flexDirection: 'column' },
    section: { padding: '60px 0', maxWidth: '1000px', margin: '0 auto' },
    headerBox: { textAlign: 'left', marginBottom: '60px' },
    categoryTag: { color: '#6200ee', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2.5px', display: 'block', marginBottom: '20px' },
    title: { fontWeight: '900', color: '#111' },
    description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' },
    card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
    cardHeader: { borderBottom: '2px solid #6200ee', paddingBottom: '20px', marginBottom: '30px' },
    jsaId: { color: '#6200ee', fontWeight: '900', fontSize: '1rem' },
    jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all' },
    summaryGrid: { marginBottom: '40px', backgroundColor: '#f9f9ff', padding: '30px', borderRadius: '16px' },
    summaryTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#333', display: 'block' },
    stepContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    stepRow: { display: 'flex', gap: '15px', alignItems: 'flex-start' },
    stepNum: { backgroundColor: '#6200ee', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', flexShrink: 0 },
    stepContent: { fontSize: '0.85rem', lineHeight: '1.4' },
    imageWrapper: { border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f9f9f9' },
    previewLabel: { fontSize: '0.75rem', color: '#aaa', padding: '10px 20px', margin: 0, backgroundColor: '#fff' },
    previewImage: { width: '100%', height: 'auto', display: 'block' },
    cardFooter: { marginTop: '40px', textAlign: 'center' },
    downloadBtn: { display: 'inline-block', padding: '16px 50px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none' },
    finalFooter: { padding: '60px 0', backgroundColor: '#1c1b1f', color: '#fff' }
};