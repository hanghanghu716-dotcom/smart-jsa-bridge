import { normalizeLocale } from './locales/config.js';
import { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { supabase } from './supabaseClient';

import Main from './pages/Main';
import Info from './pages/Info';
import Analysis from './pages/Analysis';
import Export from './pages/Export';
import Procedure from './pages/Procedure';
import About from './pages/About';
import EditorialPolicy from './pages/EditorialPolicy';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import MobileGuard from './MobileGuard';
import JraJsa from './pages/Jrajsa';
import Regulation from './pages/Regulation';
import ProtectiveEquipment from './pages/ProtectiveEquipment';
import RiskClassification from './pages/RiskClassification';
import JsaSamplePreview from './pages/JsaSamplePreview';
import MyLibrary from './pages/MyLibrary'; 
import ConstructionGuide from './pages/guideline/ConstructionGuide';
import HighRiskGuide from './pages/guideline/HighRiskGuide';
import GeneralGuide from './pages/guideline/GeneralGuide';
import ManufacturingGuide from './pages/guideline/ManufacturingGuide';
import ChemicalGasGuide from './pages/guideline/ChemicalGasGuide';
import CommonGuide from './pages/guideline/CommonGuide';
import Login from './pages/Login'; 
import ResetPassword from './pages/ResetPassword'; 
import Profile from './pages/Profile';
import PublicExplore from './components/PublicExplore';
import LayoutBuilder from './pages/LayoutBuilder';
import FactorDictionary from './pages/FactorDictionary';
import ModuleBuilder from './pages/ModuleBuilder';
import TableBuilder from './pages/TableBuilder';
import CaseStudyDetail from './pages/CaseStudyDetail';
import AdminPostUpload from './pages/AdminPostUpload';
import Archive from './pages/Archive';
import SEO from './components/SEO';

import { useLanguageDetect } from './hooks/useLanguageDetect';

/**
 * Admin routes use the existing Supabase Auth session.
 * Authorization is based on app_metadata.role, which normal clients cannot edit.
 * Database/storage writes are also protected by RLS; this UI check is defense in depth.
 */
function AdminRoute({ children }) {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.app_metadata?.role === 'admin';

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setAuthError(error?.message || '관리자 인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '160px 24px', textAlign: 'center', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        <SEO noIndex />
        <h2 style={{ marginBottom: '12px', color: '#111', fontSize: '1.5rem', fontWeight: 'bold' }}>관리자 로그인</h2>
        <p style={{ margin: '0 auto 24px', maxWidth: '520px', color: '#555', lineHeight: 1.6 }}>
          Supabase 계정으로 로그인합니다. 관리자 역할이 부여된 계정만 편집실에 접근할 수 있습니다.
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="관리자 이메일"
            autoComplete="username"
            style={{ padding: '12px', width: '300px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', color: '#111', backgroundColor: '#fff' }}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            style={{ padding: '12px', width: '300px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', color: '#111', backgroundColor: '#fff' }}
            required
          />
          {authError && <p role="alert" style={{ maxWidth: '420px', color: '#b42318', margin: 0 }}>{authError}</p>}
          <button type="submit" disabled={loading}
            style={{ padding: '12px 24px', width: '300px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
            {loading ? '인증 중...' : '로그인'}
          </button>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '160px 24px', textAlign: 'center', minHeight: '100vh' }}>
        <SEO noIndex />
        <h2 style={{ color: '#111' }}>관리자 권한이 없습니다.</h2>
        <p style={{ color: '#555' }}>{user.email}</p>
        <button type="button" onClick={() => supabase.auth.signOut()}
          style={{ padding: '10px 18px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
          로그아웃
        </button>
      </div>
    );
  }

  return <><SEO noIndex />{children}</>;
}
function LanguageInit() {
  useLanguageDetect();
  return null;
}

function LanguageWrapper({ children }) {
  const { lng } = useParams();
  const location = useLocation();
  const canonicalLng = normalizeLocale(lng);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (canonicalLng && i18n.language !== canonicalLng) {
      i18n.changeLanguage(canonicalLng);
    }
  }, [canonicalLng, i18n]);

  if (canonicalLng !== lng) {
    const segments = location.pathname.split('/');
    segments[1] = canonicalLng;
    return <Navigate replace to={segments.join('/') + location.search + location.hash} state={location.state} />;
  }
  return children;
}

