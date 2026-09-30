// HTTP smoke checks for the platform-only edition. Start tools/preview.mjs first.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.env.VRTG_BASE_URL||'http://127.0.0.1:8080';
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
for(const path of ['/','/frequences','/fragments']){
 const response=await fetch(base+path);assert.equal(response.status,200);
 const html=await response.text();assert(!html.includes('.mp3'));assert(!html.includes('AudioObject'));
 assert(html.includes('spotify-player'));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 if(path==='/fragments'){assert(html.includes('À VENIR'));assert(!html.includes('data-play='));}
 console.log('PASS page',path);
}
for(const redirect of config.redirects){const r=await fetch(base+redirect.source,{redirect:'manual'});assert.equal(r.status,301,redirect.source);assert.equal(r.headers.get('location'),redirect.destination,redirect.source);}
console.log('PASS 21 legacy redirects');
for(const path of ['/missing-page','/assets/fragment-01-vrtg.mp3','/assets/fragment-02-vrtg.mp3','/assets/fragment-03-vrtg.mp3','/assets/frequence-01-vrtg.mp3','/assets/frequence-02-vrtg.mp3','/assets/frequence-03-vrtg.mp3','/.env.local'])assert.equal((await fetch(base+path)).status,404,path);
console.log('PASS 404 and no public MP3 files');
