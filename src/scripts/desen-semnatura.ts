/**
 * Desenul semnăturii prin stroke-dashoffset, fără librării (Semnatura.astro).
 *
 * Path-urile care se desenează sunt liniile centrale din măștile semnăturii (`path.rev`, cu
 * pathLength="100", dasharray 100 101 din CSS); fiecare are intervalul lui [data-a, data-b] din
 * gestul total, calculat la build, proporțional cu data-len, în ordinea notar → maini → bojan
 * (src/lib/semnatura.ts). Un singur progres P (0 → 1, easing cubic-bezier(0.77, 0, 0.175, 1)
 * pe tot gestul) dă dashoffset-ul fiecărui path: 100 × (1 − clamp((P − a) / (b − a), 0, 1)).
 * Un element [data-semnatura] are două SVG-uri (întreaga și, pe mobil, doar mâinile), fiecare cu
 * intervalele lui; se animă amândouă cu același P, se vede doar cel afișat.
 *
 * Starea din HTML e cea finală (dashoffset 0, semnătura completă). La prefers-reduced-motion:
 * reduce nu se animă nimic (CLAUDE.md §3.2): deseneazaLaVedere lasă starea din HTML.
 *
 * Modul ES, încărcat din /_astro/ (CSP: script-src 'self', fără scripturi inline).
 */

/*
 * Un path neînceput primește 101, nu 100: la exact 100 rămâne o liniuță de lungime zero, pe care
 * stroke-linecap: round o desenează ca un punct vizibil la începutul path-ului.
 */
export const SEMNATURA_ASCUNS = 101;

type Interval = readonly [a: number, b: number];

/** cubic-bezier(0.77, 0, 0.175, 1): progresul pentru timpul t ∈ [0, 1] (bisecție pe x). */
export function semnaturaEasing(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bez = (s: number, p1: number, p2: number) => 3 * p1 * s * (1 - s) * (1 - s) + 3 * p2 * s * s * (1 - s) + s * s * s;
  let lo = 0;
  let hi = 1;
  let s = t;
  for (let i = 0; i < 30; i++) {
    s = (lo + hi) / 2;
    if (bez(s, 0.77, 0.175) < t) lo = s;
    else hi = s;
  }
  return bez(s, 0, 1);
}

/** Dashoffset-ul fiecărui path pentru progresul P (≥ 100 = nedesenat, 0 = desenat). */
export function semnaturaOffseturi(P: number, intervale: readonly Interval[]): number[] {
  return intervale.map(([a, b]) => {
    const f = Math.min(1, Math.max(0, b > a ? (P - a) / (b - a) : P >= b ? 1 : 0));
    return f > 0 ? 100 - 100 * f : SEMNATURA_ASCUNS;
  });
}

function trasee(svg: Element) {
  const p = [...svg.querySelectorAll<SVGPathElement>('path[data-a]')];
  return {
    p,
    intervale: p.map((x): Interval => [Number.parseFloat(x.dataset.a ?? '0'), Number.parseFloat(x.dataset.b ?? '1')]),
  };
}

/** Ascunde semnătura (dashoffset 101 pe toate path-urile), înainte de desen. */
export function pregatesteSemnatura(svg: Element): void {
  for (const p of trasee(svg).p) p.style.strokeDashoffset = String(SEMNATURA_ASCUNS);
}

/** Readuce starea din HTML: semnătura desenată complet. */
export function finalizeazaSemnatura(svg: Element): void {
  for (const p of trasee(svg).p) p.style.removeProperty('stroke-dashoffset');
}

/**
 * Desenează semnătura în `durata` ms. Întoarce o funcție care oprește desenul și lasă
 * semnătura completă (de ex. la o a doua apăsare pe „Redă desenul”).
 */
export function deseneazaSemnatura(svg: Element, durata: number, gata?: () => void): () => void {
  const s = trasee(svg);
  let start: number | null = null;
  let cerere = 0;
  const aplica = (P: number) => {
    const o = semnaturaOffseturi(P, s.intervale);
    s.p.forEach((p, i) => (p.style.strokeDashoffset = o[i]!.toFixed(3)));
  };
  const cadru = (acum: number) => {
    if (start === null) start = acum;
    const t = Math.min(1, (acum - start) / durata);
    aplica(semnaturaEasing(t));
    if (t < 1) cerere = requestAnimationFrame(cadru);
    else gata?.();
  };
  aplica(0);
  cerere = requestAnimationFrame(cadru);
  return () => {
    cancelAnimationFrame(cerere);
    finalizeazaSemnatura(svg);
  };
}

const miscareRedusa = () => typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Desenează semnătura când intră în ecran (IntersectionObserver, cel puțin 30% vizibilă), în
 * `durata` ms (3500 în hero, 1800 la intro). Până atunci e ascunsă (dashoffset 101). La mișcare
 * redusă nu atinge nimic: rămâne starea din HTML, desenată complet. Fără IntersectionObserver
 * desenează imediat. Întoarce o funcție care oprește totul și lasă semnătura completă.
 */
export function deseneazaLaVedere(el: Element, durata: number, gata?: () => void): () => void {
  if (miscareRedusa()) {
    finalizeazaSemnatura(el);
    gata?.();
    return () => {};
  }
  pregatesteSemnatura(el);
  let opreste: (() => void) | null = null;
  if (typeof IntersectionObserver !== 'function') {
    opreste = deseneazaSemnatura(el, durata, gata);
    return () => opreste?.();
  }
  const observator = new IntersectionObserver(
    (intrari) => {
      if (!intrari.some((i) => i.isIntersecting)) return;
      observator.disconnect();
      opreste = deseneazaSemnatura(el, durata, gata);
    },
    { threshold: 0.3 },
  );
  observator.observe(el);
  return () => {
    observator.disconnect();
    if (opreste) opreste();
    else finalizeazaSemnatura(el);
  };
}
