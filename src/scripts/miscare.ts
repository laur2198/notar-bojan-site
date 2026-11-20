/**
 * Infrastructura de mișcare (CLAUDE.md §3.2): GSAP + ScrollTrigger + SplitText, din pachetul npm
 * `gsap`. Derularea rămâne cea nativă (fără Lenis, fără smooth scroll din JS); ancorele folosesc
 * `scroll-behavior: smooth` din CSS, doar fără mișcare redusă.
 *
 * Un singur init (`pornesteMiscarea`), o singură verificare a preferinței: totul rulează în
 * gsap.matchMedia('(prefers-reduced-motion: no-preference)'). La `reduce` nu pornește nimic, iar
 * dacă preferința se schimbă cu pagina deschisă, gsap anulează tot (textul împărțit revine,
 * elementele rămân în starea finală).
 *
 * Starea inițială ascunsă o dă CSS-ul doar sub `html.miscare:not(.miscare-gata)`, clasă pusă
 * înainte de primul paint de src/scripts/cap-pagina.js. Fără JS și la mișcare redusă totul e vizibil.
 *
 * Helperi pe data-atribute:
 *   [data-reveal]          rânduri din mască: SplitText lines + mask, yPercent 110 → 0, 0.8 s,
 *                          stagger 0.08, expo.out, o dată, la `top 80%`; se reface la resize.
 *   [data-divider]         scaleX 0 → 1, 1.1 s, power2.inOut, la `top 90%`.
 *   [data-parallax="N"]    deplasare legată de scroll, yPercent N → −N pe durata vizibilității
 *                          (N negativ inversează sensul). Doar decorativ: fotografii, forme.
 *   [data-footer]          subsolul „intră de sub conținut” (Footer.astro): interiorul
 *                          ([data-footer-interior]) yPercent -25 → 0 și stratul #3D0A0A
 *                          ([data-footer-strat]) opacitate 0.35 → 0, scrub, clamp(top bottom) →
 *                          clamp(top top). La capăt, textul e static.
 *   [data-shutter]         benzi ink (doar demo pe /stil/, V3b) care acoperă secțiunea la ieșire (Shutter.astro): scaleY 0 → 1
 *                          de jos, stagger 0.01 from end, scrub 2.3, „bottom 60%” → „bottom top”;
 *                          16 benzi pe desktop, 10 pe tabletă (≤ 991 px), 6 pe mobil (≤ 478 px).
 *                          Benzile se creează doar aici: la mișcare redusă nu există deloc.
 *   [data-hero]            intrarea hero-ului de pe Acasă, pornită la încărcarea modulului (V3d: fără
 *                          intro): blocul de titlu ([data-hero-titlu]: h1 + subtitlu) pe rânduri din mască,
 *                          linia ([data-hero-divider]) și linia roșie de sub titlu ([data-hero-accent])
 *                          0 → 100%, rândul de deasupra liniei ([data-hero-fade]) și wordmark-ul
 *                          ([data-hero-wordmark]) apar, fotografia ([data-hero-foto]) se descoperă de jos
 *                          în sus (clip-path, 1 s, expo.out). Până atunci CSS-ul le ascunde sub
 *                          `html.miscare:not(.hero-pornit)` (HeroAcasa.astro).
 *   [data-parallax-iesire="N"] deplasare yPercent 0 → N cât secțiunea iese din ecran
 *                          (top top → bottom top), scrub. Blocul de jos al hero-ului (40) și
 *                          interiorul fotografiei din hero (8).
 *   [data-fraze]           frazele mari ([data-fraza]) se succed literă cu literă, legat de scroll:
 *                          fiecare literă apare în nuanța stinsă (--c-slogan-stins-inchis, nu opacitate)
 *                          și se aprinde în alb, de la stânga; la ieșire se stinge și dispare, de la
 *                          dreapta; ultima rămâne aprinsă (FrazeSticky.astro, pe rosu-900).
 *   [data-aprinde]         textul „se aprinde” literă cu literă la scroll, culoarea --c-slogan-stins → --c-ink.
 *   [data-fundal-viu]      petele din FundalViu.astro ([data-viu-pata]): xPercent/yPercent −d → +d și scara
 *                          s0 → s1 (data-dx, data-dy, data-s0, data-s1), scrub, cât secțiunea traversează
 *                          ecranul (top bottom → bottom top); will-change: transform doar cât e în ecran.
 *                          Cu [data-viu-cursor] și pointer fin: straturile ([data-viu-grad]) urmăresc lent
 *                          cursorul (gsap.quickTo, max. data-cursor-px px), doar cât secțiunea e în ecran.
 *                          Fără nicio mișcare care continuă după ce vizitatorul se oprește (WCAG 2.2.2).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { INTEROGARE_MISCARE } from './miscare-interogare';
import { EVENIMENT_TEMA } from './tema-navbar';

export { INTEROGARE_MISCARE };

const TITLURI = /^H[1-6]$/;

/**
 * Pregătește un element pentru împărțire, păstrând textul accesibil.
 * Titlurile: SplitText cu aria „auto” (aria-label pe titlu, bucățile aria-hidden).
 * Celelalte elemente (aria-label e interzis pe <p>, ARIA 1.2): o copie sr-only a textului și
 * un înveliș aria-hidden care se împarte. Întoarce ținta împărțirii și funcția de revenire.
 */
