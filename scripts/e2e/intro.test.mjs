/**
 * Intro-ul cu semnătura (IntroSemnatura.astro + src/scripts/intro-semnatura.js).
 * Rulare: npm run build && npm run test:e2e
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { incarcaPlaywright, serveste } from './util.mjs';

const playwright = incarcaPlaywright();
const STRAT = 'html > .intro';

describe('Intro cu semnătura', { skip: playwright ? false : 'Playwright nu e disponibil în mediu' }, () => {
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

  async function context(optiuni = {}) {
    const ctx = await browser.newContext({ reducedMotion: 'no-preference', ...optiuni });
    const pagina = await ctx.newPage();
    const erori = [];
    pagina.on('pageerror', (e) => erori.push(e.message));
    pagina.on('console', (m) => m.type() === 'error' && erori.push(m.text()));
    return { ctx, pagina, erori };
  }

  test('rulează o singură dată pe sesiune (inclusiv pe altă pagină sau limbă)', async () => {
    const { ctx, pagina, erori } = await context();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.locator(STRAT).count(), 1, 'stratul există la prima încărcare');
    assert.equal(await pagina.evaluate(() => sessionStorage.getItem('intro-vazut')), '1');
    await pagina.locator(STRAT).waitFor({ state: 'detached', timeout: 4000 });
    for (const cale of ['/', '/contact/', '/en/']) {
      await pagina.goto(server.url + cale);
      assert.equal(await pagina.locator(STRAT).count(), 0, `nu reapare pe ${cale}`);
      assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('intro-rulat')), false);
    }
    assert.deepEqual(erori, []);
    await ctx.close();
  });

  test('fără punct bordo; în timpul intro-ului (intro + hero în pagină) id-urile sunt unice', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.locator(STRAT).count(), 1);
    assert.equal(await pagina.locator('circle, .semnatura__punct').count(), 0);
    const iduri = await pagina.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id));
    assert.equal(new Set(iduri).size, iduri.length, 'id-uri duplicate în pagină');
    // Fiecare clip-path din semnături trimite la un clipPath din același SVG.
    const gresite = await pagina.evaluate(() =>
      [...document.querySelectorAll('svg.semnatura [clip-path]')].filter((g) => {
        const id = g.getAttribute('clip-path').match(/url\(#(.+)\)/)[1];
        return document.getElementById(id)?.closest('svg') !== g.closest('svg');
      }).length,
    );
    assert.equal(gresite, 0);
    await ctx.close();
  });

  test('se scoate singur din DOM în maximum 2.3 s (+ toleranță)', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/', { waitUntil: 'commit' });
    await pagina.locator(STRAT).waitFor({ state: 'attached' });
    const start = Date.now();
    await pagina.locator(STRAT).waitFor({ state: 'detached', timeout: 4000 });
    assert.ok(Date.now() - start <= 2300 + 300, `durata ${Date.now() - start} ms`);
    await ctx.close();
  });

  test('nu rulează la prefers-reduced-motion: reduce', async () => {
    const { ctx, pagina } = await context({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.locator(STRAT).count(), 0);
    assert.equal(await pagina.evaluate(() => sessionStorage.getItem('intro-vazut')), null);
    await ctx.close();
  });

  test('nu rulează fără JS (stratul nu există în HTML)', async () => {
    const { ctx, pagina } = await context({ javaScriptEnabled: false });
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.locator('.intro').count(), 0);
    await ctx.close();
  });

  test('nu rulează dacă sessionStorage aruncă', async () => {
    const { ctx, pagina, erori } = await context();
    await pagina.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('blocat', 'SecurityError'); } });
    });
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.locator(STRAT).count(), 0);
    assert.deepEqual(erori, []);
    await ctx.close();
  });

  test('se închide la keydown; Tab ajunge la skip link', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/');
    const strat = pagina.locator(STRAT);
    assert.equal(await strat.count(), 1);
    assert.equal(await strat.getAttribute('aria-hidden'), 'true');
    await pagina.keyboard.press('Tab');
    assert.match((await strat.getAttribute('class')) ?? '', /intro--iese/, 'fade-ul pornește imediat');
    await strat.waitFor({ state: 'detached', timeout: 1000 });
    const focus = await pagina.evaluate(() => document.activeElement?.getAttribute('href'));
    assert.equal(focus, '#continut', 'primul Tab ajunge la „Sari la conținut”');
    await ctx.close();
  });

  for (const [nume, actiune] of [
    ['click', (p) => p.mouse.click(10, 300)],
    ['wheel', (p) => p.mouse.wheel(0, 200)],
  ]) {
    test(`se închide la ${nume}`, async () => {
      const { ctx, pagina } = await context();
      await pagina.goto(server.url + '/');
      await actiune(pagina);
      await pagina.locator(STRAT).waitFor({ state: 'detached', timeout: 1000 });
      await ctx.close();
    });
  }

  test('se închide la touchstart', async () => {
    const { ctx, pagina } = await context({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
    await pagina.goto(server.url + '/');
    await pagina.touchscreen.tap(20, 400);
    await pagina.locator(STRAT).waitFor({ state: 'detached', timeout: 1000 });
    await ctx.close();
  });

  test('după intro, semnătura din hero e complet vizibilă, fără animație (width = data-w)', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('intro-rulat')), true);
    const latimi = () => pagina.locator('.hero [data-semnatura="hero"] rect.wipe').evaluateAll((r) => r.map((x) => [x.getAttribute('width'), x.getAttribute('data-w')]));
    for (const [w, dw] of await latimi()) assert.equal(w, dw);
    await pagina.waitForTimeout(500);
    for (const [w, dw] of await latimi()) assert.equal(w, dw);
    await ctx.close();
  });

  test('intro-ul pornește de la zero (fără flash) și ajunge complet vizibil înainte de fade', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/', { waitUntil: 'commit' });
    await pagina.locator(STRAT).waitFor({ state: 'attached' });
    const suma = () => pagina.evaluate(() => [...document.querySelectorAll('html > .intro rect.wipe')].reduce((s, r) => s + parseFloat(r.getAttribute('width')), 0));
    const total = await pagina.evaluate(() => [...document.querySelectorAll('html > .intro rect.wipe')].reduce((s, r) => s + parseFloat(r.getAttribute('data-w')), 0));
    assert.ok((await suma()) < total * 0.2, 'la pornire semnătura e (aproape) ascunsă');
    await pagina.waitForFunction(() => document.querySelector('html > .intro.intro--iese'), null, { timeout: 3000 });
    assert.ok(Math.abs((await suma()) - total) < 0.5, 'complet dezvăluită la fade');
    await ctx.close();
  });
});
