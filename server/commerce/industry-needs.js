import { cleanCommerceText, commerceText } from './text.js';

// Industry requirements complement task/risk controls for every public JSA and
// case study. An industry mention alone is not a product specification.
export const INDUSTRY_PURPOSES = {
 'food-hygiene-clothing':'food-production-hygiene-clothing',
 'food-hair-cover':'food-production-hair-containment',
 'food-cleaning-brush':'food-contact-equipment-manual-cleaning',
 'food-equipment-sanitizer':'food-contact-equipment-disinfection',
 'food-cip-cleaner':'validated-food-cip-cleaning',
};
export const INDUSTRY_SPECIFICATION_HOSTS = {
 'food-hygiene-clothing':['www.portwest.com','www.palinternational.com','food-uniform.co.kr'],
 'food-hair-cover':['www.palinternational.com','food-uniform.co.kr'],
 'food-cleaning-brush':['www.vikan.com','vikan.com'],
 'food-equipment-sanitizer':['www.ecolab.com','en-kr.ecolab.com','www.diversey.com','diversey.com','diverseyvericlean.com','www.yuhanrox.co.kr','yuhanrox.co.kr'],
 'food-cip-cleaner':['www.ecolab.com','en-kr.ecolab.com','www.diversey.com','diversey.com'],
};
export const PROCESS_CHEMICALS = new Set(['food-equipment-sanitizer','food-cip-cleaner']);
const food = /우유|유제품|낙농|식품|식음료|음료|식재료|제과|제빵|육가공|수산물|설탕|\b(?:milk|dairy|food|beverage|bakery|meat processing|sugar)\b/;
const hygiene = /위생|세척|세정|살균|소독|교차\s*오염|제품\s*접촉|\b(?:cip|haccp)\b|hygien|saniti|pasteuri|cleaning|food.contact/;
const nonFood = /반도체|의약|제약|바이알|의료|병원|폐수|하수|semiconductor|pharma|vial|hospital|wastewater/;
function positiveText(snapshot) {
 // Do not turn excluded, unnecessary or prohibited tasks into purchases.
 return commerceText(snapshot).split(/[.!?;。]|\n/).filter(part=>
  !/(?:불필요|필요\s*없|하지\s*않|사용\s*금지|제외\s*범위|not\s+(?:required|needed)|do\s+not|out.of.scope)/.test(part)).join('. ');
}
export function foodHygieneContext(snapshot) {
 const identity=cleanCommerceText([snapshot.title,snapshot.scope].filter(Boolean).join(' '));
 if(nonFood.test(identity))return false;
 const body=positiveText(snapshot);
 // Generic maintenance titles can be qualified by the actual process/scope.
 return food.test(body)&&hygiene.test(body);
}
export function industryNeeds(snapshot) {
 if(!foodHygieneContext(snapshot))return [];
 const body=positiveText(snapshot),needs=[];
 const add=(category,reason,stage,score)=>needs.push({category,
  constraints:{purpose:INDUSTRY_PURPOSES[category]},reason,stage,score,
  origin:'industry-context',...(PROCESS_CHEMICALS.has(category)?{requiresProcessReview:true}:{})});
 const prohibited=commerceText(snapshot);
 if(!/위생복.{0,12}(?:불필요|금지|착용하지)|(?:불필요|금지).{0,12}위생복|hygiene clothing.{0,12}not required/.test(prohibited))
  add('food-hygiene-clothing','food-zone-contamination-control','preparation',108);
 if(!/(?:위생모|헤어캡).{0,12}(?:불필요|금지|착용하지)|(?:불필요|금지).{0,12}(?:위생모|헤어캡)|hair cover.{0,12}not required/.test(prohibited))
  add('food-hair-cover','food-zone-hair-containment','preparation',106);
 // CIP alone does not imply that someone needs a hand brush.
 if(/수작업\s*세척|솔\s*(?:세척|청소)|브러시|manual\s*clean|scrub/.test(body)
  ||(/분해|개방|disassembl|open/.test(body)&&/접촉부|위생면|전열판|식품\s*설비|food.contact/.test(body)&&/세척|세정|clean/.test(body)))
  add('food-cleaning-brush','food-contact-surface-cleaning','cleanup',104);
 // These unmet needs are useful for catalogue procurement, but automatic
 // matching cannot establish concentration, temperature or seal compatibility.
 // The engine requires an exact-content process review before showing a SKU.
 if(/소독|위생\s*처리|saniti[sz]|disinfect/.test(body))
  add('food-equipment-sanitizer','validated-food-equipment-disinfection','cleanup',110);
 if(/\bcip\b|정치\s*세정|clean.in.place/.test(body))
  add('food-cip-cleaner','validated-food-cip-process','cleanup',109);
 return needs;
}

// Ordinary housekeeping supplies must not stand in for food-contact hygiene
// tools. Keep other task controls (isolation, barriers, rated PPE) intact.
export const ORDINARY_HYGIENE_SUBSTITUTES = new Set([
 'cleaning-cloth','floor-mop','floor-squeegee','cleaning-bucket','scrub-brush','dish-brush','waste-sack',
]);
