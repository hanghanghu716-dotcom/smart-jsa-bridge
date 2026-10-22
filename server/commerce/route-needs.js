import { commerceText } from './text.js';

// These categories describe visual wayfinding, not vehicle restraint or fall protection.
export const ROUTE_ACCESSORIES=['floor-marking-tape','direction-sign','wet-floor-sign','cable-hanger','tool-pouch'];
export const ROUTE_PURPOSES={
 'pedestrian-cable-cover':'pedestrian-cable-crossing-only',
 'vehicle-cable-protector':'vehicle-crossing-load-rated',
 'pedestrian-barrier':'pedestrian-segregation-not-vehicle-restraint',
 'corner-mirror':'blind-corner-visibility-aid',
 'anti-slip-tape':'compatible-floor-slip-resistance',
 'material-cart':'level-floor-manual-material-transport',
 'hose-reel':'service-and-pressure-compatible-hose-storage',
 'portable-work-light':'non-hazardous-route-lighting',
};
export const ROUTE_SPECIFICATION_HOSTS={
 'pedestrian-cable-cover':['www.checkers-safety.com','checkers-safety.com','www.justrite.com'],
 'vehicle-cable-protector':['www.checkers-safety.com','checkers-safety.com','www.justrite.com'],
 'pedestrian-barrier':['www.asecos.com','www.asafe.com','www.justrite.com'],
 'corner-mirror':['www.moravia.de','www.dancop.com','dancop.com'],
 'anti-slip-tape':['www.3m.co.kr','www.3m.com','multimedia.3m.com'],
 'material-cart':['www.rubbermaidcommercial.com','www.trusco.co.jp'],
 'hose-reel':['www.reelcraft.com','www.hannay.com','www.sankyo-reels.co.jp'],
 'portable-work-light':['www.makita.co.kr','www.makita.co.nz','www.bosch-professional.com','www.pelican.com'],
};
export function routeNeeds(snapshot) {
 const body=commerceText(snapshot).split(/[.!?。]/).filter(part=>!/없음|불필요|해당\s*없|not\s*(?:required|applicable)|no\s+(?:cables?|hoses?|vehicles?|forklifts?)\b/.test(part)).join('. '),needs=[];
 const add=(category,score)=>needs.push({category,constraints:ROUTE_PURPOSES[category]?{purpose:ROUTE_PURPOSES[category]}:{},
   reason:category,stage:'access-and-movement',score,origin:'route-context'});
 const passage=/통로|보행|동선|출입구|계단|복도|walkway|pedestrian|aisle|access route|stair|corridor/.test(body);
 // Mentioning movement alone never adds a generic bundle.
 if(!passage)return needs;
 if(/(?:바닥|보행로|통로).{0,22}(?:라인\s*테이프|라인테이프|구획\s*표시|경계\s*표시|바닥\s*표시)|floor\s*(?:marking|line)\s*tape/.test(body))add('floor-marking-tape',87);
 if(/우회\s*(?:동선|경로|통로)|일방\s*통행|방향\s*(?:표시|안내)|direction\s*sign|one.way\s*(?:route|aisle)|diversion\s*route/.test(body))add('direction-sign',84);
 if(/물기|젖은\s*바닥|물\s*고임|wet\s*floor|standing\s*water/.test(body)&&/미끄|주의\s*표지|slip|warning\s*sign/.test(body))add('wet-floor-sign',86);
 if(/(?:전선|케이블|호스).{0,35}(?:횡단|가로지|걸림|넘어짐)|(?:통로|보행로).{0,20}(?:전선|케이블|호스)|(?:cable|hose).{0,35}(?:cross|trip)/.test(body)){
  const vehicle=/지게차|차량|트럭|forklift|vehicle|truck/.test(body);
  add(vehicle?'vehicle-cable-protector':'pedestrian-cable-cover',99);
 }
 if(/(?:전선|케이블).{0,25}(?:상부\s*거치|걸이|띄워|행거)|cable\s*(?:hanger|suspend)/.test(body))add('cable-hanger',86);
 if(/(?:호스).{0,25}(?:릴|감아|권취|말아\s*보관)|hose\s*reel/.test(body))add('hose-reel',88);
 if(/지게차|차량|forklift|vehicle/.test(body)&&/보행자|보행로|pedestrian/.test(body)
   &&/분리|혼재|충돌|교차|segregat|mix|collision|cross/.test(body))add('pedestrian-barrier',104);
 if(/사각\s*지대|시야\s*(?:불량|제한|가림)|blind\s*corner|obstructed\s*view/.test(body)
   &&/모퉁이|코너|교차|출입구|corner|intersection|doorway/.test(body))add('corner-mirror',93);
 if(/미끄럼\s*방지\s*(?:테이프|논슬립)|논슬립\s*테이프|anti.slip\s*tape/.test(body))add('anti-slip-tape',91);
 if(/(?:자재|부품|공구|상자).{0,25}(?:대차|카트|반복\s*운반)|(?:운반\s*대차|공구\s*카트)|material\s*cart|tool\s*trolley/.test(body)
   &&!/계단.{0,20}(?:운반|이동)|stair.{0,20}(?:transport|carry)/.test(body))add('material-cart',90);
 if(/공구\s*(?:파우치|허리\s*가방)|tool\s*pouch/.test(body)&&!/회전부|말림|rotating|entangl/.test(body))add('tool-pouch',82);
 if(/(?:통로|계단|출입구).{0,25}(?:어두|조도\s*부족|조명\s*부족)|(?:어두운|조도\s*부족).{0,15}(?:통로|계단)|dark\s*(?:walkway|stair|aisle)/.test(body)
   &&!/밀폐\s*공간|가연성|폭발|방폭|유기용제|confined|flammable|explosive|solvent/.test(body))add('portable-work-light',97);
 return needs;
}
