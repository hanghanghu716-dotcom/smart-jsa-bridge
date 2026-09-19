/* global global */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { createServer } from 'vite';
import vm from 'node:vm';
import {
  CANADIAN_PROVINCES, LANGUAGE_OPTIONS, SUPPORTED_LANGS, SEO_LANGUAGES,
  getLanguageTag, getDataLocale, detectLanguage, hasLanguagePrefix,
  getCaseLanguages, selectLocalizedCases, normalizeLocale, getSeoLocale, getTranslationFallbacks,
} from '../src/locales/config.js';

test('province routes, browser detection and standards-based formatting', () => {
  assert.equal(LANGUAGE_OPTIONS.length, 16);
  assert.equal(detectLanguage('en-CA'), 'en-CA');
  assert.equal(detectLanguage('en-ca'), 'en-CA');
  assert.equal(detectLanguage('ko-KR'), 'ko');
  assert.equal(detectLanguage('xx'), 'en-US');
  assert.equal(detectLanguage('fr-CA'), 'fr-CA-QC');
  assert.equal(detectLanguage('fr-ca'), 'fr-CA-QC');
  assert.equal(detectLanguage('fr'), 'fr-FR');
  assert.equal(detectLanguage('fr-FR'), 'fr-FR');
  assert.equal(normalizeLocale('en-CA-QC'), 'fr-CA-QC');
  assert.ok(hasLanguagePrefix('/en-CA-QC/analysis'));
  assert.ok(!SUPPORTED_LANGS.includes('en-CA-QC'));
  assert.deepEqual(getTranslationFallbacks('fr-CA-QC'), ['fr-FR']);
  const { reactSnap } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
  for (const { code } of CANADIAN_PROVINCES) {
    assert.ok(SUPPORTED_LANGS.includes(code));
    assert.ok(reactSnap.include.includes(`/${code}/`));
    assert.ok(hasLanguagePrefix(`/${code}/analysis`));
    assert.ok(!hasLanguagePrefix(`/${code}-unknown/analysis`));
    assert.equal(getDataLocale(code), code === 'fr-CA-QC' ? 'fr-FR' : 'en-CA');
    assert.equal(getLanguageTag(code), code === 'fr-CA-QC' ? 'fr-CA' : 'en-CA');
    assert.doesNotThrow(() => new Date().toLocaleDateString(getLanguageTag(code)));
    assert.deepEqual(getCaseLanguages(code), [code, code === 'fr-CA-QC' ? 'fr-CA' : 'en-CA']);
  }
  assert.ok(!hasLanguagePrefix('/en-CA-invalid'));
  for (const code of SEO_LANGUAGES) assert.doesNotThrow(() => Intl.getCanonicalLocales(code));
});

test('case studies prefer provincial content and retain shared articles', () => {
  const shared = { post_group_id: 'one', language_code: 'en-CA', created_at: '2026-01-03' };
  const province = { post_group_id: 'one', language_code: 'en-CA-ON', created_at: '2026-01-01' };
  const sharedOnly = { post_group_id: 'two', language_code: 'en-CA', created_at: '2026-01-02' };
  assert.deepEqual(selectLocalizedCases([shared, province, sharedOnly], 'en-CA-ON'), [sharedOnly, province]);
  assert.deepEqual(selectLocalizedCases([province, sharedOnly, shared], 'en-CA-ON'), [sharedOnly, province]);
  assert.deepEqual(selectLocalizedCases([], 'en-CA-ON'), []);
  assert.deepEqual(getCaseLanguages('en-US'), ['en-US']);
});

