import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORTED_LANGS,getLanguageTag } from '../src/locales/config.js';
import { GUIDE_CATEGORIES,GUIDE_REGIONS,makeGuide,guideResourceLocale } from '../src/utils/guideContent.js';
import { GUIDE_TEXT,GUIDE_LANGUAGES } from '../src/locales/guideText.js';
const guide=(locale,category)=>makeGuide(locale,category,JSON.parse(fs.readFileSync(`src/locales/${guideResourceLocale(locale)}/${GUIDE_CATEGORIES[category]}.json`)));
test('all 108 routes have complete HTML/PDF content, unique outputs and native guide copy',()=>{
 const outputs=new Set();
 for(const locale of SUPPORTED_LANGS)for(const category of Object.keys(GUIDE_CATEGORIES)){
  const g=guide(locale,category);assert.equal(g.language,getLanguageTag(locale));assert.ok(g.localNote.length>80);assert.ok(g.examples.length>=7);assert.ok(g.sources.length);
  assert.ok(g.documents.length>=4);assert.ok(g.examples.every(e=>e.title&&e.hazard&&e.checks.length));assert.ok(!outputs.has(g.pdfUrl));outputs.add(g.pdfUrl);
  assert.ok(!g.pdfUrl.includes('/assets/pdf/'));assert.ok(g.url.endsWith(`/${locale}/guideline/${category}`));
  if(!locale.startsWith('en'))assert.notEqual(g.title,guide('en-US',category).title);
 }
 assert.equal(outputs.size,108);
 for(const [key,translations] of Object.entries(GUIDE_TEXT))for(const lang of GUIDE_LANGUAGES)assert.ok(translations[lang],`${key}/${lang}`);
});
test('English and French regions retain different document systems, not language-only substitutions',()=>{
 assert.match(guide('en-AU','construction').localNote,/SWMS.*not the name/s);
 assert.match(guide('en-SG','construction').localNote,/Safe Work Procedure/);
 assert.match(guide('en-GB','construction').localNote,/RAMS/);
 assert.match(guide('en-US','construction').localNote,/State Plan/);
 assert.match(guide('fr-CA-QC','construction').localNote,/cadenassage/);
 assert.notEqual(GUIDE_REGIONS['CA-QC'],GUIDE_REGIONS.FR);
 assert.notEqual(GUIDE_REGIONS['CA-AB'],GUIDE_REGIONS['CA-ON']);
});
test('legacy universal numerical limits and unsafe operating-mode recommendations are not republished',()=>{
 for(const l of SUPPORTED_LANGS)for(const c of Object.keys(GUIDE_CATEGORIES)){
  const rendered=guide(l,c).examples.flatMap(e=>e.checks).join(' ');
  assert.doesNotMatch(rendered,/1\.1|0%|11m|10km|24V|10cm|2-line|Inch|10m\/s/);
 }
 assert.throws(()=>makeGuide('xx','common',{}));assert.throws(()=>makeGuide('ko','unknown',{}));
});
test('every old guide route delegates to the same localized article and no Korean PDF fallback',()=>{
 for(const name of ['CommonGuide','ConstructionGuide','ManufacturingGuide','ChemicalGasGuide','HighRiskGuide','GeneralGuide']){
  const source=fs.readFileSync(`src/pages/guideline/${name}.jsx`,'utf8');assert.match(source,/LocalizedGuide/);assert.doesNotMatch(source,/assets\/pdf/);
 }
 const component=fs.readFileSync('src/pages/guideline/LocalizedGuide.jsx','utf8');assert.match(component,/application\/ld\+json/);assert.match(component,/canonicalLocale=\{locale\}/);assert.match(component,/guide-document/);
});
