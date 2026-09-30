const text = value => typeof value === 'string' ? value : '';
const normalized = value => text(value).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const risksOf = step => Array.isArray(step?.risks) ? step.risks.filter(Boolean) : [];

export function matchesKnowledge(value, query) {
  const needle = normalized(query);
  const values = Array.isArray(value) ? value : [value];
  return !needle || normalized(values.filter(Boolean).join(' ')).includes(needle);
}

export function stepSearchValues(step) {
  return [step?.proc?.stepTitle, step?.proc?.stepDetail,
    ...risksOf(step).flatMap(risk => [risk.factor, risk.risk_factor, risk.measure, risk.current_measure, risk.recommend_measure])];
}

export function matchingProjectSteps(project, query) {
  const all = Array.isArray(project?.analysis_data) ? project.analysis_data : [];
  const projectMatches = matchesKnowledge([project?.title, ...(project?.tags || [])], query);
  return all.map((step, index) => ({ step, index }))
    .filter(({ step }) => step && (projectMatches || matchesKnowledge(stepSearchValues(step), query)));
}

// Import hazards without replacing the target step's locally assessed risk score.
export function mergeKnowledgeRisks(target, source, { mode = 'full', jsaType = '2-step', sourceMeta = {}, category = '', makeId = () => crypto.randomUUID() } = {}) {
  const incoming = risksOf(source);
  const existing = risksOf(target);
  const seen = new Set(existing.map(risk => normalized(risk.factor || risk.risk_factor)).filter(Boolean));
  const added = [];
  for (const risk of incoming) {
    const factor = text(risk.factor || risk.risk_factor).trim();
    const key = normalized(factor);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const full = mode === 'full';
    // Preserve both three-step controls when importing into a two-step document.
    const twoStep = text(risk.measure) || [...new Set([text(risk.current_measure), text(risk.recommend_measure)].filter(Boolean))].join('\n');
    added.push({
      id: makeId(), db_id: risk.db_id, factor,
      measure: full && jsaType === '2-step' ? twoStep : '',
      current_measure: full && jsaType === '3-step' ? text(risk.current_measure || risk.measure) : '',
      recommend_measure: full && jsaType === '3-step' ? text(risk.recommend_measure) : '',
      current_measure_db_id: full ? risk.current_measure_db_id : undefined,
      advanced_measure_db_id: full && jsaType === '3-step' ? risk.advanced_measure_db_id : undefined,
      category: risk.category || category,
      source: sourceMeta.type || 'library', sourceLabel: sourceMeta.label || '',
      sourceWorkStepId: sourceMeta.workStepId || null,
      sourceProjectId: sourceMeta.projectId || null,
      sourceStepIndex: Number.isInteger(sourceMeta.stepIndex) ? sourceMeta.stepIndex : null,
      sourceRiskId: risk.id || null,
    });
  }
  return { step: { ...target, risks: [...existing, ...added] }, added: added.length, skipped: incoming.length - added.length };
}
