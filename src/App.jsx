import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

// ✅ 언어 파라미터를 감지하여 i18n 상태를 동기화하는 래퍼 컴포넌트
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
      <MobileGuard>
        <Routes>
          {/* 1. 언어 코드가 없는 기본 접속 시 리다이렉트 (예: / -> /ko) */}
          <Route path="/" element={<Navigate to="/ko" replace />} />

          {/* 2. 모든 페이지를 /:lng 경로 하위에 배치 */}
          <Route path="/:lng" element={<LanguageWrapper><Main /></LanguageWrapper>} />
          <Route path="/:lng/info" element={<LanguageWrapper><Info /></LanguageWrapper>} />
          <Route path="/:lng/analysis" element={<LanguageWrapper><Analysis /></LanguageWrapper>} />
          <Route path="/:lng/procedure" element={<LanguageWrapper><Procedure /></LanguageWrapper>} />
          <Route path="/:lng/export" element={<LanguageWrapper><Export /></LanguageWrapper>} />
          <Route path="/:lng/about" element={<LanguageWrapper><About /></LanguageWrapper>} />
          <Route path="/:lng/terms" element={<LanguageWrapper><Terms /></LanguageWrapper>} />
          <Route path="/:lng/privacy" element={<LanguageWrapper><Privacy /></LanguageWrapper>} />
          <Route path="/:lng/jrajsa" element={<LanguageWrapper><JraJsa /></LanguageWrapper>} />
          <Route path="/:lng/jsa-preview" element={<LanguageWrapper><JsaSamplePreview /></LanguageWrapper>} />
          <Route path="/:lng/regulation" element={<LanguageWrapper><Regulation /></LanguageWrapper>} />
          <Route path="/:lng/riskclassification" element={<LanguageWrapper><RiskClassification /></LanguageWrapper>} />
          <Route path="/:lng/protectiveequipment" element={<LanguageWrapper><ProtectiveEquipment /></LanguageWrapper>} />
          <Route path="/:lng/login" element={<LanguageWrapper><Login /></LanguageWrapper>} />
          <Route path="/:lng/reset-password" element={<LanguageWrapper><ResetPassword /></LanguageWrapper>} />
          <Route path="/:lng/library" element={<LanguageWrapper><MyLibrary /></LanguageWrapper>} />

          <Route path="/:lng/guideline/construction" element={<LanguageWrapper><ConstructionGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/high-risk" element={<LanguageWrapper><HighRiskGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/general" element={<LanguageWrapper><GeneralGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/manufacturing" element={<LanguageWrapper><ManufacturingGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/chemical" element={<LanguageWrapper><ChemicalGasGuide /></LanguageWrapper>} />
          <Route path="/:lng/guideline/common" element={<LanguageWrapper><CommonGuide /></LanguageWrapper>} />
          <Route path="/:lng/dictionary" element={<LanguageWrapper><FactorDictionary /></LanguageWrapper>} />
          <Route path="/:lng/layoutbuilder" element={<LanguageWrapper><LayoutBuilder /></LanguageWrapper>} />
          
          <Route path="/:lng/layout-module" element={<LanguageWrapper><ModuleBuilder /></LanguageWrapper>} />
          <Route path="/:lng/layout-table" element={<LanguageWrapper><TableBuilder /></LanguageWrapper>} />

          <Route path="/:lng/profile" element={<LanguageWrapper><Profile /></LanguageWrapper>} /> 
          <Route path="/:lng/explore" element={<LanguageWrapper><PublicExplore /></LanguageWrapper>} />
        </Routes>
      </MobileGuard>
    </Router>
  );
}