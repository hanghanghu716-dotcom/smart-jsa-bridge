import { publicJsaQuality } from './publicJsa.js';
import { publicationTextWarnings } from './publicationTextQuality.js';
import { SUPPORTED_LANGS } from '../locales/config.js';

const clean=value=>typeof value==='string'?value.trim():'';
export function publicationReviewHints(row) {
 const seen=new Map(),repeated=[];
 for(const [i,step] of (Array.isArray(row?.analysis_data)?row.analysis_data:[]).entries())for(const risk of Array.isArray(step?.risks)?step.risks:[]){
  for(const field of ['factor','current_measure','measure','recommend_measure']){
   const value=clean(risk?.[field]).replace(/\s+/gu,' ');if(value.length<60)continue;
   const key=field+':'+value.toLocaleLowerCase();
   if(!seen.has(key))seen.set(key,{field,text:value,steps:new Set()});seen.get(key).steps.add(i+1);
  }
 }
 for(const item of seen.values())if(item.steps.size>=3)repeated.push({...item,steps:[...item.steps]});
 return {repeated,missing:['scope','limitations','sources'].filter(k=>!clean(row?.publication_context?.[k])),
 characters:publicationTextWarnings({title:row?.title,analysisData:row?.analysis_data,context:row?.publication_context})};
}
export function publicationDiagnostics(row) {
 const q=publicJsaQuality(row),title=clean(row?.title);
 const complete=(row?.analysis_data||[]).filter(step=>clean(step?.proc?.stepTitle)&&clean(step?.proc?.stepDetail)&&Array.isArray(step?.risks)&&step.risks.some(r=>clean(r.factor)&&(clean(r.measure)||clean(r.current_measure)||clean(r.recommend_measure))));
 const meaningful=complete.reduce((sum,step)=>sum+String(step.proc.stepDetail).trim().length+step.risks.reduce((n,r)=>n+['factor','measure','current_measure','recommend_measure'].reduce((m,key)=>m+(typeof r[key]==='string'?r[key].trim().length:0),0),0),0);
 const checks={public:row?.is_public===true,consent:row?.reuse_license==='community-v1',locale:SUPPORTED_LANGS.includes(row?.public_locale),
  checked:row?.assessment?.checked===true,notDuplicate:!row?.assessment?.duplicate_of,notRejected:row?.assessment?.review!=='rejected',
  title:title.length>=4&&!/^test[_\s-]/i.test(title)&&!/^(untitled(?: jsa)?|제목 없음)$/i.test(title),
  completeSteps:complete.length>=3,distinctSteps:new Set(complete.map(step=>String(step.proc.stepTitle).trim().toLowerCase())).size>=3,meaningful:meaningful>=180};
 return {indexable:q.indexable,checks,quality:q,review:row?.assessment?.review||'pending',
  adsContentEligible:q.indexable&&row?.assessment?.review==='approved',
  canonical:row?.public_locale&&row?.id?`https://smartjsabridge.com/${row.public_locale}/public-jsa/${row.id}`:null,
  hints:publicationReviewHints(row)};
}
