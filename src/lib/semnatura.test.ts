import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { citesteSemnatura } from './semnatura';

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

  it('refuză un SVG cu mai multe path-uri sau fără viewBox', () => {
    expect(() => citesteSemnatura('<svg viewBox="0 0 10 10"><path d="M0 0"/><path d="M1 1"/></svg>')).toThrow(/exact un <path>/);
    expect(() => citesteSemnatura('<svg><path d="M0 0"/></svg>')).toThrow(/viewBox/);
  });
});
