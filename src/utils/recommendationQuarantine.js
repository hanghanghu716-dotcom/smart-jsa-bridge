// Observed public-DB examples held for contextual review, not a blanket score threshold.
// These pairs require reviewed task/hazard evidence before they can be reinstated.
export const LEGACY_QUARANTINE_VERSION = 'public-audit-2026-10-14-v1';
const held = new Set([
  'current:ru-RU:4129:8286', 'current:ru-RU:4129:8986', 'current:ru-RU:4129:9284',
  'advanced:ru-RU:8156:18318', 'advanced:ru-RU:8156:19014', 'advanced:ru-RU:8156:19657',
]);
export const isQuarantinedMapping = (type, locale, source, target) => held.has(`${type}:${locale}:${source}:${target}`);