export function pregatesteTextAccesibil(el: HTMLElement): { tinta: HTMLElement; aria: 'auto' | 'none'; revino: () => void } {
  if (TITLURI.test(el.tagName)) return { tinta: el, aria: 'auto', revino: () => {} };
  const original = el.innerHTML;
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const copie = document.createElement('span');
  copie.className = 'sr-only';
  copie.textContent = text;
  const vizual = document.createElement('span');
  vizual.setAttribute('aria-hidden', 'true');
  vizual.style.display = 'block';
  vizual.innerHTML = original;
  el.replaceChildren(copie, vizual);
  return { tinta: vizual, aria: 'none', revino: () => (el.innerHTML = original) };
}

/**
 * Titlul hero-ului de pe Acasă: un bloc cu <h1> și subtitlul <p>, amândouă inline (HeroAcasa.astro),
 * ca h1-ul să conțină doar titlul. Împărțirea pe rânduri ar tăia h1-ul în bucăți (câte un <h1> pe
 * rând), așa că se împarte o copie vizuală aria-hidden (span-uri cu aceleași clase), iar elementele
 * reale rămân în pagină, sr-only, doar cât durează intrarea. `revino` readuce exact HTML-ul inițial.
 * Un titlu simplu (h1–h6) se împarte direct, cu aria „auto”.
 */
export function pregatesteTitluHero(el: HTMLElement): { tinta: HTMLElement; aria: 'auto' | 'none'; revino: () => void } {
  if (TITLURI.test(el.tagName)) return { tinta: el, aria: 'auto', revino: () => {} };
  const reale = [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  const vizual = document.createElement('div');
  vizual.setAttribute('aria-hidden', 'true');
  reale.forEach((real, i) => {
    const copie = document.createElement('span');
    for (const a of real.attributes) if (a.name !== 'id') copie.setAttribute(a.name, a.value);
    copie.innerHTML = real.innerHTML;
    if (i > 0) vizual.append(' ');
    vizual.append(copie);
  });
  for (const real of reale) real.classList.add('sr-only');
  el.append(vizual);
  return {
    tinta: vizual,
    aria: 'none',
    revino: () => {
      vizual.remove();
      for (const real of reale) real.classList.remove('sr-only');
    },
  };
}

function reveal(el: HTMLElement): () => void {
  const { tinta, aria, revino } = pregatesteTextAccesibil(el);
  const split = SplitText.create(tinta, {
    type: 'lines',
    mask: 'lines',
    aria,
    autoSplit: true,
    onSplit: (s) =>
      gsap.from(s.lines, {
        yPercent: 110,
        duration: 0.8,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      }),
  });
  return () => {
    split.revert();
    revino();
  };
}

function divider(el: HTMLElement) {
  gsap.fromTo(
    el,
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
  );
}

function parallax(el: HTMLElement) {
  const n = Number.parseFloat(el.dataset.parallax ?? '');
  if (!Number.isFinite(n) || n === 0) return;
  gsap.fromTo(
    el,
    { yPercent: n },
    { yPercent: -n, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

function intrareFooter(footer: HTMLElement) {
  const interior = footer.querySelector<HTMLElement>('[data-footer-interior]');
  const strat = footer.querySelector<HTMLElement>('[data-footer-strat]');
  if (!interior) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: footer, start: 'clamp(top bottom)', end: 'clamp(top top)', scrub: true },
  });
  tl.fromTo(interior, { yPercent: -25 }, { yPercent: 0, ease: 'none' });
  if (strat) tl.fromTo(strat, { opacity: 0.35 }, { opacity: 0, ease: 'none' }, '<');
}

function shutter(container: HTMLElement, n: number): () => void {
  const sectiune = container.parentElement ?? container;
  const benzi = Array.from({ length: n }, () => {
    const banda = document.createElement('i');
    // Benzile sunt ink: navbar-ul trece pe tema închisă deasupra lor (tema-navbar.ts).
    banda.dataset.temaStrat = 'dark';
    return banda;
  });
  container.replaceChildren(...benzi);
  const tl = gsap
    .timeline({
      scrollTrigger: { trigger: sectiune, start: 'bottom 60%', end: 'bottom top', scrub: 2.3, invalidateOnRefresh: true },
      // Benzile se mișcă și după oprirea derulării (scrub 2.3 s): navbar-ul își recalculează tema.
      onUpdate: () => document.dispatchEvent(new Event(EVENIMENT_TEMA)),
    })
    .fromTo(benzi, { scaleY: 0 }, { scaleY: 1, duration: 0.1, stagger: { each: 0.01, from: 'end' }, ease: 'none' });
  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    container.replaceChildren();
  };
}

