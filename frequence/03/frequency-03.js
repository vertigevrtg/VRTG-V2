(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const boot = document.getElementById("f03Boot");
  const bootBar = document.getElementById("f03BootBar");
  const bootCount = document.getElementById("f03BootCount");
  const menuButton = document.getElementById("f03MenuButton");
  const menu = document.getElementById("f03Menu");
  const eye = document.getElementById("f03Eye");
  const eyeMessage = document.getElementById("f03EyeMessage");
  const orbit = document.getElementById("f03Orbit");
  const counter = document.getElementById("f03PresenceCount");
  const presave = document.getElementById("f03Presave");

  const done = () => { bootBar.style.width = "100%"; bootCount.textContent = "100"; setTimeout(() => boot.classList.add("is-done"), reduced ? 0 : 240); };
  if (reduced) done();
  else {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 8 + Math.ceil(Math.random() * 11);
      if (progress >= 100) { clearInterval(timer); done(); return; }
      bootBar.style.width = `${progress}%`;
      bootCount.textContent = String(progress).padStart(2, "0");
    }, 92);
  }

  const toggleMenu = (force) => {
    const isOpen = force ?? !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menu.setAttribute("aria-hidden", String(!isOpen));
  };
  menuButton.addEventListener("click", () => toggleMenu());
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  addEventListener("keydown", (event) => { if (event.key === "Escape") toggleMenu(false); });

  eye.addEventListener("click", () => {
    const isOpen = eye.classList.toggle("is-open");
    eye.setAttribute("aria-pressed", String(isOpen));
    eyeMessage.textContent = isOpen ? "PERCEPTION / OUVERTE — LA PROJECTION S'EFFACE" : "PERCEPTION / EN VEILLE";
  });

  const setOrbit = (x, y) => orbit.style.setProperty("--orbit-tilt", `${Math.max(-18, Math.min(18, (x + y) * .08))}deg`);
  orbit.addEventListener("pointermove", (event) => {
    const rect = orbit.getBoundingClientRect();
    setOrbit(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
  });
  orbit.addEventListener("pointerleave", () => setOrbit(0, 0));
  orbit.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const rotation = Number.parseFloat(getComputedStyle(orbit).getPropertyValue("--orbit-tilt")) || 0;
    const next = rotation + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -4 : 4);
    orbit.style.setProperty("--orbit-tilt", `${Math.max(-18, Math.min(18, next))}deg`);
  });

  const presenceSection = document.querySelector(".f03-presences");
  const animateCounter = () => {
    const target = 103;
    let current = 0;
    const update = () => {
      current += Math.max(1, Math.ceil((target - current) / 12));
      counter.textContent = String(Math.min(current, target)).padStart(3, "0");
      if (current < target) requestAnimationFrame(update);
    };
    update();
  };
  new IntersectionObserver((entries, observer) => {
    if (entries.some((entry) => entry.isIntersecting)) { animateCounter(); observer.disconnect(); }
  }, { threshold: .35 }).observe(presenceSection);

  const presaveUrl = body.dataset.presaveUrl?.trim();
  if (presaveUrl) presave.href = presaveUrl;

  const canvas = document.getElementById("f03Field");
  const context = canvas.getContext("2d");
  let width = 0; let height = 0; let pixelRatio = 1; let particles = [];
  const resize = () => {
    pixelRatio = Math.min(devicePixelRatio || 1, 2); width = innerWidth; height = innerHeight;
    canvas.width = width * pixelRatio; canvas.height = height * pixelRatio; context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = Array.from({ length: Math.min(72, Math.max(30, Math.floor(width / 26))) }, () => ({ x: Math.random() * width, y: Math.random() * height, speed: .12 + Math.random() * .34, size: .4 + Math.random() * 1.3 }));
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(244,243,255,.56)";
    particles.forEach((particle) => { particle.y -= particle.speed; if (particle.y < -4) { particle.y = height + 4; particle.x = Math.random() * width; } context.globalAlpha = .22 + Math.sin(particle.y * .02) * .12; context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); context.fill(); });
    context.globalAlpha = 1;
    if (!reduced) requestAnimationFrame(draw);
  };
  resize(); addEventListener("resize", resize, { passive: true }); if (!reduced) draw();
})();
