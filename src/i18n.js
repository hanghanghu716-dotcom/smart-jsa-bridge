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

// 7. 스페인어(es-ES) 리소스 임포트
import esESMain from './locales/es-ES/main.json';
import esESExplore from './locales/es-ES/explore.json';
import esESTags from './locales/es-ES/tags.json';
import esESAbout from './locales/es-ES/about.json';
import esESAnalysis from './locales/es-ES/analysis.json';
import esESInfo from './locales/es-ES/info.json';
import esESProcedure from './locales/es-ES/procedure.json';
import esESModulebuilder from './locales/es-ES/modulebuilder.json';
import esESTablebuilder from './locales/es-ES/tablebuilder.json';
import esESExport from './locales/es-ES/export.json';
import esESLogin from './locales/es-ES/login.json';
import esESDictionary from './locales/es-ES/dictionary.json';
import esESTerms from './locales/es-ES/terms.json';
import esESMyLibrary from './locales/es-ES/mylibrary.json';
import esESRegulation from './locales/es-ES/regulation.json';
import esESJrajsa from './locales/es-ES/jrajsa.json';
import esESPpe from './locales/es-ES/ppe.json';
import esESRisk from './locales/es-ES/risk.json';
import esESCommon from './locales/es-ES/common.json';
import esESChem from './locales/es-ES/chem.json';
import esESHighrisk from './locales/es-ES/highrisk.json';
import esESManu from './locales/es-ES/manu.json';
import esESConst from './locales/es-ES/const.json';
import esESGeneral from './locales/es-ES/general.json';
import esESProfile from './locales/es-ES/profile.json';
import esESPrivacy from './locales/es-ES/privacy.json';

// 8. 러시아어(ru-RU) 리소스 임포트
import ruRUMain from './locales/ru-RU/main.json';
import ruRUExplore from './locales/ru-RU/explore.json';
import ruRUTags from './locales/ru-RU/tags.json';
import ruRUAbout from './locales/ru-RU/about.json';
import ruRUAnalysis from './locales/ru-RU/analysis.json';
import ruRUInfo from './locales/ru-RU/info.json';
import ruRUProcedure from './locales/ru-RU/procedure.json';
import ruRUModulebuilder from './locales/ru-RU/modulebuilder.json';
import ruRUTablebuilder from './locales/ru-RU/tablebuilder.json';
import ruRUExport from './locales/ru-RU/export.json';
import ruRULogin from './locales/ru-RU/login.json';
import ruRUDictionary from './locales/ru-RU/dictionary.json';
import ruRUTerms from './locales/ru-RU/terms.json';
import ruRUMyLibrary from './locales/ru-RU/mylibrary.json';
import ruRURegulation from './locales/ru-RU/regulation.json';
import ruRUJrajsa from './locales/ru-RU/jrajsa.json';
import ruRUPpe from './locales/ru-RU/ppe.json';
import ruRURisk from './locales/ru-RU/risk.json';
import ruRUCommon from './locales/ru-RU/common.json';
import ruRUChem from './locales/ru-RU/chem.json';
import ruRUHighrisk from './locales/ru-RU/highrisk.json';
import ruRUManu from './locales/ru-RU/manu.json';
import ruRUConst from './locales/ru-RU/const.json';
import ruRUGeneral from './locales/ru-RU/general.json';
import ruRUProfile from './locales/ru-RU/profile.json';
import ruRUPrivacy from './locales/ru-RU/privacy.json';

// 9. 캐나다 영어(en-CA) 리소스 임포트
import enCAMain from './locales/en-CA/main.json';
import enCAExplore from './locales/en-CA/explore.json';
import enCATags from './locales/en-CA/tags.json';
import enCAAbout from './locales/en-CA/about.json';
import enCAAnalysis from './locales/en-CA/analysis.json';
import enCAInfo from './locales/en-CA/info.json';
import enCAProcedure from './locales/en-CA/procedure.json';
import enCAModulebuilder from './locales/en-CA/modulebuilder.json';
import enCATablebuilder from './locales/en-CA/tablebuilder.json';
import enCAExport from './locales/en-CA/export.json';
import enCALogin from './locales/en-CA/login.json';
import enCADictionary from './locales/en-CA/dictionary.json';
import enCATerms from './locales/en-CA/terms.json';
import enCAMyLibrary from './locales/en-CA/mylibrary.json';
import enCARegulation from './locales/en-CA/regulation.json';
import enCAJrajsa from './locales/en-CA/jrajsa.json';
import enCAPpe from './locales/en-CA/ppe.json';
import enCARisk from './locales/en-CA/risk.json';
import enCACommon from './locales/en-CA/common.json';
import enCAChem from './locales/en-CA/chem.json';
import enCAHighrisk from './locales/en-CA/highrisk.json';
import enCAManu from './locales/en-CA/manu.json';
import enCAConst from './locales/en-CA/const.json';
import enCAGeneral from './locales/en-CA/general.json';
import enCAProfile from './locales/en-CA/profile.json';
import enCAPrivacy from './locales/en-CA/privacy.json';