function intrareHero(hero: HTMLElement): () => void {
  const html = document.documentElement;
  const titlu = hero.querySelector<HTMLElement>('[data-hero-titlu]');
  const linie = hero.querySelector<HTMLElement>('[data-hero-divider]');
  const accent = hero.querySelector<HTMLElement>('[data-hero-accent]');
  const fade = [...hero.querySelectorAll<HTMLElement>('[data-hero-fade]')];
  const wordmark = hero.querySelector<HTMLElement>('[data-hero-wordmark]');
  const foto = hero.querySelector<HTMLElement>('[data-hero-foto]');
  let split: SplitText | null = null;
  let revinoTitlu: () => void = () => {};

  /** După intrare (sau la oprire): fără împărțire, HTML-ul inițial al titlului. */
  const refaTitlul = () => {
    split?.revert();
    split = null;
    revinoTitlu();
    revinoTitlu = () => {};
  };

  // Intrarea pornește direct, la încărcarea modulului (V3d: fără intro), în contextul matchMedia
  // din pornesteMiscarea: anulată automat dacă preferința trece pe mișcare redusă.
  if (titlu) {
    const { tinta, aria, revino } = pregatesteTitluHero(titlu);
    revinoTitlu = revino;
    split = SplitText.create(tinta, {
      type: 'lines',
      mask: 'lines',
      aria,
      autoSplit: true,
      onSplit: (s) => gsap.from(s.lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'expo.out', onComplete: refaTitlul }),
    });
  }
  if (linie) gsap.fromTo(linie, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut' });
  // Linia roșie de sub titlu (V3d): după primele rânduri ale titlului.
  if (accent) gsap.fromTo(accent, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut', delay: 0.35 });
  if (fade.length) gsap.fromTo(fade, { autoAlpha: 0, y: '1em' }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.inOut', delay: 0.2 });
  if (wordmark) gsap.fromTo(wordmark, { autoAlpha: 0, y: '0.3em' }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.inOut', delay: 0.3 });
  // Fotografia: mască de jos în sus (V3b).
  if (foto) {
    gsap.fromTo(
      foto,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out', clearProps: 'clipPath' },
    );
  }
  html.classList.add('hero-pornit');

  return () => {
    refaTitlul();
    html.classList.add('hero-pornit');
  };
}

function parallaxIesire(el: HTMLElement) {
  const n = Number.parseFloat(el.dataset.parallaxIesire ?? '');
  if (!Number.isFinite(n) || n === 0) return;
  const sectiune = el.closest('section') ?? el;
  gsap.fromTo(el, { yPercent: 0 }, { yPercent: n, ease: 'none', scrollTrigger: { trigger: sectiune, start: 'top top', end: 'bottom top', scrub: true } });
}

/** Culoarea unui token din tokens.css, citită la rulare (ex. --c-slogan-stins). */
const culoareToken = (nume: string, rezerva: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(nume).trim() || rezerva;

function fraze(container: HTMLElement): () => void {
  const elemente = [...container.querySelectorAll<HTMLElement>('[data-fraza]')];
  const master = gsap.timeline({ scrollTrigger: { trigger: container, start: 'top 40%', end: 'bottom bottom', scrub: true } });
  // V3d (pe rosu-900): fiecare literă apare direct în nuanța stinsă (5.2:1), fără stări
  // intermediare de opacitate, apoi se aprinde în alb; la ieșire, invers.
  const stins = culoareToken('--c-slogan-stins-inchis', '#dea7a0');
  const aprins = culoareToken('--c-paper', '#ffffff');
  const curatari = elemente.map((f, i) => {
    const { tinta, aria, revino } = pregatesteTextAccesibil(f);
    const split = SplitText.create(tinta, { type: 'words,chars', aria });
    const t = gsap.timeline();
    // steps(1): opacitatea sare 0 → 1 (fără stări intermediare, oricât de lent se derulează).
    t.fromTo(split.chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'steps(1)', stagger: { amount: 0.7, from: 'start' } }, 0);
    t.fromTo(split.chars, { color: stins }, { color: aprins, duration: 0.35, ease: 'none', stagger: { amount: 0.7, from: 'start' } }, 0);
    if (i < elemente.length - 1) {
      t.to(split.chars, { color: stins, duration: 0.35, ease: 'none', stagger: { amount: 0.7, from: 'end' } }, '>');
      t.to(split.chars, { autoAlpha: 0, duration: 0.01, ease: 'steps(1)', stagger: { amount: 0.7, from: 'end' } }, '<0.35');
    }
    master.add(t, i === 0 ? 0 : '-=0.15');
    return () => {
      split.revert();
      revino();
    };
  });
  return () => {
    master.scrollTrigger?.kill();
    master.kill();
    curatari.forEach((c) => c());
  };
}

function aprinde(el: HTMLElement): () => void {
  const { tinta, aria, revino } = pregatesteTextAccesibil(el);
  // Din griul --c-slogan-stins (6.3:1 pe alb) în culoarea textului; nu din opacitate (V3b).
  // Pe închis (.pe-inchis), din --c-slogan-stins-inchis (5.2:1 pe rosu-900).
  const stins = el.closest('.pe-inchis') ? culoareToken('--c-slogan-stins-inchis', '#dea7a0') : culoareToken('--c-slogan-stins', '#62605d');
  const split = SplitText.create(tinta, {
    type: 'words,chars',
    aria,
    autoSplit: true,
    onSplit: (s) =>
      gsap.from(s.chars, { color: stins, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'center 40%', scrub: true } }),
  });
  return () => {
    split.revert();
    revino();
  };
}

/** Petele fundalului viu, legate de scroll (FundalViu.astro). */
function fundalViu(el: HTMLElement): () => void {
  const sectiune = el.parentElement ?? el;
  const pete = [...el.querySelectorAll<HTMLElement>('[data-viu-pata]')];
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectiune,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onToggle: (st) => pete.forEach((p) => (p.style.willChange = st.isActive ? 'transform' : '')),
    },
  });
  for (const p of pete) {
    const n = (cheie: string, implicit: number) => {
      const v = Number.parseFloat(p.dataset[cheie] ?? '');
      return Number.isFinite(v) ? v : implicit;
    };
    const dx = n('dx', 0);
    const dy = n('dy', 0);
    tl.fromTo(p, { xPercent: -dx, yPercent: -dy, scale: n('s0', 1) }, { xPercent: dx, yPercent: dy, scale: n('s1', 1), ease: 'none' }, 0);
  }
  return () => pete.forEach((p) => (p.style.willChange = ''));
}

