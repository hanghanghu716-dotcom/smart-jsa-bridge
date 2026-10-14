import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WORK_JURISDICTIONS } from '../src/utils/workJurisdiction.js';
import { validateKnowledgeBank, validateKnowledgeUnit } from './recommendation-knowledge.js';

export const PRIORITY_TASKS = ['machine-maintenance', 'pressure-equipment-opening', 'welding-exposure'];
export const KNOWLEDGE_BANKS = ['regional-drafts.json', 'pressure-welding-drafts.json', 'pilot.en-US.json'];
const primaryReads = new Set(['primary_page_or_document', 'relevant_primary_sections_read', 'primary_pdf_relevant_sections_read']);

// A language match is never evidence of regional applicability. National guidance
// and subnational guidance also remain separate from an exact jurisdiction match.
export function sourceRelationship(source, jurisdiction) {
  if (!primaryReads.has(source.retrieval) || ['index', 'lead'].includes(source.evidenceRole)) return 'unreadOrMetadata';
  if (!source.jurisdiction) return 'unspecified';
  if (source.jurisdiction === jurisdiction) return 'sameJurisdiction';
  if (jurisdiction.startsWith(`${source.jurisdiction}-`)) return 'nationalReference';
  if (source.jurisdiction.startsWith(`${jurisdiction}-`)) return 'subnationalReference';
  return 'foreignReference';
}

export function buildKnowledgeCoverage(banks) {
  const versions = new Set(), latest = new Map();
  for (const bank of banks) {
    const errors = validateKnowledgeBank(bank);
    if (errors.length) throw Error(`Invalid knowledge bank: ${JSON.stringify(errors)}`);
    for (const unit of bank.units) {
      const identity = JSON.stringify([unit.id, unit.locale, unit.jurisdiction]);
      const version = JSON.stringify([identity, unit.revision]);
      if (versions.has(version)) throw Error(`Duplicate unit revision across banks: ${unit.id}`);
      versions.add(version);
      if (!latest.has(identity) || latest.get(identity).revision < unit.revision) latest.set(identity, unit);
    }
  }
  // A retired latest version must not resurrect an older reviewed or draft version.
  const active = [...latest.values()].filter(unit => unit.status !== 'retired');
  const coverage = WORK_JURISDICTIONS.map(({ id: jurisdiction, locale }) => ({
    locale, jurisdiction,
    tasks: PRIORITY_TASKS.map(taskType => {
      const units = active.filter(unit => unit.locale === locale && unit.jurisdiction === jurisdiction && unit.applicability?.taskType === taskType);
      const evidence = Object.fromEntries(['sameJurisdiction', 'nationalReference', 'subnationalReference', 'foreignReference', 'unspecified', 'unreadOrMetadata'].map(key => [key, 0]));
      const guidance = units.filter(unit => unit.sourceType === 'guidance');
      for (const unit of guidance) for (const source of unit.sources) evidence[sourceRelationship(source, jurisdiction)]++;
      const publicationEligible = units.filter(unit => validateKnowledgeUnit(unit, { forPublication: true }).length === 0).length;
      return {
        taskType, units: units.length, draftUnits: units.filter(unit => unit.status === 'draft').length,
        publicationEligible, guidanceUnits: guidance.length, caseUnits: units.length - guidance.length,
        primarySourceReferences: evidence,
        missingDraft: units.length === 0,
        missingSameJurisdictionPrimaryReference: guidance.length > 0 && evidence.sameJurisdiction === 0,
        requiresLocalSourceReview: guidance.some(unit => unit.review?.regionalStatus !== 'approved'),
        needsContentReview: units.length - publicationEligible,
      };
    }),
  }));
  const cells = coverage.flatMap(row => row.tasks);
  return {
    schemaVersion: 1,
    inputHash: createHash('sha256').update(JSON.stringify(banks)).digest('hex'),
    scope: 'Authored knowledge-bank coverage only. Source geography is not legal applicability, review approval, production availability or measured recommendation accuracy.',
    totals: {
      locales: coverage.length, priorityCells: cells.length,
      cellsWithDraftOrReviewedContent: cells.filter(cell => cell.units > 0).length,
      missingCells: cells.filter(cell => cell.missingDraft).length,
      cellsWithPublicationEligibleContent: cells.filter(cell => cell.publicationEligible > 0).length,
      activeUnits: active.length,
      priorityUnits: cells.reduce((sum, cell) => sum + cell.units, 0),
      nonPriorityUnits: active.filter(unit => !PRIORITY_TASKS.includes(unit.applicability?.taskType)).length,
    },
    coverage,
  };
}

export async function readKnowledgeCoverage(root = fileURLToPath(new URL('..', import.meta.url))) {
  const banks = await Promise.all(KNOWLEDGE_BANKS.map(filename => fs.readFile(path.join(root, 'data/recommendation-knowledge', filename), 'utf8').then(JSON.parse)));
  return buildKnowledgeCoverage(banks);
}

async function main(args) {
  const report = await readKnowledgeCoverage();
  const filename = args.find(arg => !arg.startsWith('--'));
  if (args.includes('--check')) {
    if (!filename) throw Error('--check requires the committed report path');
    const stored = JSON.parse(await fs.readFile(filename, 'utf8'));
    if (JSON.stringify(stored) !== JSON.stringify(report)) throw Error('Coverage report is stale; regenerate it from the current knowledge banks.');
  } else if (filename) {
    await fs.writeFile(filename, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report.totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
