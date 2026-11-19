import { racine } from './config.mjs';

function measure(event, extra = {}) {
  const detail = {event, track: 'racine', page_path: location.pathname, ...extra};
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail}));
  if (typeof window.vrtgAnalytics === 'function') window.vrtgAnalytics(detail);
}

function landrDestination() {
  try {
    const url = new URL(racine.landrUrl);
    if (racine.landrVerifiedTrack !== 'racine' || url.protocol !== 'https:' ||
        url.hostname !== 'release.landr.com' || url.username || url.password || url.port ||
        !/^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) || url.pathname.replaceAll('/', '') === '059442004688') return null;
    return url;
  } catch { return null; }
}
const destination = landrDestination();
if (destination) {
  const link = document.createElement('a');
  link.className = 'cta';
  link.href = destination.href;
  link.textContent = 'Pré-sauvegarder RACINE';
  link.setAttribute('aria-describedby', 'presave-help');
  link.addEventListener('click', () => measure('racine_landr_click', {platform: 'landr', link_url: destination.href}));
  document.querySelector('#action').replaceChildren(link);
  document.querySelector('#presave-help').textContent = racine.librarySaveVerified
    ? 'Retrouve RACINE dans ta bibliothèque dès sa sortie.'
    : 'Choisis ta plateforme et confirme ta pré-sauvegarde sur LANDR.';
  const names = {'spotify':'Spotify', 'apple-music':'Apple Music', 'deezer':'Deezer', 'youtube-music':'YouTube Music'};
  const list = document.querySelector('#platforms');
  for (const platform of racine.presavePlatforms || []) {
    if (!names[platform.id] || !/^[\w-]+\.svg$/.test(platform.logoFile) || !/^https:\/\//.test(platform.officialSource || '')) continue;
    const item = document.createElement('li');
    const logo = document.createElement('img');
    logo.src = '/racine/' + platform.logoFile;
    logo.alt = names[platform.id];
    logo.addEventListener('error', () => item.remove());
    item.append(logo);
    list.append(item);
  }
  list.hidden = !list.children.length;
}

if (racine.fullTrackFile && /^[\w-]+\.mp3$/.test(racine.fullTrackFile)) {
  const audio = document.createElement('audio');
  audio.controls = true; // Accessible native fallback until custom controls are installed.
  audio.preload = 'metadata';
  audio.src = '/racine/' + encodeURIComponent(racine.fullTrackFile);
  audio.setAttribute('aria-label', 'RACINE, écoute intégrale');
  const player = document.querySelector('.player');
  const play = document.querySelector('.play');
  const progress = document.querySelector('#audio-progress');
  const status = document.querySelector('#audio-status');
  const elapsed = document.querySelector('#elapsed');
  const duration = document.querySelector('#duration');
  const milestones = new Set();
  let started = false;
  let failed = false;
  const time = seconds => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '—:—';
  function sync() {
    const valid = Number.isFinite(audio.duration) && audio.duration > 0;
    progress.disabled = !valid;
    progress.max = valid ? audio.duration : 100;
    progress.value = audio.currentTime;
    elapsed.textContent = time(audio.currentTime);
    duration.textContent = time(audio.duration);
    progress.setAttribute('aria-valuetext', `${time(audio.currentTime)} sur ${time(audio.duration)}`);
    const playing = !audio.paused && !audio.ended;
    play.classList.toggle('playing', playing);
    play.setAttribute('aria-label', failed ? 'Réessayer l’écoute de RACINE' : playing ? 'Mettre RACINE en pause' : 'Écouter RACINE en intégralité');
    if (!valid) return;
    // Actual unique media ranges heard: seeking forward never earns skipped milestones.
    let heard = 0;
    for (let i = 0; i < audio.played.length; i++) heard += audio.played.end(i) - audio.played.start(i);
    for (const percent of [25, 50, 75, 100]) {
      const reached = percent === 100 ? audio.ended && heard >= audio.duration - 0.5 : heard / audio.duration >= percent / 100;
      if (started && reached && !milestones.has(percent)) {
        milestones.add(percent);
        measure('racine_listen_progress', {listen_percent: percent, duration_seconds: Math.round(audio.duration)});
      }
    }
  }
  function error() {
    failed = true;
    status.textContent = 'Impossible de charger le morceau. Appuie sur lecture pour réessayer.';
    sync();
  }
  play.addEventListener('click', () => {
    if (audio.paused || failed) {
      if (failed) { audio.load(); failed = false; }
      status.textContent = 'Chargement du morceau…';
      audio.play().catch(e => { if (e.name !== 'AbortError') error(); });
    } else audio.pause();
  });
  progress.addEventListener('input', () => { audio.currentTime = Number(progress.value); sync(); });
  audio.addEventListener('playing', () => {
    failed = false;
    status.textContent = 'Lecture en cours · RACINE';
    if (!started) { started = true; measure('racine_listen_start'); }
    sync();
  });
  audio.addEventListener('pause', () => { if (!failed && !audio.ended) status.textContent = 'En pause · Reprends quand tu veux.'; sync(); });
  for (const event of ['loadstart', 'waiting', 'stalled']) audio.addEventListener(event, () => { if (!audio.paused) status.textContent = 'Chargement du morceau…'; });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked']) audio.addEventListener(event, sync);
  audio.addEventListener('ended', () => {
    status.textContent = 'Écoute terminée · Tu peux relancer le morceau.';
    document.querySelector('#replay-invitation').hidden = false;
    document.querySelector('#presave').classList.add('highlight');
    sync();
  });
  audio.addEventListener('error', error);
  document.querySelector('#native-player').append(audio);
  audio.controls = false;
  audio.hidden = true;
  player.hidden = false;
  status.textContent = 'Le morceau complet. À ton rythme.';
  sync();
}
