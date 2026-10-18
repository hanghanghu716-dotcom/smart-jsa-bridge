import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { getExploreModerationUi } from '../src/locales/exploreModerationUi.js';

test('moderation controls and reason disclosure cover all supported locales', () => {
  for (const locale of SUPPORTED_LANGS) {
    const ui = getExploreModerationUi(locale);
    assert.equal(Object.keys(ui).length, 10);
    assert.ok(Object.values(ui).every(text => typeof text === 'string' && text.trim()), locale);
    assert.notEqual(ui.restrict, ui.restore, locale);
  }
});
test('direct moderation stays behind a private admin check and preserves originals', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20261018044429_explore_direct_moderation.sql', import.meta.url), 'utf8');
  assert.match(sql, /actor is null or not jsa_private\.community_admin\(\)/);
  assert.ok(sql.indexOf('ADMIN_REQUIRED') < sql.indexOf("p_action='restricted'"));
  assert.match(sql, /public\.explore_moderation[\s\S]*security invoker/);
  assert.match(sql, /revoke all on function public\.explore_moderation[^;]*from public,anon,authenticated/);
  assert.match(sql, /STALE_MODERATION/);
  assert.match(sql, /for update/);
  assert.match(sql, /insert into jsa_private\.community_audit/);
  assert.doesNotMatch(sql, /(?:delete from|update) public\.jsa_projects/i);
});
