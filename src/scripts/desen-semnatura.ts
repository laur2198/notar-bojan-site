/**
 * Desenul semnăturii prin stroke-dashoffset (fără librării): aceeași metodă ca în prototip
 * (docs/design-v2/prototip-acasa.html) și pe PR #13.
 *
 * Fiecare <path> are pathLength="100" (dasharray 100 101 din CSS) și intervalul lui [data-a,
 * data-b] din gestul total, calculat la build și proporțional cu data-len (Semnatura.astro).
 * Un singur progres P (0 → 1, easing cubic-bezier(0.77, 0, 0.175, 1) pe tot gestul) dă
 * dashoffset-ul fiecărui path: 100 − 100 × clamp((P − a) / (b − a), 0, 1). Path-urile se
 * desenează strict pe rând, de la stânga la dreapta.
 *
 * Starea din HTML e cea finală (dashoffset 0, semnătura completă). Cine apelează decide dacă
 * animă: la prefers-reduced-motion: reduce nu se apelează deloc (CLAUDE.md §3.2).
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

function trasee(svg: SVGSVGElement) {
  const p = [...svg.querySelectorAll<SVGPathElement>('path[data-a]')];
  return {
    p,
    intervale: p.map((x): Interval => [Number.parseFloat(x.dataset.a ?? '0'), Number.parseFloat(x.dataset.b ?? '1')]),
  };
}

/** Ascunde semnătura (dashoffset 101 pe toate path-urile), înainte de desen. */
export function pregatesteSemnatura(svg: SVGSVGElement): void {
  for (const p of trasee(svg).p) p.style.strokeDashoffset = String(SEMNATURA_ASCUNS);
}

/** Readuce starea din HTML: semnătura desenată complet. */
export function finalizeazaSemnatura(svg: SVGSVGElement): void {
  for (const p of trasee(svg).p) p.style.removeProperty('stroke-dashoffset');
}

/**
 * Desenează semnătura în `durata` ms. Întoarce o funcție care oprește desenul și lasă
 * semnătura completă (de ex. la o a doua apăsare pe „Redă desenul”).
 */
export function deseneazaSemnatura(svg: SVGSVGElement, durata: number, gata?: () => void): () => void {
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
