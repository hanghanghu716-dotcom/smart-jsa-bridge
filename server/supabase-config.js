import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import process from 'node:process';
import { resolvePublicSupabaseConfig } from '../src/config/supabase.js';

// Match Vite's file precedence without importing build-only dependencies into
// a server function. URL/key values are literal; interpolation is not needed.
export function readProjectEnv({
  root = new URL('../', import.meta.url),
  mode = process.env.NODE_ENV === 'development' ? 'development' : 'production',
  env = process.env,
} = {}) {
  if (!/^[A-Za-z0-9_-]+$/.test(mode) || mode === 'local') throw new Error('Invalid environment mode.');
  const values = {};
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    try { Object.assign(values, parseEnv(readFileSync(new URL(name, root), 'utf8'))); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error(`Cannot read ${name}.`); }
  }
  return { ...values, ...env };
}

export function getPublicSupabaseConfig(options) {
  return resolvePublicSupabaseConfig(readProjectEnv(options));
}
