const header = document.querySelector("[data-scroll-header]");
const revealEls = document.querySelectorAll(".reveal");
const countEl = document.querySelector("[data-count-to]");
const steps = Array.from(document.querySelectorAll("[data-step]"));
const demoIndex = document.querySelector("[data-demo-index]");
const demoTitle = document.querySelector("[data-demo-title]");
const demoText = document.querySelector("[data-demo-text]");
const demoBoard = document.querySelector("[data-demo-board]");

const demoSteps = [
  {
    title: "Elegí el contenedor repetido",
    text: "Hacé click sobre una card, fila o item del listado. La extensión detecta que se repite y muestra cuántos elementos similares encontró para usar como contexto del scraper.",
    className: "state-context",
  },
  {
    title: "Marcá los campos que querés extraer",
    text: "Podés elegir campos como título, precio, link o cualquier texto visible. La preview se actualiza en tiempo real mientras armás la configuración.",
    className: "state-fields",
  },
  {
    title: "Confirmá cómo sigue cargando la página",
    text: "La extensión sugiere si el sitio usa scroll infinito, botón cargar más o paginación clásica, y espera cambios reales del DOM antes de seguir.",
    className: "state-pagination",
  },
  {
    title: "Revisá y exportá los resultados",
    text: "Los datos quedan guardados de forma incremental en el navegador y podés exportarlos a CSV o JSON sin perder lo que ya se scrapeó.",
    className: "state-export",
  },
];

function onScroll() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.16 },
);

revealEls.forEach((el) => observer.observe(el));

function animateCount() {
  if (!countEl) return;
  const target = Number(countEl.dataset.countTo || 0);
  const duration = 1700;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    countEl.textContent = Math.round(target * eased).toLocaleString("en-US");
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      animateCount();
      countObserver.disconnect();
    }
  },
  { threshold: 0.4 },
);

if (countEl) countObserver.observe(countEl);

function setDemoStep(index) {
  const step = demoSteps[index];
  if (!step) return;
  steps.forEach((button) =>
    button.classList.toggle("active", Number(button.dataset.step) === index),
  );
  if (demoIndex) demoIndex.textContent = String(index + 1);
  if (demoTitle) demoTitle.textContent = step.title;
  if (demoText) demoText.textContent = step.text;
  if (demoBoard) {
    demoBoard.classList.remove(...demoSteps.map((item) => item.className));
    demoBoard.classList.add(step.className);
  }
}

function startDemoRotation() {
  window.clearInterval(window.demoRotationTimer);
  window.demoRotationTimer = window.setInterval(() => {
    const focused = document.activeElement;
    if (focused && focused.matches?.("[data-step]")) return;
    autoStep = (autoStep + 1) % demoSteps.length;
    setDemoStep(autoStep);
  }, 3600);
}

steps.forEach((button) => {
  button.addEventListener("click", () => {
    autoStep = Number(button.dataset.step);
    setDemoStep(autoStep);
    startDemoRotation();
  });
});

let autoStep = 0;
startDemoRotation();
setDemoStep(0);
