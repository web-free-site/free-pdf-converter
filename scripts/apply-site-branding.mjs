import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

const BRAND = process.env.VITE_BRAND_NAME || 'Free PDF Converter';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const OWNER = process.env.OWNER_NAME || 'Gentil M.';
const OWNER_URL = process.env.OWNER_URL || 'https://gentil.quevvy.com';
const SOURCE = process.env.SOURCE_CODE_URL || '';

if (!SITE_URL) {
  console.log('[branding] SITE_URL not set, skipping HTML brand pass.');
  process.exit(0);
}

const OFFICIAL = 'https://www.bentopdf.com';

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
