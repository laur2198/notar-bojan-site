import { describe, expect, it } from 'vitest';
import { esteDerulat, PRAG_DERULARE, temaLaY, type ZonaSectiune } from './tema-navbar';

const sectiuni: ZonaSectiune[] = [
  { top: -800, bottom: 100, tema: 'light' },
  { top: 100, bottom: 900, tema: 'dark' },
  { top: 900, bottom: 1600, tema: 'light' },
];

describe('temaLaY', () => {
  it('ia secțiunea care conține linia de la jumătatea navbar-ului', () => {
    expect(temaLaY(36, sectiuni)).toBe('light');
    expect(temaLaY(150, sectiuni)).toBe('dark');
  });

  it('la granița exactă câștigă secțiunea care începe acolo', () => {
    expect(temaLaY(100, sectiuni)).toBe('dark');
  });

  it('secțiunile imbricate: câștigă cea mai interioară (ultima în document)', () => {
    const imbricate: ZonaSectiune[] = [
      { top: -500, bottom: 3000, tema: 'light' }, // <main>
      { top: 0, bottom: 600, tema: 'dark' }, // hero
      { top: 600, bottom: 1400, tema: 'light' },
    ];
    expect(temaLaY(36, imbricate)).toBe('dark');
    expect(temaLaY(36, [imbricate[0]!, { top: 200, bottom: 600, tema: 'dark' }])).toBe('light');
  });

  it('fără secțiune sub linie: null (navbar-ul își păstrează tema)', () => {
    expect(temaLaY(2000, sectiuni)).toBeNull();
    expect(temaLaY(10, [])).toBeNull();
  });
});

describe('esteDerulat (fundalul navbar-ului sub prag)', () => {
  it('fundal plin doar peste 8 px de derulare; la 0, transparent', () => {
    expect(PRAG_DERULARE).toBe(8);
    expect(esteDerulat(0)).toBe(false);
    expect(esteDerulat(8)).toBe(false);
    expect(esteDerulat(9)).toBe(true);
    expect(esteDerulat(2400)).toBe(true);
  });
});
