import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
import { staticRoutes } from './static-routes.js';
import { verifyStaticMetadata } from './static-metadata.js';
for (const route of staticRoutes([])) {
 const filename = route === '/' ? 'dist/index.html' : `dist${route.replace(/\/$/, '')}/index.html`;
 verifyStaticMetadata(fs.readFileSync(filename, 'utf8'), route);
}
console.log('Verified: all public static pages have one current title, description, robots tag and canonical.');
for (const locale of SUPPORTED_LANGS) {
 for (const page of ['business','explore','public-jsa','library','login','profile','export','info','analysis','procedure','document-designer','work-packages']) {
  if (fs.existsSync(`dist/${locale}/${page}`)) throw new Error(`Unexpected dynamic snapshot: ${locale}/${page}`);
 }
}
const shell=fs.readFileSync('dist/public-jsa-shell.html','utf8');
if (!/<div id="root"><\/div>/.test(shell)) throw new Error('The live public endpoint needs a clean application shell.');
console.log('Verified: dynamic user routes are not snapshotted; live public JSA shell is clean.');

const guides=JSON.parse(fs.readFileSync('dist/assets/guides/manifest.json','utf8'));
if(guides.length!==SUPPORTED_LANGS.length*6)throw new Error('Missing localised guides.');
if(new Set(guides.map(guide=>guide.route)).size!==guides.length)throw new Error('Duplicate guide route.');
for(const guide of guides){
 const html=fs.readFileSync(`dist${guide.route}/index.html`,'utf8');
 if(!html.includes('id="guide-document"')||!html.includes(`data-guide-locale="${guide.locale}"`)||!html.includes(guide.pdf)||!html.includes('application/ld+json'))throw new Error(`Guide initial HTML missing: ${guide.route}`);
 const pdf=fs.readFileSync(`dist${guide.pdf}`);
 if(pdf.subarray(0,5).toString()!=='%PDF-')throw new Error(`Guide PDF missing: ${guide.pdf}`);
 if(createHash('sha256').update(pdf).digest('hex')!==guide.sha256)throw new Error(`Guide PDF differs from build manifest: ${guide.pdf}`);
}
console.log(`Verified: ${guides.length} guides have initial HTML and matching localised PDFs.`);
