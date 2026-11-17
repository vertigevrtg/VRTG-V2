// Only publish the public site; keep working files and legacy implementations local.
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { racine } from '../racine/config.mjs';
import { corrida } from '../corrida/config.mjs';
import { mediaFiles } from './build_creatures.mjs';
const root = resolve(import.meta.dirname, '..');
const corridaFiles = ['index.html', 'page.css', 'page.mjs', 'config.mjs', 'pochette-480.webp', 'pochette-960.webp'];
if (corrida.excerptFile) {
  if (!/^[\w-]+\.mp3$/i.test(corrida.excerptFile)) throw Error('Nom de fichier MP3 CORRIDA invalide');
  corridaFiles.push(corrida.excerptFile);
}
const racineFiles = ['index.html', 'page.css', 'page.mjs', 'config.mjs', 'pochette-480.webp', 'pochette-960.webp'];
if (racine.excerptFile) {
  if (!/^[\w-]+\.mp3$/i.test(racine.excerptFile)) throw Error('Nom de fichier MP3 RACINE invalide');
  racineFiles.push(racine.excerptFile);
}
const files = ['preview-corrida/index.html', 'preview-corrida/page.mjs', 'preview-corrida/Corrida_final.mp3', ...racineFiles.map(file => 'racine/' + file), ...corridaFiles.map(file => 'corrida/' + file), 'creatures/index.html','creatures/exposition.css','creatures/player.js', ...mediaFiles, 'index.html', 'frequences/index.html', 'fragments/index.html', '404.html', 'site.css', 'site.js', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'assets/hero-vrtg.webp', 'assets/fragments-banner.webp', 'assets/cover-fragments.webp', ...['01','02','03'].map(n => `assets/cover-frequence-${n}.webp`), ...['01','02','03'].map(n => `assets/audio/fragment-${n}-final.mp3`), 'assets/audio/frequence-03.mp3'];
await rm(resolve(root, 'dist'), {recursive:true, force:true});
for (const file of files) {
  await mkdir(dirname(resolve(root, 'dist', file)), { recursive: true });
  await copyFile(resolve(root, file), resolve(root, 'dist', file));
}
console.log(`Exported ${files.length} public files to dist.`);