/**
 * Petele care urmăresc cursorul (FundalViu cu `cursor`, doar pe hero): deplasare proporțională cu
 * poziția cursorului față de centrul ferestrei, max. data-cursor-px px, cu gsap.quickTo (1.2 s,
 * power3.out): când mouse-ul se oprește, tween-ul se termină și petele rămân pe loc.
 */
function fundalViuCursor(el: HTMLElement): () => void {
  const sectiune = el.parentElement ?? el;
  const straturi = [...el.querySelectorAll<HTMLElement>('[data-viu-grad]')].map((s) => ({
    px: Math.min(30, Number.parseFloat(s.dataset.cursorPx ?? '') || 0),
    x: gsap.quickTo(s, 'x', { duration: 1.2, ease: 'power3.out' }),
    y: gsap.quickTo(s, 'y', { duration: 1.2, ease: 'power3.out' }),
  }));
  let vizibil = false;
  const observator = new IntersectionObserver((intrari) => (vizibil = intrari.some((i) => i.isIntersecting)));
  observator.observe(sectiune);
  const laMiscare = (e: PointerEvent) => {
    if (!vizibil || e.pointerType !== 'mouse') return;
    const fx = (e.clientX / innerWidth) * 2 - 1;
    const fy = (e.clientY / innerHeight) * 2 - 1;
    for (const s of straturi) {
      s.x(fx * s.px);
      s.y(fy * s.px);
    }
  };
  addEventListener('pointermove', laMiscare, { passive: true });
  return () => {
    removeEventListener('pointermove', laMiscare);
    observator.disconnect();
  };
}

