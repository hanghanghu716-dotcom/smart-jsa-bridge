import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { bindGuidanceSources, guidanceCitations, guidanceSourceState, verifyGuidanceBindings, verifyGuidanceEvidence } from './recommendation-guidance-sources.js';
import { knowledgeContentHash, validateKnowledgeBank } from './recommendation-knowledge.js';

const hash = text => createHash('sha256').update(text).digest('hex');
function fixture() {
  const text = 'SYNTHETIC technical source content; not a review of any real guidance.';
  const source = { url: 'https://example.com/primary', section: 'Isolation', evidenceRole: 'technical' };
  const support = { url: 'https://example.com/manual', section: 'Page 5', role: 'Manufacturer example only' };
  const captures = [source, support].map((s, i) => ({ id: `test-${i}`, url: s.url, edition: 'TEST FIXTURE',
    retrievedOn: '2026-01-01', representation: 'web-extracted-text-v1', coverage: 'selected-sections',
    scopeLimit: 'Synthetic test only', attribution: 'Synthetic test', coveredSections: [s.section],
    fragments: [{ selector: s.section, sha256: hash(text), utf8Bytes: Buffer.byteLength(text) }] }));
  const manifest = { schemaVersion: 1, captures };
  const evidence = { schemaVersion: 1, captures: captures.map(c => ({ id: c.id, url: c.url, fragments: [{selector:c.fragments[0].selector,text}] })) };
  const unit = { id: 'test', sourceType: 'guidance', status: 'draft', sources: [source], sourceCheck: { supportingReferences: [support] }, sourceFingerprint: null };
  return { manifest, evidence, bank: { schemaVersion: 1, units: [unit] } };
}
function approvedFixture() {
  const f = fixture();
  f.bank = bindGuidanceSources(f.bank, f.manifest, f.evidence).bank;
  const u = f.bank.units[0];
  u.status = 'reviewed';
  u.review = { technicalStatus: 'approved', regionalStatus: 'approved', translationStatus: 'approved', reviewer: 'TEST ONLY', reviewedAt: '2026-01-01', contentHash: knowledgeContentHash(u) };
  return f;
}

test('binding includes supporting references and preserves the input', () => {
  const {bank,manifest,evidence} = fixture();
  assert.equal(guidanceCitations(bank.units[0]).length,2);
  const result = bindGuidanceSources(bank,manifest,evidence);
  assert.match(result.bank.units[0].sourceFingerprint,/^[a-f0-9]{64}$/);
  assert.equal(bank.units[0].sourceFingerprint,null);
  assert.deepEqual(verifyGuidanceBindings(result.bank,manifest),[]);
});

test('changed captured text invalidates every approval and the old content hash', () => {
  const {bank,manifest,evidence} = approvedFixture();
  const old = bank.units[0].sourceFingerprint;
  evidence.captures[0].fragments[0].text += ' Changed.';
  const content = evidence.captures[0].fragments[0].text;
  Object.assign(manifest.captures[0].fragments[0],{sha256:hash(content),utf8Bytes:Buffer.byteLength(content)});
  assert.equal(verifyGuidanceBindings(bank,manifest).length,1);
  const next = bindGuidanceSources(bank,manifest,evidence).bank.units[0];
  assert.notEqual(next.sourceFingerprint,old);
  assert.equal(next.status,'draft');
  for(const key of ['technicalStatus','regionalStatus','translationStatus']) assert.equal(next.review[key],'pending');
  assert.equal(next.review.reviewer,null);
  assert.equal(next.review.contentHash,undefined);
});

test('unchanged content re-fetched on a different date preserves the review', () => {
  const {bank,manifest,evidence} = approvedFixture();
  manifest.captures[0].retrievedOn='2026-02-02';
  assert.deepEqual(bindGuidanceSources(bank,manifest,evidence).bank,bank);
});

test('loss of either a primary or supporting citation clears stale approvals', () => {
  for(const index of [0,1]) {
    const {bank,manifest,evidence} = approvedFixture();
    manifest.captures.splice(index,1); evidence.captures.splice(index,1);
    const result = bindGuidanceSources(bank,manifest,evidence);
    assert.equal(result.bank.units[0].sourceFingerprint,null);
    assert.equal(result.bank.units[0].status,'draft');
    assert.equal(result.report[0].missing.length,1);
    assert.ok(verifyGuidanceBindings(bank,manifest).length);
  }
});

