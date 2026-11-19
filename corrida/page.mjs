import { corrida } from './config.mjs';

function measure(event, extra = {}) {
  const detail = {event, track: 'corrida', page_path: location.pathname, ...extra};
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail}));
  if (typeof window.vrtgAnalytics === 'function') window.vrtgAnalytics(detail);
}

const releaseTime = Date.parse(document.querySelector('time').dateTime);
const countdown = document.querySelector('.countdown');
const action = document.querySelector('#action');
let timer;
let renderedLive;
function destination(live) {
  try {
    const url = new URL(live ? corrida.spotifyUrl : corrida.landrUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (live) return url.hostname === 'open.spotify.com' && /^\/(?:intl-[a-z]+\/)?track\/[a-zA-Z0-9]{22}\/?$/.test(url.pathname) ? url : null;
    return url.hostname === 'release.landr.com' && url.pathname.length > 1 ? url : null;
  } catch { return null; }
}
function refreshRelease() {
  clearTimeout(timer);
  const remaining = releaseTime - Date.now();
  const live = remaining <= 0;
  countdown.hidden = live;
  if (renderedLive !== live) {
    renderedLive = live;
    const url = destination(live);
    const control = document.createElement(url ? 'a' : 'button');
    control.className = 'cta';
    control.setAttribute('aria-describedby', 'presave-help');
    control.textContent = live ? 'Écouter sur Spotify' : 'Pré-sauvegarder CORRIDA';
    if (url) {
      control.href = url.href;
      control.addEventListener('click', () => measure(live ? 'spotify_outbound_click' : 'presave_click', {
        platform: live ? 'spotify' : 'landr', link_url: url.href
      }));
    } else control.disabled = true;
    action.replaceChildren(control);
    if (live) {
      document.querySelector('#listen-title').textContent = 'Écoute intégrale';
      document.querySelector('#replay-invitation').textContent = 'CORRIDA est disponible.';
      document.querySelector('#presave-help').textContent = url ? 'Retrouve le morceau sur Spotify.' : 'Lien Spotify à venir.';
      document.querySelector('#platform-status').hidden = true;
    }
  }
  if (live) return;
  const minutes = Math.ceil(remaining / 60000);
  countdown.querySelector('[data-days]').textContent = String(Math.floor(minutes / 1440)).padStart(2, '0');
  countdown.querySelector('[data-hours]').textContent = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  countdown.querySelector('[data-minutes]').textContent = String(minutes % 60).padStart(2, '0');
  timer = setTimeout(refreshRelease, Math.min(remaining, remaining % 60000 || 60000));
}
refreshRelease();
window.addEventListener('pageshow', refreshRelease);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshRelease(); });

if (corrida.fullTrackFile && /^[\w-]+\.mp3$/.test(corrida.fullTrackFile)) {
  const audio = document.createElement('audio');
  audio.controls = true; // Accessible native fallback until custom controls are installed.
  audio.preload = 'metadata';
  audio.src = '/corrida/' + encodeURIComponent(corrida.fullTrackFile);
  audio.setAttribute('aria-label', 'CORRIDA, écoute intégrale');
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
    play.setAttribute('aria-label', failed ? 'Réessayer l’écoute de CORRIDA' : playing ? 'Mettre CORRIDA en pause' : 'Écouter CORRIDA en intégralité');
    if (!valid) return;
    // Actual unique media ranges heard: seeking forward never earns skipped milestones.
    let heard = 0;
    for (let i = 0; i < audio.played.length; i++) heard += audio.played.end(i) - audio.played.start(i);
    for (const percent of [25, 50, 75, 100]) {
      const reached = percent === 100 ? audio.ended && heard >= audio.duration - 0.5 : heard / audio.duration >= percent / 100;
      if (started && reached && !milestones.has(percent)) {
        milestones.add(percent);
        measure('corrida_listen_progress', {listen_percent: percent, duration_seconds: Math.round(audio.duration)});
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
    status.textContent = 'Lecture en cours · CORRIDA';
    if (!started) { started = true; measure('corrida_listen_start'); }
    sync();
  });
  audio.addEventListener('pause', () => { if (!failed && !audio.ended) status.textContent = 'En pause · Reprends quand tu veux.'; sync(); });
  for (const event of ['loadstart', 'waiting', 'stalled']) audio.addEventListener(event, () => { if (!audio.paused) status.textContent = 'Chargement du morceau…'; });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked']) audio.addEventListener(event, sync);
  audio.addEventListener('ended', () => {
    status.textContent = 'Écoute terminée · Tu peux relancer le morceau.';
    document.querySelector('#replay-invitation').textContent = Date.now() < releaseTime ? 'Tu l’as découvert. Retrouve-le dès sa sortie.' : 'Tu veux le réécouter ? Retrouve-le sur Spotify.';
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
