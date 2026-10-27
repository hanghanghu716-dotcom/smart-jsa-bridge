import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackUi } from '../src/locales/feedbackUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { feedbackPayloadError,fileSignatureMatches,feedbackFileError,parseFeedbackReceipt } from '../src/utils/feedback.js';
import { caseLanguageOptions,renderCaseLanguages } from '../src/utils/caseLanguages.js';
import { createGateway } from '../api/public-gateway.js';
const payload={category:'case_request',title:'Pump',detail:'',context:'',email:'',locale:'ko',country:'KR',source_path:'',consent:true,files:[],client_id:'4ef311fa-6519-40d2-830b-bd1a11fc31cf'};
test('every route locale resolves all feedback labels and private-review notices',()=>{
 for(const locale of SUPPORTED_LANGS){const ui=feedbackUi(locale);assert.ok(Object.keys(ui).length>=56);assert.ok(Object.values(ui).every(value=>typeof value==='string'&&value.trim()));}
 assert.equal(feedbackUi('fr-CA-QC').launcher,feedbackUi('fr-FR').launcher);
});
test('name-only, story-only and file-only requests are valid; empty or oversized requests are not',()=>{
 assert.equal(feedbackPayloadError(payload),null);
 assert.equal(feedbackPayloadError({...payload,title:'',detail:'A short story'}),null);
 assert.equal(feedbackPayloadError({...payload,title:'',files:[{name:'permit.pdf',type:'application/pdf',size:42}]}),null);
 assert.equal(feedbackPayloadError({...payload,title:''}),'EMPTY');
 for(const patch of [{consent:false},{category:'unknown'},{title:'x'.repeat(201)},{email:'invalid'},{source_path:'//evil.test'},{source_path:'/ko/info?private=secret'},{files:[{name:'x.svg',type:'image/svg+xml',size:3}]}])assert.ok(feedbackPayloadError({...payload,...patch}));
 assert.ok(feedbackFileError(Array.from({length:4},()=>({name:'x.pdf',type:'application/pdf',size:10}))));
 assert.ok(feedbackFileError([{name:'x.pdf',type:'application/pdf',size:5242881}]));
 assert.ok(!fileSignatureMatches('application/pdf',new TextEncoder().encode('<html>')));
 assert.ok(fileSignatureMatches('application/pdf',new TextEncoder().encode('%PDF-1.7')));
 assert.throws(()=>parseFeedbackReceipt('bad'));
});
test('same-case language links include only actual supported versions and are escaped in initial HTML',()=>{
 const locales=['ko','en-US','ko','ar-SA','unknown','en-CA'];
 const options=caseLanguageOptions(locales,' jsa-form-work');
 assert.equal(options.length,4);assert.ok(options.every(option=>option.href.endsWith('/case-study/jsa-form-work')));
 assert.ok(!options.some(option=>option.code==='en-CA-AB'));
 assert.equal(renderCaseLanguages(['ko'],'ko','test'),'');
 const html=renderCaseLanguages(locales,'ko','test"><script>');
 assert.match(html,/aria-current="page"/);assert.match(html,/hreflang="ar-SA"/);assert.doesNotMatch(html,/<script>|unknown/);assert.match(html,/test%22%3E%3Cscript%3E/);
});
test('gateway retries reuse one server receipt and reject client secrets, missing consent and malformed IDs',async()=>{
 const key='test-only-not-a-real-key-'.repeat(3),calls=[];
 const handler=createGateway({env:{VERCEL:'1',JSA_PUBLIC_GATEWAY_KEY:key},config:{url:'https://db.test',key:'public'},fetcher:async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body)});return Response.json({id:payload.client_id,status:'draft',files:[]});
 }});
 const request=value=>({method:'POST',headers:{'content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body:{action:'feedback_prepare',payload:value}});
 const response=()=>({setHeader(){},end(value){this.value=JSON.parse(value);}});
 const a=response(),b=response();await handler(request(payload),a);await handler(request({...payload,receipt:'0'.repeat(64)}),b);
 assert.equal(a.statusCode,200);assert.equal(a.value.receipt,b.value.receipt);assert.notEqual(a.value.receipt,'0'.repeat(64));
 assert.equal(calls[0].url,'https://db.test/rest/v1/rpc/feedback_gateway');assert.equal(calls[0].body.p_payload.receipt,a.value.receipt);assert.ok(!JSON.stringify(a.value).includes(key));
 for(const value of [{...payload,consent:false},{...payload,client_id:'not-an-id'},{...payload,title:''}]){const r=response();await handler(request(value),r);assert.equal(r.statusCode,400);}
 assert.equal(calls.length,2);
 const invalid=response();await handler({...request(payload),body:{action:'feedback_submit',payload:{id:payload.client_id,receipt:'guess'}}},invalid);assert.equal(invalid.statusCode,400);
});
