import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedWorkflow, WORKFLOW, objectPath, webpSize } from '../supabase/functions/publish-jsa-thumbnail/policy.js';
import { createHandler } from '../supabase/functions/publish-jsa-thumbnail/handler.js';
const id = '457aea97-278c-467f-82c7-c62d3f649eb0', revision = 'a'.repeat(32);
const claims = { repository: 'hanghanghu716-dotcom/smart-jsa-bridge', repository_owner_id: '259208646', ref: 'refs/heads/main', workflow_ref: WORKFLOW, event_name: 'push' };
function bytes() {
  const data = new Uint8Array(40), view = new DataView(data.buffer);
  for (const [offset, value] of [[0,'RIFF'],[8,'WEBP'],[12,'VP8 '],[23,'\x9d\x01\x2a']]) [...value].forEach((char, i) => data[offset + i] = char.charCodeAt(0));
  view.setUint32(4,32,true); view.setUint16(26,720,true); view.setUint16(28,509,true);
  return data;
}
const request = (body = bytes()) => new Request('https://example.invalid/?id=' + id + '&revision=' + revision, { method: 'POST', headers: { 'Content-Type': 'image/webp' }, body });
const row = { is_public: true, revision, assessment: { checked: true, review: 'pending' } };
test('only the named main-branch workflow can publish', () => {
  assert.equal(allowedWorkflow(claims),true);
  for (const field of ['repository','repository_owner_id','ref','workflow_ref','event_name']) assert.equal(allowedWorkflow({...claims,[field]:'wrong'}),false,field);
  assert.equal(allowedWorkflow({...claims,event_name:'pull_request'}),false);
  assert.equal(allowedWorkflow({...claims,event_name:'schedule'}),true);
});
test('strict immutable path and WebP size validation', () => {
  assert.ok(objectPath(id,revision)); assert.equal(objectPath('../'+id,revision),null);
  assert.equal(objectPath(id,'../x'),null);
  assert.deepEqual(webpSize(bytes()),{width:720,height:509});
  const wrong = bytes(); wrong[0] = 0; assert.equal(webpSize(wrong),null);
  const wide = bytes(); new DataView(wide.buffer).setUint16(26,5000,true); assert.equal(webpSize(wide),null);
  assert.equal(webpSize(new Uint8Array(204801)),null);
});
test('unsigned callers and other workflows cannot read or write', async () => {
  let called = false;
  for (const authenticate of [async()=>{throw new Error('bad signature');},async()=>({...claims,ref:'refs/heads/fork'})]) {
    const handler = createHandler({authenticate,publicRow:async()=>{called=true;},upload:async()=>{called=true;},save:async()=>{called=true;}});
    assert.ok([401,403].includes((await handler(request())).status)); assert.equal(called,false);
  }
});
test('withdrawn, rejected, unchecked and stale documents are not uploaded', async () => {
  for (const change of [{is_public:false},{revision:'b'.repeat(32)},{assessment:{checked:true,review:'rejected'}},{assessment:{checked:false}}]) {
    const handler=createHandler({authenticate:async()=>claims,publicRow:async()=>({...row,...change}),upload:async()=>assert.fail('upload'),save:async()=>assert.fail('save')});
    assert.equal((await handler(request())).status,409);
  }
});
test('publication change during upload prevents metadata publication', async () => {
  let reads=0, uploaded=false;
  const handler=createHandler({authenticate:async()=>claims,publicRow:async()=>++reads===1?row:null,upload:async()=>{uploaded=true;},save:async()=>assert.fail('save')});
  assert.equal((await handler(request())).status,409); assert.equal(uploaded,true);
});
test('valid current public image is uploaded before metadata publication', async () => {
  const order=[];
  const handler=createHandler({authenticate:async()=>claims,publicRow:async()=>row,upload:async(path,data)=>{assert.equal(path,objectPath(id,revision));assert.deepEqual(data,bytes());order.push('image');},save:async asset=>{assert.deepEqual(asset,{project_id:id,revision,renderer:'risk-v1',width:720,height:509});order.push('metadata');}});
  assert.equal((await handler(request())).status,200);assert.deepEqual(order,['image','metadata']);
});
test('malformed image and oversized request cause no database access', async () => {
  const handler=createHandler({authenticate:async()=>claims,publicRow:async()=>assert.fail('read')});
  assert.equal((await handler(request(new Uint8Array(40)))).status,400);
  assert.equal((await handler(request(new Uint8Array(204801)))).status,413);
});
