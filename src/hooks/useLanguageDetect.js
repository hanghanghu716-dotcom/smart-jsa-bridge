import { detectLanguage, SUPPORTED_LANGS, normalizeLocale } from '../locales/config.js';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18n from 'i18next';

/**
 * ✅ useLanguageDetect Hook
 * 역할: 도메인 루트(/) 진입 시 사용자의 브라우저 언어를 감지하여 적절한 언어 경로로 리다이렉트
 */
export const useLanguageDetect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. 오직 루트 경로('/')로 접속했을 때만 자동 감지 로직을 실행함
    if (location.pathname === '/' || location.pathname === '') {
      const browserLang = navigator.language || navigator.userLanguage || '';
      let savedLanguage;
      try {
        savedLanguage = normalizeLocale(window.localStorage.getItem('i18nextLng'));
      } catch {
        // Browser privacy settings may disable storage.
      }
      const targetLang = SUPPORTED_LANGS.includes(savedLanguage) ? savedLanguage : detectLanguage(browserLang);

      // 4. i18n 상태를 해당 언어로 동기화한 후 언어 경로로 즉시 리다이렉트
      if (i18n.language !== targetLang) {
        i18n.changeLanguage(targetLang);
      }
      
      navigate(`/${targetLang}`, { replace: true });
    }
  }, [location.pathname, navigate]);
};