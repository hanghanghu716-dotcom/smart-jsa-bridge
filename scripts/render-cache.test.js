import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRenderCache, refreshBundleReferences} from './render-cache.js';
import {isStaticContentBuild} from '../src/utils/caseListBootstrap.js';

const shell = bundle => `<html><head><script type="module" crossorigin src="/assets/${bundle}.js"></script><link rel="stylesheet" href="/assets/style.css"></head><body><div id="root"></div></body></html>`;
const document = (bundle = 'old', body = '<main>Existing content</main>') => shell(bundle).replace('<head>', '<head><title>Unchanged title</title><link rel="canonical" href="https://smartjsabridge.com/ko/about">').replace('<div id="root"></div>', body);

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsa-render-cache-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (relative, value) => {const file = path.join(root, relative);fs.mkdirSync(path.dirname(file), {recursive: true});fs.writeFileSync(file, value);};
  write('src/App.jsx', 'shared component');
  write('src/locales/ko/about.json', '{"title":"Korean"}');
  write('src/locales/ja-JP/about.json', '{"title":"Japanese"}');
  write('src/locales/en-US/about.json', '{"title":"English fallback"}');
  write('dist/public-jsa-shell.html', shell('new'));
  write('dist/assets/new.js', 'current application');
  write('dist/assets/style.css', 'body{color:black}');
  const create = (context = 'chrome-and-fonts-v1', environment = {}) => createRenderCache({sourceRoot: root, outputRoot: path.join(root, 'dist'), cacheRoot: path.join(root, 'cache'), context, environment});
  const save = (route, cache = create()) => {write(`dist${route}/index.html`, document());cache.save(route, 'static');};
  return {root, write, create, save};
}

test('a warm build reuses existing HTML, adds a new route, and refreshes only bundle tags', t => {
  const {root, create, save} = fixture(t);
  const cold = create();assert.equal(cold.restore('/ko/about', 'static'), null);
  save('/ko/about', cold);
  const warm = create();
  assert.deepEqual(warm.restore('/ko/about', 'static'), {});
  assert.equal(warm.restore('/ko/terms', 'static'), null);
  const restored = fs.readFileSync(path.join(root, 'dist/ko/about/index.html'), 'utf8');
  assert.match(restored, /Existing content/);assert.match(restored, /Unchanged title/);
  assert.match(restored, /canonical/);assert.match(restored, /\/assets\/new\.js/);
  assert.doesNotMatch(restored, /\/assets\/old\.js/);
  assert.equal((restored.match(/type="module"/g) || []).length, 1);
});

test('changed locale content rebuilds that locale and retains unrelated translated HTML', t => {
  const {create, write, save} = fixture(t);
  save('/ko/about');save('/ja-JP/about');
  write('src/locales/ko/about.json', '{"title":"Updated Korean"}');
  const changed = create();
  assert.equal(changed.restore('/ko/about', 'static'), null);
  assert.deepEqual(changed.restore('/ja-JP/about', 'static'), {});
});

test('changed fallback translations invalidate dependent locales', t => {
  const {create, write, save} = fixture(t);
  save('/ko/about');
  write('src/locales/en-US/about.json', '{"title":"Updated fallback"}');
  assert.equal(create().restore('/ko/about', 'static'), null);
});

test('shared code, styles, build environment and rendering environment invalidate old content', t => {
  const {create, write, save} = fixture(t);
  save('/ko/about');
  assert.equal(create('chrome-and-fonts-v2').restore('/ko/about', 'static'), null);
  write('src/App.jsx', 'changed component');assert.equal(create().restore('/ko/about', 'static'), null);
  save('/ko/about');write('src/app.css', 'changed styles');assert.equal(create().restore('/ko/about', 'static'), null);
  save('/ko/about');assert.equal(create('chrome-and-fonts-v1', {VITE_PUBLIC_VALUE: 'changed'}).restore('/ko/about', 'static'), null);
  assert.deepEqual(create('chrome-and-fonts-v1', {VERCEL_OIDC_TOKEN: 'ephemeral'}).restore('/ko/about', 'static'), {});
});

