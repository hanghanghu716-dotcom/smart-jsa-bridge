import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// 페이지 및 컴포넌트 임포트
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

// 글로벌 커스텀 훅 임포트
import { useLanguageDetect } from './hooks/useLanguageDetect';

/**
 * ✅ [수정] 언어 감지 및 리다이렉션을 실행하는 전 전용 컴포넌트
 * <Router>의 자식으로 배치하여 useNavigate 에러를 해결합니다.
 */
function LanguageInit() {
  useLanguageDetect();
  return null;
}

/**
 * ✅ 언어 파라미터를 감지하여 i18n 상태를 동기화하는 래퍼
 */
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

export default function App() {
  return (
    <Router>
      <LanguageInit /> 
      
      <MobileGuard>
        <Routes>
          <Route path="/" element={<div style={{ backgroundColor: '#000', minHeight: '100vh' }} />} />

          <Route path="/:lng" element={<LanguageWrapper><Main /></LanguageWrapper>} />
          <Route path="/:lng/about" element={<LanguageWrapper><About /></LanguageWrapper>} />
          <Route path="/:lng/explore" element={<LanguageWrapper><PublicExplore /></LanguageWrapper>} />
          <Route path="/:lng/dictionary" element={<LanguageWrapper><FactorDictionary /></LanguageWrapper>} />
          <Route path="/:lng/jrajsa" element={<LanguageWrapper><JraJsa /></LanguageWrapper>} />
          <Route path="/:lng/regulation" element={<LanguageWrapper><Regulation /></LanguageWrapper>} />
          <Route path="/:lng/riskclassification" element={<LanguageWrapper><RiskClassification /></LanguageWrapper>} />
          <Route path="/:lng/protectiveequipment" element={<LanguageWrapper><ProtectiveEquipment /></LanguageWrapper>} /> 
         <Route path="/:lng/guideline/common" element={<LanguageWrapper><CommonGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/const" element={<LanguageWrapper><ConstructionGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/manu" element={<LanguageWrapper><ManufacturingGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/chem" element={<LanguageWrapper><ChemicalGasGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/highrisk" element={<LanguageWrapper><HighRiskGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/general" element={<LanguageWrapper><GeneralGuide /></LanguageWrapper>} />
          <Route path="/:lng/login" element={<LanguageWrapper><Login /></LanguageWrapper>} />
          <Route path="/:lng/reset-password" element={<LanguageWrapper><ResetPassword /></LanguageWrapper>} />
          <Route path="/:lng/profile" element={<LanguageWrapper><Profile /></LanguageWrapper>} /> 
          <Route path="/:lng/library" element={<LanguageWrapper><MyLibrary /></LanguageWrapper>} />
          <Route path="/:lng/info" element={<LanguageWrapper><Info /></LanguageWrapper>} />
          <Route path="/:lng/analysis" element={<LanguageWrapper><Analysis /></LanguageWrapper>} />
          <Route path="/:lng/procedure" element={<LanguageWrapper><Procedure /></LanguageWrapper>} />
          <Route path="/:lng/export" element={<LanguageWrapper><Export /></LanguageWrapper>} />
          <Route path="/:lng/jsa-preview" element={<LanguageWrapper><JsaSamplePreview /></LanguageWrapper>} />
          <Route path="/:lng/layoutbuilder" element={<LanguageWrapper><LayoutBuilder /></LanguageWrapper>} />
          <Route path="/:lng/layout-module" element={<LanguageWrapper><ModuleBuilder /></LanguageWrapper>} />
          <Route path="/:lng/layout-table" element={<LanguageWrapper><TableBuilder /></LanguageWrapper>} />
          <Route path="/:lng/terms" element={<LanguageWrapper><Terms /></LanguageWrapper>} />
          <Route path="/:lng/privacy" element={<LanguageWrapper><Privacy /></LanguageWrapper>} />
        </Routes>
      </MobileGuard>
    </Router>
  );
}