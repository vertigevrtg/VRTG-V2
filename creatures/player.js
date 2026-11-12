(() => {
  const byId = id => document.getElementById(id);
  const tracks = JSON.parse(byId('ep-data').textContent);
  const audio = byId('ep-audio');
  const choices = [...document.querySelectorAll('[data-track]')];
  const toggles = [...document.querySelectorAll('[data-toggle]')];
  let index = -1;
  let request = 0;
  function measure(name, properties = {}) {
    const detail = {event: 'creatures_' + name, page_path: location.pathname, ...properties};
    window.dispatchEvent(new CustomEvent('vrtg:analytics', {detail}));
    if (typeof window.vrtgAnalytics === 'function') window.vrtgAnalytics(detail);
  }
  const status = message => { byId('state').textContent = message; };
  function synchronize() {
    const track = tracks[index];
    const playing = !audio.paused && !audio.ended;
    for (const button of choices) {
      const active = button.dataset.track === track?.id;
      button.setAttribute('aria-pressed', String(active && playing));
      if (!button.disabled) {
        button.textContent = active && playing ? 'Pause' : 'Écouter';
        const item = tracks.find(t => t.id === button.dataset.track);
        button.setAttribute('aria-label', button.textContent + ' · ' + item.title);
      }
      const row = button.closest('li');
      if (row && active) row.setAttribute('aria-current','true');
      else row?.removeAttribute('aria-current');
    }
    for (const button of toggles) {
      button.disabled = !tracks.some(t => t.audio);
      button.textContent = playing ? 'Pause' : 'Lecture';
    }
    byId('prev').disabled = !tracks[index-1]?.audio;
    byId('next').disabled = !track || !tracks[index+1]?.audio;
    byId('mute').disabled = byId('volume').disabled = !track;
  }
  async function start(i) {
    const track = tracks[i];
    if (!track?.audio) return;
    const token = ++request;
    if (index !== i || audio.error) {
      index = i;
      audio.src = track.audio;
      byId('current').textContent = byId('mini-title').textContent = track.title;
      const art = byId('art');
      art.hidden = !track.cover;
      if (track.cover) art.src = track.cover;
      else art.removeAttribute('src');
      byId('mini').hidden = false;
      document.body.classList.add('mini-active');
    }
    status('Chargement…');
    synchronize();
    try { await audio.play(); }
    catch (error) {
      if (token === request && error.name !== 'AbortError') status('Lecture indisponible. Appuyez sur Lecture pour réessayer.');
    }
  }
  function toggle(i) {
    if (i === index && !audio.paused) { ++request; audio.pause(); }
    else start(i);
  }
  choices.forEach(button => button.addEventListener('click', () => toggle(tracks.findIndex(t => t.id === button.dataset.track))));
  toggles.forEach(button => button.addEventListener('click', () => toggle(index < 0 ? tracks.findIndex(t => t.audio) : index)));
  byId('prev').onclick = () => start(index-1);
  byId('next').onclick = () => start(index+1);
  byId('mute').onclick = () => {audio.muted = !audio.muted;};
  byId('volume').oninput = event => {audio.volume = Number(event.target.value); audio.muted = false;};
  audio.onvolumechange = () => {
    byId('mute').setAttribute('aria-pressed', String(audio.muted));
    byId('volume').value = audio.muted ? 0 : audio.volume;
  };
  function time(seconds) {
    return Math.floor(seconds/60) + ':' + String(Math.floor(seconds%60)).padStart(2,'0');
  }
  function progress() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0 && !audio.error;
    byId('seek').disabled = !ready;
    byId('seek').value = ready ? audio.currentTime/audio.duration*100 : 0;
    byId('elapsed').textContent = time(audio.currentTime || 0);
    byId('duration').textContent = ready ? time(audio.duration) : '–:––';
    byId('seek').setAttribute('aria-valuetext', byId('elapsed').textContent+' sur '+byId('duration').textContent);
  }
  byId('seek').oninput = event => {if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value)/100;};
  for (const name of ['timeupdate','durationchange','loadedmetadata','emptied']) audio.addEventListener(name,progress);
  audio.onwaiting = () => status('Chargement…');
  audio.onplaying = () => {status('En lecture'); synchronize();};
  audio.onplay = () => measure('track_play',{track_id:tracks[index].id});
  audio.onpause = () => {if (audio.paused && !audio.ended && !audio.error) status('En pause'); synchronize();};
  audio.onerror = () => {status('Ce fichier ne peut pas être lu. Réessayez avec Lecture.'); progress(); synchronize();};
  audio.onended = () => {
    measure('track_complete',{track_id:tracks[index].id});
    if (tracks[index+1]?.audio) start(index+1);
    else {status('Fin du fragment.'); synchronize();}
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.hash === '#collection') measure('explore_click');
    if (link.hash === '#ecouter') measure('listen_click');
    if (link.hash.startsWith('#lyrics-')) {
      const panel = byId(link.hash.slice(1));
      if (panel) panel.open = true;
    }
    if (link.dataset.service) measure('streaming_click',{platform:link.dataset.service,track_id:link.dataset.id});
  });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('entered'); observer.unobserve(entry.target);
      }
    });
    document.querySelectorAll('.work figure, #traces figure').forEach(el => observer.observe(el));
  }
  synchronize();
  measure('page_view');
})();
