/**
 * Semnătura din hero (Acasă RO și EN): marcaj decorativ, desenul prin stroke-dashoffset și stările lui.
 * Rulare: npm run build && npm run test:e2e
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { incarcaPlaywright, serveste } from './util.mjs';

const playwright = incarcaPlaywright();
const SVG = '.hero [data-semnatura="hero"]';
/** Numărul de path-uri declarat în src/assets/semnatura.svg (data-segmente). */
const SEGMENTE = Number(readFileSync(resolve('src/assets/semnatura.svg'), 'utf8').match(/<svg\b[^>]*\sdata-segmente="(\d+)"/)[1]);

/** stroke-dashoffset-ul calculat al fiecărui path al semnăturii din hero (0 = desenat, 100 = ascuns). */
const offseturi = (pagina, selector = SVG) =>
  pagina.locator(`${selector} path[data-a]`).evaluateAll((p) => p.map((x) => Number(getComputedStyle(x).strokeDashoffset.match(/-?[\d.]+/)[0])));

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

  /** Pagină fără intro (sesiune deja „văzută”). */
  async function faraIntro(optiuni = {}) {
    const ctx = await browser.newContext({ reducedMotion: 'no-preference', ...optiuni });
    const pagina = await ctx.newPage();
    const erori = [];
    pagina.on('pageerror', (e) => erori.push(e.message));
    pagina.on('console', (m) => m.type() === 'error' && erori.push(m.text()));
    if (optiuni.javaScriptEnabled !== false) await pagina.addInitScript(() => sessionStorage.setItem('intro-vazut', '1'));
    return { ctx, pagina, erori };
  }

  for (const cale of ['/', '/en/']) {
    test(`${cale}: path-urile declarate (data-segmente), pathLength 100, stroke wood-300, aria-hidden`, async () => {
      const { ctx, pagina } = await faraIntro({ reducedMotion: 'reduce' });
      await pagina.goto(server.url + cale);
      const svg = pagina.locator(SVG);
      assert.equal(await svg.count(), 1);
      assert.equal(await svg.getAttribute('aria-hidden'), 'true');
      assert.equal(await svg.getAttribute('focusable'), 'false');
      const trasee = svg.locator('path[data-a]');
      assert.equal(await trasee.count(), SEGMENTE);
      assert.ok((await trasee.evaluateAll((p) => p.map((x) => x.getAttribute('pathLength')))).every((l) => l === '100'));
      assert.equal(await svg.locator('clipPath, circle').count(), 0);
      const stil = await svg.evaluate((s) => ({ fill: getComputedStyle(s).fill, stroke: getComputedStyle(s).stroke }));
      assert.equal(stil.stroke, 'rgb(201, 174, 148)', 'stroke wood-300 pe hero-ul închis');
      assert.equal(stil.fill, 'none');
      await ctx.close();
    });
  }

  test('linia de dedesubt e la data-linie-y și ține cât containerul', async () => {
    const { ctx, pagina } = await faraIntro({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await pagina.goto(server.url + '/');
    const r = await pagina.evaluate(() => {
      const svg = document.querySelector('.hero [data-semnatura="hero"]');
      const linie = svg.querySelector('.semnatura__linie');
      const [, , , h] = svg.getAttribute('viewBox').split(' ').map(Number);
      const y = Number(linie.getAttribute('y1'));
      const cutie = svg.getBoundingClientRect();
      const rand = svg.closest('.hero__rand').getBoundingClientRect();
      const lr = linie.getBoundingClientRect();
      return { asteptat: cutie.top + (cutie.height * y) / h, linie: lr.top + lr.height / 2, stanga: lr.left, randStanga: rand.left, randDreapta: rand.right, dreaptaVizibila: Math.min(lr.right, rand.right) };
    });
    const linieY = Number(readFileSync(resolve('src/assets/semnatura.svg'), 'utf8').match(/data-linie-y="([^"]+)"/)[1]);
    assert.ok(Math.abs(r.linie - r.asteptat) <= 1, `linia la ${r.linie}, așteptat ${r.asteptat} (data-linie-y ${linieY})`);
    assert.ok(Math.abs(r.stanga - r.randStanga) <= 1);
    assert.ok(Math.abs(r.dreaptaVizibila - r.randDreapta) <= 1);
    await ctx.close();
  });

  test('prefers-reduced-motion: desenată complet de la încărcare (dashoffset 0)', async () => {
    const { ctx, pagina } = await faraIntro({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    assert.ok((await offseturi(pagina)).every((o) => o === 0));
    await pagina.waitForTimeout(600);
    assert.ok((await offseturi(pagina)).every((o) => o === 0));
    await ctx.close();
  });

  test('fără JS: desenată complet (dashoffset 0)', async () => {
    const { ctx, pagina } = await faraIntro({ javaScriptEnabled: false });
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), false);
    assert.ok((await offseturi(pagina)).every((o) => o === 0));
    await ctx.close();
  });

  test('cu JS: pornește nedesenată, se desenează secvențial și e completă după 3.5 s', async () => {
    const { ctx, pagina, erori } = await faraIntro();
    await pagina.goto(server.url + '/', { waitUntil: 'commit' });
    await pagina.locator(`${SVG} path[data-a]`).first().waitFor({ state: 'attached' });
    const start = await offseturi(pagina);
    assert.ok(start.reduce((s, o) => s + o, 0) > 90 * start.length, 'la pornire e (aproape) nedesenată');
    await pagina.waitForTimeout(1500);
    // Secvențial: un prefix de path-uri desenate, cel mult unul parțial, restul nedesenate.
    const stari = (await offseturi(pagina)).map((o) => (o <= 0.01 ? 'gata' : o >= 99.99 ? 'nu' : 'partial'));
    assert.match(stari.join(','), /^(gata,)*(partial,)?(nu,?)*$|^(gata,?)*$/, stari.join(','));
    assert.ok(stari.includes('gata') && stari.includes('nu'), 'la 1.5 s e la mijlocul gestului');
    await pagina.waitForTimeout(2600);
    assert.ok((await offseturi(pagina)).every((o) => o < 0.01));
    assert.deepEqual(erori, []);
    await ctx.close();
  });
});
