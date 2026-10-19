/**
 * horizontal-nav.js
 * Fluid Inertia Scroll with Soft Auto-Centering (UX Vicio.com style):
 * - Effortless, silky-smooth horizontal scroll (never teleports, never stiff)
 * - Directionally-aware soft settling that glides gently to center the target section
 * - Clean URL routing: resets to '/' at Inicio, prevents anchor trapping on reload
 * - Minimalist progress bar + single Return to Home button
 */

// ── Shared State for Smooth Gliding ───────────────────────────
let container = null;
let targetX = 0;
let currentX = 0;
let isAnimating = false;
let isUserInteracting = false;
let settleTimer = null;
let lastScrollDirection = 1; // 1 = forward (right), -1 = backward (left)

function getSections() {
  return Array.from(document.querySelectorAll(".snap-section"));
}

function getMaxScroll() {
  if (!container) return 0;
  return container.scrollWidth - container.clientWidth;
}

// ── Soft Lerp Animation Loop ──────────────────────────────────
function animate() {
  if (!container) return;

  const diff = targetX - currentX;

  // 0.082 provides a soft, floating, luxurious deceleration curve
  currentX += diff * 0.082;
  container.scrollLeft = currentX;

  if (Math.abs(diff) > 0.5) {
    requestAnimationFrame(animate);
  } else {
    container.scrollLeft = targetX;
    currentX = targetX;
    isAnimating = false;
  }
}

function glideTo(newTarget) {
  if (!container) return;
  const maxScroll = getMaxScroll();
  targetX = Math.max(0, Math.min(maxScroll, newTarget));

  if (!isAnimating) {
    isAnimating = true;
    currentX = container.scrollLeft;
    requestAnimationFrame(animate);
  }
}

// ── Soft Settling to Target Section Center ────────────────────
function triggerSoftSettle() {
  if (isUserInteracting || !container) return;

  const sections = getSections();
  if (!sections.length) return;

  const scrollLeft = container.scrollLeft;
  const viewportWidth = container.clientWidth;

  // 1. If we are anywhere near the beginning, or moving left into section 0, ALWAYS go to Inicio (0)
  const sec1 = sections[1];
  const sec1Offset = sec1 ? sec1.offsetLeft : viewportWidth;
  if (scrollLeft <= viewportWidth * 0.4 || (lastScrollDirection < 0 && scrollLeft < sec1Offset * 0.85)) {
    glideTo(0);
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    return;
  }

  // 2. Find which section's center is closest to viewport center
  const centerPoint = scrollLeft + viewportWidth / 2;
  let closestIndex = 0;
  let minDist = Infinity;

  sections.forEach((sec, idx) => {
    const secCenter = sec.offsetLeft + sec.offsetWidth / 2;
    const dist = Math.abs(secCenter - centerPoint);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = idx;
    }
  });

  let targetIndex = closestIndex;

  // 3. Directional adjustment: if user was scrolling towards a neighbor, bias towards it
  if (lastScrollDirection < 0 && closestIndex > 0) {
    const currentSec = sections[closestIndex];
    if (currentSec && scrollLeft < currentSec.offsetLeft + 100) {
      targetIndex = closestIndex - 1;
    }
  } else if (lastScrollDirection > 0 && closestIndex < sections.length - 1) {
    const currentSec = sections[closestIndex];
    if (currentSec && scrollLeft > currentSec.offsetLeft - 100) {
      targetIndex = closestIndex + 1;
    }
  }

  const targetSec = sections[targetIndex] || sections[0];
  const targetCenter = targetIndex === 0
    ? 0
    : targetSec.offsetLeft - (container.clientWidth - targetSec.offsetWidth) / 2;

  glideTo(targetCenter);

  // Clean URL state
  if (targetIndex === 0) {
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  } else if (targetSec.id) {
    history.replaceState(null, "", `#${targetSec.id}`);
  }
}

// ── Global Helper Functions (Exposed to buttons & outside scripts) ──
window.scrollToHome = function () {
  if (!container) container = document.getElementById("main-horizontal-container");
  if (!container) return;
  lastScrollDirection = -1;
  glideTo(0);
  history.replaceState(null, "", window.location.pathname);
};

window.scrollNextHorizontal = function () {
  if (!container) container = document.getElementById("main-horizontal-container");
  if (!container) return;
  const sections = getSections();
  const currentCenter = container.scrollLeft + container.clientWidth / 2;

  const next = sections.find((sec) => (sec.offsetLeft + sec.offsetWidth / 2) > currentCenter + 40);
  if (next) {
    lastScrollDirection = 1;
    const targetLeft = next.offsetLeft - (container.clientWidth - next.offsetWidth) / 2;
    glideTo(targetLeft);
  } else {
    window.scrollToHome();
  }
};

window.scrollPrevHorizontal = function () {
  if (!container) container = document.getElementById("main-horizontal-container");
  if (!container) return;
  const sections = getSections();
  const currentCenter = container.scrollLeft + container.clientWidth / 2;

  const prev = [...sections].reverse().find((sec) => (sec.offsetLeft + sec.offsetWidth / 2) < currentCenter - 40);
  if (prev) {
    lastScrollDirection = -1;
    const targetLeft = prev.offsetLeft - (container.clientWidth - prev.offsetWidth) / 2;
    glideTo(targetLeft);
  }
};

