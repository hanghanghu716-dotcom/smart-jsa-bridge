const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const baseURL=process.env.JSA_QA_BASE_URL || 'http://127.0.0.1:5173';
const puppeteer=require('module').createRequire(path.join(root,'package.json'))('puppeteer');
const out=process.env.JSA_QA_OUTPUT || path.join(require('os').tmpdir(),'smartjsa-phase45-qa');fs.mkdirSync(out,{recursive:true});
const user={id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',aud:'authenticated',role:'authenticated'};
const session={access_token:[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user};
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const procedures=Array.from({length:3},(_,i)=>({stepTitle:'작업 '+(i+1),stepDetail:'통행로 확인 '+i}));
const layout={docTitle:'회사 완성본',documentBlocks:[{id:'PROJECT_INFO',enabled:true},{id:'JSA_TABLE',enabled:true},{id:'PARTICIPANTS',enabled:true},{id:'NOTES',enabled:true}],savedActiveOrder:['DATA_STEP_TITLE','DATA_HAZARD','DATA_PHOTO','USER_qa'],savedUserColumns:[{id:'USER_qa',label:'확인자',fieldType:'text',width:5}],savedOrientation:'portrait',documentNotes:'개인 지시',stepPhotos:{0:photo}};
const initial={formData:{projectName:'배관 점검',department:'비공개 부서',workLocation:'비공개 장소',workDate:'2026-09-30',managerName:'담당 이름',ppe:[],permits:[],jsaType:'3-step'},participants:['개인 작업자'],procedures,analysisData:procedures.map((proc,id)=>({id,proc,risks:[{factor:'충돌',current_measure:'구역 표시',recommend_measure:'통행 분리'}],frequency:2,severity:3,riskLevel:6,customFields:{USER_qa:'개인 확인자'}})),...layout};
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const errors=[],dialogs=[],calls=[];let usage={used:2,limit:3,trial_active:false,can_create:true},quotaReject=false;let projects=[],templates=[],drafts={},failProject=false,staleProject=false,failArchive=false;
 try{
 const p=await browser.newPage();await p.setViewport({width:1550,height:1000});p.on('pageerror',e=>errors.push(String(e)));p.on('dialog',d=>{dialogs.push(d.message());d.accept()});
 await p.setRequestInterception(true);p.on('request',async r=>{
  const url=r.url();if(url.startsWith(baseURL)||url.startsWith('data:')||url.startsWith('blob:'))return r.continue();
  const u=new URL(url),q=u.searchParams,method=r.method(),body=JSON.parse(r.postData()||'{}');let result=[],status=200;
  const eq=(key)=>q.get(key)?.replace(/^eq\./,'');
  const one=rows=>q.has('id') && !q.has('order') ? rows[0]||null : rows;
  if(method==='OPTIONS')return r.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'},body:''});
  if(url.includes('/rest/v1/rpc/get_jsa_storage_usage'))result=usage;
  else if(url.includes('/auth/v1/user'))result=user;
  else if(url.includes('/rest/v1/profiles'))result={id:user.id,username:'검증 계정'};
  else if(url.includes('/rest/v1/rpc/save_jsa_draft_snapshot')){calls.push(['draft',body]);const old=drafts[body.p_id];const data=Object.fromEntries(Object.entries(body).map(([k,v])=>[k.replace(/^p_/,''),v]));drafts[body.p_id]={...data,version:(old?.version||0)+1,updated_at:new Date().toISOString(),is_archived:false};result=[drafts[body.p_id]];}
  else if(url.includes('/rest/v1/user_jsa_drafts')){
   if(method==='PATCH'){calls.push(['archive',Object.fromEntries(q)]);const row=drafts[eq('id')];if(!failArchive&&row&&(!q.has('version')||row.version===Number(eq('version')))){Object.assign(row,body);result={id:row.id}}else result=null;}
   else result=one(Object.values(drafts).filter(x=>(!q.has('id')||x.id===eq('id'))&&(!q.has('is_archived')||!x.is_archived)));
  }
  else if(url.includes('/rest/v1/jsa_projects')){
   if(method==='POST'||method==='PATCH'){
    calls.push([method,body,Object.fromEntries(q)]);
    if(quotaReject&&method==='POST'){status=400;result={message:'FREE_PROJECT_LIMIT',code:'P0001'};}
    else if(failProject){status=500;result={message:'forced offline'};}
    else if(method==='POST'){result={...body,id:'project-'+(projects.length+1),created_at:new Date().toISOString()};projects.push(result);}
    else {result=projects.find(x=>x.id===eq('id')&&!staleProject&&x.updated_at===eq('updated_at'))||null;if(result)Object.assign(result,body);}
   }else result=one(projects.filter(x=>!q.has('id')||x.id===eq('id')));
  }
  else if(url.includes('/rest/v1/rpc/set_default_document_template')){templates.forEach(x=>x.is_default=x.id===body.p_layout_id);result=null;}
  else if(url.includes('/rest/v1/user_layouts')){
   if(method==='POST'){result={...body,id:'template-'+(templates.length+1),created_at:new Date().toISOString(),is_default:false};templates.push(result);}
   else if(method==='PATCH'){result=templates.find(x=>x.id===eq('id'));Object.assign(result,body);}
   else if(method==='DELETE'){result={id:eq('id')};templates=templates.filter(x=>x.id!==eq('id'));}
   else result=one(templates);
  }
  else if(!url.includes('/rest/v1/')&&!url.includes('/auth/v1/'))return r.abort();
  return r.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(result)});
 });
 await p.evaluateOnNewDocument(s=>localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token',JSON.stringify(s)),session);
 async function click(text,selector='button'){await p.evaluate((text,selector)=>{const b=[...document.querySelectorAll(selector)].find(n=>n.textContent.trim()===text);if(!b)throw Error('Missing '+text);b.click()},text,selector);await p.waitFor(200);}
 async function fill(selector,value){await p.$eval(selector,(n,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,value);n.dispatchEvent(new Event('input',{bubbles:true}))},value);await p.waitFor(80);}
 async function open(route,state){await p.goto(baseURL+'/ko/'+route,{waitUntil:'networkidle0'});await p.evaluate(state=>{sessionStorage.removeItem('smartjsa_active_draft_id');sessionStorage.removeItem('smartjsa_active_draft_version');history.replaceState({usr:state},'',location.href)},state);await p.reload({waitUntil:'networkidle0'});}

 const editState={...initial,existingId:'project-1',projectSaveContext:{id:'project-1',updatedAt:'2026-09-30T00:00:00Z',own:true,isPublic:false,parentId:null}};
 projects.push({id:'project-1',author_id:user.id,user_id:user.id,title:'배관 점검',form_data:initial.formData,analysis_data:initial.analysisData,procedures,is_public:false,updated_at:'2026-09-30T00:00:00Z'});
 await open('export',editState);await click('작업물 저장');await p.waitForSelector('[data-storage-usage]');
 assert.match(await p.$eval('[data-storage-usage]',n=>n.textContent),/2 \/ 3/);
 // Another tab takes the last slot after this modal has loaded.
 usage={...usage,used:3,can_create:false};quotaReject=true;
 const archived=calls.filter(x=>x[0]==='archive').length;
 await p.click('[data-save-mode=private]');await p.waitFor(1400);
 assert.ok(p.url().endsWith('/export'));assert.equal(calls.filter(x=>x[0]==='archive').length,archived);
 assert.ok(await p.evaluate(()=>sessionStorage.getItem('smartjsa_active_draft_id')));
 assert.equal(await p.$eval('[data-save-mode=private]',n=>n.disabled),true);
 assert.equal(await p.$eval('[data-save-mode=update]',n=>n.disabled),false);
 assert.match(await p.$eval('[role=alert]',n=>n.textContent),/작성 중인 내용은 유지/);
 await p.screenshot({path:require('path').join(out,'storage-full.png')});
 // Active trial reopens the slot; expiry preserves all four existing documents.
 usage={used:4,limit:null,trial_active:true,can_create:true,trial_expires_at:'2099-01-01T00:00:00Z'};
 await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await p.waitFor(400);
 assert.equal(await p.$eval('[data-save-mode=private]',n=>n.disabled),false);
 assert.equal(await p.$('[role=alert]'),null);
 usage={...usage,limit:3,trial_active:false,can_create:false,trial_expires_at:'2020-01-01T00:00:00Z'};
 await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await p.waitFor(400);
 assert.equal(await p.$eval('[data-save-mode=private]',n=>n.disabled),true);
 assert.match(await p.$eval('[data-storage-usage]',n=>n.textContent),/기존 문서는 보존/);
 await p.click('[data-save-mode=update]');await p.waitFor(1200);
 assert.ok(calls.some(x=>x[0]==='PATCH'));assert.equal(calls.filter(x=>x[0]==='archive').length,archived+1);
 assert.ok(p.url().endsWith('/library'));await p.waitForSelector('[data-storage-usage]');
 assert.match(await p.$eval('[data-storage-usage]',n=>n.textContent),/4 \/ 3/);
 assert.deepEqual(errors,[]);console.log('PASS: quota race rejection preserves draft, trial unblocks, expiry keeps update available, Library usage displayed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
