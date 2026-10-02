import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { getStorageUi } from '../src/locales/storageUi.js';
import { getVisibilityUi } from '../src/locales/visibilityUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { getSaveVisibility, projectEditorState, projectPayload } from '../src/utils/projectPersistence.js';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const {getStorageUsage,isStorageLimitError}=await server.ssrLoadModule('/src/services/projectStorageService.js');
test.after(()=>server.close());
test('storage lookup is scoped by the server, with no caller-supplied user id',async()=>{
 let call;const client={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async(...args)=>{call=args;return{data:{used:3,limit:3,can_create:false,trial_active:false}};}};
 assert.equal((await getStorageUsage(client)).can_create,false);assert.deepEqual(call,['get_jsa_storage_usage']);
});
test('missing sessions make no storage query; API failures remain visible',async()=>{
 const guest={auth:{getUser:async()=>({data:{user:null},error:{name:'AuthSessionMissingError'}})},rpc:()=>{throw Error('unexpected');}};
 assert.equal(await getStorageUsage(guest),null);
 const failed={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async()=>({error:Error('offline')})};
 await assert.rejects(getStorageUsage(failed),/offline/);
 failed.rpc=async()=>({data:null});await assert.rejects(getStorageUsage(failed),/STORAGE_USAGE_UNAVAILABLE/);
});
test('quota rejection is distinct from ownership and general server errors',()=>{
 assert.equal(isStorageLimitError({message:'FREE_PROJECT_LIMIT'}),true);
 assert.equal(isStorageLimitError({message:'PROJECT_OWNER_INVALID'}),false);
 assert.equal(isStorageLimitError(null),false);
});
test('visibility defaults privately; owned public documents and explicit choices retain intent',()=>{
 assert.equal(getSaveVisibility(), 'private');
 assert.equal(getSaveVisibility({saveVisibility:'invalid'}), 'private');
 assert.equal(getSaveVisibility({}, {own:true,isPublic:true}), 'public');
 assert.equal(getSaveVisibility({saveVisibility:'private'}, {own:true,isPublic:true}), 'private');
 const source={id:'source',is_public:true,form_data:{projectName:'Public example',saveVisibility:'public'}};
 assert.equal(projectEditorState(source,false).formData.saveVisibility,'private');
 assert.equal(projectEditorState(source,true).formData.saveVisibility,'public');
 const snapshot={formData:source.form_data};
 assert.equal(projectPayload(snapshot,'owner',false).form_data.saveVisibility,'private');
 assert.equal(projectPayload(snapshot,'owner',true).form_data.saveVisibility,undefined);
});
test('every supported route explains visibility and Community quota in its language',()=>{
 const base=Object.keys(getVisibilityUi('en-US')).sort();
 for(const locale of SUPPORTED_LANGS){
  const ui=getVisibilityUi(locale);
  assert.deepEqual(Object.keys(ui).sort(),base,locale);
  assert.ok(Object.values(ui).every(text=>typeof text==='string'&&text.trim()),locale);
  assert.match(ui.quota,/3/,locale);
  if(!locale.startsWith('en'))assert.notEqual(ui.publicNotice,getVisibilityUi('en-US').publicNotice,locale);
 }
});
test('Community cap messages preserve drafts and expose the three-document limit',()=>{
 const ko=getStorageUi('ko'),en=getStorageUi('en-US');assert.deepEqual(Object.keys(ko),Object.keys(en));
 assert.match(ko.limitError,/작성 중인 내용은 유지/);assert.match(en.full,/edited and exported/);assert.match(ko.hint,/비공개 작업물 3개/);
 assert.match(ko.full,/Community/);assert.match(en.used,/\{limit\}/);assert.match(en.full,/3 documents/);
});