export function initHorizontalNav() {
  container = document.getElementById("main-horizontal-container");
  if (!container) return;

  const navContainer = document.getElementById("nav-container");
  const navPills = document.querySelectorAll("a.nav-pill[href^='#']");
  const progressFill = document.getElementById("horizontal-progress-fill");
  const progressLabel = document.getElementById("progress-section-indicator");
  const sections = getSections();
  const totalSections = sections.length;

  // Initialize coordinates
  currentX = container.scrollLeft;
  targetX = container.scrollLeft;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // ── Clean hash on load: center target section then clean URL ──
  if (window.location.hash) {
    const hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      requestAnimationFrame(() => {
        const targetLeft = hashTarget.offsetLeft - (container.clientWidth - hashTarget.offsetWidth) / 2;
        container.scrollLeft = targetLeft;
        currentX = targetLeft;
        targetX = targetLeft;
      });
    }
    history.replaceState(null, "", window.location.pathname);
  }

  // ═══════════════════════════════════════════════════════════
  //  1. FLUID CONTINUOUS WHEEL SCROLL + SOFT AUTO-SETTLE
  //     (Effortless glide to the next/prev section, never stiff)
  // ═══════════════════════════════════════════════════════════
  window.addEventListener(
    "wheel",
    (e) => {
      // Don't hijack inside accessibility panel
      const a11yPanel = document.getElementById("a11y-advanced-panel");
      if (a11yPanel && !a11yPanel.hidden && a11yPanel.contains(e.target)) {
        return;
      }

      e.preventDefault();
      isUserInteracting = true;

      // Use dominant axis
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 2) return;

      lastScrollDirection = delta > 0 ? 1 : -1;

      // Multiplier of 2.5 provides an effortless, responsive glide without resistance
      const multiplier = 2.5;
      const maxScroll = getMaxScroll();
      targetX = Math.max(0, Math.min(maxScroll, targetX + delta * multiplier));

      if (!isAnimating) {
        isAnimating = true;
        currentX = container.scrollLeft;
        requestAnimationFrame(animate);
      }

      // Debounced soft settling when user stops scrolling
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        isUserInteracting = false;
        triggerSoftSettle();
      }, 240);
    },
    { passive: false }
  );

  // ═══════════════════════════════════════════════════════════
  //  2. PROGRESS BAR & ACTIVE SECTION SPY
  // ═══════════════════════════════════════════════════════════
  function updateProgress() {
    const scrollLeft = container.scrollLeft;
    const maxScroll = getMaxScroll();
    const percent = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;

    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }

    const centerPoint = scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDist = Infinity;
    sections.forEach((sec, idx) => {
      const secCenter = sec.offsetLeft + sec.offsetWidth / 2;
      const dist = Math.abs(secCenter - centerPoint);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = idx;
      }
    });

    const currentSec = sections[closestIndex];

    // Counter
    if (progressLabel) {
      const displayIndex = String(closestIndex + 1).padStart(2, "0");
      const displayTotal = String(totalSections).padStart(2, "0");
      progressLabel.textContent = `${displayIndex} / ${displayTotal}`;
    }

    // Single Back to Home button visibility (only visible past section 0)
    const homeBtn = document.getElementById("btn-back-to-home");
    if (homeBtn) {
      homeBtn.classList.toggle("visible", closestIndex > 0);
    }

    // Clean URL: reset to root '/' when back in the first section (Hero)
    if (closestIndex === 0) {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    }

    // Dynamic Contrast
    if (currentSec && navContainer) {
      const isDark = currentSec.getAttribute("data-contrast") === "dark";
      navContainer.classList.toggle("nav-contrast-dark", isDark);
    }

    // Active pill highlight
    if (currentSec && currentSec.id) {
      const currentId = currentSec.id;
      navPills.forEach((link) => {
        const href = link.getAttribute("href");
        const isActive =
          href === `#${currentId}` ||
          (currentId.startsWith("proyecto") && href && href.includes("proyect"));

        link.classList.toggle("scroll-active", isActive);
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }
  }

  // Monitor scroll for progress and native touch gestures
  container.addEventListener(
    "scroll",
    () => {
      updateProgress();

      // If user is doing native touch/trackpad drag, keep currentX synchronized
      if (!isAnimating) {
        currentX = container.scrollLeft;
        targetX = container.scrollLeft;

        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          isUserInteracting = false;
          triggerSoftSettle();
        }, 220);
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    currentX = container.scrollLeft;
    targetX = container.scrollLeft;
    updateProgress();
  });
  updateProgress();

  // ═══════════════════════════════════════════════════════════
  //  3. NAV PILL CLICKS → Soft Glide + Clean URL
  // ═══════════════════════════════════════════════════════════
  navPills.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const targetLeft = target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
          glideTo(targetLeft);

          if (href === "#inicio") {
            history.replaceState(null, "", window.location.pathname);
          } else {
            history.replaceState(null, "", href);
          }
        }
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  4. KEYBOARD NAVIGATION (Soft Glide)
  // ═══════════════════════════════════════════════════════════
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
      return;
    }
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
        e.preventDefault();
        window.scrollNextHorizontal();
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        window.scrollPrevHorizontal();
        break;
      case "Home":
        e.preventDefault();
        window.scrollToHome();
        break;
      case "End":
        e.preventDefault();
        glideTo(getMaxScroll());
        break;
    }
  });
}
