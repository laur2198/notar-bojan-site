/**
 * Utilitare comune pentru testele e2e (Playwright preinstalat în mediul de lucru, nu e
 * dependență a proiectului): adresa de bază, browserul și o pagină cu CSP-ul real din
 * public/_headers aplicat răspunsurilor HTML (`astro preview` nu citește _headers).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, before } from 'node:test';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

export const BAZA = (process.env.E2E_URL ?? 'http://localhost:4321').replace(/\/$/, '');

/** CSP-ul din public/_headers pentru o cale (blocul /stil/* îl înlocuiește pe cel general). */
export function cspPentru(cale) {
  const text = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  const blocuri = text.split(/\n(?=\S)/).filter((b) => !b.startsWith('#'));
  let csp = null;
  for (const bloc of blocuri) {
    const [model] = bloc.split('\n');
    const potrivire = new RegExp(`^${model.trim().replace(/\*/g, '.*')}$`).test(cale);
    const linie = bloc.match(/^\s+Content-Security-Policy:\s*(.+)$/m);
    if (potrivire && linie) csp = linie[1];
  }
  return csp;
}

let browser;

/** Pornește browserul pentru fișierul de test curent (before / after din node:test). */
export function cuBrowser() {
  before(async () => {
    browser = await chromium.launch();
  });
  after(async () => {
    await browser?.close();
  });
}

/** O pagină nouă (context propriu), cu CSP aplicat și erorile din consolă colectate. */
export async function pagina(optiuni = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...optiuni });
  const p = await context.newPage();
  const erori = [];
  p.on('console', (m) => {
    if (m.type() === 'error') erori.push(m.text());
  });
  p.on('pageerror', (e) => erori.push(e.message));
  await p.route('**/*', async (route) => {
    const cerere = route.request();
    if (cerere.resourceType() !== 'document') return route.continue();
    const raspuns = await route.fetch();
    const csp = cspPentru(new URL(cerere.url()).pathname);
    await route.fulfill({ response: raspuns, headers: { ...raspuns.headers(), ...(csp ? { 'content-security-policy': csp } : {}) } });
  });
  return { p, erori, context };
}
