/**
 * Teste e2e pentru scheletul design-v2 (V2): navbar-ul transparent (contrastul față de fundalul de
 * sub el), meniul compact de la tastatură, butonul cu text dublat, cursorul și shutter-ul.
 * Rulare: vezi miscare.test.mjs (npm run build, npm run preview, npm run test:e2e).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BAZA, cuBrowser, pagina } from './util.mjs';

cuBrowser();

/** Raportul de contrast WCAG între două culori `rgb(...)` / `rgba(...)` opace. */
function contrast(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Culoarea textului navbar-ului și fundalul opac de sub wordmark, la mijlocul înălțimii lui. */
function masoaraNavbar() {
  const antet = document.querySelector('[data-navbar]');
  const wordmark = antet.querySelector('.wordmark');
  const r = wordmark.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = antet.getBoundingClientRect().height / 2;
  let fundal = 'rgb(255, 255, 255)';
  for (const el of document.elementsFromPoint(x, y)) {
    if (antet.contains(el)) continue;
    const c = getComputedStyle(el).backgroundColor;
    const alfa = c.startsWith('rgba') ? Number(c.match(/[\d.]+/g)[3]) : 1;
    if (alfa > 0.5) {
      fundal = c;
      break;
    }
  }
  return { text: getComputedStyle(antet).color, fundal, tema: antet.dataset.tema };
}

describe('Navbar-ul transparent: contrast față de fundalul de sub el', () => {
  for (const cale of ['/', '/stil/', '/servicii/succesiune/']) {
    for (const latime of [1280, 390]) {
      it(`${cale} la ${latime} px, în 5 puncte de derulare`, async () => {
        const { p, context } = await pagina({ viewport: { width: latime, height: 844 } });
        await p.goto(BAZA + cale, { waitUntil: 'load' });
        const inaltime = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
        const rezultate = [];
        for (const f of [0, 0.25, 0.5, 0.75, 1]) {
          await p.evaluate((y) => scrollTo(0, y), Math.round(inaltime * f));
          await p.waitForTimeout(700); // rAF + tranziția de culoare de 0.4 s
          const m = await p.evaluate(masoaraNavbar);
          rezultate.push({ f, ...m, raport: contrast(m.text, m.fundal) });
        }
        for (const r of rezultate) assert.ok(r.raport >= 4.5, `la ${r.f * 100}%: ${r.text} pe ${r.fundal} (${r.raport.toFixed(2)}:1), tema ${r.tema}`);
        await context.close();
      });
    }
  }

  it('fără JS: navbar-ul are fundal plin în tema de la încărcare (textul nu se pierde la derulare)', async () => {
    const { p, context } = await pagina({ javaScriptEnabled: false });
    for (const [cale, fundal, text] of [
      ['/', 'rgb(255, 255, 255)', 'rgb(31, 30, 29)'],
      ['/servicii/', 'rgb(255, 255, 255)', 'rgb(31, 30, 29)'],
    ]) {
      await p.goto(BAZA + cale, { waitUntil: 'load' });
      await p.evaluate(() => scrollTo(0, 1500));
      const r = await p.evaluate(() => {
        const s = getComputedStyle(document.querySelector('[data-navbar]'));
        return { fundal: s.backgroundColor, text: s.color };
      });
      assert.deepEqual(r, { fundal, text }, cale);
    }
    await context.close();
  });

  it('pe Acasă (V3b): deschisă peste toate secțiunile, închisă peste subsol', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    assert.equal(await p.getAttribute('[data-navbar]', 'data-tema'), 'light');
    for (const [selector, tema] of [
      ['.fraze', 'light'],
      ['#servicii', 'light'],
      ['#pasi', 'light'],
      ['#faq', 'light'],
    ]) {
      await p.evaluate((s) => {
        const el = document.querySelector(s);
        scrollTo({ top: el.getBoundingClientRect().top + scrollY + 200, behavior: 'instant' });
      }, selector);
      await p.waitForTimeout(300);
      assert.equal(await p.getAttribute('[data-navbar]', 'data-tema'), tema, selector);
    }
    // Subsolul (brand-900): într-o fereastră mai scundă decât el, derulat până jos, navbar-ul e peste el.
    await p.setViewportSize({ width: 1280, height: 400 });
    await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await p.waitForTimeout(600);
    assert.equal(await p.getAttribute('[data-navbar]', 'data-tema'), 'dark', 'footer');
    await context.close();
  });
});

