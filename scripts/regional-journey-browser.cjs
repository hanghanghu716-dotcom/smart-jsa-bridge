// Isolated fixtures only: every external request is intercepted, never a live DB write.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');
const root = path.join(__dirname, '..');
const base = process.env.JOURNEY_TEST_URL || 'http://127.0.0.1:5187';
const output = path.join(root, '.cache/regional-journey-qa');

(async () => {
  const { SUPPORTED_LANGS } = await import(pathToFileURL(path.join(root, 'src/locales/config.js')));
  const { journeyContext, newJourneyState } = await import(pathToFileURL(path.join(root, 'src/utils/regionalJourney.js')));
  const { defaultPaperSize, paperDimensions } = await import(pathToFileURL(path.join(root, 'src/utils/paperFormat.js')));
  const { REGIONAL_MAIN_COPY } = await import(pathToFileURL(path.join(root, 'src/locales/regionalMainCopy.js')));
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const errors = [], checked = []; let p;
  try {
    p = await browser.newPage();
    p.setDefaultTimeout(30000);
    await p.setViewport({ width: 1440, height: 1000 });
    await p.setRequestInterception(true);
    p.on('pageerror', error => errors.push(error.message));
    p.on('dialog', dialog => dialog.accept());
    p.on('request', request => {
      if (request.url().startsWith(base + '/') || /^(data|blob):/.test(request.url())) return request.continue();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 200, headers, body: '' });
      if (!request.url().includes('/rest/v1/')) return request.abort();
      const url = new URL(request.url()); let result = [];
      if (url.pathname.endsWith('/case_studies') && url.searchParams.has('post_group_id')) result = [{ id: 'fixture-case', post_group_id: 'journey-example', language_code: 'en-US', title: 'Pipe isolation example', content_md: '# Original fixture\n\nThis is the unchanged example body.', created_at: '2026-10-01', pdf_list: [{ name: 'Original example', url: base + '/fixture.pdf' }] }];
      if (url.pathname.endsWith('/rpc/discovery_links')) result = [{ id: '11111111-1111-4111-8111-111111111111', locale: 'en-US', title: 'Linked public JSA' }];
      return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(result) });
    });
    await p.evaluateOnNewDocument(() => {
      if (!localStorage.getItem('smartjsa_theme_preference')) localStorage.setItem('smartjsa_theme_preference', 'light');
      const original = URL.createObjectURL;
      URL.createObjectURL = function(blob) {
        if (blob.type === 'application/pdf') window.journeyPdf = blob;
        return original.call(this, blob);
      };
    });
    const clickText = async (selector, text) => p.$eval(selector, (element, value) => {
      const button = [...element.querySelectorAll('button')].find(b => b.textContent.includes(value));
      if (!button) throw Error('Missing action: ' + value); button.click();
    }, text);
    const savePdf = async name => {
      await p.waitForFunction(() => window.journeyPdf && !document.querySelector('.regional-journey[aria-busy="true"]'), { timeout: 60000 });
      const encoded = await p.evaluate(async () => {
        const bytes = new Uint8Array(await window.journeyPdf.arrayBuffer()); let value = '';
        for (let start = 0; start < bytes.length; start += 8192) value += String.fromCharCode(...bytes.slice(start, start + 8192));
        return btoa(value);
      });
      const buffer = Buffer.from(encoded, 'base64'); fs.writeFileSync(path.join(output, name + '.pdf'), buffer);
      return [...buffer.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(m => [Number(m[1]) * 25.4 / 72, Number(m[2]) * 25.4 / 72]);
    };
    const openGuideEntry = async locale => {
      await p.goto(`${base}/${locale}/guideline/common#COMMON-03`, { waitUntil: 'networkidle0' });
      await p.waitForSelector('#COMMON-03 .regional-example-start');
      if (await p.$eval('#COMMON-03 .regional-example-start', el => el.getAttribute('aria-expanded') !== 'true')) await p.click('#COMMON-03 .regional-example-start');
      await p.waitForSelector('.regional-journey-fields select');
    };
    for (const locale of process.env.JOURNEY_SKIP_LOCALES ? [] : process.env.JOURNEY_LOCALES?.split(',') || SUPPORTED_LANGS) {
      await p.goto(`${base}/${locale}/`, { waitUntil: 'networkidle0' });
      await p.waitForSelector('.main-entry-copy');
      assert.equal(await p.$('.regional-journey'), null, 'No duplicate document entry on home');
      assert.equal(await p.$eval('.main-entry-copy h2', el => el.textContent), REGIONAL_MAIN_COPY[locale].title);
      assert.equal(await p.$eval('.main-case-link', el => el.hash), '#case-studies');
      assert.equal(await p.$$eval('#task-examples a[href*="#"]', nodes => nodes.length), 9);
      for (const width of [1440, 390]) {
        await p.setViewport({ width, height: 900 });
        await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await p.$eval('.main-entry-copy', el => { const b=el.getBoundingClientRect(); return b.left>=0 && b.right<=innerWidth && b.bottom<=innerHeight && el.scrollWidth<=el.clientWidth+1; }), true, locale+' home fits viewport');
        const buttons = await p.$$eval('.main-entry-actions button', nodes => nodes.map(el => ({ primary: el.classList.contains('main-entry-primary'), radius: getComputedStyle(el).borderRadius })));
        assert.deepEqual(buttons.map(b=>b.primary), [true, false]);
        assert.ok(buttons.every(b=>b.radius==='64px'));
      }
      await p.setViewport({ width: 1440, height: 1000 });
      await openGuideEntry(locale);
      const values = await p.$$eval('.regional-journey-fields select', elements => elements.map(e => e.value));
      assert.deepEqual(values, [journeyContext(locale).jurisdiction, locale, defaultPaperSize(journeyContext(locale).jurisdiction)]);
      await p.$eval('.regional-journey', element => element.scrollIntoView());
      if (['en-US', 'ko', 'ar-SA', 'fr-CA-QC'].includes(locale)) await p.screenshot({ path: path.join(output, `${locale}-desktop.png`) });
      await p.setViewport({ width: 390, height: 844 });
      assert.equal(await p.$eval('.regional-journey', el => el.scrollWidth <= el.clientWidth + 1), true, locale + ' panel overflow');
      const bounds = await p.$$eval('.regional-journey-fields select', nodes => nodes.map(n => ({ left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right })));
      assert.ok(bounds.every(b => b.left >= 0 && b.right <= 391), locale + ' mobile controls');
      if (['ar-SA', 'de-DE', 'ja-JP'].includes(locale)) await p.screenshot({ path: path.join(output, `${locale}-mobile.png`) });
      await p.setViewport({ width: 1440, height: 1000 });
      await p.evaluate(() => { window.journeyPdf = null; });
      await p.click('.regional-journey-actions button:nth-child(2)');
      const dimensions = await savePdf(`blank-${locale}`), expected = paperDimensions(values[2]);
      assert.equal(dimensions.length, 1, locale + ' blank PDF pages');
      assert.ok(Math.abs(dimensions[0][0] - expected.width) < .05 && Math.abs(dimensions[0][1] - expected.height) < .05, locale + ' PDF size');
      checked.push(locale); console.log('Entry, mobile and blank PDF:', locale);
    }
    if (!checked.length) await p.goto(base + '/en-US/', { waitUntil: 'networkidle0' });
    await p.evaluate(() => localStorage.setItem('smartjsa_theme_preference', 'dark'));
    await openGuideEntry('en-US');
    await p.$eval('.regional-journey', element => element.scrollIntoView({ block: 'center' }));
    await p.screenshot({ path: path.join(output, 'entry-dark.png') });
    await p.evaluate(() => localStorage.setItem('smartjsa_theme_preference', 'light'));
    // The working country must survive a document-language change and starting a new draft.
    await openGuideEntry('en-US');
    await p.select('.regional-journey-fields label:nth-of-type(2) select', 'es-ES');
    await p.$eval('.regional-journey', element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.evaluate(() => {
      sessionStorage.setItem('smartjsa_active_draft_id', 'previous-fixture');
      localStorage.setItem('smartjsa_guest_draft:previous-fixture', 'keep previous work');
    });
    await p.click('.regional-journey-primary');
    await p.waitForFunction(() => location.pathname.endsWith('/info'));
    let state = await p.evaluate(() => history.state.usr);
    assert.equal(state.formData.context.jurisdiction, 'US'); assert.equal(state.formData.context.documentLocale, 'es-ES'); assert.equal(state.paperSize, 'letter');
    assert.equal(await p.evaluate(() => localStorage.getItem('smartjsa_guest_draft:previous-fixture')), 'keep previous work');
    // Same-document anchor navigation and example selection.
    await p.goto(base + '/ko/', { waitUntil: 'networkidle0' });
    await p.click('#task-examples a[href$="#COMMON-03"]');
    await p.waitForSelector('#COMMON-03 .regional-example-start');
    await p.waitForFunction(() => Math.abs(document.getElementById('COMMON-03').getBoundingClientRect().top) < 60);
    await p.click('#COMMON-03 .regional-example-start');
    const activity = await p.$eval('#COMMON-03 h3', el => el.textContent);
    await p.click('#COMMON-03 .regional-journey-primary');
    await p.waitForFunction(() => location.pathname.endsWith('/info'));
    state = await p.evaluate(() => history.state.usr);
    assert.equal(state.formData.projectName, activity); assert.deepEqual(state.analysisData, []);
    // The original case and PDFs stay intact, and the linked public JSA is easy to find.
    await p.goto(base + '/en-US/case-study/journey-example', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.regional-journey');
    assert.equal(await p.$eval('a[href$="/fixture.pdf"]', el => el.href), base + '/fixture.pdf');
    await p.waitForSelector('.discovery-links a');
    assert.match(await p.$eval('.discovery-links a', el => el.href), /\/en-US\/public-jsa\/11111111/);
    assert.ok((await p.$eval('.toastui-editor-contents', el => el.textContent)).includes('unchanged example body'));
    await p.screenshot({ path: path.join(output, 'case-start.png'), fullPage: true });
    // Real renderer: mixed paper sizes and orientations, row-aware pagination and print metadata.
    const mixed = await p.evaluate(async () => {
      const { createReportPdf } = await import('/src/utils/reportPdf.js');
      const papers = [];
      for (const paperSize of ['letter', 'a4']) for (const orientation of ['portrait', 'landscape']) {
        const element = document.createElement('div');
        element.style.cssText = 'width:700px;background:white;color:black;position:absolute;left:-10000px;top:0';
        element.innerHTML = '<table style="width:100%;border-collapse:collapse">' + Array.from({ length: 28 }, (_, i) => `<tr><td style="height:48px;border:1px solid black">${paperSize} ${orientation} row ${i}</td></tr>`).join('') + '</table>';
        document.body.append(element); papers.push({ element, paperSize, orientation });
      }
      const result = await createReportPdf(papers); window.journeyPdf = result.blob;
      papers.forEach(paper => paper.element.remove());
      return result.images.map(image => ({ paperSize: image.paperSize, orientation: image.orientation }));
    });
    const boxes = await savePdf('mixed-paper-output');
    assert.equal(boxes.length, mixed.length); assert.ok(boxes.length >= 8);
    boxes.forEach((box, i) => { const expected = paperDimensions(mixed[i].paperSize, mixed[i].orientation); assert.ok(Math.abs(box[0] - expected.width) < .05 && Math.abs(box[1] - expected.height) < .05); });
    // Designer and final output must use document language independently of screen language.
    const designerState = newJourneyState({ ...journeyContext('en-US'), documentLocale: 'es-ES', activity: 'Local fixture' });
    designerState.analysisData = [{ proc: { stepTitle: 'Inspección' }, risks: [{ factor: 'Fixture', measure: 'Fixture control' }], frequency: 1, severity: 1, riskLevel: 1 }];
    await p.evaluate(state => { history.replaceState({ usr: state, key: 'fixture' }, '', '/en-US/document-designer'); location.reload(); }, designerState);
    await p.waitForSelector('.designer-paper');
    assert.equal(await p.$eval('.regional-paper-select select', e => e.value), 'letter');
    assert.ok((await p.$eval('.designer-paper', e => e.textContent)).includes('Inspección'));
    await p.select('.regional-paper-select select', 'a4');
    await clickText('body', 'Final Output');
    await p.waitForSelector('.reportPaper');
    assert.equal(await p.$eval('.regional-paper-select select', e => e.value), 'a4');
    await p.select('.regional-paper-select select', 'letter');
    await clickText('body', 'Document Designer');
    await p.waitForSelector('.designer-paper');
    assert.equal(await p.$eval('.regional-paper-select select', e => e.value), 'letter');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ passed: true, locales: checked, mixedPdfPages: boxes.length, errors }, null, 2));
    console.log('PASS: all regional entry, guide, case, language, paper, draft and PDF checks');
  } catch (error) {
    console.error('Failure at', p?.url(), errors);
    if (p) await p.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
