/**
 * Căile interne ale site-ului, cu calea de bază (`base` din astro.config.mjs, din BASE_PATH).
 * Local și pe domeniul final, baza e „/”; pe GitHub Pages e „/notar-bojan-site/”.
 *
 * Toate linkurile interne trec prin `url()`. Căile „logice” (ex. „/servicii/”, „/#program”)
 * rămân fără bază în RUTE și routeMap; baza se adaugă doar la afișare.
 */

/** Normalizează baza: începe și se termină cu „/” (ex. „notar-bojan-site” → „/notar-bojan-site/”). */
export function normalizeazaBaza(baza: string | undefined): string {
  const curata = (baza ?? '/').trim();
  if (curata === '' || curata === '/') return '/';
  return `/${curata.replace(/^\/+|\/+$/g, '')}/`;
}

/** `true` pentru adrese care nu sunt căi interne: http(s):, mailto:, tel:, //, ancore „#…”. */
function esteExtern(cale: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(cale);
}

/**
 * Adaugă baza la o cale internă: aplicaBaza('/notar-bojan-site/', '/servicii/') →
 * '/notar-bojan-site/servicii/'. Adresele externe și ancorele simple rămân neschimbate.
 */
export function aplicaBaza(baza: string, cale: string): string {
  if (esteExtern(cale)) return cale;
  const b = normalizeazaBaza(baza);
  const relativa = cale.replace(/^\/+/, '');
  return b + relativa;
}

/**
 * Scoate baza dintr-o cale (ex. Astro.url.pathname): eliminaBaza('/notar-bojan-site/', '/notar-bojan-site/en/')
 * → '/en/'. O cale fără bază rămâne neschimbată.
 */
export function eliminaBaza(baza: string, cale: string): string {
  const b = normalizeazaBaza(baza);
  if (b === '/') return cale;
  const faraSlash = b.slice(0, -1);
  if (cale === faraSlash) return '/';
  return cale.startsWith(b) ? `/${cale.slice(b.length)}` : cale;
}

/** Baza site-ului curent (din astro.config.mjs). */
export const BAZA = normalizeazaBaza(import.meta.env.BASE_URL);

/** Calea internă cu baza site-ului: url('/servicii/'), url('/#program'), url('/favicon.svg'). */
export function url(cale: string): string {
  return aplicaBaza(BAZA, cale);
}

/** Calea „logică” (fără bază), pentru comparații și routeMap. */
export function faraBaza(cale: string): string {
  return eliminaBaza(BAZA, cale);
}
