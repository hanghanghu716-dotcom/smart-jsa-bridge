const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');
const base = 'http://127.0.0.1:4198';
const modes = { large: 12, small: 24, details: 48 };
const records = Array.from({ length: 97 }, (_, i) => ({
  id: '10000000-0000-4000-8000-' + String(i).padStart(12, '0'), is_public: true,
  public_country: 'US', public_locale: 'en-US', title: `Document ${i + 1}: Valve isolation and inspection before maintenance`,
  created_at: '2026-10-18T00:00:00Z', form_data: { jsaType: '3-step' },
  analysis_data: [{ proc: { stepTitle: 'Inspect the valve', stepDetail: 'Confirm isolation and access before inspection.' }, risks: [{ factor: 'Unexpected release of pressure.', measure: 'Isolate and verify zero energy.' }] }],
  tags: ['밸브조작', '고압유체/압력'], view_count: 12345, reuse_count: 17, scrap_count: 10,
}));
(async () => {
  const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4198', '--strictPort'], { stdio: 'ignore', windowsHide: true });
  let browser;
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 250)); }
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), args: ['--no-sandbox'] });
    const page = await browser.newPage(), requests = [], errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = request.url();
      if (url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')) return request.continue();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,OPTIONS' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 200, headers, body: '' });
      if (!['GET','HEAD'].includes(request.method())) { writes.push(url); return request.abort(); }
      const p = new URL(url).searchParams;
      let data = [];
      if (url.includes('/public_jsa_catalog')) {
        const metadata = p.get('select') === 'id,tags';
        if (!metadata) requests.push(Object.fromEntries(p));
        const offset = Number(p.get('offset') || 0), size = Number(p.get('limit'));
        assert.ok(metadata ? size === 500 : [12,24,48].includes(size), 'Document bodies must be bounded by selected view');
        data = records.slice(offset, offset + size).map(row => ({ ...row, public_country: p.get('public_country')?.slice(3) || 'US' }));
      }
      return request.respond({ status: 200, headers: { ...headers, 'content-type': 'application/json', 'content-range': `${p.get('offset') || 0}-${Number(p.get('offset') || 0) + data.length - 1}/97`, 'access-control-expose-headers': 'content-range' }, body: JSON.stringify(data) });
    });
    const ready = async (view, count) => {
      await page.waitForFunction((mode, expected) => {
        const selected = document.querySelector(`[data-explore-view="${mode}"][aria-pressed="true"]`);
        const rows = document.querySelectorAll(mode === 'details' ? '.explore-details tbody tr' : '#explore-results > article');
        return selected && rows.length === expected && document.querySelector('#explore-results')?.getAttribute('aria-busy') === 'false';
      }, { timeout: 20000 }, view, count);
    };
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(base + '/en-US/explore', { waitUntil: 'networkidle0' });
    await ready('large', 12);
    assert.equal(requests.at(-1).limit, '12');
    for (const [view, size] of Object.entries(modes)) {
      await page.goto(base + '/en-US/explore?view=' + view, { waitUntil: 'networkidle0' });
      await ready(view, size);
      await page.click('.list-pagination-number[href*="page=1"]');
      await ready(view, size);
      await page.waitForFunction(expected => (document.querySelector('#explore-results > article > h2, .explore-details-title')?.textContent || '').includes(`Document ${expected}:`), {}, size + 1);
      assert.equal(requests.at(-1).offset, String(size));
      await page.click('.list-pagination-last');
      await ready(view, 1);
      assert.equal(new URL(page.url()).searchParams.get('page'), String(Math.ceil(97 / size) - 1));
      assert.match(await page.$eval('#explore-results', node => node.textContent), /Document 97:/);
    }
    await page.goto(base + '/en-US/explore?country=KR&author=operator&q=valve&tag=gas&sort=views&page=3', { waitUntil: 'networkidle0' });
    await ready('large', 12);
    await page.click('[data-explore-view="details"]');
    await ready('details', 48);
    for (const [key, value] of Object.entries({ public_country: 'eq.KR', is_operator: 'eq.true', title: 'ilike.%valve%', tags: 'cs.{gas}', order: 'view_count.desc,id.asc', limit: '48', offset: '0' })) assert.equal(requests.at(-1)[key], value, key);
    assert.equal(new URL(page.url()).searchParams.get('q'), 'valve');
    await page.goBack();
    await ready('large', 12);
    assert.equal(requests.at(-1).offset, '36');
    await fs.mkdir('.cache', { recursive: true });
    for (const locale of ['en-US','ko','ja-JP','ar-SA','en-SG','fr-CA-QC']) {
      for (const [view, size] of Object.entries(modes)) {
        await page.setViewport({ width: 1440, height: 1000 });
        await page.goto(`${base}/${locale}/explore?country=all&view=${view}`, { waitUntil: 'networkidle0' });
        await ready(view, size);
        const title = await page.$eval('h1', node => node.textContent);
        const desktopHeight = await page.$eval('#explore-results', node => node.getBoundingClientRect().height);
        if (locale === 'en-US') {
          await page.$eval('.explore-results-heading', node => node.scrollIntoView());
          await page.screenshot({ path: `.cache/explore-view-${view}-desktop.png` });
        }
        for (const width of [320,390]) {
          await page.setViewport({ width, height: 900 });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert.ok(overflow <= 1, `${locale}/${view}/${width}: overflow ${overflow}`);
        }
        if (locale === 'ko') { await page.$eval('.explore-view-toolbar', node => node.scrollIntoView()); await page.screenshot({ path: `.cache/explore-view-${view}-mobile.png` }); }
        assert.ok(title); assert.ok(desktopHeight > 0);
      }
    }
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    console.log(JSON.stringify({ passed: true, views: modes, locales: 6, mobileWidths: [320,390], writes: writes.length, requests: requests.length }));
  } finally { await browser?.close(); preview.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
