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
    test(`${cale}: trei grupuri, toate path-urile cu pathLength="100", SVG aria-hidden și nefocalizabil`, async () => {
      const pagina = await browser.newPage();
      await pagina.goto(server.url + cale);
      const svg = pagina.locator('.hero [data-semnatura="hero"]');
      assert.equal(await svg.count(), 1);
      assert.equal(await svg.getAttribute('aria-hidden'), 'true');
      assert.equal(await svg.getAttribute('focusable'), 'false');
      assert.deepEqual(await svg.locator(':scope > g').evaluateAll((g) => g.map((x) => x.dataset.grup)), ['notar', 'maini', 'bojan']);
      const lungimi = await svg.locator('path').evaluateAll((p) => p.map((x) => x.getAttribute('pathLength')));
      assert.ok(lungimi.length > 3);
      assert.ok(lungimi.every((l) => l === '100'));
      await pagina.close();
    });
  }

  test('cu JS, fără intro (sesiune văzută): pornește nedesenată și ajunge desenată după 3.5 s', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'no-preference' });
    await pagina.addInitScript(() => sessionStorage.setItem('intro-vazut', '1'));
    const erori = [];
    pagina.on('console', (m) => m.type() === 'error' && erori.push(m.text()));
    await pagina.goto(server.url + '/');
    const offset = () => pagina.locator('.hero [data-semnatura="hero"] path').first().evaluate((p) => Number(getComputedStyle(p).strokeDashoffset.match(/-?[\d.]+/)[0]));
    await pagina.locator('.hero [data-semnatura="hero"].desenat').waitFor({ state: 'attached' });
    assert.ok((await offset()) > 50, 'la pornire semnătura e (aproape) nedesenată');
    await pagina.waitForFunction(() => [...document.querySelectorAll('.hero [data-semnatura="hero"] path')].every((p) => Number(getComputedStyle(p).strokeDashoffset.match(/-?[\d.]+/)[0]) === 0), null, { timeout: 6000 });
    assert.equal(await offset(), 0);
    assert.deepEqual(erori.filter((e) => /Content Security Policy/i.test(e)), [], 'scriptul inline e blocat de CSP');
    await pagina.close();
  });

  test('intervalele (--d) sunt proporționale cu lungimea reală (getTotalLength) și secvențiale', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    const date = await pagina.locator('.hero [data-semnatura="hero"] path').evaluateAll((p) =>
      p.map((x) => ({ l: x.getTotalLength(), d: parseFloat(getComputedStyle(x).getPropertyValue('--d')), delay: parseFloat(getComputedStyle(x).getPropertyValue('--delay')) })),
    );
    const total = date.reduce((s, x) => s + x.l, 0);
    let cursor = 0;
    for (const x of date) {
      assert.ok(Math.abs(x.d - x.l / total) < 0.002, `--d ${x.d} vs ${x.l / total}`);
      assert.ok(Math.abs(x.delay - cursor) < 1e-5);
      cursor += x.d;
    }
    assert.ok(Math.abs(cursor - 1) < 1e-5);
    await pagina.close();
  });

  test('desen strict secvențial: la jumătatea gestului, primele trăsături sunt gata, ultimele neîncepute', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'no-preference' });
    await pagina.addInitScript(() => sessionStorage.setItem('intro-vazut', '1'));
    await pagina.goto(server.url + '/');
    const svg = pagina.locator('.hero [data-semnatura="hero"]');
    await svg.evaluate(async (s) => {
      s.classList.add('instant');
      s.classList.remove('desenat');
      s.style.setProperty('--progres', '0.5');
      await new Promise((r) => requestAnimationFrame(r));
    });
    const stari = await svg.locator('path').evaluateAll((p) => p.map((x) => ({ o: Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0]), delay: parseFloat(getComputedStyle(x).getPropertyValue('--delay')), d: parseFloat(getComputedStyle(x).getPropertyValue('--d')) })));
    for (const x of stari) {
      if (x.delay + x.d <= 0.5) assert.equal(x.o, 0);
      else if (x.delay >= 0.5) assert.equal(x.o, 100);
      else assert.ok(x.o > 0 && x.o < 100);
    }
    await pagina.close();
  });

  test('prefers-reduced-motion: desenată complet de la încărcare, fără tranziție', async () => {
    const pagina = await browser.newPage({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    const offseturi = await pagina.locator('.hero [data-semnatura="hero"] path').evaluateAll((p) => p.map((x) => Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0])));
    assert.ok(offseturi.every((o) => o === 0));
    await pagina.close();
  });

  test('fără JS: desenată complet', async () => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    const pagina = await context.newPage();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), false);
    const offseturi = await pagina.locator('.hero [data-semnatura="hero"] path').evaluateAll((p) => p.map((x) => Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0])));
    assert.ok(offseturi.every((o) => o === 0));
    await context.close();
  });
});
