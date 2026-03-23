import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// [공통 영문 리소스] - US, UK, AU에서 공통으로 사용
const commonEn = {
  main: {
    mobileAlert: "This feature is optimized for PC. Please use the web version for detailed authoring.",
    modalTitle: "Start Job Safety Analysis",
    modalSub1: "Would you like to store field data in the cloud and share it with others?",
    modalSub2: "Curation features are available when logged in.",
    loginBtn: "Login / Sign Up",
    guestBtn: "Start immediately as a guest",
    cancelBtn: "Cancel",
    navExplore: "Explore Cases",
    navLibrary: "My Library",
    welcomeSuffix1: ",",
    welcomeSuffix2: "Welcome back.",
    logout: "Logout",
    profileEdit: "Edit Profile & Stats",
    loginSignup: "Login / Sign Up",
    navRegulation: "Risk Assessment Regulation Guide",
    navProcess: "JRA/JSA Practical Process",
    navPPE: "About Protective Equipment",
    navRiskClass: "General / High-Risk Operations",
    navDB: "Hazard & Measure DB",
    navGuideCommon: "Pre-task Risk Assessment Examples",
    navGuideConstruction: "Construction JSA (10 Types)",
    navGuideHighRisk: "High-Risk Special Tasks JSA (10 Types)",
    navGuideManufacturing: "Manufacturing JSA (10 Types)",
    navGuideChemical: "Chemical & Gas Tasks JSA (10 Types)",
    navGuideGeneral: "Other General Tasks JSA (10 Types)",
    heroTitle1: "Connecting Safety with Data,",
    heroTitle2: "Technology that Protects People",
    heroSub1: "Combining visual site inspections with intelligent analysis data",
    heroSub2: "to precisely identify easily missed potential hazards.",
    heroBtn: "Create Risk Assessment",
    coreValueTitle1: "Intelligent Safety Analysis Partner",
    coreValueTitle2: "for Practical Hazard Identification",
    coreValueSubtitle: "Systematic Data Matching",
    coreValueDesc: "Proposals are based on a database built through the analysis of numerous task scenarios.",
    analysisGuideTitle: "Hazard Analysis Guide for 9 High-Risk Operations",
    hazardFactor: "Hazard Factor",
    reductionMeasure: "Reduction Measure",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
    footerAbout: "About the Service",
    jsaCard: {
      "01": { title: "General & Common Safety", f: "Unconfirmed worker health or psychological instability", m: "Check blood pressure and alcohol consumption via TBM" },
      "02": { title: "Working at Heights", f: "Worker falling from platform edges or openings", m: "Strictly enforce full-body harness and lifeline usage" },
      "03": { title: "Hot Work", f: "Fire/explosion of nearby combustibles from welding sparks", m: "Remove combustibles, install fire blankets, assign fire watch" },
      "04": { title: "Confined Spaces", f: "Asphyxiation/poisoning from oxygen deficiency or toxic gas", m: "Measure gas levels before entry; operate portable ventilators continuously" },
      "05": { title: "Electrical Work", f: "Electrocution due to unauthorized third-party power activation", m: "Install LOTO (Locks & Tags) and keep keys personally" },
      "06": { title: "Excavation", f: "Worker burial or equipment overturn from slope collapse", m: "Comply with angle of repose and inspect shoring structures" },
      "07": { title: "Heavy Equipment", f: "Collision/crushing of pedestrians in blind spots", m: "Assign dedicated spotters and check rear cameras/sensors" },
      "08": { title: "Material Handling", f: "Load dropping/striking due to rigging failure", m: "Inspect rigging wear and utilize tag lines" },
      "09": { title: "Flammable Gas", f: "Ignition/explosion of leaking gas during pipe pressure tests", m: "Apply anti-static measures and inspect closely with detectors" }
    }
  },
  explore: {
    categoryIndustry: "Industry / Process / General",
    categorySafety: "Health & Safety Management",
    categoryMachine: "Machine & Equipment",
    categoryAccident: "Standard Accident Types",
    searchPlaceholder: "Search by project title...",
    sidebarTitle: "Filters & Sort",
    resetBtn: "Reset",
    saveLibrary: "Save to Library",
    startWithThis: "Start with this document",
    alertLoginRequired: "Login is required to access this service.",
    alertSavedToLibrary: "Successfully saved to your library.",
    sortLatest: "Latest",
    sortPopular: "Most Popular",
    totalLabel: "Total ",
    assetCountLabel: " Knowledge Assets",
    loadingLabel: "Exploring knowledge base...",
    typeAdvanced: "Advanced",
    typeBasic: "Basic",
    tagSearchResultLabel: "Tag Search Results",
    reportModalTitle: "🚨 Content Report & Management",
    reportPlaceholder: "Please describe the reason for the report...",
    hideProjectOption: "Hide this project only",
    blockUserOption: "Block this author entirely",
    submitReportBtn: "Submit Action",
    cancelBtn: "Cancel",
    alertReportLoginRequired: "Login is required to use the reporting feature.",
    alertActionCompleted: "The action has been completed.",
    alertErrorOccurred: "An error occurred during processing."
  },
  tags: {
    "건축공사": "Construction",
    "토목공사": "Civil Engineering",
    "플랜트공사": "Plant Construction",
    "철강/제강": "Steel/Iron Making",
    "조선/해양": "Shipbuilding/Offshore",
    "고소작업(사다리)": "Height (Ladder)",
    "고소작업(비계)": "Height (Scaffold)",
    "용접(아크)": "Welding (Arc)",
    "절단/용단": "Cutting/Hot Work",
    "밀폐공간(탱크)": "Confined Space (Tank)",
    "사고(추락)": "Accident (Fall)",
    "사고(전도)": "Accident (Trip/Slip)",
    "사고(화재)": "Accident (Fire)",
    "설비(지게차)": "Equipment (Forklift)",
    "관리(작업전TBM)": "Management (TBM)",
    "보호구(안전모)": "PPE (Hard Hat)"
    // [참고] TagDictionary의 모든 키를 여기에 영문으로 매핑하십시오.
  }
};