describe('Meniul compact', () => {
  it('Tab ajunge la „Meniu”, Enter îl deschide, focusul rămâne în panou, Escape îl închide și readuce focusul', async () => {
    const { p, erori, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/servicii/`, { waitUntil: 'load' });
    // Tab până la butonul „Meniu”.
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press('Tab');
      if (await p.evaluate(() => document.activeElement?.matches('summary.meniu-compact__buton'))) break;
    }
    assert.ok(await p.evaluate(() => document.activeElement?.matches('summary.meniu-compact__buton')), 'focus pe „Meniu”');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(300);
    const deschis = await p.evaluate(() => ({
      open: document.querySelector('[data-meniu-compact]').open,
      overflow: getComputedStyle(document.documentElement).overflow,
      panou: getComputedStyle(document.querySelector('.meniu-compact__panou')).position,
      fundal: getComputedStyle(document.querySelector('.meniu-compact__panou')).backgroundColor,
    }));
    assert.equal(deschis.open, true);
    assert.equal(deschis.overflow, 'hidden', 'derularea paginii e blocată');
    assert.equal(deschis.panou, 'fixed');
    assert.equal(deschis.fundal, 'rgb(42, 26, 16)');

    // 25 de Tab-uri (mai multe decât elementele din panou): focusul nu iese din meniu.
    for (let i = 0; i < 25; i++) {
      await p.keyboard.press('Tab');
      assert.ok(await p.evaluate(() => !!document.activeElement?.closest('[data-meniu-compact]')), `Tab ${i + 1}: focusul a ieșit din meniu`);
    }
    await p.keyboard.press('Shift+Tab');
    assert.ok(await p.evaluate(() => !!document.activeElement?.closest('[data-meniu-compact]')));

    await p.keyboard.press('Escape');
    await p.waitForTimeout(100);
    const inchis = await p.evaluate(() => ({
      open: document.querySelector('[data-meniu-compact]').open,
      focus: document.activeElement?.matches('summary.meniu-compact__buton'),
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    assert.equal(inchis.open, false);
    assert.equal(inchis.focus, true, 'focusul revine pe „Meniu”');
    assert.notEqual(inchis.overflow, 'hidden');
    assert.deepEqual(erori, []);
    await context.close();
  });

  it('fără JS, se deschide și se închide (details nativ)', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    await p.goto(`${BAZA}/servicii/`, { waitUntil: 'load' });
    await p.click('summary.meniu-compact__buton');
    assert.equal(await p.evaluate(() => document.querySelector('[data-meniu-compact]').open), true);
    assert.ok(await p.isVisible('.meniu-compact__lista a'));
    await p.click('summary.meniu-compact__buton');
    assert.equal(await p.evaluate(() => document.querySelector('[data-meniu-compact]').open), false);
    await context.close();
  });

  it('pagina curentă: aria-current, cu linia trasă permanent (nu doar culoare)', async () => {
    const { p, context } = await pagina({ viewport: { width: 1280, height: 800 } });
    await p.goto(`${BAZA}/servicii/`, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const a = document.querySelector('.antet__linkuri a[aria-current="page"]');
      return { text: a?.textContent.trim(), linie: a && getComputedStyle(a, '::before').transform };
    });
    assert.equal(r.text, 'Servicii');
    assert.equal(r.linie, 'matrix(1, 0, 0, 1, 0, 0)');
    await context.close();
  });
});

describe('Butonul cu text dublat', () => {
  it('numele accesibil e textul întreg; literele sunt aria-hidden; ținta ≥ 48 px', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/stil/`, { waitUntil: 'load' });
    const buton = p.locator('#butoane ~ .demo-butoane .buton, .demo-butoane .buton').first();
    const r = await buton.evaluate((el) => ({
      litere: el.querySelectorAll('.buton__text > span').length,
      ascunse: el.querySelector('.buton__masca').getAttribute('aria-hidden'),
      inaltime: el.getBoundingClientRect().height,
    }));
    assert.equal(r.litere, 'Programare'.length);
    assert.equal(r.ascunse, 'true');
    assert.ok(r.inaltime >= 48);
    assert.equal(await p.getByRole('link', { name: 'Programare', exact: true }).count() >= 1, true);
    assert.equal(await p.getByRole('button', { name: 'Trimiteți', exact: true }).count(), 1);
    await context.close();
  });

  it('la hover: fundalul urcă și literele urcă (cadru la 0.25 s); la mișcare redusă, fără rulare', async () => {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const { p, context } = await pagina({ reducedMotion });
      await p.goto(`${BAZA}/stil/`, { waitUntil: 'load' });
      const buton = p.locator('.demo-butoane .buton').first();
      await buton.scrollIntoViewIfNeeded();
      await buton.hover();
      await p.waitForTimeout(250);
      const r = await buton.evaluate((el) => ({
        fundal: getComputedStyle(el.querySelector('.buton__fundal')).transform,
        litera: getComputedStyle(el.querySelector('.buton__text > span')).transform,
      }));
      if (reducedMotion === 'reduce') {
        assert.equal(r.litera, 'none', 'fără rulare la mișcare redusă');
      } else {
        assert.notEqual(r.litera, 'none', 'prima literă a început să urce');
        assert.notEqual(r.fundal, 'none');
      }
      await context.close();
    }
  });
});

