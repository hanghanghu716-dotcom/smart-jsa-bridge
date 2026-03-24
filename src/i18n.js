import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. 한국어(KO) 리소스 임포트
import koMain from './locales/ko/main.json';
import koExplore from './locales/ko/explore.json';
import koTags from './locales/ko/tags.json';
import koAbout from './locales/ko/about.json';
import koAnalysis from './locales/ko/analysis.json'; 
import koInfo from './locales/ko/info.json'; 
import koProcedure from './locales/ko/procedure.json'; 
import koModulebuilder from './locales/ko/modulebuilder.json'; 
import koTablebuilder from './locales/ko/tablebuilder.json'; 
import koExport from './locales/ko/export.json';
import koLogin from './locales/ko/login.json';
import koDictionary from './locales/ko/dictionary.json';
import koTerms from './locales/ko/terms.json';
import koMyLibrary from './locales/ko/mylibrary.json';
import koRegulation from './locales/ko/regulation.json';
import koJrajsa from './locales/ko/jrajsa.json';

// 2. 영어(US) 리소스 임포트
import enUSMain from './locales/en-US/main.json';
import enUSExplore from './locales/en-US/explore.json';
import enUSTags from './locales/en-US/tags.json';
import enUSAbout from './locales/en-US/about.json';
import enUSAnalysis from './locales/en-US/analysis.json'; 
import enUSInfo from './locales/en-US/info.json'; 
import enUSProcedure from './locales/en-US/procedure.json'; 
import enUSModulebuilder from './locales/en-US/modulebuilder.json'; 
import enUSTablebuilder from './locales/en-US/tablebuilder.json'; 
import enUSExport from './locales/en-US/export.json';
import enUSLogin from './locales/en-US/login.json';
import enUSDictionary from './locales/en-US/dictionary.json';
import enUSTerms from './locales/en-US/terms.json';
import enUSMyLibrary from './locales/en-US/mylibrary.json';
import enUSRegulation from './locales/en-US/regulation.json';
import enUSJrajsa from './locales/en-US/jrajsa.json';

const resources = {
  'ko': { 
    main: koMain, 
    explore: koExplore, 
    tags: koTags,
    about: koAbout,
    analysis: koAnalysis, 
    info: koInfo, 
    procedure: koProcedure, 
    modulebuilder: koModulebuilder, 
    tablebuilder: koTablebuilder, 
    export: koExport,
    login: koLogin,
    dictionary: koDictionary,
    terms: koTerms,
    library: koMyLibrary, // 컴포넌트의 useTranslation('library')와 일치시킴
    regulation: koRegulation,
    jrajsa: koJrajsa,
  },

  'en-US': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis, 
    info: enUSInfo, 
    procedure: enUSProcedure, 
    modulebuilder: enUSModulebuilder, 
    tablebuilder: enUSTablebuilder,
    export: enUSExport,
    login: enUSLogin,
    dictionary: enUSDictionary,
    terms: enUSTerms,
    library: enUSMyLibrary,
    regulation: enUSRegulation,
    jrajsa: enUSJrajsa,
  },
  'en-GB': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis,
    info: enUSInfo, 
    procedure: enUSProcedure, 
    modulebuilder: enUSModulebuilder, 
    tablebuilder: enUSTablebuilder,
    export: enUSExport,
    login: enUSLogin,
    dictionary: enUSDictionary,
    terms: enUSTerms,
    library: enUSMyLibrary,
    regulation: enUSRegulation,
    jrajsa: enUSJrajsa,

  }, 
  'en-AU': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis,
    info: enUSInfo, 
    procedure: enUSProcedure, 
    modulebuilder: enUSModulebuilder, 
    tablebuilder: enUSTablebuilder,
    export: enUSExport,
    login: enUSLogin,
    dictionary: enUSDictionary,
    terms: enUSTerms,
    library: enUSMyLibrary,
    regulation: enUSRegulation,
    jrajsa: enUSJrajsa,

  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en-US',
    // ✅ library 네임스페이스 명칭 통일 완료
    ns: ['jrajsa','regulation',' library', 'terms', 'dictionary', 'main', 'explore', 'tags', 'about', 'analysis', 'info', 'procedure', 'modulebuilder', 'tablebuilder', 'export', 'login'],
    defaultNS: 'main',
    interpolation: { 
      escapeValue: false 
    }
  });

export default i18n;