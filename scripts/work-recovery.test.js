import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryKey, recoveryValue, validRecovery, RECOVERY_TTL } from '../src/utils/workRecovery.js';
import { WORK_RECOVERY_TEXT } from '../src/locales/workRecoveryUi.js';
import { checkManifest } from './verify-live-release.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { GUIDE_CATEGORIES } from '../src/utils/guideContent.js';
test('draft identity separates accounts, packages and reusable/actual work', () => {
  const keys = [recoveryKey('a','run','p'),recoveryKey('b','run','p'),recoveryKey('a','package','p'),recoveryKey('a','run','q')];
  assert.equal(new Set(keys).size,4); assert.throws(() => recoveryKey(null,'run','p'));
});
test('recovery refuses another account, changed original, expired and future drafts', () => {
  const now = Date.now(), row = {owner:'a',base:'revision1',version:1,savedAt:now,value:{}};
  assert.equal(validRecovery(row,'a','revision1',now),true);
  assert.equal(validRecovery(row,'b','revision1',now),false);
  assert.equal(validRecovery(row,'a','revision2',now),false);
  assert.equal(validRecovery(row,'a','revision1',now+RECOVERY_TTL),false);
  assert.equal(validRecovery(row,'a','revision1',now-1),false);
});
test('continuing work preserves measurements but invalidates review without changing source', () => {
  const original = {values:{gas:'test reading'},regionalReviewed:true};
  const restored = recoveryValue('run',original);
  assert.equal(restored.values.gas,'test reading'); assert.equal(restored.regionalReviewed,false); assert.equal(original.regionalReviewed,true);
  for (const translations of Object.values(WORK_RECOVERY_TEXT)) assert.equal(Object.keys(translations).length,10);
});
test('live release verifier rejects missing locale, stale version, duplicated route and external PDF', () => {
  const good = SUPPORTED_LANGS.flatMap(locale => Object.keys(GUIDE_CATEGORIES).map(category => ({locale,route:`/${locale}/guideline/${category}`,pdf:`/assets/guides/${locale}/${category}-2026-10-03.pdf`,sha256:'a'.repeat(64)})));
  checkManifest(good,good);
  assert.throws(() => checkManifest(good.slice(1),good));
  assert.throws(() => checkManifest([...good.slice(1),good[1]],good));
  assert.throws(() => checkManifest(good,good.map(g=>({...g,sha256:'b'.repeat(64)}))));
  assert.throws(() => checkManifest(good.map((g,i)=>i?g:{...g,pdf:'https://external.test/file.pdf'})));
});
