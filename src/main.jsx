import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n';

const rootElement = document.getElementById('root');

// 사전 렌더링된 DOM과 현재 라우트의 상태 불일치(Hydration Mismatch)로 인한 
// react-snap 크래시(Error #418)를 원천 방지하기 위해 렌더링 전 컨테이너를 강제 초기화합니다.
if (rootElement.hasChildNodes()) {
  rootElement.innerHTML = '';
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);