import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * gsap.matchMedia e înlocuit cu o dublură care rulează funcția doar dacă interogarea „se
 * potrivește” (controlat de test), exact ca gsap în browser; registerPlugin e urmărit.
 */
const stare = vi.hoisted(() => ({ potrivire: true, interogari: [] as string[], revertari: 0 }));
vi.mock('gsap', () => {
  const gsap = {
    registerPlugin: vi.fn(),
    matchMedia: () => {
      const curatari: Array<() => void> = [];
      return {
        add(interogare: string, fn: () => void | (() => void)) {
          stare.interogari.push(interogare);
          if (stare.potrivire) {
            const c = fn();
            if (c) curatari.push(c);
          }
        },
        revert() {
          stare.revertari++;
          curatari.splice(0).forEach((c) => c());
        },
      };
    },
  };
  return { gsap, default: gsap };
});
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { nume: 'ScrollTrigger' } }));

const { adaugaAnimatie, INTEROGARE_MISCARE, pornesteMiscarea, _reseteaza } = await import('./miscare');

const radacina = () => ({ dataset: {} as Record<string, string> }) as unknown as HTMLElement;

describe('miscare.ts', () => {
  beforeEach(() => {
    _reseteaza();
    stare.potrivire = true;
    stare.interogari = [];
  });

  it('verifică o singură dată, doar „prefers-reduced-motion: no-preference”', () => {
    pornesteMiscarea(radacina());
    pornesteMiscarea(radacina());
    expect(INTEROGARE_MISCARE).toBe('(prefers-reduced-motion: no-preference)');
    expect(stare.interogari).toEqual([INTEROGARE_MISCARE]);
  });

  it('cu mișcare permisă: rulează animațiile înregistrate și marchează <html>', () => {
    const animatie = vi.fn();
    adaugaAnimatie(animatie);
    const r = radacina();
    pornesteMiscarea(r);
    expect(animatie).toHaveBeenCalledOnce();
    expect(animatie.mock.calls[0]![0]).toHaveProperty('ScrollTrigger');
    expect(r.dataset.miscare).toBe('activa');
  });

  it('la reduced-motion: nicio animație nu rulează, <html> nu e marcat', () => {
    stare.potrivire = false;
    const animatie = vi.fn();
    adaugaAnimatie(animatie);
    const r = radacina();
    pornesteMiscarea(r);
    expect(animatie).not.toHaveBeenCalled();
    expect(r.dataset.miscare).toBeUndefined();
  });

  it('la revert (preferința devine „reduce”): curăță animațiile și scoate marcajul', () => {
    const curatare = vi.fn();
    adaugaAnimatie(() => curatare);
    const r = radacina();
    pornesteMiscarea(r).revert();
    expect(curatare).toHaveBeenCalledOnce();
    expect(r.dataset.miscare).toBeUndefined();
  });

  it('gsap și prefers-reduced-motion din JS apar doar în miscare.ts', () => {
    const src = join(import.meta.dirname, '..');
    const fisiere = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? fisiere(p) : /\.(ts|astro|js|mjs)$/.test(n) && !n.endsWith('.test.ts') ? [p] : [];
      });
    // Excepția documentată în CLAUDE.md §3.2: scripturile semnăturii (intro și hero) rulează inline
    // înainte de primul paint (fără GSAP) și își verifică singure preferința de mișcare.
    const exceptii = [join('scripts', 'miscare.ts'), join('scripts', 'intro-semnatura.js'), join('scripts', 'semnatura-hero.js')];
    const abateri = fisiere(src)
      .filter((f) => !exceptii.some((e) => f.endsWith(e)))
      .filter((f) => {
        const text = readFileSync(f, 'utf8');
        return /from ['"]gsap/.test(text) || /matchMedia\([^)]*prefers-reduced-motion/.test(text);
      })
      .map((f) => relative(src, f));
    expect(abateri).toEqual([]);
  });
});
