import fs from 'node:fs';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

// Retain the existing home/archive design as templates, but never let Vercel
// serve the build-time content in place of the live functions.
fs.mkdirSync('.cache/content-shells', { recursive: true });
for (const locale of SUPPORTED_LANGS) {
  for (const [kind, source] of [['home', `dist/${locale}/index.html`], ['archive', `dist/${locale}/archive/index.html`]]) {
    const html = fs.readFileSync(source, 'utf8');
    if (!html.includes('data-live-case-list')) throw new Error(`Missing live list slot: ${source}`);
    fs.renameSync(source, `.cache/content-shells/${locale}-${kind}.html`);
  }
  if (fs.existsSync(`dist/${locale}/case-study`)) throw new Error('Case studies must not be snapshotted.');
}
fs.rmSync('dist/sitemap.xml', { force: true });
console.log('Prepared live case-study, home, archive and sitemap routes.');
