#!/usr/bin/env node
/**
 * Inserts network Terms / Privacy footer links and the Google Analytics gtag snippet to https://web-free.site/terms/
 * and https://web-free.site/privacy/ on built HTML pages. Idempotent.
 */
import fs from 'node:fs';
import path from 'node:path';

const LEGAL =
  '<p class="web-free-legal-links"><a href="https://web-free.site/terms/">Terms</a> · <a href="https://web-free.site/privacy/">Privacy</a></p>';

const GA_ID = 'G-8DG5MK8YPM';
const GTAG =
  '<!-- Google tag (gtag.js) -->' +
  '<script async src="https://www.googletagmanager.com/gtag/js?id=' +
  GA_ID +
  '"></script>' +
  "<script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '" +
  GA_ID +
  "');</script>";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (
      name === 'node_modules' ||
      name === '.git' ||
      name === '.next' ||
      name === '.astro' ||
      name === 'ads' ||
      name === '_adfix'
    )
      continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, acc);
    else if (name.endsWith('.html') && st.size >= 80) acc.push(p);
  }
  return acc;
}

function injectLegal(text) {
  if (
    text.includes('https://web-free.site/terms/') &&
    text.includes('https://web-free.site/privacy/')
  ) {
    return text;
  }
  const lower = text.toLowerCase();
  let idx = lower.lastIndexOf('</footer>');
  if (idx !== -1) return text.slice(0, idx) + LEGAL + '\n' + text.slice(idx);
  idx = lower.lastIndexOf('id="wf-more-tools"');
  if (idx !== -1) {
    const start = text.lastIndexOf('<', idx);
    if (start !== -1)
      return text.slice(0, start) + LEGAL + '\n' + text.slice(start);
  }
  idx = lower.lastIndexOf('</body>');
  if (idx !== -1) return text.slice(0, idx) + LEGAL + '\n' + text.slice(idx);
  return text;
}

function injectGtag(text) {
  if (text.includes(GA_ID) && text.includes('gtag/js')) return text;
  const lower = text.toLowerCase();
  const idx = lower.lastIndexOf('</head>');
  if (idx !== -1) return text.slice(0, idx) + GTAG + '\n' + text.slice(idx);
  return text;
}

function inject(text) {
  return injectGtag(injectLegal(text));
}

function wranglerAssetDir() {
  for (const name of ['wrangler.toml', 'wrangler.jsonc', 'wrangler.json']) {
    if (!fs.existsSync(name)) continue;
    const t = fs.readFileSync(name, 'utf8');
    const m =
      t.match(/directory\s*=\s*"([^"]+)"/) ||
      t.match(/"directory"\s*:\s*"([^"]+)"/);
    if (m) return path.resolve(m[1]);
  }
  return null;
}

const args = process.argv.slice(2);
const roots = args.length
  ? args.map((d) => path.resolve(d))
  : [
      wranglerAssetDir(),
      path.resolve('out'),
      path.resolve('dist'),
      path.resolve('public'),
    ].filter(Boolean);
const seen = new Set();
let n = 0;
let scanned = 0;
for (const root of roots) {
  const resolved = path.resolve(root);
  if (seen.has(resolved) || !fs.existsSync(resolved)) continue;
  seen.add(resolved);
  for (const file of walk(resolved)) {
    const rel = path.relative(resolved, file).split(path.sep).join('/');
    if (
      rel.startsWith('ads/') ||
      rel.includes('/ads/') ||
      rel.includes('_adfix/')
    )
      continue;
    scanned += 1;
    const text = fs.readFileSync(file, 'utf8');
    const next = inject(text);
    if (next !== text) {
      fs.writeFileSync(file, next);
      n += 1;
    }
  }
}
console.log(`inject-hub-legal: updated ${n} of ${scanned} HTML files`);
