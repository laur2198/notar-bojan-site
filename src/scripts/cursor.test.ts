import { describe, expect, it } from 'vitest';
import { LERP, lerp } from './cursor';

describe('lerp-ul cursorului', () => {
  it('parcurge 22% din distanța rămasă la fiecare cadru', () => {
    expect(LERP).toBe(0.22);
    expect(lerp(0, 100)).toBeCloseTo(22);
    expect(lerp(22, 100)).toBeCloseTo(39.16);
  });

  it('converge spre țintă (sub 0.1 px în mai puțin de 60 de cadre de la 1000 px)', () => {
    let x = 0;
    let cadre = 0;
    while (Math.abs(1000 - x) > 0.1) {
      x = lerp(x, 1000);
      cadre++;
    }
    expect(cadre).toBeLessThan(60);
  });
});
