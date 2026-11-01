// Only publish the public site; keep working files and legacy implementations local.
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const files = ['index.html', 'frequences/index.html', 'fragments/index.html', '404.html', 'site.css', 'site.js', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'assets/hero-vrtg.webp', 'assets/fragments-banner.webp', 'assets/cover-fragments.webp', ...['01','02','03'].map(n => `assets/cover-frequence-${n}.webp`), ...['01','02','03'].map(n => `assets/audio/fragment-${n}-final.mp3`)];
await rm(resolve(root, 'dist'), {recursive:true, force:true});
for (const file of files) {
  await mkdir(dirname(resolve(root, 'dist', file)), { recursive: true });
  await copyFile(resolve(root, file), resolve(root, 'dist', file));
}
console.log(`Exported ${files.length} public files to dist.`);
