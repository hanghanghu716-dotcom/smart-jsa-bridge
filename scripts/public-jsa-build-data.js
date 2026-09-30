import fs from 'node:fs';
import { assessPublicJsaQuality, publicJsaDescription } from '../src/utils/publicJsaQuality.js';

export const publicJsaRoute = project => {
  const quality = assessPublicJsaQuality(project);
  return quality.locale && project?.id ? `/${quality.locale}/jsa/${encodeURIComponent(project.id)}` : null;
};

export async function loadPublicJsaRows(client) {
  const result = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await client
      .from('jsa_projects')
      .select('id,title,is_public,form_data,analysis_data,created_at,updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .range(from, from + size - 1);
    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < size) return result;
  }
}

export function buildPublicJsaManifest(rows) {
  return (rows || [])
    .filter(project => project?.is_public && assessPublicJsaQuality(project).indexable)
    .map(project => {
      const route = publicJsaRoute(project);
      return {
        route,
        id: project.id,
        updated_at: project.updated_at || project.created_at || '',
        title: `${project.title} | Smart JSA Bridge`,
        description: publicJsaDescription(project)
      };
    })
    .filter(item => item.route)
    .sort((a, b) => a.route.localeCompare(b.route));
}

const decodeHtml = value => String(value || '').replace(/&(?:amp|quot|apos|lt|gt|#39|#x27);/g, entity => ({
  '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'", '&lt;': '<', '&gt;': '>',
}[entity]));

const normalize = value => decodeHtml(value).replace(/[\t\n\f\r ]+/g, ' ').trim();

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

export function verifyPublicJsaHtml(html, expected) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const title = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  if (normalize(title) !== normalize(expected.title)) {
    throw new Error(`Missing or stale public JSA title: ${expected.route}`);
  }

  const descriptions = [...head.matchAll(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
    .map(match => attributes(match[0]))
    .filter(attrs => attrs.name === 'description');
  if (descriptions.length !== 1 || normalize(descriptions[0].content) !== normalize(expected.description)) {
    throw new Error(`Missing or stale public JSA description: ${expected.route}`);
  }

  const canonicals = [...head.matchAll(/<link\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
    .map(match => attributes(match[0]))
    .filter(attrs => attrs.rel === 'canonical');
  const expectedCanonical = `https://smartjsabridge.com${expected.route}`;
  if (canonicals.length !== 1 || decodeHtml(canonicals[0].href) !== expectedCanonical) {
    throw new Error(`Missing or mismatched public JSA canonical: ${expected.route}`);
  }

  const robots = [...head.matchAll(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)]
    .map(match => attributes(match[0]))
    .find(attrs => attrs.name === 'robots');
  if (!robots || !String(robots.content || '').startsWith('index')) {
    throw new Error(`Indexable public JSA rendered as noindex: ${expected.route}`);
  }

  const idPattern = new RegExp(`data-public-jsa-id=(?:"|')?${expected.id}(?:"|')?`, 'i');
  if (!idPattern.test(html)) throw new Error(`Rendered public JSA missing id marker: ${expected.route}`);
  return true;
}

export function verifyBuiltPublicJsas(manifest, outputDirectory = 'dist') {
  for (const expected of manifest) {
    const filename = `${outputDirectory}${expected.route}/index.html`;
    if (!fs.existsSync(filename)) throw new Error(`Missing public JSA snapshot: ${expected.route}`);
    verifyPublicJsaHtml(fs.readFileSync(filename, 'utf8'), expected);
  }
  return manifest.length;
}
