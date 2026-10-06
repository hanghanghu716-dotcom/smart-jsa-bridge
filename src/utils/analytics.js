// Run GA in a separate, same-origin document. Enhanced measurement cannot read
// the application's forms, links, titles or history, even if enabled in GA Admin.
export const MEASUREMENT_ID = 'G-73YTNRN5KJ';
export const CONSENT_KEY = 'smartjsa_analytics_consent_v1';
export const OPT_OUT_KEY = 'smartjsa_analytics_opt_out';
export const ANALYTICS_CHANGE_EVENT = 'smartjsa:analytics-preference';
const COOKIE_AGE = 180 * 24 * 60 * 60;
const locales = 'ko|en-US|en-CA|en-CA-AB|en-CA-ON|en-CA-BC|fr-CA-QC|en-AU|en-GB|en-SG|de-DE|ja-JP|fr-FR|it-IT|es-ES|ar-SA|pt-BR|ru-RU';
const publicRoute = new RegExp(`^/(${locales})(?:/(about|explore|dictionary|jrajsa|regulation|riskclassification|protectiveequipment|terms|privacy|archive)|/(guideline)/(common|construction|manufacturing|chemical|high-risk|general)|/(case-study)/[a-zA-Z0-9_-]+|/(public-jsa)/[a-fA-F0-9-]{36})?/?$`);
export function publicAnalyticsPath(path) {
  // Never include query strings, fragments, document titles or user content.
  const match = publicRoute.exec(path);
  return match ? path.replace(/\/$/, '') : null;
}
export function analyticsHost(location, userAgent = '') {
  return location.protocol === 'https:' && ['smartjsabridge.com', 'www.smartjsabridge.com'].includes(location.hostname) && !/ReactSnap|HeadlessChrome/i.test(userAgent);
}
export function analyticsOptedOut(storage) {
  try {
    const explicit = storage.getItem(OPT_OUT_KEY);
    if (explicit !== null) return explicit !== 'false';
    // Keep an existing visitor's refusal when removing the opt-in banner.
    return JSON.parse(storage.getItem(CONSENT_KEY))?.choice === 'denied';
  } catch { return true; }
}
export function clearAnalyticsCookies(doc, hostname) {
  const names = doc.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga(?:_[a-zA-Z0-9]+)?$/.test(n));
  for (const name of names) for (const domain of ['', hostname, 'smartjsabridge.com']) {
    doc.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ''}`;
  }
}
export function startAnalyticsFrame(win, doc) {
  if (win.parent === win || win.location.pathname !== '/analytics-frame.html' || !analyticsHost(win.location, win.navigator.userAgent)) return;
  let started = false, previous = '', lastSequence = -1;
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  function message(event) {
    if (event.source !== win.parent || event.origin !== win.location.origin) return;
    const data = event.data;
    if (data?.type !== 'smartjsa:page-view' || analyticsOptedOut(win.localStorage)) return;
    const path = publicAnalyticsPath(data.path);
    if (!path || !Number.isSafeInteger(data.sequence) || data.sequence <= lastSequence) return;
    lastSequence = data.sequence;
    if (!started) {
      win.dataLayer = [];
      win.gtag = function () { win.dataLayer.push(arguments); };
      // Automatic analytics configuration, not a record of affirmative user consent.
      win.gtag('consent', 'default', { ...denied, analytics_storage: 'granted' });
      win.gtag('js', new Date());
      win.gtag('config', MEASUREMENT_ID, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_expires: COOKIE_AGE, cookie_update: false,
        page_location: win.location.origin + path, page_referrer: '', page_title: 'Smart JSA Bridge',
      });
      const script = doc.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      doc.head.appendChild(script);
      started = true;
    }
    win.gtag('event', 'page_view', {
      send_to: MEASUREMENT_ID, page_location: win.location.origin + path,
      page_referrer: previous ? win.location.origin + previous : '', page_title: 'Smart JSA Bridge',
    });
    previous = path;
  }
  win.addEventListener('message', message);
  return () => win.removeEventListener('message', message);
}
if (typeof window !== 'undefined') startAnalyticsFrame(window, document);
