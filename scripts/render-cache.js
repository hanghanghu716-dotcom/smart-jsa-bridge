import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getDataLocale, getTranslationFallbacks } from '../src/locales/config.js';

const digest = value => createHash('sha256').update(value).digest('hex');
const schema = 1;
const assetTags = /<script\b[^>]*>[\s\S]*?<\/script\s*>|<link\b[^>]*>/gi;
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
function isBundleTag(tag) {
  if (/^<script\b/i.test(tag)) return attribute(tag, 'type') === 'module' && attribute(tag, 'src')?.startsWith('/assets/');
  return ['stylesheet', 'modulepreload'].includes(attribute(tag, 'rel')) && attribute(tag, 'href')?.startsWith('/assets/');
}

// Keep the rendered content and SEO metadata, but hydrate with THIS release's
// bundle. Translation-only edits can change Vite chunk names for every locale.
export function refreshBundleReferences(html, shell, previousShell = html) {
  const head = shell.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  const tags = (head?.match(assetTags) || []).filter(isBundleTag);
  if (!tags.some(tag => /^<script\b/i.test(tag))) throw Error('Missing current application bundle');
  if (!/<head\b[^>]*>[\s\S]*?<\/head>/i.test(html)) throw Error('Missing cached document head');
  const oldStyles = new Set((previousShell.match(assetTags) || [])
    .filter(tag => attribute(tag, 'rel') === 'stylesheet').map(tag => attribute(tag, 'href')));
  const replaceTag = tag => isBundleTag(tag) && (attribute(tag, 'rel') !== 'stylesheet' || oldStyles.has(attribute(tag, 'href')));
  return html.replace(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i, (_, start, body, end) =>
    start + body.replace(assetTags, tag => replaceTag(tag) ? '' : tag) + tags.join('\n') + end);
}

function walk(root, relative) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) return [];
  if (!fs.statSync(full).isDirectory()) return [relative];
  return fs.readdirSync(full).sort().flatMap(name => walk(root, `${relative}/${name}`));
}
function inside(root, relative) {
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) throw Error('Invalid cached output path');
  return full;
}
function htmlPath(route) {
  if (!/^\/(?:[A-Za-z0-9-]+\/?)*$/.test(route)) throw Error('Invalid render route');
  return `${route.slice(1).replace(/\/$/, '')}${route === '/' ? '' : '/'}index.html`;
}

export function createRenderCache({sourceRoot = '.', outputRoot = 'dist', cacheRoot = '.cache/rendered-content', context = process.env.JSA_RENDER_CACHE_CONTEXT,
  environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_')))} = {}) {
  const enabled = Boolean(context) && process.env.JSA_RENDER_CACHE !== 'off';
  const files = enabled ? [
    ...['src', 'public', 'scripts'].flatMap(dir => walk(sourceRoot, dir)).filter(file => !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file)),
    ...fs.readdirSync(sourceRoot).filter(file => /\.(?:json|[cm]?[jt]s|html)$/.test(file) && fs.statSync(path.join(sourceRoot, file)).isFile()),
  ].sort() : [];
  const shared = [], locales = new Map();
  for (const file of files) {
    const entry = [file, digest(fs.readFileSync(path.join(sourceRoot, file)))];
    const locale = file.match(/^src\/locales\/([^/]+)\/.*\.json$/)?.[1];
    if (locale) { if (!locales.has(locale)) locales.set(locale, []); locales.get(locale).push(entry); }
    else shared.push(entry);
  }
  // Environment values are hashed, never persisted in the artifact cache.
  const publicEnvironment = Object.entries(environment).filter(([key]) => key.startsWith('VITE_')).sort(([a], [b]) => a.localeCompare(b));
  const common = digest(JSON.stringify({schema, context, shared, environment: publicEnvironment}));
  const fingerprint = (route, kind) => {
    const locale = route.split('/')[1] || 'en-US';
    const dependencies = [...new Set([locale, getDataLocale(locale), ...getTranslationFallbacks(locale)])].sort();
    return digest(JSON.stringify([common, route, kind, dependencies.map(code => [code, locales.get(code) || []])]));
  };
  const location = (route, kind) => path.join(cacheRoot, digest(`${kind}:${route}`));
  // Dictionary snapshots depend on live hazard data without a revision token.
  // Always render them until that data has a trustworthy change identifier.
  const canCache = route => enabled && !/\/(dictionary|case-study)(\/|$)/.test(route);
  return {
    enabled,
    restore(route, kind, pdfRelative) {
      if (!canCache(route)) return null;
      const directory = location(route, kind);
      try {
        const record = JSON.parse(fs.readFileSync(path.join(directory, 'record.json'), 'utf8'));
        if (record.fingerprint !== fingerprint(route, kind) || record.pdfRelative !== pdfRelative) return null;
        const raw = fs.readFileSync(path.join(directory, 'page.html'), 'utf8');
        if (digest(raw) !== record.htmlSha256) return null;
        if (typeof record.shell !== 'string') return null;
        const html = refreshBundleReferences(raw, fs.readFileSync(path.join(outputRoot, 'public-jsa-shell.html'), 'utf8'), record.shell);
        // Fail closed if an image or a lazy-loaded asset no longer exists.
        for (const match of html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+)(?:[^"']*)["']/g)) {
          if (!match[1].startsWith('/assets/guides/') && !fs.existsSync(inside(outputRoot, match[1].slice(1)))) return null;
        }
        let pdf;
        if (pdfRelative) {
          pdf = fs.readFileSync(path.join(directory, 'document.pdf'));
          if (digest(pdf) !== record.metadata?.sha256 || pdf.length !== record.metadata?.bytes || pdf.subarray(0, 5).toString() !== '%PDF-') return null;
        }
        const target = inside(outputRoot, htmlPath(route));
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, html);
        if (pdf) {
          const targetPdf = inside(outputRoot, pdfRelative);
          fs.mkdirSync(path.dirname(targetPdf), {recursive: true});
          fs.writeFileSync(targetPdf, pdf);
        }
        return record.metadata || {};
      } catch { return null; } // Missing/evicted/corrupt caches are ordinary cold builds.
    },
    save(route, kind, metadata = {}, pdfRelative) {
      if (!canCache(route)) return;
      const directory = location(route, kind);
      fs.mkdirSync(directory, {recursive: true});
      const html = fs.readFileSync(inside(outputRoot, htmlPath(route)), 'utf8');
      fs.writeFileSync(path.join(directory, 'page.html'), html);
      if (pdfRelative) fs.copyFileSync(inside(outputRoot, pdfRelative), path.join(directory, 'document.pdf'));
      // Write the record last; an interrupted write fails integrity validation.
      const shell = fs.readFileSync(path.join(outputRoot, 'public-jsa-shell.html'), 'utf8');
      fs.writeFileSync(path.join(directory, 'record.json'), JSON.stringify({fingerprint: fingerprint(route, kind), htmlSha256: digest(html), shell, pdfRelative, metadata}));
    },
  };
}
