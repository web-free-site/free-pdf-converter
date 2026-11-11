import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brand = 'Free PDF Converter';

for (const file of [
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/BentoPDF/g, brand);
  html = html.replace(/Hi, I'm Alam\./, 'Free PDF tools for everyone.');
  html = html.replace(/I build BentoPDF\./, 'By Gentil M., Kigali.');
  fs.writeFileSync(p, html);
}
