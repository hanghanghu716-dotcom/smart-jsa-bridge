import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { getBusinessUi, businessError } from '../src/locales/businessUi.js';
import { templatePayload } from '../src/utils/projectPersistence.js';
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
const service=await vite.ssrLoadModule('/src/services/businessService.js');
process.on('exit',()=>vite.close());

const snap={title:'Company inspection',form_data:{projectName:'Company inspection',workLocation:'Private site'},participants:['Worker'],analysis_data:[{proc:{stepTitle:'Inspect',stepDetail:'Check'},risks:[{factor:'Fall',measure:'Guardrails'}]}],custom_layout:{documentNotes:'Internal',savedOrientation:'portrait',stepPhotos:{0:'photo'},projectSaveContext:{own:true,id:'forged'}}};
test('company editing creates a private copy without writable IDs or foreign project ancestry',()=>{
 const before=JSON.stringify(snap),state=service.companyEditorCopy(snap);
 assert.equal(state.id,null);assert.equal(state.existingId,null);assert.equal(state.parentId,null);assert.equal(state.projectSaveContext,null);assert.equal(state.isFork,false);
 assert.deepEqual(state.participants,['Worker']);assert.equal(state.stepPhotos[0],'photo');assert.equal(JSON.stringify(snap),before);
});
test('company templates exclude personal document context and photos',()=>{
 const result=templatePayload({...snap.custom_layout,formData:snap.form_data,participants:snap.participants});
 assert.equal(result.stepPhotos,undefined);assert.equal(result.projectSaveContext,undefined);assert.equal(result.formData,undefined);assert.equal(result.participants,undefined);assert.equal(result.savedOrientation,'portrait');
});
test('business actions carry the exact revision expected by the reviewer',async()=>{
 let request;const client={rpc:async(name,args)=>{request={name,args};return {data:{version:4},error:null};}};
 assert.deepEqual(await service.businessAction('approve',{org:'org',doc:'doc',expected:3,payload:{comment:'Reviewed'}},client),{version:4});
 assert.equal(request.name,'jsa_business_action');assert.equal(request.args.p_expected,3);assert.equal(request.args.p_org,'org');assert.equal(request.args.p_doc,'doc');
});
test('server rejection is propagated rather than presenting success',async()=>{
 const client={rpc:async()=>({data:null,error:Error('VERSION_CONFLICT')})};
 await assert.rejects(service.businessAction('approve',{},client),/VERSION_CONFLICT/);
});
test('signed-out accounts have no organization or private-document queries',async()=>{
 const client={auth:{getUser:async()=>({data:{user:null},error:{name:'AuthSessionMissingError'}})},from:()=>{throw Error('unexpected query');}};
 assert.deepEqual(await service.getBusinessAccount(client),{user:null,organizations:[],projects:[]});
});
test('Korean and fallback labels explain expiry and no-charge terms; errors identify conflict and permission failures',()=>{
 const ko=getBusinessUi('ko'),en=getBusinessUi('de-DE');
 assert.deepEqual(Object.keys(ko).sort(),Object.keys(en).sort());
 assert.match(ko.intro,/자동 과금은 없습니다/);assert.match(en.intro,/No card/);
 assert.equal(businessError(Error('VERSION_CONFLICT'),ko),ko.conflict);
 assert.equal(businessError(Error('ACCESS_DENIED'),ko),ko.denied);
 assert.equal(businessError(Error('BETA_EXPIRED'),ko),ko.expiredError);
});
test.after(async()=>{await vite.close();});
