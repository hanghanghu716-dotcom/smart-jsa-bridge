export const ADSTERRA_CHOICE_KEY = 'smartjsa_adsterra_choice_v1';
export const ADSTERRA_CHANGE_EVENT = 'smartjsa-adsterra-change';
export const ADSTERRA_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export const ADSTERRA_HOSTS = ['smartjsabridge.com', 'www.smartjsabridge.com'];

export function validAdsterra(config) {
  if (config?.enabled !== true || !['160x600','160x300','728x90','300x250'].includes(config.width+'x'+config.height)
    || !/^[a-f0-9]{32}$/.test(config.key || '')) return false;
  try {
    const url = new URL(config.scriptUrl);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && !url.search && !url.hash && url.hostname === 'bauval.org'
      && url.pathname === '/22/' + config.key;
  } catch { return false; }
}

export function adsterraHost(location, userAgent = '') {
  return location?.protocol === 'https:' && ADSTERRA_HOSTS.includes(location.hostname)
    && !/ReactSnap|HeadlessChrome|bot|crawler|spider/i.test(userAgent);
}

export function adsterraPath(pathname) {
  return /^\/(?:ko|en-US|en-CA|en-CA-AB|en-CA-ON|en-CA-BC|fr-CA-QC|en-AU|en-GB|en-SG|ja-JP|de-DE|fr-FR|it-IT|es-ES|ar-SA|pt-BR|ru-RU|ro-RO)(?:\/(?:case-study\/[a-z0-9-]+|about|archive|jrajsa|regulation|riskclassification|protectiveequipment|guideline\/[a-z-]+|dictionary|info|analysis|procedure|library|profile|layoutbuilder|layout-module|layout-table))?\/?$/.test(pathname || '');
}

export function adsterraChoice(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(ADSTERRA_CHOICE_KEY));
    if (!['allowed', 'denied'].includes(value?.choice) || !Number.isFinite(value?.time)
      || value.time > now || now - value.time >= ADSTERRA_MAX_AGE) return null;
    return value;
  } catch { return null; }
}

export function storeAdsterraChoice(storage, allow, now = Date.now()) {
  const value = { choice: allow ? 'allowed' : 'denied', time: now };
  storage.setItem(ADSTERRA_CHOICE_KEY, JSON.stringify(value));
  return value;
}

export function adsterraFrameHtml(config) {
  if (!validAdsterra(config)) return '';
  // All interpolated values have been validated; user or document data is never included.
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Advertisement</title><style>html,body{margin:0;width:' + config.width + 'px;height:' + config.height + 'px;overflow:hidden}iframe{border:0}</style></head><body>'
    + '<script>window.atOptions=' + JSON.stringify({key:config.key,format:'iframe',height:config.height,width:config.width,params:{}}) + ';</script>'
    + '<script src="' + config.scriptUrl + '"></script></body></html>';
}

export const ADSTERRA_FRAME_CSP = "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors https://smartjsabridge.com https://www.smartjsabridge.com; form-action 'none'; sandbox allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox; script-src 'unsafe-inline' https:; style-src 'unsafe-inline' https:; img-src data: https:; frame-src https:; connect-src https:; font-src data: https:";

export function adsterraCanLoad(choice, policy, browser = {}) {
  if (!policy || policy.blocked === true || browser.globalPrivacyControl === true
    || browser.doNotTrack === '1' || choice?.choice === 'denied') return false;
  return choice?.choice === 'allowed' || policy.requiresConsent === false;
}
export function createAdsterraPolicyLoader(fetcher = (...args) => fetch(...args)) {
  let pending;
  return () => {
    if (!pending) pending = Promise.resolve().then(() => fetcher('/api/adsterra-policy', {
      cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(5000),
    })).then(async response => {
      if (!response.ok) throw new Error('Policy unavailable');
      const policy = await response.json();
      return { requiresConsent: policy?.requiresConsent !== false, blocked: policy?.blocked === true };
    }).catch(() => ({ requiresConsent: true, blocked: false }));
    return pending;
  };
}
