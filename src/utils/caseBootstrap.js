let initialCase = null;

export function captureCaseBootstrap(document, pathname) {
  initialCase = null;
  const script = document.getElementById('jsa-case-bootstrap');
  if (!script) return null;
  try {
    const value = JSON.parse(script.textContent);
    if (value.path === pathname && value.post?.id && typeof value.post.content_md === 'string'
      && Array.isArray(value.availableLocales)) initialCase = value;
  } catch { /* A malformed snapshot falls back to the normal data request. */ }
  return initialCase;
}

export function getCaseBootstrap(pathname) {
  return initialCase?.path === pathname ? initialCase : null;
}

// React 19 hoists metadata into head. A new client root must not leave
// prerendered, unowned tags ahead of the current article's metadata.
export function clearPrerenderedCaseMetadata(document) {
  const selectors = [
    'title', 'meta[name="description"]', 'meta[name="robots"]',
    'meta[property^="og:"]', 'meta[name^="twitter:"]',
    'link[rel="canonical"]', 'link[rel="alternate"][hreflang]',
  ];
  document.head.querySelectorAll(selectors.join(',')).forEach(node => node.remove());
}
