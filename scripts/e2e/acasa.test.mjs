/**
 * Teste e2e pentru pagina Acasă (V3, V3d): intrarea hero-ului, fundalul viu, frazele pe roșu, tastatura (întrebări
 * și pași), conținutul complet fără JS și la mișcare redusă, CSP. Rulare: vezi miscare.test.mjs.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRequire } from 'node:module';
import { BAZA, cuBrowser, pagina } from './util.mjs';

const sharp = createRequire(import.meta.url)('sharp');

cuBrowser();

describe('Acasă: hero (V3d, fără intro și fără semnătură)', () => {
  it('hero-ul intră direct la încărcare; niciun strat de intro, nicio semnătură în HTML', async () => {
    const { p, erori, context } = await pagina();
    await p.goto(`${BAZA}/`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.documentElement.classList.contains('hero-pornit'));
    await p.waitForTimeout(1800);
    const r = await p.evaluate(() => ({
      clase: document.documentElement.className,
      intro: document.querySelectorAll('[data-intro]').length,
      semnatura: document.querySelectorAll('[data-semnatura], .semnatura, .hero__semnatura').length,
      titlu: getComputedStyle(document.querySelector('[data-hero-titlu]')).visibility,
      wordmark: getComputedStyle(document.querySelector('[data-hero-wordmark]')).visibility,
      accent: getComputedStyle(document.querySelector('[data-hero-accent]')).transform,
    }));
    assert.doesNotMatch(r.clase, /cu-intro|intro-/);
    assert.equal(r.intro, 0);
    assert.equal(r.semnatura, 0);
    assert.equal(r.titlu, 'visible');
    assert.equal(r.wordmark, 'visible');
    assert.match(r.accent, /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/, `linia roșie trasă: ${r.accent}`);
    const html = await (await fetch(`${BAZA}/`)).text();
    assert.doesNotMatch(html, /semnatura|vecteezy|intro-semnatura/i);
    // V3e: fără rândul „Notar public · Camera Notarilor Publici Brașov” (și adresa) în hero.
    assert.equal(await p.evaluate(() => document.querySelectorAll('.hero__linie, .hero__adresa').length), 0);
    assert.doesNotMatch(await p.evaluate(() => document.querySelector('[data-hero]').textContent), /Camera Notarilor/);
    assert.deepEqual(erori, []);
    await context.close();
  });

  it('h1 conține doar titlul; subtitlul e un <p> imediat după el; accesibil în timpul intrării și după', async () => {
    for (const [cale, titlu] of [
      ['/', /^Acte notariale pregătite din timp, ca drumul la birou să fie cât mai scurt\.$/],
      ['/en/', /^Notarial acts prepared in advance, to keep your visit to the office short\.$/],
    ]) {
      const { p, context } = await pagina();
      await p.goto(BAZA + cale, { waitUntil: 'domcontentloaded' });
      const stare = () =>
        p.evaluate(() => {
          const h1 = document.querySelectorAll('h1');
          const sub = h1[0].nextElementSibling;
          return {
            h1: h1.length,
            text: h1[0].textContent.trim(),
            id: h1[0].id,
            eticheta: document.querySelector('[data-hero]').getAttribute('aria-labelledby'),
            sub: `${sub.tagName}.${sub.classList[0]}`,
            subText: sub.textContent.trim().length,
            curat: [...document.querySelector('[data-hero-titlu]').children].map((c) => c.tagName + (c.classList.contains('sr-only') ? '.sr-only' : '')),
          };
        });
      // În timpul intrării (rânduri din mască pe o copie aria-hidden): tot un singur h1, cu textul întreg.
      await p.waitForFunction(() => document.documentElement.classList.contains('hero-pornit'));
      const mijloc = await stare();
      assert.equal(mijloc.h1, 1, `${cale}: un singur h1 în timpul intrării`);
      assert.match(mijloc.text, titlu);
      assert.equal(await p.getByRole('heading', { level: 1, name: titlu }).count(), 1);
      await p.waitForTimeout(2500);
      const final = await stare();
      assert.equal(final.h1, 1);
      assert.match(final.text, titlu);
      assert.ok(final.text.length < 90, `${cale}: h1 are ${final.text.length} caractere`);
      assert.equal(final.id, 'hero-titlu');
      assert.equal(final.eticheta, 'hero-titlu');
      assert.equal(final.sub, 'P.hero__subtitlu');
      assert.ok(final.subText > 40);
      assert.deepEqual(final.curat, ['H1', 'P'], `${cale}: după intrare, HTML-ul inițial (fără copie, fără sr-only)`);
      assert.equal(await p.getByRole('heading', { level: 1, name: titlu }).count(), 1);
      await context.close();
    }
  });
});

describe('Acasă V3d: roșul, suprafețele închise și fundalul viu', () => {
  it('frazele mari și CTA-ul final pe rosu-900, temă închisă; subsolul cu linia roșie de 3 px', async () => {
    const { p, erori, context } = await pagina({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const fraze = document.querySelector('[data-fraze]').closest('section');
      const cta = document.querySelector('[data-cta-final]');
      const subsol = document.querySelector('footer');
      const st = (el) => getComputedStyle(el);
      return {
        fraze: [st(fraze).backgroundColor, fraze.dataset.temaSectiune, fraze.classList.contains('pe-inchis')],
        frazaCuloare: st(document.querySelector('[data-fraza]')).color,
        cta: [st(cta).backgroundColor, cta.dataset.temaSectiune],
        butonCta: st(cta.querySelector('.buton--plin')).backgroundColor,
        subsol: [st(subsol).backgroundColor, st(subsol).borderTopWidth, st(subsol).borderTopColor],
        programare: st(document.querySelector('.antet__programare')).backgroundColor,
        sectiuni: ['#servicii', '#pasi', '#faq'].map((id) => st(document.querySelector(id)).backgroundColor),
      };
    });
    assert.deepEqual(r.fraze, ['rgb(122, 20, 20)', 'dark', true]);
    assert.equal(r.frazaCuloare, 'rgb(255, 255, 255)');
    assert.deepEqual(r.cta, ['rgb(122, 20, 20)', 'dark']);
    assert.equal(r.butonCta, 'rgb(255, 255, 255)', 'butonul plin pe închis e alb');
    assert.deepEqual(r.subsol, ['rgb(122, 20, 20)', '3px', 'rgb(180, 35, 24)']);
    assert.equal(r.programare, 'rgb(180, 35, 24)', '„Programare” din navbar e plin roșu');
    assert.deepEqual(r.sectiuni, ['rgb(255, 255, 255)', 'rgb(251, 248, 246)', 'rgb(255, 255, 255)'], 'alternanța paper / paper-2');
    // Navbar-ul trece pe tema închisă peste frazele mari.
    await p.evaluate(() => scrollTo({ top: document.querySelector('[data-fraze]').getBoundingClientRect().top + scrollY + 200, behavior: 'instant' }));
    await p.waitForTimeout(500);
    assert.equal(await p.getAttribute('[data-navbar]', 'data-tema'), 'dark');
    assert.deepEqual(erori, []);
    await context.close();
  });

  it('frazele: literele apar în nuanța stinsă (nu din opacitate) și se aprind în alb', async () => {
    const { p, context } = await pagina({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    const fraze = await p.evaluate(() => document.querySelector('[data-fraze]').getBoundingClientRect().top + scrollY);
    // Puțin după începutul primei fraze: unele litere aprinse, altele stinse; niciuna pe jumătate transparentă.
    await p.evaluate((y) => scrollTo({ top: y - 900 * 0.4 + 120, behavior: 'instant' }), fraze);
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const litere = [...document.querySelectorAll('[data-fraza]')[0].querySelectorAll('[aria-hidden] div, [aria-hidden] span')].filter((e) => e.children.length === 0);
      return litere.map((e) => [getComputedStyle(e).color, Number(getComputedStyle(e).opacity)]);
    });
    const vizibile = r.filter(([, o]) => o > 0);
    assert.ok(vizibile.length > 0, 'unele litere au apărut');
    assert.ok(r.every(([, o]) => o === 0 || o === 1), 'opacitatea e doar 0 sau 1 (fără stări intermediare)');
    assert.ok(vizibile.some(([c]) => c !== 'rgb(255, 255, 255)'), 'unele litere vizibile sunt încă stinse');
    await context.close();
  });

  it('petele se mișcă doar cât se derulează: după oprire rămân pe loc', async () => {
    const { p, context } = await pagina({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    const transforme = () => p.evaluate(() => [...document.querySelectorAll('#servicii [data-viu-pata]')].map((e) => getComputedStyle(e).transform));
    const sus = await transforme();
    await p.evaluate(() => scrollTo({ top: document.querySelector('#servicii').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await p.waitForTimeout(300);
    const dupaDerulare = await transforme();
    assert.notDeepEqual(dupaDerulare, sus, 'derularea mișcă petele');
    const willChange = await p.evaluate(() => getComputedStyle(document.querySelector('#servicii [data-viu-pata]')).willChange);
    assert.equal(willChange, 'transform', 'will-change doar cât secțiunea e în ecran');
    await p.waitForTimeout(1500);
    assert.deepEqual(await transforme(), dupaDerulare, 'fără mișcare după ce derularea s-a oprit');
    // Departe de secțiune, will-change se scoate.
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(300);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#faq [data-viu-pata]')).willChange), 'auto');
    await context.close();
  });

  it('hero: petele urmăresc cursorul (max. 30 px) și se opresc odată cu el', async () => {
    const { p, context } = await pagina({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    const deplasari = () =>
      p.evaluate(() =>
        [...document.querySelectorAll('[data-hero] [data-viu-grad]')].map((e) => {
          const m = new DOMMatrix(getComputedStyle(e).transform);
          return [Math.round(m.m41 * 10) / 10, Math.round(m.m42 * 10) / 10];
        }),
      );
    await p.mouse.move(1430, 890, { steps: 8 });
    await p.waitForTimeout(1600);
    const colt = await deplasari();
    assert.ok(colt.some(([x, y]) => x > 5 && y > 5), `petele s-au deplasat spre cursor: ${JSON.stringify(colt)}`);
    assert.ok(colt.every(([x, y]) => Math.abs(x) <= 30 && Math.abs(y) <= 30), 'amplitudine max. 30 px');
    await p.waitForTimeout(800);
    assert.deepEqual(await deplasari(), colt, 'cursorul oprit: petele stau');
    await context.close();
  });

  /*
   * Garanția geometrică a petelor (src/lib/fundal-viu.ts, distantaMinima) presupune o înălțime
   * minimă a secțiunii: inaltimeMinima(seed, lățime), copiată aici. Pagina reală trebuie s-o respecte.
   */
  const inaltimeMinima = (seed, latime) => (seed === 1 ? (latime < 992 ? latime : 0.4 * latime) : 500);
  for (const [w, h] of [[320, 568], [390, 844], [740, 360], [768, 1024], [991, 700], [1024, 600], [1280, 600], [1440, 900], [1920, 1080], [2560, 1080], [3440, 1440]]) {
    it(`${w}×${h}: fiecare secțiune cu fundal viu e cel puțin cât înălțimea minimă a seed-ului ei (RO și EN)`, async () => {
      const { p, context } = await pagina({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      for (const cale of ['/', '/en/']) {
        await p.goto(BAZA + cale, { waitUntil: 'load' });
        const r = await p.evaluate(() =>
          [...document.querySelectorAll('[data-fundal-viu]')].map((v) => ({
            seed: Number(v.className.match(/viu--seed-(\d)/)[1]),
            h: v.getBoundingClientRect().height,
          })),
        );
        assert.equal(r.length, 4);
        for (const { seed, h: inaltime } of r) {
          assert.ok(inaltime >= inaltimeMinima(seed, w), `${cale} seed ${seed}: ${Math.round(inaltime)} px < ${inaltimeMinima(seed, w)} px`);
        }
      }
      await context.close();
    });
  }

  /*
   * Randarea reală confirmă modelul: fără conținut și fără granulație, cel mai închis pixel al
   * fundalului unei secțiuni nu e mai închis decât centrul celei mai închise pete singure
   * (compusMaxim din src/lib/fundal-viu.ts, valorile de mai jos: tokens.test.ts). Două pete
   * suprapuse ar da un pixel mai închis. Cu mișcarea pornită, în mai multe puncte ale derulării.
   */
  const luminanta = (r, g, b) => {
    const l = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
  };
  // Toleranța de randare: browserul rotunjește amestecul pe 8 biți cu 1–2 trepte (măsurat); 3 trepte
  // pe canal. Două pete suprapuse ar da ~20 de trepte mai închis.
  const hexLum = (h) => luminanta(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) - 3));
  const MAXIM = { '#hero': '#FBE5E0', '#servicii': '#FDEFEC', '#pasi': '#F7EBDC', '#faq': '#FDEFEC' };
  for (const [w, h] of [[390, 844], [1440, 900], [2560, 1080]]) {
    it(`${w}×${h}: în randarea reală, petele nu se suprapun (niciun pixel mai închis decât o singură pată)`, async () => {
      const { p, context } = await pagina({ viewport: { width: w, height: h } });
      await p.goto(`${BAZA}/`, { waitUntil: 'load' });
      await p.waitForTimeout(1500);
      await p.evaluate(() => {
        document.querySelector('[data-hero]').id ||= 'hero';
        const foaie = document.styleSheets[0];
        foaie.insertRule('body::after { display: none !important; }', foaie.cssRules.length);
        for (const el of document.querySelectorAll('.viu ~ *, [data-navbar], .bara-actiuni, .bara')) el.style.visibility = 'hidden';
      });
      for (const [selector, maxim] of Object.entries(MAXIM)) {
        const sectiune = await p.evaluate((s) => {
          const el = document.querySelector(s === '#hero' ? '[data-hero]' : s);
          return { top: el.getBoundingClientRect().top + scrollY, h: el.getBoundingClientRect().height };
        }, selector);
        const prag = hexLum(maxim);
        for (const f of [-0.6, -0.2, 0.2, 0.6]) {
          const y = Math.max(0, sectiune.top + f * sectiune.h);
          await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
          await p.waitForTimeout(150);
          const rect = await p.evaluate((s) => {
            const r = document.querySelector(s === '#hero' ? '[data-hero]' : s).getBoundingClientRect();
            // 2 px în interior: rotunjirea nu prinde marginea secțiunii vecine (ex. banda CTA rosu-900).
            const top = Math.ceil(Math.max(0, r.top)) + 2;
            const jos = Math.floor(Math.min(innerHeight, r.bottom)) - 2;
            return jos - top > 20 ? { x: 0, y: top, width: innerWidth, height: jos - top } : null;
          }, selector);
          if (!rect) continue;
          const { data, info } = await sharp(await p.screenshot({ clip: rect })).raw().toBuffer({ resolveWithObject: true });
          let minim = 1;
          for (let i = 0; i < data.length; i += info.channels * 7) minim = Math.min(minim, luminanta(data[i], data[i + 1], data[i + 2]));
          assert.ok(minim >= prag, `${selector} la ${f}: pixel cu luminanța ${minim.toFixed(4)} < ${prag.toFixed(4)} (${maxim})`);
        }
      }
      await context.close();
    });
  }

  it('la mișcare redusă: petele statice, fără will-change, nici la scroll, nici la cursor', async () => {
    const { p, context } = await pagina({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.mouse.move(1400, 800, { steps: 5 });
    await p.evaluate(() => scrollTo({ top: document.querySelector('#servicii').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await p.waitForTimeout(800);
    const r = await p.evaluate(() =>
      [...document.querySelectorAll('[data-viu-pata], [data-viu-grad]')].map((e) => [getComputedStyle(e).transform, getComputedStyle(e).willChange]),
    );
    assert.ok(r.every(([t, w]) => t === 'none' && w === 'auto'), JSON.stringify(r.slice(0, 3)));
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
          const { p, erori, context } = await pagina({ ...optiuni, viewport });
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
              titlu: vizibil(document.querySelector('[data-hero-titlu]')),
              wordmark: vizibil(document.querySelector('[data-hero-wordmark]')),
              accent: getComputedStyle(document.querySelector('[data-hero-accent]')).transform,
              pete: [...document.querySelectorAll('[data-viu-pata]')].map((el) => getComputedStyle(el).transform),
              fraze: toate('[data-fraza]'),
              pasi: toate('#pasi .pas__text'),
              intrebari: document.querySelectorAll('#faq details').length,
              reveal: toate('[data-reveal]'),
              benzi: document.querySelectorAll('[data-shutter] i').length,
              lat: document.documentElement.scrollWidth <= innerWidth,
            };
          });
          assert.doesNotMatch(r.clase, /(^| )miscare( |$)/);
          assert.ok(r.titlu && r.wordmark, 'hero vizibil');
          assert.equal(r.accent, 'none', 'linia roșie de sub titlu, trasă');
          assert.ok(r.pete.length >= 12, `petele fundalului viu există (${r.pete.length})`);
          assert.ok(r.pete.every((t) => t === 'none'), 'petele sunt statice (fără transform)');
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
        accent: r('[data-hero-accent]'),
        wordmark: r('[data-hero] [data-wordmark-gigant]'),
        vh: innerHeight,
        clip: getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath,
      };
    });

  for (const [w, h] of [
    [1280, 720],
    [1440, 900],
  ]) {
    it(`desktop ${w}×${h}: titlu stânga, centrat vertical față de fotografia 4:5 din dreapta, wordmark vizibil complet`, async () => {
      const { p, context } = await pagina({ viewport: { width: w, height: h } });
      await p.goto(`${BAZA}/`, { waitUntil: 'load' });
      await p.waitForTimeout(2500);
      const g = await geometrie(p);
      assert.ok(g.foto.x > g.titlu.x + g.titlu.w - 1, 'fotografia e în dreapta titlului');
      assert.ok(g.titlu.w <= w * 0.52, `titlul ocupă max. ~50% (${g.titlu.w}px)`);
      assert.ok(Math.abs(g.foto.w / g.foto.h - 0.8) < 0.02, `raport 4:5 (${g.foto.w}×${g.foto.h})`);
      assert.ok(g.accent.y > g.titlu.jos - 1 && g.accent.x < g.foto.x, 'linia roșie sub titlu, în stânga');
      // V3d: fără semnătură, blocul de titlu e centrat vertical față de fotografie (fără gol jos).
      const centruText = (g.titlu.y + g.accent.jos) / 2;
      const centruFoto = (g.foto.y + g.foto.jos) / 2;
      assert.ok(Math.abs(centruText - centruFoto) < 60, `centrul textului ${centruText}, al fotografiei ${centruFoto}`);
      assert.ok(g.wordmark.jos <= g.vh, `wordmark-ul se termină la ${g.wordmark.jos}px (fereastra ${g.vh}px)`);
      assert.equal(g.clip, 'none', 'după intrare, fotografia nu mai are mască');
      await context.close();
    });
  }

  it('mobil 390×844: titlu → linia roșie → fotografie 4:3 pe toată lățimea', async () => {
    const { p, context } = await pagina({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const g = await geometrie(p);
    assert.ok(g.accent.y > g.titlu.jos - 1, 'linia roșie sub titlu');
    assert.ok(g.foto.y > g.accent.jos - 1, 'fotografia sub linie');
    assert.ok(g.foto.w >= 390 - 2 * 16 - 1, `fotografia pe toată lățimea (${g.foto.w}px)`);
    assert.ok(Math.abs(g.foto.w / g.foto.h - 4 / 3) < 0.02, `raport 4:3 (${g.foto.w}×${g.foto.h})`);
    await context.close();
  });

  it('la încărcare: mască de jos în sus (clip-path), apoi vizibilă; înainte, acoperită', async () => {
    const { p, context } = await pagina({ viewport: { width: 1280, height: 720 } });
    await p.goto(`${BAZA}/`, { waitUntil: 'domcontentloaded' });
    const inainte = await p.evaluate(() => getComputedStyle(document.querySelector('[data-hero-foto]')).clipPath);
    assert.match(inainte, /inset\(100%/);
    await p.waitForTimeout(2500);
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
