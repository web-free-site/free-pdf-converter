import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist'
);

if (process.env.VITE_SHOW_ADSTERRA !== 'true') {
  console.log('[ads] Skipping placement HTML injection.');
  process.exit(0);
}

const HEADER = `<div class="adsterra-header-wrap container mx-auto px-4 py-2 flex justify-center"><aside class="ad-container adsterra-slot" data-ad-slot="banner728x90" aria-label="Advertisement"></aside></div>`;

const SIDEBAR = `<div id="adsterra-sidebar-rail" class="adsterra-sidebar-rail" aria-hidden="true"><aside class="adsterra-sidebar hidden xl:block w-40 shrink-0"><div class="sticky top-24 space-y-4"><div class="ad-container adsterra-slot" data-ad-slot="banner160x600" aria-label="Advertisement"></div><div class="ad-container adsterra-slot" data-ad-slot="banner160x300" aria-label="Advertisement"></div></div></aside></div>`;

const MID = `<div class="adsterra-mid-wrap max-w-4xl mx-auto px-4 py-4 flex flex-col items-center gap-4"><aside class="ad-container adsterra-slot" data-ad-slot="banner300x250" aria-label="Advertisement"></aside><aside class="ad-container adsterra-slot" data-ad-slot="banner468x60" aria-label="Advertisement"></aside><aside id="adsterra-native-host" class="ad-container adsterra-native-static w-full max-w-md" aria-label="Sponsored"><p class="ad-sponsor-label">Sponsored</p></aside></div>`;

const FOOTER_ADS = `<div class="adsterra-smartlink-wrap border-t border-white/5 py-3 text-center"><p class="text-xs text-gray-500">Sponsored · <a data-smartlink-slot href="#" rel="sponsored noopener">Partner offer</a></p></div><div class="adsterra-mobile-sticky xl:hidden fixed bottom-0 inset-x-0 z-20 flex justify-center bg-gray-900/95 border-t border-white/10 py-1"><aside class="ad-container adsterra-slot" data-ad-slot="banner320x50" aria-label="Advertisement"></aside></div><div class="h-14 xl:hidden" aria-hidden="true"></div>`;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.html')) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of walk(dist)) {
  if (file.includes(`${path.sep}blog${path.sep}`)) continue;
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (!html.includes('data-ad-slot="banner728x90"')) {
    const navEnd = html.indexOf('</nav>');
    if (navEnd !== -1) {
      const insertAt = navEnd + '</nav>'.length;
      html = html.slice(0, insertAt) + HEADER + SIDEBAR + html.slice(insertAt);
      changed = true;
    }
  }

  if (
    html.includes('<!-- FAQ Section -->') &&
    !html.includes('data-ad-slot="banner300x250"')
  ) {
    html = html.replace(
      '<!-- FAQ Section -->',
      `${MID}\n    <!-- FAQ Section -->`
    );
    changed = true;
  }

  if (html.includes('<footer') && !html.includes('data-smartlink-slot')) {
    html = html.replace(/<footer\b/, `${FOOTER_ADS}\n    <footer`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, html);
    n++;
  }
}
console.log(`[ads] Injected ad placement HTML into ${n} pages.`);
