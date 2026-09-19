import { SUPPORTED_LANGS, SEO_LANGUAGES, getLanguageTag, getSeoLocale, normalizeLocale } from '../locales/config.js';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const SEO = ({ pageTitle, pageDescription }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://smartjsabridge.com";
// URL 코드와 검색엔진용 언어 태그를 구분
  const supportedLangs = SUPPORTED_LANGS;
  const pathLang = normalizeLocale(location.pathname.split('/')[1]);
  const currentLang = SUPPORTED_LANGS.includes(pathLang) ? pathLang : (i18n.language || 'ko');
  const languageTag = getLanguageTag(currentLang);

  // 1. 순수 경로 추출 (언어 코드 제거) ,
  const segments = location.pathname.split('/');
  const purePath = supportedLangs.includes(segments[1]) 
    ? segments.slice(2).join('/') 
    : segments.slice(1).join('/');

  // 2. 제목 및 설명 동적 할당 (Props 우선, 없을 시 다국어 번역본 사용)
  const finalTitle = pageTitle || t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment');
  const finalDescription = pageDescription || t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform');

  // 3. 현재 URL 동적 조합
  const pathSuffix = purePath ? `/${purePath}` : '';
  const currentUrl = `${baseUrl}/${currentLang}${pathSuffix}`;

  return (
    <Helmet>
      <html lang={languageTag} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />

      {/* Open Graph 메타 태그 */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={languageTag === 'ko' ? 'ko_KR' : languageTag.replace('-', '_')} />
      <meta property="og:type" content="website" />

      {/* Twitter 카드 메타 태그 */}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Canonical (표준) 태그: 자가 참조 원칙 준수 */}
      <link rel="canonical" href={currentUrl} />

      {/* 다국어 Hreflang 태그 동적 생성 */}
      {SEO_LANGUAGES.map(lang => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang} 
          href={`${baseUrl}/${getSeoLocale(lang)}${pathSuffix}`}
        />
      ))}
      {/* 기본 언어 폴백 (x-default) */}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en-US${pathSuffix}`} />    </Helmet>
  );
};

export default SEO;