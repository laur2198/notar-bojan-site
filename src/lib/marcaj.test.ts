import { describe, expect, it } from 'vitest';
import { esteDraft, marcheazaInHtml, marcheazaPlaceholder } from './marcaj';

describe('marcheazaPlaceholder', () => {
  it('escapează HTML-ul și marchează toate formele de marcaj', () => {
    expect(marcheazaPlaceholder('A <b>&</b> «DE COMPLETAT: x» și «DE COMPLETAT» apoi «DE COMPLETAT neînchis')).toBe(
      'A &lt;b&gt;&amp;&lt;/b&gt; <mark class="todo">«DE COMPLETAT: x»</mark> și ' +
        '<mark class="todo">«DE COMPLETAT»</mark> apoi <mark class="todo">«DE COMPLETAT neînchis</mark>',
    );
  });

  it('text fără marcaj: doar escapare', () => {
    expect(marcheazaPlaceholder('Brașov "centru"')).toBe('Brașov &quot;centru&quot;');
  });
});

describe('esteDraft', () => {
  it('validat: false', () => expect(esteDraft({ data: { validat: false, titlu: 'x' } })).toBe(true));
  it('marcaj într-un câmp imbricat', () =>
    expect(esteDraft({ data: { validat: true, a: [{ b: '«DE COMPLETAT»' }] } })).toBe(true));
  it('marcaj doar în corpul Markdown', () =>
    expect(esteDraft({ data: { validat: true }, body: 'text «DE COMPLETAT: x»' })).toBe(true));
  it('validat și fără marcaje', () =>
    expect(esteDraft({ data: { validat: true, data: new Date(), n: 3 }, body: 'gata' })).toBe(false));
});

describe('marcheazaInHtml', () => {
  it('marchează doar în text, nu în atribute', () => {
    const html = '<h2 id="x">Titlu</h2><p title="«DE COMPLETAT»">Sediul în «DE COMPLETAT: adresa», CIF «DE COMPLETAT».</p>';
    expect(marcheazaInHtml(html)).toBe(
      '<h2 id="x">Titlu</h2><p title="«DE COMPLETAT»">Sediul în <mark class="todo">«DE COMPLETAT: adresa»</mark>, CIF <mark class="todo">«DE COMPLETAT»</mark>.</p>',
    );
  });

  it('nu atinge HTML-ul fără marcaje și nu trece marcajul neînchis peste o etichetă', () => {
    expect(marcheazaInHtml('<p>Text <strong>normal</strong></p>')).toBe('<p>Text <strong>normal</strong></p>');
    expect(marcheazaInHtml('<li>«DE COMPLETAT: alte</li><li>x»</li>')).toBe('<li><mark class="todo">«DE COMPLETAT: alte</mark></li><li>x»</li>');
  });
});
