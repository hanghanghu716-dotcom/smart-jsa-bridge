import { excerptText } from './explorePresentation.js';
import { libraryTagLabel } from './libraryPresentation.js';
import { getLanguageTag } from '../locales/config.js';
import { validProjectId } from './publicJsa.js';
const text=value=>typeof value==='string'?value.replace(/\s+/gu,' ').trim():'';
export const publicCategoryLabel = (value,locale) => libraryTagLabel(value,locale);
export const contentDate = row => {
 const value=row?.content_updated_at || row?.published_at;
 return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
};
export function publicDescription(row) {
 const scope=text(row?.publication_context?.scope);
 const steps=Array.isArray(row?.analysis_data)?row.analysis_data:[];
 const hazard=steps.flatMap(step=>step.risks||[]).map(r=>text(r.factor)).find(Boolean);
 const detail=steps.map(step=>text(step.proc?.stepDetail)).find(Boolean);
 return excerptText([scope || detail,hazard].filter(Boolean).join(' · ') || row?.title || '',180);
}
export function publicAuthor(profile,id) {
 if(!validProjectId(id))return null;
 return {id,nickname:profile?.id===id?text(profile.nickname).slice(0,120):''};
}
export function publicDocumentSchema(row,author,backLabel) {
 const url=`https://smartjsabridge.com/${row.public_locale}/public-jsa/${row.id}`;
 const list=`https://smartjsabridge.com/${row.public_locale}/explore`;
 const person=publicAuthor(author,row.author_id),date=contentDate(row);
 return {'@context':'https://schema.org','@graph':[
 {'@type':'CreativeWork','@id':url+'#document',url,name:row.title,description:publicDescription(row),inLanguage:getLanguageTag(row.public_locale),
 ...(date?{dateModified:date}:{}),...(person?.nickname?{author:{'@type':'Person',name:person.nickname,url:`https://smartjsabridge.com/${row.public_locale}/authors/${person.id}`}}:{})},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:backLabel,item:list},{'@type':'ListItem',position:2,name:row.title,item:url}]}
 ]};
}
export const structuredJson = data => JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
