import { TASK_CATEGORIES, taskNeeds } from './task-needs.js';
import { CONTEXT_ACCESSORIES, contextNeeds } from './context-needs.js';
import { ROUTE_ACCESSORIES } from './route-needs.js';
// Ordinary accessories only. Never infer PPE, isolation devices, rated lifting
// equipment, calibrated instruments or process-compatible parts from keywords.
export const ACCESSORY_CATEGORIES = [
 'clipboard','document-holder','tool-storage','parts-organizer','measuring-tape',
 'carpenter-pencil','masking-tape','paint-roller','paint-tray','paint-brush',
 'cleaning-cloth','dustpan','packing-tape','stretch-film',...TASK_CATEGORIES,...CONTEXT_ACCESSORIES,...ROUTE_ACCESSORIES,
];
const clean = value => String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/https?:\/\/\S+/g,' ').replace(/\s+/g,' ').toLowerCase();
export function commerceText(snapshot) {
 // Editorial sources/revision boilerplate is not evidence of a shopping need.
 const body=String(snapshot.body||'').split(/<h2\b[^>]*>\s*9[.\s]/i)[0]
  .replace(/<h[3-6]\b[^>]*>[^<]*(?:별도\s*검토|제외\s*범위|out.of.scope|excluded\s*scope)[^<]*<\/h[3-6]>\s*<p\b[^>]*>[\s\S]*?<\/p>/gi,' ');
 return clean([snapshot.title,snapshot.scope,body,...(snapshot.steps||[]).map(s=>
  [s.title,s.detail,...(s.hazards||[]),...(s.controls||[]).flat(),s.additional].join(' '))].filter(Boolean).join(' '));
}
const tools=/공구|toolbox|tool box|tool organizer|\btools?\b|工具|werkzeug|\boutil|attrezz|utensil|herramient|ferrament|инструмент|scule|unelte|أدوات/iu;
const parts=/볼트|너트|나사|부품[^.!?。]{0,24}(?:분류|보관|분리)|\bbolts?\b|\bnuts?\b|\bscrews?\b|small parts|ボルト|ナット|ねじ|schraub|mutter|boulon|écrou|bullon|dadi|tornill|tuerca|parafuso|porca|болт|гайк|șurub|piuliț|براغي|صواميل/iu;
const tape=/줄자|tape measure|measuring tape|巻尺|コンベックス|bandmaß|maßband|mètre ruban|metro a nastro|cinta métrica|trena|fita métrica|рулетк|ruletă|شريط قياس/iu;
const wood=/목재|목공|wood|timber|workbench|mortise|木材|木工|holz|bois|legno|madera|madeira|древес|дерев|lemn|خشب/iu;
const marking=/먹줄|먹매김|표시|연필|mark|pencil|scribe|墨|鉛筆|anzeich|bleistift|traç|crayon|matita|traccia|lápiz|marc|lápis|карандаш|размет|creion|قلم|تحديد/iu;
const manualPaint=/수성.*(?:페인트|도장)|벽면.*도장|water.?based.*paint|paint.*roller|水性.*塗|wand.*streichen|peinture.*(?:mur|eau)|pittura.*(?:paret|acqua)|pintura.*(?:pared|agua|parede|água)|водоэмульсион|vopsea.*(?:apă|perete)|طلاء.*(?:مائي|جدار)/iu;
const paintTerms=/도장|페인트|paint|塗装|塗料|streichen|peinture|pittura|pintura|краск|vops|طلاء/iu;
const masking=/마스킹|masking|マスキング|abkleb|masquage|mascheratura|enmascar|mascaramento|малярн|mascare|إخفاء/iu;
const ordinaryCleaning=/바닥.*수작업 청소|일반 쓰레기|실내.*청소|manual.*(?:floor|stair).*clean|general waste|housekeeping|床.*清掃|bodenreinigung|nettoyage.*sol|pulizia.*paviment|limpieza.*suelo|limpeza.*piso|уборк.*пол|curăț.*pode|تنظيف.*أرض/iu;
const specialistArea=/반도체|무균|클린룸|semiconductor|sanitary|aseptic|cleanroom|clean room|sterile|半導体|無菌|reinraum|salle blanche|camera bianca|sala limpia|sala limpa|чист.*помещ|cameră curată|غرفة نظيفة/iu;
const packing=/포장|종이상자|carton|packaging|packing|梱包|包装|verpack|emballage|imball|embalaj|embalagem|упаков|ambal|تغليف/iu;
const film=/스트레치|stretch.*(?:film|wrap)|ストレッチ|stretchfolie|film étirable|film estensibile|film estirable|filme stretch|стрейч|folie stretch|فيلم.*تمدد/iu;

export function extractAccessoryNeeds(snapshot) {
 const body=commerceText(snapshot), title=clean(snapshot.title), needs=[];
 const add=(category,score,reason=category)=>needs.push({category,constraints:{},origin:'content-rule',score,reason});
 // Paperwork is not evidence that a visitor needs stationery.
 if(/클립보드|서류 받침|clipboard|クリップボード|klemmbrett|porte-bloc|portapapeles/iu.test(title))add('clipboard',70);
 if(/문서 홀더|지퍼파일|서류 보관함|document (?:holder|pouch)|porte-documents/iu.test(title))add('document-holder',70);
 if(/(?:공구|tools?)[^.!?。]{0,20}(?:운반|수거|회수|정리|보관|transport|storage)|tool(?:box| box| organizer)/iu.test(body))add('tool-storage',62);
 if(parts.test(body)&&/(?:볼트|너트|나사|부품|parts?|bolts?|screws?)[^.!?。]{0,24}(?:분류|보관|수거|분리|sort|store|collect)/iu.test(body)&&!specialistArea.test(title))add('parts-organizer',65);
 if(tape.test(body))add('measuring-tape',65);
 if(wood.test(title)&&marking.test(body))add('carpenter-pencil',70);
 if(manualPaint.test(title)){
  add('paint-roller',90);add('paint-tray',85);add('paint-brush',75);
 }
 if(manualPaint.test(title)||(paintTerms.test(title)&&masking.test(body)))add('masking-tape',80);
 if(ordinaryCleaning.test(title)){
  add('cleaning-cloth',70);add('dustpan',75);
 }
 if(packing.test(title)&&/테이프|tape|テープ|klebeband|ruban|nastro|cinta|fita|лент|bandă|شريط/iu.test(body))add('packing-tape',75);
 if(film.test(title))add('stretch-film',90);
 const specific=taskNeeds(title,body);
 if(!needs.some(n=>n.category==='measuring-tape')&&specific.some(n=>['carpenter-square','chalk-line','spirit-level'].includes(n.category)))add('measuring-tape',67);
 return [...needs,...specific,...contextNeeds(snapshot,body)];
}
