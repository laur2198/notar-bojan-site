import { describe, expect, it } from 'vitest';
import { aplicaBaza, eliminaBaza, normalizeazaBaza } from './url';

describe('normalizeazaBaza', () => {
  it('forma canonică /…/', () => {
    expect(normalizeazaBaza(undefined)).toBe('/');
    expect(normalizeazaBaza('')).toBe('/');
    expect(normalizeazaBaza('/')).toBe('/');
    expect(normalizeazaBaza('notar-bojan-site')).toBe('/notar-bojan-site/');
    expect(normalizeazaBaza('/notar-bojan-site')).toBe('/notar-bojan-site/');
    expect(normalizeazaBaza('/notar-bojan-site/')).toBe('/notar-bojan-site/');
  });
});

describe.each([
  ['/', ''],
  ['/notar-bojan-site/', '/notar-bojan-site'],
])('aplicaBaza / eliminaBaza cu baza %s', (baza, prefix) => {
  it('pagini, ancore, resurse', () => {
    expect(aplicaBaza(baza, '/')).toBe(`${prefix}/`);
    expect(aplicaBaza(baza, '/servicii/')).toBe(`${prefix}/servicii/`);
    expect(aplicaBaza(baza, '/servicii/succesiune/')).toBe(`${prefix}/servicii/succesiune/`);
    expect(aplicaBaza(baza, '/en/appointments/')).toBe(`${prefix}/en/appointments/`);
    expect(aplicaBaza(baza, '/#program')).toBe(`${prefix}/#program`);
    expect(aplicaBaza(baza, '/en/#program')).toBe(`${prefix}/en/#program`);
    expect(aplicaBaza(baza, '/favicon.svg')).toBe(`${prefix}/favicon.svg`);
  });

  it('adresele externe și ancorele simple rămân neschimbate', () => {
    for (const extern of ['https://maps.example.com/x', 'tel:+40268000000', 'mailto:a@b.ro', '#continut', '//cdn.example.com/x']) {
      expect(aplicaBaza(baza, extern)).toBe(extern);
    }
  });

  it('eliminaBaza e inversa lui aplicaBaza', () => {
    for (const cale of ['/', '/servicii/', '/en/faq/', '/404/']) {
      expect(eliminaBaza(baza, aplicaBaza(baza, cale))).toBe(cale);
    }
  });
});

describe('eliminaBaza: cazuri limită', () => {
  it('baza fără slash final și căi fără bază', () => {
    expect(eliminaBaza('/notar-bojan-site/', '/notar-bojan-site')).toBe('/');
    expect(eliminaBaza('/notar-bojan-site/', '/servicii/')).toBe('/servicii/');
  });
});
