import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
import koPpe from './locales/ko/ppe.json';
import koRisk from './locales/ko/risk.json';
import koCommon from './locales/ko/common.json';
import koChem from './locales/ko/chem.json';
import koHighrisk from './locales/ko/highrisk.json';
import koManu from './locales/ko/manu.json';
import koConst from './locales/ko/const.json';
import koGeneral from './locales/ko/general.json';
import koProfile from './locales/ko/profile.json';
import koPrivacy from './locales/ko/privacy.json';

// 2. 미국 영어(en-US) 리소스 임포트
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
import enUSPpe from './locales/en-US/ppe.json';
import enUSRisk from './locales/en-US/risk.json';
import enUSCommon from './locales/en-US/common.json';
import enUSChem from './locales/en-US/chem.json';
import enUSHighrisk from './locales/en-US/highrisk.json';
import enUSManu from './locales/en-US/manu.json';
import enUSConst from './locales/en-US/const.json';
import enUSGeneral from './locales/en-US/general.json';
import enUSProfile from './locales/en-US/profile.json';
import enUSPrivacy from './locales/en-US/privacy.json';

// 3. 영국 영어(en-GB) 리소스 임포트
import enGBMain from './locales/en-GB/main.json';
import enGBExplore from './locales/en-GB/explore.json';
import enGBTags from './locales/en-GB/tags.json';
import enGBAbout from './locales/en-GB/about.json';
import enGBAnalysis from './locales/en-GB/analysis.json';
import enGBInfo from './locales/en-GB/info.json';
import enGBProcedure from './locales/en-GB/procedure.json';
import enGBModulebuilder from './locales/en-GB/modulebuilder.json';
import enGBTablebuilder from './locales/en-GB/tablebuilder.json';
import enGBExport from './locales/en-GB/export.json';
import enGBLogin from './locales/en-GB/login.json';
import enGBDictionary from './locales/en-GB/dictionary.json';
import enGBTerms from './locales/en-GB/terms.json';
import enGBMyLibrary from './locales/en-GB/mylibrary.json';
import enGBRegulation from './locales/en-GB/regulation.json';
import enGBJrajsa from './locales/en-GB/jrajsa.json';
import enGBPpe from './locales/en-GB/ppe.json';
import enGBRisk from './locales/en-GB/risk.json';
import enGBCommon from './locales/en-GB/common.json';
import enGBChem from './locales/en-GB/chem.json';
import enGBHighrisk from './locales/en-GB/highrisk.json';
import enGBManu from './locales/en-GB/manu.json';
import enGBConst from './locales/en-GB/const.json';
import enGBGeneral from './locales/en-GB/general.json';
import enGBProfile from './locales/en-GB/profile.json';
import enGBPrivacy from './locales/en-GB/privacy.json';

// 4. 호주 영어(en-AU) 리소스 임포트
import enAUMain from './locales/en-AU/main.json';
import enAUExplore from './locales/en-AU/explore.json';
import enAUTags from './locales/en-AU/tags.json';
import enAUAbout from './locales/en-AU/about.json';
import enAUAnalysis from './locales/en-AU/analysis.json';
import enAUInfo from './locales/en-AU/info.json';
import enAUProcedure from './locales/en-AU/procedure.json';
import enAUModulebuilder from './locales/en-AU/modulebuilder.json';
import enAUTablebuilder from './locales/en-AU/tablebuilder.json';
import enAUExport from './locales/en-AU/export.json';
import enAULogin from './locales/en-AU/login.json';
import enAUDictionary from './locales/en-AU/dictionary.json';
import enAUTerms from './locales/en-AU/terms.json';
import enAUMyLibrary from './locales/en-AU/mylibrary.json';
import enAURegulation from './locales/en-AU/regulation.json';
import enAUJrajsa from './locales/en-AU/jrajsa.json';
import enAUPpe from './locales/en-AU/ppe.json';
import enAURisk from './locales/en-AU/risk.json';
import enAUCommon from './locales/en-AU/common.json';
import enAUChem from './locales/en-AU/chem.json';
import enAUHighrisk from './locales/en-AU/highrisk.json';
import enAUManu from './locales/en-AU/manu.json';
import enAUConst from './locales/en-AU/const.json';
import enAUGeneral from './locales/en-AU/general.json';
import enAUProfile from './locales/en-AU/profile.json';
import enAUPrivacy from './locales/en-AU/privacy.json';