const resources = {
  ko: {
    translation: {
      main: {
        mobileAlert: "해당 기능은 PC 버전에서 최적화되어 있습니다. 상세 작성은 웹을 이용해 주시기 바랍니다.",
        modalTitle: "작업안전분석 시작하기",
        modalSub1: "현장 데이터를 클라우드에 보관하고 다른 유저와 공유하시겠습니까?",
        modalSub2: "로그인 시 큐레이션 기능을 이용할 수 있습니다.",
        loginBtn: "로그인 및 회원가입",
        guestBtn: "비회원으로 즉시 시작",
        cancelBtn: "취소",
        navExplore: "사례 탐색",
        navLibrary: "내 보관함",
        welcomeSuffix1: " 님",
        welcomeSuffix2: "환영합니다.",
        logout: "로그아웃",
        profileEdit: "회원정보 수정 및 지식 통계",
        loginSignup: "로그인 / 회원가입",
        navRegulation: "위험성평가 실시규정 가이드",
        navProcess: "위험성평가(JRA/JSA) 실무 프로세스",
        navPPE: "보호구에 관하여",
        navRiskClass: "일반 작업/고위험 작업",
        navDB: "위험요인·대책 DB",
        navGuideCommon: "작업 전 위험성평가 예시",
        navGuideConstruction: "건설업 JSA (10종)",
        navGuideHighRisk: "고위험 특수작업 JSA (10종)",
        navGuideManufacturing: "제조업 JSA (10종)",
        navGuideChemical: "화공·가스 작업 JSA (10종)",
        navGuideGeneral: "기타 일반작업 JSA (10종)",
        heroTitle1: "데이터로 잇는 안전,",
        heroTitle2: "사람을 지키는 기술",
        heroSub1: "현장의 육안 점검과 지능형 분석 데이터를 결합하여,",
        heroSub2: "놓치기 쉬운 잠재 위험 요인을 정밀하게 도출합니다.",
        heroBtn: "위험성 평가 작성하기",
        coreValueTitle1: "실질적 위험 발굴을 돕는",
        coreValueTitle2: "지능형 안전 분석 파트너",
        coreValueSubtitle: "체계적인 데이터 매칭",
        coreValueDesc: "수많은 작업 시나리오 분석을 통해 구축된 데이터베이스를 기반으로 제안합니다.",
        analysisGuideTitle: "9대 고위험 작업별 위험 분석 가이드",
        hazardFactor: "위험요인",
        reductionMeasure: "감소대책",
        footerPrivacy: "개인정보처리방침",
        footerTerms: "이용약관",
        footerAbout: "서비스 소개",
        jsaCard: {
          "01": { title: "일반 및 공통안전", f: "작업자 건강상태 및 심리적 불안정 미확인", m: "TBM 활용 혈압 측정 및 음주 여부 확인 실시" },
          "02": { title: "고소 작업", f: "작업 발판 단부 및 개구부에서의 작업자 추락", m: "그네식 안전대 착용 및 생명줄(Life-line) 체결 철저" },
          "03": { title: "화기 작업", f: "용접 불티 비산으로 인한 주변 가연물 화재/폭발", m: "가연물 제거, 비산 방지포 설치 및 화기 감시자 배치" },
          "04": { title: "밀폐 공간", f: "내부 산소 결핍 및 유해가스에 의한 질식/중독", m: "진입 전 농도 측정 및 이동식 송풍기 상시 환기 가동" },
          "05": { title: "정전 및 전기", f: "전기 정비 중 제3자의 불시 투입에 의한 감전", m: "LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관" },
          "06": { title: "굴착 작업", f: "법면 붕괴로 인한 작업자 매몰 및 장비 전도", m: "지반 안식각 준수 및 흙막이 지보공 설치 상태 점검" },
          "07": { title: "중장비 운용", f: "장비 사각지대 위치 보행자와의 충돌 및 끼임", m: "전담 신호수 배치 및 후방 카메라/감지기 작동 확인" },
          "08": { title: "중량물 취급", f: "줄걸이 용구 파단으로 인한 인양물 낙하 및 타격", m: "용구 마모 상태 점검 및 유도 로프(Tag Line) 사용" },
          "09": { title: "가연성 가스", f: "배관 기밀 시험 중 누출 가스에 의한 인화/폭발", m: "정전기 방지 조치 및 검지기를 활용한 정밀 점검" }
        }
      },
      explore: {
        categoryIndustry: "산업 / 공정 / 일반작업",
        categorySafety: "안전 보건 관리 및 절차",
        categoryMachine: "기계 및 설비 (80종)",
        categoryAccident: "표준 사고 유형",
        searchPlaceholder: "프로젝트 제목으로 검색...",
        sidebarTitle: "필터 및 정렬",
        resetBtn: "초기화",
        saveLibrary: "라이브러리 저장",
        startWithThis: "이 자료로 작성 시작",
        alertLoginRequired: "로그인이 필요한 서비스입니다.",
        alertSavedToLibrary: "내 라이브러리에 저장되었습니다.",
        sortLatest: "최신 등록순",
        sortPopular: "인기 스크랩순",
        totalLabel: "총 ",
        assetCountLabel: "개의 지식 자산",
        loadingLabel: "지식 베이스 탐색 중...",
        typeAdvanced: "심화",
        typeBasic: "기본",
        tagSearchResultLabel: "태그 검색 결과",
        reportModalTitle: "🚨 콘텐츠 신고 및 관리",
        reportPlaceholder: "신고 사유를 적어주세요...",
        hideProjectOption: "이 작업물만 숨기기",
        blockUserOption: "이 작성자 전체 차단",
        submitReportBtn: "조치 실행",
        cancelBtn: "취소",
        alertReportLoginRequired: "신고 기능을 이용하려면 로그인이 필요합니다.",
        alertActionCompleted: "처리가 완료되었습니다.",
        alertErrorOccurred: "오류가 발생했습니다."
      },
      tags: {
        "건축공사": "건축공사",
        "토목공사": "토목공사",
        "플랜트공사": "플랜트공사",
        "철강/제강": "철강/제강",
        "조선/해양": "조선/해양",
        "고소작업(사다리)": "고소작업(사다리)",
        "고소작업(비계)": "고소작업(비계)",
        "용접(아크)": "용접(아크)",
        "절단/용단": "절단/용단",
        "밀폐공간(탱크)": "밀폐공간(탱크)",
        "사고(추락)": "사고(추락)",
        "사고(전도)": "사고(전도)",
        "사고(화재)": "사고(화재)",
        "설비(지게차)": "설비(지게차)",
        "관리(작업전TBM)": "관리(작업전TBM)",
        "보호구(안전모)": "보호구(안전모)"
      }
    }
  },
  'en-US': { translation: commonEn },
  'en-GB': { translation: commonEn },
  'en-AU': { translation: commonEn },
  'de-DE': { 
    translation: {
      main: { heroTitle1: "Sicherheit durch Daten,", heroTitle2: "Technologie schützt Menschen", heroBtn: "Erstellen" },
      explore: { sidebarTitle: "Filter", resetBtn: "Zurücksetzen", sortLatest: "Neueste", sortPopular: "Beliebteste" },
      tags: { "건축공사": "Bauwesen", "사고(화재)": "Brandunfall" }
    } 
  },
  'fr-FR': { 
    translation: {
      main: { heroTitle1: "La sécurité par les données,", heroTitle2: "La technologie protège les gens", heroBtn: "Créer" },
      explore: { sidebarTitle: "Filtres", resetBtn: "Réinitialiser", sortLatest: "Le plus récent", sortPopular: "Populaire" },
      tags: { "건축공사": "Construction", "사고(화재)": "Incendie" }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false }
  });

export default i18n;