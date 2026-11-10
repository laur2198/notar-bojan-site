/**
 * Intervalele animației prin stroke-dashoffset (semnătura din hero și din intro).
 *
 * Fiecare <path> al semnăturii are pathLength="100" (stroke-dasharray 100 101) și se desenează
 * cu stroke-dashoffset 100 → 0 în intervalul lui [a, b] din gestul total; intervalele sunt
 * consecutive (stânga → dreapta) și proporționale cu lungimea reală a path-ului (data-len).
 * Semnatura.astro le calculează aici, la build, și le scrie pe path-uri ca data-a / data-b;
 * scriptul de desen (src/scripts/desen-semnatura.js) le citește.
 */

export interface IntervalStroke {
  segment: number;
  /** Începutul intervalului, fracțiune din gestul total (0–1). */
  delay: number;
  /** Durata intervalului, fracțiune din gestul total; suma tuturor = 1. */
  d: number;
}

/** Intervalele consecutive, proporționale cu lungimile trăsăturilor. */
export function intervaleStroke(lungimi: number[]): IntervalStroke[] {
  const total = lungimi.reduce((s, l) => s + l, 0);
  if (!(total > 0) || lungimi.some((l) => !(l > 0))) throw new Error('Lungimile trăsăturilor trebuie să fie pozitive.');
  let cumul = 0;
  return lungimi.map((l, segment) => {
    const interval = { segment, delay: cumul / total, d: l / total };
    cumul += l;
    return interval;
  });
}
