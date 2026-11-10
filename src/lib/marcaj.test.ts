import { describe, expect, it } from 'vitest';
import { esteDraft, marcheazaInHtml, marcheazaPlaceholder, textAlt } from './marcaj';

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

describe('textAlt', () => {
  it('scoate marcajele «DE VALIDAT: …» și «DE COMPLETAT: …», păstrează textul', () => {
    expect(textAlt('«DE VALIDAT: Lampă pe un birou de lemn»')).toBe('Lampă pe un birou de lemn');
    expect(textAlt('«DE COMPLETAT: descrierea fotografiei»')).toBe('descrierea fotografiei');
    expect(textAlt('«DE COMPLETAT»')).toBe('');
    expect(textAlt('Text fără marcaj')).toBe('Text fără marcaj');
    expect(textAlt(undefined)).toBe('');
  });
});

describe('esteDraft: «DE VALIDAT» și fotografiile provizorii', () => {
  it('«DE VALIDAT» într-un câmp', () => expect(esteDraft({ data: { validat: true, alt: '«DE VALIDAT: x»' } })).toBe(true));
  it('fotoProvizorie: true, oricât de adânc', () =>
    expect(esteDraft({ data: { validat: true, pasi: { lista: [{ fotoProvizorie: true }] } } })).toBe(true));
  it('fotoProvizorie: false nu contează', () => expect(esteDraft({ data: { validat: true, fotoProvizorie: false } })).toBe(false));
});
