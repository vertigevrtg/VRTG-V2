import { racine } from './config.mjs';

const releaseTime = Date.parse(racine.releaseAt);
if (Number.isFinite(releaseTime)) {
  document.querySelector('#release-date').textContent = new Intl.DateTimeFormat('fr-CA', {dateStyle:'long', timeStyle:'short', timeZone:'America/Toronto'}).format(releaseTime);
}
const action = document.querySelector('#action');
let timer;

function destination(live) {
  try {
    const url = new URL(live ? racine.spotifyUrl : racine.landrUrl);
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
  if (live) document.querySelector('.copy').textContent = 'VRTG mêle rap et métal sur RACINE. Découvre le single sur Spotify.';
  const url = destination(live);
  if (url) {
    const link = document.createElement('a');
    link.href = url.href;
    link.className = 'cta';
    link.textContent = live ? 'Écouter sur Spotify' : 'Pré-sauvegarde RACINE maintenant';
    link.addEventListener('click', () => {
      const detail = {event: live ? 'spotify_outbound_click' : 'presave_click',
        track: 'racine', platform: live ? 'spotify' : 'landr', page_path: location.pathname};
      window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail}));
      window.vrtgAnalytics?.(detail);
    });
    action.replaceChildren(link);
  } else {
    const status = document.createElement('button');
    status.className = 'cta';
    status.disabled = true;
    status.textContent = live ? 'Lien d’écoute à venir' : 'Pré-sauvegarde RACINE bientôt';
    action.replaceChildren(status);
  }
  if (Number.isFinite(remaining) && !live) timer = setTimeout(refresh, Math.min(remaining, 2147483647));
}
refresh();
window.addEventListener('pageshow', refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

const countdown = document.querySelector('.countdown');
let countdownTimer;
function refreshCountdown() {
  clearTimeout(countdownTimer);
  const remaining = releaseTime - Date.now();
  countdown.hidden = !Number.isFinite(remaining) || remaining <= 0;
  if (!Number.isFinite(remaining) || remaining <= 0) return;
  const minutes = Math.ceil(remaining / 60000);
  countdown.querySelector('[data-days]').textContent = String(Math.floor(minutes / 1440)).padStart(2, '0');
  countdown.querySelector('[data-hours]').textContent = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  countdown.querySelector('[data-minutes]').textContent = String(minutes % 60).padStart(2, '0');
  countdownTimer = setTimeout(refreshCountdown, Math.min(remaining, remaining % 60000 || 60000));
}
refreshCountdown();
window.addEventListener('pageshow', refreshCountdown);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCountdown(); });

if (racine.excerptFile) {
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
  audio.addEventListener('loadedmetadata', () => {
    document.querySelector('.duration').textContent = '· ' + Math.round(audio.duration) + ' secondes';
  });
  audio.preload = 'none';
  audio.src = '/racine/' + encodeURIComponent(racine.excerptFile);
  document.querySelector('.excerpt').append(audio);
  play.disabled = false;
  function syncPlayer() {
    const playing = !audio.paused && !audio.ended;
    play.classList.toggle('playing', playing);
    play.setAttribute('aria-label', playing ? 'Mettre en pause' : 'Lire l’extrait de RACINE');
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
