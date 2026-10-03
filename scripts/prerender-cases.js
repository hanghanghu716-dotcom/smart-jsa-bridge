import fs from 'node:fs';
import path from 'node:path';
import reactSnap from 'react-snap';
import { verifyBuiltCases } from './case-build-data.js';
import { staticRoutes } from './static-routes.js';
import { renderGuides } from './render-guides.js';

// Preserve the clean application shell for live public/private visibility checks.
fs.copyFileSync('dist/index.html', 'dist/public-jsa-shell.html');

const configuration = JSON.parse(fs.readFileSync('package.json', 'utf8')).reactSnap;
const manifest = JSON.parse(fs.readFileSync('.cache/case-build-manifest.json', 'utf8'));
// Guides are rendered together with their PDF below, from one verified page.
const include = staticRoutes(manifest).filter(route => !route.includes('/guideline/'));
const concurrency = Number(process.env.JSA_PRERENDER_CONCURRENCY || configuration.concurrency || 1);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
  throw new Error('JSA_PRERENDER_CONCURRENCY must be an integer between 1 and 8.');
}
const puppeteerArgs = [...(configuration.puppeteerArgs || [])];
if (process.platform === 'win32' && !puppeteerArgs.some(arg => arg.startsWith('--user-data-dir'))) {
  // The bundled legacy Puppeteer otherwise uses taskkill for a temporary
  // profile, which can hang in restricted Windows sessions. A dedicated
  // build profile lets it close Chrome gracefully through its normal API.
  const profile = path.resolve('.cache', `prerender-chrome-${process.pid}`);
  fs.mkdirSync(profile, { recursive: true });
  puppeteerArgs.push(`--user-data-dir=${profile}`);
}
await reactSnap.run({ ...configuration, include, crawl: false, concurrency, puppeteerArgs,
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || configuration.puppeteerExecutablePath });
const count = verifyBuiltCases(manifest, configuration.source || 'dist');
console.log(`Verified current article snapshots and metadata for ${count} case-study URLs.`);
const guides = await renderGuides();
console.log(`Verified ${guides.length} localised guide HTML/PDF pairs.`);
