/**
 * Teste e2e pentru pagina Acasă (V3): intro-ul automat, intrarea hero-ului, tastatura (întrebări
 * și pași), conținutul complet fără JS și la mișcare redusă, CSP. Rulare: vezi miscare.test.mjs.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BAZA, cuBrowser, pagina } from './util.mjs';

cuBrowser();

describe('Acasă: intro și hero', () => {
  it('prima intrare din sesiune: intro-ul pornește singur; hero-ul intră la intro-gata; a doua oară fără intro', async () => {
    const { p, erori, context } = await pagina({ introVazut: false });
    await p.goto(`${BAZA}/`, { waitUntil: 'domcontentloaded' });
    const inceput = await p.evaluate(() => ({
      intro: document.documentElement.classList.contains('cu-intro'),
      titlu: getComputedStyle(document.querySelector('[data-hero-titlu]')).visibility,
    }));
    assert.equal(inceput.intro, true);
    assert.equal(inceput.titlu, 'hidden', 'titlul așteaptă intro-gata');
    await p.waitForTimeout(4500);
    const dupa = await p.evaluate(() => ({
      clase: document.documentElement.className,
      titlu: getComputedStyle(document.querySelector('[data-hero-titlu]')).visibility,
      wordmark: getComputedStyle(document.querySelector('[data-hero-wordmark]')).visibility,
    }));
    assert.match(dupa.clase, /hero-pornit/);
    assert.doesNotMatch(dupa.clase, /cu-intro/);
    assert.equal(dupa.titlu, 'visible');
    assert.equal(dupa.wordmark, 'visible');
    await p.goto(`${BAZA}/en/`, { waitUntil: 'domcontentloaded' });
    assert.equal(await p.evaluate(() => document.documentElement.classList.contains('cu-intro')), false);
    assert.deepEqual(erori, []);
    await context.close();
  });

  it('titlul h1 rămâne accesibil cu textul întreg după împărțire', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const n = await p.getByRole('heading', { level: 1, name: /Acte notariale pregătite din timp/ }).count();
    assert.equal(n, 1);
    assert.equal(await p.locator('h1').count(), 1);
    await context.close();
  });
});

describe('Acasă: tastatura', () => {
  it('întrebările: Enter deschide, deschiderea alteia o închide pe prima (details name), Space închide', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/#faq`, { waitUntil: 'load' });
    const sumare = p.locator('#faq summary');
    assert.ok((await sumare.count()) >= 2);
    await sumare.nth(0).focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    const deschise = () => p.evaluate(() => [...document.querySelectorAll('#faq details')].map((d) => d.open));
    assert.deepEqual((await deschise()).slice(0, 2), [true, false]);
    await p.keyboard.press('Tab');
    assert.ok(await p.evaluate(() => document.activeElement?.matches('#faq details:nth-child(2) summary')), 'Tab ajunge la a doua întrebare');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    assert.deepEqual((await deschise()).slice(0, 2), [false, true]);
    await p.keyboard.press('Space');
    await p.waitForTimeout(100);
    assert.ok((await deschise()).every((o) => !o));
    // Focusul vizibil: contur de 3 px.
    const contur = await p.evaluate(() => getComputedStyle(document.activeElement).outlineWidth);
    assert.equal(contur, '3px');
    await context.close();
  });

  it('pașii: Tab mută pasul activ (aria-expanded, textul și imaginea lui)', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/#pasi`, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const stare = () =>
      p.evaluate(() => ({
        expandat: [...document.querySelectorAll('#pasi .pas__buton')].map((b) => b.getAttribute('aria-expanded')),
        text: [...document.querySelectorAll('#pasi .pas__text')].map((t) => getComputedStyle(t).display !== 'none'),
        img: [...document.querySelectorAll('#pasi [data-pas-img]')].map((i) => i.classList.contains('pasi__cadru--activ')),
      }));
    const initial = await stare();
    assert.equal(initial.expandat[0], 'true');
    assert.ok(initial.expandat.slice(1).every((e) => e === 'false'));
    await p.locator('#pasi .pas__buton').nth(0).focus();
    await p.keyboard.press('Tab');
    const al2 = await stare();
    assert.deepEqual(al2.expandat.slice(0, 2), ['false', 'true']);
    assert.deepEqual(al2.text.slice(0, 2), [false, true]);
    assert.deepEqual(al2.img.slice(0, 2), [false, true]);
    await p.keyboard.press('Shift+Tab');
    await p.keyboard.press('Enter');
    assert.deepEqual((await stare()).expandat.slice(0, 2), ['true', 'false']);
    await context.close();
  });
});

describe('Acasă: conținut complet fără JS și la mișcare redusă', () => {
  for (const [nume, optiuni] of [
    ['fără JS', { javaScriptEnabled: false }],
    ['prefers-reduced-motion: reduce', { reducedMotion: 'reduce' }],
  ]) {
    for (const cale of ['/', '/en/']) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
        it(`${nume} ${cale} ${viewport.width}px`, async () => {
          const { p, erori, context } = await pagina({ ...optiuni, viewport, introVazut: false });
          await p.goto(BAZA + cale, { waitUntil: 'load' });
          await p.waitForTimeout(500);
          const r = await p.evaluate(() => {
            const vizibil = (el) => {
              const s = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              return s.visibility === 'visible' && s.display !== 'none' && Number(s.opacity) === 1 && r.height > 0;
            };
            const toate = (sel) => [...document.querySelectorAll(sel)].map(vizibil);
            return {
              clase: document.documentElement.className,
              intro: getComputedStyle(document.querySelector('[data-intro]')).display,
              titlu: vizibil(document.querySelector('[data-hero-titlu]')),
              wordmark: vizibil(document.querySelector('[data-hero-wordmark]')),
              semnatura: [...document.querySelectorAll('[data-hero] path[data-a]')].every(
                (path) => Number.parseFloat(getComputedStyle(path).strokeDashoffset) === 0,
              ),
              fraze: toate('[data-fraza]'),
              pasi: toate('#pasi .pas__text'),
              intrebari: document.querySelectorAll('#faq details').length,
              reveal: toate('[data-reveal]'),
              benzi: document.querySelectorAll('[data-shutter] i').length,
              lat: document.documentElement.scrollWidth <= innerWidth,
            };
          });
          assert.doesNotMatch(r.clase, /cu-intro|(^| )miscare( |$)/);
          assert.equal(r.intro, 'none');
          assert.ok(r.titlu && r.wordmark, 'hero vizibil');
          assert.ok(r.semnatura, 'semnătura desenată');
          assert.equal(r.fraze.length, 3);
          assert.ok(r.fraze.every(Boolean), 'toate frazele mari, una sub alta');
          assert.ok(r.pasi.length >= 3 && r.pasi.every(Boolean), 'toți pașii cu textul lor');
          assert.ok(r.intrebari >= 1);
          assert.ok(r.reveal.every(Boolean));
          assert.equal(r.benzi, 0, 'fără benzile shutter-ului');
          assert.ok(r.lat, 'fără derulare orizontală');
          assert.deepEqual(erori, []);
          await context.close();
        });
      }
    }
  }
});

describe('CSP pe Acasă EN', () => {
  it('/en/: nicio eroare în consolă', async () => {
    const { p, erori, context } = await pagina();
    await p.goto(`${BAZA}/en/`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    await p.evaluate(() => scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' }));
    await p.waitForTimeout(500);
    assert.deepEqual(erori, []);
    await context.close();
  });
});
