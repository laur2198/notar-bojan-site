/**
 * Citirea semnăturii generate (src/assets/semnatura.svg, din scripts/genereaza-semnatura.mjs) la
 * build: viewBox-ul, grupurile (notar · mâini · bojan) și interiorul SVG-ului, pe care componenta
 * Semnatura.astro îl pune în propriul <svg>. Intervalele trăsăturilor (--delay, --d) stau în
 * src/styles/semnatura-segmente.css, generat de același script.
 */

export interface DateSemnatura {
  viewBox: string;
  latime: number;
  inaltime: number;
  /** Numele grupurilor, în ordine (data-grup). */
  grupuri: string[];
  /** Conținutul <svg>-ului, fără comentarii. */
  interior: string;
}

export function citesteSemnatura(svg: string): DateSemnatura {
  const faraComentarii = svg.replace(/<!--[\s\S]*?-->/g, '');
  const viewBox = faraComentarii.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1]?.trim();
  if (!viewBox) throw new Error('semnatura.svg: lipsește viewBox pe <svg>.');
  const [, , latime, inaltime] = viewBox.split(/[\s,]+/).map(Number);
  if (!latime || !inaltime) throw new Error(`semnatura.svg: viewBox invalid „${viewBox}”.`);
  const interior = faraComentarii.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1]?.replace(/\n\s*/g, '').trim() ?? '';
  const grupuri = [...interior.matchAll(/<g\b[^>]*data-grup="([^"]+)"/g)].map((m) => m[1]!);
  return { viewBox, latime, inaltime, grupuri, interior };
}

export interface IntervalSegment {
  segment: number;
  delay: number;
  d: number;
}

/** Intervalele trăsăturilor din CSS-ul generat (`[data-segment="i"] { --delay: x; --d: y; }`). */
export function citesteIntervale(css: string): IntervalSegment[] {
  return [...css.matchAll(/\[data-segment="(\d+)"\]\s*\{\s*--delay:\s*([\d.e-]+);\s*--d:\s*([\d.e-]+);\s*\}/g)].map(([, s, delay, d]) => ({
    segment: Number(s),
    delay: Number(delay),
    d: Number(d),
  }));
}