// 10. 일본어(ja-JP) 리소스 임포트
import jaJPMain from './locales/ja-JP/main.json';
import jaJPExplore from './locales/ja-JP/explore.json';
import jaJPTags from './locales/ja-JP/tags.json';
import jaJPAbout from './locales/ja-JP/about.json';
import jaJPAnalysis from './locales/ja-JP/analysis.json';
import jaJPInfo from './locales/ja-JP/info.json';
import jaJPProcedure from './locales/ja-JP/procedure.json';
import jaJPModulebuilder from './locales/ja-JP/modulebuilder.json';
import jaJPTablebuilder from './locales/ja-JP/tablebuilder.json';
import jaJPExport from './locales/ja-JP/export.json';
import jaJPLogin from './locales/ja-JP/login.json';
import jaJPDictionary from './locales/ja-JP/dictionary.json';
import jaJPTerms from './locales/ja-JP/terms.json';
import jaJPMyLibrary from './locales/ja-JP/mylibrary.json';
import jaJPRegulation from './locales/ja-JP/regulation.json';
import jaJPJrajsa from './locales/ja-JP/jrajsa.json';
import jaJPPpe from './locales/ja-JP/ppe.json';
import jaJPRisk from './locales/ja-JP/risk.json';
import jaJPCommon from './locales/ja-JP/common.json';
import jaJPChem from './locales/ja-JP/chem.json';
import jaJPHighrisk from './locales/ja-JP/highrisk.json';
import jaJPManu from './locales/ja-JP/manu.json';
import jaJPConst from './locales/ja-JP/const.json';
import jaJPGeneral from './locales/ja-JP/general.json';
import jaJPProfile from './locales/ja-JP/profile.json';
import jaJPPrivacy from './locales/ja-JP/privacy.json';

// 11. 이탈리아어(it-IT) 리소스 임포트
import itITMain from './locales/it-IT/main.json';
import itITExplore from './locales/it-IT/explore.json';
import itITTags from './locales/it-IT/tags.json';
import itITAbout from './locales/it-IT/about.json';
import itITAnalysis from './locales/it-IT/analysis.json';
import itITInfo from './locales/it-IT/info.json';
import itITProcedure from './locales/it-IT/procedure.json';
import itITModulebuilder from './locales/it-IT/modulebuilder.json';
import itITTablebuilder from './locales/it-IT/tablebuilder.json';
import itITExport from './locales/it-IT/export.json';
import itITLogin from './locales/it-IT/login.json';
import itITDictionary from './locales/it-IT/dictionary.json';
import itITTerms from './locales/it-IT/terms.json';
import itITMyLibrary from './locales/it-IT/mylibrary.json';
import itITRegulation from './locales/it-IT/regulation.json';
import itITJrajsa from './locales/it-IT/jrajsa.json';
import itITPpe from './locales/it-IT/ppe.json';
import itITRisk from './locales/it-IT/risk.json';
import itITCommon from './locales/it-IT/common.json';
import itITChem from './locales/it-IT/chem.json';
import itITHighrisk from './locales/it-IT/highrisk.json';
import itITManu from './locales/it-IT/manu.json';
import itITConst from './locales/it-IT/const.json';
import itITGeneral from './locales/it-IT/general.json';
import itITProfile from './locales/it-IT/profile.json';
import itITPrivacy from './locales/it-IT/privacy.json';

