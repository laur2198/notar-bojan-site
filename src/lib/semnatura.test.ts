import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { citesteIntervale, citesteSemnatura } from './semnatura';

const asset = readFileSync(new URL('../assets/semnatura.svg', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles/semnatura-segmente.css', import.meta.url), 'utf8');
const DURATA_HERO = 3.5;
const DURATA_INTRO = 1.8;

describe('semnătura generată (notar · mâini · bojan)', () => {
  const s = citesteSemnatura(asset);
  const trasee = [...s.interior.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);

  it('are exact trei grupuri, în ordine: notar, mâini, bojan', () => {
    expect(s.grupuri).toEqual(['notar', 'maini', 'bojan']);
    expect(s.latime / s.inaltime).toBeGreaterThan(4);
  });

  it('toate path-urile au pathLength="100" și un data-segment unic, în ordine', () => {
    expect(trasee.length).toBeGreaterThan(3);
    for (const p of trasee) expect(p).toMatch(/\spathLength="100"/);
    expect(trasee.map((p) => Number(p.match(/data-segment="(\d+)"/)?.[1]))).toEqual(trasee.map((_, i) => i));
  });

  it('mâinile sunt un singur path, iar comentariul de provizoriu e în SVG', () => {
    expect(s.interior.match(/<g data-grup="maini">([\s\S]*?)<\/g>/)?.[1]?.match(/<path\b/g)).toHaveLength(1);
    expect(asset).toContain('Mâinile – provizoriu, se pot înlocui cu un desen manual (un path, același viewBox).');
  });

  it('intervalele sunt secvențiale, fără suprapunere, și însumează durata totală', () => {
    const intervale = citesteIntervale(css);
    expect(intervale.map((i) => i.segment)).toEqual(trasee.map((_, i) => i));
    let cursor = 0;
    for (const i of intervale) {
      expect(i.delay).toBeCloseTo(cursor, 5);
      expect(i.d).toBeGreaterThan(0);
      cursor = i.delay + i.d;
    }
    const suma = intervale.reduce((t, i) => t + i.d, 0);
    expect(suma).toBeCloseTo(1, 5);
    expect(suma * DURATA_HERO).toBeCloseTo(DURATA_HERO, 4);
    expect(suma * DURATA_INTRO).toBeCloseTo(DURATA_INTRO, 4);
  });

  it('punctul de accent (r = 4) stă pe ultimul punct al ultimei trăsături', () => {
    const ultimul = trasee.at(-1)!.match(/\sd="([^"]+)"/)![1]!.trim().split(/[\s,]+/).slice(-2).map(Number);
    const cerc = s.interior.match(/<circle\b[^>]*>/)![0];
    const atr = (n: string) => Number(cerc.match(new RegExp(`\\s${n}="([^"]+)"`))![1]);
    expect([atr('cx'), atr('cy')]).toEqual(ultimul);
    expect(atr('r')).toBe(4);
  });
});
