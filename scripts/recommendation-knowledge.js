import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { contentFingerprint } from './case-build-data.js';

const requiredText = ['id', 'jurisdiction', 'task', 'step', 'hazard', 'cause', 'consequence', 'control', 'verification', 'sourceRevision'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

export function validateKnowledgeUnit(unit, { forPublication = false } = {}) {
  const errors = [];
  for (const field of requiredText) if (!nonempty(unit?.[field])) errors.push(`${field}: required`);
  if (unit?.sourceType === 'guidance') {
    if (!nonempty(unit.sourceGroupId) || unit.caseGroupId != null) errors.push('guidance: sourceGroupId required; must not invent a caseGroupId');
  } else if (!nonempty(unit?.caseGroupId)) errors.push('caseGroupId: required');
  if (!SUPPORTED_LANGS.includes(unit?.locale)) errors.push('locale: unsupported');
  if (!WORK_JURISDICTIONS.some(item => item.id === unit?.jurisdiction)) errors.push('jurisdiction: unsupported');
  if (!Number.isInteger(unit?.revision) || unit.revision < 1) errors.push('revision: positive integer required');
  if (!['draft', 'reviewed', 'retired'].includes(unit?.status)) errors.push('status: invalid');
  for (const field of ['conditions', 'exclusions', 'keywords']) {
    if (!Array.isArray(unit?.[field]) || !unit[field].length || !unit[field].every(nonempty)) errors.push(`${field}: nonempty string array required`);
  }
  if (!Array.isArray(unit?.sources) || !unit.sources.length) errors.push('sources: required');
  else for (const source of unit.sources) {
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password || !nonempty(source.section)) errors.push('source: HTTPS URL and section required');
    } catch { errors.push('source: invalid URL'); }
  }
  if (unit?.recommendationScore != null) errors.push('recommendationScore: keep separate from content review; do not invent a percentage during extraction');
  if (forPublication || unit?.status === 'reviewed') {
    if (unit?.status !== 'reviewed') errors.push('publication: reviewed status required');
    if (unit?.review?.technicalStatus !== 'approved' || !nonempty(unit.review.reviewer) || !/^\d{4}-\d{2}-\d{2}$/.test(unit.review.reviewedAt || '')) errors.push('publication: recorded technical review required');
    if (!/^[a-f0-9]{64}$/.test(unit?.sourceFingerprint || '')) errors.push('publication: source revision fingerprint required');
    if (unit?.review?.contentHash !== knowledgeContentHash(unit)) errors.push('publication: review does not cover this content revision');
    if (unit.review?.regionalStatus !== 'approved' || unit.review?.translationStatus !== 'approved') errors.push('publication: regional and translation review required');
  }
  return errors;
}

export function knowledgeContentHash(unit) {
  // Review records and IDs cannot conceal changes to the actual recommendation or applicability.
  const content = Object.fromEntries(Object.entries(unit).filter(([key]) => !['review', 'status'].includes(key)));
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export function bindKnowledgeSources(bank, caseRows) {
  return { ...bank, units: bank.units.map(unit => {
    if (unit.sourceType === 'guidance') return unit;
    const matches = caseRows.filter(row => row.post_group_id === unit.caseGroupId && row.language_code === unit.locale);
    if (matches.length !== 1) throw Error(`Expected one exact source for ${unit.id}; found ${matches.length}.`);
    const sourceFingerprint = contentFingerprint(matches[0]);
    if (sourceFingerprint === unit.sourceFingerprint) return unit;
    return { ...unit, sourceFingerprint, status: 'draft', review: { technicalStatus: 'pending', reviewer: null, reviewedAt: null } };
  }) };
}

export function validateKnowledgeBank(bank, options = {}) {
  if (bank?.schemaVersion !== 1 || !Array.isArray(bank.units)) return [{ id: null, errors: ['schemaVersion 1 and units array required'] }];
  const seen = new Set(), results = [];
  for (const unit of bank.units) {
    const key = JSON.stringify([unit.id, unit.locale, unit.jurisdiction, unit.revision]);
    const errors = validateKnowledgeUnit(unit, options);
    if (seen.has(key)) errors.push('duplicate unit and revision');
    seen.add(key);
    if (errors.length) results.push({ id: unit.id, errors });
  }
  return results;
}

async function main(args) {
  const filename = args.find(arg => !arg.startsWith('--'));
  if (!filename) throw Error('Usage: node scripts/recommendation-knowledge.js bank.json [--for-publication]');
  const bank = JSON.parse(await fs.readFile(filename, 'utf8'));
  const failures = validateKnowledgeBank(bank, { forPublication: args.includes('--for-publication') });
  console.log(JSON.stringify({ units: bank.units?.length || 0, publicationCheck: args.includes('--for-publication'), failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
