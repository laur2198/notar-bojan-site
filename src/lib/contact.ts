/**
 * Linkuri de contact sigure: nu generează `tel:` sau `mailto:` din date
 * necompletate (marcaj «DE COMPLETAT») sau invalide.
 * Funcții pure, testate în contact.test.ts.
 */
import { areMarcaj } from './marcaj';

export interface LinkContact {
  /** `tel:…` / `mailto:…`, sau `undefined` dacă datele nu sunt gata. */
  href: string | undefined;
  /** Textul afișat (poate conține marcaj «DE COMPLETAT», de trecut prin `marcheazaPlaceholder`). */
  text: string;
  /** `true` doar dacă `href` există și e valid. */
  valid: boolean;
}

const TELEFON_E164_RO = /^\+40\d{9}$/;
const EMAIL = /^[^\s@«»]+@[^\s@«»]+\.[^\s@«»]+$/;

/**
 * Linkul de telefon al biroului.
 * - `telefon`: formatul internațional, folosit în `tel:` (ex. +40268123456);
 * - `telefonAfisat`: cum apare scris (ex. 0268 123 456).
 */
export function linkTelefon(birou: { telefon: string; telefonAfisat: string }): LinkContact {
  const valid = !areMarcaj(birou.telefon) && TELEFON_E164_RO.test(birou.telefon);
  const text = birou.telefonAfisat.trim() || birou.telefon;
  return { href: valid ? `tel:${birou.telefon}` : undefined, text, valid };
}

/** Link `mailto:` simplu către o adresă, fără subiect. */
export function linkEmail(adresa: string): LinkContact {
  const curata = adresa.trim();
  const valid = !areMarcaj(curata) && EMAIL.test(curata);
  return { href: valid ? `mailto:${curata}` : undefined, text: curata, valid };
}

/**
 * Link extern (Google Maps, profilul Google, pagina de programări): doar dacă e o
 * adresă `https://` completă, fără marcaj «DE COMPLETAT».
 */
export function linkExtern(url: string, text: string): LinkContact {
  const curat = url.trim();
  let valid = false;
  if (!areMarcaj(curat)) {
    try {
      valid = new URL(curat).protocol === 'https:';
    } catch {
      valid = false;
    }
  }
  return { href: valid ? curat : undefined, text, valid };
}
