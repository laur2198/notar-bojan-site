/**
 * Semnătura din hero (Acasă RO și EN): marcaj decorativ și stările animației.
 * Rulare: npm run build && npm run test:e2e
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { incarcaPlaywright, serveste } from './util.mjs';

const playwright = incarcaPlaywright();

describe('Semnătura din hero', { skip: playwright ? false : 'Playwright nu e disponibil în mediu' }, () => {
  let browser;
  let server;
  before(async () => {
    server = await serveste();
    browser = await playwright.chromium.launch();
  });
  after(async () => {
    await browser?.close();
    await server?.inchide();
  });

  for (const cale of ['/', '/en/']) {
    test(`${cale}: path cu pathLength="100", SVG aria-hidden și nefocalizabil`, async () => {
      const pagina = await browser.newPage();
      await pagina.goto(server.url + cale);
      const svg = pagina.locator('.hero [data-semnatura="hero"]');
      assert.equal(await svg.count(), 1);
      assert.equal(await svg.getAttribute('aria-hidden'), 'true');
      assert.equal(await svg.getAttribute('focusable'), 'false');
      const trasee = svg.locator('path');
      assert.equal(await trasee.count(), 1);
      assert.equal(await trasee.getAttribute('pathLength'), '100');
      await pagina.close();
    });
  }

  test('cu JS: pornește nedesenată și ajunge desenată după 3.5 s', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'no-preference' });
    const erori = [];
    pagina.on('console', (m) => m.type() === 'error' && erori.push(m.text()));
    await pagina.goto(server.url + '/');
    const offset = () => pagina.locator('.hero [data-semnatura="hero"] path').evaluate((p) => parseFloat(getComputedStyle(p).strokeDashoffset));
    await pagina.locator('.hero [data-semnatura="hero"].desenat').waitFor({ state: 'attached' });
    assert.ok((await offset()) > 50, 'la pornire semnătura e (aproape) nedesenată');
    await pagina.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.hero [data-semnatura="hero"] path')).strokeDashoffset) === 0, null, { timeout: 6000 });
    assert.equal(await offset(), 0);
    assert.deepEqual(erori.filter((e) => /Content Security Policy/i.test(e)), [], 'scriptul inline e blocat de CSP');
    await pagina.close();
  });

  test('prefers-reduced-motion: desenată complet de la încărcare, fără tranziție', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    const offset = await pagina.locator('.hero [data-semnatura="hero"] path').evaluate((p) => parseFloat(getComputedStyle(p).strokeDashoffset));
    assert.equal(offset, 0);
    await pagina.close();
  });

  test('fără JS: desenată complet', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    const pagina = await context.newPage();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), false);
    const offset = await pagina.locator('.hero [data-semnatura="hero"] path').evaluate((p) => parseFloat(getComputedStyle(p).strokeDashoffset));
    assert.equal(offset, 0);
    await context.close();
  });
});
