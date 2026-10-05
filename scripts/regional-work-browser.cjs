// Isolated UI test: all remote requests are intercepted; no real account or DB writes.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');
const root = path.join(__dirname, '..'), base = process.env.WORK_TEST_URL || 'http://127.0.0.1:5174';
const country = process.env.WORK_TEST_COUNTRY || 'SG';
const screenLocale = process.env.WORK_TEST_LOCALE || 'ko';
const expectedCount = country === 'KR' ? 3 : 4;
const includePermit = process.env.WORK_TEST_PERMIT === '1';
const taskTypes = (process.env.WORK_TEST_TASKS || '').split(',').filter(Boolean);
const user = { id: '10000000-0000-4000-8000-000000000001', email: 'regional-test@example.invalid', aud: 'authenticated', role: 'authenticated' };
const token = [{ alg: 'HS256', typ: 'JWT' }, { sub: user.id, exp: Math.floor(Date.now()/1000)+3600 }, 'fixture'].map(x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url')).join('.');
const source = { id: '20000000-0000-4000-8000-000000000001', title: 'Pipe isolation example', form_data: { projectName: 'Pipe isolation', equipment: 'Valve lock', ppe: ['Helmet'], permits: [] }, analysis_data: [{ proc: { stepTitle: 'Isolation', stepDetail: 'Identify the pipe' }, frequency: 2, severity: 3, riskLevel: 6, risks: [{ factor: 'Stored pressure', current_measure: 'Isolate supply', recommend_measure: 'Verify zero energy' }] }], custom_layout: {} };
let saved, output, uploads = 0;
const errors = [];
(async () => {
  const { getWorkPackageUi } = await import(pathToFileURL(path.join(root, 'src/locales/workPackageUi.js')));
  const { workContextUi, WORK_JURISDICTIONS } = await import(pathToFileURL(path.join(root, 'src/utils/workJurisdiction.js')));
  const { regionalTemplates } = await import(pathToFileURL(path.join(root, 'src/utils/regionalWorkTemplates.js')));
  const jurisdiction = WORK_JURISDICTIONS.find(j => j.id === country);
  const ui = getWorkPackageUi(screenLocale), regionUi = workContextUi(screenLocale);
  const documentLocale = process.env.WORK_TEST_DOCUMENT_LOCALE || jurisdiction.locale;
  const qaName = country + (process.env.WORK_TEST_DOCUMENT_LOCALE ? '-' + documentLocale : '');
  const qa = path.join(root, '.cache/regional-qa', process.env.WORK_TEST_OUTPUT_GROUP || '', qaName);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  try {
    const p = await browser.newPage(); await p.setViewport({ width: 1440, height: 1000 });
    p.on('pageerror', e => errors.push(String(e))); p.on('dialog', d => d.accept());
    await p.setRequestInterception(true);
    p.on('request', r => {
      const url = r.url();
      if (url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:')) return r.continue();
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS' };
      if (r.method() === 'OPTIONS') return r.respond({ status: 200, headers, body: '' });
      let result = [], body;
      if (url.includes('/auth/v1/user')) result = user;
      else if (url.includes('/storage/v1/object/')) { uploads++; result = { Key: 'fixture.pdf' }; }
      else if (url.includes('/rest/v1/work_packages')) {
        if (['POST','PATCH'].includes(r.method())) {
          body = JSON.parse(r.postData()); saved = { ...body, id: '30000000-0000-4000-8000-000000000001', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; result = r.method() === 'POST' ? saved : [saved];
        } else result = saved ? (new URL(url).searchParams.has('id') ? saved : [saved]) : [];
      } else if (url.includes('/rest/v1/work_outputs') && r.method() === 'POST') { output = JSON.parse(r.postData()); result = { ...output, created_at: new Date().toISOString() }; }
      else if (url.includes('/rest/v1/jsa_projects')) result = new URL(url).searchParams.has('id') ? source : [source];
      else if (!url.includes('/rest/v1/')) return r.abort();
      return r.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(result) });
    });
    await p.evaluateOnNewDocument(s => {
      localStorage.setItem('sb-aajvezmhyrdawxxbulqz-auth-token', JSON.stringify(s));
      const original = URL.createObjectURL; URL.createObjectURL = function(blob) { if (blob.type === 'application/pdf') window.testPdfBlob = blob; return original.call(this, blob); };
    }, { access_token: token, refresh_token: 'fixture', expires_at: Math.floor(Date.now()/1000)+3600, user });
    // A save can replace the editor between separate lookup/click evaluations.
    const click = async text => { await p.waitForFunction(t => {
      const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t && !b.disabled);
      if (!button) return false;
      button.click(); return true;
    }, {}, text); };
    const fill = async (selector, value) => p.$eval(selector, (el,v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el,v); el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    await p.goto(base + '/' + screenLocale + '/work-packages', { waitUntil: 'networkidle0' }); await click(ui.create);
    await p.waitForSelector('.regional-work-context select');
    await p.select('.regional-work-context select', country);
    if (process.env.WORK_TEST_DOCUMENT_LOCALE) {
      await p.waitForFunction(value => {
        const select = document.querySelectorAll('.regional-work-context select')[1];
        if (!select || ![...select.options].some(option => option.value === value)) return false;
        select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); return true;
      }, {}, documentLocale);
    }
    if (country === 'AU') await p.select('.regional-work-context label:last-child select', 'yes');
    await p.waitForSelector('.regional-catalog select option[value="' + source.id + '"]');
    await p.select('.regional-catalog select', source.id); await click(regionUi.addPack);
    await p.waitForFunction(n => document.querySelectorAll('.work-document-list li').length === n, {}, expectedCount);
    const entries = regionalTemplates({ jurisdiction: country, documentLocale, highRiskConstruction: 'yes' });
    if (includePermit) {
      for (const topic of taskTypes) await p.click(`.regional-task-checks input[value="${topic}"]`);
      await click(entries.find(e => e.kind === 'permit_to_work').title + ' +');
      await p.waitForFunction(n => document.querySelectorAll('.work-document-list li').length === n, {}, expectedCount + 1);
    }
    assert.ok((await p.$eval('.work-document-list', el => el.textContent)).includes(entries[0].title));
    await fill('input[placeholder="' + ui.packageNameHint + '"]', 'Singapore pipe package');
    fs.mkdirSync(qa, { recursive: true });
    await p.screenshot({ path: path.join(qa,'editor-desktop.png'), fullPage: true });
    await p.setViewport({ width: 390, height: 844 });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await p.screenshot({ path: path.join(qa,'editor-mobile.png') });
    await p.setViewport({ width: 1440, height: 1000 });
    await click(ui.savePackage); await click(ui.continueWork);
    assert.equal(saved.data.context.jurisdiction, country); assert.equal(saved.data.documents.length, expectedCount + Number(includePermit));
    if (taskTypes.length) {
      const permit = saved.data.documents.find(d => d.canonicalType === 'permit_to_work');
      assert.deepEqual([...permit.regional.taskReviews.map(r => r.topic)].sort(), [...taskTypes].sort());
      assert.ok(permit.blocks.some(b => b.field?.key === taskTypes[0] + '.applicability'));
    }
    await p.waitForSelector('.bundle-paper');
    assert.ok((await p.$eval('.bundle-paper', el => el.textContent)).includes(getWorkPackageUi(documentLocale).projectName));
    assert.equal(await p.$eval('.bundle-paper', el => getComputedStyle(el).direction), documentLocale.startsWith('ar') ? 'rtl' : 'ltr');
    if (documentLocale.startsWith('ar')) assert.equal(await p.$$eval('.bundle-paper td', cells => getComputedStyle(cells.find(cell => cell.textContent.trim() === '2 / 3 / 6')).direction), 'ltr', 'Risk scores must not reverse in Arabic output');
    assert.match(await p.$eval('.bundle-preview', el => el.textContent), /Isolate supply/);
    assert.equal(await p.$$eval('button', (bs,t) => bs.find(b => b.textContent.trim() === t).disabled, ui.pdf), true);
    await p.click('.work-region-review input');
    await p.$eval('.bundle-preview', el => el.scrollIntoView());
    await p.screenshot({ path: path.join(qa,'preview.png') });
    assert.equal(await p.$$eval('.bundle-paper', papers => papers.every(paper => paper.scrollWidth <= paper.clientWidth + 1)), true, 'No horizontal overflow in document previews');
    const layout = await p.$$eval('.bundle-paper', papers => papers.map(paper => ({
      title: paper.querySelector('h2')?.textContent, orientation: paper.dataset.orientation,
      height: paper.getBoundingClientRect().height,
      tables: [...paper.querySelectorAll('table')].map(table => ({
        top: table.getBoundingClientRect().top - paper.getBoundingClientRect().top,
        bottom: table.getBoundingClientRect().bottom - paper.getBoundingClientRect().top,
      })),
      fields: [...paper.querySelectorAll('.printed-field')].map(section => {
        const label = section.querySelector('h3'), value = section.querySelector('div');
        return { label: label.textContent, fontSize: parseFloat(getComputedStyle(label).fontSize),
          blankHeight: value.getBoundingClientRect().height,
          overlap: label.getBoundingClientRect().bottom > value.getBoundingClientRect().top + 1 };
      }),
    })));
    for (const paper of layout) for (const field of paper.fields) {
      assert.ok(field.fontSize >= 14, 'Do not shrink field titles to fit pages');
      assert.ok(field.blankHeight >= 44, 'Retain handwriting space');
      assert.equal(field.overlap, false, field.label);
    }
    if (['CA', 'SG', 'AU'].includes(country)) {
      const papers = await p.$$('.bundle-paper');
      await papers[papers.length - 1].screenshot({ path: path.join(qa, 'inspection.png') });
    }
    await p.evaluate(() => {
      window.testPdfSlices = [];
      const original = CanvasRenderingContext2D.prototype.drawImage;
      window.restorePdfProbe = () => { CanvasRenderingContext2D.prototype.drawImage = original; };
      CanvasRenderingContext2D.prototype.drawImage = function(...args) {
        const [source,x,y,w,h,dx,dy,dw,dh] = args;
        if (args.length === 9 && source instanceof HTMLCanvasElement && x === 0 && dx === 0 && dy === 0 &&
          source.width === this.canvas.width && w === source.width && dw === w && h === dh && h === this.canvas.height) {
          window.testPdfSlices.push({ width: source.width, height: source.height, start: y, end: y+h });
        }
        return original.apply(this, args);
      };
    });
    await click(ui.pdf); await p.waitForFunction(() => Boolean(window.testPdfBlob), { timeout: 60000 });
    const slices = await p.evaluate(() => { window.restorePdfProbe(); return window.testPdfSlices; });
    const paperSlices = [];
    for (const slice of slices) {
      if (slice.start === 0) paperSlices.push([]);
      paperSlices[paperSlices.length-1].push(slice);
    }
    assert.equal(paperSlices.length, layout.length, 'Capture each selected document exactly once');
    for (let i=0; i<layout.length; i++) {
      const paper=layout[i], pages=paperSlices[i], ratio=pages[0].height/paper.height;
      const pagePixels=Math.floor((paper.orientation === 'portrait' ? 277/190 : 190/277)*pages[0].width);
      for (const table of paper.tables) if ((table.bottom-table.top)*ratio <= pagePixels*0.4) {
        for (const page of pages.slice(0,-1)) assert.ok(page.end <= table.top*ratio || page.end >= table.bottom*ratio,
          `${paper.title}: short table must stay with its header`);
      }
      for (let j=1;j<pages.length;j++) assert.equal(pages[j].start, pages[j-1].end, 'No missing or duplicated image rows');
    }
    assert.equal(uploads, 1); assert.equal(output.snapshot.context.jurisdiction, country);
    assert.equal(output.snapshot.regionalReviewed, true); assert.ok(output.snapshot.documents.every(d => d.regional.version));
    const bytes = await p.evaluate(async () => Array.from(new Uint8Array(await window.testPdfBlob.arrayBuffer())));
    assert.equal(Buffer.from(bytes).subarray(0,4).toString(), '%PDF');
    fs.writeFileSync(path.join(root,'.cache/regional-qa/output.pdf'), Buffer.from(bytes));
    fs.writeFileSync(path.join(root,`.cache/regional-qa/output-${country}.pdf`), Buffer.from(bytes));
    fs.writeFileSync(path.join(qa,'output.pdf'), Buffer.from(bytes));
    const pageCount = (Buffer.from(bytes).toString('latin1').match(/\/Type \/Page\b/g) || []).length;
    if (process.env.WORK_TEST_PRINT === '1') {
      // Intercept only the test browser's print dialog; exercise the real app button
      // and iframe, then use Chromium print emulation to check physical pagination.
      await p.evaluate(() => {
        const observer = new MutationObserver(records => {
          for (const record of records) for (const node of record.addedNodes) {
            if (node.tagName === 'IFRAME' && node.title === 'Print work documents') {
              node.contentWindow.print = () => { window.testPrintHtml = node.contentDocument.documentElement.outerHTML; };
              observer.disconnect();
            }
          }
        });
        observer.observe(document.body, { childList: true });
      });
      await click(ui.print);
      await p.waitForFunction(() => Boolean(window.testPrintHtml), { timeout: 60000 });
      assert.equal(uploads, 1, 'Printing an existing artifact must not archive again');
      const printPage = await browser.newPage();
      await printPage.setContent(await p.evaluate(() => window.testPrintHtml), { waitUntil: 'load' });
      assert.equal(await printPage.$$eval('section', nodes => nodes.length), pageCount);
      assert.equal(await printPage.$$eval('img', nodes => nodes.every(n => n.complete && n.naturalWidth)), true);
      const printBytes = await printPage.pdf({ path: path.join(qa, 'print.pdf'), preferCSSPageSize: true, printBackground: true });
      assert.equal((printBytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length, pageCount, 'Print must not add blank pages or omit PDF pages');
      await printPage.close();
    }
    fs.writeFileSync(path.join(qa, 'layout.json'), JSON.stringify({ country, screenLocale, documentLocale, pageCount, layout, paperSlices }, null, 2));
    // Visually checked English fixture: RA 3, SWP 2, meeting 2, inspection 2.
    if (country === 'SG' && !includePermit && documentLocale === 'en-SG') assert.equal((Buffer.from(bytes).toString('latin1').match(/\/Type \/Page\b/g) || []).length, 9, 'Reviewed fixture pagination must stay stable');
    // Existing JSA export also honours the explicit document language, including signatures.
    if (country === 'SG') {
      await p.evaluate(snapshot => history.pushState({ usr: snapshot }, '', '/ko/export'), {
        formData: { ...source.form_data, jsaType: '3-step', context: { jurisdiction: 'SG', documentLocale: 'en-SG' } },
        analysisData: source.analysis_data, participants: [],
        documentBlocks: ['PROJECT_INFO','PARTICIPANTS','JSA_TABLE'].map(id => ({ id, enabled: true })),
        savedActiveOrder: ['DATA_STEP_TITLE','DATA_HAZARD','DATA_CURRENT_MEASURE'],
      });
      await p.reload({ waitUntil: 'networkidle0' });
      await p.waitForSelector('[data-signature-label]');
      assert.match(await p.$eval('[data-signature-label]', el => el.textContent), /sign/i);
      assert.doesNotMatch(await p.$eval('.reportPaper', el => el.textContent), /참여자/);
      assert.match(await p.$eval('.reportPaper', el => el.textContent), /Isolate supply/);
      assert.doesNotMatch(await p.$eval('.reportPaper', el => el.textContent), /undefined/);
      const legacyPdf = await p.evaluate(async () => {
        const { createReportPdf } = await import('/src/utils/reportPdf.js');
        const result = await createReportPdf([{ element: document.querySelector('.reportPaper'), orientation: 'landscape' }]);
        return { pages: result.images.length, bytes: Array.from(new Uint8Array(await result.blob.arrayBuffer())) };
      });
      assert.equal(legacyPdf.pages, 1, 'A small existing JSA export still fits one page');
      fs.writeFileSync(path.join(qa, 'export-jsa.pdf'), Buffer.from(legacyPdf.bytes));
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${country}/${screenLocale}/${documentLocale}${includePermit ? ' + PTW' : ''}: source JSA mapping, regional vocabulary, mobile editor, package persistence payload, review gate, real PDF generation and immutable output snapshot (mocked remote storage).`);
  } finally {
    // Close only this test browser through DevTools. Old Puppeteer uses a
    // Windows process-tree kill which can hang on an already-exited child.
    try { const session = await browser.target().createCDPSession(); await session.send('Browser.close'); } catch { /* connection closes with the browser */ }
    browser.disconnect();
  }
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
