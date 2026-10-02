import fs from 'node:fs';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
for (const locale of SUPPORTED_LANGS) {
 for (const page of ['business','explore','public-jsa','library','login','profile','export','info','analysis','procedure','document-designer','work-packages']) {
  if (fs.existsSync(`dist/${locale}/${page}`)) throw new Error(`Unexpected dynamic snapshot: ${locale}/${page}`);
 }
}
const shell=fs.readFileSync('dist/public-jsa-shell.html','utf8');
if (!/<div id="root"><\/div>/.test(shell)) throw new Error('The live public endpoint needs a clean application shell.');
console.log('Verified: dynamic user routes are not snapshotted; live public JSA shell is clean.');
