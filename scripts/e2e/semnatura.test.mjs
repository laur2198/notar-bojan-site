/**
 * Semnătura din hero (Acasă RO și EN): marcaj decorativ, dezvăluirea prin clipPath și stările ei.
 * Rulare: npm run build && npm run test:e2e
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { incarcaPlaywright, serveste } from './util.mjs';

const playwright = incarcaPlaywright();
const SVG = '.hero [data-semnatura="hero"]';
/** Numărul de segmente declarat în src/assets/semnatura.svg (data-segmente). */
const SEGMENTE = Number(readFileSync(resolve('src/assets/semnatura.svg'), 'utf8').match(/<svg\b[^>]*\sdata-segmente="(\d+)"/)[1]);

/** [width, data-w] pentru fiecare dreptunghi al semnăturii din hero. */
const latimi = (pagina) => pagina.locator(`${SVG} rect.wipe`).evaluateAll((r) => r.map((x) => [parseFloat(x.getAttribute('width')), parseFloat(x.getAttribute('data-w'))]));

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
  async function fara_intro(optiuni = {}) {
    const ctx = await browser.newContext({ reducedMotion: 'no-preference', ...optiuni });
    const pagina = await ctx.newPage();
    const erori = [];
    pagina.on('pageerror', (e) => erori.push(e.message));
    pagina.on('console', (m) => m.type() === 'error' && erori.push(m.text()));
    if (optiuni.javaScriptEnabled !== false) await pagina.addInitScript(() => sessionStorage.setItem('intro-vazut', '1'));
    return { ctx, pagina, erori };
  }

  for (const cale of ['/', '/en/']) {
    test(`${cale}: segmentele declarate în fișier (data-segmente), cu clipPath, forme umplute, aria-hidden, fără punct`, async () => {
      const { ctx, pagina } = await fara_intro({ reducedMotion: 'reduce' });
      await pagina.goto(server.url + cale);
      const svg = pagina.locator(SVG);
      assert.equal(await svg.count(), 1);
      assert.equal(await svg.getAttribute('aria-hidden'), 'true');
      assert.equal(await svg.getAttribute('focusable'), 'false');
      assert.equal(await svg.locator('g[data-segment][clip-path]').count(), SEGMENTE);
      assert.equal(await svg.locator('rect.wipe').count(), SEGMENTE);
      assert.equal(await svg.locator('circle').count(), 0);
      const culori = await svg.evaluate((s) => ({ fill: getComputedStyle(s).fill, stroke: getComputedStyle(s).stroke }));
      assert.equal(culori.fill, 'rgb(201, 174, 148)', 'fill wood-300 pe hero-ul închis');
      assert.equal(culori.stroke, 'none');
      await ctx.close();
    });
  }

  test('linia de dedesubt e la data-linie-y și ține cât containerul', async () => {
    const { ctx, pagina } = await fara_intro({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await pagina.goto(server.url + '/');
    const r = await pagina.evaluate(() => {
      const svg = document.querySelector('.hero [data-semnatura="hero"]');
      const linie = svg.querySelector('.semnatura__linie');
      const [, , , h] = svg.getAttribute('viewBox').split(' ').map(Number);
      const y = Number(svg.getAttribute('data-linie-y') ?? 0) || Number(linie.getAttribute('y1'));
      const cutie = svg.getBoundingClientRect();
      const rand = svg.closest('.hero__rand').getBoundingClientRect();
      const lr = linie.getBoundingClientRect();
      return { asteptat: cutie.top + (cutie.height * y) / h, linie: lr.top, stanga: lr.left, randStanga: rand.left, randDreapta: rand.right, dreaptaVizibila: Math.min(lr.right, rand.right) };
    });
    assert.ok(Math.abs(r.linie - r.asteptat) <= 1, `linia la ${r.linie}, așteptat ${r.asteptat}`);
    assert.ok(Math.abs(r.stanga - r.randStanga) <= 1);
    assert.ok(Math.abs(r.dreaptaVizibila - r.randDreapta) <= 1);
    await ctx.close();
  });

  test('prefers-reduced-motion: complet vizibilă de la încărcare (width = data-w)', async () => {
    const { ctx, pagina } = await fara_intro({ reducedMotion: 'reduce' });
    await pagina.goto(server.url + '/');
    for (const [w, dw] of await latimi(pagina)) assert.equal(w, dw);
    await pagina.waitForTimeout(600);
    for (const [w, dw] of await latimi(pagina)) assert.equal(w, dw);
    await ctx.close();
  });

  test('fără JS: complet vizibilă (width = data-w)', async () => {
    const { ctx, pagina } = await fara_intro({ javaScriptEnabled: false });
    await pagina.goto(server.url + '/');
    assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), false);
    for (const [w, dw] of await latimi(pagina)) assert.equal(w, dw);
    await ctx.close();
  });

  test('cu JS: pornește de la zero, se dezvăluie secvențial și ajunge completă după 3.5 s', async () => {
    const { ctx, pagina, erori } = await fara_intro();
    await pagina.goto(server.url + '/', { waitUntil: 'commit' });
    await pagina.locator(`${SVG} rect.wipe`).first().waitFor({ state: 'attached' });
    const start = await latimi(pagina);
    assert.ok(start.reduce((s, [w]) => s + w, 0) < start.reduce((s, [, dw]) => s + dw, 0) * 0.1, 'la pornire e (aproape) ascunsă');
    await pagina.waitForTimeout(1500);
    const mijloc = await latimi(pagina);
    // Secvențial: un prefix de segmente complete, cel mult unul parțial, restul la 0.
    const stari = mijloc.map(([w, dw]) => (w >= dw - 0.01 ? 'complet' : w <= 0.01 ? 'zero' : 'partial'));
    const sir = stari.join(',');
    assert.match(sir, /^(complet,)*(partial,)?(zero,?)*$|^(complet,?)*$/, sir);
    assert.ok(stari.includes('complet') && stari.includes('zero'), 'la 1.5 s e la mijlocul gestului');
    await pagina.waitForTimeout(2600);
    for (const [w, dw] of await latimi(pagina)) assert.ok(Math.abs(w - dw) < 0.01);
    assert.deepEqual(erori, []);
    await ctx.close();
  });
});
