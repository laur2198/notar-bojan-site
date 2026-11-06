// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { alternateLimbi } from './src/i18n/rute.ts';

// `.env` nu ajunge automat în process.env în fișierul de configurare; loadEnv îl citește explicit.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
const SITE_URL = env.SITE_URL || 'https://notar-bojan.pages.dev';
// Calea de bază: „/” local și pe domeniul final; „/notar-bojan-site/” pe GitHub Pages (vezi README).
const BASE_PATH = normalizeazaBaza(env.BASE_PATH);

/**
 * „notar-bojan-site” sau „/notar-bojan-site” → „/notar-bojan-site/”; gol → „/”.
 * Aceeași regulă ca `normalizeazaBaza` din src/lib/url.ts (testată acolo).
 * @param {string | undefined} baza
 * @returns {string}
 */
function normalizeazaBaza(baza) {
  const curata = (baza ?? '/').trim();
  if (curata === '' || curata === '/') return '/';
  return `/${curata.replace(/^\/+|\/+$/g, '')}/`;
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  // Toate rutele din CLAUDE.md §6 au slash final.
  trailingSlash: 'always',
  // Astro 7 folosește implicit 'jsx', care șterge spațiul dintre elementele inline
  // (ex. `<a>Sunați</a> <span>…`). Păstrăm comportamentul HTML clasic.
  compressHTML: true,
  // CSP strict (public/_headers): fără CSS și JS inline, totul din fișiere /_astro/ ('self').
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Astro pune inline scripturile mai mici decât această limită; 0 = toate în fișiere.
      assetsInlineLimit: 0,
    },
  },
  i18n: {
    defaultLocale: 'ro',
    locales: ['ro', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // Doar paginile indexabile: fără ghidul intern /stil/ și fără 404 (amândouă au noindex).
      filter: (page) => {
        const cale = new URL(page).pathname;
        return !cale.startsWith(`${BASE_PATH}stil/`) && !/\/404(\.html|\/)?$/.test(cale);
      },
      // Opțiunea `i18n` a integrării împerechează doar căi identice (`/` ↔ `/en/`), deci
      // alternatele se pun aici, din routeMap (src/i18n/rute.ts): și perechile cu slug diferit
      // (`/servicii/` ↔ `/en/services/`). Paginile fără pereche nu primesc alternate.
      // Codurile hreflang sunt aceleași ca în pagini: ro, en, x-default → RO.
      serialize(item) {
        const adresa = new URL(item.url);
        const caleLogica = `/${adresa.pathname.slice(BASE_PATH.length)}`;
        const alternate = alternateLimbi(caleLogica);
        return {
          ...item,
          links: alternate?.map(({ lang, cale }) => ({ lang, url: new URL(`${BASE_PATH}${cale.slice(1)}`, adresa.origin).href })),
        };
      },
    }),
  ],
});
