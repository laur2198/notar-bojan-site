import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  adaugaIntervale,
  citesteSemnatura,
  extrageMaini,
  intervaleSemnatura,
  ORDINE_CUVINTE,
  prefixeazaId,
  randeazaSemnatura,
  viewBoxMaini,
  type Interval,
} from './semnatura';
import { deseneazaLaVedere, semnaturaEasing, semnaturaOffseturi } from '../scripts/desen-semnatura';

const asset = readFileSync(new URL('../assets/semnatura.svg', import.meta.url), 'utf8');
const s = citesteSemnatura(asset);
const intervale = intervaleSemnatura(s.trasee);
const total = s.trasee.reduce((t, x) => t + x.len, 0);

/** Indicii trăsăturilor în ordinea desenării: notar → maini → bojan, apoi ordinea din fișier. */
const ordineDesen = s.trasee
  .map((t, i) => ({ t, i }))
  .sort((x, y) => ORDINE_CUVINTE.indexOf(x.t.cuvant) - ORDINE_CUVINTE.indexOf(y.t.cuvant) || x.i - y.i)
  .map(({ i }) => i);

describe('semnatura.svg (fișierul pus de birou)', () => {
  it('are cele trei măști și path-uri .rev cu data-word, pathLength="100" și data-len', () => {
    for (const c of ORDINE_CUVINTE) {
      expect(s.interior).toContain(`<mask id="m-${c}"`);
      expect(s.trasee.some((t) => t.cuvant === c)).toBe(true);
    }
    const rev = [...s.interior.matchAll(/<path\b[^>]*\sclass="rev"[^>]*>/g)].map((m) => m[0]);
    expect(rev).toHaveLength(s.trasee.length);
    for (const p of rev) expect(p).toMatch(/\spathLength="100"/);
  });

  it('literele și mâinile sunt forme umplute cu currentColor, fiecare sub masca ei', () => {
    for (const c of ORDINE_CUVINTE) expect(s.interior).toMatch(new RegExp(`fill="currentColor" mask="url\\(#m-${c}\\)"`));
  });
});

