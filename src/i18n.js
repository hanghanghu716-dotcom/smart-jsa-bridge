import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. 한국어(KO) 리소스 임포트
import koMain from './locales/ko/main.json';
import koExplore from './locales/ko/explore.json';
import koTags from './locales/ko/tags.json';
import koAbout from './locales/ko/about.json';
import koAnalysis from './locales/ko/analysis.json'; // [추가]
import koInfo from './locales/ko/info.json'; // ✅ [추가]
import koProcedure from './locales/ko/procedure.json'; // ✅ [추가]
import koModulebuilder from './locales/ko/modulebuilder.json'; // ✅ [추가]
import koTablebuilder from './locales/ko/tablebuilder.json'; // ✅ [추가]
import koExport from './locales/ko/export.json';

// 2. 영어(US) 리소스 임포트 - GB, AU 공통 사용
import enUSMain from './locales/en-US/main.json';
import enUSExplore from './locales/en-US/explore.json';
import enUSTags from './locales/en-US/tags.json';
import enUSAbout from './locales/en-US/about.json';
import enUSAnalysis from './locales/en-US/analysis.json'; // [추가]
import enUSInfo from './locales/en-US/info.json'; // ✅ [추가]
import enUSProcedure from './locales/en-US/procedure.json'; // ✅ [추가]
import enUSModulebuilder from './locales/en-US/modulebuilder.json'; // ✅ [추가]
import enUSTablebuilder from './locales/en-US/tablebuilder.json'; // ✅ [추가]
import enUSExport from './locales/en-US/export.json';


const resources = {
  'ko': { 
    main: koMain, 
    explore: koExplore, 
    tags: koTags,
    about: koAbout,
    analysis: koAnalysis, // [추가]
    info: koInfo, // ✅ [추가]
    procedure: koProcedure, // ✅ [추가]
    modulebuilder: koModulebuilder, // ✅ [추가]
    tablebuilder: koTablebuilder, // ✅ [추가]
    export: koExport
  },
  'en-US': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis, // [추가]
    info: enUSInfo, // ✅ [추가]
    procedure: enUSProcedure, // ✅ [추가]
    modulebuilder: enUSModulebuilder, // ✅ [추가]
    tablebuilder: enUSTablebuilder,
    export: enUSExport
  },
  'en-GB': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis,
    info: enUSInfo, // ✅ [추가]
    procedure: enUSProcedure, // ✅ [추가]
    modulebuilder: enUSModulebuilder, // ✅ [추가]
    tablebuilder: enUSTablebuilder,
    export: enUSExport
  }, 
  'en-AU': { 
    main: enUSMain, 
    explore: enUSExplore, 
    tags: enUSTags,
    about: enUSAbout,
    analysis: enUSAnalysis,
    info: enUSInfo, // ✅ [추가]
    procedure: enUSProcedure, // ✅ [추가]
    modulebuilder: enUSModulebuilder, // ✅ [추가]
    tablebuilder: enUSTablebuilder,
    export: enUSExport

  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en-US',
    // analysis 네임스페이스 및 신규 네임스페이스 추가
    ns: ['main', 'explore', 'tags', 'about', 'analysis', 'info', 'procedure', 'modulebuilder', 'tablebuilder', 'export'],
    interpolation: { 
      escapeValue: false 
    }
  });

export default i18n;