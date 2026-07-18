(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const accent = getComputedStyle(body).getPropertyValue('--accent').trim() || '#725cff';

  const boot = document.getElementById('boot');
  const bootBar = document.getElementById('bootBar');
  const bootCount = document.getElementById('bootCount');
  let progress = 0;
  const finishBoot = () => {
    if (!boot) return;
    progress = 100;
    bootBar.style.width = '100%';
    bootCount.textContent = '100';
    setTimeout(() => {
      boot.classList.add('is-done');
      body.classList.add('loaded');
    }, reduceMotion ? 0 : 260);
  };
  if (reduceMotion) finishBoot();
  else {
    const timer = setInterval(() => {
      progress += Math.ceil(Math.random() * 12);
      if (progress >= 100) {
        clearInterval(timer);
        finishBoot();
      } else {
        bootBar.style.width = `${progress}%`;
        bootCount.textContent = String(progress).padStart(2, '0');
      }
    }, 90);
  }

  const menuButton = document.getElementById('menuButton');
  const menu = document.getElementById('menu');
  const toggleMenu = (force) => {
    if (!menuButton || !menu) return;
    const open = force ?? !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };
  menuButton?.addEventListener('click', () => toggleMenu());
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });

  const cursor = document.getElementById('cursor');
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let cursorPos = { ...pointer };
  window.addEventListener('pointermove', event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  document.querySelectorAll('a,button,input,[data-hover]').forEach(element => {
    element.addEventListener('pointerenter', () => cursor?.classList.add('is-hover'));
    element.addEventListener('pointerleave', () => cursor?.classList.remove('is-hover'));
  });
  document.querySelectorAll('.magnetic').forEach(element => {
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });
  const animateCursor = () => {
    if (!cursor) return;
    cursorPos.x += (pointer.x - cursorPos.x) * .16;
    cursorPos.y += (pointer.y - cursorPos.y) * .16;
    cursor.style.transform = `translate(${cursorPos.x}px,${cursorPos.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateCursor);
  };
  if (!reduceMotion) animateCursor();

  const canvas = document.getElementById('signalCanvas');
  const context = canvas?.getContext('2d');
  let width = innerWidth;
  let height = innerHeight;
  let dpr = 1;
  const particles = [];
  const resizeCanvas = () => {
    if (!canvas || !context) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles.length = 0;
    const count = Math.min(90, Math.max(34, Math.floor(width / 17)));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .16,
        vy: (Math.random() - .5) * .16,
        radius: Math.random() * 1.2 + .2,
        phase: Math.random() * Math.PI * 2
      });
    }
  };
  resizeCanvas();
  addEventListener('resize', resizeCanvas);
  const drawSignal = (time = 0) => {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(241,238,230,.36)';
    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 165 && distance > 0) {
        particle.x -= dx / distance * .22;
        particle.y -= dy / distance * .22;
      }
      context.globalAlpha = .18 + (.5 + Math.sin(time * .001 + particle.phase) * .5) * .58;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = .18;
    context.strokeStyle = accent;
    context.lineWidth = 1;
    context.beginPath();
    const offset = scrollY * .045;
    for (let x = 0; x < width; x += 6) {
      const y = height * .52 + Math.sin(x * .011 + time * .001 + offset) * 20 + Math.sin(x * .0038 - time * .00075) * 48;
      if (x === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
    context.globalAlpha = 1;
    requestAnimationFrame(drawSignal);
  };
  if (!reduceMotion) drawSignal();

  const observed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .13 });
    observed.forEach(element => observer.observe(element));
  }

  const heroImage = document.querySelector('.release-hero__media img');
  const parallaxHero = () => {
    if (!heroImage || reduceMotion) return;
    const y = Math.min(scrollY, innerHeight * 1.1);
    heroImage.style.transform = `scale(${1.045 + y / innerHeight * .045}) translateY(${y * .045}px)`;
  };
  addEventListener('scroll', parallaxHero, { passive: true });

  const wave = document.getElementById('consoleWave');
  const waveContext = wave?.getContext('2d');
  const resizeWave = () => {
    if (!wave || !waveContext) return;
    const rect = wave.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    wave.width = rect.width * ratio;
    wave.height = rect.height * ratio;
    waveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resizeWave();
  addEventListener('resize', resizeWave);
  const drawWave = (time = 0) => {
    if (!wave || !waveContext) return;
    const rect = wave.getBoundingClientRect();
    waveContext.clearRect(0, 0, rect.width, rect.height);
    for (let layer = 0; layer < 3; layer += 1) {
      waveContext.beginPath();
      waveContext.strokeStyle = layer === 0 ? 'rgba(241,238,230,.75)' : layer === 1 ? accent : 'rgba(241,238,230,.18)';
      waveContext.globalAlpha = layer === 0 ? .75 : layer === 1 ? .42 : .3;
      waveContext.lineWidth = layer === 0 ? 1.25 : 1;
      for (let x = 0; x <= rect.width; x += 3) {
        const envelope = Math.sin(Math.PI * x / rect.width);
        const y = rect.height / 2 + Math.sin(x * (.014 + layer * .006) + time * .001 * (layer + .7)) * (34 / (layer + 1)) * envelope + Math.sin(x * .055 - time * .0014) * 4;
        if (x === 0) waveContext.moveTo(x, y); else waveContext.lineTo(x, y);
      }
      waveContext.stroke();
    }
    waveContext.globalAlpha = 1;
    requestAnimationFrame(drawWave);
  };
  if (!reduceMotion) drawWave();

  const oracle = document.getElementById('oracle');
  const oraclePhrase = document.getElementById('oraclePhrase');
  const oraclePhrases = [
    'LES MURMURES DANS MA NUQUE M’INDIQUENT LE CHEMIN COSMIQUE.',
    'DANS LE PACTE, L’ORACLE DANSE AVEC SES CARTES.',
    'J’NAVIGUE DANS L’ÉNERGIE, HISSE LES VOILES DANS L’INVISIBLE.',
    'ÉCOUTE LA SYMPHONIE DES GALAXIES.',
    'CE QUE TU APPELLES HASARD A PEUT-ÊTRE DÉJÀ CHOISI SON HEURE.'
  ];
  let oracleIndex = 0;
  oracle?.addEventListener('click', () => {
    oracleIndex = (oracleIndex + 1) % oraclePhrases.length;
    if (!oraclePhrase) return;
    oraclePhrase.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 430, easing: 'cubic-bezier(.18,.8,.2,1)' });
    oraclePhrase.textContent = oraclePhrases[oracleIndex];
  });

  const hotspots = [...document.querySelectorAll('.hotspot')];
  const anatomyText = document.getElementById('anatomyText');
  hotspots.forEach(button => {
    button.addEventListener('click', () => {
      hotspots.forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
      if (anatomyText) anatomyText.textContent = button.dataset.text || '';
    });
  });

  const pressure = document.getElementById('pressure');
  const pressureValue = document.getElementById('pressureValue');
  const pressurePhrase = document.getElementById('pressurePhrase');
  const bars = [...document.querySelectorAll('.pressure-bars i')];
  const pressurePhrases = [
    'LE MIRAGE EST ENCORE LOIN.',
    'LA PEUR ENTRE DANS LA MATIÈRE.',
    'LE CORPS COMMENCE À RECEVOIR.',
    'LE TEMPS SE PLIE AUTOUR DU SIGNAL.',
    'CONSCIENCE S’ÉLÈVE. DISTANCE LE TEMPS.'
  ];
  const updatePressure = () => {
    if (!pressure) return;
    const value = Number(pressure.value);
    if (pressureValue) pressureValue.textContent = String(value).padStart(2, '0');
    if (pressurePhrase) pressurePhrase.textContent = pressurePhrases[Math.min(pressurePhrases.length - 1, Math.floor(value / 21))];
    bars.forEach((bar, index) => {
      const waveValue = Math.abs(Math.sin(index * .72 + value * .09));
      const active = index / bars.length * 100 < value;
      bar.style.setProperty('--h', `${12 + waveValue * (active ? 74 : 22)}%`);
      bar.style.setProperty('--o', active ? `${.45 + waveValue * .55}` : '.13');
    });
  };
  pressure?.addEventListener('input', updatePressure);
  updatePressure();
})();
