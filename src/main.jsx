import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import './theme/theme.css'
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App.jsx'
import './i18n';
import { captureCaseBootstrap, clearPrerenderedCaseMetadata } from './utils/caseBootstrap.js';

const rootElement = document.getElementById('root');

// 빌드 시점에 실행되는 react-snap 봇인지 여부 판별
const isReactSnap = navigator.userAgent.includes('ReactSnap');
const isCasePage = /^\/[^/]+\/case-study\/[^/]+\/?$/.test(window.location.pathname);
if (!isReactSnap) {
  if (isCasePage) captureCaseBootstrap(document, window.location.pathname);
}
// react-snap can load a previously captured index.html for the next route.
// Remove inherited head metadata before every fresh React root, including builds.
clearPrerenderedCaseMetadata(document);

// react-snap captures settled effects and minifies inline styles. Its output
// is initial HTML for readers/crawlers, not React's first-render state (for
// example Main already contains fetched cards). Mount a fresh client tree;
// article data captured above keeps article content available immediately.
if (isReactSnap && rootElement.hasChildNodes()) {
  rootElement.innerHTML = '';
}

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider><App /></ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
