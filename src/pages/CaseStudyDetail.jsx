import CaseLanguageSwitch from '../components/CaseLanguageSwitch';
import { romanianUi } from '../locales/romanianUi.js';
import { canonicalCaseSlug, caseLookupSlugs } from '../utils/caseRouting.js';
import { caseViewCounts, recordCaseView } from '../services/caseStudyMetrics';
import { getPublicUi } from '../locales/publicUi';
import DiscoveryLinks from '../components/DiscoveryLinks';
import RegionalStartActions from '../components/RegionalStartActions';
import { regionalJourneyUi } from '../locales/regionalJourneyUi';
import { LanguageLink } from '../hooks/useLanguage';
import { cleanSummary, serializeStructuredData } from '../utils/content.js';
import { getSiteUi } from '../locales/siteUi.js';
import { SUPPORTED_LANGS, getCaseLanguages, selectLocalizedCases, getLanguageTag } from '../locales/config.js';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; 
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import CommerceRecommendations from '../components/CommerceRecommendations';
import { splitCaseForCommerce, caseResourcesTitle } from '../utils/caseSections.js';
import SEO from '../components/SEO';
import PublicSiteHeader from '../components/PublicSiteHeader';
import CommunityFooter from '../components/CommunityFooter';
import './CaseStudyDetail.css';
import { getCaseBootstrap } from '../utils/caseBootstrap.js';

