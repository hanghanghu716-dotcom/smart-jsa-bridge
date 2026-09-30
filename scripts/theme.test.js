import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeTheme, resolveTheme, readTheme, saveTheme, applyTheme, THEME_STORAGE_KEY } from '../src/theme/preferences.js';

test('system is the default; explicit choices override the OS', () => {
  for (const invalid of [null, undefined, '', 'blue']) assert.equal(normalizeTheme(invalid), 'system');
  for (const dark of [false, true]) {
    assert.equal(resolveTheme('system', dark), dark ? 'dark' : 'light');
    assert.equal(resolveTheme('dark', dark), 'dark');
    assert.equal(resolveTheme('light', dark), 'light');
  }
});

test('preferences persist without touching drafts and tolerate blocked storage', () => {
  const values = new Map([['smartjsa_guest_draft:example', 'untouched']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  saveTheme(storage, 'dark');
  assert.equal(readTheme(storage), 'dark');
  saveTheme(storage, 'system');
  assert.equal(values.get(THEME_STORAGE_KEY), 'auto');
  values.set(THEME_STORAGE_KEY, 'auto');
  assert.equal(readTheme(storage), 'system');
  assert.equal(values.get('smartjsa_guest_draft:example'), 'untouched');
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readTheme(blocked), 'system');
  assert.doesNotThrow(() => saveTheme(blocked, 'light'));
});

test('initial pre-paint theme agrees with runtime, including disabled storage', () => {
  const script = fs.readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
  for (const saved of [null, 'light', 'dark', 'auto', 'system', 'invalid']) for (const dark of [false, true]) {
    const document = { documentElement: { dataset: {}, style: {} } };
    vm.runInNewContext(script, { document, localStorage: { getItem: () => saved }, matchMedia: () => ({ matches: dark }) });
    assert.equal(document.documentElement.dataset.theme, resolveTheme(normalizeTheme(saved), dark));
    assert.equal(document.documentElement.style.colorScheme, document.documentElement.dataset.theme);
  }
  const document = { documentElement: { dataset: {}, style: {} } };
  vm.runInNewContext(script, { document, get localStorage() { throw Error('blocked'); }, matchMedia: () => ({ matches: true }) });
  assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('theme updates native controls and browser chrome', () => {
  let meta;
  const document = { documentElement: { dataset: {}, style: {} }, querySelector: () => ({ setAttribute: (_, value) => { meta = value; } }) };
  applyTheme(document, 'light');
  assert.equal(document.documentElement.style.colorScheme, 'light');
  assert.equal(meta, '#f4f6f8');
  applyTheme(document, 'dark');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(meta, '#0f1115');
});

test('all base locales provide the appearance controls', () => {
  const locales = new URL('../src/locales/', import.meta.url);
  for (const locale of fs.readdirSync(locales)) {
    const file = new URL(`${locale}/common.json`, locales);
    if (!fs.existsSync(file)) continue;
    const { appearance } = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const key of ['title', 'system', 'light', 'dark']) assert.ok(appearance?.[key]?.trim(), `${locale}: ${key}`);
  }
});
