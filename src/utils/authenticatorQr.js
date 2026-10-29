// Keep SVG markup inside an image URL, including characters such as # in colors.
// Supabase auth-js may return an SVG data URL with unescaped markup.
export function authenticatorQrSource(value) {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (raw.startsWith('<svg') || raw.startsWith('<?xml')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`;
  }
  if (/^data:image\/svg\+xml[;,]/i.test(raw)) {
    const comma = raw.indexOf(',');
    if (comma < 0) return '';
    const payload = raw.slice(comma + 1);
    if (payload.trimStart().startsWith('<')) {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(payload)}`;
    }
    return raw;
  }
  return /^data:image\/png;base64,/i.test(raw) ? raw : '';
}
