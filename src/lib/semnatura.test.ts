import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adaugaIntervale, citesteSemnatura, prefixeazaId } from './semnatura';
import { intervaleStroke } from './semnatura-stroke';
import { semnaturaEasing, semnaturaOffseturi } from '../scripts/desen-semnatura';

const asset = readFileSync(new URL('../assets/semnatura.svg', import.meta.url), 'utf8');
const s = citesteSemnatura(asset);
/** Numărul de path-uri, din fișier (data-segmente pe <svg>). */
const N = Number(asset.match(/<svg\b[^>]*\sdata-segmente="(\d+)"/)![1]);

const intervale = intervaleStroke(s.lungimi);
const ab = intervale.map((i, k): [number, number] => [i.delay, k === intervale.length - 1 ? 1 : i.delay + i.d]);

describe('semnatura.svg (fișierul manual)', () => {
  it('are data-segmente path-uri, toate cu pathLength="100" și data-len', () => {
    expect(s.segmenteDeclarate).toBe(N);
    const trasee = [...s.interior.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
    expect(trasee).toHaveLength(N);
    for (const p of trasee) {
      expect(p).toMatch(/\spathLength="100"/);
      expect(Number(p.match(/\sdata-len="([^"]+)"/)?.[1])).toBeGreaterThan(0);
    }
  });

  it('e o linie (stroke), nu forme umplute: fill="none" pe <svg>, fără clipPath', () => {
    expect(asset).toMatch(/<svg\b[^>]*\sfill="none"/);
    expect(s.interior).not.toMatch(/<clipPath|\sfill="(?!none)/);
  });

  it('linia de dedesubt (data-linie-y) e în interiorul viewBox-ului', () => {
    expect(s.linieY).toBeGreaterThan(0);
    expect(s.linieY).toBeLessThan(s.inaltime);
  });
});

describe('intervalele (src/lib/semnatura-stroke.ts) și path-urile randate', () => {
  it('sunt consecutive, proporționale cu data-len, iar suma lor este 1', () => {
    const total = s.lungimi.reduce((t, l) => t + l, 0);
    let cursor = 0;
    intervale.forEach((i, k) => {
      expect(i.delay).toBeCloseTo(cursor, 10);
      expect(i.d).toBeCloseTo(s.lungimi[k]! / total, 10);
      cursor = i.delay + i.d;
    });
    expect(intervale.reduce((t, i) => t + i.d, 0)).toBeCloseTo(1, 10);
  });

  it('fiecare path primește data-a / data-b, ultimul se termină la 1', () => {
    const randat = adaugaIntervale(s.interior, intervale);
    const perechi = [...randat.matchAll(/<path\b[^>]*\sdata-a="([^"]+)" data-b="([^"]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(perechi).toHaveLength(N);
    expect(perechi[0]![0]).toBe(0);
    expect(perechi.at(-1)![1]).toBe(1);
    for (let k = 1; k < perechi.length; k++) expect(perechi[k]![0]).toBeCloseTo(perechi[k - 1]![1], 5);
  });
});

describe('desenul (src/scripts/desen-semnatura.ts)', () => {
  it('P = 0 → nedesenat peste tot (101: fără punctul capătului rotunjit); P = 1 → 0 peste tot', () => {
    expect(semnaturaOffseturi(0, ab).every((o) => o === 101)).toBe(true);
    expect(semnaturaOffseturi(1, ab).every((o) => o === 0)).toBe(true);
  });

  it('strict secvențial: la jumătatea gestului, path-urile de dinainte sunt desenate, cele de după încă nu', () => {
    const o = semnaturaOffseturi(0.5, ab);
    ab.forEach(([a, b], i) => {
      if (b <= 0.5) expect(o[i]).toBe(0);
      else if (a >= 0.5) expect(o[i]).toBe(101);
      else {
        expect(o[i]).toBeGreaterThan(0);
        expect(o[i]).toBeLessThan(100);
      }
    });
  });

  it('easing-ul cubic-bezier(0.77, 0, 0.175, 1): capete fixe, monoton, corect față de o referință', () => {
    expect(semnaturaEasing(0)).toBe(0);
    expect(semnaturaEasing(1)).toBe(1);
    let prev = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const v = semnaturaEasing(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
    // Referință independentă: curba eșantionată dens, punctul cu x cel mai apropiat de t.
    const bez = (u: number, p1: number, p2: number) => 3 * p1 * u * (1 - u) ** 2 + 3 * p2 * u * u * (1 - u) + u ** 3;
    const referinta = (t: number) => {
      let best = 0;
      for (let i = 0; i <= 100000; i++) if (Math.abs(bez(i / 100000, 0.77, 0.175) - t) < Math.abs(bez(best, 0.77, 0.175) - t)) best = i / 100000;
      return bez(best, 0, 1);
    };
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) expect(semnaturaEasing(t)).toBeCloseTo(referinta(t), 3);
  });
});

describe('prefixeazaId', () => {
  it('două instanțe (intro + hero) nu au id-uri comune, iar referințele urmează id-urile', () => {
    const exemplu = '<defs><linearGradient id="g"/></defs><path id="p" stroke="url(#g)"/><use href="#p"/>';
    const intro = prefixeazaId(exemplu, 'semnatura-intro-');
    const hero = prefixeazaId(exemplu, 'semnatura-hero-');
    const iduri = (t: string) => [...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    expect(new Set([...iduri(intro), ...iduri(hero)]).size).toBe(4);
    expect(hero).toContain('url(#semnatura-hero-g)');
    expect(hero).toContain('href="#semnatura-hero-p"');
    // Fișierul curent nu are id-uri; prefixarea nu le inventează.
    expect(iduri(prefixeazaId(s.interior, 'x-'))).toEqual(iduri(s.interior).map((i) => `x-${i}`));
  });
});

describe('prototipul (docs/design-v2/prototip-acasa.html)', () => {
  it('are aceeași semnătură și aceleași intervale data-a / data-b ca cele calculate la build', () => {
    const prototip = readFileSync(new URL('../../docs/design-v2/prototip-acasa.html', import.meta.url), 'utf8');
    const svg = prototip.match(/<div class="hero__semn">(<svg[\s\S]*?<\/svg>)/)![1]!;
    const dinPrototip = [...svg.matchAll(/<path\b[^>]*\sdata-a="([^"]+)" data-b="([^"]+)"[^>]*\sd="([^"]+)"/g)];
    const dinAsset = [...s.interior.matchAll(/<path\b[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
    expect(dinPrototip.map((m) => m[3])).toEqual(dinAsset);
    dinPrototip.forEach((m, k) => {
      expect(Number(m[1])).toBeCloseTo(ab[k]![0], 4);
      expect(Number(m[2])).toBeCloseTo(ab[k]![1], 4);
    });
  });
});
