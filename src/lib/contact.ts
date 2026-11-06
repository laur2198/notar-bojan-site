/**
 * Linkuri de contact sigure: nu generează `tel:` sau `mailto:` din date
 * necompletate (marcaj «DE COMPLETAT») sau invalide.
 * Funcții pure, testate în contact.test.ts.
 */
import { t, type Locale } from '../i18n';
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

/**
 * Linkul WhatsApp al biroului: `https://wa.me/40XXXXXXXXX?text=…` (numărul fără „+”), cu un
 * mesaj precompletat în limba paginii, codificat cu `encodeURIComponent`. Textul afișat e
 * numărul în format național (ex. 0722 123 456). Cât timp `whatsapp` e «DE COMPLETAT» sau
 * invalid, nu se generează `href` (butonul rămâne vizibil, dezactivat, doar în preview).
 */
export function linkWhatsapp(birou: { whatsapp: string }, locale: Locale): LinkContact {
  const numar = birou.whatsapp.trim();
  const valid = !areMarcaj(numar) && TELEFON_E164_RO.test(numar);
  if (!valid) return { href: undefined, text: numar, valid: false };
  const cifre = numar.slice(3); // fără „+40”
  const text = `0${cifre.slice(0, 3)} ${cifre.slice(3, 6)} ${cifre.slice(6)}`;
  const href = `https://wa.me/${numar.slice(1)}?text=${encodeURIComponent(t(locale, 'whatsapp.mesaj'))}`;
  return { href, text, valid: true };
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

/** Rândurile emailului precompletat pentru trimiterea actelor (texte din src/i18n). */
export interface CorpEmailActe {
  salut: string;
  nume: string;
  telefon: string;
  data: string;
  observatii: string;
  atasate: string;
}

/**
 * Linkul „Trimiteți actele pe email” (CLAUDE.md §8): `mailto:` către `emailActe`, cu
 * `subject` = `subiectEmail` și un corp precompletat, cu rânduri goale de completat.
 * Codificare cu `encodeURIComponent` (spațiile devin %20, rândurile noi %0D%0A).
 * Dacă adresa nu e gata (marcaj «DE COMPLETAT» sau invalidă), nu se generează `href`.
 */
export function linkActe(emailActe: string, subiect: string, corp: CorpEmailActe): LinkContact {
  const adresa = linkEmail(emailActe);
  if (!adresa.valid) return adresa;
  const rand = '\r\n';
  const text = [corp.salut, '', `${corp.nume} `, `${corp.telefon} `, `${corp.data} `, `${corp.observatii} `, '', corp.atasate, '- ', ''].join(
    rand,
  );
  const href = `mailto:${emailActe.trim()}?subject=${encodeURIComponent(subiect)}&body=${encodeURIComponent(text)}`;
  return { href, text: adresa.text, valid: true };
}
