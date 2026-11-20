import { describe, expect, it } from 'vitest';
import { CULORI_VIU, MISCARE_SEED, SEEDURI } from './fundal-viu';

describe('fundalul viu: mișcarea per seed', () => {
  it.each(SEEDURI)('seed %i: exact o pată din fiecare culoare (cazul cel mai defavorabil din tokens.test.ts)', (seed) => {
    expect(MISCARE_SEED[seed].map((p) => p.culoare).sort()).toEqual([...CULORI_VIU].sort());
  });

  it.each(SEEDURI)('seed %i: deplasare ±10–15%%, scară 0.9–1.15, cursor ≤ 30 px', (seed) => {
    for (const p of MISCARE_SEED[seed]) {
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
});
