import { describe, expect, it } from 'vitest';
import { temaLaY, type ZonaSectiune } from './tema-navbar';

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

  it('la granița exactă câștigă prima secțiune din document', () => {
    expect(temaLaY(100, sectiuni)).toBe('light');
  });

  it('fără secțiune sub linie: null (navbar-ul își păstrează tema)', () => {
    expect(temaLaY(2000, sectiuni)).toBeNull();
    expect(temaLaY(10, [])).toBeNull();
  });
});
