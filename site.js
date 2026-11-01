(() => {
  'use strict';
  const tracks = [
    {id:'frequence-01',title:'Fréquence_01',url:'https://open.spotify.com/album/1WjyWQR7PkzstSkkiZlshC',embed:'https://open.spotify.com/embed/album/1WjyWQR7PkzstSkkiZlshC?theme=0'},
    {id:'frequence-02',title:'Fréquence_02',url:'https://open.spotify.com/track/1C9Vg9ocyrMYbzLWoFbl8R',embed:'https://open.spotify.com/embed/track/1C9Vg9ocyrMYbzLWoFbl8R?theme=0'}
  ];
  const player=document.querySelector('.platform-player');
  const frame=document.querySelector('#spotify-player');
  const fragmentPlayer=document.querySelector('#fragment-player');
  const audio=document.querySelector('#fragment-audio');
  const fragmentSeek=document.querySelector('#fragment-seek');
  const fragmentStatus=document.querySelector('#fragment-status');
  const fragments=['01','02','03'].map(id=>({id,title:`Fragment_${id}`,src:`/assets/audio/fragment-${id}-final.mp3`}));
  let fragmentIndex=-1, audioRequest=0;
  let selected=null, navigationRequest=0, lastPage=location.href;
  document.documentElement.classList.add('has-audio-js');
  function track(name,properties={}) {
    const detail={event:name,page_path:location.pathname,...properties};
    window.dispatchEvent(new CustomEvent('vrtg:analytics',{detail}));
    if(typeof window.vrtgAnalytics==='function') window.vrtgAnalytics(detail);
  }
  function sync() {
    document.querySelectorAll('[data-track-row]').forEach(row=>{
      const active=(row.dataset.trackRow===selected && !player.hidden) ||
        (row.dataset.trackRow===`fragment-${fragments[fragmentIndex]?.id}` && !fragmentPlayer.hidden);
      row.classList.toggle('is-active',active);
      if(active)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
    });
    const playing=!audio.paused && !audio.ended;
    const toggle=document.querySelector('#fragment-toggle');
    toggle.textContent=playing?'Ⅱ':'▶';
    toggle.setAttribute('aria-label',playing?'Mettre en pause':'Reprendre la lecture');
    document.querySelectorAll('[data-fragment]').forEach(button=>{
      const active=playing && button.dataset.fragment===fragments[fragmentIndex]?.id;
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',`${active?'Mettre en pause':'Écouter'} Fragment_${button.dataset.fragment}`);
      button.querySelector('[data-fragment-label]').textContent=active?'Pause':'Écouter';
      button.querySelector('[data-fragment-icon]').textContent=active?'Ⅱ':'▶';
    });
  }
  function formatTime(value) {
    const seconds=Number.isFinite(value)?Math.floor(value):0;
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  }
  function updateProgress() {
    const duration=audio.duration;
    const ready=Number.isFinite(duration) && duration>0;
    fragmentSeek.disabled=!ready;
    fragmentSeek.value=ready?audio.currentTime/duration*100:0;
    fragmentSeek.setAttribute('aria-valuetext',`${formatTime(audio.currentTime)} sur ${formatTime(duration)}`);
    document.querySelector('#fragment-elapsed').textContent=formatTime(audio.currentTime);
    document.querySelector('#fragment-duration').textContent=formatTime(duration);
  }
  function stopSpotify() {
    frame.removeAttribute('src');selected=null;player.hidden=true;
    document.body.classList.remove('has-platform-player');
  }
  function pauseFragments() {
    ++audioRequest;audio.pause();fragmentPlayer.hidden=true;
    document.body.classList.remove('has-player');
    sync();
  }
  async function playFragment(index,fromUser=true) {
    const item=fragments[index];
    if(!item)return;
    const request=++audioRequest;
    stopSpotify();
    if(index!==fragmentIndex) {
      fragmentIndex=index;audio.src=item.src;
      updateProgress();
    }
    document.querySelector('#fragment-title').textContent=item.title;
    document.querySelector('#fragment-art').src='/assets/cover-fragments.webp';
    fragmentPlayer.hidden=false;document.body.classList.add('has-player');
    fragmentStatus.classList.add('sr-only');
    fragmentStatus.textContent=`Chargement de ${item.title}`;
    if(fromUser)track('play_click',{track_id:`fragment-${item.id}`,provider:'native'});
    if('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata=new MediaMetadata({title:item.title,artist:'VRTG',album:'Fragments',artwork:[{src:new URL('/assets/cover-fragments.webp',location.origin).href,type:'image/webp'}]});
    }
    try {
      await audio.play();
      if(request===audioRequest)fragmentStatus.textContent=`Lecture : ${item.title}`;
    } catch(error) {
      if(request!==audioRequest || error.name==='AbortError')return;
      fragmentStatus.classList.remove('sr-only');
      fragmentStatus.textContent='Lecture indisponible. Réessayez avec le bouton de lecture.';
    }
    sync();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-fragment]');
    if(!button)return;
    const index=fragments.findIndex(item=>item.id===button.dataset.fragment);
    if(index===fragmentIndex && !audio.paused){++audioRequest;audio.pause();}
    else playFragment(index);
  });
  document.querySelector('#fragment-toggle').addEventListener('click',()=>{
    if(audio.paused)playFragment(fragmentIndex<0?0:fragmentIndex);
    else{++audioRequest;audio.pause();}
  });
  document.querySelector('#fragment-previous').addEventListener('click',()=>playFragment((fragmentIndex-1+fragments.length)%fragments.length));
  document.querySelector('#fragment-next').addEventListener('click',()=>playFragment((fragmentIndex+1)%fragments.length));
  document.querySelector('#close-fragment-player').addEventListener('click',()=>{
    pauseFragments();
    if(audio.readyState>0)audio.currentTime=0;
    fragmentStatus.classList.add('sr-only');
    (document.querySelector(`[data-fragment="${fragments[fragmentIndex]?.id}"]`)||document.querySelector('.brand')).focus();
  });
  fragmentSeek.addEventListener('input',()=>{
    if(Number.isFinite(audio.duration))audio.currentTime=Number(fragmentSeek.value)/100*audio.duration;
  });
  ['timeupdate','durationchange','loadedmetadata','emptied'].forEach(name=>audio.addEventListener(name,updateProgress));
  audio.addEventListener('play',()=>{
    sync();track('track_started',{track_id:`fragment-${fragments[fragmentIndex].id}`,provider:'native'});
  });
  audio.addEventListener('pause',sync);
  audio.addEventListener('ended',()=>{
    if(fragmentIndex<fragments.length-1)playFragment(fragmentIndex+1,false);
    else{sync();fragmentStatus.textContent='Fin de Fragments.';}
  });
  audio.addEventListener('error',()=>{
    fragmentStatus.classList.remove('sr-only');
    fragmentStatus.textContent='Ce morceau ne peut pas être chargé. Réessayez avec le bouton de lecture.';
    track('audio_error',{track_id:`fragment-${fragments[fragmentIndex]?.id}`});
  });
  if('mediaSession' in navigator) {
    const handlers={play:()=>playFragment(fragmentIndex<0?0:fragmentIndex),pause:()=>audio.pause(),previoustrack:()=>playFragment((fragmentIndex-1+fragments.length)%fragments.length),nexttrack:()=>playFragment((fragmentIndex+1)%fragments.length),seekto:details=>{if(Number.isFinite(details.seekTime))audio.currentTime=details.seekTime;}};
    for(const [action,handler] of Object.entries(handlers)){
      try{navigator.mediaSession.setActionHandler(action,handler);}catch{/* Some mobile browsers expose only part of the Media Session API. */}
    }
  }
  document.querySelector('#close-player').addEventListener('click',()=>{
    frame.removeAttribute('src');selected=null;player.hidden=true;
    document.body.classList.remove('has-platform-player');sync();
    (document.querySelector('[data-play]')||document.querySelector('.brand')).focus();
  });
  const normalize = path => path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
  const routes = new Set(['/', '/frequences', '/fragments']);
  function scrollToDestination(url) {
    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }
  async function navigate(url, push = true) {
    const request = ++navigationRequest;
    try {
      const response = await fetch(url.pathname, { headers: { 'Accept': 'text/html' } });
      if (!response.ok) throw new Error('Navigation unavailable');
      const html = await response.text();
      if (request !== navigationRequest) return;
      const next = new DOMParser().parseFromString(html, 'text/html');
      if (!next.querySelector('main')) throw new Error('Missing page');
      if (push) history.pushState({}, '', url);
      document.querySelector('main').replaceWith(next.querySelector('main'));
      document.querySelector('.header').replaceWith(next.querySelector('.header'));
      document.title = next.title;
      // Keep the document head in sync with the static destination, including structured data.
      document.head.querySelectorAll('meta[name="description"],meta[name="robots"],meta[name="theme-color"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"]').forEach(el => el.remove());
      next.head.querySelectorAll('meta[name="description"],meta[name="robots"],meta[name="theme-color"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"]').forEach(el => document.head.append(el));
      document.body.className = next.body.className;
      document.body.classList.toggle('has-platform-player', !player.hidden);
      document.body.classList.toggle('has-player', !fragmentPlayer.hidden);
      sync();
      document.querySelector('main').focus({ preventScroll: true });
      scrollToDestination(url);
      document.querySelector('#navigation-status').textContent = document.title;
      track('page_view', { page_referrer: lastPage });
      lastPage = location.href;
    } catch {
      if (request === navigationRequest) location.assign(url.href);
    }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.dataset.platform) track('streaming_click', { platform: link.dataset.platform, track_id: link.dataset.track || '01' });
    if (link.dataset.play) {
      event.preventDefault();
      const item = tracks.find(t => t.id === link.dataset.play);
      if (!item) return;
      pauseFragments();
      if (selected !== item.id) { frame.src = item.embed; selected = item.id; }
      player.hidden = false;
      document.body.classList.add('has-platform-player');
      document.querySelector('#player-title').textContent = item.title + ' · Spotify';
      document.querySelector('#player-external').href = item.url;
      track('play_click', {track_id:item.id, provider:'spotify'});
      sync();
      frame.focus();
      return;
    }
    const url = new URL(link.href);
    if (url.origin !== location.origin || link.target || link.hasAttribute('download') || !routes.has(normalize(url.pathname))) return;
    if (normalize(url.pathname) === normalize(location.pathname)) return;
    event.preventDefault();
    if (normalize(location.pathname) === '/') track('project_open', { project: normalize(url.pathname).slice(1) });
    navigate(url);
  });
  window.addEventListener('popstate', () => {
    const url = new URL(location.href);
    const renderedPath = new URL(document.querySelector('link[rel="canonical"]').href).pathname;
    if (normalize(url.pathname) === normalize(renderedPath)) { ++navigationRequest; scrollToDestination(url); }
    else navigate(url, false);
  });
  sync();
  updateProgress();
  track('page_view', { page_referrer: document.referrer });
})();
