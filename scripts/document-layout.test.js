import test from 'node:test';
import assert from 'node:assert/strict';
import { columnPercentages, defaultColumns, moveItem, templateLayout, pickDocumentLayout } from '../src/utils/documentLayout.js';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('three-step defaults include both control columns', () => {
  assert.ok(defaultColumns('3-step').includes('DATA_CURRENT_MEASURE'));
  assert.ok(defaultColumns('3-step').includes('DATA_RECOMMEND_MEASURE'));
  assert.ok(!defaultColumns('2-step').includes('DATA_CURRENT_MEASURE'));
});

test('wide, flex and malformed column weights remain positive and sum to 100', () => {
  for (const input of [[{width:24},{width:24},{isFlex:true}], [{width:-4},{width:0},{width:'x'}], [{width:2},{width:10}]]) {
    const result = columnPercentages(input);
    assert.ok(result.every(n => Number.isFinite(n) && n > 0));
    assert.ok(Math.abs(result.reduce((a,b)=>a+b,0)-100)<1e-8);
  }
  assert.deepEqual(columnPercentages([]), []);
});

test('reordering supports both ends and ignores invalid moves without mutation', () => {
  const original = ['A','B','C'];
  assert.deepEqual(moveItem(original, 0, 2), ['B','C','A']);
  assert.deepEqual(moveItem(original, 2, 0), ['C','A','B']);
  assert.deepEqual(moveItem(original, 0, -1), original);
  assert.deepEqual(original, ['A','B','C']);
});

test('legacy templates reset newer overrides and notes instead of inheriting previous template fields', () => {
  const layout = templateLayout({activeOrder:['DATA_HAZARD'],userColumns:[],orientation:'portrait'}, {docTitle:'Default',savedSignatureRows:2});
  assert.deepEqual(layout.savedActiveOrder,['DATA_HAZARD']);
  assert.deepEqual(layout.savedColumnOverrides,{});
  assert.equal(layout.documentNotes,''); assert.equal(layout.savedSignatureRows,2);
  assert.equal(layout.savedOrientation,'portrait');
  assert.equal(templateLayout({docTitle:'',appr1:''},{docTitle:'Default',appr1:'Author'}).docTitle,'');
});

test('navigation preserves document settings and intentional empty values without nesting JSA data', () => {
  assert.deepEqual(pickDocumentLayout({documentNotes:'',formData:{private:'data'}},{documentNotes:'old',savedOrientation:'portrait'}),{documentNotes:'',savedOrientation:'portrait'});
});

test('shared document renders ordered enabled blocks, renamed grouped headers, values and all participants', async () => {
  const server = await createServer({server:{middlewareMode:true},appType:'custom'});
  const previousDocument = global.document;
  try {
    const {default:i18n} = await server.ssrLoadModule('/src/i18n.js');
    global.document = {documentElement:{}};
    await i18n.changeLanguage('en-US');
    const {default:Content} = await server.ssrLoadModule('/src/components/DocumentContent.jsx');
    const layout = {documentBlocks:[{id:'NOTES',enabled:true},{id:'PROJECT_INFO',enabled:false},{id:'JSA_TABLE',enabled:true},{id:'PARTICIPANTS',enabled:true}],
      documentNotes:'Inspection & notes',savedSignatureRows:1,savedActiveOrder:['DATA_FREQUENCY','DATA_HAZARD','USER_n','USER_check'],
      savedColumnOverrides:{DATA_FREQUENCY:{label:'Likelihood override',width:24,isFlex:false}},
      savedUserColumns:[{id:'USER_n',label:'Quantity',width:24},{id:'USER_check',label:'Verified',fieldType:'checkbox'}]};
    const html=renderToStaticMarkup(React.createElement(Content,{layout,participants:Array.from({length:14},(_,i)=>`Person${i+1}`),analysisData:[{frequency:3,risks:[{factor:'Fall <risk>'}],customFields:{USER_n:0,USER_check:false}}]}));
    assert.ok(html.indexOf('data-document-block="NOTES"') < html.indexOf('data-document-block="JSA_TABLE"'));
    assert.ok(!html.includes('data-document-block="PROJECT_INFO"'));
    assert.ok(html.includes('Likelihood override')); assert.ok(html.includes('Fall &lt;risk&gt;'));
    assert.ok(html.includes('Person14')); assert.ok(html.includes('>0</td>')); assert.ok(html.includes('☐'));
    assert.ok(!html.includes('NaN')); assert.ok(!html.includes('undefined'));
  } finally { global.document = previousDocument; await server.close(); }
});
