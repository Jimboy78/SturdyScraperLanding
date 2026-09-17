const header = document.querySelector("[data-scroll-header]");
const revealEls = document.querySelectorAll(".reveal");
const countEl = document.querySelector("[data-count-to]");
const steps = Array.from(document.querySelectorAll("[data-step]"));
const demoIndex = document.querySelector("[data-demo-index]");
const demoTitle = document.querySelector("[data-demo-title]");
const demoText = document.querySelector("[data-demo-text]");
const demoBoard = document.querySelector("[data-demo-board]");

const LANG = document.documentElement.lang === "en" ? "en" : "es";

const TEXT = {
  es: {
    steps: [
      ["Elegí el contenedor repetido", "Hacé click sobre una card, fila o item del listado. La extensión detecta que se repite y muestra cuántos elementos similares encontró para usar como contexto del scraper."],
      ["Marcá los campos que querés extraer", "Podés elegir campos como título, precio, link o cualquier texto visible. La preview se actualiza en tiempo real mientras armás la configuración."],
      ["Confirmá cómo sigue cargando la página", "La extensión sugiere si el sitio usa scroll infinito, botón cargar más o paginación clásica, y espera cambios reales del DOM antes de seguir."],
      ["Revisá y exportá los resultados", "Los datos quedan guardados de forma incremental en el navegador y podés exportarlos a CSV o JSON sin perder lo que ya se scrapeó."],
    ],
    sending: "Enviando...",
    submit: "Pedir acceso",
    invalidEmail: "Poné un email válido para seguir.",
    sendError: "No se pudo enviar. Escribinos directo a support@sturdyscraper.com.",
    numberLocale: "es-AR",
  },
  en: {
    steps: [
      ["Pick the repeating item", "Click a card, row or item in the list. The extension detects that it repeats and shows how many similar elements it found to use as the scraper's context."],
      ["Click the fields you want", "Pick fields like title, price, link or any visible text. The preview updates in real time while you build the scraper."],
      ["Confirm how the page loads more", "The extension suggests whether the site uses infinite scroll, a load more button or classic pagination, and waits for real DOM changes before moving on."],
      ["Review and export the results", "Rows are saved incrementally in your browser and you can export them to CSV or JSON without losing what was already scraped."],
    ],
    sending: "Sending...",
    submit: "Request access",
    invalidEmail: "Enter a valid email to continue.",
    sendError: "Couldn't send it. Email us directly at support@sturdyscraper.com.",
    numberLocale: "en-US",
  },
}[LANG];

const STEP_CLASSES = ["state-context", "state-fields", "state-pagination", "state-export"];
const demoSteps = TEXT.steps.map(([title, text], i) => ({ title, text, className: STEP_CLASSES[i] }));

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
    countEl.textContent = Math.round(target * eased).toLocaleString(TEXT.numberLocale);
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

const WAITLIST_ENDPOINT = "https://sturdy-scraper-license-worker.martiniseba78.workers.dev/waitlist";
const waitlistForm = document.querySelector("#waitlist-form");
const waitlistStatus = document.querySelector("[data-form-status]");
const waitlistFields = document.querySelector("[data-signup-fields]");
const waitlistSuccess = document.querySelector("[data-signup-success]");
const waitlistResetButton = document.querySelector("[data-signup-reset]");
const submitButton = document.querySelector("[data-submit-button]");
const submitButtonLabel = document.querySelector("[data-button-label]");

function setSubmitting(isSubmitting) {
  if (!submitButton) return;
  submitButton.classList.toggle("is-loading", isSubmitting);
  submitButton.disabled = isSubmitting;
  if (submitButtonLabel) {
    submitButtonLabel.textContent = isSubmitting ? TEXT.sending : TEXT.submit;
  }
}

function setFieldsInvalid(isInvalid) {
  waitlistForm?.classList.toggle("has-error", isInvalid);
}

function showStatus(message, tone) {
  if (!waitlistStatus) return;
  waitlistStatus.textContent = message;
  waitlistStatus.classList.remove("is-error", "is-visible");
  if (message) {
    if (tone === "error") waitlistStatus.classList.add("is-error");
    // Reflow so the fade-in transition retriggers on repeated errors.
    void waitlistStatus.offsetWidth;
    waitlistStatus.classList.add("is-visible");
  }
}

waitlistForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = waitlistForm.email.value.trim();
  const useCase = waitlistForm.use_case.value.trim();

  if (!email || !waitlistForm.email.checkValidity()) {
    setFieldsInvalid(true);
    showStatus(TEXT.invalidEmail, "error");
    waitlistForm.email.focus();
    return;
  }
  setFieldsInvalid(false);

  setSubmitting(true);
  showStatus("", null);

  try {
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, use_case: useCase }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    waitlistForm.reset();
    if (waitlistFields && waitlistSuccess) {
      waitlistFields.hidden = true;
      waitlistSuccess.hidden = false;
      requestAnimationFrame(() => waitlistSuccess.classList.add("is-visible"));
    }
  } catch (err) {
    showStatus(TEXT.sendError, "error");
  } finally {
    setSubmitting(false);
  }
});

waitlistForm?.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    setFieldsInvalid(false);
    showStatus("", null);
  });
});

waitlistResetButton?.addEventListener("click", () => {
  if (!waitlistFields || !waitlistSuccess) return;
  waitlistSuccess.classList.remove("is-visible");
  waitlistSuccess.hidden = true;
  waitlistFields.hidden = false;
  waitlistForm.email.focus();
});
