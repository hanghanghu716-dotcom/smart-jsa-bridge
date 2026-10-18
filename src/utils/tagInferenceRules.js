// Search classification only. These rules never choose safety controls or risk scores.
export const industryTags = new Set('건축공사|토목공사|플랜트공사|철강/제강|조선/해양|자동차제조|반도체/전자|제약/바이오|물류/운송|폐기물처리|에너지/발전|식품제조|금속가공|화공/특수|인프라/환경|지반/기초|철도/궤도|조경/산림|철거/해체|정비/보수|통신/네트워크|수행부서_공통|시설관리|연구/시험|항공/우주'.split('|'));
const taskTags = new Set('고소작업(사다리)|고소작업(비계)|고소작업(고소작업대)|고소작업(지붕/달비계)|용접(아크)|용접(가스/티그)|절단/용단|그라인딩|밀폐공간(탱크)|밀폐공간(맨홀/핏트)|밀폐공간(반응기/탑)|전기정전작업|전기활선작업|전기수배전반|굴착(터파기)|굴착(붕괴위험)|중량물(크레인)|중량물(인양)|줄걸이작업|배관설치|밸브조작|퍼지/기밀|맹판작업|플랜지체결|촉매교체|기계분해/조립|도장/코팅|석면해체|방사선투과|잠수작업|발파작업|양중기설치/해체|콘크리트타설|철골작업|벌목작업|가설전기|항타/항발|기초공사|방수작업|조적/미장|창호/유리|내장/목공|수장공사|승강기작업|철도궤도|터널굴착|해상공사|관로공사|포장공사|교량가설'.split('|'));
export function tagEvidenceGroup(tag) {
  if (industryTags.has(tag)) return 'industry';
  if (taskTags.has(tag) || tag.startsWith('설비(')) return 'task';
  if (/^(관리|준비|보호구|절차|마무리|기타)\(/.test(tag)) return 'control';
  return 'hazard';
}

// A body part is not a vehicle, a clamp is not pipe installation, and a
// commissioning release is not a leak. Keep specific phrases and translated
// category labels; do not infer specialist categories from these generic words.
const ambiguous = {
  '건축공사': 'construction|commercial|structure|architecture|구조물',
  '토목공사': 'civil|infrastructure',
  '플랜트공사': 'plant|facility',
  '철강/제강': 'steel|metal|coil|rolling|furnace|코일',
  '자동차제조': 'car|body|의장',
  '반도체/전자': 'display|circuit',
  '제약/바이오': 'bio|culture|lab|클린',
  '물류/운송': 'delivery|unloading|terminal|container|하역',
  '폐기물처리': 'waste|폐기물',
  '에너지/발전': 'energy|wind',
  '금속가공': 'machining|cutting|가공|절삭',
  '화공/특수': 'chemical|compound|extraction',
  '지반/기초': 'ground|drilling|천공|파일',
  '철도/궤도': 'track|rail|station',
  '철거/해체': 'crushing|debris|잔재물',
  '수행부서_공통': 'site|office|현장|사업소',
  '연구/시험': 'test|analysis|measurement|테스트|분석|측정',
  '고소작업(고소작업대)': 'sky|리프트|렌탈',
  '용접(아크)': 'arc',
  '절단/용단': 'cutting',
  '밀폐공간(탱크)': 'vessel|drum|드럼',
  '밀폐공간(반응기/탑)': 'reactor|column|tower|반응기|컬럼|흡착탑',
  '굴착(붕괴위험)': 'collapse|slope|붕괴|사면',
  '중량물(인양)': 'lifting|하중',
  '배관설치': 'pipe|fitting|파이프|피팅',
  '밸브조작': 'operation|opening|closing|조작|개폐|개방',
  '촉매교체': 'filling|loading|충진',
  '기계분해/조립': 'assembly|조립',
  '석면해체': 'tex|slate|abatement|텍스',
  '방사선투과': 'rt',
  '발파작업': 'explosive',
  '양중기설치/해체': 'dismantling',
  '철골작업': 'beam|column|기둥',
  '항타/항발': 'driving|auger',
  '방수작업': 'epoxy|urethane|에폭시|우레탄',
  '창호/유리': 'glass',
  '승강기작업': 'lift',
  '철도궤도': 'rail',
  '관로공사': 'burial|connection|접속|매설',
  '교량가설': 'segment|세그먼트',
  '회전체/말림위험': 'belt|chain|축',
  '왕복동/끼임위험': 'slide',
  '누전/지락': 'leakage',
  '잔류전하': 'discharge|방전',
  '전리방사선': 'exposure|피폭',
  '비전리방사선': 'ir',
  '독성가스(황화수소)': 'toxic gas',
  '용접흄': 'fume',
  '사고(추락)': 'fall|drop|떨어짐',
  '사고(충돌)': 'contact|접촉',
  '사고(누출)': 'release',
  '사고(매몰)': 'trapped',
  '사고(피폭)': '조사',
  '사고(압착)': 'pressing|compression',
  '설비(천장크레인)': 'hoist|호이스트',
  '설비(벨트컨베이어)': 'material handling',
  '설비(유압프레스)': 'press',
  '설비(변압기)': 'tr',
  '설비(반응기)': 'r-',
  '설비(열교환기)': 'e-|콘덴서',
  '설비(압력용기)': 'v-',
  '설비(저장탱크)': 't-',
  '설비(탑조류)': 'tower',
  '설비(원심펌프)': 'p-',
  '설비(가열로/소각로)': 'f-',
  '설비(냉각탑)': 'ct-',
  '설비(가스검지기)': 'det-|detector|수신기',
  '설비(배관자재)': 'bolt|nut|coupling|볼트|너트|커플링',
  '준비(접지확인)': 'earth|bonding',
  '준비(안전표지)': 'tag',
};
const additions = {
  '왕복동/끼임위험': ['pinch points'],
  '날카로운모서리': ['sharp edges'],
  '내장/목공': ['woodworking', 'workbench', 'mortise', 'carpentry', '목재', '목공'],
  '식품제조': ['sugar silo', 'sugar conveyor', '설탕 이송', '설탕 사일로'],
  '에너지/발전': ['wind turbine', 'wind farm', '풍력발전기'],
  '기계분해/조립': ['mechanical assembly', 'machine assembly', '기계조립'],
  '밀폐공간(반응기/탑)': ['reactor entry', 'confined space entry', '반응기 내부 출입'],
  '중량물(인양)': ['heavy lifting', 'lifting operation', 'lifting operations', 'lifting plan', 'heavy load'],
  '설비(수동공구)': ['chisel', 'mallet', '끌', '목공용 망치'],
  '용접흄': ['welding fumes'],
  '사고(추락)': ['fall from height', 'falls from height'],
  '준비(접지확인)': ['electrical bonding', 'earth connection'],
};
export function inferenceTerms(tag, original) {
  const excluded = new Set((ambiguous[tag] || '').split('|'));
  return [...original.filter(term => !excluded.has(term.toLowerCase())), ...(additions[tag] || [])];
}