describe('intervalele (ordinea notar → maini → bojan)', () => {
  it('în ordinea desenării: consecutive, proporționale cu data-len, de la 0 la 1; suma = 1', () => {
    let cursor = 0;
    for (const i of ordineDesen) {
      const [a, b] = intervale[i]!;
      expect(a).toBeCloseTo(cursor, 10);
      expect(b - a).toBeCloseTo(s.trasee[i]!.len / total, 10);
      cursor = b;
    }
    expect(intervale[ordineDesen[0]!]![0]).toBe(0);
    expect(intervale[ordineDesen.at(-1)!]![1]).toBe(1);
    expect(intervale.reduce((t, [a, b]) => t + (b - a), 0)).toBeCloseTo(1, 10);
  });

  it('toate trăsăturile „notar” se termină înainte de „maini”, iar „maini” înainte de „bojan”', () => {
    const capete = (c: string) => {
      const iv = intervale.filter((_, i) => s.trasee[i]!.cuvant === c);
      return { start: Math.min(...iv.map(([a]) => a)), sfarsit: Math.max(...iv.map(([, b]) => b)) };
    };
    const [n, m, b] = ORDINE_CUVINTE.map(capete);
    expect(n!.start).toBe(0);
    expect(m!.start).toBeCloseTo(n!.sfarsit, 10);
    expect(b!.start).toBeCloseTo(m!.sfarsit, 10);
    expect(b!.sfarsit).toBe(1);
  });

  it('data-a / data-b ajung pe path-urile .rev, în ordinea din fișier', () => {
    const randat = adaugaIntervale(s.interior, intervale);
    const perechi = [...randat.matchAll(/<path data-a="([^"]+)" data-b="([^"]+)"[^>]*\sclass="rev"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(perechi).toHaveLength(s.trasee.length);
    perechi.forEach(([a, b], i) => {
      expect(a).toBeCloseTo(intervale[i]![0], 5);
      expect(b).toBeCloseTo(intervale[i]![1], 5);
    });
  });
});

describe('două instanțe pe pagină (intro + hero)', () => {
  const iduri = (t: string) => [...t.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  const referinte = (t: string) => [...t.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
  const intro = randeazaSemnatura(asset, 'intro');
  const hero = randeazaSemnatura(asset, 'hero');
  const toate = [intro.intreaga, intro.maini, hero.intreaga, hero.maini];

  it('id-urile măștilor sunt unice pe pagină', () => {
    const lista = toate.flatMap(iduri);
    expect(lista.length).toBe(3 + 1 + 3 + 1);
    expect(new Set(lista).size).toBe(lista.length);
  });

  it('fiecare mask="url(#…)" trimite la o mască din aceeași instanță și același SVG', () => {
    for (const t of toate) {
      const proprii = new Set(iduri(t));
      expect(referinte(t).length).toBeGreaterThan(0);
      for (const r of referinte(t)) expect(proprii.has(r)).toBe(true);
    }
    expect(hero.intreaga).toContain('url(#semnatura-hero-m-notar)');
    expect(hero.maini).toContain('url(#semnatura-hero-mobil-m-maini)');
  });

  it('prefixeazaId: nu atinge altceva decât id-urile și referințele', () => {
    const exemplu = '<mask id="m"/><path mask="url(#m)" d="M1 2"/><use href="#m"/>';
    expect(prefixeazaId(exemplu, 'x-')).toBe('<mask id="x-m"/><path mask="url(#x-m)" d="M1 2"/><use href="#x-m"/>');
  });
});

describe('varianta de mobil (doar mâinile)', () => {
  const maini = extrageMaini(s.interior);

  it('are doar masca mâinilor și grupul lor; intervalele lor acoperă 0 → 1', () => {
    expect(maini).toContain('<mask id="m-maini"');
    expect(maini).not.toMatch(/m-notar|m-bojan/);
    const r = randeazaSemnatura(asset, 'x');
    const perechi = [...r.maini.matchAll(/data-a="([^"]+)" data-b="([^"]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(perechi).toHaveLength(s.trasee.filter((t) => t.cuvant === 'maini').length);
    expect(perechi[0]![0]).toBe(0);
    expect(perechi.at(-1)![1]).toBe(1);
  });

  it('viewBox-ul decupat e în interiorul celui întreg și mai mic decât el', () => {
    const [x, y, w, h] = viewBoxMaini(s.interior).split(' ').map(Number);
    const [X, Y, W, H] = s.viewBox.split(/\s+/).map(Number);
    expect(x).toBeGreaterThanOrEqual(X! - 10);
    expect(y).toBeGreaterThanOrEqual(Y! - 10);
    expect(x! + w!).toBeLessThanOrEqual(X! + W! + 10);
    expect(y! + h!).toBeLessThanOrEqual(Y! + H! + 10);
    expect(w).toBeLessThan(W! / 2);
  });
});

const ab: Interval[] = intervale;

describe('desenul (src/scripts/desen-semnatura.ts)', () => {
  it('P = 0 → nedesenat peste tot (101: fără punctul capătului rotunjit); P = 1 → 0 peste tot', () => {
    expect(semnaturaOffseturi(0, ab).every((o) => o === 101)).toBe(true);
    expect(semnaturaOffseturi(1, ab).every((o) => o === 0)).toBe(true);
  });

  it('dashoffset = 100 · (1 − clamp((P − a) / (b − a))) în interiorul intervalului', () => {
    const [a, b] = ab[ordineDesen[5]!]!;
    const P = (a + b) / 2;
    expect(semnaturaOffseturi(P, ab)[ordineDesen[5]!]).toBeCloseTo(50, 6);
  });

  it('strict secvențial: la jumătatea gestului, trăsăturile de dinainte sunt desenate, cele de după încă nu', () => {
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
    const bez = (u: number, p1: number, p2: number) => 3 * p1 * u * (1 - u) ** 2 + 3 * p2 * u * u * (1 - u) + u ** 3;
    const referinta = (t: number) => {
      let best = 0;
      for (let i = 0; i <= 100000; i++) if (Math.abs(bez(i / 100000, 0.77, 0.175) - t) < Math.abs(bez(best, 0.77, 0.175) - t)) best = i / 100000;
      return bez(best, 0, 1);
    };
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) expect(semnaturaEasing(t)).toBeCloseTo(referinta(t), 3);
  });
});

describe('prefers-reduced-motion: semnătura rămâne desenată (dashoffset 0)', () => {
  /** Un element [data-semnatura] simulat: path-uri cu style, ca în DOM. */
  function element(n: number) {
    const stiluri = Array.from({ length: n }, () => {
      const st: Record<string, string> = {};
      return {
        st,
        style: {
          set strokeDashoffset(v: string) {
            st['stroke-dashoffset'] = v;
          },
          removeProperty: (p: string) => delete st[p],
        },
      };
    });
    const paths = stiluri.map((x, i) => ({ style: x.style, dataset: { a: String(i / n), b: String((i + 1) / n) } }));
    return { el: { querySelectorAll: () => paths } as unknown as Element, stiluri };
  }

  afterEach(() => vi.unstubAllGlobals());

  it('nu ascunde nimic, nu pornește observatorul și nici animația', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
    const observator = vi.fn();
    const raf = vi.fn();
    vi.stubGlobal('IntersectionObserver', observator);
    vi.stubGlobal('requestAnimationFrame', raf);
    const { el, stiluri } = element(4);
    const gata = vi.fn();
    deseneazaLaVedere(el, 3500, gata);
    expect(stiluri.every((x) => x.st['stroke-dashoffset'] === undefined)).toBe(true);
    expect(observator).not.toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
    expect(gata).toHaveBeenCalledOnce();
  });

  it('fără mișcare redusă: ascunsă (101) până intră în ecran', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const observate: Element[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(e: Element) {
          observate.push(e);
        }
        disconnect() {}
      },
    );
    const { el, stiluri } = element(3);
    deseneazaLaVedere(el, 3500);
    expect(observate).toEqual([el]);
    expect(stiluri.every((x) => x.st['stroke-dashoffset'] === '101')).toBe(true);
  });

  it('CSS-ul componentei: starea din HTML e dashoffset 0; starea ascunsă doar sub html.miscare / html.cu-intro', () => {
    const componenta = readFileSync(new URL('../components/Semnatura.astro', import.meta.url), 'utf8');
    expect(componenta).toMatch(/path\[data-a\]\)\s*\{\s*stroke-dasharray: 100 101;\s*stroke-dashoffset: 0;/);
    const hero = readFileSync(new URL('../components/acasa/HeroAcasa.astro', import.meta.url), 'utf8');
    const intro = readFileSync(new URL('../components/IntroSemnatura.astro', import.meta.url), 'utf8');
    for (const [sursa, conditie] of [
      [hero, 'html.miscare:not(.hero-pornit)'],
      [intro, 'html.cu-intro:not(.intro-pornit)'],
    ] as const) {
      const reguli = [...sursa.matchAll(/([^{}]*)\{\s*stroke-dashoffset: 101;/g)].map((m) => m[1]!);
      expect(reguli.length).toBeGreaterThan(0);
      for (const r of reguli) expect(r).toContain(conditie);
    }
  });
});
