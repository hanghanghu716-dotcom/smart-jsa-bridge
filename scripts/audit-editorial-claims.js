import fs from 'node:fs';
import { findUnsupportedProfessionalReviewClaims } from '../src/pages/caseStudyAdminTools.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage: npm run audit:editorial -- path/to/case_studies_export.json');
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(path, 'utf8'));
const posts = Array.isArray(payload) ? payload : payload.posts;
if (!Array.isArray(posts)) throw new Error('Expected an array or an export object with a posts array.');

let flagged = 0;
for (const post of posts) {
  const claims = findUnsupportedProfessionalReviewClaims(post.content_md || '');
  if (!claims.length) continue;
  flagged += 1;
  console.log('\n[' + (post.id ?? '?') + '] ' + (post.language_code || '') + ' / ' + (post.post_group_id || ''));
  console.log(post.title || '(untitled)');
  for (const claim of claims) console.log('  - ' + claim.replace(/\s+/g, ' ').slice(0, 400));
}

console.log('\nFlagged posts: ' + flagged + ' / ' + posts.length);
if (flagged) process.exitCode = 1;
