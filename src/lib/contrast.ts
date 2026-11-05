/**
 * Raportul de contrast WCAG 2.1 între două culori hex (#RGB sau #RRGGBB).
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

function hexInRgb(hex: string): [number, number, number] {
  let cifre = hex.trim().replace(/^#/, '');
  if (cifre.length === 3) cifre = [...cifre].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(cifre)) throw new Error(`Culoare hex invalidă: „${hex}”.`);
  return [0, 2, 4].map((i) => parseInt(cifre.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminanța relativă, conform definiției WCAG. */
export function luminanta(hex: string): number {
  const [r, g, b] = hexInRgb(hex).map((canal) => {
    const s = canal / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Raport de contrast între 1 și 21. */
export function raportContrast(text: string, fundal: string): number {
  const a = luminanta(text);
  const b = luminanta(fundal);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export type Uz = 'text' | 'text-mare' | 'ui' | 'decorativ';

/** Pragul minim WCAG AA pentru uzul declarat. Elementele decorative nu au prag. */
export const PRAG_AA: Record<Uz, number> = {
  text: 4.5,
  'text-mare': 3,
  ui: 3,
  decorativ: 0,
};

export function treceAA(raport: number, uz: Uz): boolean {
  return raport >= PRAG_AA[uz];
}

/** Raportul trunchiat (nu rotunjit) la 2 zecimale: 4.499 nu trebuie afișat ca 4.50. */
export function formateazaRaport(raport: number): string {
  return `${(Math.floor(raport * 100) / 100).toFixed(2)}:1`;
}
