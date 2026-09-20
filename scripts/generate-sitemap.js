import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { buildSitemap, loadCaseRows } from './sitemap-data.js';

// Public read-only client, matching the existing site's project.
const supabase = createClient('https://aajvezmhyrdawxxbulqz.supabase.co', 'sb_publishable_cufRFMwEfGJxlH_UH5Yxog_PSlzSdPh');

try {
  const rows = await loadCaseRows(supabase);
  const xml = buildSitemap(rows);
  // Do not overwrite a valid sitemap with partial results on a network/DB error.
  const target = new URL('../public/sitemap.xml', import.meta.url);
  const temporary = new URL('../public/sitemap.xml.tmp', import.meta.url);
  fs.writeFileSync(temporary, xml);
  fs.renameSync(temporary, target);
  console.log('sitemap.xml generated from verified case-study language records.');
} catch (error) {
  console.error('Sitemap generation failed; existing sitemap preserved:', error.message);
  process.exitCode = 1;
}
