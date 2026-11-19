import gsap from 'gsap';
import { SceneManager } from './scene/SceneManager.js';
import { RobotModel } from './scene/RobotModel.js';
import { initScrollChoreography } from './scene/ScrollChoreography.js';

const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderPercent = document.getElementById('preloader-percent');
const preloaderStatus = document.getElementById('preloader-status');

function updatePreloader(percent, statusText) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  if (preloaderBar) {
    preloaderBar.style.width = `${clamped}%`;
    preloaderBar.parentElement?.setAttribute('aria-valuenow', String(clamped));
  }
  if (preloaderPercent) preloaderPercent.textContent = `${clamped}%`;
  if (preloaderStatus && statusText) preloaderStatus.textContent = statusText;
}

function hidePreloader() {
  updatePreloader(100, 'Deneyim Hazır');
  setTimeout(() => {
    preloader?.classList.add('is-hidden');
  }, 320);
}

function initNavigation() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initVariantSelector(sceneManager, robotModel) {
  const buttons = document.querySelectorAll('.variant-btn');
  const readoutName = document.getElementById('readout-name');
  const readoutFocus = document.getElementById('readout-focus');
  const readoutSpec = document.getElementById('readout-spec');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const themeKey = btn.dataset.theme;
      if (!themeKey) return;

      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      const theme = robotModel.setTheme(themeKey);
      sceneManager.updateAtmosphere(theme);

      if (readoutName) readoutName.textContent = theme.name;
      if (readoutFocus) readoutFocus.textContent = theme.focus;
      if (readoutSpec) readoutSpec.textContent = theme.spec;
    });
  });
}

function initInteractiveInspection(sceneManager, choreography) {
  const viewport = document.getElementById('interactive-viewport');
  const angleLabel = document.getElementById('viewport-angle');
  const btnRear = document.getElementById('btn-view-rear');
  const btnExplode = document.getElementById('btn-toggle-explode');
  const btnReset = document.getElementById('btn-view-reset');

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const updateAngleHud = () => {
    if (!angleLabel) return;
    const rawDeg = Math.round((((sceneManager.scrollState.rotY + sceneManager.userOrbit.targetRotY) * 180) / Math.PI) % 360);
    const normalized = (rawDeg + 360) % 360;
    angleLabel.textContent = `${normalized}°`;
  };

  if (viewport) {
    viewport.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      sceneManager.userOrbit.targetRotY += dx * 0.0095;
      sceneManager.userOrbit.targetRotX = Math.max(
        -0.45,
        Math.min(0.45, sceneManager.userOrbit.targetRotX + dy * 0.005)
      );
      updateAngleHud();
    });

    const stopDrag = () => {
      isDragging = false;
      viewport.classList.remove('is-dragging');
    };

    viewport.addEventListener('pointerup', stopDrag);
    viewport.addEventListener('pointercancel', stopDrag);

    viewport.addEventListener('keydown', (e) => {
      const step = 0.22;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sceneManager.userOrbit.targetRotY -= step;
        updateAngleHud();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sceneManager.userOrbit.targetRotY += step;
        updateAngleHud();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sceneManager.userOrbit.targetRotX = Math.max(-0.45, sceneManager.userOrbit.targetRotX - 0.12);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sceneManager.userOrbit.targetRotX = Math.min(0.45, sceneManager.userOrbit.targetRotX + 0.12);
      }
    });
  }

  btnRear?.addEventListener('click', () => {
    gsap.to(sceneManager.userOrbit, {
      targetRotY: 0,
      targetRotX: 0,
      duration: 0.85,
      ease: 'power2.out',
      onUpdate: updateAngleHud
    });
  });

  btnReset?.addEventListener('click', () => {
    gsap.to(sceneManager.userOrbit, {
      targetRotY: -Math.PI,
      targetRotX: 0.06,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: updateAngleHud
    });
  });

  btnExplode?.addEventListener('click', () => {
    const nextState = choreography.getExplodeValue() > 0.5 ? 0 : 1;
    choreography.setManualExplode(nextState);
  });
}

function initChapterRail() {
  const dots = Array.from(document.querySelectorAll('.chapter-dot'));
  const sections = ['hero', 'muhendislik', 'takimlar', 'teknik-inceleme', 'kapanis']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!dots.length || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeId = entry.target.id;
        dots.forEach((dot) => {
          dot.classList.toggle('is-active', dot.dataset.chapter === activeId);
        });
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((sec) => observer.observe(sec));
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#contact-name')?.value.trim();
    const email = form.querySelector('#contact-email')?.value.trim();
    const message = form.querySelector('#contact-message')?.value.trim();

    if (!name || !email || !message) {
      feedback.textContent = 'Lütfen tüm alanları doldurun.';
      return;
    }

    feedback.textContent = `Teşekkür ederiz ${name}! Mesajınız AG Robotik ekibine iletildi.`;
    form.reset();
  });
}

async function bootstrap() {
  initNavigation();
  initChapterRail();
  initContactForm();

  const canvas = document.getElementById('scene-canvas');
  if (!canvas) {
    hidePreloader();
    return;
  }

  updatePreloader(10, 'WebGL 3D Sahne Başlatılıyor');
  const sceneManager = new SceneManager(canvas);
  const robotModel = new RobotModel({ isMobile: sceneManager.isMobile });

  await robotModel.load((pct, status) => updatePreloader(pct, status));

  sceneManager.setRobot(robotModel);
  const choreography = initScrollChoreography(sceneManager, robotModel);

  initVariantSelector(sceneManager, robotModel);
  initInteractiveInspection(sceneManager, choreography);

  sceneManager.start();
  hidePreloader();
}

bootstrap().catch((err) => {
  console.error('3D sahne başlatılırken hata oluştu:', err);
  hidePreloader();
});
