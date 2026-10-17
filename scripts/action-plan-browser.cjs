const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const baseURL=process.env.JSA_QA_BASE_URL || 'http://127.0.0.1:5173';
const puppeteer=require('module').createRequire(path.join(root,'package.json'))('puppeteer');
const out=process.env.JSA_QA_OUTPUT || path.join(require('os').tmpdir(),'smartjsa-action-qa');fs.mkdirSync(out,{recursive:true});
const user={id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',aud:'authenticated',role:'authenticated'};
const session={access_token:[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:Math.floor(Date.now()/1000)+3600},'fixture'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.'),refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user};
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const procedures=Array.from({length:3},(_,i)=>({stepTitle:'작업 '+(i+1),stepDetail:'통행로 확인 '+i}));
const layout={docTitle:'회사 완성본',documentBlocks:[{id:'PROJECT_INFO',enabled:true},{id:'JSA_TABLE',enabled:true},{id:'PARTICIPANTS',enabled:true},{id:'NOTES',enabled:true}],savedActiveOrder:['DATA_STEP_TITLE','DATA_HAZARD','DATA_PHOTO','USER_qa'],savedUserColumns:[{id:'USER_qa',label:'확인자',fieldType:'text',width:5}],savedOrientation:'portrait',documentNotes:'개인 지시',stepPhotos:{0:photo}};
const initial={formData:{projectName:'배관 점검',department:'비공개 부서',workLocation:'비공개 장소',workDate:'2026-09-30',managerName:'담당 이름',ppe:[],permits:[],jsaType:'3-step'},participants:['개인 작업자'],procedures,analysisData:procedures.map((proc,id)=>({id,proc,risks:[{factor:'충돌',measure:'구역 표시',current_measure:'구역 표시',recommend_measure:'통행 분리'}],frequency:2,severity:3,riskLevel:6,customFields:{USER_qa:'개인 확인자'}})),...layout};
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
 async function fill(selector,value){await p.$eval(selector,(n,value)=>{Object.getOwnPropertyDescriptor(n.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,'value').set.call(n,value);n.dispatchEvent(new Event('input',{bubbles:true}))},value);await p.waitFor(80);}
 async function open(route,state){await p.goto(baseURL+'/ko/'+route,{waitUntil:'networkidle0'});await p.evaluate(state=>{sessionStorage.removeItem('smartjsa_active_draft_id');sessionStorage.removeItem('smartjsa_active_draft_version');history.replaceState({usr:state},'',location.href)},state);await p.reload({waitUntil:'networkidle0'});}

 for (const type of ['2-step','3-step']) {
  const doc={formData:{...initial.formData,jsaType:type,context:{jurisdiction:'KR',documentLocale:'ko'},saveVisibility:'private'},participants:[],procedures:[procedures[0]],analysisData:[{...initial.analysisData[0],id:0,frequency:4,severity:5,riskLevel:20}]};
  await open('analysis',doc);await p.waitForSelector('[data-action-plan]');
  assert.equal(Boolean(await p.$('[data-action-field=additionalControls]')),type==='2-step');
  if(type==='2-step')await fill('[data-action-field=additionalControls]','추가 고정 방호장치 설치');
  await fill('[data-action-field=owner]','조치담당 QA');await fill('[data-action-field=dueDate]','2026-10-17');
  await p.select('[data-action-field=residualFrequency]','1');await p.select('[data-action-field=residualSeverity]','4');
  assert.ok(await p.$('[data-risk-limit-warning]'));
  await p.select('[data-action-field=status]','implemented');await fill('[data-action-field=completedOn]','2026-10-16');
  await fill('[data-action-field=verifiedBy]','효과확인 QA');await fill('[data-action-field=verifiedOn]','2026-10-17');await p.select('[data-action-field=effectiveness]','effective');
  assert.equal(await p.$('[data-risk-limit-warning]'),null);
  assert.ok(await p.$eval('[data-residual-score]',n=>n.textContent.includes('1 × 4 = 4')));
  await p.waitFor(1600);
  const saved=Object.values(drafts).filter(d=>d.current_stage==='analysis').at(-1);assert.equal(saved.analysis_data[0].actionPlan.verifiedBy,'효과확인 QA');
  await p.evaluate(()=>history.replaceState({},'',location.href));await p.reload({waitUntil:'networkidle0'});await p.waitForSelector('[data-action-plan]');
  assert.equal(await p.$eval('[data-action-field=verifiedBy]',n=>n.value),'효과확인 QA');
  const editing={...doc,analysisData:saved.analysis_data};
  await open('document-designer',editing);await p.waitForSelector('.document-content');
  const preview=await p.$eval('.document-content',n=>n.textContent);assert.ok(preview.includes('효과확인 QA'));assert.ok(preview.includes('1 × 4 = 4'));
  await p.screenshot({path:path.join(out,type+'-designer.png'),fullPage:true});
  // Navigate using the editor's export button so its actual column settings are carried.
  const next=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/출력|내보내기/.test(b.textContent)&&b.textContent.length<40);if(!b)throw Error('No export control');const text=b.textContent;b.click();return text});
  await p.waitForSelector('.reportPaper',{timeout:15000});
  assert.ok(await p.$eval('.reportPaper',n=>n.textContent.includes('효과확인 QA')));
  const exported=await p.evaluate(()=>history.state.usr);
  const pdf=await p.evaluate(async()=>{await document.fonts.ready;const {createReportPdf}=await import('/src/utils/reportPdf.js');const result=await createReportPdf([{element:document.querySelector('.reportPaper'),orientation:'landscape',paperSize:'a4'}]);return {size:result.blob.size,pages:result.images.length,image:result.images[0].url};});
  assert.ok(pdf.size>5000);assert.ok(pdf.pages>=1);fs.writeFileSync(path.join(out,type+'-pdf.jpg'),Buffer.from(pdf.image.split(',')[1],'base64'));
  await click('작업물 저장');await p.click('[data-save-mode=private]');await p.waitFor(1500);
  const cloud=projects.at(-1);assert.equal(cloud.analysis_data[0].actionPlan.verifiedBy,'효과확인 QA');
  await open('export',{...exported,formData:cloud.form_data,analysisData:cloud.analysis_data,...cloud.custom_layout});
  assert.ok(await p.$eval('.reportPaper',n=>n.textContent.includes('효과확인 QA')));
  await p.setViewport({width:390,height:844});await open('analysis',editing);await p.waitForSelector('[data-action-plan]');await p.$eval('[data-action-plan]',n=>n.scrollIntoView());
  assert.ok(await p.$eval('[data-action-plan]',n=>n.scrollWidth<=n.clientWidth+2));await p.screenshot({path:path.join(out,type+'-mobile.png')});await p.setViewport({width:1550,height:1000});
  console.log('PASS',type,'input, provisional guard, verification, draft recovery, designer, PDF, cloud payload and reopen, mobile');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
