import { guideText } from '../locales/guideText.js';
import { SUPPORTED_LANGS, getDataLocale, getLanguageTag } from '../locales/config.js';
import { WORK_JURISDICTIONS, jurisdictionLabel } from './workJurisdiction.js';
import { REGIONAL_SOURCES, regionalTemplates } from './regionalWorkTemplates.js';
import { taskSafetyText } from '../locales/taskSafetyText.js';

export const GUIDE_VERSION='2026-10-03';
export const GUIDE_CATEGORIES={common:'common',construction:'const',manufacturing:'manu',chemical:'chem','high-risk':'highrisk',general:'general'};
// These short regional notes explain the document system, not legal certification.
export const GUIDE_REGIONS={
 KR:'한국에서는 작업별 위험성평가 결과를 작업 전 안전점검회의(TBM)와 연결하고, 해당 작업에 필요한 작업허가서·점검표를 함께 준비합니다. 작업자와 현장의 위험요인을 확인하고 대책의 이행 여부를 기록하세요. 이 가이드의 작업 예시가 사업장의 평가·허가 절차를 대신하지는 않습니다.',
 GB:'For Great Britain, connect the Risk Assessment with the Method Statement to explain both hazards and the safe sequence of work (often called RAMS). Use a PTW when the activity and site procedure require it; it does not replace the assessment. Brief the crew through a Toolbox Talk. Northern Ireland has a separate regulatory context: consult HSENI before applying these references there.',
 AU:'Use a Risk Assessment for the task and check whether it is high risk construction work before selecting a SWMS. A SWMS is not the name for every Australian JSA. Confirm the relevant state or territory requirements and regulator guidance, including Victoria where applicable. Connect the plan with a Pre-start / Toolbox discussion and the permits required for the actual work.',
 SG:'Use the Risk Assessment (RA) to identify hazards and controls, then describe the work sequence in a Safe Work Procedure (SWP). Communicate the plan at the Toolbox Meeting. Select a Permit to Work (PTW) after checking the activity, workplace and applicable rules; it is not automatically required for every task. Keep the RA, SWP and current site checks consistent.',
 US:'A Job Hazard Analysis (JHA) breaks a job into steps and connects each hazard with controls. Confirm whether the work falls under general industry, construction or maritime rules and whether a State Plan applies. A JHA is not a permit: confined-space, energy-control and other task procedures must be selected separately. Use the applicable site briefing and inspection records.',
 CA:'Use Job Safety Analysis (JSA) with a Safe Work Procedure and a pre-job discussion. First identify whether the workplace falls under federal, provincial or territorial jurisdiction. CCOHS resources provide a Canadian reference, not a single permit or numerical rule for every province. Choose the relevant provincial edition when available and confirm the local regulator requirements.',
 'CA-AB':'For Alberta, organise the work around hazard assessment and control, a Safe Work Procedure and a Toolbox Meeting. Involve workers in identifying hazards and checking controls. Confirm Alberta OHS applicability and the current task-specific rules, including entry arrangements for confined spaces. A general Canadian example alone does not establish an Alberta permit requirement.',
 'CA-ON':'For Ontario, connect task JSA and Safe Work Procedures with a Safety Talk and inspection records. Identify the applicable workplace sector and Ontario requirements before selecting permits or specialist roles. Check confined-space planning and entry arrangements separately. CCOHS terminology helps structure the assessment but does not replace Ontario-specific duties.',
 'CA-BC':'For British Columbia, use a site-specific Risk Assessment and Safe Work Procedure with a Toolbox Meeting. WorkSafeBC guidance calls for risks to be assessed for each workplace; consult workers and consider changing conditions. Select permits and standby arrangements for the actual task. A generic Canadian permit must not be treated as a universal WorkSafeBC form.',
 'CA-QC':'Au Québec, reliez l’analyse de la sécurité des tâches (AST), la méthode de travail sécuritaire et la rencontre de sécurité aux mesures de prévention du milieu de travail. Utilisez les termes locaux, notamment cadenassage et espace clos. Consultez la CNESST et vérifiez les exigences applicables à votre activité. Le DUERP français n’est pas le document de référence québécois.',
 DE:'Verknüpfen Sie die tätigkeitsbezogene Gefährdungsbeurteilung mit einer geeigneten Arbeitsanweisung und der Unterweisung. Dokumentieren Sie Maßnahmen, Verantwortliche und die Überprüfung ihrer Wirksamkeit. Betriebsanweisungen und besondere Erlaubnisse sind nach Tätigkeit und Gefahr gesondert zu bestimmen. Die Beispiele ersetzen weder die betriebliche Beurteilung noch erforderliche Fachkunde.',
 JP:'作業リスクアセスメントで危険性・有害性を洗い出し、リスク低減措置を安全作業手順書に反映します。作業前のKY活動で当日の重点事項を共有しますが、KY活動だけでリスクアセスメントを置き換えないでください。作業主任者・特別教育・許可の要否は、実際の作業区分と設備に合わせて確認します。',
 FR:'Reliez la fiche de tâche et le mode opératoire à l’évaluation des risques de l’unité de travail. Le DUERP concerne l’évaluation des risques professionnels de l’entreprise : cette fiche ne le remplace pas. Prévoyez les permis et habilitations adaptés, par exemple pour les travaux électriques ou par points chauds, et présentez les mesures lors de la causerie sécurité.',
 IT:'Collegate la scheda di attività e la procedura di lavoro sicuro alla valutazione dei rischi aziendale. La scheda non sostituisce il DVR né gli altri documenti richiesti per il contesto, come il coordinamento dei rischi interferenti quando applicabile. Verificate qualifiche, autorizzazioni e permessi per il lavoro specifico e condividete le misure con la squadra.',
 ES:'Relacione la evaluación de riesgos de la tarea con el procedimiento de trabajo y la planificación preventiva de la empresa. Compruebe las autorizaciones, competencias y presencia de recursos preventivos cuando proceda según la actividad. Una charla de seguridad ayuda a comunicar las medidas, pero no sustituye la evaluación ni la coordinación necesaria.',
 SA:'اربط تقييم مخاطر المهمة بإجراء العمل الآمن واجتماع السلامة قبل العمل. تحقق من متطلبات الجهة المختصة والقطاع وإجراءات الموقع قبل اختيار تصريح العمل أو تحديد المؤهلات. هذا الدليل مرجع للتخطيط استناداً إلى إرشادات السلامة المهنية؛ لا يقرر بمفرده متطلبات الترخيص أو حدود القياس الخاصة بكل نشاط.',
 BR:'Relacione a Análise de Risco da tarefa (AR), o procedimento de trabalho e o Diálogo Diário de Segurança (DDS) com o inventário de riscos e o plano de ação do PGR. A AR desta tarefa não substitui o PGR. Verifique as NRs aplicáveis, capacitação e permissões específicas, como a PET para espaços confinados, conforme o enquadramento real da atividade.',
 RU:'Свяжите оценку рисков по этапам работы с инструкцией по безопасному выполнению работ и обсуждением мер перед началом. Определите по действующим правилам, нужен ли наряд-допуск, специальная подготовка и назначение ответственных. Обсуждение по этому руководству не заменяет обязательный инструктаж и его учет. Актуальность отраслевых требований следует проверить отдельно.',
};
const groups={
 height:['avoidHeight','fallSystem','access','weather','rescue'],
 confined:['space','entryRoles','atmosphere','isolation','ventilation','rescue'],
 electrical:['circuit','disconnect','proveDead','earthBarrier','restore'],
 hot:['combustibles','fireWatch','gasFumes','cylinders'],
};
// Explicit editorial mapping, not a legal permit classifier or keyword inference.
const maps={
 construction:[['height','equipment'],['hot','pressure'],['excavation'],['height','chemicalCheck'],['height','equipment'],['height','specialist'],['lifting','equipment'],['pressure','lifting'],['specialist','chemicalCheck'],['electrical','height']],
 manufacturing:[['chemicalCheck'],['equipment','pressure'],['equipment'],['equipment'],['specialist'],['equipment','electrical'],['lifting','equipment'],['equipment','chemicalCheck'],['confined','equipment'],['equipment','chemicalCheck']],
 chemical:[['pressure','chemicalCheck'],['pressure','chemicalCheck'],['pressure','chemicalCheck'],['height','hot'],['pressure','specialist'],['equipment','chemicalCheck'],['confined','electrical'],['traffic','pressure'],['electrical','specialist'],['chemicalCheck']],
 'high-risk':[['hot','pressure'],['electrical'],['excavation'],['specialist'],['confined'],['lifting'],['height','electrical']],
 general:[['traffic','lifting'],['specialist'],['equipment','electrical'],['traffic','specialist'],['chemicalCheck'],['traffic','electrical'],['equipment'],['height'],['specialist'],['lifting','height']],
 common:[['specialist'],['height'],['hot'],['lifting'],['confined'],['excavation'],['electrical'],['specialist'],['pressure','equipment'],['equipment']],
};
export function makeGuide(locale,category,resource){
 if(!SUPPORTED_LANGS.includes(locale)||!GUIDE_CATEGORIES[category]) throw new Error('Unsupported guide route');
 const jurisdiction=WORK_JURISDICTIONS.find(j=>j.locale===locale);
 const ui=key=>guideText(locale,key);
 const raw=category==='common'?resource.steps:resource.list;
 if(!Array.isArray(raw)||raw.length!==maps[category].length) throw new Error(`Missing guide examples: ${locale}/${category}`);
 const examples=raw.map((item,i)=>({
  id:item.id||`COMMON-${String(i+1).padStart(2,'0')}`,
  title:category==='common' ? (['step1','height','hot','lifting','confined','excavation','electrical','specialist','pressure','equipment'][i] in groups ? taskSafetyText(locale,['step1','height','hot','lifting','confined','excavation','electrical','specialist','pressure','equipment'][i]) : item.task.replace(/\s*\([^)]*\)/g,'')) : item.title,
  hazard:item.hazard,
  checks:maps[category][i].map(group=>groups[group]?groups[group].map(k=>taskSafetyText(locale,k)).join('; ')+'.':ui(group)),
 }));
 const context={jurisdiction:jurisdiction.id,documentLocale:locale,highRiskConstruction:'yes'};
 let sources=REGIONAL_SOURCES[jurisdiction.id].filter(s=>s.url.startsWith('https://'));
 // Prefer the current source landing page, and use a construction-specific TBM reference for Korea.
 if(jurisdiction.id==='KR') sources=[{title:'고용노동부 · 새로운 위험성평가 안내서 (2023)',url:'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230501085'},{title:'고용노동부 · 건설현장 TBM 실천 가이드',url:'https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230301670'},...sources.filter(s=>!s.url.includes('bbs_seq='))];
 if(jurisdiction.id==='IT') sources=[{title:'INAIL · Valutare il rischio',url:'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/valutare-il-rischio.html'},...sources.slice(1)];
 const title=ui(category),region=jurisdictionLabel(jurisdiction,locale);
 return {locale,language:getLanguageTag(locale),category,title,region,jurisdiction:jurisdiction.id,version:GUIDE_VERSION,description:`${title} · ${region}. ${ui('intro')}`,
  url:`https://smartjsabridge.com/${locale}/guideline/${category}`,pdfUrl:`/assets/guides/${locale}/${category}-${GUIDE_VERSION}.pdf`,
  localNote:GUIDE_REGIONS[jurisdiction.id],documents:regionalTemplates(context).map(t=>t.title),examples,sources,
  workflow:[1,2,3].map(n=>({title:ui(`step${n}`),body:ui(`step${n}Body`)})),
 };
}
export function guideResourceLocale(locale){ return getDataLocale(locale); }
