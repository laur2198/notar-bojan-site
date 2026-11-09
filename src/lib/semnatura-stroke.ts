/**
 * ARHIVĂ – NEUTILIZAT. Helperul animației prin stroke-dashoffset, păstrat pentru momentul în care
 * vine desenul final al ilustratorului (un singur path cu stroke). Atunci Semnatura.astro revine
 * la această metodă: fiecare <path> are pathLength="100", stroke-dasharray 100 101 și
 * stroke-dashoffset calculat dintr-un progres global --progres (0 → 1, @property), cu clamp pe
 * intervalul trăsăturii; un singur element animat, easing pe tot gestul.
 *
 * Folosire (la revenire): intervalele din lungimile reale ale path-urilor (getTotalLength la
 * build), apoi CSS-ul de mai jos în componentă și câte o regulă [data-segment="i"] { --delay; --d }.
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
  if (!(total > 0)) throw new Error('Lungimile trăsăturilor trebuie să fie pozitive.');
  let cumul = 0;
  return lungimi.map((l, segment) => {
    const interval = { segment, delay: cumul / total, d: l / total };
    cumul += l;
    return interval;
  });
}

/** Regulile CSS cu intervalele (`[data-segment="i"] { --delay: …; --d: …; }`). */
export function cssIntervale(intervale: IntervalStroke[], selector = '.semnatura__traseu'): string {
  return intervale.map((i) => `${selector}[data-segment="${i.segment}"] { --delay: ${+i.delay.toFixed(6)}; --d: ${+i.d.toFixed(6)}; }`).join('\n');
}

/**
 * CSS-ul animației prin stroke (scopul: componenta semnăturii). Starea implicită e cea finală
 * (desenată); sub `.js` și fără reduced-motion pornește nedesenată până la clasa `.desenat`.
 */
export const CSS_ANIMATIE_STROKE = `
@property --progres { syntax: '<number>'; inherits: true; initial-value: 1; }
.semnatura { --semnatura-durata: 3.5s; --progres: 1; stroke-width: 2; stroke-linecap: round; fill: none; }
.semnatura .semnatura__traseu {
  stroke-dasharray: 100 101;
  stroke-dashoffset: calc(100 - 100 * clamp(0, (var(--progres) - var(--delay, 0)) / var(--d, 1), 1));
}
@media (prefers-reduced-motion: no-preference) {
  .js .semnatura:not(.desenat) { --progres: 0; }
  .semnatura.desenat { transition: --progres var(--semnatura-durata) cubic-bezier(0.77, 0, 0.175, 1); }
  .semnatura.instant { transition: none; }
}
`;
