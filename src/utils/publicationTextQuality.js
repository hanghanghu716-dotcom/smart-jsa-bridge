// Presentation warnings only: author text is never rewritten or blocked.
export function publicationTextWarnings({ title, analysisData = [], context = {} } = {}) {
  const fields = [{ field: 'title', text: title }];
  for (const [stepIndex, step] of (Array.isArray(analysisData) ? analysisData : []).entries()) {
    for (const key of ['stepTitle', 'stepDetail']) fields.push({ field: key, text: step?.proc?.[key], step: stepIndex + 1 });
    for (const [riskIndex, risk] of (Array.isArray(step?.risks) ? step.risks : []).entries()) {
      for (const key of ['factor', 'risk_factor', 'measure', 'current_measure', 'recommend_measure']) {
        fields.push({ field: key, text: risk?.[key], step: stepIndex + 1, risk: riskIndex + 1 });
      }
    }
  }
  for (const key of ['scope', 'region', 'limitations', 'sources']) fields.push({ field: key, text: context?.[key] });
  return fields.flatMap(field => {
    if (typeof field.text !== 'string') return [];
    // Detect a replacement character or isolated Korean keyboard characters
    // attached to a Latin word. Korean sentences and intentional mixed-language
    // terminology are allowed, including Korean text inside an English document.
    const match = /\uFFFD|[\u3131-\u318e](?=[A-Za-z])|(?<=[A-Za-z])[\u3131-\u318e]/u.exec(field.text);
    if (!match) return [];
    const start = Math.max(0, match.index - 45), end = Math.min(field.text.length, match.index + 95);
    return [{ field: field.field, step: field.step, risk: field.risk,
      snippet: (start ? '…' : '') + field.text.slice(start, end) + (end < field.text.length ? '…' : '') }];
  });
}
