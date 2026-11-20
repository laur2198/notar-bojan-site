import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * src/scripts/cap-pagina.js e un script clasic (fără export), servit ca atare în <head>.
 * Îl rulăm cu un mediu de browser simulat: <html>, matchMedia, location, setTimeout.
 */
const sursa = readFileSync(new URL('./cap-pagina.js', import.meta.url), 'utf8');

interface Mediu {
  redus?: boolean;
  hash?: string;
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
  const document = { documentElement: html };
  new Function('window', 'document', 'matchMedia', 'location', 'setTimeout', sursa)(
    window,
    document,
    window.matchMedia,
    { hash: m.hash ?? '' },
    (f: () => void) => temporizari.push(f),
  );
  return { clase, expira: () => temporizari.forEach((f) => f()) };
}

describe('cap-pagina.js (înainte de primul paint)', () => {
  it('cu mișcare: js și miscare; niciun intro (scos în V3d)', () => {
    expect([...ruleaza().clase].sort()).toEqual(['js', 'miscare']);
    expect(sursa).not.toMatch(/cu-intro|sessionStorage/);
  });

  it('la prefers-reduced-motion: doar js (nicio stare ascunsă), chiar și cu ancoră', () => {
    expect([...ruleaza({ redus: true, hash: '#faq' }).clase]).toEqual(['js']);
  });

  it('intrarea cu o ancoră (ex. /#faq): saltul inițial e instant (ancora-initiala)', () => {
    const { clase } = ruleaza({ hash: '#faq' });
    expect(clase.has('ancora-initiala')).toBe(true);
    expect(clase.has('miscare')).toBe(true);
    expect(ruleaza({ hash: '#' }).clase.has('ancora-initiala')).toBe(false);
  });

  it('plasa de siguranță: dacă modulele nu pornesc, după 4 s nimic nu rămâne ascuns', () => {
    const r = ruleaza({ hash: '#faq' });
    r.expira();
    expect(r.clase.has('miscare')).toBe(false);
    expect(r.clase.has('ancora-initiala')).toBe(false);
  });

  it('plasa de siguranță nu strică o pagină pornită normal', () => {
    const r = ruleaza();
    r.clase.add('miscare-gata');
    r.expira();
    expect(r.clase.has('miscare')).toBe(true);
  });
});
