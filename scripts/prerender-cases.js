import fs from 'node:fs';
import { renderStatic } from './static-renderer.js';
import { staticRoutes } from './static-routes.js';
import { renderGuides } from './render-guides.js';

// Preserve the clean application shell for live public/private visibility checks.
fs.copyFileSync('dist/index.html', 'dist/public-jsa-shell.html');

const configuration = JSON.parse(fs.readFileSync('package.json', 'utf8')).reactSnap;
const manifest = JSON.parse(fs.readFileSync('.cache/case-build-manifest.json', 'utf8'));
// Guides are rendered together with their PDF below, from one verified page.
const include = staticRoutes(manifest).filter(route => !route.includes('/guideline/') && !route.includes('/case-study/'));
const concurrency = Number(process.env.JSA_PRERENDER_CONCURRENCY || configuration.concurrency || 1);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
  throw new Error('JSA_PRERENDER_CONCURRENCY must be an integer between 1 and 8.');
}
await renderStatic({routes:include,concurrency,
 executablePath:process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':configuration.puppeteerExecutablePath)});
console.log('Case studies are served live from the database.');
const guides = await renderGuides();
console.log(`Verified ${guides.length} localised guide HTML/PDF pairs.`);