// 12. 아랍어(ar-SA) 리소스 임포트
import arSAMain from './locales/ar-SA/main.json';
import arSAExplore from './locales/ar-SA/explore.json';
import arSATags from './locales/ar-SA/tags.json';
import arSAAbout from './locales/ar-SA/about.json';
import arSAAnalysis from './locales/ar-SA/analysis.json';
import arSAInfo from './locales/ar-SA/info.json';
import arSAProcedure from './locales/ar-SA/procedure.json';
import arSAModulebuilder from './locales/ar-SA/modulebuilder.json';
import arSATablebuilder from './locales/ar-SA/tablebuilder.json';
import arSAExport from './locales/ar-SA/export.json';
import arSALogin from './locales/ar-SA/login.json';
import arSADictionary from './locales/ar-SA/dictionary.json';
import arSATerms from './locales/ar-SA/terms.json';
import arSAMyLibrary from './locales/ar-SA/mylibrary.json';
import arSARegulation from './locales/ar-SA/regulation.json';
import arSAJrajsa from './locales/ar-SA/jrajsa.json';
import arSAPpe from './locales/ar-SA/ppe.json';
import arSARisk from './locales/ar-SA/risk.json';
import arSACommon from './locales/ar-SA/common.json';
import arSAChem from './locales/ar-SA/chem.json';
import arSAHighrisk from './locales/ar-SA/highrisk.json';
import arSAManu from './locales/ar-SA/manu.json';
import arSAConst from './locales/ar-SA/const.json';
import arSAGeneral from './locales/ar-SA/general.json';
import arSAProfile from './locales/ar-SA/profile.json';
import arSAPrivacy from './locales/ar-SA/privacy.json';

