import { commerceText } from './needs.js';

// Product suggestions, not a determination of workplace PPE suitability.
// Each supported purpose must also match a separately reviewed product spec.
export const PPE_PURPOSES = {
 'safety-helmet':'industrial-falling-object-head-protection',
 'fall-arrest-harness':'full-body-harness-system-component',
 'contamination-coverall':'non-hazardous-dry-contamination-only',
 'safety-glasses':'general-impact-eye-protection',
 'safety-goggles':'indirect-vent-splash-eye-protection',
 'earplugs':'disposable-foam-hearing-protection',
 'work-gloves':'dry-general-handling',
 'protective-coverall':'type5-type6-limited-splash-dust',
 'particulate-respirator':'kr-class1-particulates-only',
};
export function extractPpeNeeds(snapshot) {
 const body=commerceText(snapshot), title=String(snapshot.title||'').toLowerCase();
 const listed=(snapshot.ppe||[]).join(' ').toLowerCase();
 const evidence=body+' '+listed, needs=[];
 const add=(category,score)=>needs.push({category,constraints:{purpose:PPE_PURPOSES[category]},origin:'ppe-content-rule',score});
 // Match the actual document body as well as the structured PPE selection.
 // A product is a purchase candidate; the purpose never asserts site approval.
 const positiveMention = pattern => {
   const parts=evidence.split(/[。.!?\n]/);
   return parts.some(part=>pattern.test(part)&&!/(?:착용|사용)\s*(?:금지|불필요|하지\s*않)|불필요|미사용|not required|do not (?:use|wear)/i.test(part));
 };
 const construction=/조적|블록벽|옹벽|비계|거푸집|철근|해체|철거|굴착|양중|크레인|지붕|타설|건설|construction|scaffold|demolition|masonry|lifting/.test(title);
 if((positiveMention(/안전모|보호모|hard hat|safety helmet/)
   ||(construction&&/낙하|낙하물|머리|상부 작업|falling object|overhead/.test(evidence)))
   &&!/아크 플래시|arc flash/.test(title))add('safety-helmet',108);
 if(positiveMention(/안전대(?!책|상)|안전그네|전신형 하네스|full.body harness|fall.arrest harness|추락방지장치|추락\s*방지\s*시스템|fall.protection\s*(?:device|system)/)
   &&!/로프 접근|로프접근|rope access|수목 등반|tree climbing/.test(title)){add('fall-arrest-harness',116); if(/고소\s*작업대|aerial\s*platform|mewp|boom\s*lift/.test(title))needs.at(-1).constraints.configuration='harness-only';}
 const chemical=/세정|세척|약품|화학|도장|페인트|모르타르|콘크리트|레미콘|방수|chemical|paint|solvent/.test(title);
 const eye=/보안경|고글|눈 보호|safety glasses|goggles|eye protection/.test(evidence);
 if(eye&&!/레이저|용접|laser|아크|weld/.test(title))add(chemical||/밀착형|고글|goggles/.test(evidence)?'safety-goggles':'safety-glasses',96);
 if(/귀마개|earplugs?/.test(evidence)&&!/귀마개.{0,20}(?:착용 금지|사용 금지|불필요)/.test(body))add('earplugs',94);
 const gloveContext=/장갑|work gloves|handling gloves/.test(listed)||/장갑.{0,15}(?:착용|준비|상태)|작업용 장갑/.test(body);
 const gloveExclusion=/선반|드릴|절삭|톱|루터|프레스|회전|컨베이어|용접|전기|활선|절연|칼|날카|절단|베임|절상|식품|식재료|주방|냉동|냉장|고온|화상|쓰레기|가스|밀폐|lathe|drill|saw|rotat|weld|electric|knife|cutting|food|cold|hot|waste|gas|confined/.test(title+' '+body)
   ||/장갑.{0,25}(?:금지|제거|미착용|말림|끼지|착용하지)|(?:금지|제거).{0,15}장갑/.test(body);
 if(gloveContext&&!chemical&&!gloveExclusion)add('work-gloves',88);
 // Manufacturer lists painting/coating as an application; no flame, hot-work,
 // chemical immersion, asbestos or hazardous-material removal inference.
 if((/수성페인트.*롤러|water.based.*paint.*roller/.test(title)||(/샌딩|샌더|면갈이|분체|시멘트|모르타르|sanding|powder handling/.test(title)&&/분진|먼지|dust/.test(evidence))||positiveMention(/방진복|분진복|분진.{0,16}보호복|보호복.{0,16}분진|dust.{0,16}(?:coverall|suit)/))
   &&!/용접|화기|화염|유기용제|석면|방사|납 |weld|flame|solvent|asbestos|radioactive/.test(title))add('protective-coverall',104);
 const ordinaryContamination=positiveMention(/오염방지복|오염 방지복|일회용 작업복|일반.{0,12}오염.{0,12}보호복|non.hazardous.{0,20}coverall/);
 if(ordinaryContamination&&!/석면|유해분진|생물|감염|멸균|무균|방사|화학|약품|유기용제|용접|화염|asbestos|hazardous dust|biohazard|infect|steril|aseptic|chemical|solvent|weld|flame/.test(evidence))add('contamination-coverall',102);
 const respiratoryRisk=/유해가스|산소결핍|일산화탄소|석면|발파|용접|방독|가스·|가스 및|증기|oxygen|carbon monoxide|asbestos|vapou?r|gas|weld/.test(evidence);
 const positiveMask=/방진마스크/.test(listed)||/방진마스크.{0,25}(?:착용|준비|밀착|선정)|(?:착용|준비).{0,15}방진마스크/.test(body);
 if(positiveMask&&!respiratoryRisk&&!/방진마스크.{0,30}(?:아니|않|못|부적합|금지)/.test(body))add('particulate-respirator',90);
 return needs;
}
