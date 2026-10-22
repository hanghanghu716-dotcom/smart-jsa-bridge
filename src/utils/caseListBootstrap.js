export function caseListBootstrap() {
  if (typeof window === 'undefined') return [];
  const data = window.__CASE_LIST__;
  return data?.locale === window.location.pathname.split('/')[1] && Array.isArray(data.rows) ? data.rows : [];
}

// Build the live-list template without querying every case again for each
// locale. The public server injects current rows into the HTML on each request.
export function isStaticContentBuild(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  return /ReactSnap SmartJSA(?:Static|Guide)Build/.test(userAgent);
}