export default function CaseStudyDetail() {
  const { id } = useParams(); 
  const { i18n } = useTranslation(); 
  const [initialCase] = useState(() => getCaseBootstrap(window.location.pathname));
  const [post, setPost] = useState(initialCase?.post || null);
  const [loading, setLoading] = useState(!initialCase);
  const [availableLocales, setAvailableLocales] = useState(initialCase?.availableLocales || []);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const viewerRef = useRef(null);
  const afterProductsRef = useRef(null);
  const sections = splitCaseForCommerce(post?.content_md || '');
  const [viewMetric,setViewMetric]=useState(null);
  const metricId=canonicalCaseSlug(post?.post_group_id)===canonicalCaseSlug(id)&&!loading&&!loadError?post?.id:null;
  useEffect(()=>{
    if(!metricId)return;
    let active=true,timer;
    const update=count=>{if(active&&count!==null)setViewMetric(previous=>({id:metricId,count:Math.max(previous?.id===metricId?previous.count:0,count)}));};
    caseViewCounts([metricId]).then(counts=>update(counts.get(metricId)||0)).catch(()=>{});
    const schedule=()=>{clearTimeout(timer);if(document.visibilityState==='visible')timer=setTimeout(()=>{recordCaseView(metricId).then(update);},2000);};
    schedule();document.addEventListener('visibilitychange',schedule);
    return()=>{active=false;clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
  },[metricId]);
  const ui = getSiteUi(i18n.language);
  const ro = i18n.language === 'ro-RO' ? romanianUi.editorial : null;
  const journeyUi = regionalJourneyUi(i18n.language);


  const currentLang = post?.language_code || i18n.language || '';
  const isRtl = currentLang.startsWith('ar');

  useEffect(() => {
    let active = true;
    const fetchLocalizedPost = async () => {
      const keepSnapshot = initialCase?.path === window.location.pathname;
      setLoading(!keepSnapshot);
      setLoadError(false);
      if (!keepSnapshot) {
        setPost(null);
        setAvailableLocales([]);
      }
      const segment = window.location.pathname.split('/')[1];
      const targetLang = SUPPORTED_LANGS.includes(segment) ? segment : (i18n.language || 'ko');
      try {
        const { data, error } = await supabase.from('case_studies').select('*')
          .in('post_group_id', caseLookupSlugs(id)).in('language_code', getCaseLanguages(targetLang));
        if (error) throw error;
        let selected = selectLocalizedCases(data || [], targetLang)[0] || null;
        if (!active) return;
        setPost(selected);
        const variants = await supabase.from('case_studies').select('language_code').not('content_md','is',null).neq('content_md','')
          .in('post_group_id', caseLookupSlugs(id));
        if (active && !variants.error) setAvailableLocales((variants.data || []).map(row => row.language_code));
      } catch (error) {
        if (active) { console.error('Case study lookup failed:', error.message); setLoadError(true); }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLocalizedPost();
    return () => { active = false; };
  }, [id, i18n.language, retry, initialCase]);

  // The Toast UI React wrapper only reads initialValue when it mounts.
  // A fresher DB response for the same ID must replace the snapshot body too.
  useEffect(() => {
    const next=splitCaseForCommerce(post?.content_md || '');
    viewerRef.current?.getInstance().setMarkdown(next.beforeProducts);
    afterProductsRef.current?.getInstance().setMarkdown(next.afterProducts);
  }, [post?.content_md]);

  if (loading) return <div style={styles.loading}><SEO />{ro?.loading || 'Loading...'}</div>;
  if (loadError) return <div style={styles.error} role="alert"><SEO noIndex />{ui.loadError} <button onClick={() => setRetry(value => value + 1)}>{ui.retry}</button></div>;
  if (!post) return <div style={styles.error}><SEO noIndex />{ui.caseEmpty} <LanguageLink to="/archive">{ro?.archive || 'Archive'}</LanguageLink></div>;
  const structuredData = serializeStructuredData(post.schema_markup);
  const products = <CommerceRecommendations key={id+currentLang} kind="case" contentId={post.post_group_id} locale={i18n.language} contentLocale={currentLang} placement="rail" sectionNumber={sections.productSection} />;

  return (
    <div className="case-study-page" style={styles.wrapper} data-case-study-id={post.id}>
      <script id="jsa-case-bootstrap" type="application/json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData({
          path: window.location.pathname, post, availableLocales,
        }) }} />
      {/* 전 언어 공통: TOAST UI 테이블 가로 스크롤 허용 및 일본어 강제 줄바꿈 처리, RTL 조건부 적용 */}
      <style>{`
        .toastui-editor-contents table {
          display: block !important;
          overflow-x: auto !important;
          width: 100% !important;
          word-break: break-word !important;
          -webkit-overflow-scrolling: touch;
        }
        .toastui-editor-contents th,
        .toastui-editor-contents td {
          white-space: normal !important; 
        }

        ${isRtl ? `
          .rtl-viewer .toastui-editor-contents {
            direction: rtl !important;
            text-align: right !important;
          }
          .rtl-viewer .toastui-editor-contents table {
            direction: rtl !important;
          }
          .rtl-viewer .toastui-editor-contents th,
          .rtl-viewer .toastui-editor-contents td {
            text-align: right !important;
          }
          .rtl-viewer .toastui-editor-contents th:last-child,
          .rtl-viewer .toastui-editor-contents td:last-child,
          .rtl-viewer .toastui-editor-contents th:nth-last-child(2),
          .rtl-viewer .toastui-editor-contents td:nth-last-child(2),
          .rtl-viewer .toastui-editor-contents th:nth-last-child(3),
          .rtl-viewer .toastui-editor-contents td:nth-last-child(3),
          .rtl-viewer .toastui-editor-contents th:nth-last-child(4),
          .rtl-viewer .toastui-editor-contents td:nth-last-child(4) {
            text-align: center !important;
          }
          .rtl-viewer .toastui-editor-contents ul,
          .rtl-viewer .toastui-editor-contents ol {
            padding-right: 2rem !important;
            padding-left: 0 !important;
          }
        ` : ''}
      `}</style>

      <SEO 
        pageTitle={post.meta_title ? post.meta_title : `${post.title} | Smart JSA Bridge`} 
        pageDescription={cleanSummary(post.meta_description)}
        canonicalLocale={post.language_code}
        availableLocales={availableLocales} 
      />
      
      {/* Google SEO 구조화 데이터(JSON-LD) 주입 */}
      {structuredData && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: structuredData }} 
        />
      )}
      
      <PublicSiteHeader />

      <section 
        style={{ ...styles.heroSection, textAlign: isRtl ? 'right' : 'left' }} 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className="max-lg:!py-8 max-lg:!px-6"
      >
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">{ro?.caseStudy || 'CASE STUDY'}</span>
          <h1 style={styles.mainTitle} className="text-[24px] lg:text-[2.8rem] font-extrabold leading-tight mb-6">
            {post.title}
          </h1>
          <p style={styles.date}>
            {new Date(post.created_at).toLocaleDateString(getLanguageTag(currentLang))} · {getPublicUi(i18n.language).views} {viewMetric?.id===post.id?viewMetric.count.toLocaleString(getLanguageTag(currentLang)):''}
          </p>
          <CaseLanguageSwitch locales={availableLocales} locale={currentLang} slug={post.post_group_id} />
        </div>
      </section>


      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          


          {sections.introduction && <div className="case-usage-notes"><Viewer initialValue={sections.introduction} key={sections.introduction}/></div>}

          <div 
            style={{ ...styles.markdownContent, ...(isRtl ? styles.rtlMarkdown : {}) }}
            dir={isRtl ? 'rtl' : 'ltr'}
            lang={isRtl ? 'ar' : currentLang}
            className={isRtl ? 'rtl-viewer' : ''}
          >
            <Viewer ref={viewerRef} initialValue={sections.beforeProducts} key={post.id || post.language_code} />
          </div>

          {sections.earlyProducts && products}
          {sections.afterProducts && <div style={{...styles.markdownContent,...(isRtl?styles.rtlMarkdown:{})}} dir={isRtl?'rtl':'ltr'} lang={currentLang} className={isRtl?'rtl-viewer':''}>
            <Viewer ref={afterProductsRef} initialValue={sections.afterProducts} key={(post.id || post.language_code)+':after-products'} />
          </div>}

          <section id={'section-'+sections.resourcesSection} className="case-numbered-section"><h2>{sections.resourcesSection}. {caseResourcesTitle(i18n.language)}</h2>
          {((post.pdf_list && post.pdf_list.length > 0) || post.pdf_download_url) && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px 20px', 
              backgroundColor: 'var(--card-bg)', 
              borderLeft: '4px solid #0284c7', 
              borderRadius: '4px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px'
            }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '4px' }}>
                  {journeyUi.attachments}
                </strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {journeyUi.attachmentHelp}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* 기존 단일 파일 호환성 유지 */}
                {post.pdf_download_url && (!post.pdf_list || post.pdf_list.length === 0) && (
                  <a 
                    href={post.pdf_download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ padding: '10px 20px', backgroundColor: 'var(--action-bg)', color: 'var(--on-accent)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    ↓ {journeyUi.download} PDF
                  </a>
                )}
                {/* 다중 파일 리스트 렌더링 */}
                {post.pdf_list && post.pdf_list.map((pdf, index) => (
                  <a 
                    key={index}
                    href={pdf.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ padding: '10px 20px', backgroundColor: 'var(--action-bg)', color: 'var(--on-accent)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    ↓ {journeyUi.download} {pdf.name}
                  </a>
                ))}
              </div>
            </div>
          )}


          <DiscoveryLinks kind="case" target={post.post_group_id} showReuseHelp/>
          <div id="case-start-actions"><RegionalStartActions key={`${id}:${i18n.language}`} locale={i18n.language} activity={post.title} casePost={post}/></div>
          </section>
          {!sections.earlyProducts && products}
          {sections.review && <div style={styles.markdownContent} dir={isRtl?'rtl':'ltr'} className={isRtl?'rtl-viewer':''}><Viewer initialValue={sections.review} key={sections.review}/></div>}

          
        </div>
      </div>

      <CommunityFooter />
    </div>
  );
}

