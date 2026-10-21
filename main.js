/**
 * TAIWO AJALA & CO. - 360° CINEMATIC SCROLL ANIMATION ENGINE
 * High-performance full-bleed canvas sequence rendering with interpolation,
 * mobile responsive handling, and scrollytelling.
 */

// Total frame count in the sequence
const TOTAL_FRAMES = 30;
const frames = [];
let loadedCount = 0;
let isLoaded = false;

// Animation & Lerp State
let targetProgress = 0;
let currentProgress = 0;
const LERP_FACTOR = 0.12; // Smooth silky interpolation

// DOM Elements
const canvas = document.getElementById('scaleCanvas');
const ctx = canvas.getContext('2d');
const scrollSection = document.getElementById('hero');
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const frameCounterText = document.getElementById('frameCounterText');
const scrollPinProgress = document.getElementById('scrollPinProgress');
const scrollPercent = document.getElementById('scrollPercent');

// Story Chapters
const storyCards = document.querySelectorAll('.story-card');

// Navigation & Navbar
const navbar = document.getElementById('navbar');
const backToTopBtn = document.getElementById('backToTopBtn');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileNavDrawer = document.getElementById('mobileNavDrawer');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

// Consultation Form
const consultationForm = document.getElementById('consultationForm');
const formSuccessMessage = document.getElementById('formSuccessMessage');

/**
 * 1. PRELOAD FRAMES
 * Caches all 30 frames into memory
 */
function preloadFrames() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const pad = String(i).padStart(3, '0');
    // Files are served from /frames/ in public folder
    img.src = `/frames/ezgif-frame-${pad}.jpg`;

    img.onload = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.textContent = `${pct}%`;
      if (frameCounterText) frameCounterText.textContent = `Caching frames ${loadedCount} / ${TOTAL_FRAMES}`;

      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    img.onerror = () => {
      console.warn(`Could not load frame ${i}, trying relative path`);
      // Fallback relative path
      img.src = `./frames/ezgif-frame-${pad}.jpg`;
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    frames.push(img);
  }
}

/**
 * Once all frames are loaded in memory
 */
function onAllFramesLoaded() {
  isLoaded = true;
  setTimeout(() => {
    if (preloader) preloader.classList.add('fade-out');
    resizeCanvas();
    renderFrame(0);
    updateScrollProgress();
  }, 350);
}

/**
 * 2. CANVAS RESIZE & HI-DPI SETUP (MOBILE-OPTIMIZED)
 * Caps devicePixelRatio to max 2 to ensure 60-120fps performance on high-density mobile screens
 */
function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  renderFrame(Math.min(TOTAL_FRAMES - 1, Math.floor(currentProgress * TOTAL_FRAMES)));
  updateScrollProgress();
}, { passive: true });

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    resizeCanvas();
    renderFrame(Math.min(TOTAL_FRAMES - 1, Math.floor(currentProgress * TOTAL_FRAMES)));
    updateScrollProgress();
  }, 200);
});

/**
 * 3. RENDER FRAME ON CANVAS (Centered, Aspect Ratio Cover)
 * Renders cleanly across the entire hero viewport without any overlays
 */
function renderFrame(frameIndex) {
  if (!isLoaded || frames.length === 0) return;
  
  const img = frames[Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex))];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // Aspect-ratio cover calculations
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let renderW, renderH, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    // Canvas is wider than image: match width, center vertically
    renderW = w;
    renderH = w / imgRatio;
    offsetX = 0;
    offsetY = (h - renderH) / 2;
  } else {
    // Canvas is taller than image: match height, center horizontally
    renderH = h;
    renderW = h * imgRatio;
    offsetX = (w - renderW) / 2;
    offsetY = 0;
  }

  // Draw the image filling the entire hero canvas crisply
  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

/**
 * 4. SCROLL LISTENER & PROGRESS TRACKING
 * Robust height calculation respecting dynamic mobile viewport bars
 */
function updateScrollProgress() {
  if (!scrollSection) return;

  const rect = scrollSection.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const totalHeight = rect.height - vh;

  if (totalHeight <= 0) return;

  // Calculate normalized progress between 0 and 1
  const rawProgress = -rect.top / totalHeight;
  const clamped = Math.max(0, Math.min(1, rawProgress));

  targetProgress = clamped;

  // Update vertical / mobile horizontal scroll thumb indicator
  const pctString = Math.round(clamped * 100) + '%';
  if (scrollPinProgress) {
    scrollPinProgress.style.height = pctString;
    scrollPinProgress.style.width = pctString;
  }
  if (scrollPercent) scrollPercent.textContent = pctString;

  // Update Scrollytelling Chapters
  updateStoryChapters(clamped);
}

window.addEventListener('scroll', () => {
  updateScrollProgress();

  // Sticky Navbar background blur trigger
  if (navbar) {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
}, { passive: true });

/**
 * 5. SCROLLYTELLING CHAPTER REVEAL
 */
function updateStoryChapters(progress) {
  storyCards.forEach((card) => {
    const rangeAttr = card.getAttribute('data-range');
    if (!rangeAttr) return;
    const [min, max] = rangeAttr.split(',').map(Number);

    if (progress >= min && progress <= max) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

/**
 * 6. REQUEST ANIMATION FRAME LOOP (Lerping for silky smoothness)
 */
function animationLoop() {
  if (isLoaded) {
    // Lerp current progress towards target
    currentProgress += (targetProgress - currentProgress) * LERP_FACTOR;

    // Calculate frame index
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(currentProgress * TOTAL_FRAMES));
    renderFrame(frameIndex);
  }

  requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);

/**
 * 7. MOBILE NAVIGATION DRAWER TOGGLE
 */
if (mobileMenuToggle && mobileNavDrawer) {
  mobileMenuToggle.addEventListener('click', () => {
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    mobileMenuToggle.setAttribute('aria-expanded', String(nextState));
    mobileMenuToggle.classList.toggle('active', nextState);
    mobileNavDrawer.classList.toggle('active', nextState);
    mobileNavDrawer.setAttribute('aria-hidden', String(!nextState));
    document.body.classList.toggle('mobile-menu-open', nextState);
  });

  // Close drawer and navigate when any link is clicked
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      mobileMenuToggle.classList.remove('active');
      mobileNavDrawer.classList.remove('active');
      mobileNavDrawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mobile-menu-open');
    });
  });
}

/**
 * 8. BACK TO TOP
 */
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * 9. CONSULTATION FORM SUBMISSION
 */
if (consultationForm) {
  consultationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = consultationForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Transmitting Brief...</span>';

    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      consultationForm.reset();
      if (formSuccessMessage) formSuccessMessage.classList.remove('hidden');
      
      setTimeout(() => {
        if (formSuccessMessage) formSuccessMessage.classList.add('hidden');
      }, 7000);
    }, 1200);
  });
}

// Start loading the frames immediately
preloadFrames();
