/**
 * Smart JSA Bridge - Dimensional Tag Dictionary
 * 구성: 7대 차원, 약 300종의 세부 태그 및 복합 매칭 룰셋
 * 적용 기준: KOSHA Guide, OSHA Standard, ISO 45001 안전공학 체계
 */

export const DIMENSIONAL_KEYWORD_MAP = {
  // --- [1. 산업 및 공정 특성 세분화 - 25종] ---
  "건축공사": ["건축", "빌딩", "상가", "아파트", "사무동", "구조물", "construction", "building", "apartment", "commercial", "structure", "architecture"],
  "토목공사": ["토목", "교량", "도로", "댐", "터널", "지하차도", "교각", "civil", "bridge", "road", "dam", "tunnel", "underpass", "pier", "infrastructure"],
  "플랜트공사": ["플랜트", "정유", "석유화학", "발전소", "정제설비", "plant", "refinery", "petrochemical", "power plant", "facility"],
  "철강/제강": ["철강", "제강", "압연", "전기로", "고로", "코일", "steel", "steelmaking", "rolling", "furnace", "blast furnace", "coil", "metal"],
  "조선/해양": ["조선", "선박", "해양플랜트", "도크", "선대", "안벽", "shipbuilding", "ship", "marine", "offshore", "dock", "berth", "vessel"],
  "자동차제조": ["자동차", "조립라인", "차체", "의장", "엔진공장", "automotive", "car", "assembly line", "body", "engine plant"],
  "반도체/전자": ["반도체", "클린룸", "디스플레이", "웨이퍼", "회로", "semiconductor", "cleanroom", "display", "wafer", "circuit", "electronics"],
  "제약/바이오": ["제약", "클린", "배양", "실험실", "바이오", "pharmaceutical", "bio", "culture", "laboratory", "lab"],
  "물류/운송": ["물류", "창고", "택배", "하역", "터미널", "컨테이너", "logistics", "warehouse", "delivery", "unloading", "terminal", "container"],
  "폐기물처리": ["폐기물", "소각", "매립", "재활용", "집하시설", "waste", "incineration", "landfill", "recycling", "collection facility"],
  "에너지/발전": ["화력발전", "원자력", "태양광", "풍력", "변전소", "energy", "power plant", "nuclear", "solar", "wind", "substation"],
  "식품제조": ["식품", "HACCP", "가공공장", "냉동창고", "food", "haccp", "processing plant", "cold storage"],
  "금속가공": ["금속", "가공", "cnc", "mct", "절삭", "도금", "metal", "machining", "cutting", "plating"],
  "화공/특수": ["화학제품", "특수화학", "화합물", "추출", "chemical", "specialty chemical", "compound", "extraction"],
  "인프라/환경": ["상하수도", "처리장", "관로", "정화", "infrastructure", "waterworks", "treatment plant", "purification"],
  "지반/기초": ["항타", "천공", "그라우팅", "차수", "파일", "ground", "foundation", "drilling", "grouting", "pile"],
  "철도/궤도": ["철도", "지하철", "궤도", "선로", "역사", "railway", "subway", "track", "rail", "station"],
  "조경/산림": ["조경", "식재", "벌목", "정원", "임도", "landscaping", "planting", "forestry", "logging", "garden"],
  "철거/해체": ["철거", "해체", "파쇄", "잔재물", "demolition", "dismantling", "crushing", "debris"],
  "정비/보수": ["유지보수", "정기보수", "셧다운", "오버홀", "maintenance", "repair", "shutdown", "overhaul"],
  "통신/네트워크": ["통신주", "기지국", "네트워크", "광케이블", "telecom", "base station", "network", "fiber optic"],
  "수행부서_공통": ["현장", "사업소", "현장사무소", "site", "office", "field office"],
  "시설관리": ["빌딩관리", "기계실", "전기실", "방재실", "facility management", "machine room", "electrical room"],
  "연구/시험": ["R&D", "테스트", "분석", "측정", "research", "test", "analysis", "measurement"],
  "항공/우주": ["항공기", "격납고", "우주", "활주로", "aviation", "hangar", "aerospace", "runway"],


// --- [2. 특수/고위험 단위 작업 세분화 - 50종] ---
  "고소작업(사다리)": ["사다리", "A자 사다리", "말목", "이동식 사다리", "ladder", "stepladder", "trestle", "portable ladder"],
  "고소작업(비계)": ["비계", "강관비계", "시스템비계", "말비계", "scaffold", "scaffolding", "steel scaffold", "system scaffold"],
  "고소작업(고소작업대)": ["고소작업대", "렌탈", "리프트", "sky", "스카이차", "mewp", "aerial lift", "scissor lift", "cherry picker"],
  "고소작업(지붕/달비계)": ["지붕", "달비계", "로프작업", "외벽", "roof", "swing stage", "rope access", "exterior wall"],
  "용접(아크)": ["아크용접", "전기용접", "arc", "용접봉", "arc welding", "stick welding", "electrode"],
  "용접(가스/티그)": ["가스용접", "티그용접", "tig", "아르곤용접", "gas welding", "tig welding", "argon welding"],
  "절단/용단": ["용단", "산소절단", "플라즈마", "가스절단", "cutting", "oxygen cutting", "plasma", "gas cutting", "hot work"],
  "그라인딩": ["그라인더", "연마", "절단석", "날교체", "grinder", "grinding", "abrasive", "polishing"],
  "밀폐공간(탱크)": ["탱크내부", "vessel", "드럼", "용기내부", "tank interior", "vessel", "drum", "confined vessel"],
  "밀폐공간(맨홀/핏트)": ["맨홀", "핏트", "pit", "집수정", "지하관로", "manhole", "pit", "sump", "underground conduit"],
  "밀폐공간(반응기/탑)": ["반응기", "컬럼", "column", "흡착탑", "reactor", "column", "tower", "adsorption tower"],
  "전기정전작업": ["정전", "차단기 개로", "LOTO적용", "power outage", "breaker open", "loto application"],
  "전기활선작업": ["활선", "무정전", "활선근접", "live line", "hot line", "live proximity"],
  "전기수배전반": ["수배전반", "특고압", "변압기", "큐비클", "switchgear", "extra high voltage", "transformer", "cubicle"],
  "굴착(터파기)": ["터파기", "굴착", "기초굴착", "관로굴착", "excavation", "digging", "foundation excavation", "conduit excavation"],
  "굴착(붕괴위험)": ["붕괴", "사면", "토압", "지보공", "흙막이", "collapse", "slope", "earth pressure", "shoring", "retaining wall"],
  "중량물(크레인)": ["크레인", "천장크레인", "이동식크레인", "카고크레인", "crane", "overhead crane", "mobile crane", "cargo crane"],
  "중량물(인양)": ["인양", "양중", "인양물", "하중", "lifting", "hoisting", "lifted load", "load weight"],
  "줄걸이작업": ["줄걸이", "슬링벨트", "와이어로프", "샤클", "rigging", "sling belt", "wire rope", "shackle"],
  "배관설치": ["배관", "파이프", "피팅", "스풀", "piping", "pipe", "fitting", "spool"],
  "밸브조작": ["밸브", "조작", "개폐", "개방", "valve", "operation", "opening", "closing"],
  "퍼지/기밀": ["퍼지", "purge", "기밀", "leak", "질소치환", "purge", "airtight", "leak test", "nitrogen purging"],
  "맹판작업": ["맹판", "blind", "차단판", "blind flange", "isolation plate", "blind spade"],
  "플랜지체결": ["플랜지", "볼팅", "가스켓", "flange", "bolting", "gasket"],
  "촉매교체": ["촉매", "catalyst", "충진", "catalyst replacement", "filling", "loading"],
  "기계분해/조립": ["분해", "조립", "오버홀", "분해정비", "disassembly", "assembly", "overhaul", "maintenance"],
  "도장/코팅": ["도장", "페인트", "코팅", "스프레이", "painting", "paint", "coating", "spray"],
  "석면해체": ["석면", "슬레이트", "텍스", "asbestos", "slate", "tex", "abatement"],
  "방사선투과": ["rt", "방사선", "비파괴", "radiographic testing", "radiation", "non-destructive testing"],
  "잠수작업": ["잠수", "수중", "수중용접", "diving", "underwater", "underwater welding"],
  "발파작업": ["발파", "화약", "뇌관", "blasting", "explosive", "detonator"],
  "양중기설치/해체": ["양중기설치", "타워크레인설치", "호이스트설치", "hoist installation", "tower crane assembly", "dismantling"],
  "콘크리트타설": ["타설", "CPB", "펌프카", "바이브레이터", "concreting", "pouring", "pump car", "vibrator"],
  "철골작업": ["철골", "빔", "기둥", "트러스", "steel structure", "beam", "column", "truss"],
  "벌목작업": ["벌목", "벌채", "전지", "예초", "logging", "felling", "pruning", "mowing"],
  "가설전기": ["가설전선", "임시분전반", "가설조명", "temporary power", "temporary wiring", "temporary lighting"],
  "항타/항발": ["파일항타", "직타", "오거", "piling", "driving", "auger"],
  "기초공사": ["기초", "메트", "독립기초", "foundation", "mat foundation", "independent footing"],
  "방수작업": ["방수", "우레탄", "에폭시", "waterproofing", "urethane", "epoxy"],
  "조적/미장": ["벽돌", "조적", "미장", "몰탈", "masonry", "brickwork", "plastering", "mortar"],
  "창호/유리": ["창호", "유리", "샷시", "window", "glass", "sash"],
  "내장/목공": ["내장", "목공", "석고보드", "interior work", "carpentry", "gypsum board"],
  "수장공사": ["수장", "타일", "바닥재", "finishing work", "tile", "flooring material"],
  "승강기작업": ["엘리베이터", "에스컬레이터", "승강기", "elevator", "escalator", "lift"],
  "철도궤도": ["궤도", "레일", "침목", "railway track", "rail", "sleeper"],
  "터널굴착": ["NATM", "TBM굴착", "숏크리트", "natm", "tbm excavation", "shotcrete"],
  "해상공사": ["바지선", "해상작업", "준설", "marine work", "barge", "dredging"],
  "관로공사": ["관로", "매설", "접속", "pipeline", "burial", "connection"],
  "포장공사": ["아스팔트", "포장", "도로포장", "paving", "asphalt", "road paving"],
  "교량가설": ["상부구조", "거더", "세그먼트", "bridge erection", "superstructure", "girder", "segment"],


// --- [3. 물리적/화학적/생물학적 위험원 세분화 - 36종] ---
  "회전체/말림위험": ["회전부", "축", "커플링", "벨트", "체인", "기어", "말림", "감김", "rotating body", "entanglement", "shaft", "coupling", "belt", "chain", "gear"],
  "왕복동/끼임위험": ["왕복운동", "실린더", "슬라이드", "피스톤", "끼임", "협착", "reciprocating", "pinch point", "cylinder", "slide", "piston", "crush"],
  "고압전기(특고압)": ["22.9kv", "154kv", "수전설비", "특고압", "절연파괴", "high voltage", "extra high voltage", "substation", "insulation failure"],
  "저압전기(동력)": ["380v", "440v", "동력전원", "모터단자", "low voltage", "power supply", "motor terminal"],
  "누전/지락": ["누전", "지락", "누전차단기", "접지불량", "leakage", "ground fault", "elcb", "poor grounding"],
  "정전기/아크": ["정전기", "spark", "아크", "arc", "제전", "static electricity", "spark", "arc flash", "anti-static"],
  "잔류전하": ["콘덴서", "잔류전하", "방전", "residual charge", "capacitor", "discharge"],
  "고온/화상위험": ["고온", "스팀", "열전달", "화상", "뜨거운", "high temperature", "burn hazard", "steam", "heat transfer", "hot"],
  "극저온/동상위험": ["액체질소", "lng", "극저온", "동상", "차가운", "cryogenic", "frostbite", "liquid nitrogen", "cold"],
  "고압유체/압력": ["고압수", "유압", "공압", "압력방출", "high pressure fluid", "hydraulic", "pneumatic", "pressure release"],
  "진공/부압": ["진공", "vaccum", "흡착", "부압", "vacuum", "suction", "negative pressure"],
  "수두압/잔압": ["수두압", "잔압", "압력잔류", "압력제거", "head pressure", "residual pressure"],
  "전리방사선": ["x-ray", "감마선", "방사성동위원소", "피폭", "ionizing radiation", "x-ray", "gamma ray", "isotope", "exposure"],
  "비전리방사선": ["자외선", "적외선", "전자파", "레이저", "non-ionizing radiation", "uv", "ir", "electromagnetic", "laser"],
  "소음/진동": ["소음", "데시벨", "진동", "vibration", "공진", "noise", "vibration", "decibel", "resonance"],
  "가연성가스(LNG/LPG)": ["lng", "lpg", "메탄", "프로판", "도시가스", "flammable gas", "lng", "lpg", "methane", "propane"],
  "가연성가스(수소)": ["수소", "h2", "hydrogen", "수소누출", "hydrogen", "h2", "hydrogen leak"],
  "인화성액체": ["유류", "경유", "휘발유", "솔벤트", "시너", "알코올", "flammable liquid", "oil", "diesel", "gasoline", "solvent", "thinner", "alcohol"],
  "인화성고체": ["마그네슘", "알루미늄분말", "가연성분진", "flammable solid", "magnesium", "aluminum powder", "combustible dust"],
  "자연발화물질": ["황린", "알킬알루미늄", "자연발화", "spontaneously combustible", "white phosphorus", "pyrophoric"],
  "금수성물질": ["금수성", "물기엄금", "반응열", "water-reactive", "water prohibited", "reaction heat"],
  "산화성물질": ["과산화물", "염소산", "질산염", "산화제", "oxidizing substance", "peroxide", "chlorate", "nitrate", "oxidizer"],
  "부식성물질(산)": ["황산", "염산", "질산", "불산", "산성", "corrosive acid", "sulfuric acid", "hydrochloric acid", "nitric acid", "hydrofluoric acid"],
  "부식성물질(알칼리)": ["수산화나트륨", "가성소다", "암모니아", "corrosive alkali", "sodium hydroxide", "caustic soda", "ammonia"],
  "독성가스(황화수소)": ["h2s", "황화수소", "달걀썩는냄새", "toxic gas", "h2s", "hydrogen sulfide"],
  "독성가스(일산화탄소)": ["co", "일산화탄소", "불완전연소", "carbon monoxide", "co", "incomplete combustion"],
  "독성가스(염소/불산)": ["염소가스", "불산가스", "불화수소", "chlorine gas", "hf gas", "hydrogen fluoride"],
  "질소/질식가스": ["n2", "질소", "아르곤", "헬륨", "불활성가스", "nitrogen", "asphyxiant gas", "argon", "helium", "inert gas"],
  "중독성유해물질": ["벤젠", "톨루엔", "크실렌", "유기용제중독", "toxic substance", "benzene", "toluene", "xylene", "solvent poisoning"],
  "분진/석면": ["분진", "먼지", "가루", "석면", "텍스", "비산", "dust", "asbestos", "particulate", "tex", "scattering"],
  "용접흄": ["용접흄", "fume", "중금속입자", "welding fume", "fume", "heavy metal particle"],
  "병원체/감염": ["세균", "바이러스", "감염병", "혈액", "pathogen", "infection", "bacteria", "virus", "blood"],
  "미끄러운표면": ["기름유출", "빙판", "물기", "미끄럼", "slippery surface", "oil spill", "ice", "wet", "slip"],
  "날카로운모서리": ["엣지", "edge", "날카로운", "버", "burr", "sharp edge", "edge", "sharp", "burr"],
  "돌출부/장애물": ["돌출", "머리부딪힘", "통로장애", "protrusion", "obstruction", "head bump", "pathway obstacle"],
  "부적절조도": ["어두움", "조도불량", "조명미비", "inadequate lighting", "dark", "poor illumination"],

// --- [4. 표준 사고 발생 형태 세분화 - 31종] ---
  "사고(추락)": ["추락", "떨어짐", "고소추락", "fall", "falling from height", "drop"],
  "사고(전도)": ["전도", "넘어짐", "자빠짐", "trip", "slip", "fall on same level", "overturn"],
  "사고(충돌)": ["충돌", "부딪힘", "접촉", "collision", "struck against", "contact"],
  "사고(협착)": ["협착", "끼임", "말림", "감김", "caught-in", "caught-between", "crush", "pinch"],
  "사고(낙하)": ["낙하", "물건떨어짐", "상부투하", "falling object", "dropped object"],
  "사고(비래)": ["비래", "날아옴", "튕겨나감", "flying object", "struck by flying object"],
  "사고(베임)": ["베임", "찔림", "창상", "cut", "puncture", "stab", "laceration"],
  "사고(화재)": ["화재", "불남", "화염", "fire", "conflagration", "flame"],
  "사고(폭발)": ["폭발", "터짐", "explosion", "blast", "detonation"],
  "사고(파열)": ["파열", "터져나감", "압력파열", "rupture", "burst", "pressure rupture"],
  "사고(누출)": ["누출", "leak", "유출", "leakage", "spill", "release"],
  "사고(붕괴)": ["붕괴", "무너짐", "도괴", "collapse", "cave-in", "structural failure"],
  "사고(매몰)": ["매몰", "묻힘", "토사매몰", "burial", "engulfment", "trapped"],
  "사고(침수)": ["침수", "물잠김", "침수피해", "flooding", "submersion", "inundation"],
  "사고(익사)": ["익사", "물에빠짐", "수중사고", "drowning", "underwater accident"],
  "사고(감전)": ["감전", "전기충격", "electric shock", "electrocution"],
  "사고(질식)": ["질식", "숨막힘", "질소질식", "asphyxiation", "suffocation", "choking"],
  "사고(중독)": ["중독", "가스흡입", "약품노출", "poisoning", "intoxication", "exposure to toxic"],
  "사고(화상)": ["화상", "데임", "저온화상", "burn", "scald", "thermal burn"],
  "사고(동상)": ["동상", "냉상", "동창", "frostbite", "cold injury"],
  "사고(열사병)": ["열사병", "일사병", "열탈진", "온열질환", "heat stroke", "heat exhaustion", "heat illness"],
  "사고(청력손실)": ["난청", "청력저하", "소음피해", "hearing loss", "deafness", "noise-induced hearing loss"],
  "사고(근골격계)": ["근골격계", "요통", "손목터널", "염좌", "musculoskeletal disorder", "msd", "ergonomic injury", "strain", "sprain"],
  "사고(시력손상)": ["시력", "안구손상", "실명위험", "vision loss", "eye injury", "blindness risk"],
  "사고(피폭)": ["방사선피폭", "조사", "방사선상해", "radiation exposure", "irradiation"],
  "사고(전단)": ["절단", "손가락절단", "신체절단", "amputation", "severance"],
  "사고(압착)": ["압착", "눌림", "하중압박", "compression", "pressing", "crushing pressure"],
  "사고(파편맞음)": ["파편", "비산물", "슬래그맞음", "struck by debris", "flying fragments", "slag hit"],
  "사고(화학화상)": ["화학화상", "산부식", "알칼리부식", "chemical burn", "acid burn", "alkali burn"],
  "사고(급성중독)": ["급성중독", "의식상실", "호흡마비", "acute poisoning", "loss of consciousness", "respiratory arrest"],
  "사고(직업병)": ["직업병", "진폐증", "백혈병", "만성질환", "occupational disease", "pneumoconiosis", "leukemia", "chronic illness"],


 // --- [5. 대상 기계·설비 세분화 - 80종] ---
  "설비(천장크레인)": ["천장크레인", "over head crane", "ohc", "호이스트", "overhead crane", "bridge crane", "hoist"],
  "설비(이동식크레인)": ["이동식크레인", "카고크레인", "하이드로크레인", "크레인양중", "mobile crane", "cargo crane", "hydro crane", "truck crane"],
  "설비(타워크레인)": ["타워크레인", "tower crane", "t/c", "construction crane", "climbing crane"],
  "설비(지게차)": ["지게차", "포크리프트", "forklift", "리치", "forklift truck", "reach truck", "lift truck"],
  "설비(굴착기)": ["굴착기", "포크레인", "backhoe", "백호", "excavator", "digger", "poclain"],
  "설비(덤프트럭)": ["덤프트럭", "사토운반", "골재운반", "dump truck", "tipper truck", "hauling truck"],
  "설비(로더/불도저)": ["로더", "loader", "불도저", "dozer", "wheel loader", "bulldozer", "skid steer"],
  "설비(항타기)": ["항타기", "천공기", "오거", "드롭해머", "pile driver", "piling rig", "auger machine", "drilling rig"],
  "설비(콘크리트펌프카)": ["펌프카", "cpb", "타설장비", "concrete pump truck", "boom pump", "placing boom"],
  "설비(고소작업차)": ["스카이차", "고소작업차", "바스켓차", "sky lift", "bucket truck", "aerial platform"],
  "설비(롤러/피니셔)": ["로드롤러", "아스팔트피니셔", "다짐장비", "road roller", "asphalt finisher", "compactor"],
  "설비(벨트컨베이어)": ["벨트컨베이어", "컨베어", "이송벨트", "belt conveyor", "conveyor system", "material handling"],
  "설비(스크류컨베이어)": ["스크류컨베이어", "피더", "feeder", "screw conveyor", "auger conveyor", "feeder system"],
  "설비(유압프레스)": ["유압프레스", "프레스작업", "press", "hydraulic press", "compression machine"],
  "설비(기계프레스)": ["기계식프레스", "크랭크프레스", "mechanical press", "crank press", "stamping press"],
  "설비(전단기/절곡기)": ["전단기", "절곡기", "샤링기", "벤딩기", "shearing machine", "bending machine", "folding machine"],
  "설비(사출/압출기)": ["사출성형기", "압출기", "인젝션", "injection molding", "extruder", "molding machine"],
  "설비(산업용로봇)": ["산업용로봇", "협동로봇", "로봇암", "industrial robot", "cobot", "robotic arm"],
  "설비(공작기계)": ["밀링", "선반", "mct", "cnc", "보링기", "machine tool", "milling", "lathe", "machining center"],
  "설비(연삭/연마기)": ["연삭기", "탁상그라인더", "샌딩기", "grinding machine", "bench grinder", "sanding machine"],
  "설비(목재가공기)": ["둥근톱", "대패", "드릴링머신", "woodworking machine", "circular saw", "planer", "drilling machine"],
  "설비(배전반/분전반)": ["수배전반", "분전함", "mcc", "판넬", "switchboard", "distribution board", "panelboard", "mcc panel"],
  "설비(변압기)": ["변압기", "tr", "transformer", "유입변압기", "electrical transformer", "oil-filled transformer"],
  "설비(전동기)": ["모터", "motor", "전동기", "펌프모터", "electric motor", "drive motor"],
  "설비(발전기)": ["발전기", "비상발전기", "generator", "emergency generator", "genset"],
  "설비(반응기)": ["반응기", "reactor", "r-", "중합기", "chemical reactor", "polymerization reactor"],
  "설비(혼합기/교반기)": ["혼합기", "교반기", "mixer", "agitator", "blending machine", "stirrer"],
  "설비(열교환기)": ["열교환기", "e-", "heat exchanger", "콘덴서", "heat exchanger", "condenser", "cooler"],
  "설비(압력용기)": ["압력용기", "v-", "pressure vessel", "에어탱크", "pressure vessel", "air receiver tank"],
  "설비(저장탱크)": ["저장탱크", "t-", "storage tank", "사일로", "storage tank", "silo", "cistern"],
  "설비(탑조류)": ["흡착탑", "증류탑", "tower", "scrubber", "adsorption tower", "distillation column", "scrubber tower"],
  "설비(원심펌프)": ["원심펌프", "p-", "centrifugal pump", "radial flow pump"],
  "설비(용적식펌프)": ["기어펌프", "다이어프램펌프", "플런저펌프", "positive displacement pump", "gear pump", "diaphragm pump"],
  "설비(공기압축기)": ["컴프레서", "compressor", "에어콤프", "air compressor", "reciprocating compressor"],
  "설비(송풍기/블로워)": ["송풍기", "팬", "fan", "blower", "환풍기", "ventilation fan", "industrial blower", "exhaust fan"],
  "설비(원심분리기)": ["원심분리기", "탈수기", "decanter", "centrifuge", "decanter centrifuge"],
  "설비(분쇄기/파쇄기)": ["분쇄기", "파쇄기", "crusher", "grinder", "pulverizer", "shredder"],
  "설비(건조기)": ["건조기", "dryer", "건조로", "industrial dryer", "drying oven"],
  "설비(여과기)": ["여과기", "filter", "필터하우징", "filtration system", "filter housing", "strainer"],
  "설비(보일러)": ["보일러", "온수보일러", "스팀보일러", "industrial boiler", "steam boiler", "water heater"],
  "설비(가열로/소각로)": ["가열로", "소각로", "f-", "furnace", "industrial furnace", "incinerator"],
  "설비(냉각탑)": ["냉각탑", "cooling tower", "ct-", "industrial cooling tower"],
  "설비(집진기)": ["집진기", "bag filter", "대기오염방지시설", "dust collector", "baghouse", "air scrubber"],
  "설비(플레어스택)": ["플레어스택", "flare stack", "연소탑", "flare system", "gas flare"],
  "설비(방호장치)": ["방호덮개", "울타리", "인터록", "광전자감지기", "safety guard", "fence", "interlock", "light curtain"],
  "설비(비상정지장치)": ["비상정지", "e-stop", "풀코드스위치", "emergency stop", "e-stop button", "pull cord switch"],
  "설비(안전밸브)": ["psv", "안전변", "srv", "파열판", "pressure safety valve", "relief valve", "rupture disk"],
  "설비(가스검지기)": ["가스감지기", "det-", "detector", "수신기", "gas detector", "gas sensor", "gas monitor"],
  "설비(화재감지기)": ["연기감지기", "열감지기", "불꽃감지기", "fire detector", "smoke detector", "heat detector", "flame detector"],
  "설비(소화설비)": ["소화기", "옥내소화전", "스프링클러", "할론설비", "firefighting system", "extinguisher", "sprinkler", "fire hydrant"],
  "설비(가설시설물)": ["비계", "동바리", "가설난간", "작업발판", "temporary structure", "scaffolding", "shoring", "guardrail"],
  "설비(이동수단)": ["작업대차", "핸드카", "자전거", "오토바이", "transportation", "cart", "hand truck", "bicycle"],
  "설비(수동공구)": ["망치", "스패너", "드라이버", "칼", "톱", "hand tool", "hammer", "wrench", "screwdriver", "saw"],
  "설비(전동공구)": ["전동드릴", "임팩", "핸드그라인더", "power tool", "electric drill", "impact wrench", "hand grinder"],
  "설비(절연용구)": ["절연봉", "절연매트", "방전봉", "insulating tool", "hot stick", "insulation mat", "discharge rod"],
  "설비(계측기)": ["멀티테스터", "클램프메타", "절연저항계", "measuring instrument", "multimeter", "clamp meter", "megger"],
  "설비(배관자재)": ["개스킷", "볼트", "너트", "유니온", "커플링", "piping material", "gasket", "bolt", "nut", "coupling"],
  "설비(조명기구)": ["투광등", "작업등", "비상조명", "lighting fixture", "floodlight", "work light", "emergency light"],
  "설비(환기장치)": ["송풍기", "덕트", "후드", "배기구", "ventilation system", "duct", "hood", "exhaust vent"],
  "설비(승강설비)": ["엘리베이터", "리프트", "곤돌라", "lifting equipment", "elevator", "hoist", "gondola"],
  "설비(실험장비)": ["가스크로마토그래피", "흄후드", "원심분리기", "laboratory equipment", "gc", "fume hood", "centrifuge"],
  "설비(포장기계)": ["래핑기", "결속기", "제함기", "packaging machine", "wrapping machine", "strapping machine"],
  "설비(냉동기)": ["냉동기", "칠러", "chiller", "냉매", "refrigeration unit", "chiller", "refrigerant"],
  "설비(배터리)": ["ups", "ess", "축전지", "battery", "ups system", "energy storage"],
  "설비(유압장치)": ["유압유니트", "펌프유닛", "아큐뮬레이터", "hydraulic system", "hydraulic unit", "accumulator"],
  "설비(세척설비)": ["고압세척기", "초음파세척기", "자동세척기", "cleaning equipment", "pressure washer", "ultrasonic cleaner"],
  "설비(정수설비)": ["정수장치", "역삼투압", "ro", "water purification", "reverse osmosis", "water filter"],
  "설비(공조설비)": ["ahu", "공조기", "냉난방기", "hvac", "ahu", "air conditioner"],
  "설비(윤활장치)": ["그리스건", "오일펌프", "자동윤활기", "lubrication system", "grease gun", "oil pump", "auto lubricator"],
  "설비(방제장비)": ["오일펜스", "흡착포", "중화제", "prevention equipment", "oil fence", "sorbent", "neutralizer"],
  "설비(가열기)": ["히터", "heater", "열선", "heating unit", "heater", "heating cable"],
  "설비(분무기)": ["분무기", "스프레이어", "방역기", "sprayer", "atomizer", "disinfection sprayer"],
  "설비(인양용구)": ["와이어", "체인블록", "레버블록", "lifting tool", "wire rope", "chain block", "lever hoist"],
  "설비(사다리류)": ["우마", "작업대", "계단", "ladder type", "trestle", "work platform", "stairs"],
  "설비(방화구획)": ["방화문", "셔터", "내화채움재", "fire compartment", "fire door", "fire shutter", "firestop"],
  "설비(가스용기)": ["실린더", "봄베", "lpg통", "gas cylinder", "gas bottle", "lpg tank"],
  "설비(전선로)": ["트레이", "전선관", "덕트", "conduit line", "cable tray", "conduit", "wire duct"],
  "설비(지보공)": ["잭서포트", "파이프서포트", "동바리", "shoring system", "jack support", "pipe support", "shoring post"],
  "설비(거푸집)": ["유로폼", "갱폼", "알폼", "formwork", "euroform", "gang form", "aluminum form"],
  "설비(펜스)": ["가설휀스", "EGI휀스", "안전제일", "safety fence", "temporary fence", "barricade"],

// --- [7. 안전 보건 관리 및 절차 세분화 - 70종] ---
  "관리(작업전TBM)": ["tbm", "Tool Box Meeting", "안전조회", "작업전회의", "위험전파", "toolbox talk", "pre-job briefing", "safety huddle"],
  "관리(안전교육)": ["안전교육", "특별교육", "정기교육", "물질안전보건교육", "msds교육", "safety training", "orientation", "msds training"],
  "관리(작업허가)": ["작업허가", "ptw", "permit", "승인후작업", "허가서", "work permit", "permit to work", "approval"],
  "관리(위험성평가)": ["위험성평가 실시", "jsa작성", "jra", "위험요인파악", "risk assessment", "job safety analysis", "hazard identification"],
  "관리(인원점검)": ["출역인원", "명단확인", "건강상태체크", "음주측정", "manpower check", "attendance", "health check", "breathalyzer"],
  "관리(현장순회)": ["현장순회", "안전점검", "패트롤", "patrol", "감독관", "site walk", "safety inspection", "patrol", "supervisor"],
  "준비(신호수배치)": ["신호수", "유도자", "신호수배치", "호각", "수신호", "signalman", "spotter", "banksman", "hand signal"],
  "준비(감시자배치)": ["화기감시자", "밀폐공간감시인", "감시인배치", "화재감시", "fire watch", "hole watch", "confined space attendant"],
  "준비(에너지차단)": ["loto", "잠금장치", "시건", "에너지격리", "차단확인", "lockout", "tagout", "energy isolation", "padlock"],
  "준비(안전표지)": ["표지판", "안전제일", "현수막", "경고표지", "tag", "safety sign", "warning tag", "barricade tape"],
  "준비(구획설정)": ["통제구역", "라바콘", "안전펜스", "바리케이트", "구획선", "demarcation", "exclusion zone", "traffic cone", "barricade"],
  "준비(조도확보)": ["조명설치", "투광등", "조도측정", "어두운장소", "lighting", "floodlight", "lux measurement", "illumination"],
  "준비(환기시설)": ["급배기", "송풍기", "덕트설치", "강제환기", "ventilation", "blower", "duct installation", "forced air"],
  "준비(접지확인)": ["접지체결", "접지점검", "어스선", "earth", "grounding", "earthing", "bonding"],
  "준비(가스측정)": ["가스농도", "산소농도", "측정기", "검지기", "복합가스", "gas testing", "oxygen level", "multi-gas detector"],
  "준비(장비점검)": ["장비검사", "입고점검", "pre-use", "체크리스트", "equipment inspection", "pre-use check", "checklist"],
  "준비(보호구지급)": ["보호구지급", "보호구상태", "착용상태", "ppe issuance", "ppe condition", "donning check"],
  "보호구(안전모)": ["안전모", "턱끈", "추락방지용 안전모", "hard hat", "helmet", "chin strap"],
  "보호구(안전화)": ["안전화", "절연화", "정전화", "발가락보호", "safety shoes", "steel toe boots", "insulating shoes"],
  "보호구(보안경)": ["보안경", "고글", "차광안경", "눈보호", "safety glasses", "goggles", "eye protection"],
  "보호구(안전장갑)": ["안전장갑", "절연장갑", "내화학장갑", "코팅장갑", "gloves", "insulating gloves", "chemical resistant gloves"],
  "보호구(방진마스크)": ["방진마스크", "특급마스크", "먼지방지", "dust mask", "respirator", "n95", "particulate mask"],
  "보호구(방독마스크)": ["방독마스크", "정화통", "방독면", "필터교체", "gas mask", "chemical cartridge", "respirator filter"],
  "보호구(송기마스크)": ["송기마스크", "scba", "공기호흡기", "에어라인", "supplied air respirator", "scba", "airline mask"],
  "보호구(귀마개)": ["귀마개", "귀덮개", "청력보호구", "소음방지", "earplugs", "earmuffs", "hearing protection"],
  "보호구(안전대)": ["안전대", "그네식", "생명줄", "안전블록", "수직구조대", "safety harness", "full body harness", "lanyard", "lifeline", "safety block"],
  "보호구(보호복)": ["방진복", "내화학복", "방열복", "앞치마", "protective clothing", "coverall", "chemical suit", "apron"],
  "보호구(안전면)": ["용접면", "보호면", "페이스쉴드", "welding shield", "face shield", "visor"],
  "보호구(구명장비)": ["구명조끼", "구명환", "튜브", "life jacket", "life buoy", "pfd"],
  "절차(수동조작)": ["수동작업", "인력거동", "직접조작", "manual operation", "manual handling"],
  "절차(자동제어)": ["자동제어", "시퀀스", "원격제어", "automatic control", "remote control", "sequence"],
  "절차(비상대응)": ["비상시", "응급조치", "비상정지", "대피", "emergency response", "first aid", "emergency stop", "evacuation"],
  "절차(연락체계)": ["비상연락망", "무전기", "상황전달", "communication", "emergency contact", "radio"],
  "마무리(잔불감시)": ["잔불확인", "불씨감시", "소화수살수", "fire watch", "smolder check", "post-work inspection"],
  "마무리(LOTO해제)": ["잠금해제", "시건해제", "전원투입", "복구", "loto removal", "unlocking", "re-energization"],
  "마무리(정리정돈)": ["정리정돈", "housekeeping", "통로확보", "자재정리", "housekeeping", "sorting", "cleaning"],
  "마무리(청소)": ["청소", "물청소", "진공청소", "기름닦기", "cleaning", "washing", "vacuuming", "degreasing"],
  "마무리(폐기물수거)": ["폐기물", "쓰레기수거", "잔재물처리", "분리수거", "waste collection", "debris removal", "segregation"],
  "마무리(도구반납)": ["도구반납", "공구정리", "검측기반납", "tool return", "instrument return"],
  "마무리(검수)": ["완료검수", "검사", "준공", "작업종료확인", "inspection", "verification", "completion check"],
  "마무리(보고)": ["종료보고", "결과공유", "차기작업이월", "completion report", "reporting", "handover"],
  "마무리(안전조치복구)": ["난간복구", "덮개폐쇄", "원상복구", "restoration", "guardrail reinstall", "cover closure"],
  "마무리(퍼지완료)": ["퍼지종료", "기밀확인", "정상운전복귀", "purge completion", "leak check", "return to service"],
  "기타(SIMOPS)": ["동시작업", "혼재작업", "간섭작업", "simops", "simultaneous operations", "concurrent work"],
  "기타(야간작업)": ["야간", "심야", "연장작업", "night work", "overtime", "after hours"],
  "기타(단독작업)": ["단독작업", "나홀로", "2인1조미준수", "solo work", "working alone", "lone worker"],
  "기타(기상악화)": ["작업중지", "강풍", "낙뢰", "폭설", "우천시", "adverse weather", "high wind", "lightning", "stop work"],
  "기타(밀폐해제)": ["밀폐해제", "출입금지해제", "declassification", "entry allowed"],
  "기타(안전시설철거)": ["비계해체", "휀스철거", "동바리해체", "dismantling", "scaffold removal", "fence removal"],

}

