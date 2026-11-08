import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { citesteSemnatura, ultimulPunct } from './semnatura';

const asset = readFileSync(new URL('../assets/semnatura.svg', import.meta.url), 'utf8');

describe('citesteSemnatura', () => {
  it('citește viewBox-ul și path-ul unic din asset', () => {
    const s = citesteSemnatura(asset);
    expect(s.viewBox).toBe('0 0 747 278');
    expect(s.latime / s.inaltime).toBeCloseTo(2.7, 1);
    expect(s.d.startsWith('M')).toBe(true);
  });

  it('asset-ul păstrează nota de desen provizoriu și nu are fill', () => {
    expect(asset).toContain('Provizoriu. Se înlocuiește cu desenul final (un singur path, același viewBox).');
    expect(asset).toMatch(/fill="none"/);
  });

  it('punctul de accent stă exact pe ultimul punct al path-ului, cu r = 4', () => {
    const s = citesteSemnatura(asset);
    expect({ x: s.capat.x, y: s.capat.y }).toEqual(ultimulPunct(s.d));
    expect(s.capat.r).toBe(4);
  });

  it('ultimulPunct citește capătul comenzii finale absolute', () => {
    expect(ultimulPunct('M 0 0 C 1 2, 3 4, 5 6')).toEqual({ x: 5, y: 6 });
    expect(ultimulPunct('M0,0L10,20Z')).toEqual({ x: 10, y: 20 });
    expect(() => ultimulPunct('M 0 0 c 1 2 3 4 5 6')).toThrow(/absolută/);
  });

  it('refuză un SVG cu mai multe path-uri sau fără viewBox', () => {
    expect(() => citesteSemnatura('<svg viewBox="0 0 10 10"><path d="M0 0"/><path d="M1 1"/><circle cx="1" cy="1" r="4"/></svg>')).toThrow(/exact un <path>/);
    expect(() => citesteSemnatura('<svg><path d="M0 0"/></svg>')).toThrow(/viewBox/);
  });
});
