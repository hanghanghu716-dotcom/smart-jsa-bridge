import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import Info from './pages/Info';
import Analysis from './pages/Analysis';
import Export from './pages/Export';
import Procedure from './pages/Procedure';

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
      </Routes>
    </Router>
  );
}

export default App;