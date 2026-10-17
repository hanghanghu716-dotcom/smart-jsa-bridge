import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Buffer } from 'node:buffer';
import { loadEnv } from 'vite';
import { DEFAULT_PUBLIC_SUPABASE, resolvePublicSupabaseConfig } from '../src/config/supabase.js';
import { getPublicSupabaseConfig, readProjectEnv } from '../server/supabase-config.js';

const pair = (host = 'test-project', key = 'sb_publishable_test_key') => ({
  VITE_SUPABASE_URL: `https://${host}.supabase.co`, VITE_SUPABASE_PUBLISHABLE_KEY: key,
});
const jwt = claims => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test('an unset environment preserves the production project and uses a public key', () => {
  const config = resolvePublicSupabaseConfig();
  assert.equal(config.url, DEFAULT_PUBLIC_SUPABASE.url);
  assert.equal(config.key, DEFAULT_PUBLIC_SUPABASE.key);
  assert.equal(config.configured, false);
  assert.equal(config.production, true);
});
test('a complete test-project override never falls back to the production key', () => {
  const config = resolvePublicSupabaseConfig(pair());
  assert.equal(config.url, 'https://test-project.supabase.co');
  assert.equal(config.key, 'sb_publishable_test_key');
  assert.equal(config.production, false);
  assert.equal(config.configured, true);
  for (const env of [{ VITE_SUPABASE_URL: pair().VITE_SUPABASE_URL }, { VITE_SUPABASE_PUBLISHABLE_KEY: pair().VITE_SUPABASE_PUBLISHABLE_KEY }]) {
    assert.throws(() => resolvePublicSupabaseConfig(env), /together/);
  }
});
test('privileged and malformed credentials are rejected without echoing their values', () => {
  for (const key of ['sb_secret_do_not_print', jwt({ role: 'service_role' }), jwt({ role: 'authenticated' }), 'unknown_do_not_print']) {
    assert.throws(() => resolvePublicSupabaseConfig(pair('test-project', key)), error => !error.message.includes(key) && /forbidden/.test(error.message));
  }
  assert.equal(resolvePublicSupabaseConfig(pair('test-project', jwt({ role: 'anon', ref: 'test-project' }))).configured, true);
  assert.throws(() => resolvePublicSupabaseConfig(pair('test-project', jwt({ role: 'anon', ref: 'other-project' }))), /forbidden/);
});
test('URLs must be plain HTTPS origins; local Supabase HTTP is supported', () => {
  for (const url of ['https://name:password@example.com', 'https://example.com/rest/v1', 'https://example.com?key=secret', 'https://example.com#token', 'http://example.com', 'file:///tmp/db']) {
    assert.throws(() => resolvePublicSupabaseConfig({ ...pair(), VITE_SUPABASE_URL: url }), /origin/);
  }
  for (const url of ['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321']) {
    assert.equal(resolvePublicSupabaseConfig({ ...pair(), VITE_SUPABASE_URL: url + '/' }).url, url);
  }
});
test('Node API/build and Vite resolve literal env files with the same mode precedence', t => {
  const directory = mkdtempSync(join(tmpdir(), 'jsa-env-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const root = pathToFileURL(directory + sep);
  const file = (name, values) => writeFileSync(join(directory, name), Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n'));
  file('.env', pair('base'));
  file('.env.local', pair('local'));
  file('.env.development', pair('development'));
  file('.env.development.local', pair('development-local'));
  file('.env.production', pair('production-test'));
  for (const mode of ['development', 'production']) {
    const server = getPublicSupabaseConfig({ root, mode, env: {} });
    assert.deepEqual(server, resolvePublicSupabaseConfig(loadEnv(mode, directory, 'VITE_')));
  }
  assert.equal(getPublicSupabaseConfig({ root, mode: 'development', env: pair('ci') }).url, 'https://ci.supabase.co');
  assert.throws(() => readProjectEnv({ root, mode: '../invalid', env: {} }), /mode/);
});
