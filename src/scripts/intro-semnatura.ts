/**
 * Intro-ul cu semnătura (IntroSemnatura.astro), după prototip:
 *   ecran complet --c-paper, semnătura (--c-brand) se desenează în 1.8 s; pauză 0.4 s; ecranul urcă
 *   (translateY(-101%), 1 s, cubic-bezier(0.85, 0, 0.15, 1)); la jumătatea urcării se emite
 *   `intro-gata` pe document (hero-ul se leagă de el în V3). Fără intro, `intro-gata` se emite
 *   la încărcare. Pe <html> rămâne clasa `intro-gata`, pentru cine ascultă prea târziu.
 *
 * Pornirea automată o decide src/scripts/cap-pagina.js, înainte de primul paint (clasa
 * `cu-intro`): o dată pe sesiune, niciodată la prefers-reduced-motion sau fără JS.
 * Orice click, tastă, rotiță sau atingere îl sare (semnătura apare completă și ecranul urcă).
 * Stratul e aria-hidden și inert: pagina de dedesubt rămâne accesibilă, focusul nu intră în el.
 */
import { deseneazaSemnatura, pregatesteSemnatura } from './desen-semnatura';

export const EVENIMENT_GATA = 'intro-gata';
/** Emis după ce stratul a ieșit complet (ScrollTrigger își recalculează pozițiile). */
export const EVENIMENT_TERMINAT = 'intro-terminat';

const CHEIE_SESIUNE = 'intro-vazut';
const DURATA_DESEN = 1800;
const PAUZA = 400;
const DURATA_IESIRE = 1000;
const EASING_IESIRE = 'cubic-bezier(0.85, 0, 0.15, 1)';
const EVENIMENTE_SARIRE = ['click', 'keydown', 'wheel', 'touchstart'] as const;

const miscareRedusa = () => !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches;

let inCurs = false;

function anuntaGata() {
  document.documentElement.classList.add('intro-gata');
  document.dispatchEvent(new CustomEvent(EVENIMENT_GATA));
}

/**
 * Rulează intro-ul. Întoarce false dacă nu rulează (mișcare redusă, lipsește stratul sau rulează
 * deja). Ține minte în sesiune că a rulat.
 */
export function ruleazaIntro(): boolean {
  const html = document.documentElement;
  const strat = document.querySelector<HTMLElement>('[data-intro]');
  const svg = strat?.querySelector<SVGSVGElement>('svg[data-semnatura]');
  if (inCurs || !strat || !svg || miscareRedusa()) {
    html.classList.remove('cu-intro');
    return false;
  }
  inCurs = true;
  try {
    sessionStorage.setItem(CHEIE_SESIUNE, '1');
  } catch {
    // Fără sessionStorage: rulează acum, dar nu poate ține minte.
  }

  strat.style.removeProperty('transition');
  strat.style.removeProperty('transform');
  pregatesteSemnatura(svg);
  html.classList.add('cu-intro', 'intro-pornit');

  let iesit = false;
  let pauza = 0;
  let opresteDesen: () => void = () => {};

  const iese = () => {
    if (iesit) return;
    iesit = true;
    window.clearTimeout(pauza);
    for (const e of EVENIMENTE_SARIRE) window.removeEventListener(e, iese, true);
    // Sărit în timpul desenului: semnătura apare completă și urcă odată cu ecranul.
    opresteDesen();
    strat.style.transition = `transform ${DURATA_IESIRE}ms ${EASING_IESIRE}`;
    strat.style.transform = 'translateY(-101%)';
    window.setTimeout(anuntaGata, DURATA_IESIRE / 2);
    window.setTimeout(() => {
      html.classList.remove('cu-intro', 'intro-pornit');
      strat.style.removeProperty('transition');
      strat.style.removeProperty('transform');
      inCurs = false;
      document.dispatchEvent(new CustomEvent(EVENIMENT_TERMINAT));
    }, DURATA_IESIRE);
  };

  // Ascultătorii de sărire se pun după evenimentul curent (ex. clicul pe „Redă intro-ul”).
  requestAnimationFrame(() => {
    if (iesit) return;
    for (const e of EVENIMENTE_SARIRE) window.addEventListener(e, iese, { capture: true, passive: true });
  });
  opresteDesen = deseneazaSemnatura(svg, DURATA_DESEN, () => {
    opresteDesen = () => {};
    pauza = window.setTimeout(iese, PAUZA);
  });
  return true;
}

/** La încărcare: rulează intro-ul dacă scriptul din <head> l-a cerut, altfel anunță direct `intro-gata`. */
export function initIntro(): void {
  if (document.documentElement.classList.contains('cu-intro') && ruleazaIntro()) return;
  anuntaGata();
}
