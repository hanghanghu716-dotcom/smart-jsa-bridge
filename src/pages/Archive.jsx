import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import SEO from '../components/SEO';

export default function Archive() {
  const { i18n } = useTranslation();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchAllCases = async () => {
      const currentLang = i18n.language || 'ko';
      const { data, error } = await supabase
        .from('case_studies')
        .select('post_group_id, title, meta_description, created_at')
        .eq('language_code', currentLang)
        .order('created_at', { ascending: false });

      if (data) setCases(data);
    };
    fetchAllCases();
  }, [i18n.language]);

  return (
    <div style={styles.wrapper}>
      <SEO pageTitle="Case Studies Archive | Smart JSA Bridge" />

      <main style={styles.mainLayout}>
        <div style={styles.centerContent}>
          <section style={styles.section} className="max-lg:!py-16 max-lg:!px-6">
            
            {/* SEO 및 텍스트 비율 확보용 헤더 영역 */}
            <header style={styles.headerBox}>
              <span style={styles.categoryTag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">
                DATABASE
              </span>
              <h1 style={{...styles.title, fontSize: undefined}} className="text-[24px] lg:text-[2.5rem] font-extrabold leading-tight mb-6">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">Case Studies</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">Archive</span>
              </h1>
              <p style={styles.description} className="text-[14px] lg:text-[1.1rem]">
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">Explore comprehensive Job Safety Analysis (JSA) and Risk Assessment (JRA) records across various industrial operations.</span>
                <span className="max-lg:block max-lg:before:content-['\00a0\00a0\00a0\00a0']">Each case study strictly details specific hazard factors, regulatory compliance measures, and engineering controls designed to prevent critical incidents, ensure workplace safety, and maintain OSHA compliance.</span>
              </p>
            </header>

            {/* 카드 리스트 렌더링 영역 */}
            <div style={styles.listContainer}>
              {cases.map(item => (
                <article key={item.post_group_id} style={styles.card} className="max-lg:!p-6 max-lg:!rounded-2xl flex flex-col">
                  <div style={styles.cardHeader}>
                    <span style={styles.jsaId}>{item.post_group_id}</span>
                    <LanguageLink 
                      to={`/case-study/${item.post_group_id}`} 
                      style={{ textDecoration: 'none' }}
                    >
                      <h2 style={styles.jsaTitle} className="text-[18px] lg:text-[1.6rem] hover:text-[#e91e63] transition-colors">
                        {item.title}
                      </h2>
                    </LanguageLink>
                  </div>

                  {/* meta_description 텍스트 데이터 노출부 */}
                  <div style={styles.infoBox} className="max-lg:!p-4">
                    <strong style={styles.labelBlue}>Case Study Summary</strong>
                    <p style={styles.infoText}>{item.meta_description}</p>
                  </div>

                  <div style={styles.cardFooter} className="max-lg:flex-col max-lg:gap-4">
                    <span style={styles.dateText}>
                      Published: {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <LanguageLink 
                      to={`/case-study/${item.post_group_id}`} 
                      style={styles.readMoreBtn} 
                      className="max-lg:!w-full max-lg:!text-sm"
                    >
                      Read Case Study
                    </LanguageLink>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// 기존 ChemicalGasGuide의 스타일 컨셉 계승
const styles = {
  wrapper: { backgroundColor: '#fcfcfc', color: '#1c1b1f', width: '100%', minHeight: '100vh', overflowX: 'hidden' },
  mainLayout: { position: 'relative', display: 'flex', justifyContent: 'center', padding: '0 1rem', zIndex: 10 },
  centerContent: { flex: 1, maxWidth: '1000px', width: '100%' },
  section: { padding: '60px 0' },
  headerBox: { textAlign: 'left', marginBottom: '60px' },
  categoryTag: { color: '#e91e63', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2.5px', display: 'block', marginBottom: '20px' },
  title: { fontWeight: '900', color: '#111' },
  description: { color: '#666', lineHeight: '1.6', wordBreak: 'keep-all', marginTop: '20px' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '40px' },
  card: { backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
  cardHeader: { borderBottom: '1px solid #f8f8f8', paddingBottom: '20px', marginBottom: '25px' },
  jsaId: { color: '#e91e63', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase' },
  jsaTitle: { fontWeight: '800', marginTop: '10px', wordBreak: 'keep-all', color: '#111' },
  infoBox: { padding: '20px', borderRadius: '12px', backgroundColor: '#fffafb', border: '1px solid #ffeff2', marginBottom: '20px' },
  labelBlue: { color: '#0056b3', fontSize: '0.8rem', display: 'block', marginBottom: '8px', fontWeight: 'bold' },
  infoText: { fontSize: '0.95rem', color: '#333', margin: 0, fontWeight: '600', lineHeight: '1.5', wordBreak: 'keep-all' },
  cardFooter: { marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f8f8f8' },
  dateText: { fontSize: '0.85rem', color: '#888', fontWeight: '500' },
  readMoreBtn: { display: 'inline-block', padding: '12px 35px', backgroundColor: '#1c1b1f', color: '#fff', borderRadius: '50px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' }
};