test('a matching URL without the cited section is incomplete', () => {
  const {bank,manifest,evidence} = approvedFixture();
  manifest.captures[0].coveredSections=['Unrelated heading'];
  const result = bindGuidanceSources(bank,manifest,evidence);
  assert.equal(result.report[0].missing[0].reason,'section-not-captured');
  assert.equal(result.bank.units[0].sourceFingerprint,null);
});

test('metadata cannot replace missing, altered or mismatched retrieved content', () => {
  for(const mutate of [
    e => { e.captures[0].fragments[0].text += 'tampered'; },
    e => { e.captures[0].fragments[0].selector = 'wrong'; },
    e => { e.captures.shift(); },
    e => { e.captures[0].url = 'https://example.com/wrong'; },
    e => { e.captures.push(structuredClone(e.captures[0])); },
  ]) {
    const {manifest,evidence} = fixture(); mutate(evidence);
    assert.throws(()=>verifyGuidanceEvidence(manifest,evidence),/mismatch|Missing|Duplicate/);
  }
});

test('ambiguous captures and empty manifests cannot create an approved binding', () => {
  const {bank,manifest,evidence} = approvedFixture();
  manifest.captures.push(structuredClone(manifest.captures[0]));
  assert.throws(()=>bindGuidanceSources(bank,manifest,evidence),/Duplicate/);
  const empty = {schemaVersion:1,captures:[]};
  assert.equal(bindGuidanceSources(bank,empty,empty).bank.units[0].sourceFingerprint,null);
});

test('edition, scope, cited section and supporting-reference role are fingerprinted', () => {
  for(const mutate of [
    (b,m) => { m.captures[0].edition += 'revised'; },
    (b,m) => { m.captures[0].scopeLimit += 'revised'; },
    b => { b.units[0].sourceCheck.supportingReferences[0].role = 'Changed meaning'; },
  ]) {
    const {bank,manifest} = approvedFixture();
    const old=bank.units[0].sourceFingerprint; mutate(bank,manifest);
    assert.notEqual(guidanceSourceState(bank.units[0],manifest).sourceFingerprint,old);
  }
});

test('retired guidance stays retired and case units are untouched', () => {
  const {bank,manifest,evidence} = fixture();
  bank.units[0].status='retired';
  bank.units.push({id:'case',sourceType:'case',status:'draft'});
  const result=bindGuidanceSources(bank,manifest,evidence);
  assert.equal(result.bank.units[0].status,'retired');
  assert.deepEqual(result.bank.units[1],bank.units[1]);
});

test('checked-in captures bind nineteen drafts while incomplete Canadian sources stay unbound', () => {
  const read=name=>JSON.parse(fs.readFileSync(new URL(`../data/recommendation-knowledge/${name}`,import.meta.url),'utf8'));
  const manifest=read('guidance-source-captures.json');
  const bank={schemaVersion:1,units:[...read('regional-drafts.json').units,...read('pressure-welding-drafts.json').units]};
  assert.equal(bank.units.length,57);
  assert.equal(bank.units.filter(u=>u.sourceFingerprint).length,19);
  const romanian=bank.units.filter(u=>u.locale==='ro-RO');
  assert.equal(romanian.length,3);
  assert.ok(romanian.every(u=>u.sourceFingerprint && u.status==='draft'));
  const canadian=bank.units.filter(u=>u.jurisdiction.startsWith('CA'));
  assert.equal(canadian.length,15);
  assert.equal(canadian.filter(u=>u.sourceFingerprint).length,10);
  for(const id of ['regional-ca-on-maintenance','regional-ca-on-pressure-filter','regional-ca-on-welding-fume','regional-ca-qc-maintenance','regional-ca-qc-pressure-filter']) {
    assert.equal(bank.units.find(u=>u.id===id).sourceFingerprint,null,id);
  }
  assert.deepEqual(verifyGuidanceBindings(bank,manifest),[]);
  assert.deepEqual(validateKnowledgeBank(bank),[]);
  assert.equal(validateKnowledgeBank(bank,{forPublication:true}).length,57);
});