test('sitemap includes provincial pages with valid shared language alternates', async () => {
  let xml;
  const script = fs.readFileSync(new URL('./generate-sitemap.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  await vm.runInNewContext(script, {
    SUPPORTED_LANGS, SEO_LANGUAGES, getSeoLocale,
    fs: { writeFileSync: (_path, content) => { xml = content; } },
    console: { log() {}, error: error => { throw error; } },
    createClient: () => ({ from: () => ({ select: () => ({ eq: async () => ({ data: [{ post_group_id: 'test-case' }], error: null }) }) }) }),
  });
  for (const { code } of CANADIAN_PROVINCES) {
    assert.ok(xml.includes(`<loc>https://smartjsabridge.com/${code}</loc>`));
    assert.ok(xml.includes(`<loc>https://smartjsabridge.com/${code}/about</loc>`));
    assert.ok(!xml.includes(`hreflang="${code}"`));
  }
  assert.ok(xml.includes('hreflang="en-CA"'));
  assert.ok(xml.includes('hreflang="fr-CA" href="https://smartjsabridge.com/fr-CA-QC"'));
  assert.ok(!xml.includes('/en-CA-QC'));
  assert.ok(xml.includes('/case-study/test-case'));
});

test('actual i18n configuration retains province and falls back per translation key', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  const previousDocument = global.document;
  try {
    const { default: i18n } = await server.ssrLoadModule('/src/i18n.js');
    global.document = { documentElement: {} };
    for (const { code } of CANADIAN_PROVINCES) {
      await i18n.changeLanguage(code);
      assert.equal(i18n.language, code);
      assert.equal(global.document.documentElement.lang, code === 'fr-CA-QC' ? 'fr-CA' : 'en-CA');
      const baseLocale = code === 'fr-CA-QC' ? 'fr-FR' : 'en-CA';
      for (const ns of i18n.options.ns) {
        const resource = i18n.getResourceBundle(baseLocale, ns);
        assert.ok(resource, `Missing Canadian namespace: ${ns}`);
        const firstLeaf = (value, prefix = '') => {
          for (const [key, child] of Object.entries(value)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof child === 'string') return fullKey;
            if (child && typeof child === 'object') {
              const leaf = firstLeaf(child, fullKey);
              if (leaf) return leaf;
            }
          }
        };
        const key = firstLeaf(resource);
        assert.ok(key, `Empty Canadian namespace: ${ns}`);
        assert.equal(i18n.getFixedT(code, ns)(key), i18n.getResource(code, ns, key) ?? i18n.getFixedT(baseLocale, ns)(key));
      }
      assert.equal(i18n.t('seo.title', { ns: 'main' }), i18n.getResource(code, 'main', 'seo.title') ?? i18n.getResource(baseLocale, 'main', 'seo.title'));
      i18n.addResourceBundle(code, 'main', { provinceTest: { title: code } }, true, true);
      assert.equal(i18n.t('provinceTest.title', { ns: 'main' }), code);
      assert.equal(i18n.t('seo.title', { ns: 'main' }), i18n.getResource(code, 'main', 'seo.title') ?? i18n.getResource(baseLocale, 'main', 'seo.title'));
    }
    await i18n.changeLanguage('ar-SA');
    assert.equal(global.document.documentElement.dir, 'rtl');
    await i18n.changeLanguage('fr-CA-QC');
    assert.equal(i18n.t('default.docTitle', { ns: 'export' }), 'Analyse sécuritaire des tâches (AST / JSA)');
    assert.equal(i18n.t('default.docTitle', { ns: 'modulebuilder' }), 'Analyse sécuritaire des tâches (AST / JSA)');
    assert.equal(i18n.t('permit.confinedSpace', { ns: 'export' }), 'Espace clos');
    assert.equal(i18n.t('permit.밀폐', { ns: 'info' }), 'Espace clos');
    assert.equal(i18n.t('permit.electrical', { ns: 'modulebuilder' }), 'Cadenassage (LOTO)');
    assert.ok(!i18n.languages.includes('en-CA'));
    assert.ok(!i18n.languages.includes('en-US'));
    assert.equal(global.document.documentElement.dir, 'ltr');
  } finally {
    global.document = previousDocument;
    await server.close();
  }
});
