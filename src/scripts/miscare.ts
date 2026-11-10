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
 *                          ([data-footer-interior]) yPercent -25 → 0 și stratul ink
 *                          ([data-footer-strat]) opacitate 0.5 → 0, scrub, clamp(top bottom) →
 *                          clamp(top top). La capăt, textul e static.
 *   [data-shutter]         benzi ink care acoperă secțiunea la ieșire (Shutter.astro): scaleY 0 → 1
 *                          de jos, stagger 0.01 from end, scrub 2.3, „bottom 60%” → „bottom top”;
 *                          16 benzi pe desktop, 10 pe tabletă (≤ 991 px), 6 pe mobil (≤ 478 px).
 *                          Benzile se creează doar aici: la mișcare redusă nu există deloc.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { EVENIMENT_TERMINAT } from './intro-semnatura';

import { INTEROGARE_MISCARE } from './miscare-interogare';

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
  if (strat) tl.fromTo(strat, { opacity: 0.5 }, { opacity: 0, ease: 'none' }, '<');
}

function shutter(container: HTMLElement, n: number): () => void {
  const sectiune = container.parentElement ?? container;
  const benzi = Array.from({ length: n }, () => document.createElement('i'));
  container.replaceChildren(...benzi);
  const tl = gsap
    .timeline({
      scrollTrigger: { trigger: sectiune, start: 'bottom 60%', end: 'bottom top', scrub: 2.3, invalidateOnRefresh: true },
    })
    .fromTo(benzi, { scaleY: 0 }, { scaleY: 1, duration: 0.1, stagger: { each: 0.01, from: 'end' }, ease: 'none' });
  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
    container.replaceChildren();
  };
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
    const curatari = [...radacina.querySelectorAll<HTMLElement>('[data-reveal]')].map(reveal);
    radacina.querySelectorAll<HTMLElement>('[data-divider]').forEach(divider);
    radacina.querySelectorAll<HTMLElement>('[data-parallax]').forEach(parallax);
    radacina.querySelectorAll<HTMLElement>('[data-footer]').forEach(intrareFooter);
    const reimprospateaza = () => ScrollTrigger.refresh();
    document.addEventListener(EVENIMENT_TERMINAT, reimprospateaza);
    document.fonts?.ready.then(reimprospateaza);
    html.classList.add('miscare-gata');
    return () => {
      document.removeEventListener(EVENIMENT_TERMINAT, reimprospateaza);
      curatari.forEach((c) => c());
      html.classList.remove('miscare');
    };
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
