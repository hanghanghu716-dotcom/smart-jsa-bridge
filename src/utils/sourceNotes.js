export function sourceNoteParts(value = '') {
  const text = String(value).replace(/\\n/g, '\n');
  return text.split(/(https?:\/\/[^\s<>"']+)/g).filter(Boolean).flatMap(part => {
    if (!/^https?:\/\//.test(part)) return [{ text: part }];
    const url = part.replace(/[.,;。)\]]+$/, '');
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) return [{ text: part }];
      return [{ text: url, href: url }, ...(part.length > url.length ? [{ text: part.slice(url.length) }] : [])];
    } catch { return [{ text: part }]; }
  });
}
