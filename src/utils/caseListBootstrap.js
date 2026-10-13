export function caseListBootstrap() {
  if (typeof window === 'undefined') return [];
  const data = window.__CASE_LIST__;
  return data?.locale === window.location.pathname.split('/')[1] && Array.isArray(data.rows) ? data.rows : [];
}
