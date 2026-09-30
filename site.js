(() => {
  'use strict';
  const tracks = [
    {id:'frequence-01',title:'Fréquence_01',url:'https://open.spotify.com/album/1WjyWQR7PkzstSkkiZlshC',embed:'https://open.spotify.com/embed/album/1WjyWQR7PkzstSkkiZlshC?theme=0'},
    {id:'frequence-02',title:'Fréquence_02',url:'https://open.spotify.com/track/1C9Vg9ocyrMYbzLWoFbl8R',embed:'https://open.spotify.com/embed/track/1C9Vg9ocyrMYbzLWoFbl8R?theme=0'}
  ];
  const player=document.querySelector('.platform-player');
  const frame=document.querySelector('#spotify-player');
  let selected=null, navigationRequest=0, lastPage=location.href;
  function track(name,properties={}) {
    const detail={event:name,page_path:location.pathname,...properties};
    window.dispatchEvent(new CustomEvent('vrtg:analytics',{detail}));
    if(typeof window.vrtgAnalytics==='function') window.vrtgAnalytics(detail);
  }
  function sync() {
    document.querySelectorAll('[data-track-row]').forEach(row=>{
      const active=row.dataset.trackRow===selected && !player.hidden;
      row.classList.toggle('is-active',active);
      if(active)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
    });
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
  track('page_view', { page_referrer: document.referrer });
})();
