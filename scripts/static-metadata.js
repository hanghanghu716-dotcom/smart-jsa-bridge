const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
  .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));

// Fail before deployment if a captured home page leaked metadata into another route.
export function verifyStaticMetadata(html, route) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const tags = [...head.matchAll(/<(?:meta|link)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
    .map(match => attributes(match[0]));
  const canonical = tags.filter(tag => tag.rel === 'canonical');
  const expected = 'https://smartjsabridge.com' + (route === '/' ? '/en-US' : route.replace(/\/$/, ''));
  if (canonical.length !== 1 || canonical[0].href !== expected) {
    throw new Error(`Missing, duplicated or mismatched static canonical: ${route}`);
  }
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || !titles[0][1].trim()) throw new Error(`Invalid static title: ${route}`);
  for (const name of ['description', 'robots']) {
    const values = tags.filter(tag => tag.name === name);
    if (values.length !== 1 || !values[0].content?.trim()) throw new Error(`Invalid static ${name}: ${route}`);
    if (name === 'robots' && /\bnoindex\b/i.test(values[0].content)) throw new Error(`Public static page is noindex: ${route}`);
  }
  return true;
}
