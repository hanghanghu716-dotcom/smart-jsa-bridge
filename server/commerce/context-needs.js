import { commerceText } from './needs.js';

// Needs are derived before looking at the catalogue. A missing reviewed offer
// remains an unmet procurement need; it must never be replaced with stationery.
export const CONTEXT_ACCESSORIES=['barrier-tape','waste-sack','lockout-tag','ordinary-two-way-radio'];
export const EQUIPMENT_PURPOSES={
 'pumped-multigas-detector':'pumped-o2-co-h2s-lel-candidate',
 'intrinsically-safe-radio':'atex-worksite-communication',
 'intrinsically-safe-light':'certified-hazardous-area-inspection-light',
 'portable-ventilator':'fresh-air-ventilation-non-explosive-only',
 'tool-tether':'rated-tool-drop-prevention',
 'fall-safety-net':'personnel-fall-net-engineered-installation',
 'supplied-air-respirator':'supplied-breathing-air-system',
 'escape-breathing-apparatus':'escape-only-independent-air',
 'oil-absorbent':'non-aggressive-oil-spill-cleanup',
 'dust-extractor':'class-m-dust-extraction-not-asbestos',
 'air-blower':'outdoor-leaf-debris-clearing-only',
};
export const SPECIFICATION_HOSTS={
 'pumped-multigas-detector':['senko.co.kr','www.senko.co.kr','senkousa.com','www.senkousa.com'],
 'intrinsically-safe-radio':['www.motorolasolutions.com','docs.motorolasolutions.com','www.entel.co.uk'],
 'intrinsically-safe-light':['www.pelican.com','pelican.com','www.peli.com'],
 'portable-ventilator':['www.dongkun.com','dongkun.com','sjeconomy.com','www.sjeconomy.com','www.komax.co.kr','www.allegrosafety.com'],
 'tool-tether':['www.3m.co.kr','www.3m.com','multimedia.3m.com','www.tajimatool.com','jpn.tajimatool.co.jp'],
 'fall-safety-net':['www.huck.net','www.huck-spain.net','www.huck.co.uk'],
 'supplied-air-respirator':['www.3m.co.kr','www.3m.com','multimedia.3m.com','www.draeger.com'],
 'escape-breathing-apparatus':['www.draeger.com','www.honeywell.com','automation.honeywell.com'],
 'oil-absorbent':['www.3m.co.kr','www.3m.com','multimedia.3m.com'],
 'dust-extractor':['www.bosch-professional.com','www.kaercher.com','www.makita.co.kr'],
 'air-blower':['www.makita.co.kr','www.makita.co.nz','www.bosch-professional.com'],
};
function context(snapshot,body=commerceText(snapshot)){
 const title=String(snapshot.title||'').toLowerCase();
 const confined=/밀폐\s*공간|탱크\s*내부|맨홀\s*(?:내부|진입)|confined\s*space|tank\s*entr/.test(body);
 const explosive=/가연성[\s·・/및유해]{0,7}(?:가스|증기|분진)|폭발성|폭발\s*위험|방폭|flammable\s*(?:gas|vapou?r|dust)|explosive\s*atmosphere|intrinsically\s*safe/.test(body);
 const specialist=/무균|멸균|반도체|클린룸|석면|방사성|생물학|감염|aseptic|steril|semiconductor|cleanroom|asbestos|radioactive|biohazard/.test(title);
 const hazardousCleaning=specialist||confined||/유기용제|산성|강산|강알칼리|화학물질|산·알칼리|용접|고온|플라즈마|열간|숏크리트|화학|solvent|acid|caustic|weld|plasma/.test(title);
 return {title,body,confined,explosive,specialist,hazardousCleaning};
}
export function contextNeeds(snapshot,body=commerceText(snapshot)){
 const c=context(snapshot,body),needs=[];
 const add=(category,reason,stage,score)=>needs.push({category,constraints:{},reason,stage,score,origin:'work-context'});
 if(/출입\s*통제|접근\s*통제|위험\s*구역.{0,15}구획|하부\s*통제|통제선|barricad|exclusion\s*zone|restrict.{0,15}access/.test(body))add('barrier-tape','work-area-boundary','preparation',86);
 if(/잠금\s*표지|잠금표지|사용\s*금지\s*(?:표시|표지)|격리.{0,20}표시|lockout|tagout|out.of.service\s*tag/.test(body))add('lockout-tag','isolation-identification','preparation',89);
 const communication=/무전기|무전\s*연락|지상\s*(?:유도자|감시자)|감시자.{0,30}(?:연락|통신)|연락\s*수단|신호수|two.way\s*radio|communication|signalperson/.test(body);
 if(communication&&!c.explosive&&!c.confined)add('ordinary-two-way-radio','worker-spotter-communication','communication',92);
 // These are cleanup needs from the whole workflow, not just cleaning titles.
 if(!c.hazardousCleaning&&!c.explosive){
  if(/(?:물기|세척수|고인\s*물|물\s*고임|바닥(?:의|에)?\s*(?:물기|고인\s*물)|wet\s*floor|standing\s*water|wash\s*water)/.test(body)
    &&/제거|정리|청소|배수|미끄|수거|remove|clean|slip|drain/.test(body)){
   add('floor-squeegee','post-work-water-removal','cleanup',87);
   add('floor-mop','residual-moisture-cleanup','cleanup',78);
  }
  if(/(?:오염|얼룩|찌꺼기|물기).{0,18}(?:닦|청소)|wipe.{0,20}(?:surface|residue)/.test(body))add('cleaning-cloth','surface-residue-wiping','cleanup',74);
  if(/(?:잔재|파편|포장재|쓰레기|폐기물|절단편|debris|packaging\s*waste).{0,30}(?:수거|분리|정리|처리|collect|remov)|(?:수거|분리).{0,15}(?:잔재|폐기물)/.test(body))add('waste-sack','non-hazardous-debris-collection','cleanup',83);
  if(/(?:빗자루|쓰레받기|broom|dustpan)/.test(body)&&!/분진|미세먼지|dust|silica/.test(body))add('dustpan','coarse-debris-sweeping','cleanup',75);
 }
 return needs;
}
export function equipmentNeeds(snapshot){
 const c=context(snapshot),{title,body}=c,needs=[];
 const add=(category,reason,stage,score)=>needs.push({category,constraints:{purpose:EQUIPMENT_PURPOSES[category]},reason,stage,score,origin:'work-context'});
 if((c.confined||(/가연성\s*가스/.test(body)&&/검지기|가스.{0,10}측정|누설.{0,10}점검/.test(body))||/산소.{0,20}측정|대기\s*측정|복합\s*가스\s*(?:측정|검지)|oxygen.{0,20}monitor/.test(body))
   &&!/불필요.{0,10}(?:산소|대기)\s*측정/.test(body))add('pumped-multigas-detector','atmosphere-measurement','monitoring',120);
 if((c.explosive||c.confined)&&/감시자|연락|통신|비상\s*대응|communication|attendant/.test(body))add('intrinsically-safe-radio','hazardous-area-communication','communication',112);
 if((c.explosive||c.confined)&&/육안|점검|조명|어두|내부|inspect|light/.test(body))add('intrinsically-safe-light','hazardous-area-inspection-light','preparation',100);
 // Unknown gas/dust atmospheres do not receive an ordinary electric fan.
 if(/강제\s*환기|신선한\s*공기|forced\s*ventilation|fresh\s*air/.test(body)&&/비방폭|비폭발|non.explosive/.test(body)&&!c.confined&&!c.explosive&&!c.specialist&&!/유기용제|증기|분진\s*폭발|solvent|flammable/.test(body))add('portable-ventilator','fresh-air-workspace-ventilation','preparation',105);
 if(/공구\s*낙하\s*방지|공구.{0,12}(?:테더|랜야드|안전줄)|tool\s*(?:tether|lanyard)|tether.{0,12}tool/.test(body))add('tool-tether','falling-tool-control','preparation',102);
 // A personnel net and a debris net are different products. No net is inferred
 // solely from an aerial-platform title or a generic fall-risk mention.
 if(/추락\s*방호망|추락\s*방지망|personnel\s*safety\s*net|fall.arrest\s*net/.test(body)&&!/방호망.{0,15}(?:설치\s*불가|사용\s*금지)/.test(body))add('fall-safety-net','collective-fall-protection','protection',115);
 if(/송기\s*마스크|공기\s*호흡기|공급식\s*호흡|supplied.air\s*respirator|self.contained\s*breathing|\bscba\b/.test(body))add('supplied-air-respirator','independent-breathing-air','protection',118);
 if(/탈출용\s*(?:호흡기|공기)|escape\s*breathing|\beebd\b/.test(body))add('escape-breathing-apparatus','emergency-escape-air','emergency',119);
 if(/(?:기름|윤활유|유압유|오일|oil).{0,25}(?:누유|누출|유출|흘|제거|spill|leak)|흡착포|흡유|oil\s*absorb/.test(body)&&!c.specialist&&!/산성|산·알칼리|강산|acid|caustic/.test(title))add('oil-absorbent','oil-spill-housekeeping','cleanup',94);
 if(/집진|분진.{0,15}(?:흡입|제거)|dust\s*extract/.test(body)&&!c.explosive&&!c.hazardousCleaning&&!/금속\s*분진|알루미늄\s*분진|용접|고온|metal\s*dust|hot\s*ash/.test(title))add('dust-extractor','source-dust-collection','environment',101);
 if(/조경|낙엽|정원|landscap|leaf\s*clear|garden/.test(title)&&/낙엽|나뭇잎|잔디\s*잔재|leaves|leaf|grass\s*clipping/.test(body)&&!c.explosive&&!/분진|석면|실리카|유해|dust|silica/.test(body))add('air-blower','outdoor-leaf-cleanup','cleanup',86);
 return needs;
}
