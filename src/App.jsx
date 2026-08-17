import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';

import Main from './pages/Main';
import Info from './pages/Info';
import Analysis from './pages/Analysis';
import Export from './pages/Export';
import Procedure from './pages/Procedure';
import About from './pages/About';
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

import { useLanguageDetect } from './hooks/useLanguageDetect';

/**
 * ✅ 비밀코드 인증을 통한 관리자 라우트 컴포넌트
 */
function AdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === 'cnshcnsh2@') {
      setIsAuthenticated(true);
    } else {
      alert('비밀코드가 일치하지 않습니다.');
      setPasscode('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '200px 24px', textAlign: 'center', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        <h2 style={{ marginBottom: '20px', color: '#111', fontSize: '1.5rem', fontWeight: 'bold' }}>관리자 접근</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="비밀코드를 입력하세요"
            style={{ padding: '12px', width: '280px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1rem', outline: 'none', color: '#111', backgroundColor: '#fff' }}
            autoFocus
          />
          <button type="submit" style={{ padding: '12px 24px', width: '280px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
            인증 및 접속
          </button>
        </form>
      </div>
    );
  }

  return children;
}

function LanguageInit() {
  useLanguageDetect();
  return null;
}

function LanguageWrapper({ children }) {
  const { lng } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  }, [lng, i18n]);

  return children;
}

// ✅ [기능 추가] 크롤러 진입 시 타임아웃을 유발하는 동적 페이지 렌더링을 원천 차단
function CrawlerBlocker({ children }) {
  const isCrawler = typeof window !== 'undefined' && navigator.userAgent.includes('ReactSnap');
  if (isCrawler) {
    return <div style={{ display: 'none' }}>Crawler Blocked</div>;
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
<Route path="/:lng/explore" element={<CrawlerBlocker><LanguageWrapper><PublicExplore /></LanguageWrapper></CrawlerBlocker>} />
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
            <Route path="/:lng/info" element={<CrawlerBlocker><LanguageWrapper><Info /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/analysis" element={<CrawlerBlocker><LanguageWrapper><Analysis /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/procedure" element={<CrawlerBlocker><LanguageWrapper><Procedure /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/export" element={<CrawlerBlocker><LanguageWrapper><Export /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/jsa-preview" element={<CrawlerBlocker><LanguageWrapper><JsaSamplePreview /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layoutbuilder" element={<CrawlerBlocker><LanguageWrapper><LayoutBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layout-module" element={<CrawlerBlocker><LanguageWrapper><ModuleBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/layout-table" element={<CrawlerBlocker><LanguageWrapper><TableBuilder /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/terms" element={<LanguageWrapper><Terms /></LanguageWrapper>} />
            <Route path="/:lng/privacy" element={<LanguageWrapper><Privacy /></LanguageWrapper>} />
            <Route path="/:lng/case-study/:id" element={<LanguageWrapper><CaseStudyDetail /></LanguageWrapper>} />
            <Route path="/:lng/admin/upload" element={<CrawlerBlocker><LanguageWrapper><AdminRoute><AdminPostUpload /></AdminRoute></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/archive" element={<LanguageWrapper><Archive /></LanguageWrapper>} />
          </Routes>
        </MobileGuard>
      </Router>
    </AuthProvider>
  );
}