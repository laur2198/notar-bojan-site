import { describe, expect, it } from 'vitest';
import { amesteca, contrastCuGranulatie, raportContrast } from './contrast';
import { compusMaxim, compusPata, CULORI_VIU, INTENSITATI, pata } from './fundal-viu';
import { culoare, culori, marimePx, numarToken } from './tokens';

describe('culorile din tokens.css', () => {
  it('sunt paleta V3d: alb / alb cald, ink, roșul de acțiune și roșul închis; fără maro', () => {
    expect(Object.keys(culori).sort()).toEqual(
      [
        'c-ink',
        'c-ink-2',
        'c-line',
        'c-linie-inchis',
        'c-muted',
        'c-paper',
        'c-paper-2',
        'c-rosu',
        'c-rosu-50',
        'c-rosu-300',
        'c-rosu-900',
        'c-rosu-hover',
        'c-slogan-stins',
        'c-slogan-stins-inchis',
      ].sort(),
    );
    expect(culoare('c-paper')).toBe('#FFFFFF');
    expect(culoare('c-paper-2')).toBe('#FBF8F6');
    expect(culoare('c-ink')).toBe('#1F1E1D');
    expect(culoare('c-muted')).toBe('#5E5C59');
    expect(culoare('c-rosu')).toBe('#B42318');
    expect(culoare('c-rosu-hover')).toBe('#8F1D14');
    expect(culoare('c-rosu-50')).toBe('#FBEDEA');
    expect(culoare('c-rosu-900')).toBe('#7A1414');
    expect(culoare('c-rosu-300')).toBe('#E8C9C4');
  });

  it('niciun token nu mai e maro (nuanță 15–45°, saturație medie, întunecat): nici --c-brand, nici --c-accent', () => {
    for (const vechi of ['c-brand', 'c-brand-900', 'c-brand-300', 'c-brand-50', 'c-line-dark', 'c-accent']) {
      expect(culori[vechi]).toBeUndefined();
    }
  });
});

/*
 * Perechile de culori folosite, cu raportul fără granulație (cel din comentariile din tokens.css,
 * rotunjit la o zecimală) și pragul care trebuie să treacă în cazul cel mai defavorabil al
 * granulației (contrastCuGranulatie). Aceeași listă, mai detaliată, e în /stil/.
 */
const PERECHI: [fata: string, fundal: string, raport: number, prag: number][] = [
  ['c-ink', 'c-paper-2', 15.7, 4.5],
  ['c-muted', 'c-paper', 6.7, 4.5],
  ['c-muted', 'c-paper-2', 6.3, 4.5],
  ['c-rosu', 'c-paper', 6.6, 4.5],
  ['c-rosu', 'c-paper-2', 6.2, 4.5],
  ['c-paper', 'c-rosu', 6.6, 4.5],
  ['c-paper', 'c-rosu-hover', 8.9, 4.5],
  ['c-rosu', 'c-rosu-50', 5.8, 4.5],
  ['c-ink', 'c-rosu-50', 14.6, 4.5],
  ['c-paper', 'c-rosu-900', 10.8, 4.5],
  ['c-rosu-900', 'c-paper', 10.8, 4.5],
  ['c-rosu-900', 'c-rosu-50', 9.5, 4.5],
  ['c-rosu-300', 'c-rosu-900', 7.0, 4.5],
  ['c-slogan-stins', 'c-paper', 6.3, 4.5],
  ['c-slogan-stins-inchis', 'c-rosu-900', 5.2, 4.5],
];

describe('contrastul perechilor (WCAG 2.1 AA, inclusiv granulația de 6%)', () => {
  it.each(PERECHI)('%s pe %s: %f:1, trece AA și cu granulația', (fata, fundal, raport, prag) => {
    const r = raportContrast(culoare(fata), culoare(fundal));
    expect(Math.round(r * 10) / 10).toBe(raport);
    expect(contrastCuGranulatie(culoare(fata), culoare(fundal))).toBeGreaterThanOrEqual(prag);
  });

  it('roșul nu stă pe alt roșu: --c-rosu pe --c-rosu-900 pică (de aceea e interzis ca text sau UI)', () => {
    expect(raportContrast(culoare('c-rosu'), culoare('c-rosu-900'))).toBeLessThan(3);
  });
});

/** Culoarea cu `n` trepte (din 255) mai închisă pe fiecare canal. */
const maiInchis = (hex: string, n: number) =>
  '#' + [1, 3, 5].map((i) => Math.max(0, parseInt(hex.slice(i, i + 2), 16) - n).toString(16).padStart(2, '0')).join('').toUpperCase();

