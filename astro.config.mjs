// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// `.env` nu ajunge automat în process.env în fișierul de configurare; loadEnv îl citește explicit.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
const SITE_URL = env.SITE_URL || 'https://notar-bojan.pages.dev';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Toate rutele din CLAUDE.md §6 au slash final.
  trailingSlash: 'always',
  // Astro 7 folosește implicit 'jsx', care șterge spațiul dintre elementele inline
  // (ex. `<a>Sunați</a> <span>…`). Păstrăm comportamentul HTML clasic.
  compressHTML: true,
  i18n: {
    defaultLocale: 'ro',
    locales: ['ro', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/stil/'),
      // TODO etapa 6: opțiunea `i18n` împerechează doar căi identice (`/` ↔ `/en/`).
      // Perechile cu slug diferit (`/servicii/` ↔ `/en/services/`) cer `serialize()` cu `routeMap`.
      i18n: {
        defaultLocale: 'ro',
        locales: {
          ro: 'ro-RO',
          en: 'en-US',
        },
      },
    }),
  ],
});
