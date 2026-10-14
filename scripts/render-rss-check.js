import { mkdir, writeFile } from 'node:fs/promises';
import { createContentFeedHandler } from '../api/content-feed.js';

// Generate candidate feeds from public data, without deploying or changing data.
await mkdir('.cache', { recursive: true });
for (const locale of ['ko', 'en-US']) {
  const response = { setHeader() {}, end(body) { this.body = body; } };
  await createContentFeedHandler()({ query: { kind: 'rss', lng: locale }, headers: {} }, response);
  if (response.statusCode !== 200) throw new Error(`RSS candidate failed: ${locale} ${response.statusCode}`);
  await writeFile(`.cache/rss-${locale}.xml`, response.body);
}
