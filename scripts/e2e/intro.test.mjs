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
    assert.equal(await pagina.locator('svg.semnatura').count(), 2);
    assert.equal(await pagina.locator('circle, .semnatura__punct').count(), 0);
    const iduri = await pagina.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id));
    assert.equal(new Set(iduri).size, iduri.length, 'id-uri duplicate în pagină');
    // Orice referință url(#…) din semnături trimite la un element din același SVG.
    const gresite = await pagina.evaluate(() =>
      [...document.querySelectorAll('svg.semnatura *')].flatMap((el) =>
        [...el.attributes].map((a) => a.value.match(/url\(#([^)]+)\)/)?.[1]).filter(Boolean).filter((id) => document.getElementById(id)?.closest('svg') !== el.closest('svg')),
      ).length,
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

  test('după intro, semnătura din hero e desenată complet, fără animație (dashoffset 0)', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('intro-rulat')), true);
    const offseturi = () => pagina.locator('.hero [data-semnatura="hero"] path[data-a]').evaluateAll((p) => p.map((x) => Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0])));
    assert.ok((await offseturi()).every((o) => o === 0));
    await pagina.waitForTimeout(500);
    assert.ok((await offseturi()).every((o) => o === 0));
    await ctx.close();
  });

  test('intro-ul pornește nedesenat (fără flash) și e desenat complet înainte de fade', async () => {
    const { ctx, pagina } = await context();
    await pagina.goto(server.url + '/', { waitUntil: 'commit' });
    await pagina.locator(STRAT).waitFor({ state: 'attached' });
    const offseturi = () => pagina.evaluate(() => [...document.querySelectorAll('html > .intro path[data-a]')].map((x) => Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0])));
    const start = await offseturi();
    assert.ok(start.length > 0);
    assert.ok(start.reduce((s, o) => s + o, 0) > 80 * start.length, 'la pornire semnătura e (aproape) nedesenată');
    await pagina.waitForFunction(() => document.querySelector('html > .intro.intro--iese'), null, { timeout: 3000 });
    assert.ok((await offseturi()).every((o) => o < 0.01), 'desenată complet la fade');
    await ctx.close();
  });
});
