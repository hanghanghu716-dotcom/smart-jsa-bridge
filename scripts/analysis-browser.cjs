const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const puppeteer = require('puppeteer');
  const mock = path.resolve('scripts/analysis-fixture/supabase.js');
  const server = await createServer({ configFile: false, plugins: [
    { name: 'analysis-fixture-data', enforce: 'pre', resolveId(id) { return /(?:^|\/)supabaseClient(?:\.js)?$/.test(id) ? mock : null; } }, react()
  ], server: { host: '127.0.0.1', port: 0, hmr: false }, appType: 'spa' });
  let browser;
  try {
    await server.listen();
    const port = server.httpServer.address().port;
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || (process.platform === 'win32'
      ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome'), headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setRequestInterception(true);
    page.on('request', request => /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::|\/)/.test(request.url()) || /^(?:data|blob):/.test(request.url())
      ? request.continue() : request.abort());
    const errors = [], dialogs = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
    await page.goto(`http://127.0.0.1:${port}/scripts/analysis-fixture/index.html`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector('.analysis-candidates label input');
    await page.click('.analysis-candidates label input');
    const button = async (selector, text) => page.$$eval(selector, (elements, value) => {
      const found = elements.find(el => el.textContent.trim().includes(value));
      if (!found) throw Error('Missing button ' + value);
      found.click();
    }, text);
    await button('.analysis-candidates button', 'Add Selected');
    await page.waitForSelector('.analysis-selected tbody tr');
    await button('.analysis-selected button', 'Recommend');
    await page.waitForFunction(() => document.body.textContent.includes('Text similarity 72.0%'));
    assert.equal(await page.evaluate(() => document.body.textContent.includes('Unrelated high score')), false);
    const selectControl = async text => page.evaluate(value => {
      const element = [...document.querySelectorAll('div')].find(el => el.style.cursor === 'pointer' && el.textContent.includes(value) && el.textContent.includes('Text similarity'));
      if (!element) throw Error('Missing recommendation ' + value);
      element.click();
    }, text);
    await selectControl('Isolate the line');
    await page.waitForFunction(() => document.querySelectorAll('.analysis-selected textarea')[1]?.value === 'Isolate the line');
    await button('.analysis-selected button', 'Advanced');
    await page.waitForFunction(() => document.body.textContent.includes('Text similarity 80.0%'));
    await selectControl('Verify absence of pressure');
    await page.waitForFunction(() => document.querySelectorAll('.analysis-selected textarea')[2]?.value === 'Verify absence of pressure');
    await page.click('.analysis-selected textarea');
    await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
    await page.keyboard.type('Noise instead of pressure');
    await page.waitForFunction(() => document.body.textContent.includes('The input changed.'));
    const controls = await page.$$eval('.analysis-selected textarea', elements => elements.map(el => el.value));
    assert.deepEqual(controls, ['Noise instead of pressure', 'Isolate the line', 'Verify absence of pressure']);
    let dialogTimer;
    const noDataDialog = new Promise((resolve, reject) => {
      dialogTimer = setTimeout(() => reject(Error('No-data dialog was not shown')), 10000);
      page.once('dialog', dialog => { clearTimeout(dialogTimer); resolve(dialog); });
    });
    await button('.analysis-selected button', 'Recommend');
    await noDataDialog;
    assert.ok(dialogs.some(text => text.includes('No linked data')));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ flow: 'hazard extraction -> current -> additional -> manual edit',
      languageSpecificScores: ['72.0%', '80.0%'], staleLinkRejected: true, userTextPreserved: true,
      browserErrors: errors.length, data: 'isolated fixture only; no production requests' }));
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
