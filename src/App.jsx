import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import Info from './pages/Info';
import Analysis from './pages/Analysis';
import Export from './pages/Export';
import Procedure from './pages/Procedure';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    <Router>
      <Routes>
        {/* 각 경로(Path)에 맞는 컴포넌트를 연결합니다 */}
        <Route path="/" element={<Main />} />
        <Route path="/procedure" element={<Procedure />} />
        <Route path="/info" element={<Info />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/export" element={<Export />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

      </Routes>
    </Router>
  );
}

export default App;