// 5. 독일어(de-DE) 리소스 임포트
import deDEMain from './locales/de-DE/main.json';
import deDEExplore from './locales/de-DE/explore.json';
import deDETags from './locales/de-DE/tags.json';
import deDEAbout from './locales/de-DE/about.json';
import deDEAnalysis from './locales/de-DE/analysis.json';
import deDEInfo from './locales/de-DE/info.json';
import deDEProcedure from './locales/de-DE/procedure.json';
import deDEModulebuilder from './locales/de-DE/modulebuilder.json';
import deDETablebuilder from './locales/de-DE/tablebuilder.json';
import deDEExport from './locales/de-DE/export.json';
import deDELogin from './locales/de-DE/login.json';
import deDEDictionary from './locales/de-DE/dictionary.json';
import deDETerms from './locales/de-DE/terms.json';
import deDEMyLibrary from './locales/de-DE/mylibrary.json';
import deDERegulation from './locales/de-DE/regulation.json';
import deDEJrajsa from './locales/de-DE/jrajsa.json';
import deDEPpe from './locales/de-DE/ppe.json';
import deDERisk from './locales/de-DE/risk.json';
import deDECommon from './locales/de-DE/common.json';
import deDEChem from './locales/de-DE/chem.json';
import deDEHighrisk from './locales/de-DE/highrisk.json';
import deDEManu from './locales/de-DE/manu.json';
import deDEConst from './locales/de-DE/const.json';
import deDEGeneral from './locales/de-DE/general.json';
import deDEProfile from './locales/de-DE/profile.json';
import deDEPrivacy from './locales/de-DE/privacy.json';

