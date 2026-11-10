/**
 * Teste e2e pentru ancore (V3): o pagină deschisă direct cu #ancoră ajunge la secțiune și rămâne
 * acolo după ce se încarcă fonturile, modulele de mișcare și ScrollTrigger; un clic pe o ancoră
 * în prima secundă după încărcare duce la secțiune. Rulare: vezi miscare.test.mjs.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BAZA, cuBrowser, pagina } from './util.mjs';

cuBrowser();

/** Poziția secțiunii față de marginea de sus a ferestrei, în px (rotunjit). */
const pozitie = (p, selector) =>
  p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), selector);

/** Marginea de sus a secțiunii trebuie să fie chiar sub navbar (scroll-margin-top), nu în altă parte. */
async function asteaptaLaSectiune(p, selector) {
  const navbar = await p.evaluate(() => document.querySelector('[data-navbar]').getBoundingClientRect().height);
  const top = await pozitie(p, selector);
  assert.ok(top >= -2 && top <= navbar + 40, `${selector}: top ${top} px (navbar ${navbar} px)`);
}

const VIEWPORTURI = [
  ['desktop', { viewport: { width: 1280, height: 720 } }],
  ['mobil', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
];

describe('Ancoră în adresă la încărcare', () => {
  for (const [nume, optiuni] of VIEWPORTURI) {
    for (const [cale, selector] of [
      ['/#faq', '#faq'],
      ['/en/#faq', '#faq'],
      ['/servicii/#onorarii', '#onorarii'],
    ]) {
      it(`${nume} ${cale}: ajunge la secțiune și rămâne după fonturi și ScrollTrigger`, async () => {
        const { p, erori, context } = await pagina(optiuni);
        await p.goto(BAZA + cale, { waitUntil: 'load' });
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(300);
        await asteaptaLaSectiune(p, selector);
        // După ce pornesc modulele (miscare-gata), ScrollTrigger face refresh: poziția rămâne.
        await p.waitForTimeout(3500);
        await asteaptaLaSectiune(p, selector);
        const r = await p.evaluate(() => ({
          intro: document.documentElement.classList.contains('cu-intro'),
          overflow: getComputedStyle(document.documentElement).overflow,
        }));
        assert.equal(r.intro, false, 'intrarea cu ancoră sare intro-ul');
        assert.notEqual(r.overflow, 'hidden', 'derularea nu e blocată');
        assert.deepEqual(erori, []);
        await context.close();
      });
    }
  }
});

describe('Clic pe o ancoră în prima secundă după încărcare', () => {
  for (const [nume, optiuni] of VIEWPORTURI) {
    for (const [cale, selector] of [
      ['/', '#faq'],
      ['/servicii/', '#onorarii'],
    ]) {
      it(`${nume} ${cale} → ${selector}`, async () => {
        const { p, context } = await pagina(optiuni);
        // Intro-ul a rulat deja în sesiune (altfel ecranul lui acoperă pagina și primul clic îl sare).
        await p.addInitScript(() => sessionStorage.setItem('intro-vazut', '1'));
        await p.goto(BAZA + cale, { waitUntil: 'domcontentloaded' });
        // Paginile nu au un link intern spre fiecare secțiune: îl adăugăm, ca un link din conținut.
        await p.evaluate((s) => {
          const a = document.createElement('a');
          a.href = s;
          a.textContent = 'Spre secțiune';
          a.id = 'test-ancora';
          a.style.cssText = 'position:fixed;left:8px;top:120px;z-index:99;background:#fff;padding:12px';
          document.body.append(a);
        }, selector);
        await p.waitForTimeout(400);
        await p.click('#test-ancora');
        // Derularea lină (CSS) + refresh-ul ScrollTrigger: la final, secțiunea e sub navbar.
        await p.waitForTimeout(4000);
        await asteaptaLaSectiune(p, selector);
        assert.equal(new URL(p.url()).hash, selector);
        await context.close();
      });
    }
  }
});
