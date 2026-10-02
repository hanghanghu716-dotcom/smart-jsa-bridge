export const DEFAULT_BLOCKS = ['PROJECT_INFO', 'SAFETY', 'PARTICIPANTS', 'JSA_TABLE', 'NOTES'].map(id => ({ id, enabled: id !== 'NOTES' }));

// Keep the earliest former header position, and retain the header if either
// legacy block was visible. Other blocks and the caller's data are unchanged.
export function normalizeDocumentBlocks(blocks) {
  if (!Array.isArray(blocks)) return DEFAULT_BLOCKS.map(block => ({ ...block }));
  const headerBlocks = blocks.filter(block => ['PROJECT_INFO', 'APPROVAL'].includes(block.id));
  let addedHeader = false;
  return blocks.flatMap(block => {
    if (!['PROJECT_INFO', 'APPROVAL'].includes(block.id)) return [{ ...block }];
    if (addedHeader) return [];
    addedHeader = true;
    return [{ id: 'PROJECT_INFO', enabled: headerBlocks.some(item => item.enabled) }];
  });
}

export function defaultColumns(jsaType) {
  return ['DATA_STEP_NO', 'DATA_STEP_TITLE', 'DATA_HAZARD',
    ...(jsaType === '3-step' ? ['DATA_CURRENT_MEASURE'] : []),
    'DATA_RECOMMEND_MEASURE', 'DATA_FREQUENCY', 'DATA_SEVERITY', 'DATA_RISK'];
}

export function moveItem(items, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

// Widths are relative weights, including formerly flexible columns. They
// always sum to 100%, even when the user chooses many wide columns.
export function columnPercentages(columns) {
  const widths = columns.map(meta => Math.max(1, Math.min(24, Number(meta?.width) || (meta?.isFlex ? 10 : 5))));
  const sum = widths.reduce((a, b) => a + b, 0);
  return widths.map(width => width / sum * 100);
}

export function templateLayout(data = {}, defaults = {}) {
  return {
    ...defaults,
    documentBlocks: normalizeDocumentBlocks(data.documentBlocks),
    savedActiveOrder: data.savedActiveOrder ?? data.activeOrder ?? defaults.savedActiveOrder ?? defaultColumns(),
    savedUserColumns: data.savedUserColumns ?? data.userColumns ?? [],
    savedColumnOverrides: data.savedColumnOverrides ?? {},
    savedOrientation: data.savedOrientation ?? data.orientation ?? 'landscape',
    savedSignatureRows: data.savedSignatureRows ?? data.signatureRows ?? defaults.savedSignatureRows ?? 1,
    docTitle: data.docTitle ?? defaults.docTitle ?? '',
    appr1: data.appr1 ?? defaults.appr1 ?? '', appr2: data.appr2 ?? defaults.appr2 ?? '', appr3: data.appr3 ?? defaults.appr3 ?? '',
    documentNotes: data.documentNotes ?? '',
  };
}

export function pickDocumentLayout(state = {}, fallback = {}) {
  state = state || {};
  fallback = fallback || {};
  const keys = ['documentBlocks', 'savedActiveOrder', 'savedUserColumns', 'savedColumnOverrides', 'savedOrientation', 'savedSignatureRows', 'docTitle', 'appr1', 'appr2', 'appr3', 'documentNotes', 'isModuleSkipped', 'stepPhotos', 'projectSaveContext'];
  return Object.fromEntries(keys.filter(key => state[key] !== undefined || fallback[key] !== undefined)
    .map(key => [key, state[key] !== undefined ? state[key] : fallback[key]]));
}
