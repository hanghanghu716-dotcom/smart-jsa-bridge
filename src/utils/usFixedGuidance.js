import content from '../data/us-fixed-guidance.json';

// Scope by URL: other locales can fall back to en-US translations, but must
// never inherit US-only regulatory statements or editorial changes implicitly.
export function usFixedGuidance(pathname, namespace) {
  return /^\/en-US(?:\/|$)/.test(pathname) ? content[namespace] || null : null;
}

export function fixedGuidanceText(guidance, key) {
  return key.split('.').reduce((value, part) => value?.[part], guidance?.copy);
}
