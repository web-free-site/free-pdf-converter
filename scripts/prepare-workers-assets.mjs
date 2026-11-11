import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../dist'
);
const lo = path.join(dist, 'libreoffice-wasm');
if (fs.existsSync(lo)) {
  fs.rmSync(lo, { recursive: true, force: true });
  console.log(
    '[deploy] Removed libreoffice-wasm from dist (served via VITE_LIBREOFFICE_WASM_URL).'
  );
}
