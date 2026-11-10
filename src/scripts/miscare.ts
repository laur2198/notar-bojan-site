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
 *                          ([data-footer-interior]) yPercent -25 → 0 și stratul #120A05
 *                          ([data-footer-strat]) opacitate 0.35 → 0, scrub, clamp(top bottom) →
 *                          clamp(top top). La capăt, textul e static.
 *   [data-shutter]         benzi ink (doar demo pe /stil/, V3b) care acoperă secțiunea la ieșire (Shutter.astro): scaleY 0 → 1
 *                          de jos, stagger 0.01 from end, scrub 2.3, „bottom 60%” → „bottom top”;
 *                          16 benzi pe desktop, 10 pe tabletă (≤ 991 px), 6 pe mobil (≤ 478 px).
 *                          Benzile se creează doar aici: la mișcare redusă nu există deloc.
 *   [data-hero]            intrarea hero-ului de pe Acasă, pornită la `intro-gata` (sau imediat,
 *                          dacă a fost deja emis): h1 ([data-hero-titlu]) pe rânduri din mască,
 *                          linia ([data-hero-divider]) 0 → 100%, rândul de sub semnătură
 *                          ([data-hero-fade]) și wordmark-ul ([data-hero-wordmark]) apar, fotografia
 *                          ([data-hero-foto]) se descoperă de jos în sus (clip-path, 1 s, expo.out), iar
 *                          semnătura se desenează în 3.5 s. Până atunci CSS-ul le ascunde sub
 *                          `html.miscare:not(.hero-pornit)` (HeroAcasa.astro).
 *   [data-parallax-iesire="N"] deplasare yPercent 0 → N cât secțiunea iese din ecran
 *                          (top top → bottom top), scrub. Blocul de jos al hero-ului (40) și
 *                          interiorul fotografiei din hero (8).
 *   [data-fraze]           frazele mari ([data-fraza]) se succed literă cu literă, legat de scroll:
 *                          apar de la stânga, dispar de la dreapta, ultima rămâne (FrazeSticky.astro).
 *   [data-aprinde]         textul „se aprinde” literă cu literă la scroll, culoarea --c-slogan-stins → --c-ink.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { deseneazaSemnatura, pregatesteSemnatura } from './desen-semnatura';
import { EVENIMENT_GATA, EVENIMENT_TERMINAT } from './intro-semnatura';
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

/** Siguranță: dacă `intro-gata` nu vine în acest timp, hero-ul pornește oricum. */
const ASTEPTARE_MAXIMA_INTRO = 6000;

function intrareHero(hero: HTMLElement, ctx: gsap.Context): () => void {
  const html = document.documentElement;
  const titlu = hero.querySelector<HTMLElement>('[data-hero-titlu]');
  const linie = hero.querySelector<HTMLElement>('[data-hero-divider]');
  const fade = [...hero.querySelectorAll<HTMLElement>('[data-hero-fade]')];
  const wordmark = hero.querySelector<HTMLElement>('[data-hero-wordmark]');
  const foto = hero.querySelector<HTMLElement>('[data-hero-foto]');
  const semnatura = hero.querySelector<SVGSVGElement>('svg[data-semnatura]');
  let split: SplitText | null = null;
  let opresteDesen: (() => void) | null = null;
  let pornit = false;

  const porneste = () => {
    if (pornit) return;
    pornit = true;
    window.clearTimeout(siguranta);
    document.removeEventListener(EVENIMENT_GATA, porneste);
    // Animațiile create acum (după evenimentul async) intră în contextul matchMedia, ca să fie anulate la reduced-motion.
    ctx.add(() => {
      if (titlu) {
        split = SplitText.create(titlu, {
          type: 'lines',
          mask: 'lines',
          aria: 'auto',
          autoSplit: true,
          onSplit: (s) => gsap.from(s.lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: 'expo.out' }),
        });
      }
      if (linie) gsap.fromTo(linie, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut' });
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
    });
    if (semnatura) {
      pregatesteSemnatura(semnatura);
      opresteDesen = deseneazaSemnatura(semnatura, 3500);
    }
    html.classList.add('hero-pornit');
  };

  const siguranta = window.setTimeout(porneste, ASTEPTARE_MAXIMA_INTRO);
  if (html.classList.contains('intro-gata')) porneste();
  else document.addEventListener(EVENIMENT_GATA, porneste);

  return () => {
    window.clearTimeout(siguranta);
    document.removeEventListener(EVENIMENT_GATA, porneste);
    split?.revert();
    opresteDesen?.();
    html.classList.add('hero-pornit');
  };
}

function parallaxIesire(el: HTMLElement) {
  const n = Number.parseFloat(el.dataset.parallaxIesire ?? '');
  if (!Number.isFinite(n) || n === 0) return;
  const sectiune = el.closest('section') ?? el;
  gsap.fromTo(el, { yPercent: 0 }, { yPercent: n, ease: 'none', scrollTrigger: { trigger: sectiune, start: 'top top', end: 'bottom top', scrub: true } });
}

function fraze(container: HTMLElement): () => void {
  const elemente = [...container.querySelectorAll<HTMLElement>('[data-fraza]')];
  const master = gsap.timeline({ scrollTrigger: { trigger: container, start: 'top 40%', end: 'bottom bottom', scrub: true } });
  const curatari = elemente.map((f, i) => {
    const { tinta, aria, revino } = pregatesteTextAccesibil(f);
    const split = SplitText.create(tinta, { type: 'words,chars', aria });
    const t = gsap.timeline();
    t.from(split.chars, { autoAlpha: 0, stagger: { amount: 0.7, from: 'start' }, duration: 0.7 });
    if (i < elemente.length - 1) t.to(split.chars, { autoAlpha: 0, stagger: { amount: 0.7, from: 'end' }, duration: 0.7 });
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
  // Din griul --c-slogan-stins (5.3:1 pe alb) în culoarea textului; nu din opacitate (V3b).
  const stins = getComputedStyle(document.documentElement).getPropertyValue('--c-slogan-stins').trim() || '#6b6b6b';
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
  pornita.add(INTEROGARE_MISCARE, (ctx) => {
    html.classList.add('miscare');
    const curatari = [
      ...[...radacina.querySelectorAll<HTMLElement>('[data-reveal]')].map(reveal),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-hero]')].map((h) => intrareHero(h, ctx)),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-fraze]')].map(fraze),
      ...[...radacina.querySelectorAll<HTMLElement>('[data-aprinde]')].map(aprinde),
    ];
    radacina.querySelectorAll<HTMLElement>('[data-parallax-iesire]').forEach(parallaxIesire);
    radacina.querySelectorAll<HTMLElement>('[data-divider]').forEach(divider);
    radacina.querySelectorAll<HTMLElement>('[data-parallax]').forEach(parallax);
    radacina.querySelectorAll<HTMLElement>('[data-footer]').forEach(intrareFooter);
    const reimprospateaza = () => ScrollTrigger.refresh();
    document.addEventListener(EVENIMENT_TERMINAT, reimprospateaza);
    document.fonts?.ready.then(() => {
      reimprospateaza();
      pastreazaAncora();
    });
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
