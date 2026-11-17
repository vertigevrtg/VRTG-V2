import { corrida } from './config.mjs';

const releaseTime = Date.parse(document.querySelector('time').dateTime);
const action = document.querySelector('#action');
let timer;

function destination(live) {
  try {
    const url = new URL(live ? corrida.spotifyUrl : corrida.landrUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (live) return url.hostname === 'open.spotify.com' && /^\/(?:intl-[a-z]+\/)?track\/[a-zA-Z0-9]{22}\/?$/.test(url.pathname) ? url : null;
    return url.hostname === 'release.landr.com' && url.pathname.length > 1 ? url : null;
  } catch {
    return null;
  }
}

function refresh() {
  clearTimeout(timer);
  const remaining = releaseTime - Date.now();
  const live = remaining <= 0;
  if (live) document.querySelector('.copy').textContent = 'VRTG mêle rap et métal sur CORRIDA. Découvre le single sur Spotify.';
  const url = destination(live);
  if (url) {
    const link = document.createElement('a');
    link.href = url.href;
    link.className = 'cta';
    link.textContent = live ? 'Écouter sur Spotify' : 'Pré-sauvegarde CORRIDA maintenant';
    link.addEventListener('click', () => {
      const detail = {event: live ? 'spotify_outbound_click' : 'presave_click',
        track: 'corrida', platform: live ? 'spotify' : 'landr', page_path: location.pathname};
      window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail}));
      window.vrtgAnalytics?.(detail);
    });
    action.replaceChildren(link);
  } else {
    const status = document.createElement('p');
    status.className = 'status';
    status.textContent = live ? 'Lien d’écoute à venir' : 'Pré-sauvegarde à venir';
    action.replaceChildren(status);
  }
  if (!live) timer = setTimeout(refresh, Math.min(remaining, 2147483647));
}
refresh();
window.addEventListener('pageshow', refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

if (corrida.excerptFile) {
  const audio = document.createElement('audio');
  const play = document.querySelector('.play');
  const status = document.querySelector('#audio-status');
  const progress = document.querySelector('#audio-progress');
  function syncProgress() {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      progress.value = audio.ended ? 1 : audio.currentTime / audio.duration;
    }
  }
  audio.addEventListener('playing', () => {
    progress.hidden = false;
    syncProgress();
  });
  for (const event of ['timeupdate', 'ended', 'seeked']) audio.addEventListener(event, syncProgress);
  audio.preload = 'none';
  audio.src = '/corrida/' + encodeURIComponent(corrida.excerptFile);
  document.querySelector('.excerpt').append(audio);
  play.disabled = false;
  function syncPlayer() {
    const playing = !audio.paused && !audio.ended;
    play.classList.toggle('playing', playing);
    play.setAttribute('aria-label', playing ? 'Mettre en pause' : 'Lire l’extrait de CORRIDA');
    status.textContent = playing ? 'Lecture en cours' : 'Écouter l’aperçu';
  }
  function unavailable() {
    progress.hidden = true;
    play.disabled = true;
    play.classList.remove('playing');
    status.textContent = 'Extrait momentanément indisponible';
  }
  play.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(error => { if (error.name !== 'AbortError') unavailable(); });
    else audio.pause();
  });
  for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlayer);
  audio.addEventListener('error', unavailable);
  syncPlayer();
}
