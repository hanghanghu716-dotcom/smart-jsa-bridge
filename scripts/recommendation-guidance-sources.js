import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0;
const https = value => {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }
  catch { return false; }
};
const pendingReview = () => ({ technicalStatus: 'pending', regionalStatus: 'pending', translationStatus: 'pending', reviewer: null, reviewedAt: null });

// Supporting references can carry material claims absent from the main source list.
// Keep both locations and exact section strings; URL alone is not evidence coverage.
export function guidanceCitations(unit) {
  return [
    ...(unit.sources || []).map(source => ({ location: 'sources', ...source })),
    ...(unit.sourceCheck?.supportingReferences || []).map(source => ({ location: 'sourceCheck.supportingReferences', ...source })),
  ];
}

export function validateGuidanceManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.captures)) throw Error('Guidance manifest schemaVersion 1 and captures required');
  const ids = new Set(), urls = new Set();
  for (const c of manifest.captures) {
    if (!text(c.id) || ids.has(c.id) || !https(c.url) || urls.has(c.url)) throw Error('Duplicate or invalid capture identity');
    ids.add(c.id); urls.add(c.url);
    if (c.representation !== 'web-extracted-text-v1' || c.coverage !== 'selected-sections'
      || !text(c.edition) || !text(c.scopeLimit) || !text(c.attribution)
      || !/^\d{4}-\d{2}-\d{2}$/.test(c.retrievedOn) || !Number.isFinite(Date.parse(c.retrievedOn))) throw Error(`Invalid capture metadata: ${c.id}`);
    if (!Array.isArray(c.coveredSections) || !c.coveredSections.length || !c.coveredSections.every(text)
      || new Set(c.coveredSections).size !== c.coveredSections.length) throw Error(`Explicit covered sections required: ${c.id}`);
    if (!Array.isArray(c.fragments) || !c.fragments.length) throw Error(`Capture fragments required: ${c.id}`);
    const selectors = new Set();
    for (const f of c.fragments) {
      if (!text(f.selector) || selectors.has(f.selector) || !/^[a-f0-9]{64}$/.test(f.sha256 || '')
        || !Number.isInteger(f.utf8Bytes) || f.utf8Bytes <= 0) throw Error(`Invalid capture fragment: ${c.id}`);
      selectors.add(f.selector);
    }
  }
  return manifest;
}

// Only hashes and provenance are committed; retrieved third-party text is an
// input to capture verification, not part of the recommendation or public bundle.
export function verifyGuidanceEvidence(manifest, evidence) {
  validateGuidanceManifest(manifest);
  if (evidence?.schemaVersion !== 1 || !Array.isArray(evidence.captures)) throw Error('Captured evidence required');
  const seen = new Set();
  for (const e of evidence.captures) {
    if (seen.has(e.id)) throw Error(`Duplicate evidence: ${e.id}`);
    seen.add(e.id);
  }
  for (const c of manifest.captures) {
    const e = evidence.captures.find(item => item.id === c.id);
    if (!e || e.url !== c.url || !Array.isArray(e.fragments) || e.fragments.length !== c.fragments.length) throw Error(`Missing or mismatched evidence: ${c.id}`);
    c.fragments.forEach((f, i) => {
      const actual = e.fragments[i];
      if (actual.selector !== f.selector || !text(actual.text) || hash(actual.text) !== f.sha256
        || Buffer.byteLength(actual.text, 'utf8') !== f.utf8Bytes) throw Error(`Capture content mismatch: ${c.id} / ${f.selector}`);
    });
  }
  return true;
}

export function guidanceSourceState(unit, manifest) {
  validateGuidanceManifest(manifest);
  const citations = guidanceCitations(unit), missing = [], bindings = [];
  if (!citations.length) missing.push({ reason: 'no-citations' });
  for (const citation of citations) {
    const capture = manifest.captures.find(item => item.url === citation.url);
    if (!https(citation.url) || !text(citation.section) || !capture || !capture.coveredSections.includes(citation.section)) {
      missing.push({ url: citation.url, section: citation.section, location: citation.location, reason: capture ? 'section-not-captured' : 'source-not-captured' });
      continue;
    }
    // Reading timestamps do not change the source content. Edition, scope,
    // citation meaning and selected representation do; all enter this hash.
    const { checkedAt, ...meaning } = citation;
    void checkedAt;
    bindings.push({ citation: meaning, capture: {
      id: capture.id, url: capture.url, edition: capture.edition,
      representation: capture.representation, coverage: capture.coverage,
      scopeLimit: capture.scopeLimit,
      fragments: capture.fragments.map(({ selector, sha256, utf8Bytes }) => ({ selector, sha256, utf8Bytes })),
    } });
  }
  return { sourceFingerprint: missing.length ? null : hash(JSON.stringify({ schemaVersion: 1, bindings })), missing };
}

export function bindGuidanceSources(bank, manifest, evidence) {
  verifyGuidanceEvidence(manifest, evidence);
  const report = [];
  const units = bank.units.map(unit => {
    if (unit.sourceType !== 'guidance') return unit;
    const { sourceFingerprint, missing } = guidanceSourceState(unit, manifest);
    report.push({ id: unit.id, state: missing.length ? 'incomplete' : 'captured-sections-bound', sourceFingerprint, missing });
    if (sourceFingerprint && sourceFingerprint === unit.sourceFingerprint) return unit;
    // Losing a previously captured reference invalidates review just as a change
    // does. Retired content must never be revived by evidence collection.
    return { ...unit, sourceFingerprint, status: unit.status === 'retired' ? 'retired' : 'draft', review: pendingReview() };
  });
  return { bank: { ...bank, units }, report };
}

export function verifyGuidanceBindings(bank, manifest) {
  return bank.units.filter(unit => unit.sourceType === 'guidance').flatMap(unit => {
    const state = guidanceSourceState(unit, manifest);
    const failures = [];
    if ((unit.sourceFingerprint ?? null) !== state.sourceFingerprint) failures.push('source fingerprint differs from captured evidence');
    if (state.missing.length && (unit.status === 'reviewed' || ['technicalStatus', 'regionalStatus', 'translationStatus'].some(key => unit.review?.[key] === 'approved'))) failures.push('incomplete source evidence retains approval');
    return failures.map(error => ({ id: unit.id, error }));
  });
}

async function main(args) {
  const [command, bankFile, manifestFile, evidenceFile, outputFile] = args;
  if (!['--check', '--bind'].includes(command) || !bankFile || !manifestFile || (command === '--bind' && (!evidenceFile || !outputFile))) {
    throw Error('Usage: recommendation-guidance-sources.js --check bank.json manifest.json | --bind bank.json manifest.json evidence.json output.json');
  }
  const bank = JSON.parse(await fs.readFile(bankFile, 'utf8'));
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
  if (command === '--check') {
    const failures = verifyGuidanceBindings(bank, manifest);
    console.log(JSON.stringify({ failures }, null, 2));
    if (failures.length) process.exitCode = 1;
    return;
  }
  if (path.resolve(outputFile) === path.resolve(bankFile)) throw Error('Use a separate output file for review before replacing a bank');
  const evidence = JSON.parse(await fs.readFile(evidenceFile, 'utf8'));
  const result = bindGuidanceSources(bank, manifest, evidence);
  await fs.writeFile(outputFile, JSON.stringify(result.bank, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(result.report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