describe('fundalul viu (FundalViu.astro, --viu-*)', () => {
  it('fiecare intensitate are câte o pată din fiecare culoare, cu opacitate între 0 și 0.4; discret < puternic', () => {
    for (const c of CULORI_VIU) {
      const p = pata(c, 'puternic');
      const d = pata(c, 'discret');
      expect(p.alfa).toBeGreaterThan(0);
      expect(p.alfa).toBeLessThanOrEqual(0.4);
      expect(d.alfa).toBeGreaterThan(0);
      expect(d.alfa).toBeLessThan(p.alfa);
    }
  });

  /*
   * Cel mai saturat punct posibil: centrul unei singure pete (geometria garantează că zonele
   * colorate nu se suprapun: src/lib/fundal-viu.test.ts), pentru fiecare culoare, peste paper și
   * paper-2; plus granulația de 6% (contrastCuGranulatie).
   */
  for (const intensitate of INTENSITATI) {
    for (const fond of ['c-paper', 'c-paper-2']) {
      it(`${intensitate} pe --${fond}: ink, muted și roșu ≥ 4.5:1 în centrul fiecărei pete, cu granulație`, () => {
        for (const c of CULORI_VIU) {
          const compus = compusPata(c, intensitate, culoare(fond));
          // Și cu toleranța de randare: browserul rotunjește amestecul cu 1–2 trepte (măsurat în e2e); 3 trepte pe canal.
          for (const fundal of [compus, maiInchis(compus, 3)]) {
            for (const text of ['c-ink', 'c-muted', 'c-rosu']) {
              expect(contrastCuGranulatie(culoare(text), fundal), `${text} pe ${c} (${fundal})`).toBeGreaterThanOrEqual(4.5);
            }
          }
        }
        // Focusul (roșu, 3 px) e element de interfață: min. 3:1, acoperit de pragul de mai sus.
        // Butonul plin își are propriul fundal: alb pe --c-rosu, neschimbat de pete.
        expect(contrastCuGranulatie(culoare('c-paper'), culoare('c-rosu'))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('„Cum lucrăm” (discret, paper-2): sloganul stins ≥ 4.5:1, pașii inactivi (ink la .6, text mare) ≥ 3:1', () => {
    for (const c of CULORI_VIU) {
      const compus = compusPata(c, 'discret', culoare('c-paper-2'));
      expect(contrastCuGranulatie(culoare('c-slogan-stins'), compus)).toBeGreaterThanOrEqual(4.5);
      expect(contrastCuGranulatie(culoare('c-slogan-stins'), maiInchis(compus, 3))).toBeGreaterThanOrEqual(4.5);
      expect(contrastCuGranulatie(amesteca(compus, culoare('c-ink'), 0.6), compus)).toBeGreaterThanOrEqual(3);
    }
  });

  it('compusul maxim e cel din comentariul din tokens.css', () => {
    expect(compusMaxim('puternic', culoare('c-paper'))).toBe('#F8E8D2');
    expect(compusMaxim('puternic', culoare('c-paper-2'))).toBe('#F5E4CC');
    expect(compusMaxim('discret', culoare('c-paper'))).toBe('#FDEFEC');
    expect(compusMaxim('discret', culoare('c-paper-2'))).toBe('#F7EBDC');
  });

  it('valorile sunt tokenuri citite din tokens.css', () => {
    expect(numarToken('viu-puternic-piersica')).toBeGreaterThan(numarToken('viu-discret-piersica'));
  });
});

describe('marimePx', () => {
  it('textul de bază: fix 18 px, 19 px de la 1600 px', () => {
    expect(marimePx('fs-base', 375)).toBe(18);
    expect(marimePx('fs-base', 1440)).toBe(18);
    expect(marimePx('fs-base', 1599)).toBe(18);
    expect(marimePx('fs-base', 1600)).toBe(19);
    expect(marimePx('fs-base', 2560)).toBe(19);
  });

  it('scara titlurilor din V3b (clamp-uri cu vw între plafoane în rem)', () => {
    expect(marimePx('fs-h1', 375)).toBe(24.8); // minimul 1.55rem
    expect(marimePx('fs-h1', 1280)).toBe(33.3); // 2.6vw
    expect(marimePx('fs-h1', 1920)).toBe(41.6); // plafonul 2.6rem
    expect(marimePx('fs-statement', 1280)).toBe(37.1);
    expect(marimePx('fs-statement', 1920)).toBe(46.4);
    expect(marimePx('fs-titlu', 1280)).toBe(28.2);
    expect(marimePx('fs-titlu', 1920)).toBe(36);
    expect(marimePx('fs-h2', 1280)).toBe(24.3);
    expect(marimePx('fs-h3', 1280)).toBe(20.7);
  });

  it('paginile interioare nu ies mai mari decât Acasă: h2 ≤ titlurile ≤ h1 ≤ frazele mari', () => {
    for (const latime of [375, 768, 1280, 1920]) {
      expect(marimePx('fs-h2', latime)).toBeLessThanOrEqual(marimePx('fs-titlu', latime));
      expect(marimePx('fs-titlu', latime)).toBeLessThanOrEqual(marimePx('fs-h1', latime) + 0.1);
      expect(marimePx('fs-h1', latime)).toBeLessThanOrEqual(marimePx('fs-statement', latime) + 1);
    }
  });

  it('niciun text nu scade sub 16 px, în afară de --fs-xs', () => {
    for (const latime of [320, 375, 768, 1280, 1920]) {
      for (const t of ['fs-base', 'fs-sm', 'fs-lg', 'fs-h3', 'fs-h2', 'fs-titlu', 'fs-h1', 'fs-statement']) {
        expect(marimePx(t, latime)).toBeGreaterThanOrEqual(16);
      }
    }
    expect(marimePx('fs-xs', 375)).toBe(14);
  });

  it('max ≤ 2.5 × min pentru textul de bază și titluri (ajung la 200% prin zoom, WCAG 1.4.4)', () => {
    for (const t of ['fs-base', 'fs-h2', 'fs-titlu', 'fs-h1', 'fs-statement']) {
      expect(marimePx(t, 4000)).toBeLessThanOrEqual(2.5 * marimePx(t, 320));
    }
  });

  it('factorul wordmark-ului e un număr pozitiv', () => {
    expect(numarToken('wordmark-k')).toBeGreaterThan(5);
  });
});
