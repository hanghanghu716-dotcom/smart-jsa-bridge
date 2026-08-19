import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

/**
 * ✅ react-helmet-async를 적용한 글로벌 SEO 컴포넌트
 * 구글 크롤러가 인식할 수 있도록 선언적으로 메타 태그를 렌더링합니다.
 */
const SEO = ({ pageTitle, pageDescription }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://smartjsabridge.com";
  const supportedLangs = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR', 'es-ES', 'ru-RU'];
  const currentLang = i18n.language;
  
  // URL 끝의 불필요한 슬래시 정규화
  const cleanPathname = location.pathname.replace(/\/$/, '');
  
  // 순수 경로 추출
  const segments = cleanPathname.split('/');
  const purePath = supportedLangs.includes(segments[1]) 
    ? segments.slice(2).join('/') 
    : segments.slice(1).join('/');

  // 제목 및 설명 업데이트
  const finalTitle = pageTitle || t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment');
  const finalDescription = pageDescription || t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform');
  const pathSuffix = purePath ? `/${purePath}` : '';

  return (
    <Helmet htmlAttributes={{ lang: currentLang.split('-')[0] }}>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={`${baseUrl}${cleanPathname}`} />
      
      {/* Twitter Tags */}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />

      {/* Canonical URL */}
      <link rel="canonical" href={`${baseUrl}${cleanPathname}`} />
      
      {/* x-default 설정 (한국어 기준) */}
      <link rel="alternate" hreflang="x-default" href={`${baseUrl}/ko${pathSuffix}`} />
      
      {/* 다국어 hreflang 지원 */}
      {supportedLangs.map((lang) => (
        <link 
          key={lang} 
          rel="alternate" 
          hreflang={lang} 
          href={`${baseUrl}/${lang}${pathSuffix}`} 
        />
      ))}
    </Helmet>
  );
};

export default SEO;