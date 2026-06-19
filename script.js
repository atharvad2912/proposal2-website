"use strict";

// ------------------------------------------------------------
// Screen navigation
// ------------------------------------------------------------
const pages = [...document.querySelectorAll(".page")];
let activePage = document.querySelector(".page.active");

function showPage(id) {
  const nextPage = document.getElementById(id);
  if (!nextPage || nextPage === activePage) return;

  activePage.classList.add("leaving");
  activePage.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    activePage.classList.remove("active", "leaving");
    nextPage.classList.add("active");
    nextPage.removeAttribute("aria-hidden");
    nextPage.scrollTop = 0;
    activePage = nextPage;
  }, 420);
}

pages.forEach((page) => {
  if (!page.classList.contains("active")) page.setAttribute("aria-hidden", "true");
});

// ------------------------------------------------------------
// Ambient sparkles and floating hearts
// ------------------------------------------------------------
const particles = document.getElementById("particles");
const heartsLayer = document.getElementById("floating-hearts");

for (let i = 0; i < 28; i += 1) {
  const particle = document.createElement("i");
  particle.className = "particle";
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.setProperty("--d", `${2.5 + Math.random() * 4}s`);
  particle.style.setProperty("--delay", `${Math.random() * 5}s`);
  particles.appendChild(particle);
}

