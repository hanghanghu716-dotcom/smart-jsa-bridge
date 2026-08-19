import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client' // hydrateRoot 추가
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import App from './App.jsx'
import './i18n';

const rootElement = document.getElementById('root');

// react-snap에 의해 사전 생성된 정적 HTML이 존재하는 경우 (운영 환경)
if (rootElement.hasChildNodes()) {
  hydrateRoot(
    rootElement,
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
} else {
  // 정적 HTML이 없는 경우 (로컬 개발 환경 등)
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>
  );
}
    //fd