(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const body = document.body;

  // Boot sequence
  const boot = document.getElementById('boot');
  const bootBar = document.getElementById('bootBar');
  const bootCount = document.getElementById('bootCount');
  let progress = 0;
  const finishBoot = () => {
    progress = 100;
    bootBar.style.width = '100%';
    bootCount.textContent = '100';
    setTimeout(() => {
      boot.classList.add('is-done');
      body.classList.add('loaded');
    }, reduceMotion ? 0 : 280);
  };
  if (reduceMotion) finishBoot();
  else {
    const timer = setInterval(() => {
      progress += Math.ceil(Math.random() * 13);
      if (progress >= 100) {
        clearInterval(timer);
        finishBoot();
      } else {
        bootBar.style.width = progress + '%';
        bootCount.textContent = String(progress).padStart(2, '0');
      }
    }, 95);
  }

  // Menu
  const menuButton = document.getElementById('menuButton');
  const menu = document.getElementById('menu');
  const toggleMenu = (force) => {
    const open = force ?? !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };
  menuButton.addEventListener('click', () => toggleMenu());
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  // Cursor + magnetic interaction
  const cursor = document.getElementById('cursor');
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let cursorPos = { ...pointer };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; });
  document.querySelectorAll('a, button, input, [data-tilt]').forEach(el => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.12}px, ${(e.clientY-r.top-r.height/2)*.12}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  const animateCursor = () => {
    cursorPos.x += (pointer.x - cursorPos.x) * .16;
    cursorPos.y += (pointer.y - cursorPos.y) * .16;
    cursor.style.transform = `translate(${cursorPos.x}px,${cursorPos.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateCursor);
  };
  if (!reduceMotion) animateCursor();

  // Background signal field
  const canvas = document.getElementById('signalCanvas');
  const ctx = canvas.getContext('2d');
  const particles = [];
  let w, h, dpr;
  const resizeSignal = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles.length = 0;
    const count = Math.min(80, Math.floor(w / 18));
    for (let i=0;i<count;i++) particles.push({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
      r: Math.random()*1.2+.2, phase:Math.random()*Math.PI*2
    });
  };
  resizeSignal();
  addEventListener('resize', resizeSignal);
  const drawSignal = (t=0) => {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(241,238,230,.28)';
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x<0) p.x=w; if (p.x>w) p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
      const dx=pointer.x-p.x, dy=pointer.y-p.y, dist=Math.hypot(dx,dy);
      if (dist<150 && dist>0) { p.x -= dx/dist*.25; p.y -= dy/dist*.25; }
      const pulse=.5+Math.sin(t*.001+p.phase)*.5;
      ctx.globalAlpha=.2+pulse*.6;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=.08;
    ctx.strokeStyle='#725cff';
    ctx.beginPath();
    const offset = scrollY * .04;
    for(let x=0;x<w;x+=8){
      const y=h*.5+Math.sin(x*.012+t*.001+offset)*24+Math.sin(x*.004-t*.0007)*55;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.globalAlpha=1;
    requestAnimationFrame(drawSignal);
  };
  if (!reduceMotion) drawSignal();

  // Word-by-word scroll reveal
  document.querySelectorAll('.split-text').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  });
  const updateWords = () => {
    document.querySelectorAll('.split-text').forEach(el => {
      const rect = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight*.86 - rect.top) / (innerHeight*.7 + rect.height)));
      const words = [...el.querySelectorAll('.word')];
      const active = Math.floor(progress * words.length * 1.25);
      words.forEach((word,i) => word.classList.toggle('is-active', i <= active));
    });
  };
  addEventListener('scroll', updateWords, {passive:true});
  updateWords();

  // Tilt cards
  document.querySelectorAll('[data-tilt]').forEach(card => {
    const visual = card.querySelector('.release__visual');
    card.addEventListener('pointermove', e => {
      if (innerWidth < 900 || reduceMotion) return;
      const r = visual.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      visual.style.transform=`rotateY(${x*7}deg) rotateX(${-y*7}deg)`;
    });
    card.addEventListener('pointerleave', () => visual.style.transform='');
  });

  // Frequency decoder
  const range = document.getElementById('frequencyRange');
  const readout = document.getElementById('frequencyValue');
  const phrase = document.getElementById('decodedPhrase');
  const wave = document.getElementById('waveCanvas');
  const wctx = wave.getContext('2d');
  const phrases = [
    'LE BRUIT CACHE PARFOIS UNE DIRECTION.',
    'LE CORPS SAIT AVANT LES MOTS.',
    'LE HASARD A UNE MÉMOIRE.',
    'TA NUQUE EST UNE ANTENNE.',
    'LE VERTIGE EST UNE AUTRE FORME DE LUCIDITÉ.'
  ];
  let frequency = +range.value;
  const sizeWave = () => {
    const r=wave.getBoundingClientRect(), dp=Math.min(devicePixelRatio||1,2);
    wave.width=r.width*dp; wave.height=r.height*dp;
    wctx.setTransform(dp,0,0,dp,0,0);
  };
  sizeWave(); addEventListener('resize',sizeWave);
  range.addEventListener('input', () => {
    frequency=+range.value;
    readout.textContent=(18 + frequency*.59).toFixed(1);
    phrase.textContent=phrases[Math.min(phrases.length-1, Math.floor(frequency/21))];
  });
  const drawWave=(t=0)=>{
    const r=wave.getBoundingClientRect();
    wctx.clearRect(0,0,r.width,r.height);
    const amp=22+frequency*.65, density=.008+frequency*.00013;
    for(let layer=0;layer<3;layer++){
      wctx.beginPath();
      wctx.strokeStyle=layer===0?'rgba(241,238,230,.74)':layer===1?'rgba(114,92,255,.4)':'rgba(224,170,81,.28)';
      wctx.lineWidth=layer===0?1.4:1;
      for(let x=0;x<r.width;x+=3){
        const envelope=Math.sin(Math.PI*x/r.width);
        const y=r.height/2 + Math.sin(x*density*(layer+1)+t*.001*(layer+.7))*amp*envelope/(layer+1) + Math.sin(x*.03-t*.0013)*5;
        x===0?wctx.moveTo(x,y):wctx.lineTo(x,y);
      }
      wctx.stroke();
    }
    requestAnimationFrame(drawWave);
  };
  if (!reduceMotion) drawWave();

  // Parallax portrait
  const portrait = document.querySelector('[data-parallax] img');
  const parallax = () => {
    if (!portrait || reduceMotion) return;
    const rect=portrait.parentElement.getBoundingClientRect();
    const center=(rect.top+rect.height/2-innerHeight/2)/innerHeight;
    portrait.style.transform=`scale(1.08) translateY(${center*-28}px)`;
  };
  addEventListener('scroll',parallax,{passive:true}); parallax();

  // Prototype form behavior
  const form=document.getElementById('signalForm');
  const formMessage=document.getElementById('formMessage');
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const email=new FormData(form).get('email');
    formMessage.textContent=`SIGNAL REÇU — ${String(email).toUpperCase()}`;
    form.reset();
  });
})();
