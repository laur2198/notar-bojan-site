import { describe, expect, it } from 'vitest';
import { imparteDenumirea } from './denumire';

describe('imparteDenumirea', () => {
  it('forma juridică sus, numele notarului jos', () => {
    expect(imparteDenumirea('Birou Individual Notarial Bojan Elena Luminița', 'Bojan Elena Luminița')).toEqual({
      sus: 'Birou Individual Notarial',
      jos: 'Bojan Elena Luminița',
    });
  });

  it('dacă denumirea nu se termină cu numele, rămâne întreagă (nu se prescurtează)', () => {
    expect(imparteDenumirea('Altă denumire', 'Bojan Elena Luminița')).toEqual({ sus: '', jos: 'Altă denumire' });
  });
});
