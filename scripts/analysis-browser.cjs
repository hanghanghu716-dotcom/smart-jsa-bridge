const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const cp = require('node:child_process');

(async () => {
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const { SUPPORTED_LANGS } = await import('../src/locales/config.js');
  const { fixtureText } = await import('./analysis-fixture/text.js');
  const puppeteer = require('puppeteer');
  const mock = path.resolve('scripts/analysis-fixture/supabase.js');
  const server = await createServer({ configFile: false, plugins: [
    { name: 'analysis-fixture-data', enforce: 'pre', resolveId(id) { return /(?:^|\/)supabaseClient(?:\.js)?$/.test(id) ? mock : null; } }, react()
  ], server: { host: '127.0.0.1', port: 0, hmr: false }, appType: 'spa' });
  let browser;
  const results = [];
  await fs.mkdir('artifacts/recommendations', { recursive: true });
  try {
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || (process.platform === 'win32'
      ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome'), headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    for (const locale of SUPPORTED_LANGS) {
      const words = fixtureText[locale.split('-')[0]], page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1100 });
      await page.setRequestInterception(true);
      page.on('request', request => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/)/.test(request.url()) || /^(?:data|blob):/.test(request.url())
        ? request.continue() : request.abort());
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', async dialog => { await dialog.dismiss(); });
      const url = `http://127.0.0.1:${port}/scripts/analysis-fixture/index.html?locale=${locale}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForSelector('.analysis-candidates label input');
        await page.click('.analysis-candidates label input');
        await page.click('[data-add-selected]');
        await page.waitForSelector('.analysis-selected tbody textarea');
        const controls = () => page.$$eval('.analysis-selected tbody textarea', elements => elements.map(el => el.value));
        assert.deepEqual(await controls(), [words[0], '', '']);
        await page.click('[data-recommend-current]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.72"]');
        assert.equal(await page.evaluate(() => document.body.textContent.includes('Unrelated high score')), false);
        await page.click('[data-recommendation-item]');
        await page.waitForFunction(value => document.querySelectorAll('.analysis-selected tbody textarea')[1]?.value === value, {}, words[1]);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.click('[data-current-confirmed]');
        await page.click('[data-recommend-advanced]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.8"]');
        await page.click('[data-recommendation-item]');
        await page.waitForFunction(value => document.querySelectorAll('.analysis-selected tbody textarea')[2]?.value === value, {}, words[2]);
        await page.click('.analysis-selected tbody textarea');
        await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
        await page.keyboard.type('Unrelated manual input');
        assert.deepEqual(await controls(), ['Unrelated manual input', words[1], words[2]]);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.waitForFunction(() => {
          const id = sessionStorage.getItem('smartjsa_active_draft_id');
          const data = JSON.parse(localStorage.getItem('smartjsa_guest_draft:' + id) || 'null');
          return data?.analysis_data?.[0]?.risks?.[0]?.factor === 'Unrelated manual input';
        });
        await page.goto(url + '&restore=1', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => document.querySelector('.analysis-selected tbody textarea')?.value === 'Unrelated manual input');
        assert.deepEqual(await controls(), ['Unrelated manual input', words[1], words[2]]);
        const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem('smartjsa_guest_draft:' + sessionStorage.getItem('smartjsa_active_draft_id'))));
        assert.equal(snapshot.analysis_data[0].risks[0].hazard_reference, null);
        assert.equal(snapshot.analysis_data[0].riskLevel, null);
        assert.equal(snapshot.form_data.context.documentLocale, locale);
        await page.click('[data-analysis-next]');
        await page.waitForSelector('[data-document-ready] .document-content');
        const output = await page.$eval('.document-content', el => ({ text: el.textContent, scroll: el.scrollWidth, width: el.clientWidth }));
        assert.ok(output.text.includes(words[1]) && output.text.includes(words[2]), locale + ': retained controls in document');
        assert.ok(output.scroll <= output.width + 2, locale + ': document overflow');
        assert.equal(await page.$eval('.document-content', el => el.getAttribute('dir')), locale.startsWith('ar') ? 'rtl' : 'ltr');
        assert.equal(await page.$eval('[data-assessment-profile]', el => el.getAttribute('dir')), locale.startsWith('ar') ? 'rtl' : 'ltr');
        const pdf = path.resolve(`artifacts/recommendations/${locale}.pdf`);
        await page.pdf({ path: pdf, format: 'A4', landscape: true, printBackground: true });
        assert.ok((await fs.stat(pdf)).size > 5000, locale + ': PDF emitted');
        if (process.platform === 'linux') {
          const extracted = cp.execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8' });
          assert.ok(extracted.includes('Regression fixture') && extracted.length > 100, locale + ': PDF text extracted');
        }
        if (['ar-SA', 'ja-JP', 'de-DE'].includes(locale)) {
          const screenshot = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: true });
          await fs.writeFile(`artifacts/recommendations/${locale}.jpg`, screenshot);
          if (process.platform === 'linux') {
            const preview = path.resolve(`artifacts/recommendations/${locale}-pdf`);
            cp.execFileSync('pdftoppm', ['-f', '1', '-singlefile', '-scale-to', '1200', '-jpeg', pdf, preview]);
            console.log('PDF_PREVIEW ' + locale + ' ' + (await fs.readFile(preview + '.jpg')).toString('base64'));
          }
        }
        assert.deepEqual(errors, [], locale + ': browser errors');
        results.push({ locale, extraction: true, recommendations: true, confirmation: true, manualEdit: true, guestSaveRestore: true, document: true, pdf: true });
      } catch (error) {
        await fs.writeFile(`artifacts/recommendations/${locale}-failure.html`, await page.content());
        console.error(JSON.stringify({ locale, errors, failure: error.message, text: (await page.$eval('body', el => el.innerText)).slice(-2500) }));
        throw error;
      } finally { await page.close(); }
    }
    await fs.writeFile('artifacts/recommendations/browser-results.json', JSON.stringify({ data: 'isolated fixtures, guest storage; not live DB/account testing', results }, null, 2));
    console.log('ANALYSIS_BROWSER_RESULTS ' + JSON.stringify(results));
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
