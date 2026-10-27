export const FEEDBACK_CATEGORIES = ['case_request','bug','suggestion','correction','general'];
export const FEEDBACK_STATUSES = ['open','needs_info','reviewing','producing','resolved','on_hold','declined'];
export const FEEDBACK_TYPES = ['application/pdf','image/jpeg','image/png','image/webp'];
export const FEEDBACK_MAX_SIZE = 5 * 1024 * 1024;
export function feedbackCountry(locale) {
 return locale === 'ko' ? 'KR' : locale?.split('-')[1] || '';
}
export function feedbackFileError(files) {
 return files.length > 3 || files.some(file => !FEEDBACK_TYPES.includes(file.type) || file.size < 1 || file.size > FEEDBACK_MAX_SIZE || !file.name || file.name.length > 180);
}
export function feedbackPayloadError(payload) {
 if (!payload || typeof payload!=='object' || Array.isArray(payload)) return 'INVALID_REQUEST';
 if (!FEEDBACK_CATEGORIES.concat(['privacy','copyright','safety','spam','appeal','access','erasure']).includes(payload.category)) return 'INVALID_REQUEST';
 if (!Array.isArray(payload.files) || feedbackFileError(payload.files)) return 'INVALID_FILE';
 const limits={title:200,detail:4000,context:2000,email:254,country:100,locale:20,source_path:500};
 for(const [key,max] of Object.entries(limits)) if(typeof payload[key]!=='string'||payload[key].length>max)return 'INVALID_REQUEST';
 if(!payload.title.trim()&&!payload.detail.trim()&&!payload.files.length)return 'EMPTY';
 if(payload.consent!==true||payload.website)return 'INVALID_REQUEST';
 if(payload.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))return 'INVALID_EMAIL';
 if(payload.source_path&&(!/^\/[^/]/.test(payload.source_path)||/[?#]/.test(payload.source_path)))return 'INVALID_PATH';
 return null;
}
export function fileSignatureMatches(type, bytes) {
 const match=expected=>expected.every((value,index)=>bytes[index]===value);
 if(type==='application/pdf')return match([37,80,68,70,45]);
 if(type==='image/jpeg')return match([255,216,255]);
 if(type==='image/png')return match([137,80,78,71,13,10,26,10]);
 return type==='image/webp'&&match([82,73,70,70])&&[87,69,66,80].every((value,index)=>bytes[index+8]===value);
}
export function parseFeedbackReceipt(value) {
 const match=/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([0-9a-f]{64})$/i.exec(value.trim());
 if(!match)throw Error('INVALID_RECEIPT');
 return {id:match[1],receipt:match[2].toLowerCase()};
}
