import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { getStorageUi } from '../src/locales/storageUi.js';
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
test('storage text preserves drafts without advertising obsolete three-document limits',()=>{
 const ko=getStorageUi('ko'),en=getStorageUi('en-US');assert.deepEqual(Object.keys(ko),Object.keys(en));
 assert.match(ko.limitError,/작성 중인 내용은 유지/);assert.match(en.full,/edited and exported/);assert.match(ko.hint,/개인 비공개 저장/);
 assert.doesNotMatch(Object.values(ko).join(' '),/3개|유료/);assert.doesNotMatch(en.used,/\{limit\}/);
});
