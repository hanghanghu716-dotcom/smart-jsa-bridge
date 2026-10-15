// Keep the build-time and browser checks on exactly the same source fields.
export const CASE_SOURCE_FIELDS = ['id', 'post_group_id', 'language_code', 'title', 'meta_title', 'meta_description',
  'content_md', 'schema_markup', 'pdf_download_url', 'pdf_list'];
export const caseSourceContent = post => JSON.stringify(CASE_SOURCE_FIELDS.map(key => post[key] ?? null));
export async function caseSourceFingerprint(post) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(caseSourceContent(post)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
