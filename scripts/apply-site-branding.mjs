import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OFFICIAL_SITE_URL, resolveSiteUrl } from './indexing-policy.mjs';
import { loadProductionEnv } from './load-production-env.mjs';

loadProductionEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

const BRAND = process.env.VITE_BRAND_NAME || 'Free PDF Converter';
const SITE_URL = resolveSiteUrl();

const OFFICIAL = OFFICIAL_SITE_URL;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html')) files.push(p);
  }
  return files;
}

function brandHtml(html) {
  let out = html.split(OFFICIAL).join(SITE_URL);
  out = out.replaceAll('http://www.bentopdf.com', SITE_URL);
  out = out.replace(/\|\s*BentoPDF/g, `| ${BRAND}`);
  out = out.replace(/-\s*BentoPDF(?=[\s<"'])/g, `- ${BRAND}`);
  out = out.replace(/content="BentoPDF"/g, `content="${BRAND}"`);
  out = out.replace(/content="@[Bb]entoPDF"/g, 'content="@FreePDFTools"');
  out = out.replace(
    /<meta property="og:site_name" content="[^"]*"/g,
    `<meta property="og:site_name" content="${BRAND}"`
  );
  out = out.replace(/"name":\s*"BentoPDF"/g, `"name": "${BRAND}"`);
  return out;
}

const files = walk(DIST);
let n = 0;
for (const file of files) {
  const prev = fs.readFileSync(file, 'utf8');
  const next = brandHtml(prev);
  if (next !== prev) {
    fs.writeFileSync(file, next);
    n++;
  }
}
console.log(`[branding] Updated ${n} HTML files for ${BRAND} @ ${SITE_URL}`);
