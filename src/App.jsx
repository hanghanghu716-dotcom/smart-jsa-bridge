import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import MyLibrary from './pages/MyLibrary'; // 신규 컴포넌트
/* 가이드 페이지 임포트 */
import ConstructionGuide from './pages/guideline/ConstructionGuide';
import HighRiskGuide from './pages/guideline/HighRiskGuide';
import GeneralGuide from './pages/guideline/GeneralGuide';
import ManufacturingGuide from './pages/guideline/ManufacturingGuide';
import ChemicalGasGuide from './pages/guideline/ChemicalGasGuide';
import CommonGuide from './pages/guideline/CommonGuide';
import Login from './pages/Login'; 
import ResetPassword from './pages/ResetPassword'; 
import ProfileSettings from './components/ProfileSettings';
import PublicExplore from './components/PublicExplore';

function App() {
  return (
    <Router>
      <MobileGuard>
        <Routes>
          {/* 기본 서비스 경로 */}
          <Route path="/" element={<Main />} />
          <Route path="/procedure" element={<Procedure />} />
          <Route path="/info" element={<Info />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/jrajsa" element={<JraJsa />} />
          <Route path="/export" element={<Export />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/jsasamplepreview" element={<JsaSamplePreview />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/regulation" element={<Regulation />} />
          <Route path="/riskclassification" element={<RiskClassification />} />
          <Route path="/protectiveequipment" element={<ProtectiveEquipment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/library" element={<MyLibrary />} />


          {/* JSA 가이드 섹션 - 경로를 /guideline/으로 통일 */}
          <Route path="/guideline/construction" element={<ConstructionGuide />} />
          <Route path="/guideline/high-risk" element={<HighRiskGuide />} />
          <Route path="/guideline/general" element={<GeneralGuide />} />
          <Route path="/guideline/manufacturing" element={<ManufacturingGuide />} />
          <Route path="/guideline/chemical" element={<ChemicalGasGuide />} />
          <Route path="/guideline/common" element={<CommonGuide />} />

          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/explore" element={<PublicExplore />} />
        </Routes>
      </MobileGuard>
    </Router>
  );
}

export default App;