import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ariaCurent, caleInAltaLimba, cale, perecheLimbi, routeMap, t, zileSaptamana } from './index';
import { ro } from './ro';

describe('t()', () => {
  it('înlocuiește parametrii', () => {
    expect(t('ro', 'program.inchisAstazi', { motiv: 'Crăciunul' })).toBe('Închis astăzi – Crăciunul');
    expect(t('en', 'subsol.copyright', { an: 2026, denumire: 'X' })).toBe('© 2026 X');
  });

  it('EN are exact cheile din RO, fără texte goale', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort());
    expect(Object.values(en).every((v) => v.trim() !== '')).toBe(true);
  });

  it('textele EN nu conțin diacritice românești', () => {
    expect(Object.values(en).filter((v) => /[ăâîșțĂÂÎȘȚşţ]/.test(v))).toEqual([]);
  });

  it('zilele săptămânii, de luni', () => {
    expect(zileSaptamana('ro')[0]).toBe('luni');
    expect(zileSaptamana('en')[6]).toBe('Sunday');
  });
});

describe('rute', () => {
  it('routeMap conține cele 5 perechi din CLAUDE.md §6', () => {
    expect(routeMap).toEqual({
      '/': '/en/',
      '/servicii/': '/en/services/',
      '/programare/': '/en/appointments/',
      '/intrebari-frecvente/': '/en/faq/',
      '/contact/': '/en/contact/',
    });
  });

  it('comutatorul duce la pagina corespondentă', () => {
    expect(caleInAltaLimba('/programare/')).toEqual({ locale: 'en', href: '/en/appointments/', pereche: true });
    expect(caleInAltaLimba('/en/faq/')).toEqual({ locale: 'ro', href: '/intrebari-frecvente/', pereche: true });
    expect(caleInAltaLimba('/en')).toEqual({ locale: 'ro', href: '/', pereche: true });
  });

  it('pagină fără echivalent EN → /en/', () => {
    expect(caleInAltaLimba('/despre/')).toEqual({ locale: 'en', href: '/en/', pereche: false });
    expect(caleInAltaLimba('/servicii/succesiune/')).toEqual({ locale: 'en', href: '/en/', pereche: false });
  });

  it('perecheLimbi doar pe perechile existente', () => {
    expect(perecheLimbi('/contact/')).toEqual({ ro: '/contact/', en: '/en/contact/' });
    expect(perecheLimbi('/recenzii/')).toBeUndefined();
  });

  it('cale(): confidențialitatea rămâne în română și pe EN', () => {
    expect(cale('confidentialitate', 'en')).toBe('/confidentialitate/');
    expect(cale('servicii', 'en')).toBe('/en/services/');
  });

  it('ariaCurent', () => {
    expect(ariaCurent('/servicii/', '/servicii/')).toBe('page');
    expect(ariaCurent('/servicii/', '/servicii/succesiune/')).toBe('true');
    expect(ariaCurent('/', '/despre/')).toBeUndefined();
    expect(ariaCurent('/en/', '/en/faq/')).toBeUndefined();
  });
});
