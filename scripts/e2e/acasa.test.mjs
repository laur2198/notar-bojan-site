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

describe('Acasă V3b: fotografia din hero', () => {
  const geometrie = (p) =>
    p.evaluate(() => {
      const r = (s) => {
        const b = document.querySelector(s).getBoundingClientRect();
        return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), jos: Math.round(b.bottom) };
      };
      return {
        titlu: r('[data-hero-titlu]'),
        foto: r('[data-hero-foto]'),
        semnatura: r('.hero__semnatura'),
        wordmark: r('[data-hero] [data-wordmark-gigant]'),
        vh: innerHeight,
        clip: getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath,
      };
    });

  for (const [w, h] of [
    [1280, 720],
    [1440, 900],
  ]) {
    it(`desktop ${w}×${h}: titlu stânga, fotografie 4:5 dreapta, semnătura sub titlu, wordmark vizibil complet`, async () => {
      const { p, context } = await pagina({ viewport: { width: w, height: h } });
      await p.goto(`${BAZA}/`, { waitUntil: 'load' });
      await p.waitForTimeout(2500);
      const g = await geometrie(p);
      assert.ok(g.foto.x > g.titlu.x + g.titlu.w - 1, 'fotografia e în dreapta titlului');
      assert.ok(g.titlu.w <= w * 0.52, `titlul ocupă max. ~50% (${g.titlu.w}px)`);
      assert.ok(Math.abs(g.foto.w / g.foto.h - 0.8) < 0.02, `raport 4:5 (${g.foto.w}×${g.foto.h})`);
      assert.ok(g.semnatura.y > g.titlu.jos - 1 && g.semnatura.x < g.foto.x, 'semnătura sub titlu, în stânga');
      assert.ok(g.wordmark.jos <= g.vh, `wordmark-ul se termină la ${g.wordmark.jos}px (fereastra ${g.vh}px)`);
      assert.equal(g.clip, 'none', 'după intrare, fotografia nu mai are mască');
      await context.close();
    });
  }

  it('mobil 390×844: titlu → fotografie 4:3 pe toată lățimea → semnătură', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const g = await geometrie(p);
    assert.ok(g.foto.y > g.titlu.jos - 1, 'fotografia sub titlu');
    assert.ok(g.semnatura.y > g.foto.jos - 1, 'semnătura sub fotografie');
    assert.ok(g.foto.w >= 390 - 2 * 16 - 1, `fotografia pe toată lățimea (${g.foto.w}px)`);
    assert.ok(Math.abs(g.foto.w / g.foto.h - 4 / 3) < 0.02, `raport 4:3 (${g.foto.w}×${g.foto.h})`);
    await context.close();
  });

  it('la intro-gata: mască de jos în sus (clip-path), apoi vizibilă; înainte, acoperită', async () => {
    const { p, context } = await pagina({ introVazut: false, viewport: { width: 1280, height: 720 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'domcontentloaded' });
    const inainte = await p.evaluate(() => getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath);
    assert.match(inainte, /inset\(100%/);
    await p.waitForTimeout(5000);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath), 'none');
    await context.close();
  });

  for (const [nume, optiuni] of [
    ['fără JS', { javaScriptEnabled: false }],
    ['prefers-reduced-motion: reduce', { reducedMotion: 'reduce' }],
  ]) {
    it(`${nume}: fotografia vizibilă direct, fără mască și fără parallax`, async () => {
      const { p, context } = await pagina({ ...optiuni, viewport: { width: 1280, height: 720 } });
      await p.goto(`${BAZA}/`, { waitUntil: 'load' });
      await p.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({
        clip: getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath,
        transform: getComputedStyle(document.querySelector('.hero__foto-cadru')).transform,
      }));
      assert.equal(r.clip, 'none');
      assert.equal(r.transform, 'none');
      await context.close();
    });
  }
});

describe('Fotografiile provizorii (doar în preview)', () => {
  for (const cale of ['/', '/en/', '/servicii/', '/en/services/']) {
    it(`${cale}: fiecare fotografie de stoc are eticheta „Fotografie provizorie”; alt fără marcaje`, async () => {
      const { p, context } = await pagina({ viewport: { width: 1280, height: 900 } });
      await p.goto(BAZA + cale, { waitUntil: 'load' });
      const r = await p.evaluate(() => {
        const imagini = [...document.querySelectorAll('img[src*="fotografii-provizorii"], img[src*="acasa-hero"], img[src*="serviciu-"], img[src*="pas-"]')];
        return {
          imagini: imagini.length,
          etichete: document.querySelectorAll('.foto-provizorie').length,
          altCuMarcaj: imagini.map((i) => i.alt).filter((a) => a.includes('«')),
          altGol: imagini.filter((i) => !i.alt.trim()).length,
        };
      });
      assert.ok(r.imagini > 0, 'pagina are fotografii provizorii');
      assert.ok(r.etichete > 0, 'eticheta apare');
      assert.deepEqual(r.altCuMarcaj, []);
      assert.equal(r.altGol, 0, 'fiecare fotografie are text alternativ');
      await context.close();
    });
  }
});
