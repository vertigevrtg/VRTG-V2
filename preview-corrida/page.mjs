import { corrida } from '/corrida/config.mjs';

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

const countdown = document.querySelector('.countdown');
let countdownTimer;
function refreshCountdown() {
  clearTimeout(countdownTimer);
  const remaining = releaseTime - Date.now();
  countdown.hidden = remaining <= 0;
  if (remaining <= 0) return;
  const minutes = Math.ceil(remaining / 60000);
  countdown.querySelector('[data-days]').textContent = String(Math.floor(minutes / 1440)).padStart(2, '0');
  countdown.querySelector('[data-hours]').textContent = String(Math.floor(minutes / 60) % 24).padStart(2, '0');
  countdown.querySelector('[data-minutes]').textContent = String(minutes % 60).padStart(2, '0');
  countdownTimer = setTimeout(refreshCountdown, Math.min(remaining, remaining % 60000 || 60000));
}
refreshCountdown();
window.addEventListener('pageshow', refreshCountdown);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshCountdown(); });

const audio = document.querySelector('audio');
const status = document.querySelector('#audio-status');
const button = document.querySelector('#listen-button');
const label = button.querySelector('.listen-label');
const icon = button.querySelector('.listen-icon');
const feedback = document.querySelector('#listen-feedback');
button.hidden = false;
function syncPlayback() {
  const playing = !audio.paused && !audio.ended;
  label.textContent = playing ? 'Mettre en pause' : audio.currentTime > 0 && !audio.ended ? 'Reprendre CORRIDA' : 'Écouter CORRIDA';
  icon.textContent = playing ? 'Ⅱ' : '▶';
  status.textContent = playing ? 'Lecture en cours · CORRIDA' : 'Écoute privée — avant-première';
}
function showError() {
  button.disabled = false;
  syncPlayback();
  feedback.hidden = false;
  feedback.textContent = 'Lecture indisponible. Appuyez sur Écouter CORRIDA pour réessayer.';
}
button.addEventListener('click', async () => {
  feedback.hidden = true;
  if (!audio.paused) { audio.pause(); return; }
  button.disabled = true;
  label.textContent = 'Chargement…';
  try {
    if (audio.error) audio.load();
    await audio.play();
  } catch (error) {
    if (error.name !== 'AbortError') showError();
  } finally {
    button.disabled = false;
    syncPlayback();
  }
});
for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlayback);
audio.addEventListener('error', showError);
