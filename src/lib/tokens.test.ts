import { describe, expect, it } from 'vitest';
import { culoare, culori, marimePx, numarToken } from './tokens';

describe('culorile din tokens.css', () => {
  it('sunt paleta caldă (V3b): alb/gri cald, maro de brand, un singur roșu de accent', () => {
    expect(Object.keys(culori).sort()).toEqual(
      [
        'c-accent',
        'c-brand',
        'c-brand-300',
        'c-brand-50',
        'c-brand-900',
        'c-ink',
        'c-ink-2',
        'c-line',
        'c-line-dark',
        'c-muted',
        'c-paper',
        'c-paper-2',
        'c-slogan-stins',
      ].sort(),
    );
    expect(culoare('c-paper')).toBe('#FFFFFF');
    expect(culoare('c-ink')).toBe('#1F1E1D');
    expect(culoare('c-brand')).toBe('#4A2E1E');
    expect(culoare('c-brand-900')).toBe('#2A1A10');
    expect(culoare('c-accent')).toBe('#9B1C1C');
  });
});

describe('marimePx', () => {
  it('textul de bază: fix 18 px, 19 px de la 1600 px', () => {
    expect(marimePx('fs-base', 375)).toBe(18);
    expect(marimePx('fs-base', 1440)).toBe(18);
    expect(marimePx('fs-base', 1599)).toBe(18);
    expect(marimePx('fs-base', 1600)).toBe(19);
    expect(marimePx('fs-base', 2560)).toBe(19);
  });

  it('scara titlurilor din V3b (clamp-uri cu vw între plafoane în rem)', () => {
    expect(marimePx('fs-h1', 375)).toBe(24.8); // minimul 1.55rem
    expect(marimePx('fs-h1', 1280)).toBe(33.3); // 2.6vw
    expect(marimePx('fs-h1', 1920)).toBe(41.6); // plafonul 2.6rem
    expect(marimePx('fs-statement', 1280)).toBe(37.1);
    expect(marimePx('fs-statement', 1920)).toBe(46.4);
    expect(marimePx('fs-titlu', 1280)).toBe(28.2);
    expect(marimePx('fs-titlu', 1920)).toBe(36);
    expect(marimePx('fs-h2', 1280)).toBe(24.3);
    expect(marimePx('fs-h3', 1280)).toBe(20.7);
  });

  it('paginile interioare nu ies mai mari decât Acasă: h2 ≤ titlurile ≤ h1 ≤ frazele mari', () => {
    for (const latime of [375, 768, 1280, 1920]) {
      expect(marimePx('fs-h2', latime)).toBeLessThanOrEqual(marimePx('fs-titlu', latime));
      expect(marimePx('fs-titlu', latime)).toBeLessThanOrEqual(marimePx('fs-h1', latime) + 0.1);
      expect(marimePx('fs-h1', latime)).toBeLessThanOrEqual(marimePx('fs-statement', latime) + 1);
    }
  });

  it('niciun text nu scade sub 16 px, în afară de --fs-xs', () => {
    for (const latime of [320, 375, 768, 1280, 1920]) {
      for (const t of ['fs-base', 'fs-sm', 'fs-lg', 'fs-h3', 'fs-h2', 'fs-titlu', 'fs-h1', 'fs-statement']) {
        expect(marimePx(t, latime)).toBeGreaterThanOrEqual(16);
      }
    }
    expect(marimePx('fs-xs', 375)).toBe(14);
  });

  it('max ≤ 2.5 × min pentru textul de bază și titluri (ajung la 200% prin zoom, WCAG 1.4.4)', () => {
    for (const t of ['fs-base', 'fs-h2', 'fs-titlu', 'fs-h1', 'fs-statement']) {
      expect(marimePx(t, 4000)).toBeLessThanOrEqual(2.5 * marimePx(t, 320));
    }
  });

  it('factorul wordmark-ului e un număr pozitiv', () => {
    expect(numarToken('wordmark-k')).toBeGreaterThan(5);
  });
});