/** Vizitatorul a derulat singur (rotiță, atingere, taste): nu mai mutăm pagina la ancoră. */
let atins = false;
if (typeof window !== 'undefined') {
  for (const ev of ['wheel', 'touchstart', 'keydown'] as const) {
    addEventListener(ev, () => (atins = true), { once: true, passive: true });
  }
}

/**
 * Pagina deschisă cu #ancoră: după fonturi și refresh-ul ScrollTrigger (care repune poziția în
 * px, deși înălțimile de deasupra s-au schimbat), secțiunea revine sub navbar, dacă vizitatorul
 * n-a derulat între timp. Apoi derularea lină a ancorelor (CSS) revine.
 */
function pastreazaAncora() {
  const html = document.documentElement;
  if (!html.classList.contains('ancora-initiala')) return;
  const gata = () => html.classList.remove('ancora-initiala');
  let tinta: Element | null = null;
  try {
    tinta = document.querySelector(decodeURIComponent(location.hash));
  } catch {
    tinta = null;
  }
  if (tinta && !atins) tinta.scrollIntoView({ block: 'start', behavior: 'instant' });
  requestAnimationFrame(gata);
}

let pornita: gsap.MatchMedia | null = null;

/** Pornește mișcarea pe pagină (o singură dată). */
export function pornesteMiscarea(radacina: ParentNode = document): gsap.MatchMedia {
  if (pornita) return pornita;
  const html = document.documentElement;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  pornita = gsap.matchMedia();
  pornita.add(INTEROGARE_MISCARE, () => {
    html.classList.add('miscare');
    const curatari = [
      ...[...radacina.querySelectorAll<HTMLElement>('[data-reveal]')].map(reveal),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-hero]')].map(intrareHero),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-fraze]')].map(fraze),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-aprinde]')].map(aprinde),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-fundal-viu]')].map(fundalViu),
    ];
    radacina.querySelectorAll<HTMLElement>('[data-parallax-iesire]').forEach(parallaxIesire);
    radacina.querySelectorAll<HTMLElement>('[data-divider]').forEach(divider);
    radacina.querySelectorAll<HTMLElement>('[data-parallax]').forEach(parallax);
    radacina.querySelectorAll<HTMLElement>('[data-footer]').forEach(intrareFooter);
    const reimprospateaza = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(() => {
      reimprospateaza();
      pastreazaAncora();
    });
    html.classList.add('miscare-gata');
    return () => {
      curatari.forEach((c) => c());
      html.classList.remove('miscare');
    };
  });
  // Fundalul viu după cursor: doar cu mouse (pointer fin, hover) și fără mișcare redusă.
  pornita.add(`${INTEROGARE_MISCARE} and (hover: hover) and (pointer: fine)`, () => {
    const curatari = [...radacina.querySelectorAll<HTMLElement>('[data-fundal-viu][data-viu-cursor]')].map(fundalViuCursor);
    return () => curatari.forEach((c) => c());
  });
  // Shutter-ul: numărul de benzi depinde de lățime; gsap refă benzile la trecerea pragurilor.
  pornita.add(
    {
      mobil: `${INTEROGARE_MISCARE} and (max-width: 478px)`,
      tableta: `${INTEROGARE_MISCARE} and (min-width: 479px) and (max-width: 991px)`,
      desktop: `${INTEROGARE_MISCARE} and (min-width: 992px)`,
    },
    (ctx) => {
      const { mobil, tableta } = ctx.conditions as Record<string, boolean>;
      const n = mobil ? 6 : tableta ? 10 : 16;
      const curatari = [...radacina.querySelectorAll<HTMLElement>('[data-shutter]')].map((c) => shutter(c, n));
      return () => curatari.forEach((c) => c());
    },
  );
  // Fără mișcare (reduce sau preferința schimbată): starea finală, vizibilă.
  if (!matchMedia(INTEROGARE_MISCARE).matches) html.classList.remove('miscare');
  return pornita;
}
