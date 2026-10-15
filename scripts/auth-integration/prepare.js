// Disposable contract fixture, derived only from public client queries and migrations.
// This is not a production-schema export or a deployable migration.
import fs from 'node:fs';
import path from 'node:path';
import { SUPPORTED_LANGS } from '../../src/locales/config.js';
import { recommendationContext } from '../../src/utils/analysisRecommendations.js';
import { fixtureText } from '../analysis-fixture/text.js';

const root = path.resolve('.cache/auth-integration/supabase');
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(path.join(root, 'config.toml'), `project_id = "jsa-auth-integration"
[api]
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = 54322
shadow_port = 54320
major_version = 17
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
[auth]
site_url = "http://127.0.0.1:4173"
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = false
[studio]
enabled = false
[inbucket]
enabled = false
[storage]
enabled = false
[realtime]
enabled = false
[analytics]
enabled = false
[edge_runtime]
enabled = false
`);

const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const tables = {
  Hazards_Translations: 'id integer primary key, hazard_id integer, locale text, hazard_name text, category text, keywords text',
  Current_Measures_Translations: 'id integer primary key, measure_id integer, locale text, measure_text text',
  Advanced_Measures_Translations: 'id integer primary key, advanced_measure_id integer, locale text, solution_text text',
  hazard_measure_mappings: 'hazard_translation_id integer, measure_translation_id integer, similarity_score double precision',
  current_advanced_measure_mappings: 'current_measure_translation_id integer, advanced_measure_translation_id integer, similarity_score double precision',
};
let sql = `-- Synthetic prerequisite only; project persistence is outside this fixture's scope.
create table public.jsa_projects(id uuid primary key);
alter table public.jsa_projects enable row level security;
revoke all on public.jsa_projects from anon, authenticated;
`;
for (const [table, columns] of Object.entries(tables)) sql += `
create table public."${table}" (${columns});
alter table public."${table}" enable row level security;
revoke all on public."${table}" from anon, authenticated;
grant select on public."${table}" to anon, authenticated;
create policy fixture_read on public."${table}" for select to anon, authenticated using(true);
`;
const dataLocales = [...new Set(SUPPORTED_LANGS.map(locale => recommendationContext({}, locale).dataLocale))];
for (const [index, locale] of dataLocales.entries()) {
  const [hazard, current, advanced] = fixtureText[locale.split('-')[0]];
  const base = 10000 + index * 100, h = base + 1, c = base + 2, a = base + 3;
  // Master IDs deliberately differ from translation IDs; a 99.9% wrong-ID row must stay absent.
  sql += `insert into public."Hazards_Translations" values(${h},${base + 50},${quote(locale)},${quote(hazard)},'Isolation',${quote(JSON.stringify([hazard]))});
insert into public."Current_Measures_Translations" values(${c},${base + 51},${quote(locale)},${quote(current)}),(${base + 4},${base + 52},${quote(locale)},'Unrelated high score');
insert into public."Advanced_Measures_Translations" values(${a},${base + 53},${quote(locale)},${quote(advanced)});
insert into public.hazard_measure_mappings values(${h},${c},0.72),(${base + 50},${base + 4},0.999);
insert into public.current_advanced_measure_mappings values(${c},${a},0.8);
`;
}
// Unmodified public migrations: actual ownership policies and optimistic-lock RPC.
const migrations = [
  '20260929193711_phase2_step_library_drafts.sql',
  '20260929200545_phase2_limit_step_draft_privileges.sql',
  '20260930090018_phase2_version_history_and_draft_locking.sql',
];
for (const migration of migrations) sql += '\n' + fs.readFileSync(path.join('supabase/migrations', migration), 'utf8');
fs.writeFileSync(path.join(root, 'seed.sql'), sql);
console.log(`Prepared isolated Auth fixture: ${SUPPORTED_LANGS.length} UI Locales, ${dataLocales.length} data Locales; no production data.`);