/**
 * [Batch 7] 고도화된 의미론적(Semantic) 분석 알고리즘
 * 목적: 다국어 지원 및 안전공학적 문맥 추론 기능 강화
 */
const applyComplexSemanticRules = (text, tags) => {
  const lowText = text.toLowerCase();

  // 1. 호흡용 보호구 및 보건 (Health & Respiratory)
  // 키워드: 석면, 분진, 흄, 유기용제, 흡입, 질식 + 마스크, 착용
  if (/(세라크울|석면|분진|흄|fume|유기용제|흡입|질식|유해가스|화학물질|페인트|도장|asbestos|dust|toxic|gas|solvent|inhalation)/.test(lowText) && 
      /(보호구|마스크|방독면|착용|지급|mask|respirator|wear|ppe)/.test(lowText)) {
    tags.add("보호구(방진마스크)");
    tags.add("보호구(방독마스크)");
  }

  // 2. 고소 추락 방지 (Fall Protection)
  // 키워드: 고소, 단부, 비계, 지붕, 개구부, 사다리 + 안전대, 생명줄, 체결
  if (/(고소|단부|비계|지붕|개구부|추락|떨어짐|높은곳|ladder|scaffold|roof|height|edge|opening|fall)/.test(lowText) && 
      /(보호구|안전대|생명줄|안전블록|착용|체결|harness|lanyard|lifeline|tie-off)/.test(lowText)) {
    tags.add("보호구(안전대)");
  }

  // 3. 화기 작업 및 소방 (Hot Work & Fire Safety)
  // 키워드: 용접, 절단, 그라인딩, 불티 + 소화기, 불꽃, 감시자
  if (/(용접|절단|용단|그라인딩|불티|아크|welding|cutting|grinding|spark|arc|hot work)/.test(lowText) && 
      /(소화기|불꽃방지|비산방지|감시자|fire extinguisher|fire watch|blanket)/.test(lowText)) {
    tags.add("준비(감시자배치)");
    tags.add("사고(화재)");
  }

  // 4. 에너지 차단 (LOTO / Energy Isolation)
  // 키워드: 정전, 전원차단, 밸브차단 + 잠금, 시건, 표지판
  if (/(정전|전원 차단|밸브 차단|동력 차단|유압 차단|power off|de-energize|valve close|isolation)/.test(lowText) && 
      /(잠금|시건|표지판|tag|loto|lockout|padlock)/.test(lowText)) {
    tags.add("준비(에너지차단)");
  }

  // 5. 밀폐공간 및 산소 측정 (Confined Space & Gas Testing)
  // 키워드: 탱크, 맨홀, 핏트, 질식 + 농도측정, 환기
  if (/(탱크|맨홀|핏트|용기내부|밀폐|confined|tank|manhole|pit|vessel)/.test(lowText) && 
      /(농도|측정|검지|환기|송풍|testing|ventilation|monitoring|oxygen)/.test(lowText)) {
    tags.add("준비(가스측정)");
    tags.add("준비(환기시설)");
  }

  // 6. 기계적 끼임 방지 (Machine Guarding)
  // 키워드: 회전부, 컨베이어, 롤러 + 방호덮개, 인터록, 비상정지
  if (/(회전부|컨베이어|롤러|구동부|끼임|협착|rotating|conveyor|roller|moving part|crush|pinch)/.test(lowText) && 
      /(방호|덮개|울타리|인터록|비상정지|guard|fence|interlock|e-stop)/.test(lowText)) {
    tags.add("설비(방호장치)");
    tags.add("설비(비상정지장치)");
  }

  // 7. 중량물 양중 및 줄걸이 (Lifting & Rigging)
  // 키워드: 크레인, 양중, 인양 + 줄걸이, 샤클, 신호수
  if (/(크레인|양중|인양|중량물|crane|lifting|hoisting|heavy load)/.test(lowText) && 
      /(줄걸이|슬링|샤클|와이어|신호수|유도자|rigging|sling|shackle|signalman|spotter)/.test(lowText)) {
    tags.add("준비(신호수배치)");
    tags.add("줄걸이작업");
  }

  // 8. 전기 감전 방지 (Electrical Safety)
  // 키워드: 배전반, 케이블, 전선 + 접지, 절연, 차단기
  if (/(전기|배전반|판넬|케이블|전선|전격|electrical|panel|cable|wiring|shock)/.test(lowText) && 
      /(접지|절연|차단기|검전기|grounding|insulation|breaker|detector)/.test(lowText)) {
    tags.add("준비(접지확인)");
    tags.add("설비(배전반/분전반)");
  }

  // 9. 사전 안전 예방 (Pre-task Safety)
  // 키워드: 작업 전, 시작 전, 투입 전 + 교육, TBM, 회의
  if (/(작업 전|시작 전|투입 전|사전|pre-job|before work|start of shift)/.test(lowText) && 
      /(교육|조회|미팅|회의|공유|전파|tbm|training|briefing|meeting)/.test(lowText)) {
    tags.add("관리(작업전TBM)");
  }

  // 10. 작업 마무리 및 환경 (Housekeeping)
  // 키워드: 작업 후, 종료 후, 마무리 + 정리, 청소, 수거
  if (/(작업 후|종료 후|마무리|완료|after work|completion|finish)/.test(lowText) && 
      /(정리|정돈|청소|수거|폐기물|housekeeping|cleaning|waste|removal)/.test(lowText)) {
    tags.add("마무리(정리정돈)");
  }
};

// ✅ [메인 함수] 텍스트 기반 자동 태그 추출기
export const extractAutoTagsFromJSA = (projectName, analysisData) => {
  // 전처리: 텍스트 병합 및 정규화
  const combinedContent = (projectName + " " + JSON.stringify(analysisData)).toLowerCase();
  const tags = new Set();

  // 1단계: 300종 키워드 맵 순회 매칭
  Object.entries(DIMENSIONAL_KEYWORD_MAP).forEach(([tag, keywords]) => {
    if (keywords.some(kw => combinedContent.includes(kw))) {
      tags.add(tag);
    }
  });

  // 2단계: 복합 매칭 룰셋 적용
  applyComplexSemanticRules(combinedContent, tags);

  return Array.from(tags);
};