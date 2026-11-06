import { describe, expect, it } from 'vitest';
import { gasesteTextRo } from '../../scripts/verifica-engleza.mjs';

const pagina = (corp: string) => `<!doctype html><html lang="en"><head><title>Notary</title></head><body>${corp}</body></html>`;

describe('verifica:en – gasesteTextRo', () => {
  it('găsește textul în română nemarcat (inclusiv în <html lang="en">)', () => {
    const r = gasesteTextRo(pagina('<p>Închis astăzi</p><img alt="Fotografie clădire">'));
    expect(r.gasite.map((g) => g.unde)).toEqual(['<p>', 'img[alt]']);
  });

  it('ignoră recenziile marcate cu limba lor (CardRecenzie pune lang când diferă de pagină)', () => {
    const html = pagina(
      '<article><blockquote lang="ro"><p>Mulțumesc pentru răbdare și profesionalism!</p></blockquote>' +
        '<strong lang="ro">Ștefan M.</strong></article>' +
        '<article><blockquote lang="fr"><p>Très bien, notaire à Brașov.</p></blockquote></article>' +
        '<article><blockquote lang="it"><p>Grazie, șțăî</p></blockquote></article>',
    );
    const r = gasesteTextRo(html);
    expect(r.gasite).toEqual([]);
    expect(r.altaLimba).toBe(4); // ro (text + autor), fr, it
  });

  it('o recenzie în română fără lang e semnalată', () => {
    const r = gasesteTextRo(pagina('<blockquote><p>Mulțumesc frumos!</p></blockquote>'));
    expect(r.gasite[0]?.cuvinte).toEqual(['Mulțumesc']);
  });

  it('ignoră marcajele «DE COMPLETAT» și numele proprii', () => {
    const r = gasesteTextRo(pagina('<p><mark class="todo">«DE COMPLETAT: strada și numărul»</mark>, Brașov</p><p>Bojan Elena Luminița</p>'));
    expect(r.gasite).toEqual([]);
    expect(r.marcaje).toBe(1);
  });
});