describe('Cursorul și shutter-ul', () => {
  it('cursorul: bula apare pe [data-cursor] cu textul atributului; aria-hidden; cursorul nativ rămâne', async () => {
    const { p, context } = await pagina();
    await p.goto(`${BAZA}/stil/`, { waitUntil: 'load' });
    const zona = p.locator('.demo-cursor').first();
    await zona.scrollIntoViewIfNeeded();
    const box = await zona.boundingBox();
    await p.mouse.move(box.x + 10, box.y + 10);
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const c = document.querySelector('[data-cursor-urmaritor]');
      return {
        bula: c.hasAttribute('data-bula'),
        text: c.querySelector('[data-cursor-bula]').textContent,
        aria: c.getAttribute('aria-hidden'),
        cursorNativ: getComputedStyle(document.body).cursor,
      };
    });
    assert.equal(r.bula, true);
    assert.equal(r.text, 'Vezi serviciul');
    assert.equal(r.aria, 'true');
    assert.notEqual(r.cursorNativ, 'none');
    await context.close();
  });

  it('cursorul și shutter-ul nu există la mișcare redusă', async () => {
    const { p, context } = await pagina({ reducedMotion: 'reduce' });
    await p.goto(`${BAZA}/stil/`, { waitUntil: 'load' });
    await p.mouse.move(400, 400);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({
      cursor: getComputedStyle(document.querySelector('[data-cursor-urmaritor]')).display,
      benzi: document.querySelectorAll('[data-shutter] i').length,
    }));
    assert.equal(r.cursor, 'none');
    assert.equal(r.benzi, 0);
    await context.close();
  });

  it('shutter-ul: 16 benzi pe desktop, 10 pe tabletă, 6 pe mobil', async () => {
    for (const [latime, n] of [
      [1280, 16],
      [800, 10],
      [390, 6],
    ]) {
      const { p, context } = await pagina({ viewport: { width: latime, height: 800 } });
      await p.goto(`${BAZA}/stil/`, { waitUntil: 'load' });
      await p.waitForTimeout(800);
      assert.equal(await p.evaluate(() => document.querySelectorAll('[data-shutter] i').length), n, `la ${latime} px`);
      await context.close();
    }
  });
});

/**
 * Pentru 5 puncte din dreptunghiul navbar-ului: elementul de deasupra (elementFromPoint) e din
 * header și, între el și header, există un fundal opac. Doar elementFromPoint nu ajunge: un header
 * fix e ținta lui și când e transparent, deși textul paginii se vede prin el.
 */
function puncteNavbar() {
  const antet = document.querySelector('[data-navbar]');
  const r = antet.getBoundingClientRect();
  const puncte = [
    [0.04, 0.2],
    [0.3, 0.5],
    [0.5, 0.8],
    [0.7, 0.35],
    [0.96, 0.65],
  ].map(([fx, fy]) => [r.left + r.width * fx, r.top + r.height * fy]);
  return puncte.map(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    let opac = false;
    for (let n = el; n && antet.contains(n); n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const alfa = c.startsWith('rgba') ? Number(c.match(/[\d.]+/g)[3]) : 1;
      if (alfa >= 0.99) opac = true;
      if (n === antet) break;
    }
    return { x: Math.round(x), y: Math.round(y), dinHeader: !!el && antet.contains(el), opac, el: el?.tagName + '.' + (el?.className || '') };
  });
}

