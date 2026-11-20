/**
 * Fundalul viu (FundalViu.astro; CLAUDE.md §5): culorile și opacitățile petelor, citite din
 * tokens.css (--viu-*), geometria lor per seed și verificările de contrast.
 *
 * Fiecare instanță are exact 3 pete, câte una din fiecare culoare. O pată e un radial-gradient de la
 * culoarea ei, la opacitatea intensității (în centru), până la transparent la 70% din rază.
 * Geometria (distantaMinima, testată la toate lățimile, toate momentele derulării, orice înălțime
 * ≥ minimul secțiunii și orice poziție a cursorului) garantează că zonele colorate a două pete nu
 * se ating niciodată: în orice punct contează cel mult o pată. Cel mai saturat punct posibil e deci
 * centrul unei singure pete (compusMaxim), compus peste fundalul secțiunii; granulația (6%) se
 * adaugă la verificare (contrastCuGranulatie).
 */
import { amesteca, luminanta } from './contrast';
import { hexToken, numarToken } from './tokens';

export const CULORI_VIU = ['rosu', 'piersica', 'auriu'] as const;
export type CuloareViu = (typeof CULORI_VIU)[number];
export const INTENSITATI = ['puternic', 'discret'] as const;
export type Intensitate = (typeof INTENSITATI)[number];

/** Culoarea și opacitatea maximă (în centru) a unei pete. */
export function pata(culoare: CuloareViu, intensitate: Intensitate): { hex: string; alfa: number } {
  return { hex: hexToken(`viu-culoare-${culoare}`), alfa: numarToken(`viu-${intensitate}-${culoare}`) };
}

/** Centrul unei singure pete peste `fundal` (hex): culoarea ei la opacitatea maximă. */
export function compusPata(culoare: CuloareViu, intensitate: Intensitate, fundal: string): string {
  const { hex, alfa } = pata(culoare, intensitate);
  return amesteca(fundal.toUpperCase(), hex, alfa);
}

/**
 * Culoarea cea mai închisă a fundalului viu peste `fundal`: centrul petei celei mai închise
 * (petele nu se suprapun, vezi distantaMinima).
 */
export function compusMaxim(intensitate: Intensitate, fundal: string): string {
  return CULORI_VIU.map((c) => compusPata(c, intensitate, fundal)).reduce((cea, v) => (luminanta(v) < luminanta(cea) ? v : cea));
}

/* -------------------------------------------------------------------------------------------
 * Geometria și mișcarea petelor, per `seed`. FundalViu.astro scrie pozițiile și mărimile în CSS
 * (CSP: fără style="", deci în regulile .viu--seed-N; testul verifică că CSS-ul și tabelul de aici
 * coincid) și mișcarea în data-atribute (le folosește src/scripts/miscare.ts).
 *   x, y     centrul petei, în % din lățimea / înălțimea secțiunii;
 *   d        mărimea (latura pătratului), în vw, de la 768 px; dMobil sub 768 px; ambele plafonate
 *            la dMax rem (pe ecrane foarte late, secțiunile scunde nu ar mai încăpea trei pete);
 *   dx, dy   deplasarea, în % din mărimea petei: −d → +d cât secțiunea traversează ecranul;
 *   s0, s1   scara la începutul și la sfârșitul traversării;
 *   cursor   amplitudinea deplasării după cursor, în px (doar cu prop-ul `cursor`, pointer fin).
 * ------------------------------------------------------------------------------------------- */

export const SEEDURI = [1, 2, 3, 4] as const;
export type Seed = (typeof SEEDURI)[number];

export interface PataSeed {
  culoare: CuloareViu;
  x: number;
  y: number;
  d: number;
  dMobil: number;
  dMax: number;
  dx: number;
  dy: number;
  s0: number;
  s1: number;
  cursor: number;
}

/** Pragul de la care se folosește `d` în loc de `dMobil` (48rem, ca în CSS). */
export const PRAG_MOBIL_PX = 768;
/** Pragul layout-ului pe două coloane al hero-ului (62rem). */
const PRAG_HERO_PX = 992;
const REM_PX = 16;

export const SEED: Record<Seed, PataSeed[]> = {
  1: [
    { culoare: 'rosu', x: 94, y: 8, d: 46, dMobil: 62, dMax: 34, dx: -12, dy: 10, s0: 0.92, s1: 1.1, cursor: 26 },
    { culoare: 'piersica', x: 6, y: 31, d: 50, dMobil: 66, dMax: 38, dx: 12, dy: -10, s0: 1.08, s1: 0.92, cursor: 18 },
    { culoare: 'auriu', x: 58, y: 92, d: 44, dMobil: 60, dMax: 34, dx: -10, dy: -12, s0: 0.95, s1: 1.12, cursor: 30 },
  ],
  2: [
    { culoare: 'piersica', x: 94, y: 8, d: 48, dMobil: 64, dMax: 36, dx: -12, dy: 10, s0: 0.95, s1: 1.1, cursor: 20 },
    { culoare: 'auriu', x: 6, y: 8, d: 46, dMobil: 62, dMax: 34, dx: 10, dy: 10, s0: 1.08, s1: 0.92, cursor: 24 },
    { culoare: 'rosu', x: 51, y: 92, d: 42, dMobil: 58, dMax: 32, dx: -10, dy: -12, s0: 0.92, s1: 1.08, cursor: 28 },
  ],
  3: [
    { culoare: 'auriu', x: 6, y: 84, d: 46, dMobil: 62, dMax: 34, dx: 12, dy: 10, s0: 0.92, s1: 1.08, cursor: 22 },
    { culoare: 'rosu', x: 94, y: 92, d: 42, dMobil: 58, dMax: 32, dx: -12, dy: -10, s0: 1.1, s1: 0.94, cursor: 26 },
    { culoare: 'piersica', x: 59, y: 8, d: 48, dMobil: 64, dMax: 36, dx: 10, dy: -12, s0: 0.95, s1: 1.12, cursor: 18 },
  ],
  4: [
    { culoare: 'rosu', x: 8, y: 92, d: 42, dMobil: 58, dMax: 32, dx: 12, dy: 10, s0: 0.94, s1: 1.1, cursor: 24 },
    { culoare: 'piersica', x: 94, y: 70, d: 48, dMobil: 64, dMax: 36, dx: -12, dy: 10, s0: 1.08, s1: 0.92, cursor: 20 },
    { culoare: 'auriu', x: 40, y: 8, d: 44, dMobil: 60, dMax: 34, dx: 10, dy: -12, s0: 0.92, s1: 1.1, cursor: 28 },
  ],
};

