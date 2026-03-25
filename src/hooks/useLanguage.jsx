import { useCallback } from 'react';
import { useNavigate, Link as ReactRouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// 지원하는 언어 목록 (App.jsx와 동일하게 유지)
const SUPPORTED_LANGS = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR'];

const hasLangPrefix = (path) => {
  return SUPPORTED_LANGS.some(lang => path.startsWith(`/${lang}`));
};

/**
 * ✅ 1. 현재 언어 코드를 포함하여 이동하는 커스텀 navigate 훅
 */
export function useLanguageNavigate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return useCallback((to, options) => {
    if (typeof to !== 'string' || hasLangPrefix(to) || to.startsWith('http')) {
      return navigate(to, options);
    }
    const langPath = `/${i18n.language}${to.startsWith('/') ? to : `/${to}`}`;
    navigate(langPath, options);
  }, [navigate, i18n.language]);
}

/**
 * ✅ 2. 현재 언어 코드를 자동으로 링크에 붙여주는 컴포넌트 (에러 발생 지점)
 * Main.jsx에서 'LanguageLink'를 찾지 못했던 원인은 이 코드가 누락되었기 때문입니다.
 */
export function LanguageLink({ to, children, ...props }) {
  const { i18n } = useTranslation();
  
  const getLangPath = (path) => {
    if (hasLangPrefix(path) || path.startsWith('http')) {
      return path;
    }
    return `/${i18n.language}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <ReactRouterLink to={getLangPath(to)} {...props}>
      {children}
    </ReactRouterLink>
  );
}