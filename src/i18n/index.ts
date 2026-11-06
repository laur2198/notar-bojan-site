/**
 * i18n: helperul `t(locale, cheie)`, rutele pe limbi și `routeMap` RO ↔ EN (CLAUDE.md §6).
 * Modul pur (fără Astro), testat în i18n.test.ts.
 */
import { en } from './en';
import { ro } from './ro';

export const LOCALES = ['ro', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_IMPLICIT: Locale = 'ro';

export type CheieUI = keyof typeof ro;

const dictionare: Record<Locale, Record<CheieUI, string>> = { ro, en };

/** Textul de interfață pentru cheie; `{param}` se înlocuiește din `parametri`. */
export function t(locale: Locale, cheie: CheieUI, parametri: Record<string, string | number> = {}): string {
  const sablon = dictionare[locale][cheie];
  return sablon.replace(/\{(\w+)\}/g, (tot, nume: string) =>
    nume in parametri ? String(parametri[nume]) : tot,
  );
}

/**
 * Text cu plural corect (Intl.PluralRules): în română „1 recenzie”, „3 recenzii”,
 * „20 de recenzii”. Cheile sunt `{baza}.one`, `{baza}.few`, `{baza}.other`.
 */
export function tPlural(locale: Locale, baza: 'recenzii.numar', n: number): string {
  const categorie = new Intl.PluralRules(LOCALE_INTL[locale]).select(n);
  const cheie = (['one', 'few'].includes(categorie) ? `${baza}.${categorie}` : `${baza}.other`) as CheieUI;
  return t(locale, cheie, { n: formateazaNumar(locale, n) });
}

/** Număr formatat local, ex. 4,8 (RO) / 4.8 (EN); `zecimale` fixe dacă e dat. */
export function formateazaNumar(locale: Locale, n: number, zecimale?: number): string {
  return new Intl.NumberFormat(LOCALE_INTL[locale], {
    ...(zecimale !== undefined && { minimumFractionDigits: zecimale, maximumFractionDigits: zecimale }),
  }).format(n);
}

/** Data „25 decembrie” / „25 December”, dintr-un string YYYY-MM-DD. */
export function formateazaZiLuna(locale: Locale, data: string): string {
  return new Intl.DateTimeFormat(LOCALE_INTL[locale], { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${data}T00:00:00Z`),
  );
}

/** Numele zilelor, de luni (index 0) până duminică. */
export function zileSaptamana(locale: Locale): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => t(locale, `zi.${i}` as CheieUI));
}

/** Prima literă mare, ex. „luni” → „Luni” (pentru începutul de rând din tabel). */
export function majusculaInitiala(text: string, locale: Locale): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** Locale BCP 47 pentru `Intl` (formatul datelor). */
export const LOCALE_INTL: Record<Locale, string> = { ro: 'ro-RO', en: 'en-GB' };

// ---------------------------------------------------------------------------
// Rute
// ---------------------------------------------------------------------------

/**
 * Paginile site-ului pe limbi (tabelul din CLAUDE.md §6). Paginile fără `en`
 * există doar în română.
 */
export const RUTE = {
  acasa: { ro: '/', en: '/en/' },
  servicii: { ro: '/servicii/', en: '/en/services/' },
  programare: { ro: '/programare/', en: '/en/appointments/' },
  faq: { ro: '/intrebari-frecvente/', en: '/en/faq/' },
  contact: { ro: '/contact/', en: '/en/contact/' },
  recenzii: { ro: '/recenzii/' },
  despre: { ro: '/despre/' },
  confidentialitate: { ro: '/confidentialitate/' },
} as const satisfies Record<string, { ro: string; en?: string }>;

export type CheieRuta = keyof typeof RUTE;

/** RO → EN, doar pentru paginile care au pereche. */
export const routeMap: Readonly<Record<string, string>> = Object.fromEntries(
  Object.values(RUTE).flatMap((r) => ('en' in r ? [[r.ro, r.en]] : [])),
);

/** EN → RO. */
const routeMapInvers: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(routeMap).map(([roCale, enCale]) => [enCale, roCale]),
);

/** Calea paginii în limba cerută; o pagină fără variantă EN întoarce calea RO. */
export function cale(cheie: CheieRuta, locale: Locale): string {
  const ruta: { ro: string; en?: string } = RUTE[cheie];
  return locale === 'en' ? (ruta.en ?? ruta.ro) : ruta.ro;
}

/** `true` dacă linkul către `cheie` duce la o pagină în altă limbă decât `locale`. */
export function esteInAltaLimba(cheie: CheieRuta, locale: Locale): boolean {
  const ruta: { ro: string; en?: string } = RUTE[cheie];
  return locale === 'en' && ruta.en === undefined;
}

/** Normalizează o cale: începe și se termină cu „/”, fără `index.html`. */
export function normalizeazaCale(pathname: string): string {
  let p = pathname.replace(/index\.html$/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/')) p = `${p}/`;
  return p;
}

export function localeDinCale(pathname: string): Locale {
  const p = normalizeazaCale(pathname);
  return p === '/en/' || p.startsWith('/en/') ? 'en' : 'ro';
}

export interface PerecheLimbi {
  ro: string;
  en: string;
}

/** Perechea RO/EN a paginii, dacă există (pentru `hreflang`). */
export function perecheLimbi(pathname: string): PerecheLimbi | undefined {
  const p = normalizeazaCale(pathname);
  if (p in routeMap) return { ro: p, en: routeMap[p]! };
  if (p in routeMapInvers) return { ro: routeMapInvers[p]!, en: p };
  return undefined;
}

/**
 * Ținta comutatorului de limbă: pagina corespondentă din cealaltă limbă sau,
 * dacă nu există, pagina principală a acelei limbi.
 */
export function caleInAltaLimba(pathname: string): { locale: Locale; href: string; pereche: boolean } {
  const actuala = localeDinCale(pathname);
  const tinta: Locale = actuala === 'ro' ? 'en' : 'ro';
  const pereche = perecheLimbi(pathname);
  if (pereche) return { locale: tinta, href: pereche[tinta], pereche: true };
  return { locale: tinta, href: RUTE.acasa[tinta], pereche: false };
}

/**
 * `aria-current` pentru un link de meniu: „page” pe pagina exactă, „true” pe
 * paginile din aceeași secțiune (ex. /servicii/succesiune/ pentru „Servicii”).
 */
export function ariaCurent(href: string, pathname: string): 'page' | 'true' | undefined {
  const p = normalizeazaCale(pathname);
  const h = normalizeazaCale(href);
  if (p === h) return 'page';
  if (h !== '/' && h !== '/en/' && p.startsWith(h)) return 'true';
  return undefined;
}
