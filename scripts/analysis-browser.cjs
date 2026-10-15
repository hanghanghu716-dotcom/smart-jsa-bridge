const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const cp = require('node:child_process');

(async () => {
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const { SUPPORTED_LANGS } = await import('../src/locales/config.js');
  const { fixtureText } = await import('./analysis-fixture/text.js');
  const { fixtureCaseRelease } = await import('./analysis-fixture/caseRelease.js');
  const caseReleases = Object.fromEntries(SUPPORTED_LANGS.map(locale => [locale, fixtureCaseRelease(locale).manifest]));
  const puppeteer = require('puppeteer');
  const mock = path.resolve('scripts/analysis-fixture/supabase.js');
  const server = await createServer({ configFile: false, plugins: [
    { name: 'analysis-fixture-data', enforce: 'pre', resolveId(id) {
      if (id.endsWith('/reviewed-recommendations.json')) return '\0synthetic-case-release';
      return /(?:^|\/)supabaseClient(?:\.js)?$/.test(id) ? mock : null;
    }, load(id) { if (id === '\0synthetic-case-release') return `export default (${JSON.stringify(caseReleases)})[new URLSearchParams(location.search).get('locale') || 'en-US'];`; } }, react()
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
        const downloadDir = path.resolve(`artifacts/recommendations/downloads/${locale}`);
        await fs.mkdir(downloadDir, { recursive: true });
        const cdp = await page.target().createCDPSession();
        await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
        await cdp.send('Browser.grantPermissions', { origin: `http://127.0.0.1:${port}`, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForSelector('.analysis-candidates label input');
        await page.click('.analysis-candidates label input');
        await page.click('[data-add-selected]');
        await page.waitForSelector('.analysis-selected tbody textarea');
        const controls = () => page.$$eval('.analysis-selected tbody textarea', elements => elements.map(el => el.value));
        assert.deepEqual(await controls(), [words[0], '', '']);
        await page.click('[data-recommend-current]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.72"]');
        assert.equal(await page.$$eval('[data-recommendation-item]', items => items.length), 1, locale + ': broken current identities excluded');
        assert.equal(await page.evaluate(() => document.body.textContent.includes('Unrelated high score')), false);
        await page.click('[data-recommendation-item]');
        await page.waitForFunction(value => document.querySelectorAll('.analysis-selected tbody textarea')[1]?.value === value, {}, words[1]);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.click('[data-current-confirmed]');
        await page.click('[data-recommend-advanced]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.8"]');
        assert.equal(await page.$$eval('[data-recommendation-item]', items => items.length), 1, locale + ': broken advanced identities excluded');
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
        await page.waitForSelector('.designer-paper .document-content');
        await page.click('[data-designer-next]');
        await page.waitForSelector('.reportPaper .document-content');
        const output = await page.$eval('.document-content', el => ({ text: el.textContent, scroll: el.scrollWidth, width: el.clientWidth }));
        assert.ok(output.text.includes(words[1]) && output.text.includes(words[2]), locale + ': retained controls in document');
        assert.ok(output.scroll <= output.width + 2, locale + ': document overflow');
        assert.equal(await page.$eval('.document-content', el => el.getAttribute('dir')), locale.startsWith('ar') ? 'rtl' : 'ltr');
        assert.equal(await page.$eval('[data-assessment-profile]', el => el.getAttribute('dir')), locale.startsWith('ar') ? 'rtl' : 'ltr');
        const copyFinished = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error('Clipboard action did not finish')), 15000);
          page.once('dialog', dialog => { clearTimeout(timeout); resolve(dialog.message()); });
        });
        await page.click('[data-export-copy]');
        const copyMessage = await copyFinished;
        // The copy notification dialog can return before Chrome restores tab focus.
        await page.bringToFront();
        await page.waitForFunction(() => document.hasFocus());
        const copied = await page.evaluate(async () => {
          const items = await navigator.clipboard.read();
          return { text: await navigator.clipboard.readText(), html: await (await items[0].getType('text/html')).text() };
        });
        assert.ok(copied.text.includes(words[1]) && copied.text.includes(words[2]) && copied.text.includes('Unrelated manual input'), locale + ': clipboard text: ' + copyMessage);
        assert.ok(copied.html.includes('<table') && copied.html.includes('data-assessment-profile'), locale + ': clipboard formatted document');
        const pdf = path.resolve(`artifacts/recommendations/${locale}.pdf`);
        await page.click('[data-export-pdf]');
        const downloaded = path.join(downloadDir, 'JSA_Report_Regression fixture.pdf');
        let ready = false;
        for (let attempt = 0; attempt < 60; attempt++) {
          try { ready = (await fs.stat(downloaded)).size > 5000; } catch { /* Wait for the actual download to finish. */ }
          if (ready) break;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        assert.ok(ready, locale + ': actual Export PDF download');
        await fs.copyFile(downloaded, pdf);
        assert.ok((await fs.stat(pdf)).size > 5000, locale + ': PDF emitted');
        if (process.platform === 'linux') {
          const info = cp.execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
          assert.match(info, /Pages:\s+1\b/, locale + ': one-page fixture PDF');
          assert.match(info, /Page size:\s+841[^\n]+595/, locale + ': A4 landscape PDF');
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
        await page.goto(url + '&legacy=1&uiLocale=en-US', { waitUntil: 'networkidle0' });
        await page.waitForSelector('.reportPaper table');
        const legacy = await page.$eval('.reportPaper', el => ({ text: el.textContent, dir: el.dir }));
        const translated = await page.evaluate(async lng => {
          const { default: i18n } = await import('/src/i18n.js');
          const t = i18n.getFixedT(lng, 'analysis');
          return { unconfirmed: t('review.unconfirmed'), profileLabel: t('review.profileLabel'), hazardLabel: i18n.getFixedT(lng, 'export')('tags.DATA_HAZARD') };
        }, locale);
        assert.ok(legacy.text.includes(words[1]) && legacy.text.includes(translated.unconfirmed), locale + ': legacy unconfirmed control');
        assert.ok(legacy.text.includes(translated.profileLabel), locale + ': legacy assessment language');
        assert.ok(legacy.text.includes(translated.hazardLabel), locale + ': legacy column title follows document language');
        assert.equal(legacy.dir, locale.startsWith('ar') ? 'rtl' : 'ltr');
        assert.deepEqual(errors, [], locale + ': complete editor/export errors');
        await page.goto(url + '&case=1', { waitUntil: 'networkidle0' });
        await page.waitForSelector('[data-case-step]');
        assert.equal(await page.$eval('[data-case-start]', el => el.disabled), true);
        await page.click('[data-case-step]');
        assert.equal(await page.$eval('[data-case-start]', el => el.disabled), true);
        await page.click('[data-case-condition="isolated-task"]');
        assert.equal(await page.$eval('[data-case-start]', el => el.disabled), false);
        await page.click('[data-case-condition="live-intervention"]');
        assert.equal(await page.$eval('[data-case-start]', el => el.disabled), true);
        await page.click('[data-case-condition="live-intervention"]');
        await page.click('[data-case-start]');
        await page.waitForSelector('[data-info-next]'); await page.click('[data-info-next]');
        await page.waitForSelector('[data-procedure-next]'); await page.click('[data-procedure-next]');
        await page.waitForSelector('[data-analysis-type="3-step"]'); await page.click('[data-analysis-type="3-step"]');
        await page.waitForSelector('[data-recommend-current]');
        assert.deepEqual(await controls(), [words[0], '', '']);
        await page.click('[data-recommend-current]');
        await page.waitForSelector('[data-reviewed-evidence]');
        assert.equal(await page.$eval('[data-recommendation-item]', el => el.dataset.score), '0.72');
        await page.click('[data-recommendation-item]');
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.click('[data-current-confirmed]'); await page.click('[data-recommend-advanced]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.8"]'); await page.click('[data-recommendation-item]');
        assert.deepEqual(await controls(), [words[0], words[1], words[2]]);
        await page.waitForFunction(() => {
          const id = sessionStorage.getItem('smartjsa_active_draft_id');
          const draft = JSON.parse(localStorage.getItem('smartjsa_guest_draft:' + id) || 'null');
          return draft?.analysis_data?.[0]?.risks?.[0]?.advanced_recommendation?.reference?.kind === 'knowledge';
        });
        const caseDraft = await page.evaluate(() => JSON.parse(localStorage.getItem('smartjsa_guest_draft:' + sessionStorage.getItem('smartjsa_active_draft_id'))));
        assert.equal(caseDraft.analysis_data[0].frequency, null);
        assert.equal(caseDraft.analysis_data[0].severity, null);
        assert.equal(caseDraft.analysis_data[0].riskLevel, null);
        await page.evaluate(() => window.analysisFixture.reviseCase());
        const staleMessage = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error('Stale source was not blocked')), 10000);
          page.once('dialog', dialog => { clearTimeout(timeout); resolve(dialog.message()); });
        });
        await page.click('[data-recommend-current]'); await staleMessage;
        assert.equal(await page.$('[data-recommendation-item]'), null);
        assert.deepEqual(await controls(), [words[0], words[1], words[2]]);
        assert.deepEqual(errors, [], locale + ': complete case journey errors');
        results.push({ locale, extraction: true, recommendations: true, confirmation: true, manualEdit: true, guestSaveRestore: true,
          documentDesigner: true, export: true, clipboard: true, pdfDownload: true, legacyExportWithEnglishUi: true,
          caseSelection: true, requiredAndExcludedConditions: true, infoProcedureAnalysis: true, reviewedRecommendationPercent: true, sourceRevisionInvalidation: true });
      } catch (error) {
        await fs.writeFile(`artifacts/recommendations/${locale}-failure.html`, await page.content());
        console.error(JSON.stringify({ locale, errors, failure: error.message, text: (await page.$eval('body', el => el.innerText)).slice(-2500) }));
        throw error;
      } finally { await page.close(); }
    }
    await fs.writeFile('artifacts/recommendations/browser-results.json', JSON.stringify({ data: 'isolated data, guest storage, real Analysis/DocumentDesigner/Export and PDF/clipboard; not live DB/account testing', results }, null, 2));
    console.log('ANALYSIS_BROWSER_RESULTS ' + JSON.stringify(results));
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
