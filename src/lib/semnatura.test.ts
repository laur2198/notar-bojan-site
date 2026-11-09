import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { citesteSemnatura, prefixeazaId } from './semnatura';

const asset = readFileSync(new URL('../assets/semnatura.svg', import.meta.url), 'utf8');
const s = citesteSemnatura(asset);

/** Funcțiile din scriptul livrat (script clasic, fără export), încărcate așa cum rulează în pagină. */
const sursaDezvaluire = readFileSync(new URL('../scripts/dezvaluire-semnatura.js', import.meta.url), 'utf8');
const { semnaturaEasing, semnaturaIntervale, semnaturaLatimi } = new Function(
  `${sursaDezvaluire}; return { semnaturaEasing, semnaturaIntervale, semnaturaLatimi };`,
)() as {
  semnaturaEasing: (t: number) => number;
  semnaturaIntervale: (lungimi: number[]) => [number, number][];
  semnaturaLatimi: (P: number, intervale: [number, number][], latimi: number[]) => number[];
};

describe('semnatura.svg (fișierul manual)', () => {
  it('are viewBox 929 × 181 și linia de dedesubt în interiorul lui', () => {
    expect(s.viewBox).toBe('0 0 929 181');
    expect(s.linieY).toBeGreaterThan(0);
    expect(s.linieY).toBeLessThan(s.inaltime);
  });

  // Numărul de segmente vine din fișier (data-segmente pe <svg>; 64 în versiunea curentă).
  const N = s.segmenteDeclarate ?? s.segmente.length;

  it('are numărul declarat de segmente (data-segmente): câte un clipPath cu rect.wipe și câte un <g data-segment clip-path>', () => {
    expect(s.segmenteDeclarate).toBe(64);
    expect(s.segmente).toHaveLength(N);
    const grupuri = [...s.interior.matchAll(/<g\b[^>]*\sdata-segment="([^"]+)"[^>]*\sclip-path="url\(#([^)]+)\)"/g)];
    expect(grupuri).toHaveLength(N);
    expect(grupuri.map((g) => g[2])).toEqual(s.segmente.map((x) => x.id));
  });

  it('în repaus (fără JS, reduced-motion) fiecare rect are width = data-w', () => {
    const rects = [...s.interior.matchAll(/<rect\b[^>]*class="wipe"[^>]*>/g)].map((m) => m[0]);
    expect(rects).toHaveLength(N);
    for (const r of rects) expect(r.match(/\swidth="([^"]+)"/)?.[1]).toBe(r.match(/\sdata-w="([^"]+)"/)?.[1]);
  });

  it('formele sunt umplute: niciun stroke în fișier', () => {
    expect(s.interior).not.toMatch(/\sstroke=/);
  });
});

describe('dezvăluirea (src/scripts/dezvaluire-semnatura.js)', () => {
  const intervale = semnaturaIntervale(s.segmente.map((x) => x.len));
  const latimi = s.segmente.map((x) => x.w);

  it('intervalele sunt consecutive, proporționale cu data-len, iar suma lor este 1', () => {
    const total = s.segmente.reduce((t, x) => t + x.len, 0);
    let cursor = 0;
    intervale.forEach(([a, b], i) => {
      expect(a).toBeCloseTo(cursor, 10);
      expect(b - a).toBeCloseTo(s.segmente[i]!.len / total, 10);
      cursor = b;
    });
    expect(intervale.reduce((t, [a, b]) => t + (b - a), 0)).toBeCloseTo(1, 10);
    expect(intervale.at(-1)![1]).toBe(1);
  });

  it('P = 0 → toate lățimile 0; P = 1 → toate egale cu data-w', () => {
    expect(semnaturaLatimi(0, intervale, latimi).every((w) => w === 0)).toBe(true);
    expect(semnaturaLatimi(1, intervale, latimi)).toEqual(latimi);
  });

  it('strict secvențial: la jumătatea gestului, segmentele de dinainte sunt complete, cele de după încă la 0', () => {
    const w = semnaturaLatimi(0.5, intervale, latimi);
    intervale.forEach(([a, b], i) => {
      if (b <= 0.5) expect(w[i]).toBe(latimi[i]);
      else if (a >= 0.5) expect(w[i]).toBe(0);
      else expect(w[i]).toBeGreaterThan(0);
    });
  });

  it('easing-ul cubic-bezier(0.77, 0, 0.175, 1): capete fixe, monoton, lent la început și la final', () => {
    expect(semnaturaEasing(0)).toBe(0);
    expect(semnaturaEasing(1)).toBe(1);
    // Referință independentă: curba eșantionată dens, punctul cu x cel mai apropiat de t.
    const bez = (u: number, p1: number, p2: number) => 3 * p1 * u * (1 - u) ** 2 + 3 * p2 * u * u * (1 - u) + u ** 3;
    const referinta = (t: number) => {
      let best = 0;
      for (let i = 0; i <= 100000; i++) if (Math.abs(bez(i / 100000, 0.77, 0.175) - t) < Math.abs(bez(best, 0.77, 0.175) - t)) best = i / 100000;
      return bez(best, 0, 1);
    };
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) expect(semnaturaEasing(t)).toBeCloseTo(referinta(t), 3);
    let prev = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const v = semnaturaEasing(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
    expect(semnaturaEasing(0.1)).toBeLessThan(0.05);
    expect(semnaturaEasing(0.9)).toBeGreaterThan(0.95);
  });
});

describe('prefixeazaId', () => {
  it('două instanțe (intro + hero) nu au id-uri comune, iar referințele urmează id-urile', () => {
    const intro = prefixeazaId(s.interior, 'semnatura-intro-');
    const hero = prefixeazaId(s.interior, 'semnatura-hero-');
    const iduri = (t: string) => [...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    const [a, b] = [iduri(intro), iduri(hero)];
    expect(a).toHaveLength(s.segmente.length);
    expect(new Set([...a, ...b]).size).toBe(2 * s.segmente.length);
    const referinte = [...hero.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
    expect(referinte).toHaveLength(s.segmente.length);
    for (const r of referinte) expect(b).toContain(r);
  });
});
