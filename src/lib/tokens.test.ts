import { describe, expect, it } from 'vitest';
import { amesteca, contrastCuGranulatie, raportContrast } from './contrast';
import { compusMaxim, compusPata, CULORI_VIU, INTENSITATI, pata, type Intensitate } from './fundal-viu';

/** Culorile cele mai închise ale fundalului viu, pe fiecare fond (aceleași ca în comentariul din tokens.css). */
const COMPUS = {
  puternicPaper: '#FDEEE8',
  puternicPaper2: '#F3E3DE',
  discretPaper: '#FEF6F3',
  discretPaper2: '#F2EAE7',
  discretPaperRosu: '#FAEAE7',
};
import { culoare, culori, marimePx, numarToken } from './tokens';

describe('culorile din tokens.css', () => {
  it('sunt paleta finală 3A (V5) cu subsolul maro (V6): alb / gri cald / roz pal, text maro, roșul viu, maroul închis', () => {
    expect(Object.keys(culori).sort()).toEqual(
      [
        'c-ink',
        'c-ink-2',
        'c-line',
        'c-linie-maro',
        'c-maro-300',
        'c-marcaj',
        'c-muted',
        'c-paper',
        'c-paper-2',
        'c-paper-rosu',
        'c-rosu',
        'c-rosu-200',
        'c-rosu-50',
        'c-rosu-hover',
        'c-slogan-stins',
        'c-suprafata-maro',
        'c-suprafata-rosie',
        'c-wordmark',
      ].sort(),
    );
    expect(culoare('c-paper')).toBe('#FFFFFF');
    expect(culoare('c-paper-2')).toBe('#F4F1EE');
    expect(culoare('c-paper-rosu')).toBe('#FDF1EF');
    expect(culoare('c-ink')).toBe('#2A1A10');
    expect(culoare('c-ink-2')).toBe('#3D2718');
    expect(culoare('c-muted')).toBe('#5E5853');
    expect(culoare('c-line')).toBe('#E2DDD8');
    expect(culoare('c-wordmark')).toBe('#4A2E1E');
    expect(culoare('c-rosu')).toBe('#B42318');
    expect(culoare('c-rosu-hover')).toBe('#8F1D14');
    expect(culoare('c-rosu-50')).toBe('#FBEDEA');
    expect(culoare('c-suprafata-rosie')).toBe('#B42318');
    expect(culoare('c-rosu-200')).toBe('#FBE3DF');
    expect(culoare('c-suprafata-maro')).toBe('#4A2E1E');
    expect(culoare('c-maro-300')).toBe('#D9C3AE');
    expect(culoare('c-linie-maro')).toBe('#6A4A36');
  });

  it('tokenurile vechi de brand nu mai există (--c-brand*, --c-accent)', () => {
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
  // Textul maro și gri cald pe suprafețele deschise.
  ['c-ink', 'c-paper', 16.8, 4.5],
  ['c-ink', 'c-paper-2', 14.9, 4.5],
  ['c-ink', 'c-paper-rosu', 15.2, 4.5],
  ['c-ink', 'c-rosu-50', 14.7, 4.5],
  ['c-ink-2', 'c-paper', 14.0, 4.5],
  ['c-muted', 'c-paper', 7.0, 4.5],
  ['c-muted', 'c-paper-2', 6.2, 4.5],
  ['c-muted', 'c-paper-rosu', 6.3, 4.5],
  ['c-wordmark', 'c-paper', 12.3, 4.5],
  ['c-wordmark', 'c-paper-2', 11.0, 4.5],
  ['c-wordmark', 'c-paper-rosu', 11.2, 4.5],
  ['c-slogan-stins', 'c-paper', 6.3, 4.5],
  ['c-slogan-stins', 'c-paper-2', 5.6, 4.5],
  // Roșul ca accent pe deschis.
  ['c-rosu', 'c-paper', 6.6, 4.5],
  ['c-rosu', 'c-paper-2', 5.8, 4.5],
  ['c-rosu', 'c-paper-rosu', 5.9, 4.5],
  ['c-rosu', 'c-rosu-50', 5.8, 4.5],
  // Butonul plin pe deschis.
  ['c-paper', 'c-rosu', 6.6, 4.5],
  ['c-paper', 'c-rosu-hover', 8.9, 4.5],
  // Suprafața roșie vie (galeria cu frazele, CtaFinal): text alb și rosu-200; butonul alb cu text roșu.
  ['c-paper', 'c-suprafata-rosie', 6.6, 4.5],
  ['c-rosu-200', 'c-suprafata-rosie', 5.4, 4.5],
  // Maroul închis (V6: subsolul, meniul compact): text alb și maro-300; butonul alb cu text maro (și
  // la hover, pe rosu-50); butonul contur la hover (alb pe linie-maro); marcajul «DE COMPLETAT».
  ['c-paper', 'c-suprafata-maro', 12.3, 4.5],
  ['c-maro-300', 'c-suprafata-maro', 7.3, 4.5],
  ['c-suprafata-maro', 'c-paper', 12.3, 4.5],
  ['c-suprafata-maro', 'c-rosu-50', 10.8, 4.5],
  ['c-paper', 'c-linie-maro', 7.9, 4.5],
];

describe('contrastul perechilor (WCAG 2.1 AA, inclusiv granulația de 6%)', () => {
  it.each(PERECHI)('%s pe %s: %f:1, trece AA și cu granulația', (fata, fundal, raport, prag) => {
    const r = raportContrast(culoare(fata), culoare(fundal));
    expect(Math.round(r * 10) / 10).toBe(raport);
    expect(contrastCuGranulatie(culoare(fata), culoare(fundal))).toBeGreaterThanOrEqual(prag);
  });

  it('butoanele pe roșu viu: plin alb cu text roșu (și la hover, pe rosu-50); contur alb; focusul alb ≥ 3:1', () => {
    expect(contrastCuGranulatie(culoare('c-rosu'), culoare('c-paper'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(culoare('c-rosu'), culoare('c-rosu-50'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(culoare('c-paper'), culoare('c-rosu-hover'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(culoare('c-paper'), culoare('c-suprafata-rosie'))).toBeGreaterThanOrEqual(3);
  });

  it('pe roșu viu, textul secundar și butonul inactiv sunt --c-rosu-200 (maro-300 ar pica)', () => {
    expect(contrastCuGranulatie(culoare('c-rosu-200'), culoare('c-suprafata-rosie'))).toBeGreaterThanOrEqual(4.5);
    expect(raportContrast(culoare('c-maro-300'), culoare('c-suprafata-rosie'))).toBeLessThan(4.5);
  });

  it('pe maro, focusul și conturul butonului sunt albe (≥ 3:1); roșul pe maro pică (interzis ca text sau UI)', () => {
    expect(contrastCuGranulatie(culoare('c-paper'), culoare('c-suprafata-maro'))).toBeGreaterThanOrEqual(3);
    expect(raportContrast(culoare('c-rosu'), culoare('c-suprafata-maro'))).toBeLessThan(3);
  });

  it('marcajul «DE COMPLETAT» (galben, text ink) rămâne lizibil în subsolul maro', () => {
    expect(contrastCuGranulatie(culoare('c-ink'), culoare('c-marcaj'))).toBeGreaterThanOrEqual(4.5);
  });

  it('maroul nu stă pe roșu: --c-ink și --c-wordmark pe suprafețele roșii pică', () => {
    for (const t of ['c-ink', 'c-wordmark']) {
      expect(raportContrast(culoare(t), culoare('c-suprafata-rosie'))).toBeLessThan(4.5);
    }
  });
});

/** Culoarea cu `n` trepte (din 255) mai închisă pe fiecare canal. */
const maiInchis = (hex: string, n: number) =>
  '#' + [1, 3, 5].map((i) => Math.max(0, parseInt(hex.slice(i, i + 2), 16) - n).toString(16).padStart(2, '0')).join('').toUpperCase();

/** Fundalurile pe care stă fiecare intensitate: puternic pe alb și gri cald, discret și pe roz pal (Servicii). */
const FONDURI: Record<Intensitate, string[]> = {
  puternic: ['c-paper', 'c-paper-2'],
  discret: ['c-paper', 'c-paper-2', 'c-paper-rosu'],
};

/**
 * Toate condițiile de contrast ale unei pete în centrul ei, cu granulația și cu toleranța de randare
 * (3/255 pe canal): ink, muted, roșu ≥ 4.5:1 pe fiecare fundal al intensității; la discret, pe
 * paper-2 („Cum lucrăm”), și sloganul stins ≥ 4.5:1 și pașii inactivi (ink la .6) ≥ 3:1.
 */
function treceContrastul(hex: string, alfa: number, intensitate: Intensitate): boolean {
  return FONDURI[intensitate].every((fond) => {
    const compus = amesteca(culoare(fond), hex, alfa);
    return [compus, maiInchis(compus, 3)].every(
      (f) =>
        ['c-ink', 'c-muted', 'c-rosu'].every((t) => contrastCuGranulatie(culoare(t), f) >= 4.5) &&
        (intensitate !== 'discret' ||
          fond !== 'c-paper-2' ||
          (contrastCuGranulatie(culoare('c-slogan-stins'), f) >= 4.5 && contrastCuGranulatie(amesteca(compus, culoare('c-ink'), 0.6), compus) >= 3)),
    );
  });
}

describe('fundalul viu (FundalViu.astro, --viu-*)', () => {
  it('culorile V5: roșu, coral (slot-ul piersica) și piersică (slot-ul auriu)', () => {
    expect(pata('rosu', 'puternic').hex).toBe('#B42318');
    expect(pata('piersica', 'puternic').hex).toBe('#F08A7A');
    expect(pata('auriu', 'puternic').hex).toBe('#F5B39A');
  });

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
   * colorate nu se suprapun: src/lib/fundal-viu.test.ts), pentru fiecare culoare, pe fiecare fundal
   * al intensității; plus granulația de 6% și toleranța de randare.
   */
  for (const intensitate of INTENSITATI) {
    it(`${intensitate} (${FONDURI[intensitate].join(', ')}): ink, muted, roșu ≥ 4.5:1 în centrul fiecărei pete, cu granulație și toleranță`, () => {
      for (const c of CULORI_VIU) {
        const { hex, alfa } = pata(c, intensitate);
        expect(treceContrastul(hex, alfa, intensitate), `${c} la ${alfa}`).toBe(true);
      }
      // Butonul plin își are propriul fundal: alb pe --c-rosu, neschimbat de pete.
      expect(contrastCuGranulatie(culoare('c-paper'), culoare('c-rosu'))).toBeGreaterThanOrEqual(4.5);
    });

    it(`${intensitate}: opacitățile sunt maximul care trece (cu 0.005 în plus, contrastul pică)`, () => {
      for (const c of CULORI_VIU) {
        const { hex, alfa } = pata(c, intensitate);
        expect(treceContrastul(hex, alfa + 0.005, intensitate), `${c}: ${alfa} + 0.005 încă trece`).toBe(false);
      }
    });
  }

  it('compusul maxim e cel din comentariul din tokens.css', () => {
    expect(compusMaxim('puternic', culoare('c-paper'))).toBe(COMPUS.puternicPaper);
    expect(compusMaxim('puternic', culoare('c-paper-2'))).toBe(COMPUS.puternicPaper2);
    expect(compusMaxim('discret', culoare('c-paper'))).toBe(COMPUS.discretPaper);
    expect(compusMaxim('discret', culoare('c-paper-2'))).toBe(COMPUS.discretPaper2);
    expect(compusMaxim('discret', culoare('c-paper-rosu'))).toBe(COMPUS.discretPaperRosu);
    // compusPata e folosit și de /stil/.
    expect(compusPata('rosu', 'discret', culoare('c-paper'))).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('valorile sunt tokenuri citite din tokens.css', () => {
    expect(numarToken('viu-puternic-piersica')).toBeGreaterThan(numarToken('viu-discret-piersica'));
  });
});

describe('navbar-ul derulat pe temă deschisă (V3e): --c-paper translucid', () => {
  /*
   * Cazul cel mai defavorabil: sub navbar trece o zonă neagră (fotografie întunecată); fundalul e
   * --c-paper la --navbar-alfa peste negru (blur-ul doar mediază, nu întunecă), plus granulația.
   */
  const alfa = numarToken('navbar-alfa');
  const fundal = amesteca('#000000', culoare('c-paper'), alfa);

  it('opacitatea e între 0.9 și 1', () => {
    expect(alfa).toBeGreaterThanOrEqual(0.9);
    expect(alfa).toBeLessThanOrEqual(1);
  });

  it('textul (ink), rândul de sus al wordmark-ului (ink la .8) ≥ 4.5:1; conturul butoanelor și roșul (UI) ≥ 3:1', () => {
    expect(contrastCuGranulatie(culoare('c-ink'), fundal)).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(amesteca(fundal, culoare('c-ink'), 0.8), fundal)).toBeGreaterThanOrEqual(4.5);
    // V5: numele biroului în --c-wordmark; rândul de sus la opacitate .8.
    expect(contrastCuGranulatie(culoare('c-wordmark'), fundal)).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(amesteca(fundal, culoare('c-wordmark'), 0.8), fundal)).toBeGreaterThanOrEqual(4.5);
    expect(contrastCuGranulatie(culoare('c-ink'), fundal)).toBeGreaterThanOrEqual(3);
    expect(contrastCuGranulatie(culoare('c-rosu'), fundal)).toBeGreaterThanOrEqual(3);
    // Butonul plin își are fundalul propriu (alb pe roșu), neschimbat.
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