const styles = {
  wrapper: { width: '100%', backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  heroSection: { padding: '40px 24px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-primary)', width: '100%', position: 'relative', zIndex: 10 },
  m3Tag: { color: 'var(--accent)', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3', color: 'var(--text-primary)' },
  date: { color: 'var(--text-secondary)', fontSize: '1rem' },
  mainContentArea: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 64px 24px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px' },
  markdownContent: { 
    width: '100%', 
    fontSize: '1.1rem', 
    lineHeight: '1.9', 
    color: 'var(--text-primary)', 
    wordBreak: 'break-word', 
    overflowX: 'hidden' 
  },
  rtlMarkdown: {
    direction: 'rtl',
    textAlign: 'right',
  },
  adSection: { marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #eee', textAlign: 'center', width: '100%' },
  adLabel: { fontSize: '10px', color: '#ccc', fontWeight: 'bold', display: 'block', marginBottom: '15px' },
  adLabelDark: { fontSize: '11px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' },
  loading: { textAlign: 'center', padding: '100px', color: 'var(--text-muted)' },
  error: { textAlign: 'center', padding: '100px', color: '#ff4d4d' },
  adPlaceholderFixedLeft: { 
    position: 'fixed', top: '50%', left: 'calc(50% - 600px - 160px - 20px)', transform: 'translateY(-50%)',
    width: '160px', minHeight: '600px', backgroundColor: '#f5f5f5', border: '1px dashed #ddd', 
    borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', zIndex: 100
  },
  adPlaceholderFixedRight: { 
    position: 'fixed', top: '50%', right: 'calc(50% - 600px - 160px - 20px)', transform: 'translateY(-50%)',
    width: '160px', minHeight: '600px', backgroundColor: '#f5f5f5', border: '1px dashed #ddd', 
    borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', zIndex: 100
  },
  header: { padding: '20px 24px', backgroundColor: 'var(--panel-bg)', borderBottom: '1px solid var(--border-default)', position: 'relative', zIndex: 20 },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 },
  finalFooter: { padding: '60px 24px', backgroundColor: 'var(--panel-bg)', color: 'var(--text-primary)', width: '100%', marginTop: 'auto' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
  copyright: { margin: 0, fontSize: '0.9rem', opacity: 0.6 },
  footerLinks: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  fLink: { color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }
};
