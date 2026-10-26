export const REPOSITORY = 'hanghanghu716-dotcom/smart-jsa-bridge';
export const WORKFLOW = REPOSITORY + '/.github/workflows/jsa-thumbnails.yml@refs/heads/main';
export const AUDIENCE = 'smartjsabridge:public-risk-thumbnails';
export function allowedWorkflow(claims) {
  return claims.repository === REPOSITORY && claims.repository_owner_id === '259208646'
    && claims.ref === 'refs/heads/main' && claims.workflow_ref === WORKFLOW
    && ['push', 'schedule', 'workflow_dispatch'].includes(claims.event_name);
}
export function objectPath(id, revision) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id || '')
    && /^[0-9a-f]{32}$/.test(revision || '') ? id + '/' + revision + '/risk-v1.webp' : null;
}
export function webpSize(bytes) {
  if (bytes.length < 30 || bytes.length > 204800) return null;
  const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (text(0, 4) !== 'RIFF' || text(8, 12) !== 'WEBP' || view.getUint32(4, true) !== bytes.length - 8) return null;
  const kind = text(12, 16);
  let width, height;
  if (kind === 'VP8 ' && text(23, 26) === '\x9d\x01\x2a') {
    width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
  } else if (kind === 'VP8X' && !(bytes[20] & 2)) {
    width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
  } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
    const bits = view.getUint32(21, true); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
  }
  return width === 720 && height >= 300 && height <= 1200 ? { width, height } : null;
}
