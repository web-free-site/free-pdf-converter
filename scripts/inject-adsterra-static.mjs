import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const adsPath = path.join(root, 'public', 'ads.json');

if (process.env.VITE_SHOW_ADSTERRA !== 'true') {
  console.log(
    '[ads] VITE_SHOW_ADSTERRA not set, skipping static ad injection.'
  );
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(adsPath, 'utf8'));
const pop = config.popunderScript?.trim();
const social = config.socialBarScript?.trim();
if (!pop && !social) process.exit(0);

function walkHtml(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkHtml(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walkHtml(dist)) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (pop && !html.includes('data-fpc-popunder')) {
    const tag = `<script src="${pop}" data-fpc-popunder="1"></script>`;
    html = html.replace('</head>', `${tag}\n  </head>`);
    changed = true;
  }
  if (social && !html.includes('data-fpc-social')) {
    const tag = `<script src="${social}" data-fpc-social="1"></script>`;
    html = html.replace('</body>', `${tag}\n  </body>`);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, html);
    n++;
  }
}
console.log(`[ads] Injected popunder/social-bar into ${n} HTML files.`);
