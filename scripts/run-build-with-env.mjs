import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env.production');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

spawnSync('node', ['scripts/patch-about-contact.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const r = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (r.status !== 0) process.exit(r.status ?? 1);

spawnSync('node', ['scripts/apply-site-branding.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

spawnSync('node', ['scripts/inject-adsterra-static.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

spawnSync('node', ['scripts/inject-ad-placements.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
