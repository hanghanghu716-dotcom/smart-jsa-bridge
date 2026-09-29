import { useLanguageNavigate, LanguageLink } from '../hooks/useLanguage';
import { cleanSummary, serializeStructuredData } from '../utils/content.js';
import { getSiteUi } from '../locales/siteUi.js';
import { SUPPORTED_LANGS, getCaseLanguages, selectLocalizedCases, getLanguageTag } from '../locales/config.js';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; 
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import AdSenseUnit from '../components/AdSenseUnit';
import SEO from '../components/SEO';
import { getCaseBootstrap } from '../utils/caseBootstrap.js';

export default function CaseStudyDetail() {
  const { id } = useParams(); 
  const navigate = useLanguageNavigate();
  const { i18n } = useTranslation(); 
  const [initialCase] = useState(() => getCaseBootstrap(window.location.pathname));
  const [post, setPost] = useState(initialCase?.post || null);
  const [loading, setLoading] = useState(!initialCase);
  const [availableLocales, setAvailableLocales] = useState(initialCase?.availableLocales || []);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const viewerRef = useRef(null);
  const ui = getSiteUi(i18n.language);

  const PUBLISHER_ID = 'ca-pub-9791625990220699';
  const ARTICLE_BOTTOM_SLOT_ID = '1284119169'; 
  const SIDE_SLOT_ID = '3978298367';

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
          .eq('post_group_id', id).in('language_code', getCaseLanguages(targetLang));
        if (error) throw error;
        let selected = selectLocalizedCases(data || [], targetLang)[0] || null;
        if (!selected && targetLang !== 'fr-CA-QC') {
          const fallback = await supabase.from('case_studies').select('*')
            .eq('post_group_id', id).eq('language_code', 'ko').maybeSingle();
          if (fallback.error) throw fallback.error;
          selected = fallback.data;
        }
        if (!active) return;
        setPost(selected);
        const variants = await supabase.from('case_studies').select('language_code')
          .eq('post_group_id', id);
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
    viewerRef.current?.getInstance().setMarkdown(post?.content_md || '');
  }, [post?.content_md]);

  if (loading) return <div style={styles.loading}><SEO />Loading...</div>;
  if (loadError) return <div style={styles.error} role="alert"><SEO noIndex />{ui.loadError} <button onClick={() => setRetry(value => value + 1)}>{ui.retry}</button></div>;
  if (!post) return <div style={styles.error}><SEO noIndex />{ui.caseEmpty} <LanguageLink to="/archive">Archive</LanguageLink></div>;
  const structuredData = serializeStructuredData(post.schema_markup);

  return (
    <div style={styles.wrapper} data-case-study-id={post.id}>
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
      
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      <section 
        style={{ ...styles.heroSection, textAlign: isRtl ? 'right' : 'left' }} 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className="max-lg:!py-20 max-lg:!px-6"
      >
        <div style={styles.container}>
          <span style={styles.m3Tag} className="max-lg:before:content-['\00a0\00a0\00a0\00a0']">CASE STUDY</span>
          <h1 style={styles.mainTitle} className="text-[24px] lg:text-[2.8rem] font-extrabold leading-tight mb-6">
            {post.title}
          </h1>
          <p style={styles.date}>
            {new Date(post.created_at).toLocaleDateString(getLanguageTag(currentLang))}
          </p>
        </div>
      </section>

      <aside className="hidden min-[1600px]:block">
        <div style={styles.adPlaceholderFixedLeft}>
          <AdSenseUnit client={PUBLISHER_ID} slot={SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
        </div>
      </aside>
      <aside className="hidden min-[1600px]:block">
        <div style={styles.adPlaceholderFixedRight}>
          <AdSenseUnit client={PUBLISHER_ID} slot={SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
        </div>
      </aside>

      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          
          {((post.pdf_list && post.pdf_list.length > 0) || post.pdf_download_url) && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px 20px', 
              backgroundColor: '#f8fafc', 
              borderLeft: '4px solid #0284c7', 
              borderRadius: '4px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px'
            }}>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.1rem', marginBottom: '4px' }}>
                  Standard JSA Templates Available
                </strong>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                 Download version-controlled safety protocols for diverse operational scenarios and audit readiness.                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* 기존 단일 파일 호환성 유지 */}
                {post.pdf_download_url && (!post.pdf_list || post.pdf_list.length === 0) && (
                  <a 
                    href={post.pdf_download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    📥 Download Original PDF
                  </a>
                )}
                {/* 다중 파일 리스트 렌더링 */}
                {post.pdf_list && post.pdf_list.map((pdf, index) => (
                  <a 
                    key={index}
                    href={pdf.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    📥 Download {pdf.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <aside style={styles.editorialNotice}>
            <strong style={styles.editorialNoticeTitle}>Editorial status</strong>
            <p style={styles.editorialNoticeText}>
              This material may use AI-assisted drafting, translation or formatting. Unless this page explicitly identifies
              a reviewer and review record, no licensed or certified professional review is claimed. Verify current local
              requirements and complete a site-specific risk assessment before use.
            </p>
            <LanguageLink to="/editorial-policy" style={styles.editorialNoticeLink}>Read our editorial policy</LanguageLink>
          </aside>

          <div 
            style={{ ...styles.markdownContent, ...(isRtl ? styles.rtlMarkdown : {}) }}
            dir={isRtl ? 'rtl' : 'ltr'}
            lang={isRtl ? 'ar' : currentLang}
            className={isRtl ? 'rtl-viewer' : ''}
          >
            <Viewer ref={viewerRef} initialValue={post.content_md} key={post.id || post.language_code} />
          </div>

          <div style={styles.adSection}>
            <span style={styles.adLabel}>ADVERTISEMENT</span>
            <AdSenseUnit client={PUBLISHER_ID} slot={ARTICLE_BOTTOM_SLOT_ID} format="auto" />
          </div>
          
        </div>
      </div>

      <footer style={styles.finalFooter}>
        <div style={styles.container}>
          <div style={styles.footerFlex}>
            <p style={styles.copyright}>© 2026 <strong>Smart JSA Bridge</strong>. Designed by <strong>yizuno</strong></p>
            <div style={styles.footerLinks}>
              <LanguageLink to="/" style={styles.fLink}>Home</LanguageLink>
              <LanguageLink to="/privacy" style={styles.fLink}>Privacy Policy</LanguageLink>
              <LanguageLink to="/terms" style={styles.fLink}>Terms of Service</LanguageLink>
              <LanguageLink to="/about" style={styles.fLink}>About Us</LanguageLink>
              <LanguageLink to="/editorial-policy" style={styles.fLink}>Editorial Policy</LanguageLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { width: '100%', backgroundColor: '#fff', color: '#1c1b1f', position: 'relative', overflowX: 'hidden' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  heroSection: { padding: '100px 0', backgroundColor: '#1c1b1f', color: '#fff', width: '100%', position: 'relative', zIndex: 10 },
  m3Tag: { color: '#007bff', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '20px', display: 'block' },
  mainTitle: { fontWeight: '800', marginBottom: '24px', wordBreak: 'keep-all', lineHeight: '1.3', color: '#fff' },
  date: { color: '#bbb', fontSize: '1rem' },
  mainContentArea: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 100px 24px' },
  centerContent: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px' },
  editorialNotice: { marginBottom: '28px', padding: '18px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7', borderRadius: '6px' },
  editorialNoticeTitle: { display: 'block', color: '#0f172a', marginBottom: '8px' },
  editorialNoticeText: { margin: '0 0 8px', color: '#475569', lineHeight: 1.65, fontSize: '0.92rem' },
  editorialNoticeLink: { color: '#0369a1', fontWeight: 700, fontSize: '0.9rem' },
  markdownContent: { 
    width: '100%', 
    fontSize: '1.1rem', 
    lineHeight: '1.9', 
    color: '#222', 
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
  loading: { textAlign: 'center', padding: '100px', color: '#888' },
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
  header: { padding: '20px 24px', backgroundColor: '#1c1b1f', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 20 },
  logo: { fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer', margin: 0 },
  finalFooter: { padding: '60px 24px', backgroundColor: '#1c1b1f', color: '#fff', width: '100%', marginTop: 'auto' },
  footerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
  copyright: { margin: 0, fontSize: '0.9rem', opacity: 0.6 },
  footerLinks: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  fLink: { color: '#888', textDecoration: 'none', fontSize: '0.95rem' }
};
