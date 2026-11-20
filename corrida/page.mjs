// CORRIDA-only settings: config.mjs is also used by /preview-corrida; leave it intact.
export const settings = { adStartSeconds: 55, ga4Id: 'G-J7VT42778D', metaPixelId: '' };

const audio = document.querySelector('#audio');
const play = document.querySelector('#play');
const controls = document.querySelector('#controls');
const progress = document.querySelector('#progress');
const status = document.querySelector('#status');
const params = new URLSearchParams(location.search);
const fromAd = params.has('utm_source');
const requested = params.get('t');
const seconds = requested !== null && requested.trim() !== '' ? Number(requested) : settings.adStartSeconds;
let initialOffset = fromAd && Number.isFinite(seconds) && seconds >= 0 ? seconds : (fromAd ? settings.adStartSeconds : 0);
let pendingOffset = initialOffset;
let started = false;
let failed = false;
let active = false;
let heard = 0;
let previousTime = 0;
let previousClock = 0;
const sent = new Set();

// Direct GA4 delivery avoids duplicating the legacy GTM listen-start trigger.
// Local QA never sends production analytics.
const production = /^(www\.)?vrtgmusic\.ca$/.test(location.hostname);
if (production) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', settings.ga4Id);
  const google = document.createElement('script');
  google.async = true;
  google.src = 'https://www.googletagmanager.com/gtag/js?id=' + settings.ga4Id;
  document.head.append(google);
  if (settings.metaPixelId) {
    if (!window.fbq) {
      const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      window._fbq = fbq; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      const meta = document.createElement('script'); meta.async = true;
      meta.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.append(meta);
    }
    window.fbq('init', settings.metaPixelId);
    window.fbq('track', 'PageView');
  }
}
function measure(event) {
  if (sent.has(event)) return;
  sent.add(event);
  const detail = { track:'corrida', page_path:location.pathname, start_seconds:initialOffset, listened_seconds:Math.round(heard) };
  window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail:{event, ...detail}}));
  if (!production) return;
  window.gtag?.('event', event, {send_to:settings.ga4Id, ...detail});
  if (settings.metaPixelId) window.fbq?.('trackSingleCustom', settings.metaPixelId, event, detail);
}
const time = n => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2,'0')}`;
function sample() {
  const now = performance.now();
  const delta = audio.currentTime - previousTime;
  // Count actual playback, including replayed sections; ignore seeks, stalls and pauses.
  if (active && !audio.seeking && delta > 0 && delta <= (now - previousClock) / 1000 * audio.playbackRate + 0.5) {
    heard += delta / audio.playbackRate;
    if (heard >= 30) measure('corrida_listen_30s');
  }
  previousTime = audio.currentTime; previousClock = now;
}
function sync() {
  const valid = Number.isFinite(audio.duration) && audio.duration > 0;
  progress.disabled = !valid;
  progress.max = valid ? audio.duration : 161;
  progress.value = audio.currentTime;
  document.querySelector('#elapsed').textContent = time(audio.currentTime);
  document.querySelector('#duration').textContent = time(valid ? audio.duration : 161);
  progress.setAttribute('aria-valuetext', `${time(audio.currentTime)} sur ${time(valid ? audio.duration : 161)}`);
  const playing = !audio.paused && !audio.ended;
  play.classList.toggle('playing', playing);
  play.setAttribute('aria-label', playing ? 'Mettre CORRIDA en pause' : failed ? 'Réessayer l’écoute de CORRIDA' : 'Écouter CORRIDA');
}
function applyOffset() {
  if (pendingOffset === null || !Number.isFinite(audio.duration)) return;
  const target = pendingOffset < audio.duration ? pendingOffset : 0;
  audio.currentTime = target;
  initialOffset = target;
  pendingOffset = null;
  document.querySelector('#listening-context').textContent = fromAd && target > 0 ? 'Tu écoutes l’extrait de la pub' : 'Tu écoutes CORRIDA';
}
function error() { active = false; failed = true; status.textContent = 'Impossible de lancer le son. Appuie sur lecture pour réessayer.'; sync(); }
function start() {
  if (failed) { failed = false; audio.load(); }
  if (audio.ended) audio.currentTime = 0;
  applyOffset();
  // Must remain synchronous inside the tap, with no await/network before play (iOS/in-app).
  const promise = audio.play();
  status.textContent = 'Chargement du morceau…';
  promise?.catch(e => { if (e.name !== 'AbortError') error(); });
  sync();
}
play.addEventListener('click', () => { if (audio.paused || failed) start(); else audio.pause(); });
document.querySelector('#restart').addEventListener('click', () => {
  pendingOffset = null; active = false; audio.currentTime = 0;
  document.querySelector('#listening-context').textContent = 'Tu écoutes CORRIDA';
  start();
});
progress.addEventListener('input', () => { pendingOffset = null; active = false; audio.currentTime = Number(progress.value); sync(); });
audio.addEventListener('loadedmetadata', () => { applyOffset(); sync(); });
audio.addEventListener('playing', () => {
  failed = false; active = true; previousTime = audio.currentTime; previousClock = performance.now();
  if (!started) { started = true; measure('corrida_listen_start'); }
  controls.classList.add('started'); document.querySelector('.timeline').hidden = false;
  document.querySelector('#help').hidden = true; document.querySelector('#listening-help').hidden = false;
  status.textContent = ''; sync();
});
audio.addEventListener('timeupdate', () => { sample(); sync(); });
audio.addEventListener('pause', () => { sample(); active = false; sync(); });
audio.addEventListener('seeking', () => { active = false; previousTime = audio.currentTime; });
audio.addEventListener('seeked', () => { active = !audio.paused; previousTime = audio.currentTime; previousClock = performance.now(); sync(); });
for (const event of ['waiting','stalled']) audio.addEventListener(event, () => { sample(); active = false; if (!audio.paused) status.textContent = 'Chargement du morceau…'; });
audio.addEventListener('ended', () => { sample(); active = false; if (started) measure('corrida_listen_complete'); status.textContent = 'Écoute terminée. Tu peux relancer le morceau.'; sync(); });
audio.addEventListener('error', error);
audio.controls = false; audio.hidden = true; controls.hidden = false;
if (initialOffset > 0) audio.src = '/corrida/Corrida_final.mp3#t=' + initialOffset;
applyOffset(); sync();
