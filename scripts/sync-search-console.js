import { runSync, SyncError } from './lib/search-console.js';
import process from 'node:process';

try {
  const results = await runSync({ env: process.env, backfill: process.argv.includes('--backfill'), report: message => console.log(message) });
  if (results.some(row => !row.ok)) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof SyncError ? error.code : 'SYNC_FAILED');
  process.exitCode = 1;
}
