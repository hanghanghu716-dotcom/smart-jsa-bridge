import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * ✅ 모든 페이지에 공통으로 적용될 글로벌 SEO 컴포넌트
 */
const SEO = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://easyjsa.cloud";
  const supportedLangs = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR'];

  useEffect(() => {
    const currentLang = i18n.language;
    
    // 1. 순수 경로 추출
    const segments = location.pathname.split('/');
    const purePath = supportedLangs.includes(segments[1]) 
      ? segments.slice(2).join('/') 
      : segments.slice(1).join('/');

    // 2. 제목 업데이트 (Fallback을 '지능형 위험성평가'로 구체화)
    document.title = t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment');
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform'));
    }

    // 3. 메타 태그 업데이트 함수
    const updateMeta = (property, content) => {
      const el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (el) el.setAttribute('content', content);
    };

    updateMeta('og:title', t('seo.ogTitle', document.title));
    updateMeta('og:description', t('seo.description'));
    updateMeta('og:url', `${baseUrl}${location.pathname}`);
    updateMeta('twitter:title', t('seo.ogTitle', document.title));
    updateMeta('twitter:description', t('seo.description'));

    // 4. 기존 태그 제거
    const existingAlternates = document.querySelectorAll('link[rel="alternate"], link[rel="canonical"]');
    existingAlternates.forEach(tag => tag.remove());

    // 5. hreflang 삽입
    supportedLangs.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${baseUrl}/${lang}/${purePath}`;
      document.head.appendChild(link);
    });

    // 6. x-default 설정 (한국어 기준)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${baseUrl}/ko/${purePath}`;
    document.head.appendChild(defaultLink);

    // 7. Canonical 설정
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = `${baseUrl}${location.pathname}`;
    document.head.appendChild(canonicalLink);

    // 8. HTML lang 속성 동기화
    document.documentElement.lang = currentLang.split('-')[0];

  }, [location.pathname, i18n.language, t]);

  return null;
};

export default SEO;