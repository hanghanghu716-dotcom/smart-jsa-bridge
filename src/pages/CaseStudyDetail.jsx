import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; 
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import AdSenseUnit from '../components/AdSenseUnit';
import SEO from '../components/SEO';

export default function CaseStudyDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { i18n } = useTranslation(); 
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const PUBLISHER_ID = 'ca-pub-9791625990220699';
  const ARTICLE_BOTTOM_SLOT_ID = '1284119169'; 
  const SIDE_SLOT_ID = '3978298367';

  const currentLang = post?.language_code || i18n.language || '';
  const isRtl = currentLang.startsWith('ar');

  useEffect(() => {
    const fetchLocalizedPost = async () => {
      setLoading(true);
      const pathSegments = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
      const supportedLangs = ['en-US', 'en-CA', 'en-AU', 'en-GB', 'de-DE', 'ja-JP', 'fr-FR', 'it-IT', 'es-ES', 'ar-SA', 'pt-BR', 'ru-RU', 'ko'];
      const urlLang = supportedLangs.includes(pathSegments[0]) ? pathSegments[0] : null;

      const targetLang = urlLang || i18n.language || 'ko';

      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .eq('post_group_id', id) 
        .eq('language_code', targetLang)
        .maybeSingle();

      if (data) {
        setPost(data);
      } else {
        const { data: defaultData } = await supabase
          .from('case_studies')
          .select('*')
          .eq('post_group_id', id)
          .eq('language_code', 'ko')
          .maybeSingle();
        
        setPost(defaultData);
      }
      setLoading(false);
      
      setTimeout(() => {
        if (window.snapSaveState) window.snapSaveState();
      }, 500);
    };

    fetchLocalizedPost();
  }, [id, i18n.language]);

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!post) return <div style={styles.error}>Content not found.</div>;

  return (
    <div style={styles.wrapper}>
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
        pageDescription={post.meta_description} 
      />
      
      {/* Google SEO 구조화 데이터(JSON-LD) 주입 */}
      {post.schema_markup && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schema_markup) }} 
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
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </section>

      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedLeft}>
          <span style={styles.adLabelDark}>AD (LEFT)</span>
          <AdSenseUnit client={PUBLISHER_ID} slot={SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
        </div>
      </aside>
      <aside className="hidden lg:block">
        <div style={styles.adPlaceholderFixedRight}>
          <span style={styles.adLabelDark}>AD (RIGHT)</span>
          <AdSenseUnit client={PUBLISHER_ID} slot={SIDE_SLOT_ID} format="vertical" style={{ width: '160px', height: '600px' }} />
        </div>
      </aside>

      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          
          {post.pdf_download_url && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '16px 20px', 
              backgroundColor: '#f8fafc', 
              borderLeft: '4px solid #0284c7', 
              borderRadius: '4px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.1rem', marginBottom: '4px' }}>
                  Standard JSA Template Available
                </strong>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  No paywall. Download the complete safety protocol in PDF format.
                </span>
              </div>
              <a 
                href={post.pdf_download_url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#0284c7', 
                  color: '#fff', 
                  textDecoration: 'none', 
                  fontWeight: 'bold', 
                  borderRadius: '4px', 
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                📥 Download Free PDF
              </a>
            </div>
          )}

          <div 
            style={{ ...styles.markdownContent, ...(isRtl ? styles.rtlMarkdown : {}) }}
            dir={isRtl ? 'rtl' : 'ltr'}
            lang={isRtl ? 'ar' : currentLang}
            className={isRtl ? 'rtl-viewer' : ''}
          >
            <Viewer initialValue={post.content_md} key={post.id || post.language_code} />
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
              <Link to="/" style={styles.fLink}>Home</Link>
              <Link to="/privacy" style={styles.fLink}>Privacy Policy</Link>
              <Link to="/terms" style={styles.fLink}>Terms of Service</Link>
              <Link to="/about" style={styles.fLink}>About Us</Link>
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