// Smooth scroll for nav + footer links
const scrollLinks = document.querySelectorAll("[data-scroll]");

scrollLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const targetSelector = link.getAttribute("data-scroll");
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Update active nav link on scroll
const sections = ["#home", "#about", "#world", "#team", "#contact"].map(id =>
  document.querySelector(id)
);
const navLinks = document.querySelectorAll(".nav-link");

function updateActiveNav() {
  const scrollY = window.scrollY;
  let currentId = "#home";

  sections.forEach(section => {
    if (!section) return;
    const top = section.offsetTop - 120;
    if (scrollY >= top) {
      currentId = "#" + section.id;
    }
  });

  navLinks.forEach(link => {
    const target = link.getAttribute("data-scroll");
    link.classList.toggle("active", target === currentId);
  });
}

window.addEventListener("scroll", updateActiveNav);
updateActiveNav();

// Scroll reveal
const revealEls = document.querySelectorAll(".reveal-on-scroll");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealEls.forEach(el => observer.observe(el));
} else {
  // Fallback
  revealEls.forEach(el => el.classList.add("in-view"));
}

// HERO SLIDER
const heroSlides = document.querySelectorAll(".hero-slide");
const heroTitle = document.getElementById("heroTitle");
const heroText = document.getElementById("heroText");
const heroCounter = document.getElementById("heroCounter");
const heroDotsContainer = document.getElementById("heroDots");

const heroContent = [
  {
    title: "For The Minds of Tomorrow",
    text:
      "Empowering learners through immersive, AI-driven VR experiences designed to inspire curiosity, confidence, and growth."
  },
  {
    title: "Our Belief",
    text:
      "We believe everyone deserves to learn in the way that works best for them — personalized, engaging, and built around their unique strengths."
  },
  {
    title: "Our Vision",
    text:
      "To make advanced, accessible learning tools available in every home, school, and center, giving every learner equal opportunities to succeed."
  },
  {
    title: "Our Approach",
    text:
      "By combining virtual reality with intelligent guidance, we create interactive sessions that make learning immersive, enjoyable, and truly effective."
  }
];

let heroIndex = 0;
let heroTimer = null;

function renderHeroDots() {
  if (!heroDotsContainer) return;
  heroDotsContainer.innerHTML = "";
  heroSlides.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.className = "hero-dot" + (idx === heroIndex ? " active" : "");
    dot.setAttribute("aria-label", `Go to slide ${idx + 1}`);
    dot.addEventListener("click", () => goToHeroSlide(idx, true));
    heroDotsContainer.appendChild(dot);
  });
}

function goToHeroSlide(index, manual = false) {
  if (!heroSlides.length) return;

  heroIndex = (index + heroSlides.length) % heroSlides.length;

  heroSlides.forEach((slide, idx) => {
    slide.classList.toggle("active", idx === heroIndex);
  });

  // use the matching hero text
  const content = heroContent[heroIndex] || heroContent[0];
  if (heroTitle) heroTitle.textContent = content.title;
  if (heroText) heroText.textContent = content.text;
  if (heroCounter) heroCounter.textContent = `${heroIndex + 1} / ${heroSlides.length}`;

  renderHeroDots();

  if (manual) {
    restartHeroTimer();
  }
}

function startHeroTimer() {
  heroTimer = setInterval(() => {
    goToHeroSlide(heroIndex + 1);
  }, 6000);
}

function restartHeroTimer() {
  if (heroTimer) clearInterval(heroTimer);
  startHeroTimer();
}

if (heroSlides.length) {
  goToHeroSlide(0);
  startHeroTimer();
}


// WORLD CAROUSEL
const worldTrack = document.querySelector(".world-track");
const worldCards = worldTrack ? worldTrack.children : [];
const worldPrev = document.getElementById("worldPrev");
const worldNext = document.getElementById("worldNext");
const worldProgress = document.getElementById("worldProgress");
let worldIndex = 0;

function updateWorldCarousel() {
  if (!worldTrack || !worldCards.length) return;
  const offset = worldIndex * 100;
  worldTrack.style.transform = `translateX(-${offset}%)`;
  if (worldProgress) {
    worldProgress.textContent = `${worldIndex + 1} / ${worldCards.length}`;
  }
}

if (worldPrev && worldNext && worldCards.length) {
  worldPrev.addEventListener("click", () => {
    worldIndex = (worldIndex - 1 + worldCards.length) % worldCards.length;
    updateWorldCarousel();
  });

  worldNext.addEventListener("click", () => {
    worldIndex = (worldIndex + 1) % worldCards.length;
    updateWorldCarousel();
  });

  updateWorldCarousel();
}

// Scroll to top button
const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    const show = window.scrollY > 300;
    scrollTopBtn.style.opacity = show ? "1" : "0";
    scrollTopBtn.style.pointerEvents = show ? "auto" : "none";
  });
}

// THEME TOGGLE (DARK / LIGHT)
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "unitysphere-theme";

const prefersDark =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const savedTheme = localStorage.getItem(THEME_KEY);
let currentTheme = savedTheme || (prefersDark ? "dark" : "light");

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);

  if (themeToggle) {
    if (theme === "dark") {
      themeToggle.textContent = "☀ Light mode";
      themeToggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      themeToggle.textContent = "🌙 Dark mode";
      themeToggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  localStorage.setItem(THEME_KEY, theme);
}

// initial apply
applyTheme(currentTheme);

// toggle on click
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
  });
}
