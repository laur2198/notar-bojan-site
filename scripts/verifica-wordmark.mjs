#!/usr/bin/env node
/**
 * Verifică wordmark-ul gigant (src/components/WordmarkGigant.astro) pe ghidul /stil/:
 * la 1280 și 1440 px (și la alte lățimi date ca argumente), după încărcarea fonturilor,
 * lățimea textului trebuie să fie cea a containerului, cu o abatere de cel mult 1%.
 * Afișează și factorul k măsurat (lățimea textului în em), de pus în --wordmark-k.
 *
 * Rulare (cu `npm run preview` pornit; Playwright și Chromium sunt preinstalate în mediul de lucru,
 * nu sunt dependențe ale proiectului):
 *   node scripts/verifica-wordmark.mjs [url] [lățimi...]
 *   node scripts/verifica-wordmark.mjs http://localhost:4321/stil/ 1280 1440 1920
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

const [url = 'http://localhost:4321/stil/', ...argLatimi] = process.argv.slice(2);
const latimi = argLatimi.length > 0 ? argLatimi.map(Number) : [1280, 1440];
const ABATERE_MAX = 0.01;

const browser = await chromium.launch();
let esec = false;
try {
  for (const latime of latimi) {
    const pagina = await browser.newPage({ viewport: { width: latime, height: 900 } });
    await pagina.goto(url, { waitUntil: 'load' });
    const m = await pagina.evaluate(async () => {
      await document.fonts.ready;
      const text = document.querySelector('[data-wordmark-gigant]');
      const container = text.parentElement;
      const stil = getComputedStyle(text);
      const latimeText = text.getBoundingClientRect().width;
      const latimeContainer = container.clientWidth;
      const marime = parseFloat(stil.fontSize);
      return {
        latimeText,
        latimeContainer,
        marime,
        k: latimeText / marime,
        fontIncarcat: document.fonts.check(`${stil.fontWeight} ${stil.fontSize} ${stil.fontFamily}`),
        familie: stil.fontFamily,
      };
    });
    const abatere = (m.latimeText - m.latimeContainer) / m.latimeContainer;
    const ok = Math.abs(abatere) <= ABATERE_MAX && m.fontIncarcat;
    if (!ok) esec = true;
    console.log(
      `${latime} px: text ${m.latimeText.toFixed(1)} px / container ${m.latimeContainer.toFixed(1)} px, ` +
        `abatere ${(abatere * 100).toFixed(2)}%, font ${m.marime.toFixed(2)} px, k măsurat ${m.k.toFixed(4)}, ` +
        `font încărcat: ${m.fontIncarcat ? 'da' : 'NU'} → ${ok ? 'OK' : 'PICĂ'}`,
    );
    await pagina.close();
  }
} finally {
  await browser.close();
}
process.exit(esec ? 1 : 0);
