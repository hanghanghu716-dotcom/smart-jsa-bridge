import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * ✅ 모든 페이지에 공통으로 적용될 글로벌 SEO 컴포넌트
 * 개별 페이지에서 pageTitle과 pageDescription을 Props로 전달받아 동적 할당 지원
 */
const SEO = ({ pageTitle, pageDescription }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://smartjsabridge.com";
  const supportedLangs = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR', 'es-ES', 'ru-RU'];

  useEffect(() => {
    const currentLang = i18n.language;
    
    // 1. 순수 경로 추출
    const segments = location.pathname.split('/');
    const purePath = supportedLangs.includes(segments[1]) 
      ? segments.slice(2).join('/') 
      : segments.slice(1).join('/');

    // 2. 제목 업데이트 (Props 우선 적용, 없을 시 Fallback 사용)
    const finalTitle = pageTitle || t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment');
    const finalDescription = pageDescription || t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform');

    document.title = finalTitle;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    }

    // 3. 메타 태그 업데이트 함수
    const updateMeta = (property, content) => {
      const el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (el) el.setAttribute('content', content);
    };

    updateMeta('og:title', finalTitle);
    updateMeta('og:description', finalDescription);
    updateMeta('og:url', `${baseUrl}${location.pathname}`);
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDescription);

    // 4. 기존 태그 제거 (중복 방지)
    const existingAlternates = document.querySelectorAll('link[rel="alternate"], link[rel="canonical"]');
    existingAlternates.forEach(tag => tag.remove());

    // 5. hreflang 삽입 (경로 슬래시 중복 방지)
    const pathSuffix = purePath ? `/${purePath}` : '';
    supportedLangs.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${baseUrl}/${lang}${pathSuffix}`;
      document.head.appendChild(link);
    });

    // 6. x-default 설정 (한국어 기준)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}/ko${pathSuffix}`;
    document.head.appendChild(defaultLink);

    // 7. Canonical 설정
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = `${baseUrl}${location.pathname}`;
    document.head.appendChild(canonicalLink);

    // 8. HTML lang 속성 동기화
    document.documentElement.lang = currentLang.split('-')[0];

  }, [location.pathname, i18n.language, t, pageTitle, pageDescription]);

  return null;
};

export default SEO;