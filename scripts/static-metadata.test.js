import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyStaticMetadata } from './static-metadata.js';

const html = '<html><head><title>Public guide</title><meta content="Summary (>150°C)" name="description"><meta content="index,follow" name="robots"><link href="https://smartjsabridge.com/en-US" rel="canonical"></head><body>Guide</body></html>';
test('static metadata accepts a single canonical shared by slash and non-slash home URLs', () => {
  for (const route of ['/', '/en-US', '/en-US/']) assert.equal(verifyStaticMetadata(html, route), true);
});
test('duplicate canonical is rejected even when both URLs agree, as in the live home snapshot', () => {
  assert.throws(() => verifyStaticMetadata(html.replace('</head>', '<link rel="canonical" href="https://smartjsabridge.com/en-US"></head>'), '/en-US'), /duplicated/);
});
test('a home snapshot cannot pass as a translated guide', () => {
  assert.throws(() => verifyStaticMetadata(html, '/ko/guideline/manufacturing'), /mismatched/);
});
test('missing or duplicated metadata and accidental noindex fail before deployment', () => {
  assert.throws(() => verifyStaticMetadata(html.replace('<title>Public guide</title>', ''), '/'), /title/);
  assert.throws(() => verifyStaticMetadata(html.replace('</head>', '<meta name="description" content="stale"></head>'), '/'), /description/);
  assert.throws(() => verifyStaticMetadata(html.replace('index,follow', 'noindex,follow'), '/'), /noindex/);
});
