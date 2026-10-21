import { TASK_CATEGORIES, taskNeeds } from './task-needs.js';
// Ordinary accessories only. Never infer PPE, isolation devices, rated lifting
// equipment, calibrated instruments or process-compatible parts from keywords.
export const ACCESSORY_CATEGORIES = [
 'clipboard','document-holder','tool-storage','parts-organizer','measuring-tape',
 'carpenter-pencil','masking-tape','paint-roller','paint-tray','paint-brush',
 'cleaning-cloth','dustpan','packing-tape','stretch-film',...TASK_CATEGORIES,
];
const clean = value => String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')
 .replace(/https?:\/\/\S+/g,' ').replace(/\s+/g,' ').toLowerCase();
export function commerceText(snapshot) {
 // Editorial sources/revision boilerplate is not evidence of a shopping need.
 const body=String(snapshot.body||'').split(/<h2\b[^>]*>\s*9[.\s]/i)[0];
 return clean([snapshot.title,snapshot.scope,body,...(snapshot.steps||[]).map(s=>
  [s.title,s.detail,...(s.controls||[]).flat(),s.additional].join(' '))].filter(Boolean).join(' '));
}
const paperwork=/점검표|체크리스트|기록지|기록 항목|작업허가서|검사 기록|인계 기록|clipboard|checklist|check\s+sheet|inspection\s+(?:sheet|form|record)|handover\s+record|check-sheet|クリップボード|チェックリスト|点検表|確認表|記録項目|作業許可書|klemmbrett|checkliste|prüfprotokoll|porte-bloc|liste de contrôle|fiche de contrôle|vérifications et intervention|portablocco|lista di controllo|registro di ispezione|portapapeles|lista de verificación|lista de comprobación|registro de inspección|prancheta|lista de verificação|планшет для бумаг|контрольный список|контрольный лист|лист проверки|чек-лист|clipboard de scris|listă de verificare|قائمة التحقق|قائمة فحص|سجل الفحص|لوحة كتابة/iu;
const documents=/문서 보관|문서 홀더|서류 보관|도면|document holder|document pouch|drawing|permit|checklist|record|書類|図面|dokumentenhalter|zeichnung|porte-documents|plan de travail|portadocumenti|disegn|portadocumentos|plano|porta-documentos|desenho|чертеж|документ|suport documente|desen|حافظة مستندات|مخطط/iu;
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
 const paper=paperwork.test(body);
 if(paper)add('clipboard',20);
 if(paper||documents.test(body))add('document-holder',15);
 if(tools.test(body))add('tool-storage',45);
 if(parts.test(body)&&!specialistArea.test(title))add('parts-organizer',55);
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
 return [...needs,...taskNeeds(title,body)];
}
