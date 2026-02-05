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

function App() {
  return (
    <Router>
      {/* 전역 모바일 차단 가드 적용 */}
      <MobileGuard>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/procedure" element={<Procedure />} />
          <Route path="/info" element={<Info />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/export" element={<Export />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </MobileGuard>
    </Router>
  );
}

export default App;