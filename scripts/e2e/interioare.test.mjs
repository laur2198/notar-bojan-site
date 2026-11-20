/**
 * Teste e2e pentru paginile interioare (V4, CLAUDE.md §5 „Paginile interioare”): AntetPagina,
 * CtaFinal (în afară de Confidențialitate și 404), un singur h1, coloana laterală a paginii de
 * serviciu (sticky pe desktop, sub conținut pe mobil), înălțimea minimă a secțiunilor cu fundal viu
 * și lipsa claselor vechi .btn. Rulare: vezi miscare.test.mjs.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BAZA, cuBrowser, pagina } from './util.mjs';

cuBrowser();

/** [cale, are CtaFinal]. 404: orice adresă inexistentă (preview-ul servește 404.html). */
const PAGINI = [
  ['/despre/', true],
  ['/servicii/', true],
  ['/servicii/vanzare-cumparare/', true],
  ['/programare/', true],
  ['/intrebari-frecvente/', true],
  ['/recenzii/', true],
  ['/contact/', true],
  ['/confidentialitate/', false],
  ['/pagina-inexistenta/', false],
  ['/en/services/', true],
  ['/en/appointments/', true],
  ['/en/faq/', true],
  ['/en/contact/', true],
];

/** Copia lui inaltimeMinima din src/lib/fundal-viu.ts (seed 5 = capul paginilor, 26rem). */
const inaltimeMinima = (seed, latime) => (seed === 1 ? (latime < 992 ? latime : 0.4 * latime) : seed === 5 ? 416 : 500);

describe('Paginile interioare: structura comună', () => {
  for (const [cale, cuCta] of PAGINI) {
    it(`${cale}: AntetPagina, un singur h1 în ea, ${cuCta ? 'CtaFinal la final' : 'fără CtaFinal'}, fără .btn, fără erori`, async () => {
      const { p, erori, context } = await pagina({ viewport: { width: 1440, height: 900 } });
      await p.goto(BAZA + cale, { waitUntil: 'load' });
      const r = await p.evaluate(() => {
        const main = document.querySelector('main');
        const antet = document.querySelectorAll('[data-antet]');
        const cta = document.querySelectorAll('[data-cta-final]');
        return {
          antet: antet.length,
          antetPrimul: main.firstElementChild?.matches('[data-antet]') || main.querySelector(':scope > [data-antet]') === main.querySelector('[data-antet]'),
          h1: document.querySelectorAll('h1').length,
          h1InAntet: !!document.querySelector('[data-antet] h1'),
          cta: cta.length,
          ctaUltimul: cta.length ? !cta[0].nextElementSibling : null,
          btn: document.querySelectorAll('.btn').length,
          wordmarkInAntet: document.querySelectorAll('[data-antet] [data-wordmark-gigant]').length,
          lat: document.documentElement.scrollWidth <= innerWidth,
        };
      });
      assert.equal(r.antet, 1, 'un singur AntetPagina');
      assert.ok(r.antetPrimul, 'AntetPagina e primul bloc din <main>');
      assert.equal(r.h1, 1, 'un singur h1');
      assert.ok(r.h1InAntet, 'h1 e în AntetPagina');
      assert.equal(r.cta, cuCta ? 1 : 0);
      if (cuCta) assert.equal(r.ctaUltimul, true, 'CtaFinal e ultimul bloc din <main>');
      assert.equal(r.btn, 0, 'fără clasele vechi .btn');
      assert.equal(r.wordmarkInAntet, 0, 'fără wordmark-ul gigant în cap');
      assert.ok(r.lat, 'fără derulare orizontală');
      // Pe 404, statusul documentului apare în consolă ca „Failed to load resource … 404”: e așteptat.
      assert.deepEqual(cuCta ? erori : erori.filter((e) => !/status of 404/.test(e)), []);
      await context.close();
    });
  }
});

describe('Pagina de serviciu: coloana laterală', () => {
  it('desktop 1440 px: CasetaDosar în dreapta conținutului, position: sticky sub navbar', async () => {
    const { p, context } = await pagina({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BAZA}/servicii/vanzare-cumparare/`, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const caseta = document.querySelector('[data-caseta-dosar]');
      const continut = document.querySelector('.serviciu__continut');
      const c = caseta.getBoundingClientRect();
      const t = continut.getBoundingClientRect();
      return { position: getComputedStyle(caseta).position, top: getComputedStyle(caseta).top, dreapta: c.left >= t.right - 1, sus: Math.abs(c.top - t.top) < 40 };
    });
    assert.equal(r.position, 'sticky');
    assert.ok(Number.parseFloat(r.top) >= 80, `top: ${r.top} (sub navbar)`);
    assert.ok(r.dreapta && r.sus, 'caseta e coloana din dreapta');
    await context.close();
  });

  it('mobil 390 px: CasetaDosar sub conținut, fără sticky', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/servicii/vanzare-cumparare/`, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const caseta = document.querySelector('[data-caseta-dosar]');
      const continut = document.querySelector('.serviciu__continut');
      return { position: getComputedStyle(caseta).position, sub: caseta.getBoundingClientRect().top >= continut.getBoundingClientRect().bottom - 1 };
    });
    assert.equal(r.position, 'static');
    assert.ok(r.sub, 'caseta e sub conținut');
    await context.close();
  });
});

describe('Paginile interioare: fundalul viu și înălțimea minimă a secțiunilor', () => {
  for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1440, 900], [2560, 1080]]) {
    it(`${w}×${h}: fiecare secțiune cu fundal viu e cel puțin cât minimul seed-ului ei`, async () => {
      const { p, context } = await pagina({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      for (const [cale] of PAGINI) {
        await p.goto(BAZA + cale, { waitUntil: 'load' });
        const r = await p.evaluate(() =>
          [...document.querySelectorAll('[data-fundal-viu]')].map((v) => ({ seed: Number(v.className.match(/viu--seed-(\d)/)[1]), h: v.getBoundingClientRect().height })),
        );
        for (const { seed, h: inaltime } of r) {
          assert.ok(inaltime >= inaltimeMinima(seed, w) - 0.5, `${cale} seed ${seed}: ${Math.round(inaltime)} px < ${inaltimeMinima(seed, w)} px`);
        }
      }
      await context.close();
    });
  }
});
