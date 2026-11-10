/**
 * Teste e2e pentru intro și mișcare, pe ghidul /stil/ (CLAUDE.md §3.2, §5), cu CSP-ul real din
 * public/_headers aplicat răspunsurilor HTML (util.mjs).
 *
 * Rulare (cu `npm run build` și `npm run preview` pornit; Playwright și Chromium sunt preinstalate
 * în mediul de lucru, nu sunt dependențe ale proiectului):
 *   E2E_URL=http://localhost:4321 npm run test:e2e
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BAZA, cuBrowser, pagina } from './util.mjs';

const STIL = `${BAZA}/stil/`;

cuBrowser();

describe('CSP', () => {
  for (const cale of ['/stil/', '/', '/servicii/succesiune/']) {
    it(`${cale}: nicio eroare în consolă (inclusiv CSP)`, async () => {
      const { p, erori, context } = await pagina();
      await p.goto(BAZA + cale, { waitUntil: 'load' });
      await p.waitForTimeout(500);
      assert.deepEqual(erori, []);
      await context.close();
    });
  }
});

describe('SplitText rămâne accesibil', () => {
  it('titlul: aria-label cu textul întreg, rândurile aria-hidden', async () => {
    const { p, context } = await pagina();
    await p.goto(STIL, { waitUntil: 'load' });
    const titlu = p.locator('h3[data-reveal]');
    await titlu.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1200);
    const r = await titlu.evaluate((el) => ({
      eticheta: el.getAttribute('aria-label'),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      randuri: el.querySelectorAll('[aria-hidden="true"]').length,
      vizibil: getComputedStyle(el).visibility,
    }));
    assert.equal(r.eticheta, r.text);
    assert.ok(r.randuri > 0, 'rândurile împărțite sunt aria-hidden');
    assert.equal(r.vizibil, 'visible');
    const accesibil = await p.getByRole('heading', { name: r.text }).count();
    assert.equal(accesibil, 1);
    await context.close();
  });

  it('paragraful: fără aria-label pe <p>; o copie sr-only a textului, împărțirea aria-hidden', async () => {
    const { p, context } = await pagina();
    await p.goto(STIL, { waitUntil: 'load' });
    const r = await p.locator('p[data-reveal]').evaluate((el) => ({
      eticheta: el.getAttribute('aria-label'),
      copie: el.querySelector(':scope > .sr-only')?.textContent,
      ascuns: el.querySelector(':scope > [aria-hidden="true"]') !== null,
    }));
    assert.equal(r.eticheta, null);
    assert.match(r.copie ?? '', /^Pregătim dosarul înainte de programare/);
    assert.ok(r.ascuns);
    await context.close();
  });
});

describe('Mișcare redusă și fără JS: totul vizibil, niciun intro', () => {
  for (const [nume, optiuni] of [
    ['prefers-reduced-motion: reduce', { reducedMotion: 'reduce' }],
    ['fără JS', { javaScriptEnabled: false }],
  ]) {
    it(nume, async () => {
      const { p, context } = await pagina(optiuni);
      await p.goto(`${STIL}#intro`, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => ({
        clase: document.documentElement.className,
        intro: getComputedStyle(document.querySelector('[data-intro]')).display,
        reveal: [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).visibility),
        divider: getComputedStyle(document.querySelector('[data-divider]')).transform,
        overflow: getComputedStyle(document.documentElement).overflow,
        butonIntro: document.querySelector('[data-reda-intro]').hidden,
      }));
      assert.doesNotMatch(r.clase, /cu-intro|miscare/);
      assert.equal(r.intro, 'none');
      assert.ok(r.reveal.every((v) => v === 'visible'));
      assert.equal(r.divider, 'none');
      assert.notEqual(r.overflow, 'hidden');
      assert.equal(r.butonIntro, true);
      await context.close();
    });
  }
});

describe('Intro-ul', () => {
  it('#intro: ecran alb (V3b), desen, urcare, intro-gata la jumătatea urcării, apoi pagina liberă', async () => {
    const { p, erori, context } = await pagina();
    await p.addInitScript(() => {
      window.__gata = null;
      document.addEventListener('intro-gata', () => (window.__gata = performance.now()));
    });
    await p.goto(`${STIL}#intro`, { waitUntil: 'domcontentloaded' });
    const start = await p.evaluate(() => ({
      cuIntro: document.documentElement.classList.contains('cu-intro'),
      overflow: getComputedStyle(document.documentElement).overflow,
      fundal: getComputedStyle(document.querySelector('[data-intro]')).backgroundColor,
      aria: document.querySelector('[data-intro]').getAttribute('aria-hidden'),
      inert: document.querySelector('[data-intro]').inert,
      t0: performance.now(),
    }));
    assert.equal(start.cuIntro, true);
    assert.equal(start.overflow, 'hidden');
    assert.equal(start.fundal, 'rgb(255, 255, 255)');
    assert.equal(start.aria, 'true');
    assert.equal(start.inert, true);

    // Focusul nu intră în intro: primul Tab ajunge în pagină.
    await p.waitForTimeout(3600);
    const final = await p.evaluate(() => ({
      cuIntro: document.documentElement.classList.contains('cu-intro'),
      gata: window.__gata,
      intro: getComputedStyle(document.querySelector('[data-intro]')).display,
    }));
    assert.equal(final.cuIntro, false);
    assert.equal(final.intro, 'none');
    assert.ok(final.gata !== null, 'intro-gata a fost emis');
    // Desen 1.8 s + pauză 0.4 s + jumătate din urcare (0.5 s) ≈ 2.7 s de la pornire.
    const dupa = final.gata - start.t0;
    assert.ok(dupa > 2300 && dupa < 3300, `intro-gata la ${Math.round(dupa)} ms`);
    assert.deepEqual(erori, []);
    await context.close();
  });

  it('o tastă îl sare: ecranul urcă imediat, semnătura apare completă', async () => {
    const { p, context } = await pagina();
    await p.goto(`${STIL}#intro`, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    await p.keyboard.press('Space');
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({
      transform: document.querySelector('[data-intro]').style.transform,
      offset: getComputedStyle(document.querySelector('[data-intro] path[data-a]:last-of-type')).strokeDashoffset,
    }));
    assert.equal(r.transform, 'translateY(-101%)');
    assert.equal(r.offset, '0px');
    await p.waitForTimeout(1100);
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('cu-intro')), false);
    await context.close();
  });

  it('fără intro, intro-gata se emite la încărcare', async () => {
    const { p, context } = await pagina();
    await p.goto(STIL, { waitUntil: 'load' });
    await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('intro-gata')), true);
    await context.close();
  });

  it('„Redă intro-ul” îl pornește din nou', async () => {
    const { p, context } = await pagina();
    await p.goto(STIL, { waitUntil: 'load' });
    await p.locator('[data-reda-intro]').click();
    await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('cu-intro')), true);
    await context.close();
  });
});
