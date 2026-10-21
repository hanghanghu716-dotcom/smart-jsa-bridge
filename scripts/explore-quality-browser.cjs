const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const puppeteer = require('puppeteer');
const base = 'http://127.0.0.1:4197';
const fixture = {
  id: '10000000-0000-4000-8000-000000000001', is_public: true, public_country: 'US', public_locale: 'en-US',
  title: 'Pine Workbench Leg Glue-Up and Mortise Preparation', created_at: '2026-10-18T00:00:00Z',
  form_data: { projectName: 'Pine Workbench', jsaType: '3-step' },
  publication_context: { scope: 'Six steps for pine workbench legs. Excludes sawing, finishing and load certification.' },
  analysis_data: [
    { proc: { stepTitle: 'Prepare timber and clamp the joint', stepDetail: 'Inspect the mortise before gluing.' }, risks: [{ factor: 'Sharp edges and pinch points can injure hands.', current_measure: 'Cut away from the body. Do not lift by clamps.', recommend_measure: 'Wear safety glasses.' }] },
  ],
  tags: ['철강/제강','자동차제조','밸브조작','촉매교체','승강기작업','내장/목공','왕복동/끼임위험','날카로운모서리','보호구(보안경)'],
};
(async () => {
  const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4197', '--strictPort'], { stdio: 'ignore', windowsHide: true });
  let browser;
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 250)); }
    browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), args: ['--no-sandbox'] });
    const page = await browser.newPage(), errors = [], interceptedWrites = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = request.url();
      if (url.startsWith(base) || url.startsWith('data:') || url.startsWith('blob:')) return request.continue();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,OPTIONS' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 200, headers, body: '' });
      if (!['GET','HEAD'].includes(request.method())) { interceptedWrites.push(url); return request.abort(); }
      const data = url.includes('/public_jsa_catalog') ? [fixture] : [];
      return request.respond({ status: 200, headers: { ...headers, 'content-type': 'application/json', 'content-range': '0-0/1', 'access-control-expose-headers': 'content-range' }, body: JSON.stringify(data) });
    });
    await fs.mkdir('.cache', { recursive: true });
    const results = [];
    for (const locale of ['en-US','ko','ja-JP','ar-SA','en-SG','fr-CA-QC']) {
      await page.setViewport({ width: 1440, height: 1000 });
      await page.goto(base + '/' + locale + '/explore?country=all', { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-explore-excerpt]');
      const tags = await page.$$eval('[data-explore-tag]', nodes => nodes.map(node => node.textContent));
      assert.ok(tags.length > 0 && tags.length <= 5);
      if (locale !== 'ko') assert.ok(tags.every(label => !/[가-힣]/u.test(label)), locale);
      assert.ok(!tags.some(label => /Automotive|Elevator|Valve Operation/.test(label)));
      assert.equal(await page.$eval('[data-explore-excerpt]', node => node.textContent), fixture.publication_context.scope);
      await page.$eval('[data-explore-tag]', node => node.click());
      await page.waitForFunction(() => new URL(location.href).searchParams.has('tag'));
      const selected = new URL(page.url()).searchParams.get('tag');
      assert.ok(fixture.tags.includes(selected), 'Filters must use canonical IDs');
      for (const width of [320, 390]) {
        await page.setViewport({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), locale + ': mobile overflow');
      }
      if (locale === 'en-US' || locale === 'ar-SA') await page.screenshot({ path: '.cache/explore-quality-' + locale + '-mobile.png', fullPage: true });
      results.push({ locale, tags: tags.length, mobile: true });
    }
    const state = { formData: { ...fixture.form_data, saveVisibility: 'public' }, analysisData: [
      ...fixture.analysis_data,
      { proc: { stepTitle: 'ㅂReinstate interfaces', stepDetail: 'Inspect interfaces.' }, risks: [{ factor: 'Unexpected start', measure: 'Isolate' }, { factor: 'Trapped hands', measure: 'Guard' }] },
    ], participants: [], openSaveDialog: true };
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(base + '/en-US/export', { waitUntil: 'networkidle0' });
    await page.evaluate(state => history.replaceState({ usr: state }, '', location.href), state);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.publication-quality', { visible: true });
    // Review hints and text warnings are separate visible sections. Check both.
    assert.match(await page.$$eval('.publication-quality', nodes => nodes.map(node => node.textContent).join('\n')), /Step 2.*ㅂReinstate/s);
    assert.equal(await page.$eval('[data-save-mode="public"]', node => node.disabled), true, 'Consent stays required');
    await page.$eval('.publication-consent input', node => node.click());
    assert.equal(await page.$eval('[data-save-mode="public"]', node => node.disabled), false, 'Warning does not add a publishing gate');
    await page.screenshot({ path: '.cache/explore-quality-publish-desktop.png', fullPage: true });
    assert.deepEqual(errors, []);
    assert.equal(interceptedWrites.length, 0, 'The isolated check must not submit any data');
    console.log(JSON.stringify({ results, publishingWarning: true, nonBlockingWarning: true, noRuntimeErrors: true, noWrites: true }));
  } finally { if (browser) await browser.close(); preview.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
