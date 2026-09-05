/* ═══════════════════════════════════════════════════════════════
   Sistema de Visitas do Gustavo — script.js
   Lógica de estados · animações · easter eggs
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Constantes ────────────────────────────────────────────────── */

const LOADING_MESSAGES = [
  'Identificando visitante... 👀',
  'Analisando dados...',
  'Verificando nível de perigo...',
  'Visitante identificado.',
];

const SECTION_IDS = [
  'section-hero',
  'section-verification',
  'section-loading',
  'section-result-special',
  'section-result-bad',
  'section-result-unknown',
];

/* ─── Referências do DOM ─────────────────────────────────────────── */

const sections        = Object.fromEntries(SECTION_IDS.map(id => [id, document.getElementById(id)]));
const btnDiscover     = document.getElementById('btn-discover');
const btnDoor         = document.getElementById('btn-door');
const btnVerify       = document.getElementById('btn-verify');
const inputName       = document.getElementById('input-name');
const loadingMsg      = document.getElementById('loading-msg');
const loadingBarFill  = document.getElementById('loading-bar-fill');
const toast           = document.getElementById('toast');
const tooltipHint     = document.getElementById('tooltip-hint');
const haloSpecial     = document.getElementById('halo-special');
const heartsLayer     = document.getElementById('hearts-layer');
const particlesLayer  = document.getElementById('particles-layer');
const cardBad         = document.getElementById('card-bad');
const btnResets       = document.querySelectorAll('.btn-reset');

/* ─── Estado da máquina ──────────────────────────────────────────── */

let currentSection = 'section-hero';

/* ─── Utilitários ────────────────────────────────────────────────── */

/**
 * Pseudo-aleatório estável baseado em seed — evita reflash no re-render.
 */
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Mostra uma seção, esconde todas as outras.
 * @param {string} id - ID da seção a exibir
 */
function showSection(id) {
  SECTION_IDS.forEach(sectionId => {
    const el = sections[sectionId];
    if (sectionId === id) {
      el.hidden = false;
      // Força reflow antes de adicionar classe de animação
      void el.offsetWidth;
      el.classList.add('entering');
      el.addEventListener('animationend', () => el.classList.remove('entering'), { once: true });
    } else {
      el.hidden = true;
    }
  });
  currentSection = id;
}

/**
 * Classifica o input do usuário em um dos três resultados.
 * @param {string} raw - Texto bruto do input
 * @returns {'special'|'bad'|'unknown'}
 */
function classify(raw) {
  const normalized = raw.toLowerCase().trim().replace(/\s+/g, ' ');
  if (/lala\s+linda/.test(normalized)) return 'special';
  if (normalized.includes('ruim'))     return 'bad';
  return 'unknown';
}

/* ─── Background ─────────────────────────────────────────────────── */

/**
 * Alterna a classe de fundo no body.
 * @param {'default'|'special'|'bad'} state
 */
function setBackground(state) {
  document.body.classList.remove('bg-special', 'bg-bad');
  if (state === 'special') document.body.classList.add('bg-special');
  if (state === 'bad')     document.body.classList.add('bg-bad');
}

/* ─── Partículas ─────────────────────────────────────────────────── */

(function spawnParticles() {
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  const count = isMobile ? 12 : 22;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left             = `${seededRand(i * 3) * 100}%`;
    p.style.top              = `${seededRand(i * 3 + 1) * 100}%`;
    p.style.width            = `${2 + seededRand(i * 11) * 3}px`;
    p.style.height           = p.style.width;
    p.style.animationDelay   = `${seededRand(i * 3 + 2) * 5}s`;
    p.style.animationDuration= `${3 + seededRand(i * 7) * 4}s`;
    particlesLayer.appendChild(p);
  }
})();

/* ─── Corações flutuantes ────────────────────────────────────────── */

function spawnFloatingHearts() {
  heartsLayer.innerHTML = '';
  const count = 20;

  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'floating-heart';
    h.textContent = '❤️';
    h.setAttribute('aria-hidden', 'true');
    h.style.left             = `${seededRand(i * 5 + 50) * 100}%`;
    h.style.fontSize         = `${14 + seededRand(i * 5 + 53) * 22}px`;
    h.style.opacity          = `${0.35 + seededRand(i * 5 + 54) * 0.65}`;
    h.style.animationDelay   = `${seededRand(i * 5 + 51) * 4.5}s`;
    h.style.animationDuration= `${4 + seededRand(i * 5 + 52) * 3.5}s`;
    heartsLayer.appendChild(h);
  }

  heartsLayer.classList.add('active');
  haloSpecial.classList.add('active');
}

function clearFloatingHearts() {
  heartsLayer.classList.remove('active');
  haloSpecial.classList.remove('active');
  heartsLayer.innerHTML = '';
}

/* ─── Toast ──────────────────────────────────────────────────────── */

let toastTimer = null;

/**
 * Exibe o toast temporariamente.
 * @param {string} [message] - Texto opcional (usa o HTML atual se omitido)
 * @param {number} [duration=3500] - Duração em ms
 */
