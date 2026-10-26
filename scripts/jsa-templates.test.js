import test from 'node:test';
import assert from 'node:assert/strict';
import { JSA_TEMPLATES, builtInTemplate, authoringSnapshot, needsTemplate, draftDocumentLayout } from '../src/utils/jsaTemplates.js';
import { pickDocumentLayout } from '../src/utils/documentLayout.js';
import { reportPages, reportPageGeometry } from '../src/utils/reportPagination.js';
import { templateCopy } from '../src/locales/jsaTemplateUi.js';
const i18n={language:'ko',getFixedT:locale=>key=>locale+':'+key};
test('every free format preserves entered work, people, photos, ratings and custom field values',()=>{
 const input={formData:{projectName:'Existing',jsaType:'3-step',context:{documentLocale:'en-US',jurisdiction:'US'}},participants:['Person'],procedures:[{stepTitle:'Valve'}],
  analysisData:[{risks:[{factor:'Pressure',current_measure:'Isolation'}],frequency:2,customFields:{USER_1:'Keep'}}],stepPhotos:{0:'photo'},projectSaveContext:{id:'private-project',own:true}};
 const before=structuredClone(input);
 for(const id of JSA_TEMPLATES){const result=builtInTemplate(id,input,i18n);
  for(const key of ['participants','procedures','analysisData','stepPhotos','projectSaveContext'])assert.deepEqual(result[key],input[key]);
  assert.deepEqual(result.formData,input.formData);assert.equal(result.templateId,id);
  assert.ok(result.savedActiveOrder.includes('DATA_ACTION_CHECK'));assert.ok(result.savedActiveOrder.includes('DATA_CURRENT_MEASURE'));
  assert.equal(result.paperSize,'letter');assert.match(result.docTitle,/^en-US:/);
 }
 assert.deepEqual(input,before);
 assert.equal(builtInTemplate('portrait',input,i18n).savedOrientation,'portrait');
 assert.ok(builtInTemplate('photo',input,i18n).savedActiveOrder.includes('DATA_PHOTO'));
 assert.ok(builtInTemplate('actions',input,i18n).savedColumnOverrides.DATA_ACTION_CHECK.width>7);
});
test('fresh templates contain no fabricated work or completed controls',()=>{
 for(const id of JSA_TEMPLATES){const s=builtInTemplate(id,authoringSnapshot(),i18n);
  assert.deepEqual(s.analysisData,[]);assert.deepEqual(s.procedures,[]);assert.deepEqual(s.participants,[]);assert.equal(s.formData.projectName,undefined);
  assert.equal(pickDocumentLayout(s).templateId,id);
 }
});
test('new work chooses a template while existing drafts and legacy saved layouts remain intact',()=>{
 assert.equal(needsTemplate(authoringSnapshot()),true);
 for(const state of [{savedActiveOrder:['USER_X']},{documentBlocks:[{id:'JSA_TABLE'}]},{existingId:'p'},{isFork:true},{formData:{projectName:'Existing'}},{analysisData:[{}]}])assert.equal(needsTemplate(authoringSnapshot(state)),false);
 const draft={form_data:{projectName:'Draft'},analysis_data:[{id:1}],layout_data:{templateId:'photo',documentNotes:'Keep'},source_project_id:'p'};
 assert.equal(authoringSnapshot({},draft).templateId,'photo');
 assert.equal(authoringSnapshot({formData:{projectName:'New'}},draft).formData.projectName,'New');
 const custom=draftDocumentLayout({documentBlocks:[{id:'NOTES',enabled:true}],docTitle:'',savedActiveOrder:['USER_X'],savedUserColumns:[{id:'USER_X',label:'Custom'}]},i18n);
 assert.equal(custom.docTitle,'');assert.deepEqual(custom.savedActiveOrder,['USER_X']);
});
test('template UI covers all base languages and five workflow steps',()=>{
 assert.equal(Object.keys(templateCopy).length,11);
 for(const [locale,ui] of Object.entries(templateCopy)){
  for(const key of Object.keys(templateCopy.en))assert.ok(ui[key],locale+':'+key);
  assert.equal(ui.steps.length,5);assert.equal(ui.names.length,JSA_TEMPLATES.length);assert.equal(ui.descriptions.length,JSA_TEMPLATES.length);
 }
});
test('preview and PDF pagination repeat table headings and avoid splitting short rows',()=>{
 const pages=reportPages(1700,700,{cuts:[180,380,650,920,1200,1470,1700],headings:[{top:180,bottom:240,height:60,tableBottom:1700}]});
 assert.deepEqual(pages.map(p=>[p.start,p.end,p.headingHeight]),[[0,650,0],[650,1200,60],[1200,1700,60]]);
 const oversized=reportPages(1800,700,{cuts:[1800]});assert.deepEqual(oversized.map(p=>p.end),[700,1400,1800]);
 assert.throws(()=>reportPages(200000,700),/WORK_OUTPUT_LARGE/);
 assert.throws(()=>reportPages(100,0),/WORK_RENDER_FAILED/);
});
test('pagination geometry keeps short tables intact and excludes heading-only breaks',()=>{
 const bounds={top:100,height:800}, table={rows:[],getBoundingClientRect:()=>({top:120,bottom:280,height:160}),tHead:null};
 const row=bottom=>({tagName:'TR',closest:name=>name==='thead'?null:table,getBoundingClientRect:()=>({bottom})});
 table.rows=[row(180),row(280)];
 const element={getBoundingClientRect:()=>bounds,querySelectorAll:selector=>selector==='table'?[table]:table.rows};
 assert.deepEqual(reportPageGeometry(element,700,1).cuts,[181]);
});
