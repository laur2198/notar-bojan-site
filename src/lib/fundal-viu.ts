/**
 * Fundalul viu (FundalViu.astro; CLAUDE.md §5): culorile și opacitățile petelor, citite din
 * tokens.css (--viu-*), și culoarea compusă în cazul cel mai defavorabil pentru textul de deasupra.
 *
 * Fiecare instanță are exact 3 pete, câte una din fiecare culoare. O pată e un radial-gradient de la
 * culoarea ei, la opacitatea intensității, până la transparent: cel mai saturat punct posibil e
 * acolo unde toate trei se suprapun cu centrul lor, ceea ce acoperă orice poziție, scalare sau
 * deplasare (scroll, cursor). Acel punct se compune peste fundalul secțiunii, în ordinea cea mai
 * defavorabilă; granulația (6%) se adaugă la verificare (contrastCuGranulatie).
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

const permutari = <T,>(lista: readonly T[]): T[][] =>
  lista.length <= 1 ? [[...lista]] : lista.flatMap((x, i) => permutari([...lista.slice(0, i), ...lista.slice(i + 1)]).map((p) => [x, ...p]));

/** Culoarea cea mai închisă la care pot ajunge cele trei pete suprapuse peste `fundal` (hex). */
export function compusMaxim(intensitate: Intensitate, fundal: string): string {
  const pete = CULORI_VIU.map((c) => pata(c, intensitate));
  const variante = permutari(pete).map((ordine) => ordine.reduce((acc, p) => amesteca(acc, p.hex, p.alfa), fundal.toUpperCase()));
  return variante.reduce((cea, v) => (luminanta(v) < luminanta(cea) ? v : cea));
}

/* -------------------------------------------------------------------------------------------
 * Mișcarea petelor, per `seed` (FundalViu.astro scrie valorile în data-atribute; le folosește
 * src/scripts/miscare.ts). Pozițiile și mărimile sunt în CSS-ul componentei (CSP: fără style="").
 *   dx, dy  deplasarea, în procente din mărimea petei: −d → +d cât secțiunea traversează ecranul;
 *   s0, s1  scara la începutul și la sfârșitul traversării;
 *   cursor  amplitudinea deplasării după cursor, în px (doar pe hero, pointer fin).
 * ------------------------------------------------------------------------------------------- */

export const SEEDURI = [1, 2, 3, 4] as const;
export type Seed = (typeof SEEDURI)[number];

export interface MiscarePata {
  culoare: CuloareViu;
  dx: number;
  dy: number;
  s0: number;
  s1: number;
  cursor: number;
}

export const MISCARE_SEED: Record<Seed, MiscarePata[]> = {
  1: [
    { culoare: 'rosu', dx: -12, dy: 14, s0: 0.92, s1: 1.12, cursor: 26 },
    { culoare: 'piersica', dx: 14, dy: -10, s0: 1.1, s1: 0.92, cursor: 18 },
    { culoare: 'auriu', dx: -10, dy: -15, s0: 0.95, s1: 1.15, cursor: 30 },
  ],
  2: [
    { culoare: 'piersica', dx: -14, dy: 12, s0: 0.95, s1: 1.12, cursor: 20 },
    { culoare: 'auriu', dx: 12, dy: 10, s0: 1.08, s1: 0.9, cursor: 24 },
    { culoare: 'rosu', dx: -10, dy: -14, s0: 0.9, s1: 1.1, cursor: 28 },
  ],
  3: [
    { culoare: 'auriu', dx: 13, dy: 12, s0: 0.92, s1: 1.1, cursor: 22 },
    { culoare: 'rosu', dx: -12, dy: -10, s0: 1.12, s1: 0.94, cursor: 26 },
    { culoare: 'piersica', dx: 10, dy: -14, s0: 0.95, s1: 1.15, cursor: 18 },
  ],
  4: [
    { culoare: 'rosu', dx: 12, dy: 14, s0: 0.94, s1: 1.12, cursor: 24 },
    { culoare: 'piersica', dx: -14, dy: 10, s0: 1.1, s1: 0.9, cursor: 20 },
    { culoare: 'auriu', dx: 10, dy: -12, s0: 0.92, s1: 1.1, cursor: 28 },
  ],
};
