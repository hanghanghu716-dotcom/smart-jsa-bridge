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
 const errors=[],dialogs=[],calls=[];let projects=[],templates=[],drafts={},failProject=false,staleProject=false,failArchive=false;
 try{
 const p=await browser.newPage();await p.setViewport({width:1550,height:1000});p.on('pageerror',e=>errors.push(String(e)));p.on('dialog',d=>{dialogs.push(d.message());d.accept()});
 await p.setRequestInterception(true);p.on('request',async r=>{
  const url=r.url();if(url.startsWith(baseURL)||url.startsWith('data:')||url.startsWith('blob:'))return r.continue();
  const u=new URL(url),q=u.searchParams,method=r.method(),body=JSON.parse(r.postData()||'{}');let result=[],status=200;
  const eq=(key)=>q.get(key)?.replace(/^eq\./,'');
  const one=rows=>q.has('id') && !q.has('order') ? rows[0]||null : rows;
  if(method==='OPTIONS')return r.respond({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'},body:''});
  if(url.includes('/auth/v1/user'))result=user;
  else if(url.includes('/rest/v1/profiles'))result={id:user.id,username:'검증 계정'};
  else if(url.includes('/rest/v1/rpc/save_jsa_draft_snapshot')){calls.push(['draft',body]);const old=drafts[body.p_id];const data=Object.fromEntries(Object.entries(body).map(([k,v])=>[k.replace(/^p_/,''),v]));drafts[body.p_id]={...data,version:(old?.version||0)+1,updated_at:new Date().toISOString(),is_archived:false};result=[drafts[body.p_id]];}
  else if(url.includes('/rest/v1/user_jsa_drafts')){
   if(method==='PATCH'){calls.push(['archive',Object.fromEntries(q)]);const row=drafts[eq('id')];if(!failArchive&&row&&(!q.has('version')||row.version===Number(eq('version')))){Object.assign(row,body);result={id:row.id}}else result=null;}
   else result=one(Object.values(drafts).filter(x=>(!q.has('id')||x.id===eq('id'))&&(!q.has('is_archived')||!x.is_archived)));
  }
  else if(url.includes('/rest/v1/jsa_projects')){
   if(method==='POST'||method==='PATCH'){
    calls.push([method,body,Object.fromEntries(q)]);
    if(failProject){status=500;result={message:'forced offline'};}
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
 await open('export',initial);await p.waitForSelector('.reportPaper');const originalBody=await p.$eval('.document-content',n=>n.innerHTML);
 await click('작업물 저장');await p.screenshot({path:path.join(out,'save-options.png')});
 await p.evaluate(()=>{const b=document.querySelector('[data-save-mode=private]');b.click();b.click()});await p.waitFor(1700);
 assert.equal(projects.length,1);assert.deepEqual(projects[0].participants,initial.participants);assert.equal(projects[0].custom_layout.stepPhotos[0],photo);assert.equal(calls.filter(x=>x[0]==='archive').length,1);assert.equal(await p.evaluate(()=>sessionStorage.getItem('smartjsa_active_draft_id')),null);
 // Open the actual Library menu and its saved report action.
 await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()==='⋮');if(!b)throw Error('Library menu missing');b.click()});await p.waitFor(100);
 await click('보고서 보기','div');await p.waitForSelector('.reportPaper');assert.equal(await p.$eval('.document-content',n=>n.innerHTML),originalBody);
 await click('작업물 저장');assert.ok(await p.$('[data-save-mode=update]'));
 await p.click('[data-save-mode=update]');await p.waitFor(1200);assert.equal(projects.length,1);assert.ok(calls.some(x=>x[0]==='PATCH'&&x[2].updated_at));
 // Failed save and stale revision keep the draft and stay in the editor.
 failProject=true;await open('export',initial);await click('작업물 저장');const archiveBefore=calls.filter(x=>x[0]==='archive').length;await p.click('[data-save-mode=private]');await p.waitFor(1000);assert.equal(calls.filter(x=>x[0]==='archive').length,archiveBefore);assert.ok(p.url().endsWith('/export'));assert.ok(dialogs.some(x=>x.includes('저장하지 못했습니다')));failProject=false;
 const saved=projects[0];const editState={...initial,existingId:saved.id,projectSaveContext:{id:saved.id,updatedAt:saved.updated_at,own:true,isPublic:false,parentId:null}};
 staleProject=true;await open('export',editState);await click('작업물 저장');await p.click('[data-save-mode=update]');await p.waitFor(1000);assert.ok(dialogs.some(x=>x.includes('다른 곳에서 수정')));assert.equal(calls.filter(x=>x[0]==='archive').length,archiveBefore);staleProject=false;
 await p.waitFor(1100);await p.evaluate(()=>history.replaceState({},'',location.href));await p.reload({waitUntil:'networkidle0'});await p.waitForSelector('.reportPaper');assert.ok(await p.$eval('.document-content',n=>n.textContent.includes('개인 확인자')));await click('작업물 저장');assert.ok(await p.$('[data-save-mode=update]'));

 // Public copy removes private fields and keeps the private draft/original.
 await p.click('[data-save-mode=public]');await p.waitFor(1100);assert.equal(projects.length,2);assert.equal(projects[0].is_public,false);assert.equal(projects[1].is_public,true);assert.deepEqual(projects[1].participants,[]);assert.equal(projects[1].form_data.managerName,undefined);assert.equal(projects[1].custom_layout.stepPhotos,undefined);assert.deepEqual(projects[1].analysis_data[0].customFields,{});assert.equal(calls.filter(x=>x[0]==='archive').length,archiveBefore);
 // A saved project must remain successful even when archiving races another tab.
 failArchive=true;await open('export',initial);await click('작업물 저장');await p.click('[data-save-mode=private]');await p.waitFor(1200);assert.equal(projects.length,3);assert.ok(dialogs.some(x=>x.includes('작업물은 저장했지만')));assert.ok(await p.evaluate(()=>sessionStorage.getItem('smartjsa_active_draft_id')));failArchive=false;
 // Template CRUD + default with an edited layout.
 await open('document-designer',initial);await p.waitForSelector('[data-template-manager]');await fill('input[placeholder="템플릿 이름"]','회사 기본');await click('새 템플릿으로 저장');await p.waitFor(300);assert.equal(templates.length,1);assert.equal(templates[0].layout_data.stepPhotos,undefined);
 await fill('input[placeholder="템플릿 이름"]','회사 표준');await click('이름 변경');assert.equal(templates[0].name,'회사 표준');
 await fill('input[aria-label="문서 제목"]','갱신된 양식');await click('현재 양식으로 갱신');assert.equal(templates[0].layout_data.docTitle,'갱신된 양식');await click('기본 양식으로 지정');assert.equal(templates[0].is_default,true);await p.screenshot({path:path.join(out,'template-manager.png')});
 const newDoc={formData:initial.formData,participants:initial.participants,analysisData:initial.analysisData,procedures};await open('document-designer',newDoc);assert.equal(await p.$eval('input[aria-label="문서 제목"]',n=>n.value),'갱신된 양식');
 await open('document-designer',initial);assert.equal(await p.$eval('input[aria-label="문서 제목"]',n=>n.value),'회사 완성본');await p.select('select[aria-label="문서 템플릿"]',templates[0].id);await click('기본 지정 해제');assert.equal(templates[0].is_default,false);await click('템플릿 삭제');assert.equal(templates.length,0);
 // Reordering saved work steps must move photos and custom values with their step.
 await open('procedure',initial);await click('작업 라이브러리에서 조립');await p.waitFor(600);
 await p.evaluate(()=>{const n=[...document.querySelectorAll('[draggable=true]')].find(n=>n.textContent.includes('1. 작업 1'));if(!n)throw Error('Missing draggable step');n.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:new DataTransfer()}))});await p.waitFor(100);
 await p.evaluate(()=>{const n=[...document.querySelectorAll('[draggable=true]')].find(n=>n.textContent.includes('2. 작업 2'));n.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()}))});await p.waitFor(100);
 await click('오늘 작업으로 적용');await click('지능형 위험 분석 시작');await p.evaluate(()=>[...document.querySelectorAll('h4')].find(n=>n.textContent==='심화 3단계 분석').parentElement.click());await p.waitFor(500);
 const moved=await p.evaluate(()=>history.state.usr);assert.equal(moved.procedures[1].stepTitle,'작업 1');assert.equal(moved.stepPhotos[1],photo);assert.equal(moved.stepPhotos[0],undefined);assert.equal(moved.analysisData[1].customFields.USER_qa,'개인 확인자');
 assert.deepEqual(errors,[]);console.log('PASS: private retention, exact Library reopen, update, duplicate click, failure/stale draft retention, redacted public copy, template CRUD/default/new-only, refresh recovery, archive conflict and photo reorder.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});


