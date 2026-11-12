// Render the exhibition at export time so its works and texts are also available without JS.
import {readFile, writeFile} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const data = JSON.parse(await read('creatures/collection.json'));
const {tracks} = data;
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
const base = 'https://www.vrtgmusic.ca';
const header = (await read('index.html')).match(/<header class="header">.*?<\/header>/s)[0]
  .replace('href="/" aria-current="page"', 'href="/"').replace('href="/creatures"', 'href="/creatures" aria-current="page"');
const title = 'CRÉATURES — VRTG | EP de rap alternatif français';
const desc = 'Découvrez CRÉATURES, un EP de VRTG en trois fragments. Une exploration musicale de la violence, de la mémoire et de la transformation.';
export const mediaFiles = [...new Set([data.shareImage, ...tracks.flatMap(t=>[t.audio,t.cover])].filter(Boolean))].map(path=>{
  if (!/^\/assets\/(audio\/)?creatures\/[\w.-]+$/.test(path)) throw Error('Média hors du dossier Créatures : '+path);
  return path.slice(1);
});
function art(t,lazy=true) {
  return t.cover ? `<img src="${escape(t.cover)}" alt="${escape(t.alt)}" width="1200" height="1200" ${lazy?'loading="lazy"':'fetchpriority="high"'} decoding="async">` : '';
}
const names = {spotify:'Spotify', apple_music:'Apple Music', youtube_music:'YouTube Music', deezer:'Deezer', amazon_music:'Amazon Music'};
function links(map,id='ep') {
  return Object.entries(map).filter(([key,url])=>names[key] && /^https:\/\//i.test(url)).map(([key,url])=>`<a href="${escape(url)}" data-service="${key}" data-id="${escape(id)}" rel="noopener noreferrer" target="_blank">${names[key]} ↗</a>`).join(' ');
}
function play(t) {
  return `<button data-track="${escape(t.id)}" ${t.audio?'':'disabled'}>${t.audio?'Écouter':'Bientôt disponible'}</button>`;
}
function work(t,i) {
  return `<article class="work work-${i}" id="${escape(t.id)}">
  <div class="label work-number">Fragment <b>/ ${escape(t.number)}</b></div>
  <div class="work-text"><h3>${escape(t.title||'EN GESTATION')}</h3><p>${escape(t.description)}</p>
  ${t.releaseDate?`<time datetime="${escape(t.releaseDate)}">${escape(t.releaseDate)}</time>`:''}
  <div class="work-actions">${play(t)} ${t.lyrics?`<a href="#lyrics-${escape(t.id)}">Lire les paroles</a>`:t.excerpts.length?`<a href="#trace-${escape(t.id)}">Lire l’extrait ↓</a>`:''}</div></div>
  ${t.cover?`<figure>${art(t)}<figcaption>VRTG <span>Fig. ${escape(t.number)}</span></figcaption></figure>`:''}</article>`;
}
const traces=tracks.map(t=>`<div id="trace-${escape(t.id)}">${t.excerpts.map(q=>`<figure><blockquote>« ${escape(q)} »</blockquote><figcaption>Extrait de ${escape(t.title||'Fragment '+t.number)} · VRTG</figcaption></figure>`).join('')}
${t.lyrics?`<details id="lyrics-${escape(t.id)}"><summary>Lire les paroles · ${escape(t.title||t.number)}</summary><p>${escape(t.lyrics)}</p></details>`:''}</div>`).join('');
const services=[links(data.streamingLinks),...tracks.map(t=>links(t.streamingLinks,t.id))];
const html=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11100E">
<title>${title}</title><meta name="description" content="${desc}"><link rel="canonical" href="${base}/creatures">
<meta property="og:type" content="website"><meta property="og:site_name" content="VRTG"><meta property="og:locale" content="fr_CA"><meta property="og:url" content="${base}/creatures"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${base}${escape(data.shareImage)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${base}${escape(data.shareImage)}">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/creatures/exposition.css"><script defer src="/creatures/player.js"></script></head>
<body class="creatures"><a class="skip-link" href="#main">Aller au contenu</a>${header}
<main id="main" tabindex="-1"><section class="apparition">
<nav aria-label="Parcours de l’exposition" class="museum-nav"><span>Le musée des anomalies</span><div><a href="#collection">Collection</a><a href="#traces">Les traces</a><a href="#ecouter">Écouter</a></div></nav>
<div class="opening"><div class="opening-copy"><p class="label">VRTG — Un EP en trois fragments</p><h1>CRÉATURES</h1><p class="intro">Trois manifestations d’une<br>même humanité abîmée.</p>
<div class="hero-actions"><a href="#collection">Explorer la collection ↓</a><a href="#ecouter">Écouter l’EP ↗</a></div></div>
<figure class="exhibit">${art(tracks[0],false)}<figcaption>Fig. ${escape(tracks[0].number)} <span>${escape(tracks[0].title)}</span></figcaption></figure></div></section>
<section id="collection"><h2 class="section-label">02 / Les fragments</h2>${tracks.map(work).join('')}</section>
<section id="traces"><h2 class="section-label">03 / Les traces</h2>${traces}</section>
<section id="ecouter"><p class="section-label">04 / L’écoute</p><h2>ÉCOUTER LES<br>CRÉATURES</h2><p class="intro">Trois fragments. Une même matière.</p>
<ol class="listen-list">${tracks.map(t=>`<li><span class="label">${t.number}</span><strong>${escape(t.title||'À VENIR')}</strong>${play(t)}${t.audio?`<noscript><audio controls preload="none" aria-label="${escape(t.title||t.number)}" src="${escape(t.audio)}"></audio></noscript>`:''}</li>`).join('')}</ol>
<div class="console" aria-label="Lecteur CRÉATURES" role="region"><audio id="ep-audio" preload="none"></audio>
<div class="now"><img id="art" alt="" width="60" height="60" hidden><div><strong id="current">CRÉATURES</strong><p role="status" id="state">${tracks.some(t=>t.audio)?'Choisissez un fragment':'ÉCOUTE BIENTÔT DISPONIBLE'}</p></div></div>
<div class="timeline"><span id="elapsed">0:00</span><input id="seek" aria-label="Position de lecture" type="range" min="0" max="100" step="any" value="0" disabled><span id="duration">–:––</span></div>
<div class="controls"><button id="prev" disabled>Précédent</button><button data-toggle disabled>Lecture</button><button id="next" disabled>Suivant</button><button id="mute" aria-pressed="false" disabled>Muet</button><input id="volume" aria-label="Volume" type="range" min="0" max="1" step=".01" value="1" disabled></div></div>
<div class="services">${services.some(Boolean)?services.map((s,i)=>s?`<p>${escape(i?(tracks[i-1].title||tracks[i-1].number):'EP')} · ${s}</p>`:'').join(''):'Liens vers les plateformes prochainement.'}</div></section></main>
<footer class="footer"><a class="brand" href="/">VRTG</a><a href="#main">Retour en haut ↑</a></footer>
<aside id="mini" hidden><a href="#ecouter" id="mini-title"></a><button data-toggle>Lecture</button></aside>
<script type="application/json" id="ep-data">${JSON.stringify(tracks.map(({id,title,number,audio,cover})=>({id,title:title||'Fragment '+number,audio,cover}))).replaceAll('<','\\u003c')}</script></body></html>`;
await writeFile(new URL('creatures/index.html',root),html.replace(/[ \t]+$/gm, ''));
