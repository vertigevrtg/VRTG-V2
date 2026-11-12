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
  const localTracks=[
    ...['01','02','03'].map(id=>({id:`fragment-${id}`,title:`Fragment_${id}`,src:`/assets/audio/fragment-${id}-final.mp3`,album:'Fragments',art:'/assets/cover-fragments.webp'})),
    {id:'frequence-03',title:'Fréquence_03',src:'/assets/audio/frequence-03.mp3',album:'Fréquences',art:'/assets/cover-frequence-03.webp'}
  ];
  const audioButtonSelector='button[data-fragment],button[data-audio-track]';
  const buttonTrackId=button=>button.dataset.audioTrack || `fragment-${button.dataset.fragment}`;
  function queue() {
    return localTracks.map((item,index)=>({item,index})).filter(({item})=>item.album===localTracks[audioIndex]?.album).map(({index})=>index);
  }
  function stepAudio(direction) {
    const indices=queue();
    if(indices.length>1)playAudio(indices[(indices.indexOf(audioIndex)+direction+indices.length)%indices.length]);
  }
  let audioIndex=-1, audioRequest=0;
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
        (row.dataset.trackRow===localTracks[audioIndex]?.id && !fragmentPlayer.hidden);
      row.classList.toggle('is-active',active);
      if(active)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
    });
    const playing=!audio.paused && !audio.ended;
    const toggle=document.querySelector('#fragment-toggle');
    toggle.textContent=playing?'Ⅱ':'▶';
    toggle.setAttribute('aria-label',playing?'Mettre en pause':'Reprendre la lecture');
    document.querySelectorAll(audioButtonSelector).forEach(button=>{
      const item=localTracks.find(item=>item.id===buttonTrackId(button));
      const active=playing && item?.id===localTracks[audioIndex]?.id;
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',`${active?'Mettre en pause':'Écouter'} ${item?.title}`);
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
  function pauseAudio() {
    ++audioRequest;audio.pause();fragmentPlayer.hidden=true;
    document.body.classList.remove('has-player');
    sync();
  }
  async function playAudio(index,fromUser=true) {
    const item=localTracks[index];
    if(!item)return;
    const request=++audioRequest;
    stopSpotify();
    if(index!==audioIndex) {
      audioIndex=index;audio.src=item.src;
      updateProgress();
    }
    document.querySelector('#fragment-title').textContent=item.title;
    document.querySelector('#fragment-art').src=item.art;
    fragmentPlayer.setAttribute('aria-label',`Lecteur ${item.album}`);
    document.querySelector('#fragment-player .eyebrow').textContent=`VRTG · ${item.album.toUpperCase()}`;
    document.querySelector('#close-fragment-player').setAttribute('aria-label',`Fermer le lecteur ${item.album} et arrêter la lecture`);
    const multiple=queue().length>1;
    document.querySelector('#fragment-previous').disabled=!multiple;
    document.querySelector('#fragment-next').disabled=!multiple;
    document.querySelector('#fragment-previous').setAttribute('aria-label','Morceau précédent');
    document.querySelector('#fragment-next').setAttribute('aria-label','Morceau suivant');
    fragmentPlayer.hidden=false;document.body.classList.add('has-player');
    fragmentStatus.classList.add('sr-only');
    fragmentStatus.textContent=`Chargement de ${item.title}`;
    if(fromUser)track('play_click',{track_id:item.id,provider:'native'});
    if('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata=new MediaMetadata({title:item.title,artist:'VRTG',album:item.album,artwork:[{src:new URL(item.art,location.origin).href,type:'image/webp'}]});
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
    const button=event.target.closest(audioButtonSelector);
    if(!button)return;
    const index=localTracks.findIndex(item=>item.id===buttonTrackId(button));
    if(index===audioIndex && !audio.paused){++audioRequest;audio.pause();}
    else playAudio(index);
  });
  document.querySelector('#fragment-toggle').addEventListener('click',()=>{
    if(audio.paused)playAudio(audioIndex<0?0:audioIndex);
    else{++audioRequest;audio.pause();}
  });
  document.querySelector('#fragment-previous').addEventListener('click',()=>stepAudio(-1));
  document.querySelector('#fragment-next').addEventListener('click',()=>stepAudio(1));
  document.querySelector('#close-fragment-player').addEventListener('click',()=>{
    pauseAudio();
    if(audio.readyState>0)audio.currentTime=0;
    fragmentStatus.classList.add('sr-only');
    ([...document.querySelectorAll(audioButtonSelector)].find(button=>buttonTrackId(button)===localTracks[audioIndex]?.id)||document.querySelector('.brand')).focus();
  });
  fragmentSeek.addEventListener('input',()=>{
    if(Number.isFinite(audio.duration))audio.currentTime=Number(fragmentSeek.value)/100*audio.duration;
  });
  ['timeupdate','durationchange','loadedmetadata','emptied'].forEach(name=>audio.addEventListener(name,updateProgress));
  audio.addEventListener('play',()=>{
    sync();track('track_started',{track_id:localTracks[audioIndex].id,provider:'native'});
  });
  audio.addEventListener('pause',sync);
  audio.addEventListener('ended',()=>{
    const indices=queue(), next=indices[indices.indexOf(audioIndex)+1];
    if(next!==undefined)playAudio(next,false);
    else{sync();fragmentStatus.textContent=`Fin de ${localTracks[audioIndex].album}.`;}
  });
  audio.addEventListener('error',()=>{
    fragmentStatus.classList.remove('sr-only');
    fragmentStatus.textContent='Ce morceau ne peut pas être chargé. Réessayez avec le bouton de lecture.';
    track('audio_error',{track_id:localTracks[audioIndex]?.id});
  });
  if('mediaSession' in navigator) {
    const handlers={play:()=>playAudio(audioIndex<0?0:audioIndex),pause:()=>audio.pause(),previoustrack:()=>stepAudio(-1),nexttrack:()=>stepAudio(1),seekto:details=>{if(Number.isFinite(details.seekTime))audio.currentTime=details.seekTime;}};
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
      pauseAudio();
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
