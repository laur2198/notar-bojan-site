#!/usr/bin/env node
/**
 * Verifică wordmark-ul gigant (src/components/WordmarkGigant.astro) la 1280 și 1440 px (și la
 * alte lățimi date ca argumente), după încărcarea fonturilor:
 *   - pe ghidul /stil/ (varianta pe toată lățimea) și în hero-ul paginii Acasă (varianta de 62%):
 *     lățimea textului trebuie să fie cea a cutiei lui, cu o abatere de cel mult 1%;
 *   - pe Acasă, de la 768 px, cutia trebuie să fie 62% din container (±1%).
 * Afișează și factorul k măsurat (lățimea textului în em), de pus în --wordmark-k.
 *
 * Rulare (cu `npm run preview` pornit; Playwright și Chromium sunt preinstalate în mediul de lucru,
 * nu sunt dependențe ale proiectului):
 *   node scripts/verifica-wordmark.mjs [bază] [lățimi...]
 *   node scripts/verifica-wordmark.mjs http://localhost:4321 1280 1440 1920
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright nu e disponibil. Instalați-l separat (nu e dependență a proiectului).');
  process.exit(2);
}

const [bazaArg = 'http://localhost:4321', ...argLatimi] = process.argv.slice(2);
const baza = bazaArg.replace(/\/(stil\/?)?$/, '');
const latimi = argLatimi.length > 0 ? argLatimi.map(Number) : [1280, 1440];
const ABATERE_MAX = 0.01;
/** Paginile verificate și fracțiunea așteptată a cutiei din container (de la 768 px). */
const PAGINI = [
  { cale: '/stil/', fractie: 1 },
  { cale: '/', fractie: 0.62 },
];

const browser = await chromium.launch();
let esec = false;
try {
  for (const { cale, fractie } of PAGINI) {
    for (const latime of latimi) {
      const pagina = await browser.newPage({ viewport: { width: latime, height: 900 } });
      await pagina.goto(baza + cale, { waitUntil: 'load' });
      const m = await pagina.evaluate(async () => {
        await document.fonts.ready;
        const text = document.querySelector('[data-wordmark-gigant]');
        const container = text.parentElement;
        const stil = getComputedStyle(text);
        const latimeText = text.getBoundingClientRect().width;
        const latimeContainer = container.clientWidth;
        const latimeParinte = container.parentElement.clientWidth;
        const marime = parseFloat(stil.fontSize);
        return {
          latimeText,
          latimeContainer,
          latimeParinte,
          marime,
          k: latimeText / marime,
          fontIncarcat: document.fonts.check(`${stil.fontWeight} ${stil.fontSize} ${stil.fontFamily}`),
          familie: stil.fontFamily,
        };
      });
      const abatere = (m.latimeText - m.latimeContainer) / m.latimeContainer;
      const fractieAsteptata = latime >= 768 ? fractie : 1;
      const fractieMasurata = m.latimeContainer / m.latimeParinte;
      const okFractie = Math.abs(fractieMasurata - fractieAsteptata) <= ABATERE_MAX;
      const ok = Math.abs(abatere) <= ABATERE_MAX && m.fontIncarcat && okFractie;
      if (!ok) esec = true;
      console.log(
        `${cale} ${latime} px: cutie ${(fractieMasurata * 100).toFixed(1)}% din container (așteptat ${fractieAsteptata * 100}%), text ${m.latimeText.toFixed(1)} px / container ${m.latimeContainer.toFixed(1)} px, ` +
          `abatere ${(abatere * 100).toFixed(2)}%, font ${m.marime.toFixed(2)} px, k măsurat ${m.k.toFixed(4)}, ` +
          `font încărcat: ${m.fontIncarcat ? 'da' : 'NU'} → ${ok ? 'OK' : 'PICĂ'}`,
      );
      await pagina.close();
    }
  }
} finally {
  await browser.close();
}
process.exit(esec ? 1 : 0);
