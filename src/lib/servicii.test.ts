import { describe, expect, it } from 'vitest';
import { serviciiVecine, verificaPreturi } from './servicii';

const S = [1, 2, 3, 4, 5, 6, 7, 8].map((ordine) => ({ slug: `s${ordine}`, ordine }));

describe('serviciiVecine', () => {
  it('cele mai apropiate după ordine, fără cel curent, în ordinea obișnuită', () => {
    // pentru ordinea 4: 3 și 5 (distanța 1), apoi 2 (distanța 2, înaintea lui 6)
    expect(serviciiVecine(S, 's4').map((s) => s.slug)).toEqual(['s2', 's3', 's5']);
  });
  it('la margini ia din partea care există', () => {
    expect(serviciiVecine(S, 's1').map((s) => s.slug)).toEqual(['s2', 's3', 's4']);
    expect(serviciiVecine(S, 's8').map((s) => s.slug)).toEqual(['s5', 's6', 's7']);
  });
  it('la egalitate de distanță, cel de dinainte', () => {
    expect(serviciiVecine(S, 's5').map((s) => s.ordine)).toEqual([3, 4, 6]);
  });
  it('slug inexistent sau prea puține servicii', () => {
    expect(serviciiVecine(S, 'nu')).toEqual([]);
    expect(serviciiVecine(S.slice(0, 2), 's1').map((s) => s.slug)).toEqual(['s2']);
  });
});

describe('verificaPreturi', () => {
  it('găsește serviciile fără onorariu și onorariile fără pagină', () => {
    expect(verificaPreturi(['a', 'b', 'c'], ['a', 'c', 'x'])).toEqual({ faraOnorariu: ['b'], faraPagina: ['x'] });
    expect(verificaPreturi(['a'], ['a'])).toEqual({ faraOnorariu: [], faraPagina: [] });
  });
});