for (let i = 0; i < 12; i += 1) {
  const heart = document.createElement("i");
  heart.className = "float-heart";
  heart.textContent = "♥";
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${12 + Math.random() * 18}px`;
  heart.style.setProperty("--duration", `${10 + Math.random() * 11}s`);
  heart.style.setProperty("--delay", `${-Math.random() * 15}s`);
  heart.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
  heartsLayer.appendChild(heart);
}

// ------------------------------------------------------------
// Welcome and slideshow
// ------------------------------------------------------------
const slides = [...document.querySelectorAll(".slide")];
const dotsWrap = document.getElementById("slide-dots");
const slideshowContinue = document.getElementById("slideshow-continue");
let slideIndex = 0;
let slideshowTimer = null;

slides.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.className = `slide-dot${index === 0 ? " active" : ""}`;
  dotsWrap.appendChild(dot);
});

const dots = [...dotsWrap.children];

function showSlide(index) {
  slides[slideIndex].classList.remove("active");
  dots[slideIndex].classList.remove("active");
  slideIndex = index;
  slides[slideIndex].classList.add("active");
  dots[slideIndex].classList.add("active");
}

function startSlideshow() {
  window.clearInterval(slideshowTimer);
  showSlide(0);
  dotsWrap.style.opacity = "1";
  slideshowContinue.classList.add("is-hidden");

  slideshowTimer = window.setInterval(() => {
    if (slideIndex < slides.length - 1) {
      showSlide(slideIndex + 1);
    } else {
      window.clearInterval(slideshowTimer);
      dotsWrap.style.opacity = "0";
      window.setTimeout(() => slideshowContinue.classList.remove("is-hidden"), 350);
    }
  }, 2400);
}

document.getElementById("open-button").addEventListener("click", () => {
  startMusic();
  showPage("slideshow");
  window.setTimeout(startSlideshow, 700);
});

slideshowContinue.addEventListener("click", () => showPage("proposal"));

// ------------------------------------------------------------
// The intentionally impossible "No" button
// ------------------------------------------------------------
const noButton = document.getElementById("no-button");
const SAFE_GAP = 14;
const TRIGGER_DISTANCE = 105;
let lastEscapeAt = 0;

function escapeNoButton() {
  if (!document.getElementById("proposal").classList.contains("active")) return;

  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const maxX = Math.max(SAFE_GAP, window.innerWidth - width - SAFE_GAP);
  const maxY = Math.max(SAFE_GAP, window.innerHeight - height - SAFE_GAP);
  const proposalCard = document.querySelector(".proposal-card").getBoundingClientRect();
  let x;
  let y;
  let attempts = 0;

  // Prefer a point away from the center card, but always stay on-screen.
  do {
    x = SAFE_GAP + Math.random() * (maxX - SAFE_GAP);
    y = SAFE_GAP + Math.random() * (maxY - SAFE_GAP);
    attempts += 1;
  } while (
    attempts < 18 &&
    x + width > proposalCard.left - 20 && x < proposalCard.right + 20 &&
    y + height > proposalCard.top - 20 && y < proposalCard.bottom + 20
  );

  noButton.classList.add("evading");
  noButton.style.left = `${Math.min(Math.max(x, SAFE_GAP), maxX)}px`;
  noButton.style.top = `${Math.min(Math.max(y, SAFE_GAP), maxY)}px`;
  lastEscapeAt = performance.now();
}

function avoidPointer(clientX, clientY) {
  const rect = noButton.getBoundingClientRect();
  const closestX = Math.max(rect.left, Math.min(clientX, rect.right));
  const closestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
  const distance = Math.hypot(clientX - closestX, clientY - closestY);

  if (distance < TRIGGER_DISTANCE && performance.now() - lastEscapeAt > 80) {
    escapeNoButton();
  }
}

document.addEventListener("mousemove", (event) => avoidPointer(event.clientX, event.clientY), { passive: true });
noButton.addEventListener("mouseenter", escapeNoButton);
noButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  escapeNoButton();
});

["touchstart", "touchmove"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    const touch = event.touches[0];
    if (touch) avoidPointer(touch.clientX, touch.clientY);
  }, { passive: true });
  noButton.addEventListener(eventName, escapeNoButton, { passive: false });
});

window.addEventListener("resize", () => {
  if (noButton.classList.contains("evading")) escapeNoButton();
});

// ------------------------------------------------------------
// Celebration: confetti, heart burst, and gentle synthesized music
// ------------------------------------------------------------
const canvas = document.getElementById("confetti-canvas");
const context = canvas.getContext("2d");
let confetti = [];
let confettiFrame = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchConfetti() {
  resizeCanvas();
  const colors = ["#e85278", "#f7a6ba", "#c99b52", "#ffe4ad", "#ffffff"];
  confetti = Array.from({ length: 190 }, () => ({
    x: window.innerWidth * (.2 + Math.random() * .6),
    y: window.innerHeight * .45,
    vx: (Math.random() - .5) * 15,
    vy: -5 - Math.random() * 12,
    gravity: .14 + Math.random() * .08,
    drag: .987,
    size: 5 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - .5) * .25,
    life: 180 + Math.random() * 80
  }));
  animateConfetti();
}

function animateConfetti() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confetti = confetti.filter((piece) => piece.life > 0 && piece.y < window.innerHeight + 30);

  confetti.forEach((piece) => {
    piece.vx *= piece.drag;
    piece.vy += piece.gravity;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.spin;
    piece.life -= 1;
    context.save();
    context.translate(piece.x, piece.y);
    context.rotate(piece.rotation);
    context.fillStyle = piece.color;
    context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .66);
    context.restore();
  });

  if (confetti.length) confettiFrame = requestAnimationFrame(animateConfetti);
  else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function launchHeartBurst() {
  const burst = document.getElementById("heart-burst");
  burst.replaceChildren();
  for (let i = 0; i < 22; i += 1) {
    const heart = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 22;
    const distance = 110 + Math.random() * Math.min(window.innerWidth * .34, 280);
    heart.className = "burst-heart";
    heart.textContent = i % 4 === 0 ? "✦" : "❤";
    heart.style.color = i % 4 === 0 ? "#c99b52" : "#e85278";
    heart.style.fontSize = `${14 + Math.random() * 20}px`;
    heart.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    heart.style.setProperty("--r", `${Math.random() * 160 - 80}deg`);
    burst.appendChild(heart);
  }
}

let musicPlaying = false;
let volumeFadeTimer = null;
const musicToggle = document.getElementById("music-toggle");
const backgroundMusic = document.getElementById("background-music");
backgroundMusic.volume = 0;

function startMusic() {
  if (musicPlaying) return;
  backgroundMusic.currentTime = 0;
  backgroundMusic.volume = 0;
  backgroundMusic.play().then(() => {
    musicPlaying = true;
    window.clearInterval(volumeFadeTimer);
    volumeFadeTimer = window.setInterval(() => {
      backgroundMusic.volume = Math.min(0.55, backgroundMusic.volume + 0.025);
      if (backgroundMusic.volume >= 0.55) window.clearInterval(volumeFadeTimer);
    }, 80);
    musicToggle.classList.add("playing");
    musicToggle.textContent = "♫";
    musicToggle.setAttribute("aria-label", "Pause music");
  }).catch(() => {
    musicPlaying = false;
  });
}

function stopMusic() {
  window.clearInterval(volumeFadeTimer);
  backgroundMusic.pause();
  musicPlaying = false;
  musicToggle.classList.remove("playing");
  musicToggle.textContent = "♪";
  musicToggle.setAttribute("aria-label", "Play music");
}

musicToggle.addEventListener("click", () => musicPlaying ? stopMusic() : startMusic());

document.getElementById("yes-button").addEventListener("click", () => {
  startMusic();
  showPage("celebration");
  window.setTimeout(() => {
    launchConfetti();
    launchHeartBurst();
  }, 480);
});

document.getElementById("celebration-continue").addEventListener("click", () => showPage("gallery"));
window.addEventListener("resize", resizeCanvas);
