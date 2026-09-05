/* ═══════════════════════════════════════════════════════════════
   Sistema de Visitas — script.js
  Lógica de estados · animações · segredos
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
  'section-result-almost',
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
const btnSurprise     = document.getElementById('btn-surprise');
const surpriseModal   = document.getElementById('surprise-modal');
const btnCloseSurprise = document.getElementById('btn-close-surprise');

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
      // Força o recálculo do layout antes de adicionar a classe de animação
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
 * Classifica o campo de texto do usuário em um dos quatro resultados.
 * @param {string} raw - Texto bruto do campo de texto
 * @returns {'special'|'almost'|'bad'|'unknown'}
 */
function classify(raw) {
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (/lala\s+linda/.test(normalized)) return 'special';
  if (/^(lala|lavinia)$/.test(normalized)) return 'almost';
  if (/\bvisita\s+chata\b/.test(normalized)) return 'bad';
  return 'unknown';
}

/* ─── Fundo ──────────────────────────────────────────────────────── */

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

/* ─── Notificação ────────────────────────────────────────────────── */

let toastTimer = null;

/**
 * Exibe a notificação temporariamente.
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

/* ─── Dica ───────────────────────────────────────────────────────── */

function showTooltip() {
  tooltipHint.classList.add('visible');
  tooltipHint.removeAttribute('aria-hidden');
  setTimeout(() => {
    tooltipHint.classList.remove('visible');
    tooltipHint.setAttribute('aria-hidden', 'true');
  }, 3500);
}

/* ─── Sequência de carregamento ──────────────────────────────────── */

let loadingTimers = [];
let isLoading = false;

function startLoading(inputValue) {
  if (isLoading) return;
  isLoading = true;

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
  isLoading = false;

  switch (result) {
    case 'special':
      setBackground('special');
      spawnFloatingHearts();
      showSection('section-result-special');
      break;

    case 'almost':
      setBackground('default');
      clearFloatingHearts();
      showSection('section-result-almost');
      break;

    case 'bad':
      setBackground('bad');
      clearFloatingHearts();
      showSection('section-result-bad');
      // Reaplica o tremor (o cartão pode ter sido exibido antes)
      if (cardBad) {
        cardBad.classList.remove('shake');
        void cardBad.offsetWidth; // força o recálculo do layout
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
  isLoading = false;
  closeSurprise();
  setBackground('default');
  clearFloatingHearts();
  inputName.value = '';
  btnVerify.disabled = true;
  btnVerify.setAttribute('aria-disabled', 'true');
  showSection('section-verification');
  // Foco no campo de texto para melhorar a experiência
  setTimeout(() => inputName.focus(), 100);
}

function openSurprise() {
  surpriseModal.hidden = false;
  document.body.classList.add('modal-open');
  btnCloseSurprise.focus();
}

function closeSurprise() {
  surpriseModal.hidden = true;
  document.body.classList.remove('modal-open');
}

/* ─── Segredo #1 — Clicar na 🚪 várias vezes ────────────────────── */

let doorClickCount = 0;
let doorClickResetTimer = null;

btnDoor.addEventListener('click', () => {
  doorClickCount++;

  if (doorClickResetTimer) clearTimeout(doorClickResetTimer);
  doorClickResetTimer = setTimeout(() => { doorClickCount = 0; }, 2500);

  if (doorClickCount >= 3) {
    doorClickCount = 0;
    showToast('Tente segurar o botão de verificar amor👀');
    showToast('Tente segurar o botão de verificar amor👀');
  }
});

/* ─── Segredo #2 — Segurar o botão Verificar ────────────────────── */

let holdTimer = null;
let holdTriggered = false;

function onBtnDown() {
  holdTriggered = false;
  if (holdTimer) clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    holdTriggered = true;
    showTooltip();
  }, 1200);
}
function onBtnUp() {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
}

btnVerify.addEventListener('pointerdown', onBtnDown);
btnVerify.addEventListener('pointerup', onBtnUp);
btnVerify.addEventListener('pointercancel', onBtnUp);
btnVerify.addEventListener('pointerleave', onBtnUp);
btnVerify.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') onBtnDown();
});
btnVerify.addEventListener('keyup', (event) => {
  if (event.key === ' ' || event.key === 'Enter') onBtnUp();
});

/* ─── Interações da seção principal ──────────────────────────────── */

btnDiscover.addEventListener('click', () => {
  showSection('section-verification');
  setTimeout(() => inputName.focus(), 150);
});

/* ─── Campo de texto — habilitar/desabilitar botão ──────────────── */

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
  if (holdTriggered) {
    holdTriggered = false;
    return;
  }
  if (!btnVerify.disabled) {
    startLoading(inputName.value);
  }
});

/* ─── Botões de redefinição (todos os ".btn-reset") ─────────────── */

btnResets.forEach(btn => btn.addEventListener('click', resetToVerify));

btnSurprise.addEventListener('click', openSurprise);
btnCloseSurprise.addEventListener('click', closeSurprise);
surpriseModal.addEventListener('click', (event) => {
  if (event.target === surpriseModal) closeSurprise();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !surpriseModal.hidden) closeSurprise();
});

/* ─── Inicialização ──────────────────────────────────────────────── */

// Garante estado inicial limpo
showSection('section-hero');
setBackground('default');
