/**
 * Rutele pe limbi și `routeMap` RO ↔ EN, fără nicio dependență (nici de Astro, nici de baza
 * site-ului): le folosesc și componentele (prin src/i18n/index.ts), și astro.config.mjs
 * (alternatele din sitemap). Căi „logice”, fără bază.
 */

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


/**
 * Alternatele de limbă ale unei pagini, pentru sitemap: `ro`, `en` și `x-default` (→ RO),
 * doar pe perechile din routeMap. `caleLogica` e fără bază (ex. „/servicii/”).
 */
export function alternateLimbi(caleLogica: string): { lang: 'ro' | 'en' | 'x-default'; cale: string }[] | undefined {
  const invers = Object.entries(routeMap).find(([, en]) => en === caleLogica);
  const ro = caleLogica in routeMap ? caleLogica : invers?.[0];
  const en = ro !== undefined ? routeMap[ro] : undefined;
  if (ro === undefined || en === undefined) return undefined;
  return [
    { lang: 'ro', cale: ro },
    { lang: 'en', cale: en },
    { lang: 'x-default', cale: ro },
  ];
}