// 6. 프랑스어(fr-FR) 리소스 임포트
import frFRMain from './locales/fr-FR/main.json';
import frFRExplore from './locales/fr-FR/explore.json';
import frFRTags from './locales/fr-FR/tags.json';
import frFRAbout from './locales/fr-FR/about.json';
import frFRAnalysis from './locales/fr-FR/analysis.json';
import frFRInfo from './locales/fr-FR/info.json';
import frFRProcedure from './locales/fr-FR/procedure.json';
import frFRModulebuilder from './locales/fr-FR/modulebuilder.json';
import frFRTablebuilder from './locales/fr-FR/tablebuilder.json';
import frFRExport from './locales/fr-FR/export.json';
import frFRLogin from './locales/fr-FR/login.json';
import frFRDictionary from './locales/fr-FR/dictionary.json';
import frFRTerms from './locales/fr-FR/terms.json';
import frFRMyLibrary from './locales/fr-FR/mylibrary.json';
import frFRRegulation from './locales/fr-FR/regulation.json';
import frFRJrajsa from './locales/fr-FR/jrajsa.json';
import frFRPpe from './locales/fr-FR/ppe.json';
import frFRRisk from './locales/fr-FR/risk.json';
import frFRCommon from './locales/fr-FR/common.json';
import frFRChem from './locales/fr-FR/chem.json';
import frFRHighrisk from './locales/fr-FR/highrisk.json';
import frFRManu from './locales/fr-FR/manu.json';
import frFRConst from './locales/fr-FR/const.json';
import frFRGeneral from './locales/fr-FR/general.json';
import frFRProfile from './locales/fr-FR/profile.json';
import frFRPrivacy from './locales/fr-FR/privacy.json';


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
    library: koMyLibrary,
    regulation: koRegulation,
    jrajsa: koJrajsa,
    ppe: koPpe,
    risk: koRisk,
    common: koCommon,
    chem: koChem,
    highrisk: koHighrisk,
    manu: koManu,
    const: koConst,
    general: koGeneral,
    profile: koProfile,
    privacy: koPrivacy,
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
    ppe: enUSPpe,
    risk: enUSRisk,
    common: enUSCommon,
    chem: enUSChem,
    highrisk: enUSHighrisk,
    manu: enUSManu,
    const: enUSConst,
    general: enUSGeneral,
    profile: enUSProfile,
    privacy: enUSPrivacy,
  },
  'en-GB': {
    main: enGBMain,
    explore: enGBExplore,
    tags: enGBTags,
    about: enGBAbout,
    analysis: enGBAnalysis,
    info: enGBInfo,
    procedure: enGBProcedure,
    modulebuilder: enGBModulebuilder,
    tablebuilder: enGBTablebuilder,
    export: enGBExport,
    login: enGBLogin,
    dictionary: enGBDictionary,
    terms: enGBTerms,
    library: enGBMyLibrary,
    regulation: enGBRegulation,
    jrajsa: enGBJrajsa,
    ppe: enGBPpe,
    risk: enGBRisk,
    common: enGBCommon,
    chem: enGBChem,
    highrisk: enGBHighrisk,
    manu: enGBManu,
    const: enGBConst,
    general: enGBGeneral,
    profile: enGBProfile,
    privacy: enGBPrivacy,
  },
  'en-AU': {
    main: enAUMain,
    explore: enAUExplore,
    tags: enAUTags,
    about: enAUAbout,
    analysis: enAUAnalysis,
    info: enAUInfo,
    procedure: enAUProcedure,
    modulebuilder: enAUModulebuilder,
    tablebuilder: enAUTablebuilder,
    export: enAUExport,
    login: enAULogin,
    dictionary: enAUDictionary,
    terms: enAUTerms,
    library: enAUMyLibrary,
    regulation: enAURegulation,
    jrajsa: enAUJrajsa,
    ppe: enAUPpe,
    risk: enAURisk,
    common: enAUCommon,
    chem: enAUChem,
    highrisk: enAUHighrisk,
    manu: enAUManu,
    const: enAUConst,
    general: enAUGeneral,
    profile: enAUProfile,
    privacy: enAUPrivacy,
  },
  'de-DE': {
    main: deDEMain,
    explore: deDEExplore,
    tags: deDETags,
    about: deDEAbout,
    analysis: deDEAnalysis,
    info: deDEInfo,
    procedure: deDEProcedure,
    modulebuilder: deDEModulebuilder,
    tablebuilder: deDETablebuilder,
    export: deDEExport,
    login: deDELogin,
    dictionary: deDEDictionary,
    terms: deDETerms,
    library: deDEMyLibrary,
    regulation: deDERegulation,
    jrajsa: deDEJrajsa,
    ppe: deDEPpe,
    risk: deDERisk,
    common: deDECommon,
    chem: deDEChem,
    highrisk: deDEHighrisk,
    manu: deDEManu,
    const: deDEConst,
    general: deDEGeneral,
    profile: deDEProfile,
    privacy: deDEPrivacy,
  },
  'fr-FR': {
    main: frFRMain,
    explore: frFRExplore,
    tags: frFRTags,
    about: frFRAbout,
    analysis: frFRAnalysis,
    info: frFRInfo,
    procedure: frFRProcedure,
    modulebuilder: frFRModulebuilder,
    tablebuilder: frFRTablebuilder,
    export: frFRExport,
    login: frFRLogin,
    dictionary: frFRDictionary,
    terms: frFRTerms,
    library: frFRMyLibrary,
    regulation: frFRRegulation,
    jrajsa: frFRJrajsa,
    ppe: frFRPpe,
    risk: frFRRisk,
    common: frFRCommon,
    chem: frFRChem,
    highrisk: frFRHighrisk,
    manu: frFRManu,
    const: frFRConst,
    general: frFRGeneral,
    profile: frFRProfile,
    privacy: frFRPrivacy,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: ['ko', 'en-US', 'en-GB', 'en-AU', 'de-DE', 'fr-FR'],
    ns: [
      'privacy', 'profile', 'highrisk', 'manu', 'const', 'general', 'chem', 'common', 
      'risk', 'ppe', 'jrajsa', 'regulation', 'library', 'terms', 
      'dictionary', 'main', 'explore', 'tags', 'about', 'analysis', 
      'info', 'procedure', 'modulebuilder', 'tablebuilder', 'export', 'login'
    ],
    defaultNS: 'main',
    detection: {
      order: ['path', 'cookie', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false
    }
  });

// 언어 변경 시 HTML 태그의 lang 속성을 동적으로 업데이트
i18n.on('languageChanged', (lng) => {
  const rootLang = lng.includes('-') ? lng.split('-')[0] : lng;
  document.documentElement.lang = rootLang;
});

export default i18n;