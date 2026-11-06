/**
 * Culorile din src/styles/tokens.css, citite la build (o singură sursă de adevăr).
 * Folosite unde CSS-ul nu ajunge: `<meta name="theme-color">`, ghidul /stil/.
 */
import tokensCss from '../styles/tokens.css?raw';

export interface CuloareToken {
  hex: string;
  comentariu: string;
}

export const culori: Readonly<Record<string, CuloareToken>> = Object.fromEntries(
  [...tokensCss.matchAll(/--(c-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;\s*(?:\/\*\s*(.*?)\s*\*\/)?/g)].map(
    ([, nume, hex, comentariu]) => [nume, { hex: hex!.toUpperCase(), comentariu: comentariu ?? '' }],
  ),
);

/**
 * Mărimea maximă, în px, a unui token de font (`--fs-h1: clamp(2rem, …, 2.5rem)` → 40), citită din
 * tokens.css; pentru valorile fixe (`1.125rem`), chiar valoarea. 1rem = 16px.
 */
export function marimeMaximaPx(nume: string): number {
  const m = tokensCss.match(new RegExp(`--${nume}:\\s*([^;]+);`));
  if (!m) throw new Error(`Tokenul --${nume} lipsește din src/styles/tokens.css.`);
  const valori = [...m[1]!.matchAll(/([\d.]+)rem/g)].map((v) => Number(v[1]));
  const rem = m[1]!.trim().startsWith('clamp(') ? valori[valori.length - 1]! : valori[0]!;
  return Math.round(rem * 16 * 10) / 10;
}

/** Valoarea hex a unui token de culoare, ex. `culoare('c-wood-800')` → `#4A2E1E`. */
export function culoare(nume: string): string {
  const token = culori[nume];
  if (!token) throw new Error(`Tokenul --${nume} lipsește din src/styles/tokens.css.`);
  return token.hex;
}