test('missing or corrupted HTML, assets and records become cache misses', t => {
  const {root, create, write, save} = fixture(t);
  save('/ko/about');
  const directory = path.join(root, 'cache', fs.readdirSync(path.join(root, 'cache'))[0]);
  fs.writeFileSync(path.join(directory, 'page.html'), 'corrupt');
  assert.equal(create().restore('/ko/about', 'static'), null);
  save('/ko/about');fs.writeFileSync(path.join(directory, 'record.json'), '{bad');
  assert.equal(create().restore('/ko/about', 'static'), null);
  save('/ko/about');write('dist/public-jsa-shell.html', shell('missing'));
  assert.equal(create().restore('/ko/about', 'static'), null);
});

test('HTML and byte-identical PDF restore together; damaged PDFs are regenerated', t => {
  const {root, create, write} = fixture(t);
  const route = '/ko/guideline/common', relative = 'assets/guides/ko/common-v1.pdf';
  const pdf = Buffer.from('%PDF-' + 'example'.repeat(2000));
  const metadata = {route, pdf: '/' + relative, bytes: pdf.length, sha256: createHash('sha256').update(pdf).digest('hex')};
  write(`dist${route}/index.html`, document());write('dist/' + relative, pdf);
  create().save(route, 'guide', metadata, relative);
  fs.unlinkSync(path.join(root, 'dist', relative));
  assert.deepEqual(create().restore(route, 'guide', relative), metadata);
  assert.deepEqual(fs.readFileSync(path.join(root, 'dist', relative)), pdf);
  const directory = path.join(root, 'cache', fs.readdirSync(path.join(root, 'cache'))[0]);
  fs.writeFileSync(path.join(directory, 'document.pdf'), '%PDF-corrupt');
  assert.equal(create().restore(route, 'guide', relative), null);
});

test('live database pages and unconfigured local builds are never cached', t => {
  const {create, save} = fixture(t);
  for (const route of ['/', '/ko/dictionary', '/ko/case-study/example']) {
    save(route);assert.equal(create().restore(route, 'static'), null);
  }
  save('/ko/about');assert.equal(create('').restore('/ko/about', 'static'), null);
});

test('cache output paths cannot escape the build directory', t => {
  const {create} = fixture(t);
  assert.throws(() => create().save('/../outside', 'static'), /Invalid render route/);
});

test('bundle rebinding retains SEO and unrelated scripts, but removes old preload URLs', () => {
  const html = document().replace('</head>', '<link rel="modulepreload" href="/assets/old-chunk.js"><script type="application/ld+json">{"name":"Preserved"}</script></head>');
  const result = refreshBundleReferences(html, shell('new'));
  assert.match(result, /"name":"Preserved"/);assert.doesNotMatch(result, /old-chunk/);
  assert.throws(() => refreshBundleReferences(html, '<html><head></head></html>'), /Missing current/);
});

test('lazy styles remain attached to cached HTML instead of being silently removed', () => {
  const html = document().replace('</head>', '<link rel="stylesheet" href="/assets/lazy.css"></head>');
  const result = refreshBundleReferences(html, shell('new'), shell('old'));
  assert.match(result, /\/assets\/lazy.css/);
  assert.equal((result.match(/\/assets\/style.css/g) || []).length, 1);
});

test('only the static build browser skips live case-list requests', () => {
  assert.equal(isStaticContentBuild('ReactSnap SmartJSAStaticBuild'), true);
  assert.equal(isStaticContentBuild('ReactSnap SmartJSAGuideBuild'), true);
  for (const ua of ['ReactSnap SmartJSARootBuild', 'Mozilla/5.0 Chrome/130', 'Googlebot', 'bingbot', '']) assert.equal(isStaticContentBuild(ua), false);
});
