import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/utils/reportPdf.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
async function render(tables, height, orientation = 'landscape') {
  const output = [];
  const sourceCanvas = { width: 277, height, getContext: () => ({getImageData: () => ({data: new Uint8ClampedArray(277 * height * 4).fill(1)})}) };
  const document = {createElement: () => {
    const draws = [];
    return {width:0,height:0,getContext: () => ({fillRect(){},drawImage(...args){draws.push(args.slice(1));}}),
      toDataURL(){output.push({height:this.height, draws});return 'data:image/jpeg;base64,test';}};
  }};
  const bounds = {top:0,height};
  const nodes = tables.flatMap(table => table.rows);
  const element = {getBoundingClientRect:()=>bounds,querySelectorAll:sel=>sel === 'table' ? tables : nodes};
  class PDF { addPage(){} addImage(){} output(){return {};} }
  const fn = new Function('jsPDF','captureReport','normalizePaperSize','paperDimensions','paperPrintStyles','document',source+';return createReportPdf;');
  const create = fn(PDF,async()=>sourceCanvas,x=>x,(_,o)=>o === 'portrait' ? {width:210,height:297}:{width:297,height:210},()=>'',document);
  await create([{element,orientation,paperSize:'a4'}]);
  return output;
}
function table(top, headHeight, rowEnds) {
  const result = {getBoundingClientRect:()=>({top,bottom:rowEnds.at(-1),height:rowEnds.at(-1)-top}),
    tHead:headHeight ? {getBoundingClientRect:()=>({top,bottom:top+headHeight})}:null,rows:[]};
  result.rows = rowEnds.map(bottom=>({tagName:'TR',closest:sel=>sel === 'thead' ? null : result,getBoundingClientRect:()=>({bottom})}));
  return result;
}
test('continuation pages repeat the entire header and retain every source pixel once', async()=>{
  const pages = await render([table(40,30,[130,220,310,400,490])],510);
  assert.ok(pages.length > 2);
  let next = 0, repeated = 0;
  for(const page of pages) {
    assert.ok(page.height <= 190);
    const body = page.draws.at(-1);
    assert.equal(body[1],next);
    next += body[3];
    if(page.draws.length === 2) {
      repeated++;
      assert.deepEqual(page.draws[0],[0,40,277,30,0,0,277,30]);
      assert.equal(body[5],30);
    }
  }
  assert.ok(repeated >= 2);
  assert.equal(next,510);
});
test('finished tables do not repeat headings over notes', async()=>{
  const pages = await render([table(0,20,[80,160,240])],500);
  assert.equal(pages.at(-1).draws.length,1);
});
test('oversized rows continue making progress within the page height', async()=>{
  const pages = await render([table(0,25,[600])],600);
  assert.ok(pages.length >= 4);
  assert.ok(pages.every(page=>page.height>0&&page.height<=190));
  assert.equal(pages.slice(1).every(page=>page.draws.length===2),true);
});
test('a single-page table has no duplicate header', async()=>{
  const pages=await render([table(20,20,[80,140])],150);
  assert.equal(pages.length,1);
  assert.equal(pages[0].draws.length,1);
});
test('tables without a header retain normal pagination', async()=>{
  const pages=await render([table(0,0,[80,160,240,320])],330);
  assert.ok(pages.length>1);
  assert.ok(pages.every(page=>page.draws.length===1));
});