// 13. 포르투갈어(pt-BR) 리소스 임포트
import ptBRMain from './locales/pt-BR/main.json';
import ptBRExplore from './locales/pt-BR/explore.json';
import ptBRTags from './locales/pt-BR/tags.json';
import ptBRAbout from './locales/pt-BR/about.json';
import ptBRAnalysis from './locales/pt-BR/analysis.json';
import ptBRInfo from './locales/pt-BR/info.json';
import ptBRProcedure from './locales/pt-BR/procedure.json';
import ptBRModulebuilder from './locales/pt-BR/modulebuilder.json';
import ptBRTablebuilder from './locales/pt-BR/tablebuilder.json';
import ptBRExport from './locales/pt-BR/export.json';
import ptBRLogin from './locales/pt-BR/login.json';
import ptBRDictionary from './locales/pt-BR/dictionary.json';
import ptBRTerms from './locales/pt-BR/terms.json';
import ptBRMyLibrary from './locales/pt-BR/mylibrary.json';
import ptBRRegulation from './locales/pt-BR/regulation.json';
import ptBRJrajsa from './locales/pt-BR/jrajsa.json';
import ptBRPpe from './locales/pt-BR/ppe.json';
import ptBRRisk from './locales/pt-BR/risk.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRChem from './locales/pt-BR/chem.json';
import ptBRHighrisk from './locales/pt-BR/highrisk.json';
import ptBRManu from './locales/pt-BR/manu.json';
import ptBRConst from './locales/pt-BR/const.json';
import ptBRGeneral from './locales/pt-BR/general.json';
import ptBRProfile from './locales/pt-BR/profile.json';
import ptBRPrivacy from './locales/pt-BR/privacy.json';

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
  },
  'es-ES': {
    main: esESMain,
    explore: esESExplore,
    tags: esESTags,
    about: esESAbout,
    analysis: esESAnalysis,
    info: esESInfo,
    procedure: esESProcedure,
    modulebuilder: esESModulebuilder,
    tablebuilder: esESTablebuilder,
    export: esESExport,
    login: esESLogin,
    dictionary: esESDictionary,
    terms: esESTerms,
    library: esESMyLibrary,
    regulation: esESRegulation,
    jrajsa: esESJrajsa,
    ppe: esESPpe,
    risk: esESRisk,
    common: esESCommon,
    chem: esESChem,
    highrisk: esESHighrisk,
    manu: esESManu,
    const: esESConst,
    general: esESGeneral,
    profile: esESProfile,
    privacy: esESPrivacy,
  },
  'ru-RU': {
    main: ruRUMain,
    explore: ruRUExplore,
    tags: ruRUTags,
    about: ruRUAbout,
    analysis: ruRUAnalysis,
    info: ruRUInfo,
    procedure: ruRUProcedure,
    modulebuilder: ruRUModulebuilder,
    tablebuilder: ruRUTablebuilder,
    export: ruRUExport,
    login: ruRULogin,
    dictionary: ruRUDictionary,
    terms: ruRUTerms,
    library: ruRUMyLibrary,
    regulation: ruRURegulation,
    jrajsa: ruRUJrajsa,
    ppe: ruRUPpe,
    risk: ruRURisk,
    common: ruRUCommon,
    chem: ruRUChem,
    highrisk: ruRUHighrisk,
    manu: ruRUManu,
    const: ruRUConst,
    general: ruRUGeneral,
    profile: ruRUProfile,
    privacy: ruRUPrivacy,
  },
  'en-CA': {
    main: enCAMain, explore: enCAExplore, tags: enCATags, about: enCAAbout,
    analysis: enCAAnalysis, info: enCAInfo, procedure: enCAProcedure, modulebuilder: enCAModulebuilder,
    tablebuilder: enCATablebuilder, export: enCAExport, login: enCALogin, dictionary: enCADictionary,
    terms: enCATerms, library: enCAMyLibrary, regulation: enCARegulation, jrajsa: enCAJrajsa,
    ppe: enCAPpe, risk: enCARisk, common: enCACommon, chem: enCAChem, highrisk: enCAHighrisk,
    manu: enCAManu, const: enCAConst, general: enCAGeneral, profile: enCAProfile, privacy: enCAPrivacy,
  },
  'ja-JP': {
    main: jaJPMain, explore: jaJPExplore, tags: jaJPTags, about: jaJPAbout,
    analysis: jaJPAnalysis, info: jaJPInfo, procedure: jaJPProcedure, modulebuilder: jaJPModulebuilder,
    tablebuilder: jaJPTablebuilder, export: jaJPExport, login: jaJPLogin, dictionary: jaJPDictionary,
    terms: jaJPTerms, library: jaJPMyLibrary, regulation: jaJPRegulation, jrajsa: jaJPJrajsa,
    ppe: jaJPPpe, risk: jaJPRisk, common: jaJPCommon, chem: jaJPChem, highrisk: jaJPHighrisk,
    manu: jaJPManu, const: jaJPConst, general: jaJPGeneral, profile: jaJPProfile, privacy: jaJPPrivacy,
  },
  'it-IT': {
    main: itITMain, explore: itITExplore, tags: itITTags, about: itITAbout,
    analysis: itITAnalysis, info: itITInfo, procedure: itITProcedure, modulebuilder: itITModulebuilder,
    tablebuilder: itITTablebuilder, export: itITExport, login: itITLogin, dictionary: itITDictionary,
    terms: itITTerms, library: itITMyLibrary, regulation: itITRegulation, jrajsa: itITJrajsa,
    ppe: itITPpe, risk: itITRisk, common: itITCommon, chem: itITChem, highrisk: itITHighrisk,
    manu: itITManu, const: itITConst, general: itITGeneral, profile: itITProfile, privacy: itITPrivacy,
  },
  'ar-SA': {
    main: arSAMain, explore: arSAExplore, tags: arSATags, about: arSAAbout,
    analysis: arSAAnalysis, info: arSAInfo, procedure: arSAProcedure, modulebuilder: arSAModulebuilder,
    tablebuilder: arSATablebuilder, export: arSAExport, login: arSALogin, dictionary: arSADictionary,
    terms: arSATerms, library: arSAMyLibrary, regulation: arSARegulation, jrajsa: arSAJrajsa,
    ppe: arSAPpe, risk: arSARisk, common: arSACommon, chem: arSAChem, highrisk: arSAHighrisk,
    manu: arSAManu, const: arSAConst, general: arSAGeneral, profile: arSAProfile, privacy: arSAPrivacy,
  },
  'pt-BR': {
    main: ptBRMain, explore: ptBRExplore, tags: ptBRTags, about: ptBRAbout,
    analysis: ptBRAnalysis, info: ptBRInfo, procedure: ptBRProcedure, modulebuilder: ptBRModulebuilder,
    tablebuilder: ptBRTablebuilder, export: ptBRExport, login: ptBRLogin, dictionary: ptBRDictionary,
    terms: ptBRTerms, library: ptBRMyLibrary, regulation: ptBRRegulation, jrajsa: ptBRJrajsa,
    ppe: ptBRPpe, risk: ptBRRisk, common: ptBRCommon, chem: ptBRChem, highrisk: ptBRHighrisk,
    manu: ptBRManu, const: ptBRConst, general: ptBRGeneral, profile: ptBRProfile, privacy: ptBRPrivacy,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
supportedLngs: ['en-US', 'en-CA', 'en-AU', 'en-GB', 'de-DE', 'ja-JP', 'fr-FR', 'it-IT', 'es-ES', 'ar-SA', 'pt-BR', 'ru-RU', 'ko'],        ns: [
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

// 언어 변경 시 HTML 태그의 lang 및 방향(dir) 속성을 동적으로 업데이트
i18n.on('languageChanged', (lng) => {
  const rootLang = lng.includes('-') ? lng.split('-')[0] : lng;
  document.documentElement.lang = rootLang;
  
  // 아랍어(ar-SA) 지원을 위한 RTL 레이아웃 동적 전환
  if (lng === 'ar-SA') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
});

export default i18n;