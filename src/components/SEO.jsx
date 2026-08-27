import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

/**
 * react-helmet-async를 적용한 글로벌 SEO 컴포넌트
 * URL 경로 기반의 동적 다국어 식별 및 Canonical/hreflang 표준 태그를 생성합니다.
 */
const SEO = ({ pageTitle, pageDescription }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://smartjsabridge.com";
  const supportedLangs = ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR', 'es-ES', 'ru-RU'];
  
  // 1. URL 경로에서 앞뒤 슬래시를 완벽히 제거 후 분할
  const cleanPath = location.pathname.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath ? cleanPath.split('/') : [];
  
  // 2. URL의 첫 세그먼트에서 언어 코드 판별 (없으면 i18n 또는 기본값 사용)
  let detectedLang = 'ko';
  let pureSegments = segments;

  if (segments.length > 0 && supportedLangs.includes(segments[0])) {
    detectedLang = segments[0];
    pureSegments = segments.slice(1);
  } else if (i18n.language && supportedLangs.includes(i18n.language)) {
    detectedLang = i18n.language;
  }

  // 3. 언어 코드를 제외한 순수 콘텐츠 경로 및 실제 정규 주소 조립
  const purePath = pureSegments.length > 0 ? `/${pureSegments.join('/')}` : '';
  const currentCanonical = segments.length > 0 
    ? `${baseUrl}/${segments.join('/')}` 
    : `${baseUrl}/${detectedLang}`;

  // 제목 및 설명 설정
  const finalTitle = pageTitle || t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment');
  const finalDescription = pageDescription || t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform');

  return (
    <Helmet htmlAttributes={{ lang: detectedLang.split('-')[0] }}>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={currentCanonical} />
      
      {/* Twitter Tags */}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />

      {/* 1. 현재 접속된 정확한 URL을 Canonical로 고정 */}
      <link rel="canonical" href={currentCanonical} />
      
      {/* 2. x-default 설정 (영문 기본 버전 지정) */}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en-US${purePath}`} />
      
      {/* 3. 모든 지원 언어에 대한 alternate 태그 동적 매핑 */}
      {supportedLangs.map((lang) => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang} 
          href={`${baseUrl}/${lang}${purePath}`} 
        />
      ))}
    </Helmet>
  );
};

export default SEO;