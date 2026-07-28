(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const byId = (id) => document.getElementById(id);
  const status = byId("f03Status");
  const progressBar = byId("f03ProgressBar");
  const progressLabel = byId("f03ProgressLabel");
  const flash = byId("f03Flash");

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const boot = byId("f03Boot");
  const bootBar = byId("f03BootBar");
  const bootCount = byId("f03BootCount");
  const finishBoot = () => {
    bootBar.style.width = "100%";
    bootCount.textContent = "100";
    window.setTimeout(() => boot.classList.add("is-done"), reduced ? 0 : 260);
  };

  if (reduced) {
    finishBoot();
  } else {
    let bootProgress = 0;
    const bootTimer = window.setInterval(() => {
      bootProgress += 7 + Math.ceil(Math.random() * 12);
      if (bootProgress >= 100) {
        window.clearInterval(bootTimer);
        finishBoot();
        return;
      }
      bootBar.style.width = `${bootProgress}%`;
      bootCount.textContent = String(bootProgress).padStart(2, "0");
    }, 88);
  }

  const menuButton = byId("f03MenuButton");
  const menu = byId("f03Menu");
  const toggleMenu = (force) => {
    const open = force ?? !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  };

  menuButton.addEventListener("click", () => toggleMenu());
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => toggleMenu(false)));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleMenu(false);
  });

  const stages = [...document.querySelectorAll("[data-stage]")];
  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0;
    progressBar.style.width = `${percentage}%`;
  };

  const stageObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) progressLabel.textContent = visible.target.dataset.stage;
  }, { threshold: [.2, .45, .7] });

  stages.forEach((stage) => stageObserver.observe(stage));
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  updateScrollProgress();

  const createHoldInteraction = ({ button, fill, duration, onProgress, onComplete, resetOnRelease = true }) => {
    let frame = 0;
    let startedAt = 0;
    let value = 0;
    let complete = false;

    const render = () => {
      if (fill) fill.style.width = `${value}%`;
      if (onProgress) onProgress(value);
    };

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (!complete && resetOnRelease) {
        value = 0;
        render();
      }
    };

    const tick = (time) => {
      if (!startedAt) startedAt = time;
      value = Math.min(100, (time - startedAt) / duration * 100);
      render();
      if (value >= 100) {
        complete = true;
        stop();
        onComplete();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const start = (event) => {
      if (complete || frame) return;
      if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
      if (event.cancelable) event.preventDefault();
      startedAt = 0;
      if (reduced) {
        value = 100;
        complete = true;
        render();
        onComplete();
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("click", start);
    button.addEventListener("keydown", start);
    button.addEventListener("keyup", stop);
    button.addEventListener("blur", stop);
  };

  const projection = byId("f03Projection");
  const holdButton = byId("f03Hold");
  const projectionResult = byId("f03ProjectionResult");
  createHoldInteraction({
    button: holdButton,
    fill: byId("f03HoldFill"),
    duration: 1250,
    onComplete: () => {
      projection.classList.add("is-broken");
      holdButton.disabled = true;
      holdButton.querySelector(".f03-hold__label").textContent = "PROJECTION FISSURÉE";
      projectionResult.textContent = "ANOMALIE DÉTECTÉE — LE RÉCIT PERD SON AUTORITÉ";
      announce("FISSURE OUVERTE");
      flash.classList.remove("is-active");
      void flash.offsetWidth;
      flash.classList.add("is-active");
    }
  });

  const layerButtons = [...document.querySelectorAll("[data-reveal]")];
  const gateMessage = byId("f03GateMessage");
  const revealedLayers = new Set();
  layerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("is-revealed");
      revealedLayers.add(button.dataset.reveal);
      gateMessage.textContent = `${revealedLayers.size} / 3 COUCHES DÉCODÉES`;
      if (revealedLayers.size === 3) {
        gateMessage.textContent = "PASSAGE OUVERT — LE REGARD PEUT CHANGER D'AXE";
        announce("RÉCIT DÉCODÉ");
      }
    });
  });

  const awakening = document.querySelector(".f03-awakening");
  const eye = byId("f03Eye");
  const eyeMessage = byId("f03EyeMessage");
  const vision = byId("f03Vision");
  eye.addEventListener("click", () => {
    const open = !eye.classList.contains("is-open");
    eye.classList.toggle("is-open", open);
    awakening.classList.toggle("is-awake", open);
    body.classList.toggle("is-awake", open);
    eye.setAttribute("aria-pressed", String(open));
    eyeMessage.textContent = open
      ? "PERCEPTION / OUVERTE — LA PROJECTION A PERDU SON OMBRE"
      : "PERCEPTION / EN VEILLE";
    vision.setAttribute("aria-hidden", String(!open));
    announce(open ? "TROISIÈME ŒIL OUVERT" : "PERCEPTION EN VEILLE");
  });

  const ritualNodes = [...document.querySelectorAll("[data-tone]")];
  const ritualCount = byId("f03RitualCount");
  const ritualMessage = byId("f03RitualMessage");
  const ceremony = document.querySelector(".f03-ceremony");
  const activeTones = new Set();
  ritualNodes.forEach((node) => {
    node.addEventListener("click", () => {
      node.classList.add("is-active");
      activeTones.add(node.dataset.tone);
      ritualCount.textContent = `${activeTones.size} / 3`;
      ritualMessage.textContent = `${node.dataset.tone} / SYNCHRONISÉE`;
      if (activeTones.size === 3) {
        ceremony.classList.add("is-synced");
        body.classList.add("is-ritualized");
        ritualMessage.textContent = "PIERRE + VOIX + ÉTOILE — LE TEMPLE ENTRE EN TRANSE";
        announce("CÉRÉMONIE SYNCHRONISÉE");
      }
    });
  });

  const presenceSection = document.querySelector(".f03-presences");
  const presenceCounter = byId("f03PresenceCount");
  let counterPlayed = false;
  const animateCounter = () => {
    if (counterPlayed) return;
    counterPlayed = true;
    const target = 103;
    let current = 1;
    const update = () => {
      current += Math.max(1, Math.ceil((target - current) / 11));
      presenceCounter.textContent = String(Math.min(current, target)).padStart(3, "0");
      if (current < target) window.requestAnimationFrame(update);
    };
    update();
  };

  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) animateCounter();
  }, { threshold: .35 }).observe(presenceSection);

  const presenceField = byId("f03PresenceField");
  const spirits = [...presenceField.querySelectorAll(".f03-spirit")];
  const whisper = byId("f03Whisper");
  let lanternX = 50;
  let lanternY = 50;
  const foundSpirits = new Set();

  const moveLantern = (x, y) => {
    lanternX = Math.min(100, Math.max(0, x));
    lanternY = Math.min(100, Math.max(0, y));
    presenceField.style.setProperty("--lantern-x", `${lanternX}%`);
    presenceField.style.setProperty("--lantern-y", `${lanternY}%`);
    const fieldRect = presenceField.getBoundingClientRect();
    const lightX = fieldRect.left + fieldRect.width * lanternX / 100;
    const lightY = fieldRect.top + fieldRect.height * lanternY / 100;

    spirits.forEach((spirit, index) => {
      const rect = spirit.getBoundingClientRect();
      const distance = Math.hypot(lightX - (rect.left + rect.width / 2), lightY - (rect.top + rect.height / 2));
      if (distance < Math.max(100, rect.width * .85)) {
        spirit.classList.add("is-found");
        foundSpirits.add(index);
        whisper.textContent = spirit.dataset.whisper;
        if (foundSpirits.size === spirits.length) {
          whisper.textContent = "4 / 4 PRÉSENCES RECONNUES — CASSIOPÉE T'APPELLE";
          announce("PRÉSENCES RECONNUES");
        }
      }
    });
  };

  presenceField.addEventListener("pointermove", (event) => {
    const rect = presenceField.getBoundingClientRect();
    moveLantern((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
  });

  presenceField.addEventListener("pointerdown", (event) => {
    const rect = presenceField.getBoundingClientRect();
    moveLantern((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
  });

  presenceField.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") lanternX -= 7;
    if (event.key === "ArrowRight") lanternX += 7;
    if (event.key === "ArrowUp") lanternY -= 7;
    if (event.key === "ArrowDown") lanternY += 7;
    moveLantern(lanternX, lanternY);
  });

  const ascension = document.querySelector(".f03-ascension");
  const liftButton = byId("f03LiftButton");
  const liftCount = byId("f03LiftCount");
  const liftMessage = byId("f03LiftMessage");
  createHoldInteraction({
    button: liftButton,
    duration: 1650,
    resetOnRelease: false,
    onProgress: (value) => {
      liftButton.style.setProperty("--lift-progress", `${value}%`);
      liftCount.textContent = `${String(Math.round(value)).padStart(3, "0")}%`;
    },
    onComplete: () => {
      ascension.classList.add("is-lifted");
      liftButton.disabled = true;
      liftMessage.textContent = "GRAVITÉ INVERSÉE — CASSIOPÉE EST ALIGNÉE";
      liftButton.querySelector("span").textContent = "ASCENSION ACCOMPLIE";
      announce("LE FILS DE L'INVISIBLE ARRIVE");
      window.setTimeout(() => {
        byId("arrival").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }, reduced ? 0 : 850);
    }
  });

  const presave = byId("f03Presave");
  const presaveUrl = body.dataset.presaveUrl?.trim();
  if (presaveUrl) presave.href = presaveUrl;

  const canvas = byId("f03Field");
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let particles = [];

  const resizeCanvas = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = Array.from(
      { length: Math.min(76, Math.max(30, Math.floor(width / 24))) },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: .12 + Math.random() * .36,
        size: .4 + Math.random() * 1.3
      })
    );
  };

  const drawParticles = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(244,243,255,.56)";
    particles.forEach((particle) => {
      particle.y -= particle.speed;
      if (particle.y < -4) {
        particle.y = height + 4;
        particle.x = Math.random() * width;
      }
      context.globalAlpha = .22 + Math.sin(particle.y * .02) * .12;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
    if (!reduced) window.requestAnimationFrame(drawParticles);
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  if (!reduced) drawParticles();
})();
