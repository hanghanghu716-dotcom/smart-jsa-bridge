const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..'),puppeteer=require('module').createRequire(path.join(root,'package.json'))('puppeteer');
const ids={owner:'10000000-0000-4000-8000-000000000001',reviewer:'10000000-0000-4000-8000-000000000002',viewer:'10000000-0000-4000-8000-000000000003',org:'20000000-0000-4000-8000-000000000001',doc:'30000000-0000-4000-8000-000000000001',project:'40000000-0000-4000-8000-000000000001'};
let role='owner',beta=null,orgs=[],docs=[],revisions=[],templates=[],invites=[],expired=false;const calls=[],errors=[];let usage={used:4,limit:null,can_create:true,trial_active:true};
const snapshot={title:'배관 설치 점검',form_data:{projectName:'배관 설치 점검',jsaType:'3-step',workLocation:'회사 내부 작업장',ppe:[],permits:[]},participants:['작업자'],analysis_data:[{proc:{stepTitle:'배관 인양',stepDetail:'통행로 확보'},risks:[{factor:'낙하',current_measure:'출입 통제',recommend_measure:'장비 점검'}],frequency:2,severity:3,riskLevel:6}],custom_layout:{docTitle:'회사 점검 양식'}};
const projects=[{id:ids.project,title:snapshot.title,updated_at:'2026-09-30T00:00:00Z',...snapshot}];
const future=new Date(Date.now()+30*86400000).toISOString();
function user(){return{id:ids[role],email:role+'@example.invalid',aud:'authenticated',role:'authenticated'}}
function session(){const u=user();return{access_token:[{alg:'HS256',typ:'JWT'},{sub:u.id,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:u}}
fs.mkdirSync(path.join(root,'.cache/business-qa'),{recursive:true});
(async()=>{const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
try{const p=await browser.newPage();await p.setViewport({width:1450,height:1000});p.on('pageerror',e=>errors.push(String(e)));p.on('dialog',d=>d.accept());await p.setRequestInterception(true);
p.on('request',async r=>{const url=r.url();if(url.startsWith('http://127.0.0.1:5173')||url.startsWith('data:')||url.startsWith('blob:'))return r.continue();
if(r.method()==='OPTIONS')return r.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'},body:''});
let result=[],status=200;const q=new URL(url).searchParams,body=JSON.parse(r.postData()||'{}'),eq=k=>q.get(k)?.replace(/^eq\./,'');
if(url.includes('/rest/v1/rpc/get_jsa_storage_usage'))result=usage;
else if(url.includes('/auth/v1/user'))result=user();
else if(url.includes('/rest/v1/rpc/jsa_business_action')){calls.push(body);const a=body.p_action;
 if(a==='start_beta'){beta=beta||{user_id:ids.owner,expires_at:future,interest_plan:'business'};result=beta;}
 else if(a==='org_status')result={role,active:!expired,expires_at:future};
 else if(a==='create_org'){result={id:ids.org,name:body.p_payload.name,owner_id:ids.owner};orgs=[result];}
 else if(a==='invite'){result={id:'invite',token:'one-use-fixture-token'};invites.push({id:result.id,role:body.p_payload.role,expires_at:future});}
 else if(a==='import_document'){assert.equal(body.p_payload.project_id,ids.project);result={id:ids.doc,org_id:ids.org,title:snapshot.title,snapshot,state:'draft',version:1,edited_by:ids.owner,updated_at:new Date().toISOString()};docs=[result];revisions=[{...result,id:1,document_id:ids.doc,actor_id:ids.owner,created_at:new Date().toISOString()}];}
 else if(a==='submit'){assert.equal(body.p_expected,1);assert.equal(body.p_payload.reviewer_id,ids.reviewer);Object.assign(docs[0],{state:'submitted',version:2,reviewer_id:ids.reviewer,submitted_by:ids.owner});revisions.unshift({...docs[0],id:2,document_id:ids.doc,actor_id:ids.owner,created_at:new Date().toISOString()});result=docs[0];}
 else if(a==='approve'){assert.equal(role,'reviewer');assert.equal(body.p_expected,2);Object.assign(docs[0],{state:'approved',version:3});revisions.unshift({...docs[0],id:3,document_id:ids.doc,actor_id:ids.reviewer,comment:body.p_payload.comment,created_at:new Date().toISOString()});result=docs[0];}
 else if(a==='reopen'){Object.assign(docs[0],{state:'draft',version:4});result=docs[0];}
 else if(a==='save_template'){assert.ok(!body.p_payload.layout.stepPhotos);result={id:'company-template'};templates=[{id:result.id,org_id:ids.org,name:body.p_payload.name,layout_data:body.p_payload.layout,version:1}];}
 else if(a==='restore_personal'){assert.equal(body.p_payload.updatedAt,projects[0].updated_at);result=projects[0];}
 else result={};
}
else if(url.includes('/rest/v1/jsa_beta_access'))result=role==='owner'?beta:null;
else if(url.includes('/rest/v1/jsa_organizations'))result=orgs;
else if(url.includes('/rest/v1/jsa_org_members'))result=['owner','reviewer','viewer'].map(k=>({org_id:ids.org,user_id:ids[k],role:k}));
else if(url.includes('/rest/v1/jsa_org_invites'))result=invites;
else if(url.includes('/rest/v1/jsa_org_documents'))result=q.has('id')?docs.find(d=>d.id===eq('id'))||null:docs;
else if(url.includes('/rest/v1/jsa_org_revisions'))result=q.has('id')?revisions.find(d=>d.id===Number(eq('id')))||null:revisions;
else if(url.includes('/rest/v1/jsa_org_templates'))result=templates;
else if(url.includes('/rest/v1/jsa_project_revisions'))result=q.has('id')?{id:10,project_id:ids.project,snapshot,created_at:new Date().toISOString()}:[{id:10,project_id:ids.project,created_at:new Date().toISOString()}];
else if(url.includes('/rest/v1/jsa_projects'))result=role==='owner'?projects:[];
else if(url.includes('/rest/v1/profiles'))result=q.has('id')&&!q.get('id').startsWith('in.')?{id:user().id,username:role}:['owner','reviewer','viewer'].map(k=>({id:ids[k],display_name:{owner:'회사 소유자',reviewer:'검토 담당자',viewer:'열람 담당자'}[k]}));
else if(url.includes('/rest/v1/rpc/save_jsa_draft_snapshot'))result=[{id:body.p_id,version:1}];
else if(!url.includes('/rest/v1/'))return r.abort();
return r.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(result)});
});
await p.evaluateOnNewDocument(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session());
async function click(text,scope=''){await p.evaluate((text,scope)=>{const b=[...document.querySelectorAll((scope?scope+' ':'')+'button')].find(n=>n.textContent.trim()===text);if(!b)throw Error('Missing '+text);if(b.disabled)throw Error('Disabled '+text);b.click()},text,scope);await p.waitFor(500);}
async function fill(selector,value){await p.$eval(selector,(n,v)=>{Object.getOwnPropertyDescriptor(n.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(n,v);n.dispatchEvent(new Event('input',{bubbles:true}))},value);await p.waitFor(100);}
async function openAs(nextRole){role=nextRole;await p.evaluate(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session());await p.goto('http://127.0.0.1:5173/ko/business',{waitUntil:'networkidle0'});}

const {SUPPORTED_LANGS,getLanguageTag}=await import('../src/locales/config.js');
const {getBusinessUi}=await import('../src/locales/businessUi.js');
const {getStorageUi}=await import('../src/locales/storageUi.js');
const {formatStorageCount}=await import('../src/locales/phase6Ui.js');
const out=process.env.JSA_QA_OUTPUT||path.join(root,'.cache/business-qa');fs.mkdirSync(out,{recursive:true});
beta={user_id:ids.owner,expires_at:future,interest_plan:'business'};
orgs=[{id:ids.org,name:'QA organization',owner_id:ids.owner}];
docs=[{id:ids.doc,org_id:ids.org,title:'QA document',snapshot,state:'submitted',version:2,edited_by:ids.reviewer,reviewer_id:ids.owner,submitted_by:ids.reviewer,updated_at:future}];
revisions=[{...docs[0],id:2,document_id:ids.doc,actor_id:ids.reviewer,created_at:future}];
templates=[{id:'company-template',org_id:ids.org,name:'QA template',layout_data:{docTitle:'QA template'},version:1}];
async function choose(label,value,scope=''){const selector=scope+'select[aria-label='+JSON.stringify(label)+']';await p.select(selector,value);await p.waitFor(150);}
async function noOverflow(label,scope){
 const bad=await p.evaluate(scope=>{const elements=scope?[...document.querySelectorAll(scope+' button,'+scope+' input,'+scope+' select')]:[document.documentElement];return elements.filter(n=>n.getBoundingClientRect().width>0&&n.scrollWidth>n.clientWidth+2).map(n=>({tag:n.tagName,text:n.textContent.slice(0,90),width:n.clientWidth,scroll:n.scrollWidth}));},scope);
 assert.deepEqual(bad,[],label+' overflow');
}
for(const locale of SUPPORTED_LANGS.filter(locale=>!process.env.JSA_QA_LOCALES||process.env.JSA_QA_LOCALES.split(',').includes(locale))){
 const ui=getBusinessUi(locale),storage=getStorageUi(locale);
 await p.setViewport({width:1450,height:1000});
 await p.goto('http://127.0.0.1:5173/'+locale+'/business',{waitUntil:'networkidle0'});
 assert.equal(await p.$eval('h1',n=>n.textContent),ui.title);
 assert.match(await p.$eval('[data-storage-usage]',n=>n.textContent),new RegExp(formatStorageCount(4,locale)));
 await choose(ui.organizations,ids.org);await click(ui.open);await p.waitForSelector('textarea');
 // Compare within the same Intl runtime: Chrome and Node use different CLDR versions.
 const expectedDate=await p.evaluate((value,tag)=>new Date(value).toLocaleString(tag),future,getLanguageTag(locale));
 assert.ok((await p.$eval('main',n=>n.textContent)).includes(expectedDate),locale+' selected-language date');
 assert.ok((await p.$$eval('button',ns=>ns.map(n=>n.textContent))).includes(ui.approve));
 assert.equal(await p.$eval('.jsa-workspace',n=>getComputedStyle(n).direction),locale==='ar-SA'?'rtl':'ltr');
 await noOverflow(locale+' desktop');await noOverflow(locale+' controls','.jsa-container');
 if(locale==='de-DE')await p.screenshot({path:path.join(out,'business-de-desktop.png')});
 await p.setViewport({width:390,height:844});await p.waitFor(120);await noOverflow(locale+' mobile');await noOverflow(locale+' mobile controls','.jsa-container');
 if(locale==='ar-SA'){await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'business-ar-mobile.png')});}
 // Company template controls keep their own reading direction within the designer.
 await p.setViewport({width:1450,height:1000});
 await p.goto('http://127.0.0.1:5173/'+locale+'/document-designer',{waitUntil:'networkidle0'});
 const state={formData:snapshot.form_data,participants:snapshot.participants,analysisData:snapshot.analysis_data,procedures:snapshot.analysis_data.map(s=>s.proc),...snapshot.custom_layout};
 await p.evaluate(state=>history.replaceState({usr:state},'',location.href),state);await p.reload({waitUntil:'networkidle0'});
 await p.waitForSelector('[data-company-template-manager]');await choose(ui.organizations,ids.org,'[data-company-template-manager] ');
 assert.ok((await p.$eval('[data-company-template-manager]',n=>n.textContent)).includes(ui.saveTemplate));
 await noOverflow(locale+' template controls','[data-company-template-manager]');
 assert.equal(await p.$eval('[data-company-template-manager]',n=>getComputedStyle(n).direction),locale==='ar-SA'?'rtl':'ltr');
 // Expired usage guidance appears in the actual Export save dialog.
 usage={used:4,limit:3,can_create:false,trial_active:false,trial_expires_at:'2020-01-01T00:00:00Z'};
 await p.goto('http://127.0.0.1:5173/'+locale+'/export',{waitUntil:'networkidle0'});
 await p.evaluate(state=>history.replaceState({usr:{...state,openSaveDialog:true}},'',location.href),state);await p.reload({waitUntil:'networkidle0'});
 await p.waitForSelector('[data-storage-usage]');
 const content=await p.$eval('[data-storage-usage]',n=>n.textContent);assert.ok(content.includes(storage.expired));assert.ok(content.includes(storage.full));
 assert.equal(await p.$eval('[data-storage-usage]',n=>getComputedStyle(n).direction),locale==='ar-SA'?'rtl':'ltr');
 assert.equal(await p.$eval('[data-save-mode=private]',n=>n.disabled),true);
 await noOverflow(locale+' export notice','[data-storage-usage]');
 usage={used:4,limit:null,can_create:true,trial_active:true};
 console.log('PASS:',locale,'Business desktop/mobile, localized dates, approval labels, company templates, expired Export storage and direction');
}
assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
