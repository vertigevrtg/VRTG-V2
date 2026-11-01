// HTTP smoke checks. Start tools/preview.mjs first, or set VRTG_BASE_URL for production.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.env.VRTG_BASE_URL||'http://127.0.0.1:8080';
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url)));
for(const path of ['/','/frequences','/fragments']){
 const response=await fetch(base+path);assert.equal(response.status,200);
 const html=await response.text();
 assert(html.includes('spotify-player'));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 if(path==='/fragments'){
  assert(!html.includes('À VENIR'));
  for(const n of ['01','02','03'])assert(html.includes(`data-fragment="${n}"`));
  assert(html.includes('AudioObject'));
 }
 assert(!html.includes('download="'));
 console.log('PASS page',path);
}
for(const redirect of config.redirects){
 let current=new URL(redirect.source,base),saw301=false;
 for(let hop=0;hop<5;hop++){
  const r=await fetch(current,{redirect:'manual'});
  if(r.status===200)break;
  assert([301,308].includes(r.status),redirect.source+' status '+r.status);
  saw301 ||= r.status===301;
  current=new URL(r.headers.get('location'),current);
 }
 assert(saw301,redirect.source+' has 301');
 assert.equal(current.pathname.replace(/\/$/,''),redirect.destination.split('#')[0],redirect.source);
 assert.equal(current.hash,redirect.destination.includes('#')?'#'+redirect.destination.split('#')[1]:'',redirect.source);
 assert.equal((await fetch(current)).status,200);
}
console.log('PASS 21 legacy redirects');
for(const path of ['/missing-page','/assets/fragment-01-vrtg.mp3','/assets/fragment-02-vrtg.mp3','/assets/fragment-03-vrtg.mp3','/assets/frequence-01-vrtg.mp3','/assets/frequence-02-vrtg.mp3','/assets/frequence-03-vrtg.mp3','/.env.local'])assert.equal((await fetch(base+path)).status,404,path);
console.log('PASS 404 and no legacy/provisional MP3 files');
for(const n of ['01','02','03']){
 const response=await fetch(base+`/assets/audio/fragment-${n}-final.mp3`,{headers:{Range:'bytes=0-255'}});
 assert.equal(response.status,206,n+' supports partial audio requests');
 assert(response.headers.get('content-type').startsWith('audio/mpeg'));
 assert.equal((await response.arrayBuffer()).byteLength,256);
}
console.log('PASS all three final audio files and byte ranges');
