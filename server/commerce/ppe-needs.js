import { commerceText } from './needs.js';

// Product suggestions, not a determination of workplace PPE suitability.
// Each supported purpose must also match a separately reviewed product spec.
export const PPE_PURPOSES = {
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
 if(/수성페인트.*롤러|water.based.*paint.*roller|방진복|분진복/.test(title+' '+listed)
   &&!/용접|화기|화염|유기용제|석면|방사|납 |weld|flame|solvent|asbestos|radioactive/.test(title))add('protective-coverall',92);
 const respiratoryRisk=/유해가스|산소결핍|일산화탄소|석면|발파|용접|방독|가스·|가스 및|증기|oxygen|carbon monoxide|asbestos|vapou?r|gas|weld/.test(evidence);
 const positiveMask=/방진마스크/.test(listed)||/방진마스크.{0,25}(?:착용|준비|밀착|선정)|(?:착용|준비).{0,15}방진마스크/.test(body);
 if(positiveMask&&!respiratoryRisk&&!/방진마스크.{0,30}(?:아니|않|못|부적합|금지)/.test(body))add('particulate-respirator',90);
 return needs;
}
