import { useNavigate, useLocation, Link as ReactRouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * ✅ 현재 언어 코드를 포함하여 이동하는 커스텀 navigate 훅
 */
export function useLanguageNavigate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (to, options) => {
    // 이미 언어 코드가 포함되어 있거나 외부 링크인 경우 제외
    if (to.startsWith('/ko') || to.startsWith('/en') || to.startsWith('http')) {
      return navigate(to, options);
    }
    // 현재 언어를 접두사로 붙여서 이동 (예: /info -> /ko/info)
    const langPath = `/${i18n.language}${to.startsWith('/') ? to : `/${to}`}`;
    navigate(langPath, options);
  };
}

/**
 * ✅ 현재 언어 코드를 자동으로 링크에 붙여주는 컴포넌트
 */
export function LanguageLink({ to, children, ...props }) {
  const { i18n } = useTranslation();
  
  const getLangPath = (path) => {
    if (path.startsWith('/ko') || path.startsWith('/en') || path.startsWith('http')) {
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