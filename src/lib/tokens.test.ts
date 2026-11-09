import { describe, expect, it } from 'vitest';
import { culoare, culori, marimePx, numarToken } from './tokens';

describe('culorile din tokens.css', () => {
  it('sunt paleta monocromă din prototip, fără lemn, bordo sau culori de stare', () => {
    expect(Object.keys(culori).sort()).toEqual(
      ['c-ink', 'c-ink-2', 'c-line', 'c-line-dark', 'c-muted', 'c-muted-dark', 'c-paper', 'c-paper-2'].sort(),
    );
    expect(culoare('c-paper')).toBe('#FFFFFF');
    expect(culoare('c-ink')).toBe('#0F0F0F');
  });
});

describe('marimePx', () => {
  it('textul de bază: 18 px până la 1440 px, apoi 1.25vw, maxim 24 px', () => {
    expect(marimePx('fs-base', 375)).toBe(18);
    expect(marimePx('fs-base', 1440)).toBe(18);
    expect(marimePx('fs-base', 1600)).toBe(20);
    expect(marimePx('fs-base', 1920)).toBe(24);
    expect(marimePx('fs-base', 2560)).toBe(24);
  });

  it('titlurile sunt multipli ai textului de bază, cu plafoanele din prototip', () => {
    expect(marimePx('fs-h1', 1280)).toBe(42.3); // 2.35 × 18
    expect(marimePx('fs-h1', 1920)).toBe(56.4); // 2.35 × 24, sub plafonul de 57.6
    expect(marimePx('fs-statement', 1920)).toBe(73.6); // plafonul 4.6rem
    expect(marimePx('fs-titlu', 1920)).toBe(62.4);
    expect(marimePx('fs-h2', 1920)).toBe(48);
    expect(marimePx('fs-h3', 1280)).toBe(20.7);
  });

  it('sub 768 px, h1 scade la 1.6 × textul de bază (blocul @media din tokens.css)', () => {
    expect(marimePx('fs-h1', 375)).toBe(28.8);
    expect(marimePx('fs-h1', 768)).toBe(42.3);
  });

  it('niciun text nu scade sub 16 px, în afară de --fs-xs', () => {
    for (const latime of [320, 375, 768, 1280, 1920]) {
      for (const t of ['fs-base', 'fs-sm', 'fs-lg', 'fs-h3', 'fs-h2', 'fs-titlu', 'fs-h1', 'fs-statement']) {
        expect(marimePx(t, latime)).toBeGreaterThanOrEqual(16);
      }
    }
    expect(marimePx('fs-xs', 375)).toBe(14);
  });

  it('textul de bază are max ≤ 2.5 × min (ajunge la 200% prin zoom, WCAG 1.4.4)', () => {
    expect(marimePx('fs-base', 4000)).toBeLessThanOrEqual(2.5 * marimePx('fs-base', 320));
  });

  it('factorul wordmark-ului e un număr pozitiv', () => {
    expect(numarToken('wordmark-k')).toBeGreaterThan(5);
  });
});
