import { fixtureText } from './text.js';
export function fixtureCasePost(locale) {
  return { id: `SYNTHETIC-${locale}`, post_group_id: 'SYNTHETIC-CASE-NOT-PRODUCTION', language_code: locale,
    title: fixtureText[locale.split('-')[0]][0], content_md: 'SYNTHETIC SOURCE FOR UI TESTING ONLY' };
}
