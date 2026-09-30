import { cleanSummary } from '../utils/content.js';
import { SUPPORTED_LANGS, SEO_LANGUAGES, getLanguageTag, getSeoLocale, normalizeLocale } from '../locales/config.js';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const SEO = ({ pageTitle, pageDescription, canonicalLocale, availableLocales, noIndex = false }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation('main');

  const baseUrl = "https://smartjsabridge.com";
// URL 코드와 검색엔진용 언어 태그를 구분
  const supportedLangs = SUPPORTED_LANGS;
  const pathLang = normalizeLocale(location.pathname.split('/')[1]);
  const selectedLang = SUPPORTED_LANGS.includes(pathLang) ? pathLang : (i18n.language || 'en-US');
  const contentLocale = normalizeLocale(canonicalLocale);
  const currentLang = SUPPORTED_LANGS.includes(contentLocale) ? contentLocale : selectedLang;
  const languageTag = getLanguageTag(currentLang);

  // 1. 순수 경로 추출 (언어 코드 제거) ,
  const segments = location.pathname.split('/');
  const purePath = supportedLangs.includes(segments[1]) 
    ? segments.slice(2).filter(Boolean).join('/') 
    : segments.slice(1).filter(Boolean).join('/');

  // 2. 제목 및 설명 동적 할당 (Props 우선, 없을 시 다국어 번역본 사용)
  const pageMetadata = {
    regulation: ['regulation', ['hero.mainTitle'], ['hero.subTitle']],
    jrajsa: ['jrajsa', ['hero.title1', 'hero.title2'], ['hero.subTitle1', 'hero.subTitle2']],
    protectiveequipment: ['ppe', ['hero.title1', 'hero.title2'], ['hero.subTitle1', 'hero.subTitle2', 'hero.subTitle3']],
    riskclassification: ['risk', ['ui.mainTitle1', 'ui.mainTitle2'], ['ui.subTitle1', 'ui.subTitle2']],
    dictionary: ['dictionary', ['hero.titleLine1', 'hero.titleLine2'], ['hero.seoText2']],
    about: ['about', ['mainHeading.line1', 'mainHeading.line2'], ['section1.content']],
    privacy: ['privacy', ['heading.line1'], ['section1.content']],
    terms: ['terms', ['heading'], ['subHeading']],
  }[purePath];
  const plainText = value => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const translate = (keys, ns) => keys.map(key => i18n.getFixedT(currentLang, ns)(key, { defaultValue: '' })).join(' ');
  const routeTitle = pageMetadata ? plainText(translate(pageMetadata[1], pageMetadata[0])) : '';
  const routeDescription = pageMetadata ? plainText(translate(pageMetadata[2], pageMetadata[0])) : '';
  const finalTitle = pageTitle || (routeTitle ? routeTitle + ' | Smart JSA Bridge' : t('seo.title', 'Smart JSA Bridge | Intelligent Risk Assessment'));
  const finalDescription = cleanSummary(plainText(pageDescription || routeDescription || t('seo.description', 'Intelligent and Data-driven Risk Assessment Platform')));
  const privatePage = /^(?:login|reset-password|profile|library|info|analysis|procedure|export|jsa-preview|layoutbuilder|layout-module|layout-table|document-designer|admin)(?:\/|$)/.test(purePath);
  const alternates = SEO_LANGUAGES.filter(lang => availableLocales === undefined
    ? !purePath.startsWith('case-study/')
    : availableLocales.some(locale => normalizeLocale(locale) === getSeoLocale(lang)));
  const hasDefault = alternates.includes('en-US');

  // 3. 현재 URL 동적 조합
  const pathSuffix = purePath ? `/${purePath}` : '';
  const currentUrl = `${baseUrl}/${currentLang}${pathSuffix}`;

  return (
    <Helmet>
      <html lang={languageTag} dir={languageTag.startsWith('ar') ? 'rtl' : 'ltr'} />
      <meta name="robots" content={noIndex || privatePage ? 'noindex,follow' : 'index,follow'} />
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
      {alternates.map(lang => (
        <link 
          key={lang} 
          rel="alternate" 
          hrefLang={lang} 
          href={`${baseUrl}/${getSeoLocale(lang)}${pathSuffix}`}
        />
      ))}
      {/* 기본 언어 폴백 (x-default) */}
      {hasDefault && <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en-US${pathSuffix}`} />}    </Helmet>
  );
};

export default SEO;
