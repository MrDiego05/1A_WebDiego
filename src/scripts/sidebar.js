/**
 * sidebar.js / a11y.js
 * Controls for Accessibility, Speech Synthesis and Focus Mode
 */

let a11yPanelOpen = false;
let isSpeaking = false;
let currentUtterance = null;
let fontScale = 100; // in %

// ── Immediate global definitions ─────────────────────────
window.toggleDark = function () {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
};

window.toggleA11yPanel = function () {
  const panel = document.getElementById("a11y-advanced-panel");
  const topBtn = document.getElementById("sidebar-a11y-toggle");
  const bottomBtn = document.getElementById("bottom-a11y-toggle");
  if (!panel) return;

  a11yPanelOpen = !a11yPanelOpen;
  panel.hidden = !a11yPanelOpen;

  topBtn?.setAttribute("aria-expanded", String(a11yPanelOpen));
  bottomBtn?.setAttribute("aria-expanded", String(a11yPanelOpen));

  if (a11yPanelOpen) {
    panel.querySelector(".a11y-panel-close")?.focus();
  }
};

export function initSidebar() {
  // ── Dark Mode Initialisation ───────────────────────────
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  // Bind controls from JavaScript instead of relying on inline handlers. This
  // is reliable for Astro's module scripts and avoids a missing global handler
  // disabling the navigation controls.
  document.getElementById("sidebar-dark-toggle")?.addEventListener("click", window.toggleDark);
  document.getElementById("sidebar-a11y-toggle")?.addEventListener("click", window.toggleA11yPanel);

  // ── Close A11y Panel on Escape ─────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && a11yPanelOpen) {
      window.toggleA11yPanel();
    }
  });

  // ── Speech Synthesis (Control 1) ───────────────────────
  window.toggleSpeech = function () {
    if (!("speechSynthesis" in window)) {
      alert("Tu navegador no soporta el sintetizador de voz (Speech Synthesis).");
      return;
    }

    const btn = document.getElementById("btn-toggle-speech");
    const icon = document.getElementById("speech-btn-icon");
    const text = document.getElementById("speech-btn-text");

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      if (btn) btn.classList.remove("speaking");
      if (icon) icon.textContent = "▶";
      if (text) text.textContent = "Escuchar página";
      return;
    }

    const container = document.getElementById("main-horizontal-container");
    if (!container) return;

    const readableText = container.innerText || container.textContent;
    currentUtterance = new SpeechSynthesisUtterance(readableText);
    currentUtterance.lang = "es-ES";

    const speedSelect = document.getElementById("a11y-speech-speed");
    const pitchSelect = document.getElementById("a11y-speech-pitch");

    if (speedSelect) currentUtterance.rate = parseFloat(speedSelect.value) || 1.0;
    if (pitchSelect) currentUtterance.pitch = parseFloat(pitchSelect.value) || 1.0;

    currentUtterance.onend = () => {
      isSpeaking = false;
      if (btn) btn.classList.remove("speaking");
      if (icon) icon.textContent = "▶";
      if (text) text.textContent = "Escuchar página";
    };

    currentUtterance.onerror = () => {
      isSpeaking = false;
      if (btn) btn.classList.remove("speaking");
      if (icon) icon.textContent = "▶";
      if (text) text.textContent = "Escuchar página";
    };

    window.speechSynthesis.speak(currentUtterance);
    isSpeaking = true;
    if (btn) btn.classList.add("speaking");
    if (icon) icon.textContent = "⏹";
    if (text) text.textContent = "Detener lectura";
  };

  window.updateSpeechSettings = function () {
    if (isSpeaking && currentUtterance) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      window.toggleSpeech();
    }
  };

  // ── Focus Mode (Control 2) ─────────────────────────────
  window.toggleFocusMode = function () {
    const isActive = document.body.classList.toggle("focus-mode-active");
    const btn = document.getElementById("btn-focus-mode");
    const label = document.getElementById("focus-mode-label");
    if (btn) btn.classList.toggle("active", isActive);
    if (label) label.textContent = isActive ? "Modo Enfoque Activado" : "Activar Modo Enfoque";
  };

  // ── High Contrast (Control 3) ──────────────────────────
  window.toggleHighContrast = function () {
    const isActive = document.documentElement.classList.toggle("a11y-high-contrast");
    const btn = document.getElementById("btn-high-contrast");
    const label = document.getElementById("contrast-label");
    if (btn) btn.classList.toggle("active", isActive);
    if (label) label.textContent = isActive ? "Alto Contraste Activado" : "Activar Alto Contraste";
  };

  // ── Font Size Adjustment (Control 4) ───────────────────
  window.adjustFontSize = function (dir) {
    fontScale = Math.max(85, Math.min(145, fontScale + dir * 10));
    document.documentElement.style.fontSize = `${(14 * fontScale) / 100}px`;
    const display = document.getElementById("font-size-display");
    if (display) display.textContent = `${fontScale}%`;
  };

  // ── Dyslexia Friendly Font (Control 5) ─────────────────
  window.toggleDyslexiaFont = function () {
    const isActive = document.documentElement.classList.toggle("a11y-dyslexia");
    const btn = document.getElementById("btn-dyslexia-font");
    const label = document.getElementById("dyslexia-label");
    if (btn) btn.classList.toggle("active", isActive);
    if (label) label.textContent = isActive ? "Fuente Dislexia Activada" : "Activar Fuente Dislexia";
  };
}
