import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18n from 'i18next';

/**
 * ✅ 지원하는 글로벌 언어 규격 정의
 */
const SUPPORTED_LANGS = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR', 'es-ES', 'ru-RU'];
const DEFAULT_LANG = 'ko';

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
      const browserLang = navigator.language || navigator.userLanguage; 
      
      // 2. 브라우저 언어 코드와 지원 언어 목록 매칭
      let targetLang = SUPPORTED_LANGS.find(lang => 
        lang.toLowerCase() === browserLang.toLowerCase()
      );

      if (!targetLang) {
        const langPrefix = browserLang.split('-')[0].toLowerCase();
        targetLang = SUPPORTED_LANGS.find(lang => 
          lang.toLowerCase().startsWith(langPrefix)
        );
      }

      // 3. 지원하지 않는 언어권일 경우 기본값(한국어)으로 배정
      if (!targetLang) targetLang = DEFAULT_LANG;

      // 4. i18n 상태를 해당 언어로 동기화한 후 언어 경로로 즉시 리다이렉트
      if (i18n.language !== targetLang) {
        i18n.changeLanguage(targetLang);
      }
      
      navigate(`/${targetLang}`, { replace: true });
    }
  }, [location.pathname, navigate]);
};