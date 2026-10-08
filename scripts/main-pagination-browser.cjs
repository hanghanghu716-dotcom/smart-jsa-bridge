// Run against the local Vite server. All remote requests are mocked; no account or DB writes.
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5187';
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().startsWith(base + '/') || /^(data|blob):/.test(request.url())) return request.continue();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      const locale = new URL(page.url()).pathname.split('/')[1];
      const rows = Array.from({ length: 78 }, (_, index) => ({
        post_group_id: `fixture-${index + 1}`,
        title: `Example ${String(index + 1).padStart(2, '0')}`,
        meta_description: index < 12 ? 'SearchSubset' : 'Other examples',
        language_code: locale,
        created_at: new Date(Date.UTC(2026, 0, 100 - index)).toISOString(),
      }));
      if (request.url().includes('/rest/v1/')) return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(request.url().includes('/case_studies') ? rows : []) });
      return request.abort();
    });
    const input = '.case-page-jump input';
    const active = () => page.$eval('.case-pagination [aria-current="page"]', e => Number(e.textContent));
    const numbers = () => page.$$eval('.case-pagination-numbers button', es => es.map(e => Number(e.textContent)));
    async function click(selector, options) {
      await page.$eval(selector, e => e.scrollIntoView({ behavior: 'instant', block: 'center' }));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.click(selector, options);
    }
    async function enter(value, button = false) {
      await click(input, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      if (value) await page.type(input, value);
      if (button) await click('.case-page-jump button');
      else await page.keyboard.press('Enter');
    }
    for (const locale of ['ko', 'en-US', 'ja-JP', 'ar-SA', 'fr-CA-QC', 'en-SG']) {
      await page.setViewport({ width: 390, height: 844 });
      await page.goto(base + '/' + locale + '/', { waitUntil: 'networkidle0' });
      await page.waitForSelector(input);
      assert.deepEqual(await numbers(), [1, 2, 3, 4, 5]);
      assert.ok(!(await page.$eval('.case-page-jump', e => e.textContent)).includes('casePagination.'));
      await enter('12');
      await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '12');
      assert.deepEqual(await numbers(), [11, 12, 13]);
      assert.equal(await page.$eval('#case-study-results h5', e => e.textContent), 'Example 67');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'case-study-results');
      await enter('3', true);
      await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '3');
      assert.deepEqual(await numbers(), [1, 2, 3, 4, 5]);
      for (const value of ['', '0', '-1', '2.5', 'abc', '14', '1e1']) {
        await enter(value);
        assert.equal(await active(), 3, locale + ' rejects ' + value);
        assert.equal(await page.$eval(input, e => e.getAttribute('aria-invalid')), 'true');
        const error = await page.$eval('.case-page-jump-error', e => e.textContent);
        assert.ok(error.includes('13') && !error.includes('casePagination.'));
      }
      for (const value of ['١٢', '۱۲', '１２']) {
        await enter(value);
        await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '12');
        assert.equal(await active(), 12, 'Localized digits ' + value);
      }
      await click('.case-pagination-previous');
      await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '6');
      assert.equal(await page.$eval(input, e => e.value), '6');
      await click('.case-pagination-next');
      await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '11');
      assert.equal(await page.$eval(input, e => e.value), '11');
      for (const width of [320, 390, 1440]) {
        await page.setViewport({ width, height: 900 });
        const fits = await page.$eval('.case-pagination', e => {
          const r = e.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth && e.scrollWidth <= e.clientWidth + 1;
        });
        assert.ok(fits, locale + ' pagination fits ' + width);
      }
      const search = '#case-studies input:not(.case-page-jump input)';
      await page.type(search, 'SearchSubset');
      await page.waitForFunction(() => document.querySelector('[aria-current="page"]')?.textContent === '1');
      assert.deepEqual(await numbers(), [1, 2]);
      assert.equal(await page.$eval(input, e => e.value), '1');
      await enter('3');
      assert.equal(await active(), 1);
      assert.ok((await page.$eval('.case-page-jump-error', e => e.textContent)).includes('2'));
      await click(search, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(search, 'Example 01');
      await page.waitForFunction(() => !document.querySelector('.case-pagination'));
      console.log(locale + ': jump, validation, digit formats, groups, search reset and responsive layout passed');
    }
    assert.deepEqual(errors, []);
    fs.mkdirSync('.cache', { recursive: true });
    fs.writeFileSync('.cache/main-pagination-results.json', JSON.stringify({ passed: true, locales: 6, widths: [320, 390, 1440] }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
