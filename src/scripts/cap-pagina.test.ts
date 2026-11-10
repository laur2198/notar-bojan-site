import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * src/scripts/cap-pagina.js e un script clasic (fără export), servit ca atare în <head>.
 * Îl rulăm cu un mediu de browser simulat: <html>, matchMedia, sessionStorage, location, setTimeout.
 */
const sursa = readFileSync(new URL('./cap-pagina.js', import.meta.url), 'utf8');

interface Mediu {
  redus?: boolean;
  vazut?: boolean;
  sessionStorageAruncă?: boolean;
  hash?: string;
  intro?: 'automat' | 'manual';
}

function ruleaza(m: Mediu = {}) {
  const clase = new Set<string>();
  const temporizari: Array<() => void> = [];
  const html = {
    classList: {
      add: (...c: string[]) => c.forEach((x) => clase.add(x)),
      remove: (...c: string[]) => c.forEach((x) => clase.delete(x)),
      contains: (c: string) => clase.has(c),
    },
  };
  const window = { matchMedia: () => ({ matches: !!m.redus }), requestAnimationFrame: () => 0 };
  const document = {
    documentElement: html,
    currentScript: { getAttribute: (n: string) => (n === 'data-pornire-intro' ? (m.intro ?? 'automat') : null) },
  };
  const sessionStorage = {
    getItem: () => {
      if (m.sessionStorageAruncă) throw new Error('SecurityError');
      return m.vazut ? '1' : null;
    },
  };
  new Function('window', 'document', 'matchMedia', 'sessionStorage', 'location', 'setTimeout', sursa)(
    window,
    document,
    window.matchMedia,
    sessionStorage,
    { hash: m.hash ?? '' },
    (f: () => void) => temporizari.push(f),
  );
  return { clase, expira: () => temporizari.forEach((f) => f()) };
}

describe('cap-pagina.js (înainte de primul paint)', () => {
  it('prima vizită din sesiune, cu mișcare: js, miscare și cu-intro', () => {
    expect([...ruleaza().clase].sort()).toEqual(['cu-intro', 'js', 'miscare']);
  });

  it('o dată pe sesiune: a doua oară fără intro', () => {
    expect(ruleaza({ vazut: true }).clase.has('cu-intro')).toBe(false);
  });

  it('la prefers-reduced-motion: doar js (nicio stare ascunsă, niciun intro), chiar și cu #intro', () => {
    expect([...ruleaza({ redus: true, hash: '#intro' }).clase]).toEqual(['js']);
  });

  it('intrarea cu o ancoră (ex. /#faq) sare intro-ul; #intro îl forțează', () => {
    expect(ruleaza({ hash: '#faq' }).clase.has('cu-intro')).toBe(false);
    expect(ruleaza({ hash: '#faq' }).clase.has('miscare')).toBe(true);
    expect(ruleaza({ hash: '#intro', vazut: true }).clase.has('cu-intro')).toBe(true);
  });

  it('fără sessionStorage (blocat): fără intro, dar mișcarea rămâne', () => {
    const { clase } = ruleaza({ sessionStorageAruncă: true });
    expect(clase.has('cu-intro')).toBe(false);
    expect(clase.has('miscare')).toBe(true);
  });

  it('modul manual (/stil/): fără intro automat; #intro îl forțează', () => {
    expect(ruleaza({ intro: 'manual' }).clase.has('cu-intro')).toBe(false);
    expect(ruleaza({ intro: 'manual', hash: '#intro', vazut: true }).clase.has('cu-intro')).toBe(true);
  });

  it('plasa de siguranță: dacă modulele nu pornesc, după 4 s nimic nu rămâne ascuns sau blocat', () => {
    const r = ruleaza();
    r.expira();
    expect(r.clase.has('miscare')).toBe(false);
    expect(r.clase.has('cu-intro')).toBe(false);
  });

  it('plasa de siguranță nu strică o pagină pornită normal', () => {
    const r = ruleaza();
    r.clase.add('miscare-gata');
    r.clase.add('intro-pornit');
    r.expira();
    expect(r.clase.has('miscare')).toBe(true);
    expect(r.clase.has('cu-intro')).toBe(true);
  });
});
