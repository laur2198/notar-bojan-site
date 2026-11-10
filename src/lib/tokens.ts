/**
 * Tokenurile din src/styles/tokens.css, citite la build (o singură sursă de adevăr).
 * Folosite unde CSS-ul nu ajunge: `<meta name="theme-color">`, ghidul /stil/, imaginea OG.
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

/** Valoarea hex a unui token de culoare, ex. `culoare('c-ink')` → `#0F0F0F`. */
export function culoare(nume: string): string {
  const token = culori[nume];
  if (!token) throw new Error(`Tokenul --${nume} lipsește din src/styles/tokens.css.`);
  return token.hex;
}

/* -------------------------------------------------------------------------------------------
 * Mărimile de font, evaluate pentru o lățime de fereastră dată (ghidul /stil/).
 * Tokenurile de font sunt expresii CSS: clamp(), calc(), var(), rem, vw și numere. Le evaluăm
 * aici cu 1rem = 16 px, fără să le copiem: o schimbare în tokens.css se vede direct în /stil/.
 * Blocurile `@media (max-width | min-width: …rem)` din tokens.css suprascriu tokenurile la acele lățimi.
 * ------------------------------------------------------------------------------------------- */

const REM = 16;

/** Declarațiile `--nume: valoare;` dintr-un fragment de CSS (fără comentarii). */
function declaratii(css: string): Map<string, string> {
  const faraComentarii = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return new Map([...faraComentarii.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, n, v]) => [n!, v!.trim()]));
}

/** Blocurile `@media (max-width: …rem)` / `(min-width: …rem)` din tokens.css, cu declarațiile lor. */
interface BlocMedia {
  tip: 'max' | 'min';
  pragPx: number;
  valori: Map<string, string>;
}

const indexPrimMedia = tokensCss.search(/@media\s*\(/);
const baza = declaratii(indexPrimMedia === -1 ? tokensCss : tokensCss.slice(0, indexPrimMedia));
const blocuri: BlocMedia[] = [...tokensCss.matchAll(/@media\s*\((max|min)-width:\s*([\d.]+)rem\)\s*\{([\s\S]*?)\n\}/g)].map(
  ([, tip, prag, corp]) => ({ tip: tip as 'max' | 'min', pragPx: Number(prag) * REM, valori: declaratii(corp!) }),
);

/** Valoarea brută a unui token la lățimea dată (ține cont de blocurile @media, în ordinea din fișier). */
function valoareToken(nume: string, latime: number): string {
  let v = baza.get(nume);
  for (const b of blocuri) {
    const seAplica = b.tip === 'max' ? latime <= b.pragPx : latime >= b.pragPx;
    if (seAplica && b.valori.has(nume)) v = b.valori.get(nume);
  }
  if (v === undefined) throw new Error(`Tokenul --${nume} lipsește din src/styles/tokens.css.`);
  return v;
}

/** Evaluează o expresie de lungime CSS (în px) la lățimea dată a ferestrei. */
function evalueaza(expresie: string, latime: number, adancime = 0): number {
  if (adancime > 10) throw new Error(`Referință circulară în tokens.css: ${expresie}`);
  const js = expresie
    .replace(/var\(--([a-z0-9-]+)\)/g, (_, n: string) => `(${evalueaza(valoareToken(n, latime), latime, adancime + 1)})`)
    .replace(/([\d.]+)rem/g, (_, n: string) => `(${Number(n) * REM})`)
    .replace(/([\d.]+)vw/g, (_, n: string) => `(${(Number(n) * latime) / 100})`)
    .replace(/([\d.]+)px/g, '($1)')
    .replace(/clamp\(/g, 'cl(')
    .replace(/calc\(/g, '(');
  if (!/^[\d\s.+\-*/(),cl]*$/.test(js)) throw new Error(`Expresie de font neevaluabilă: „${expresie}”.`);
  const cl = (min: number, val: number, max: number) => Math.min(Math.max(val, min), max);
  return Function('cl', `return (${js});`)(cl) as number;
}

/** Mărimea în px a unui token de font la lățimea dată, rotunjită la o zecimală. Ex. `marimePx('fs-h1', 1280)`. */
export function marimePx(nume: string, latime: number): number {
  return Math.round(evalueaza(valoareToken(nume, latime), latime) * 10) / 10;
}

/** Un număr fără unitate dintr-un token, ex. `numarToken('wordmark-k')`. */
export function numarToken(nume: string): number {
  const v = Number(valoareToken(nume, Infinity));
  if (!Number.isFinite(v)) throw new Error(`Tokenul --${nume} nu e un număr.`);
  return v;
}