// Derulare instantă: `scroll-behavior: smooth` face scrollTo animat, iar recalcularea
// ScrollTrigger de imediat după încărcare l-ar putea anula (doar în test; utilizatorul derulează nativ).
describe('Navbar-ul sub prag: fundal plin la derulare (V2b)', () => {
  for (const cale of ['/', '/contact/']) {
    it(`${cale} la 390 px, derulat: nicio bucată din pagină nu se vede în dreptunghiul navbar-ului`, async () => {
      const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
      await p.goto(BAZA + cale, { waitUntil: 'load' });
      for (const y of [120, 900, 2000]) {
        await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
        await p.waitForTimeout(600); // rAF + tranziția de 0.4 s
        for (const pt of await p.evaluate(puncteNavbar)) {
          assert.ok(pt.dinHeader && pt.opac, `derulat ${y}px, punctul (${pt.x}, ${pt.y}): ${pt.el}, fundal opac: ${pt.opac}`);
        }
      }
      // La scroll 0 revine transparent.
      await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await p.waitForTimeout(600);
      const sus = await p.evaluate(() => ({
        derulat: document.querySelector('[data-navbar]').hasAttribute('data-derulat'),
        fundal: getComputedStyle(document.querySelector('[data-navbar]')).backgroundColor,
      }));
      assert.equal(sus.derulat, false);
      assert.equal(sus.fundal, 'rgba(0, 0, 0, 0)');
      await context.close();
    });
  }

  it('fundalul are culoarea temei și o linie de 1 px; pagina reîncărcată deja derulată pornește cu fundal', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    // Peste subsol (temă închisă, brand-900).
    await p.evaluate(() => scrollTo({ top: document.querySelector('footer').getBoundingClientRect().top + scrollY + 200, behavior: 'instant' }));
    await p.waitForTimeout(600);
    let s = await p.evaluate(() => {
      const c = getComputedStyle(document.querySelector('[data-navbar]'));
      return { fundal: c.backgroundColor, linie: c.boxShadow, tema: document.querySelector('[data-navbar]').dataset.tema };
    });
    assert.deepEqual(s, { fundal: 'rgb(42, 26, 16)', linie: 'rgb(74, 53, 39) 0px -1px 0px 0px inset', tema: 'dark' });
    // Reîncărcare la jumătatea paginii (temă deschisă): fundal plin imediat, fără tranziție.
    await p.evaluate(() => scrollTo({ top: document.querySelector('#servicii').getBoundingClientRect().top + scrollY + 300, behavior: 'instant' }));
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(50);
    s = await p.evaluate(() => {
      const c = getComputedStyle(document.querySelector('[data-navbar]'));
      return { scroll: scrollY > 8, fundal: c.backgroundColor, linie: c.boxShadow };
    });
    assert.deepEqual(s, { scroll: true, fundal: 'rgb(255, 255, 255)', linie: 'rgb(226, 225, 223) 0px -1px 0px 0px inset' });
    await context.close();
  });

  it('meniul compact deschis nu e afectat: panoul brand-900, navbar-ul fără fundal propriu', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/contact/`, { waitUntil: 'load' });
    await p.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
    await p.waitForTimeout(600);
    await p.click('summary.meniu-compact__buton');
    await p.waitForTimeout(500);
    const s = await p.evaluate(() => {
      const antet = document.querySelector('[data-navbar]');
      const r = antet.getBoundingClientRect();
      return {
        fundal: getComputedStyle(antet).backgroundColor,
        text: getComputedStyle(antet).color,
        sub: getComputedStyle(document.querySelector('.meniu-compact__panou')).backgroundColor,
        punct: antet.contains(document.elementFromPoint(r.width / 2, r.height / 2)),
      };
    });
    assert.deepEqual(s, { fundal: 'rgba(0, 0, 0, 0)', text: 'rgb(255, 255, 255)', sub: 'rgb(42, 26, 16)', punct: true });
    await context.close();
  });

  it('martor: pe desktop (1280 px) navbar-ul rămâne transparent la derulare, deci verificarea de opacitate pică', async () => {
    const { p, context } = await pagina({ viewport: { width: 1280, height: 800 } });
    await p.goto(`${BAZA}/contact/`, { waitUntil: 'load' });
    await p.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }));
    await p.waitForTimeout(600);
    const pt = await p.evaluate(puncteNavbar);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('[data-navbar]')).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.ok(pt.some((x) => !x.opac), 'pe desktop testul trebuie să vadă fundalul transparent');
    await context.close();
  });
});
