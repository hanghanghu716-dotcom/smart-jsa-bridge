import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('all 18 locales resolve analysis messages and render every selected PPE/permit in the document language', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const previousDocument = globalThis.document;
  try {
    const { default: i18n } = await server.ssrLoadModule('/src/i18n.js');
    const { default: Content } = await server.ssrLoadModule('/src/components/DocumentContent.jsx');
    globalThis.document = { documentElement: {} };
    await i18n.changeLanguage('ko');
    const keys = ['base.searching', 'filter.searchPlaceholder', 'btn.fastTrackComplete',
      'fastTrackModal.title', 'fastTrackModal.desc', 'fastTrackModal.hazardFactor', 'fastTrackModal.copied',
      'fastTrackModal.safetyMeasure', 'fastTrackModal.measureCopied', 'fastTrackModal.goHome',
      'recommendation.similarity', 'recommendation.scoreHelp', 'recommendation.sharedData',
      'recommendation.reviewRequired', 'recommendation.loadError',
      ...Object.keys(i18n.getResourceBundle('en-US', 'analysis').review).map(key => `review.${key}`)];
    const ppe = ['안전모', '안전화', '보안경', '장갑', '귀마개', '방진복', '방진마스크'];
    const permits = ['일반', '화기', '밀폐', '정전', '굴착', '방사선', '고소', '중량물', '가연성가스'];
    for (const locale of SUPPORTED_LANGS) {
      const t = i18n.getFixedT(locale, 'analysis');
      for (const key of keys) {
        const value = t(key, { locale: 'en-US' });
        assert.ok(value && value !== key, `${locale}: ${key}`);
        if (locale !== 'ko') assert.doesNotMatch(value, /[가-힣]/u, `${locale}: Korean fallback in ${key}`);
      }
      const html = renderToStaticMarkup(React.createElement(Content, {
        documentLocale: locale,
        formData: { ppe, permits, projectName: 'Preserve user text', assessment: { name: 'Site A', frequencyMax: 5, severityMax: 4, highFrom: 8, criteria: 'User criteria' } },
        layout: { documentBlocks: [{ id: 'PROJECT_INFO', enabled: true }, { id: 'SAFETY', enabled: true }] },
      }));
      assert.ok(html.includes('Preserve user text'));
      assert.ok(html.includes('Site A') && html.includes('User criteria') && html.includes('data-assessment-profile'));
      if (locale !== 'ko') assert.doesNotMatch(html, /[가-힣]/u, `${locale}: untranslated choice in document`);
      for (const key of ['귀마개', '방진복']) {
        const label = i18n.getFixedT(locale, 'info')(`ppe.${key}`);
        assert.ok(html.includes(label.replaceAll('&', '&amp;').replaceAll("'", '&#x27;')), `${locale}: ${key}`);
      }
    }
  } finally {
    globalThis.document = previousDocument;
    await server.close();
  }
});
