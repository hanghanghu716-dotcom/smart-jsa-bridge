import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { createServer } from 'vite';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('US fixed guidance stays on exact US routes and covers the existing page keys', async () => {
  const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, entries: [] }, server: { middlewareMode: true, hmr: false } });
  try {
    const { usFixedGuidance, fixedGuidanceText } = await server.ssrLoadModule('/src/utils/usFixedGuidance.js');
    const leaves = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === 'string' ? [path] : leaves(child, path);
    });
    for (const namespace of ['about', 'regulation', 'jrajsa']) {
      const original = JSON.parse(fs.readFileSync(`src/locales/en-US/${namespace}.json`, 'utf8'));
      const guidance = usFixedGuidance(`/en-US/${namespace}`, namespace);
      assert.ok(guidance.title && guidance.description);
      for (const key of leaves(original)) assert.equal(typeof fixedGuidanceText(guidance, key), 'string', `${namespace}:${key}`);
      for (const locale of SUPPORTED_LANGS.filter(locale => locale !== 'en-US')) {
        assert.equal(usFixedGuidance(`/${locale}/${namespace}`, namespace), null, locale);
      }
      for (const path of ['/en-USA/about', '/en-US-other/about', '/en/about', '/about']) assert.equal(usFixedGuidance(path, namespace), null);
      for (const source of guidance.links) assert.equal(new URL(source.href).hostname, 'www.osha.gov');
    }
    assert.equal(usFixedGuidance('/en-US/explore', 'explore'), null);
    assert.equal(fixedGuidanceText(null, 'hero.title'), undefined);
  } finally {
    await server.close();
  }
});
