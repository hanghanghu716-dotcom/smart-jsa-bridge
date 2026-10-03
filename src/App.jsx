import { normalizeLocale } from './locales/config.js';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
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
import PublicJsa from './pages/PublicJsa';
import Business from './pages/Business';
import Community from './pages/Community';
import Authors from './pages/Authors';
import WorkPackages from './pages/WorkPackages';
import { communityAction } from './services/communityService';
import LayoutBuilder from './pages/LayoutBuilder';
import FactorDictionary from './pages/FactorDictionary';
import ModuleBuilder from './pages/ModuleBuilder';
import TableBuilder from './pages/TableBuilder';
import DocumentDesigner from './pages/DocumentDesigner';
import CaseStudyDetail from './pages/CaseStudyDetail';
import AdminPostUpload from './pages/AdminPostUpload';
import Archive from './pages/Archive';
import SEO from './components/SEO';

import { useLanguageDetect } from './hooks/useLanguageDetect';

function AdminRoute({ children }) {
  const [allowed, setAllowed] = useState(null);
  const { i18n } = useTranslation();
  useEffect(() => { let live=true; communityAction('status').then(value=>{if(live)setAllowed(value.admin === true);}).catch(()=>{if(live)setAllowed(false);}); return()=>{live=false;}; }, []);
  if (allowed === null) return <><SEO noIndex /><p role="status">…</p></>;
  if (!allowed) return <Navigate replace to={'/'+normalizeLocale(i18n.language)+'/community'} />;
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
            <Route path="/:lng/explore" element={<LanguageWrapper><PublicExplore /></LanguageWrapper>} />
            <Route path="/:lng/community" element={<CrawlerBlocker><LanguageWrapper><Community /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/business" element={<CrawlerBlocker><LanguageWrapper><Business /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/public-jsa/:id" element={<LanguageWrapper><PublicJsa /></LanguageWrapper>} />
            <Route path="/:lng/authors/:id" element={<LanguageWrapper><Authors /></LanguageWrapper>} />
            <Route path="/:lng/following" element={<CrawlerBlocker><LanguageWrapper><Authors /></LanguageWrapper></CrawlerBlocker>} />
            <Route path="/:lng/work-packages" element={<CrawlerBlocker><LanguageWrapper><WorkPackages /></LanguageWrapper></CrawlerBlocker>} />
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
            <Route path="/:lng/document-designer" element={<CrawlerBlocker><LanguageWrapper><DocumentDesigner /></LanguageWrapper></CrawlerBlocker>} />
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
