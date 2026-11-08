import { describe, expect, it } from 'vitest';
import { extrageTrasaturi, inlantuie, parseazaTransform } from './extrage-maini.mjs';

const aproape = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6;

describe('extrage-maini', () => {
  it('compune transformările (translate, scale, rotate în jurul unui punct)', () => {
    expect(parseazaTransform('translate(10 20) scale(2)')).toEqual([2, 0, 0, 2, 10, 20]);
    const r = parseazaTransform('rotate(90 10 10)');
    expect(r.map((v) => Math.round(v * 1e6) / 1e6)).toEqual([0, 1, -1, 0, 20, 0]);
  });

  it('aplică transformările grupurilor, ignoră <defs> și moștenește stroke-ul', () => {
    const { trasaturi, avertismente } = extrageTrasaturi(`<svg><defs><path d="M0 0 L 999 999"/></defs>
      <g transform="translate(100 0)" fill="none" stroke="#000"><path d="M0 0 L10 0"/></g></svg>`);
    expect(trasaturi).toHaveLength(1);
    expect(aproape(trasaturi[0][0], [100, 0])).toBe(true);
    expect(aproape(trasaturi[0].at(-1), [110, 0])).toBe(true);
    expect(avertismente).toEqual([]);
  });

  it('avertizează la un contur umplut (fill fără stroke)', () => {
    const { avertismente } = extrageTrasaturi('<svg><path d="M0 0 L10 0 L10 5 Z"/></svg>');
    expect(avertismente.join()).toMatch(/contur umplut/);
  });

  it('înlănțuie bucățile apropiate într-o singură trăsătură, de la stânga la dreapta, indiferent de ordine', () => {
    const bucati = [
      [[60, 0], [100, 0]],
      [[40, 0], [0, 0]], // inversată
      [[40, 0], [60, 0]],
    ];
    const lanturi = inlantuie(bucati);
    expect(lanturi).toHaveLength(1);
    expect(lanturi[0][0]).toEqual([0, 0]);
    expect(lanturi[0].at(-1)).toEqual([100, 0]);
  });

  it('lasă separate bucățile depărtate (stiloul ridicat), ordonate de la stânga la dreapta', () => {
    const lanturi = inlantuie([[[0, 0], [100, 0]], [[300, 0], [400, 0]]]);
    expect(lanturi).toHaveLength(2);
    expect(lanturi[0][0]).toEqual([0, 0]);
    expect(lanturi[1].at(-1)).toEqual([400, 0]);
  });
});