// ✅ [기능 추가] 크롤러 진입 시 타임아웃을 유발하는 동적 페이지 렌더링을 원천 차단
function CrawlerBlocker({ children }) {
  const isCrawler = typeof window !== 'undefined' && navigator.userAgent.includes('ReactSnap');
  if (isCrawler) {
    return <><SEO noIndex /><div style={{ display: 'none' }}>Crawler Blocked</div></>;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <LanguageInit /> 
        
        <MobileGuard>
          <Routes>
            <Route path="/" element={<LanguageWrapper><Main /></LanguageWrapper>} />
            <Route path="/:lng" element={<LanguageWrapper><Main /></LanguageWrapper>} />
            <Route path="/:lng/about" element={<LanguageWrapper><About /></LanguageWrapper>} />
            <Route path="/:lng/editorial-policy" element={<LanguageWrapper><EditorialPolicy /></LanguageWrapper>} />
            <Route path="/:lng/explore" element={<LanguageWrapper><PublicExplore /></LanguageWrapper>} />
            <Route path="/:lng/dictionary" element={<LanguageWrapper><FactorDictionary /></LanguageWrapper>} />
            <Route path="/:lng/jrajsa" element={<LanguageWrapper><JraJsa /></LanguageWrapper>} />
            <Route path="/:lng/regulation" element={<LanguageWrapper><Regulation /></LanguageWrapper>} />
            <Route path="/:lng/riskclassification" element={<LanguageWrapper><RiskClassification /></LanguageWrapper>} />
            <Route path="/:lng/protectiveequipment" element={<LanguageWrapper><ProtectiveEquipment /></LanguageWrapper>} /> 
            <Route path="/:lng/guideline/common" element={<LanguageWrapper><CommonGuide /></LanguageWrapper>} />
            <Route path="/:lng/guideline/construction" element={<LanguageWrapper><ConstructionGuide /></LanguageWrapper>} />
            <Route path="/:lng/guideline/manufacturing" element={<LanguageWrapper><ManufacturingGuide /></LanguageWrapper>} />
            <Route path="/:lng/guideline/chemical" element={<LanguageWrapper><ChemicalGasGuide /></LanguageWrapper>} />
            <Route path="/:lng/guideline/high-risk" element={<LanguageWrapper><HighRiskGuide /></LanguageWrapper>} />
            <Route path="/:lng/guideline/general" element={<LanguageWrapper><GeneralGuide /></LanguageWrapper>} />
            <Route path="/:lng/login" element={<CrawlerBlocker><LanguageWrapper><Login /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/reset-password" element={<CrawlerBlocker><LanguageWrapper><ResetPassword /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/profile" element={<CrawlerBlocker><LanguageWrapper><Profile /></LanguageWrapper></CrawlerBlocker>} /> 
            <Route path="/:lng/library" element={<CrawlerBlocker><LanguageWrapper><MyLibrary /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/info" element={<LanguageWrapper><Info /></LanguageWrapper>} />
            <Route path="/:lng/analysis" element={<CrawlerBlocker><LanguageWrapper><Analysis /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/procedure" element={<CrawlerBlocker><LanguageWrapper><Procedure /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/export" element={<CrawlerBlocker><LanguageWrapper><Export /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/jsa-preview" element={<CrawlerBlocker><LanguageWrapper><JsaSamplePreview /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layoutbuilder" element={<CrawlerBlocker><LanguageWrapper><LayoutBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layout-module" element={<CrawlerBlocker><LanguageWrapper><ModuleBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layout-table" element={<CrawlerBlocker><LanguageWrapper><TableBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/terms" element={<LanguageWrapper><Terms /></LanguageWrapper>} />
            <Route path="/:lng/privacy" element={<LanguageWrapper><Privacy /></LanguageWrapper>} />
            <Route path="/case-study/:id" element={<LanguageWrapper><CaseStudyDetail /></LanguageWrapper>} />
            <Route path="/:lng/case-study/:id" element={<LanguageWrapper><CaseStudyDetail /></LanguageWrapper>} />
            <Route path="/admin/upload" element={<CrawlerBlocker><LanguageWrapper><AdminRoute><AdminPostUpload /></AdminRoute></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/admin/upload" element={<CrawlerBlocker><LanguageWrapper><AdminRoute><AdminPostUpload /></AdminRoute></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/archive" element={<LanguageWrapper><Archive /></LanguageWrapper>} />
          </Routes>
        </MobileGuard>
      </Router>
    </AuthProvider>
  );
}
