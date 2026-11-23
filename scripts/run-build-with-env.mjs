import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadProductionEnv } from './load-production-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadProductionEnv();

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