function showToast(message, duration = 3500) {
  if (message) toast.textContent = message;
  toast.classList.add('visible');
  toast.removeAttribute('aria-hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    toast.setAttribute('aria-hidden', 'true');
  }, duration);
}

/* ─── Tooltip ────────────────────────────────────────────────────── */

function showTooltip() {
  tooltipHint.classList.add('visible');
  tooltipHint.removeAttribute('aria-hidden');
  setTimeout(() => {
    tooltipHint.classList.remove('visible');
    tooltipHint.setAttribute('aria-hidden', 'true');
  }, 3500);
}

/* ─── Sequência de Loading ───────────────────────────────────────── */

let loadingTimers = [];

function startLoading(inputValue) {
  // Cancela timers anteriores (segurança)
  loadingTimers.forEach(clearTimeout);
  loadingTimers = [];

  showSection('section-loading');

  // Mensagem inicial
  loadingMsg.textContent = LOADING_MESSAGES[0];
  loadingBarFill.style.width = '25%';

  // Cicla as mensagens restantes
  LOADING_MESSAGES.forEach((msg, i) => {
    if (i === 0) return;
    loadingTimers.push(
      setTimeout(() => {
        loadingMsg.textContent = msg;
        loadingBarFill.style.width = `${((i + 1) / LOADING_MESSAGES.length) * 100}%`;
      }, i * 900)
    );
  });

  // Mostra resultado ao final
  loadingTimers.push(
    setTimeout(() => {
      const result = classify(inputValue);
      showResult(result);
    }, LOADING_MESSAGES.length * 900 + 350)
  );
}

/* ─── Mostrar resultado ──────────────────────────────────────────── */

function showResult(result) {
  switch (result) {
    case 'special':
      setBackground('special');
      spawnFloatingHearts();
      showSection('section-result-special');
      break;

    case 'bad':
      setBackground('bad');
      clearFloatingHearts();
      showSection('section-result-bad');
      // Re-aplica shake (o card pode ter sido exibido antes)
      if (cardBad) {
        cardBad.classList.remove('shake');
        void cardBad.offsetWidth; // reflow
        cardBad.classList.add('shake');
      }
      break;

    default:
      setBackground('default');
      clearFloatingHearts();
      showSection('section-result-unknown');
  }
}

/* ─── Reset ──────────────────────────────────────────────────────── */

function resetToVerify() {
  setBackground('default');
  clearFloatingHearts();
  inputName.value = '';
  btnVerify.disabled = true;
  btnVerify.setAttribute('aria-disabled', 'true');
  showSection('section-verification');
  // Foco no input para UX
  setTimeout(() => inputName.focus(), 100);
}

/* ─── Easter Egg #1 — Clicar na 🚪 várias vezes ─────────────────── */

let doorClickCount = 0;
let doorClickResetTimer = null;

btnDoor.addEventListener('click', () => {
  doorClickCount++;

  if (doorClickResetTimer) clearTimeout(doorClickResetTimer);
  doorClickResetTimer = setTimeout(() => { doorClickCount = 0; }, 1800);

  if (doorClickCount >= 5) {
    doorClickCount = 0;
    showToast('Você encontrou um segredo. 👀❤️');
  }
});

/* ─── Easter Egg #2 — Segurar o botão Verificar ─────────────────── */

let holdTimer = null;

function onBtnDown() {
  holdTimer = setTimeout(showTooltip, 2600);
}
function onBtnUp() {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
}

btnVerify.addEventListener('mousedown',  onBtnDown);
btnVerify.addEventListener('mouseup',    onBtnUp);
btnVerify.addEventListener('mouseleave', onBtnUp);
btnVerify.addEventListener('touchstart', onBtnDown, { passive: true });
btnVerify.addEventListener('touchend',   onBtnUp);
btnVerify.addEventListener('touchcancel',onBtnUp);

/* ─── Interações da seção Hero ───────────────────────────────────── */

btnDiscover.addEventListener('click', () => {
  showSection('section-verification');
  setTimeout(() => inputName.focus(), 150);
});

/* ─── Input — habilitar/desabilitar botão ────────────────────────── */

inputName.addEventListener('input', () => {
  const hasValue = inputName.value.trim().length > 0;
  btnVerify.disabled = !hasValue;
  btnVerify.setAttribute('aria-disabled', String(!hasValue));
});

inputName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnVerify.disabled) {
    startLoading(inputName.value);
  }
});

/* ─── Botão Verificar ────────────────────────────────────────────── */

btnVerify.addEventListener('click', () => {
  if (!btnVerify.disabled) {
    startLoading(inputName.value);
  }
});

/* ─── Botões de reset (todos os ".btn-reset") ────────────────────── */

btnResets.forEach(btn => btn.addEventListener('click', resetToVerify));

/* ─── Init ───────────────────────────────────────────────────────── */

// Garante estado inicial limpo
showSection('section-hero');
setBackground('default');
