import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client' // hydrateRoot 추가
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import App from './App.jsx'
import './i18n';

const rootElement = document.getElementById('root');

// 빌드 시점에 실행되는 react-snap 봇인지 여부 판별
const isReactSnap = navigator.userAgent.includes('ReactSnap');

if (rootElement.hasChildNodes() && !isReactSnap) {
  // 1. 실제 운영 환경 (일반 유저 및 구글 검색 엔진 봇) -> Hydration 적용하여 SEO 및 성능 유지
  hydrateRoot(
    rootElement,
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
} else {
  // 2. react-snap 빌드 환경 또는 로컬 개발 환경 -> 일반 렌더링
  // 중복 크롤링 시 발생하는 Error #418 크래시 방지를 위해 컨테이너 강제 초기화
  if (isReactSnap && rootElement.hasChildNodes()) {
    rootElement.innerHTML = '';
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
}