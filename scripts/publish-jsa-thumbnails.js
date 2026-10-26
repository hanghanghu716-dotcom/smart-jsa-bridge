import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import { getPublicSupabaseConfig } from '../server/supabase-config.js';
import { PUBLIC_JSA_FIELDS, publicJsaView } from '../src/utils/publicJsa.js';
import { AUDIENCE } from '../supabase/functions/publish-jsa-thumbnail/policy.js';

const config = getPublicSupabaseConfig();
const endpoint = config.url + '/functions/v1/publish-jsa-thumbnail';
const out = path.resolve('.cache/thumbnail-worker');
fs.mkdirSync(out, { recursive: true });
const publicHeaders = { apikey: config.key, ...(config.key.startsWith('eyJ') ? { Authorization: 'Bearer ' + config.key } : {}) };
async function publicRows(table, query) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(config.url + '/rest/v1/' + table + '?' + new URLSearchParams(query), {
      headers: publicHeaders, signal: AbortSignal.timeout(30000),
    });
    if (response.ok) return response.json();
    if (attempt === 2) throw new Error('PUBLIC_READ_' + response.status);
    await response.arrayBuffer(); await delay(1000);
  }
}
let token, tokenTime = 0;
async function workerToken() {
  if (token && Date.now() - tokenTime < 120000) return token;
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
  url.searchParams.set('audience', AUDIENCE);
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN } });
  if (!response.ok) throw new Error('WORKFLOW_IDENTITY_UNAVAILABLE');
  token = (await response.json()).value; tokenTime = Date.now();
  if (!token) throw new Error('WORKFLOW_IDENTITY_MISSING');
  return token;
}
const forbidden = await fetch(endpoint, { method: 'POST' });
assert.equal(forbidden.status, 401, 'unauthenticated writes must be rejected');
const pending = await publicRows('public_jsa_cards', {
  select: 'id,revision', is_public: 'eq.true', thumbnail_revision: 'is.null',
  order: 'published_at.desc.nullslast,id.asc', limit: '100',
});
console.log(JSON.stringify({ pending: pending.length }));
if (pending.length) {
  const root = process.cwd();
  const server = await createServer({ root, cacheDir: path.join(os.tmpdir(), 'jsa-worker-vite'), server: { host: '127.0.0.1', port: 0, hmr: false }, logLevel: 'error' });
  await server.listen();
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  let browser;
  const results = [], failures = [];
  try {
    browser = await puppeteer.launch({ executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    // Only sanitized public records enter this credential-free rendering browser.
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().startsWith(base) || /^(data|blob):/.test(request.url())) return request.continue();
      return request.respond({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    });
    await page.goto(base + '/ko/jrajsa', { waitUntil: 'networkidle0' });
    for (const item of pending) {
      try {
        const [raw] = await publicRows('public_jsa_catalog', { select: PUBLIC_JSA_FIELDS, id: 'eq.' + item.id, is_public: 'eq.true', limit: '1' });
        const row = publicJsaView(raw);
        if (!row || row.assessment.revision !== item.revision || !row.assessment.checked || row.assessment.review === 'rejected') continue;
        const rendered = await page.evaluate(async row => {
          const { renderRiskThumbnail } = await import('/src/utils/renderRiskThumbnail.jsx');
          const { default: i18n } = await import('/src/i18n.js');
          const image = await renderRiskThumbnail(row, i18n, AbortSignal.timeout(45000));
          const bitmap = await createImageBitmap(image.blob);
          const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
          const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let ink = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 200 || pixels[i + 1] < 200 || pixels[i + 2] < 200) ink++;
          const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(image.blob); });
          return { base64: data.split(',')[1], width: image.width, height: image.height, ink };
        }, row);
        assert.ok(rendered.ink > 1000, 'risk table capture must contain visible content');
        const bytes = Buffer.from(rendered.base64, 'base64');
        const url = endpoint + '?' + new URLSearchParams({ id: item.id, revision: item.revision });
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + await workerToken(), 'Content-Type': 'image/webp' }, body: bytes, signal: AbortSignal.timeout(60000) });
          if (response.ok || response.status === 409 || response.status < 500) break;
          await response.arrayBuffer(); await delay(1500);
        }
        if (response.status === 409) continue;
        assert.ok(response.ok, 'thumbnail publish returned ' + response.status + ': ' + await response.text());
        const live = await fetch('https://smartjsabridge.com/api/jsa-thumbnail?' + new URLSearchParams({ id: item.id, revision: item.revision }), { signal: AbortSignal.timeout(20000) });
        assert.equal(live.status, 200, 'production preview must be anonymously readable after saving');
        assert.equal(live.headers.get('content-type')?.split(';')[0], 'image/webp');
        const served = Buffer.from(await live.arrayBuffer());
        assert.deepEqual(served, bytes, 'production must serve the saved risk image');
        fs.writeFileSync(path.join(out, item.id + '.webp'), bytes);
        results.push({ id: item.id, bytes: bytes.length, width: rendered.width, height: rendered.height });
        console.log(JSON.stringify({ saved: item.id, bytes: bytes.length }));
      } catch (error) { failures.push({ id: item.id, message: error.message }); console.error(JSON.stringify(failures.at(-1))); }
    }
    if (results.length) {
      const livePage = await browser.newPage();
      await livePage.setViewport({ width: 1440, height: 1050 });
      await livePage.goto('https://smartjsabridge.com/ko', { waitUntil: 'networkidle2', timeout: 60000 });
      await livePage.waitForSelector('.home-resource-card .risk-pdf-thumbnail img', { timeout: 30000 });
      const cards = await livePage.$$('.home-resource-card');
      for (const card of cards) {
        await card.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await livePage.waitForFunction(element => element.querySelector('.risk-pdf-thumbnail img')?.naturalWidth === 720, { timeout: 20000 }, card);
      }
      const states = await livePage.$$eval('.home-resource-card', nodes => nodes.map(node => {
        const image = node.querySelector('.risk-pdf-thumbnail img');
        return { title: node.querySelector('h3')?.textContent, width: image?.naturalWidth, visible: image && getComputedStyle(image.parentElement).opacity === '1' };
      }));
      assert.ok(states.length > 0 && states.every(row => row.visible && row.width === 720), 'every home card must show its saved image');
      await cards[0].evaluate(node => node.scrollIntoView({ block: 'start' }));
      await livePage.screenshot({ path: path.join(out, 'production-home.png') });
      fs.writeFileSync(path.join(out, 'production-home.json'), JSON.stringify(states, null, 2));
      console.log(JSON.stringify({ productionHome: states }));
    }
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ generated: results.length, results, failures }, null, 2));
    assert.equal(failures.length, 0, 'some public previews failed; see result.json');
    console.log(JSON.stringify({ generated: results.length, failed: failures.length }));
  } finally { await browser?.close(); await server.close(); }
}