/**
 * Înălțimea minimă (px) a unei secțiuni care poartă seed-ul, la lățimea dată: geometria e
 * garantată doar de la ea în sus. Seed 1 e al hero-ului (min-height 100svh): sub 992 px conținutul
 * e pe o coloană (≥ lățimea), de la 992 px cel puțin 0.4 × lățimea (ecrane până la 21:9).
 * Seed-urile 2–4 (secțiuni cu text): 500 px, independent de lățime și de câte elemente are CMS-ul.
 * scripts/e2e/acasa.test.mjs verifică pe pagina reală că secțiunile respectă minimul.
 */
export function inaltimeMinima(seed: Seed, latime: number): number {
  if (seed === 1) return latime < PRAG_HERO_PX ? latime : 0.4 * latime;
  return 500;
}

/** Mărimea petei în px, la lățimea ferestrei dată (ca în CSS: min(d vw, dMax rem)). */
export function marimePata(p: PataSeed, latimeFereastra: number): number {
  const vw = latimeFereastra < PRAG_MOBIL_PX ? p.dMobil : p.d;
  return Math.min((vw * latimeFereastra) / 100, p.dMax * REM_PX);
}

/** Raza colorată a unui radial-gradient(closest-side, …, transparent 70%) pe un pătrat de latură d. */
export const RAZA_COLORATA = 0.35;
/** Bara de derulare: secțiunea poate fi cu până la atâția px mai îngustă decât fereastra (vw). */
const BARA_DERULARE_PX = 20;

/**
 * Cea mai mică distanță liberă (px) dintre zonele colorate a două pete ale unui seed, pentru toate
 * lățimile de fereastră date, toate momentele derulării (t = 0…1, aceeași valoare pentru toate
 * petele secțiunii), orice înălțime ≥ inaltimeMinima și orice poziție a cursorului (dacă `cuCursor`).
 * Pozitivă = zonele nu se ating niciodată, deci în orice punct contează cel mult o pată.
 */
export function distantaMinima(seed: Seed, latimi: readonly number[], cuCursor = true, pasiT = 200): { distanta: number; unde: string } {
  const pete = SEED[seed];
  let distanta = Infinity;
  let unde = '';
  for (const latimeFereastra of latimi) {
    const W = latimeFereastra - BARA_DERULARE_PX;
    const Hmin = inaltimeMinima(seed, latimeFereastra);
    const d = pete.map((p) => marimePata(p, latimeFereastra));
    for (let k = 0; k <= pasiT; k++) {
      const t = k / pasiT;
      const lerp = (a: number, b: number) => a + (b - a) * t;
      for (let i = 0; i < pete.length; i++) {
        for (let j = i + 1; j < pete.length; j++) {
          const a = pete[i]!;
          const b = pete[j]!;
          const sa = lerp(a.s0, a.s1);
          const sb = lerp(b.s0, b.s1);
          // Centrele: poziția din CSS + deplasarea de scroll (xPercent / yPercent din mărime).
          const ox = (a.x / 100) * W + (lerp(-a.dx, a.dx) / 100) * d[i]! - ((b.x / 100) * W + (lerp(-b.dx, b.dx) / 100) * d[j]!);
          const c = (lerp(-a.dy, a.dy) / 100) * d[i]! - (lerp(-b.dy, b.dy) / 100) * d[j]!;
          const ky = (a.y - b.y) / 100;
          // Componenta verticală: |ky·H + c|, minimul pe H ≥ Hmin (0 dacă se poate anula acolo).
          const hZero = ky === 0 ? -Infinity : -c / ky;
          const oy = hZero >= Hmin ? 0 : Math.abs(ky * Hmin + c);
          // Cursorul mută stratul interior (scalat cu pata), în aceeași direcție pentru toate petele.
          const cursor = cuCursor ? Math.SQRT2 * Math.abs(a.cursor * sa - b.cursor * sb) : 0;
          const libera = Math.hypot(ox, oy) - RAZA_COLORATA * (d[i]! * sa + d[j]! * sb) - cursor;
          if (libera < distanta) {
            distanta = libera;
            unde = `fereastra ${latimeFereastra}px, t=${t.toFixed(3)}, ${a.culoare}–${b.culoare}`;
          }
        }
      }
    }
  }
  return { distanta, unde };
}
