import { supabase } from '../supabaseClient';
import { publicGateway } from './publicGateway';
import { fileSignatureMatches } from '../utils/feedback.js';

export async function validateFeedbackFiles(files) {
 for(const file of files) {
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(!fileSignatureMatches(file.type,bytes))throw Error('INVALID_FILE');
 }
}
export async function sendFeedback(submission, {gateway=publicGateway, storage=supabase.storage}={}) {
 const prepared=await gateway('feedback_prepare',submission.payload);
 submission.receipt=prepared.id+'.'+prepared.receipt;
 if(prepared.status!=='draft')return {receipt:submission.receipt,status:prepared.status};
 const credentials={id:prepared.id,receipt:prepared.receipt};
 const current=await gateway('feedback_resume',credentials);
 if(current.status!=='draft')return {receipt:submission.receipt,status:current.status};
 for(let index=0;index<current.files.length;index++){
  const reserved=current.files[index],file=submission.files[index];
  if(reserved.uploaded)continue;
  if(!file||file.name!==reserved.name||file.size!==reserved.size||file.type!==reserved.type)throw Error('INVALID_FILE');
  const {error}=await storage.from('feedback-attachments').upload(reserved.path,file,{contentType:reserved.type,upsert:false,cacheControl:'0'});
  if(error)throw Error('UPLOAD_FAILED');
 }
 const saved=await gateway('feedback_submit',credentials);
 if(!saved.id||saved.status==='draft')throw Error('UPLOAD_INCOMPLETE');
 return {receipt:submission.receipt,status:saved.status};
}
export async function feedbackAdmin(action,payload={}) {
 const {data,error}=await supabase.rpc('feedback_admin',{p_action:action,p_payload:payload});
 if(error)throw error;
 return data;
}
