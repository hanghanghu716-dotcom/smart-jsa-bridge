import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';

const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
const mode = args.length === 0 ? 'development' : args.length === 2 && args[0] === '--mode' ? args[1] : null;
const report = (level, message) => console.log(`[${level}] ${message}`);
try {
  if (!mode) throw new Error('Usage: npm run doctor -- [--mode development|production]');
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Node.js 22.12 or newer is required.');
  report('OK', `Node ${process.versions.node}; mode=${mode}; CI uses Node 22.`);
  if (major !== 22) report('WARN', 'Use Node 22 LTS to reproduce the CI environment.');
  const config = getPublicSupabaseConfig({ mode });
  report('OK', `Supabase origin: ${config.url}; ${config.configured ? 'environment override' : 'repository default'}.`);
  if (config.production) report('WARN', 'This workspace uses the production database, including local saves and deletes.');
  if (!config.configured) report('WARN', 'Set both VITE_SUPABASE_* values in .env.local to use a separate test project.');
  if (fileURLToPath(root).split(/[\\/]/).some(part => /^OneDrive(?:\b|$)/i.test(part))) {
    report('WARN', 'OneDrive workspace: prefer a separate Git checkout outside file-sync folders.');
  }
  const git = (...command) => execFileSync('git', ['-C', fileURLToPath(root), ...command], {
    encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  try {
    const branch = git('branch', '--show-current') || '(detached)';
    const head = git('rev-parse', '--short', 'HEAD');
    const changes = git('status', '--porcelain').split('\n').filter(Boolean).length;
    report(changes ? 'WARN' : 'OK', `Git ${branch} @ ${head}; ${changes} uncommitted path(s).`);
    try {
      const [behind, ahead] = git('rev-list', '--left-right', '--count', '@{upstream}...HEAD').split(/\s+/).map(Number);
      report(behind || ahead ? 'WARN' : 'OK', `Cached upstream: behind=${behind}, ahead=${ahead}. Run git fetch to refresh; doctor never fetches or changes files.`);
    } catch { report('WARN', 'No upstream comparison is available.'); }
  } catch { report('WARN', 'Git checkout metadata is unavailable; source synchronization is unverified.'); }
  const migrationRoot = new URL('supabase/migrations/', root);
  const migrations = readdirSync(migrationRoot).filter(name => name.endsWith('.sql')).sort();
  report('INFO', `${migrations.length} migration files; latest=${migrations.at(-1) || 'none'}. Applied database history is not verified.`);
  if (!existsSync(new URL('supabase/config.toml', root))) report('WARN', 'No local Supabase config/baseline. Do not reset or replay migrations against production.');
  const vercel = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8'));
  report('INFO', `Vercel Git deployment=${vercel.git?.deploymentEnabled}; review .github/workflows/deploy.yml for the production release path.`);
  report('INFO', 'No database or network requests were made. API keys and tokens are never printed.');
} catch (error) {
  report('ERROR', error.message);
  process.exitCode = 1;
}
