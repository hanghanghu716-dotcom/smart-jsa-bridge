// Real local GoTrue/PostgREST/PostgreSQL; synthetic accounts and recommendation data only.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

(async () => {
  const status = JSON.parse(await fs.readFile('.cache/auth-integration/status.json', 'utf8'));
  const api = status.API_URL;
  assert.equal(api, 'http://127.0.0.1:54321', 'Refuse all hosted or non-fixture endpoints');
  const anonKey = status.ANON_KEY;
  assert.equal(JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64url')).role, 'anon');
  const { createClient } = await import('@supabase/supabase-js');
  const localFetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    assert.equal(url.origin, api, 'Unexpected outbound Supabase request');
    return fetch(input, { ...init, redirect: 'error' });
  };
  const client = () => createClient(api, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: localFetch },
  });
  const owner = client(), other = client(), anonymous = client();
  const password = randomUUID() + '!Aa9', email = `owner-${randomUUID()}@example.test`;
  for (const [account, address] of [[owner, email], [other, `other-${randomUUID()}@example.test`]]) {
    const signup = await account.auth.signUp({ email: address, password });
    assert.equal(signup.error, null, signup.error?.message);
    assert.ok(signup.data.session?.access_token, 'Real GoTrue signup must issue a session');
    const verified = await account.auth.getUser();
    assert.equal(verified.error, null);
    assert.ok(verified.data.user?.id);
  }
  const ownerId = (await owner.auth.getUser()).data.user.id;
  const { createServer } = await import('vite');
  const { default: react } = await import('@vitejs/plugin-react');
  const { SUPPORTED_LANGS } = await import('../src/locales/config.js');
  const { recommendationContext } = await import('../src/utils/analysisRecommendations.js');
  const { fixtureText } = await import('./analysis-fixture/text.js');
  const realClient = path.resolve('scripts/auth-integration/client.js');
  const server = await createServer({ configFile: false,
    define: { __JSA_AUTH_TEST_CONFIG__: JSON.stringify({ url: api, anonKey }) },
    plugins: [{ name: 'isolated-real-supabase', enforce: 'pre', resolveId(id) {
      return /(?:^|\/)supabaseClient(?:\.js)?$/.test(id) ? realClient : null;
    } }, react()], server: { host: '127.0.0.1', port: 0, hmr: false }, appType: 'spa',
  });
  const results = [], checks = {};
  let browser, lastDraft;
  await fs.mkdir('artifacts/recommendations', { recursive: true });
  const draftById = async (account, id) => {
    const result = await account.from('user_jsa_drafts').select('*').eq('id', id).maybeSingle();
    assert.equal(result.error, null, result.error?.message);
    return result.data;
  };
  const waitForDraft = async (id, predicate) => {
    const deadline = Date.now() + 20000;
    let row;
    do {
      row = await draftById(owner, id);
      if (predicate(row)) return row;
      await new Promise(resolve => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    const risk = row?.analysis_data?.[0]?.risks?.[0];
    throw new Error('Cloud draft did not reach the expected state: ' + JSON.stringify({
      version: row?.version, factor: risk?.factor, hazard_reference: risk?.hazard_reference,
      confirmed: risk?.current_measure_confirmed,
    }));
  };
  const rpcArgs = (row, version, title = row.title) => ({ p_id: row.id, p_expected_version: version,
    p_title: title, p_current_stage: row.current_stage, p_form_data: row.form_data,
    p_participants: row.participants, p_procedures: row.procedures, p_analysis_data: row.analysis_data,
    p_layout_data: row.layout_data, p_source_project_id: row.source_project_id });
  try {
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await require('puppeteer').launch({ executablePath: process.env.CHROME_PATH ||
      (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome'),
    headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    for (const locale of SUPPORTED_LANGS) {
      const context = await browser.createIncognitoBrowserContext(), page = await context.newPage();
      const words = fixtureText[locale.split('-')[0]], errors = [], apiPaths = new Set(), apiFailures = [], draftWrites = [];
      let stage = 'login';
      await page.setViewport({ width: 1440, height: 1100 });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.origin === api) apiPaths.add(url.pathname);
        if (url.origin === api && url.pathname === '/rest/v1/rpc/save_jsa_draft_snapshot' && request.postData()) {
          const payload = JSON.parse(request.postData());
          draftWrites.push({ expectedVersion: payload.p_expected_version,
            factor: payload.p_analysis_data?.[0]?.risks?.[0]?.factor });
        }
        // Never supply a mocked response. Permit only this Vite server and the local API.
        if ([origin, api].includes(url.origin) || ['data:', 'blob:'].includes(url.protocol)) request.continue();
        else request.abort();
      });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', async response => {
        if (response.url().startsWith(api + '/rest/v1/') && response.status() >= 400) {
          const failure = await response.json().catch(() => ({}));
          apiFailures.push({ path: new URL(response.url()).pathname, status: response.status(),
            code: failure.code, message: failure.message });
        }
      });
      page.on('dialog', async dialog => { errors.push(`Unexpected dialog: ${dialog.message()}`); await dialog.dismiss(); });
      const url = `${origin}/scripts/auth-integration/index.html?locale=${locale}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForSelector('input[name="email"]');
        await page.type('input[name="email"]', email);
        await page.type('input[name="password"]', password);
        await page.click('button[type="submit"]');
        stage = 'recommendation selection';
        await page.waitForSelector('.analysis-candidates label input');
        await page.click('.analysis-candidates label input');
        await page.click('[data-add-selected]');
        await page.waitForSelector('.analysis-selected tbody textarea');
        await page.click('[data-recommend-current]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.72"]');
        assert.equal(await page.evaluate(() => document.body.textContent.includes('Unrelated high score')), false);
        await page.click('[data-recommendation-item]');
        await page.waitForFunction(text => document.querySelectorAll('.analysis-selected tbody textarea')[1]?.value === text, {}, words[1]);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.click('[data-current-confirmed]');
        await page.click('[data-recommend-advanced]');
        await page.waitForSelector('[data-recommendation-item][data-score="0.8"]');
        await page.click('[data-recommendation-item]');
        stage = 'cloud autosave';
        const id = await page.evaluate(() => sessionStorage.getItem('smartjsa_active_draft_id'));
        // Read through a separate real API client; the observer must not mutate browser draft versions.
        const saved = await waitForDraft(id, row => row?.analysis_data?.[0]?.risks?.[0]?.recommend_measure === words[2]);
        const risk = saved.analysis_data[0].risks[0];
        assert.equal(saved.user_id, ownerId);
        assert.equal(saved.form_data.context.documentLocale, locale);
        assert.equal(risk.hazard_reference.locale, recommendationContext({}, locale).dataLocale);
        assert.equal(risk.current_recommendation.score, 0.72);
        assert.equal(risk.advanced_recommendation.score, 0.8);
        assert.equal(risk.current_recommendation.scoreKind, 'text_similarity');
        assert.equal(risk.current_measure_confirmed, true);
        assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('smartjsa_guest_draft:'))), false);
        stage = 'cloud restore';
        await page.goto(url + '&restore=1', { waitUntil: 'networkidle0' });
        await page.waitForFunction(text => document.querySelectorAll('.analysis-selected tbody textarea')[2]?.value === text, {}, words[2]);
        assert.deepEqual(await page.$$eval('.analysis-selected tbody textarea', els => els.map(el => el.value)), words);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), true);
        // Editing a restored hazard must invalidate saved recommendation references and confirmation.
        const edited = words[0] + ' — edited';
        await page.click('.analysis-selected tbody textarea');
        await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
        await page.keyboard.type(edited);
        assert.equal(await page.$eval('.analysis-selected tbody textarea', el => el.value), edited, 'Browser input must finish before cloud observation');
        stage = 'edited cloud autosave';
        const editedRow = await waitForDraft(id, row => {
          const risk = row?.analysis_data?.[0]?.risks?.[0];
          return risk?.factor === edited && risk.hazard_reference === null && risk.current_measure_confirmed === false;
        }), editedRisk = editedRow.analysis_data[0].risks[0];
        assert.equal(editedRisk.current_recommendation, null);
        assert.equal(editedRisk.advanced_recommendation, null);
        assert.equal(editedRisk.current_measure, words[1]);
        assert.equal(editedRisk.recommend_measure, words[2]);
        stage = 'edited cloud restore and document';
        await page.goto(url + '&restore=1', { waitUntil: 'networkidle0' });
        await page.waitForFunction(text => document.querySelector('.analysis-selected tbody textarea')?.value === text, {}, edited);
        assert.equal(await page.$eval('[data-current-confirmed]', el => el.checked), false);
        await page.click('[data-analysis-next]');
        await page.waitForSelector('.designer-paper .document-content');
        const document = await page.$eval('.document-content', el => ({ text: el.textContent, dir: el.dir }));
        assert.ok(document.text.includes(words[1]) && document.text.includes(words[2]));
        assert.equal(document.dir, locale.startsWith('ar') ? 'rtl' : 'ltr');
        for (const endpoint of ['/auth/v1/token', '/auth/v1/user', '/rest/v1/Hazards_Translations',
          '/rest/v1/hazard_measure_mappings', '/rest/v1/Current_Measures_Translations',
          '/rest/v1/current_advanced_measure_mappings', '/rest/v1/Advanced_Measures_Translations',
          '/rest/v1/rpc/save_jsa_draft_snapshot', '/rest/v1/user_jsa_drafts']) assert.ok(apiPaths.has(endpoint), endpoint);
        assert.deepEqual(errors, [], `${locale}: browser errors`);
        lastDraft = editedRow;
        results.push({ locale, realAuth: true, realRecommendationRetrieval: true, wrongIdHighScoreExcluded: true,
          percentagesPreserved: true, cloudAutosave: true, reloadFromDatabase: true,
          editedReferencesInvalidated: true, documentRendered: true });
        console.log(`PASS authenticated ${locale}: recommendations, percentages, cloud draft, restore, edit invalidation, document`);
      } catch (error) {
        const ui = await page.evaluate(() => ({
          fields: [...document.querySelectorAll('.analysis-selected tbody textarea')].map(el => el.value),
          status: [...document.querySelectorAll('[role="status"]')].map(el => el.textContent),
          version: sessionStorage.getItem('smartjsa_active_draft_version'),
        })).catch(() => null);
        throw new Error(`${locale} / ${stage}: ${error.message}; browser=${JSON.stringify(errors)}; API=${JSON.stringify(apiFailures)}; writes=${JSON.stringify(draftWrites)}; ui=${JSON.stringify(ui)}`);
      } finally { await context.close(); }
    }

    // Each attack uses an actual anonymous or second-user JWT through PostgREST, never a forged session.
    lastDraft = await draftById(owner, lastDraft.id);
    const anonymousRead = await anonymous.from('user_jsa_drafts').select('id');
    assert.equal(anonymousRead.error?.code, '42501');
    const anonymousRpc = await anonymous.rpc('save_jsa_draft_snapshot', rpcArgs(lastDraft, lastDraft.version));
    assert.equal(anonymousRpc.error?.code, '42501');
    checks.anonymousReadAndRpcDenied = true;
    assert.equal(await draftById(other, lastDraft.id), null);
    for (const action of ['update', 'delete']) {
      const query = action === 'update' ? other.from('user_jsa_drafts').update({ title: 'Unauthorized' }) : other.from('user_jsa_drafts').delete();
      const result = await query.eq('id', lastDraft.id).select('id');
      assert.equal(result.error, null); assert.deepEqual(result.data, []);
    }
    const impersonation = await other.from('user_jsa_drafts').insert({ user_id: ownerId, title: 'Forged owner' });
    assert.equal(impersonation.error?.code, '42501');
    const foreignRpc = await other.rpc('save_jsa_draft_snapshot', rpcArgs(lastDraft, lastDraft.version, 'Unauthorized'));
    assert.ok(foreignRpc.error, 'Cross-account RPC must fail');
    assert.deepEqual(await draftById(owner, lastDraft.id), lastDraft);
    checks.otherAccountReadWriteDeleteAndRpcDenied = true;
    const stale = await owner.rpc('save_jsa_draft_snapshot', rpcArgs(lastDraft, lastDraft.version - 1, 'Stale overwrite'));
    assert.match(stale.error?.message || '', /DRAFT_VERSION_CONFLICT/);
    assert.deepEqual(await draftById(owner, lastDraft.id), lastDraft);
    checks.staleVersionPreservesDraft = true;
    const contenders = await Promise.all(['Concurrent A', 'Concurrent B'].map(title =>
      owner.rpc('save_jsa_draft_snapshot', rpcArgs(lastDraft, lastDraft.version, title))));
    assert.equal(contenders.filter(result => !result.error).length, 1);
    assert.equal(contenders.filter(result => /DRAFT_VERSION_CONFLICT/.test(result.error?.message)).length, 1);
    const final = await draftById(owner, lastDraft.id);
    assert.equal(final.version, lastDraft.version + 1);
    assert.deepEqual(final.analysis_data, lastDraft.analysis_data);
    checks.concurrentSameVersionOneWinner = true;
    console.log('PASS real Auth/PostgREST: anonymous denial, account isolation, stale-write protection, concurrent save');
  } finally {
    if (browser) await browser.close();
    await server.close();
    await fs.writeFile('artifacts/recommendations/authenticated-analysis.json', JSON.stringify({
      schemaVersion: 1, environment: 'disposable-local-supabase', data: 'synthetic',
      productionSchemaParity: false, productionSemanticEvaluation: false,
      complete: results.length === SUPPORTED_LANGS.length && Object.keys(checks).length === 4,
      results, checks,
    }, null, 2) + '\n');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
