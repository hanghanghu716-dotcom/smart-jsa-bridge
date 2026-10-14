import { createHash } from 'node:crypto';
import { validateKnowledgeBank, knowledgeContentHash } from './recommendation-knowledge.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { contentFingerprint } from './case-build-data.js';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const mappingContentHash = mapping => createHash('sha256').update(JSON.stringify(canonical(Object.fromEntries(Object.entries(mapping).filter(([key]) => key !== 'review'))))).digest('hex');

// Pure build step: callers store the result in a separate release. Never writes to a database.
export function compileRecommendationRelease(bank, mappings, { releaseId, sourceFingerprints } = {}) {
  const errors = validateKnowledgeBank(bank, { forPublication: true });
  if (errors.length) throw Error(`Unreviewed or invalid knowledge: ${errors.map(x => x.id).join(', ')}`);
  if (!releaseId || !Array.isArray(mappings) || !sourceFingerprints) throw Error('Release ID, mappings and current source fingerprints required');
  const byId = new Map(bank.units.map(unit => [unit.id, unit]));
  if (byId.size !== bank.units.length) throw Error('Release unit IDs must be unique across locales and revisions');
  const seen = new Set(), conditionLabels = new Map();
  const candidates = mappings.map(mapping => {
    const unit = byId.get(mapping.unitId), score = mapping.score;
    if (!unit || sourceFingerprints[unit.id] !== unit.sourceFingerprint) throw Error('Missing or changed source revision');
    const scope = unit.applicability;
    if (!scope || !['taskType', 'hazardType', 'targetType'].every(key => typeof scope[key] === 'string' && scope[key]) || !Array.isArray(scope.conditionsRequired) || !scope.conditionsRequired.length || !Array.isArray(scope.excludedConditions)) throw Error('Reviewed applicability required');
    if (unit.caseGroupId && [...scope.conditionsRequired, ...scope.excludedConditions].some(key => typeof unit.conditionLabels?.[key] !== 'string' || !unit.conditionLabels[key].trim())) throw Error('Localized condition labels required for case selection');
    if (unit.caseGroupId) for (const condition of [...scope.conditionsRequired, ...scope.excludedConditions]) {
      const labelKey = JSON.stringify([unit.caseGroupId, unit.locale, unit.jurisdiction, condition]);
      if (conditionLabels.has(labelKey) && conditionLabels.get(labelKey) !== unit.conditionLabels[condition]) throw Error('Conflicting case condition labels');
      conditionLabels.set(labelKey, unit.conditionLabels[condition]);
    }
    if (!['current', 'advanced'].includes(mapping.kind) || (mapping.kind === 'advanced' && !mapping.currentControlId)) throw Error('Explicit control chain required');
    if (score?.kind !== 'text_similarity' || !Number.isFinite(score.value) || score.value < 0 || score.value > 1 || score.locale !== unit.locale || !score.model || !score.modelVersion || !score.generatedAt) throw Error('Score provenance required; similarity is not probability');
    if (mapping.review?.status !== 'approved' || !mapping.review.reviewer || !mapping.review.reviewedAt || mapping.review.contentHash !== knowledgeContentHash(unit) || mapping.review.mappingHash !== mappingContentHash(mapping)) throw Error('Reviewed mapping required');
    if (mapping.kind === 'advanced') {
      const current = byId.get(mapping.currentControlId);
      if (!current || current.locale !== unit.locale || current.jurisdiction !== unit.jurisdiction || ['taskType', 'hazardType', 'targetType'].some(key => current.applicability?.[key] !== scope[key])
        || !mappings.some(item => item.unitId === current.id && item.kind === 'current')
        || (unit.caseGroupId && (current.caseGroupId !== unit.caseGroupId || current.sourceFingerprint !== unit.sourceFingerprint
          || current.task !== unit.task || current.step !== unit.step || current.hazard !== unit.hazard))) throw Error('Control chain has incompatible context');
    }
    const key = JSON.stringify([unit.id, mapping.kind, mapping.currentControlId || null]);
    if (seen.has(key)) throw Error('Duplicate mapping');
    seen.add(key);
    return { ...unit, kind: mapping.kind, currentControlId: mapping.currentControlId || null, score, mappingReview: mapping.review };
  });
  const contentHash = createHash('sha256').update(JSON.stringify(candidates)).digest('hex');
  return { schemaVersion: 1, releaseId, contentHash, candidates };
}

// Revalidate the checked-in release at build/test time, including every approval hash.
export function verifyRecommendationRelease(manifest) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.candidates)) throw Error('Invalid release');
  const units = manifest.candidates.map(item => Object.fromEntries(Object.entries(item)
    .filter(([key]) => !['kind', 'currentControlId', 'score', 'mappingReview'].includes(key))));
  const unique = new Map();
  for (const unit of units) {
    if (unique.has(unit.id) && JSON.stringify(unique.get(unit.id)) !== JSON.stringify(unit)) throw Error('Conflicting released unit');
    unique.set(unit.id, unit);
  }
  const mappings = manifest.candidates.map(item => ({ unitId: item.id, kind: item.kind,
    ...(item.currentControlId ? { currentControlId: item.currentControlId } : {}), score: item.score, review: item.mappingReview }));
  const compiled = compileRecommendationRelease({ schemaVersion: 1, units: [...unique.values()] }, mappings,
    { releaseId: manifest.releaseId, sourceFingerprints: Object.fromEntries(units.map(unit => [unit.id, unit.sourceFingerprint])) });
  if (compiled.contentHash !== manifest.contentHash) throw Error('Release content hash mismatch');
  return true;
}

async function main(args) {
  if (args[0] === '--verify' && args[1]) {
    verifyRecommendationRelease(JSON.parse(await fs.readFile(args[1], 'utf8')));
    console.log('Recommendation release verified'); return;
  }
  const [bankFile, mappingFile, caseSnapshotFile, releaseId, output] = args;
  if (!output) throw Error('Usage: node scripts/recommendation-release.js bank.json mappings.json current-case-rows.json release-id output.json');
  const [bank, mappings, rows] = await Promise.all([bankFile, mappingFile, caseSnapshotFile].map(async file => JSON.parse(await fs.readFile(file, 'utf8'))));
  const sourceFingerprints = Object.fromEntries(bank.units.map(unit => {
    const matches = rows.filter(row => row.post_group_id === unit.caseGroupId && row.language_code === unit.locale);
    if (unit.sourceType === 'guidance' || matches.length !== 1) throw Error('This case release requires one exact current case source per unit');
    return [unit.id, contentFingerprint(matches[0])];
  }));
  const release = compileRecommendationRelease(bank, mappings, { releaseId, sourceFingerprints });
  verifyRecommendationRelease(release);
  // Refuse to overwrite an existing release; promotion is a separate reviewed code change.
  await fs.writeFile(output, `${JSON.stringify(release, null, 2)}\n`, { flag: 'wx' });
  console.log(`Compiled ${release.candidates.length} reviewed recommendations`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
