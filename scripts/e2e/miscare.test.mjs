/**
 * Teste e2e pentru mișcare, pe ghidul /stil/ (CLAUDE.md §3.2, §5), cu CSP-ul real din
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

describe('Mișcare redusă și fără JS: totul vizibil, nimic ascuns', () => {
  for (const [nume, optiuni] of [
    ['prefers-reduced-motion: reduce', { reducedMotion: 'reduce' }],
    ['fără JS', { javaScriptEnabled: false }],
  ]) {
    it(nume, async () => {
      const { p, context } = await pagina(optiuni);
      await p.goto(STIL, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => ({
        clase: document.documentElement.className,
        intro: document.querySelectorAll('[data-intro]').length,
        reveal: [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).visibility),
        divider: getComputedStyle(document.querySelector('[data-divider]')).transform,
        overflow: getComputedStyle(document.documentElement).overflow,
        pete: [...document.querySelectorAll('[data-viu-pata]')].map((e) => getComputedStyle(e).transform),
      }));
      assert.doesNotMatch(r.clase, /miscare/);
      assert.equal(r.intro, 0, 'fără intro (scos în V3d)');
      assert.ok(r.reveal.every((v) => v === 'visible'));
      assert.equal(r.divider, 'none');
      assert.notEqual(r.overflow, 'hidden');
      assert.ok(r.pete.length > 0 && r.pete.every((t) => t === 'none'), 'petele fundalului viu, statice');
      await context.close();
    });
  }
});

describe('Fără intro (V3d)', () => {
  it('nicio clasă și niciun strat de intro, nici cu #intro în adresă; derularea liberă', async () => {
    const { p, erori, context } = await pagina();
    await p.goto(`${STIL}#intro`, { waitUntil: 'domcontentloaded' });
    const r = await p.evaluate(() => ({
      clase: document.documentElement.className,
      strat: document.querySelectorAll('[data-intro]').length,
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    assert.doesNotMatch(r.clase, /cu-intro|intro-/);
    assert.equal(r.strat, 0);
    assert.notEqual(r.overflow, 'hidden');
    assert.deepEqual(erori, []);
    await context.close();
  });
});
