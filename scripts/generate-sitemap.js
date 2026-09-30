import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buildSitemap } from './sitemap-data.js';
import { readAllCaseStudies } from '../src/pages/caseStudyAdminTools.js';
import { buildCaseManifest } from './case-build-data.js';
import { loadPublicJsaRows, buildPublicJsaManifest } from './public-jsa-build-data.js';

// Public read-only client, matching the existing site's project.
const supabase = createClient('https://aajvezmhyrdawxxbulqz.supabase.co', 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh');

try {
  const exported = process.env.JSA_CASE_EXPORT
    ? JSON.parse(fs.readFileSync(process.env.JSA_CASE_EXPORT, 'utf8')) : null;
  const rows = exported ? (Array.isArray(exported) ? exported : exported.posts)
    : await readAllCaseStudies(supabase);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No case-study records available.');
  if (exported?.row_count != null && exported.row_count !== rows.length) throw new Error('Export row count mismatch.');

  const publicJsaRows = await loadPublicJsaRows(supabase);
  const manifest = buildCaseManifest(rows);
  const publicJsaManifest = buildPublicJsaManifest(publicJsaRows);
  const xml = buildSitemap(rows, publicJsaRows);
  // Do not overwrite a valid sitemap with partial results on a network/DB error.
  const target = new URL('../public/sitemap.xml', import.meta.url);
  const temporary = new URL('../public/sitemap.xml.tmp', import.meta.url);
  fs.writeFileSync(temporary, xml);
  fs.renameSync(temporary, target);
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync('.cache/case-build-manifest.json', JSON.stringify(manifest, null, 2));
  fs.writeFileSync('.cache/public-jsa-build-manifest.json', JSON.stringify(publicJsaManifest, null, 2));
  console.log(`sitemap.xml generated with ${manifest.length} case studies and ${publicJsaManifest.length} indexable public JSA pages.`);
} catch (error) {
  console.error('Sitemap generation failed; existing sitemap preserved:', error.message);
  process.exitCode = 1;
}
