import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next'; 
// ✅ 불일치를 유발하던 기존 마크다운 엔진을 모두 제거하고 TOAST UI Viewer로 통일
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
  const SIDE_SLOT_ID = '3978298367'; // ✅ 사이드 광고 슬롯 ID 추가

  useEffect(() => {
    const fetchLocalizedPost = async () => {
      setLoading(true);
      const currentLang = i18n.language || 'ko';

      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .eq('post_group_id', id) 
        .eq('language_code', currentLang)
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
      
      // 봇에게 스냅샷 캡처 지시 (약간의 렌더링 딜레이를 확보)
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
      {/* ✅ 수정: SEO 컴포넌트에 전달하는 Props 명칭 및 구조 변경 */}
      <SEO pageTitle={`${post.title} | Smart JSA Bridge`} pageDescription={post.meta_description} />
      
      {/* ✅ 추가: SEO를 통해 직접 유입된 사용자를 위한 상단 네비게이션 헤더 */}
      <header style={styles.header}>
        <div style={styles.container}>
          <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
        </div>
      </header>

      {/* ✅ 1. Jrajsa 스타일의 다크 테마 헤더 (Hero Section) 적용 */}
      <section style={styles.heroSection} className="max-lg:!py-20 max-lg:!px-6">
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

      {/* ✅ 2. 좌우 고정형 사이드 광고 슬롯 추가 */}
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

      {/* ✅ 3. 중앙 정렬된 넓은 콘텐츠 영역 (Max-width 1200px) 적용 */}
      <div style={styles.mainContentArea}>
        <div style={styles.centerContent}>
          <div style={styles.markdownContent}>
            <Viewer initialValue={post.content_md} />
          </div>

          <div style={styles.adSection}>
            <span style={styles.adLabel}>ADVERTISEMENT</span>
            <AdSenseUnit client={PUBLISHER_ID} slot={ARTICLE_BOTTOM_SLOT_ID} format="auto" />
          </div>
        </div>
      </div>

      {/* ✅ 추가: 애드센스 정책 준수 및 부가 정보 제공을 위한 하단 푸터 */}
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
  markdownContent: { width: '100%', fontSize: '1.1rem', lineHeight: '1.9', color: '#222', wordBreak: 'keep-all' },
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