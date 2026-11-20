import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CULORI_VIU, distantaMinima, inaltimeMinima, marimePata, PRAG_MOBIL_PX, SEED, SEEDURI } from './fundal-viu';

/** Toate lățimile de fereastră, din 4 în 4 px, de la cel mai mic telefon la 4K. */
const LATIMI = Array.from({ length: (3840 - 320) / 4 + 1 }, (_, i) => 320 + i * 4);

describe('fundalul viu: geometria per seed', () => {
  it.each(SEEDURI)('seed %i: exact o pată din fiecare culoare', (seed) => {
    expect(SEED[seed].map((p) => p.culoare).sort()).toEqual([...CULORI_VIU].sort());
  });

  /*
   * Garanția din spatele contrastului (tokens.test.ts): zonele colorate a două pete nu se ating
   * la nicio lățime de 320–3840 px, în niciun moment al derulării (t = 0…1 în 200 de pași; poziția
   * e liniară în t), la nicio înălțime a secțiunii ≥ minimul ei și la nicio poziție a cursorului.
   * Deci în orice punct contează cel mult o pată.
   */
  it.each(SEEDURI)('seed %i: zonele colorate nu se ating niciodată (distanța liberă minimă > 0)', (seed) => {
    const { distanta, unde } = distantaMinima(seed, LATIMI, true, 200);
    expect(distanta, unde).toBeGreaterThan(0);
  });

  it('modelul e sensibil: două pete puse în același loc pică', () => {
    const [a, b] = SEED[2];
    const salvat = { x: b!.x, y: b!.y };
    b!.x = a!.x;
    b!.y = a!.y;
    try {
      expect(distantaMinima(2, [390, 1440], true, 20).distanta).toBeLessThan(0);
    } finally {
      Object.assign(b!, salvat);
    }
  });

  it.each(SEEDURI)('seed %i: deplasare ±10–15%%, scară 0.9–1.15, cursor ≤ 30 px', (seed) => {
    for (const p of SEED[seed]) {
      for (const d of [p.dx, p.dy]) {
        expect(Math.abs(d)).toBeGreaterThanOrEqual(10);
        expect(Math.abs(d)).toBeLessThanOrEqual(15);
      }
      for (const s of [p.s0, p.s1]) {
        expect(s).toBeGreaterThanOrEqual(0.9);
        expect(s).toBeLessThanOrEqual(1.15);
      }
      expect(p.cursor).toBeGreaterThan(0);
      expect(p.cursor).toBeLessThanOrEqual(30);
    }
  });

  it.each(SEEDURI)('seed %i: mărimi 40–70vw până la plafon; plafonul ≥ 32rem', (seed) => {
    for (const p of SEED[seed]) {
      expect(p.d).toBeGreaterThanOrEqual(40);
      expect(p.dMobil).toBeLessThanOrEqual(70);
      expect(p.dMax).toBeGreaterThanOrEqual(32);
      // La 768 px, pata are cel puțin 40vw (plafonul nu taie încă).
      expect(marimePata(p, PRAG_MOBIL_PX)).toBeCloseTo((p.d * PRAG_MOBIL_PX) / 100, 5);
    }
  });

  it('înălțimea minimă: hero ≥ lățimea sub 992 px, ≥ 0.4 × lățimea peste; 2–4: 500 px; capul paginilor: 26rem', () => {
    expect(inaltimeMinima(1, 390)).toBe(390);
    expect(inaltimeMinima(1, 1440)).toBe(576);
    expect(inaltimeMinima(3, 3840)).toBe(500);
    expect(inaltimeMinima(5, 320)).toBe(416);
  });
});

describe('FundalViu.astro: CSS-ul e copia exactă a tabelului SEED', () => {
  const css = readFileSync(new URL('../components/FundalViu.astro', import.meta.url), 'utf8');
  const reguli = [
    ...css.matchAll(
      /\.viu--seed-(\d) \.viu__pata:nth-child\((\d)\) \{ --x: (\d+)%; --y: (\d+)%; --d: min\((\d+)vw, (\d+)rem\); --d-mobil: min\((\d+)vw, (\d+)rem\); \}/g,
    ),
  ].map((m) => m.slice(1).map(Number));

  it('o regulă pentru fiecare pată din fiecare seed', () => {
    expect(reguli).toHaveLength(SEEDURI.length * 3);
  });

  it.each(SEEDURI)('seed %i: poziții, mărimi și plafoane identice', (seed) => {
    SEED[seed].forEach((p, i) => {
      const r = reguli.find(([s, n]) => s === seed && n === i + 1);
      expect(r, `lipsește regula pentru seed ${seed}, pata ${i + 1}`).toBeDefined();
      expect(r).toEqual([seed, i + 1, p.x, p.y, p.d, p.dMax, p.dMobil, p.dMax]);
    });
  });

  it('raza colorată din model (35% din latură) corespunde gradientului: closest-side, transparent la 70%', () => {
    expect(css).toMatch(/radial-gradient\(\s*closest-side,[\s\S]*?0%,\s*transparent 70%\s*\)/);
  });
});
