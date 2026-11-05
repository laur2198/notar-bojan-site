# Prompt 6 – Versiunea în engleză (set redus de pagini)

Branch: `etapa-6-engleza`

--- PROMPT ---

Citește `CLAUDE.md` (secțiunea 6), fișierele din `src/content/pagini/en/`, `src/content/servicii-en/servicii.yaml`, `src/content/faq/en.yaml`, `src/i18n/en.ts` și paginile RO existente. Fă un plan și așteaptă aprobarea mea.

## Context

Engleza acoperă intenționat doar 5 pagini (decizie contractuală): Acasă, Servicii, Programare, Întrebări frecvente și Contact. Publicul sunt străinii din Brașov care au nevoie de un act notarial. Cel mai important mesaj pentru ei: actul se încheie în română, iar la semnare au nevoie de un interpret autorizat.

## Ce construiești

1. **`/en/`:** aceeași structură ca Acasă RO, din `pagini/en/acasa.yaml`, cu aceleași componente și `locale="en"`. Diferențe:
   - secțiunea Servicii folosește `servicii-en/servicii.yaml`; fiecare card duce la `/en/services/#{slugRo}`;
   - secțiunea Despre afișează nota despre limbă și interpret (din `despre.text`) într-o casetă evidențiată, cu iconiță de informare;
   - FAQ arată primele `faq.numarAfisat` întrebări din `faq/en.yaml`.
2. **`/en/services/`:** intro, carduri cu ancore (`id={slugRo}`), textul `fees`, iar pe fiecare card linkul secundar „Details in Romanian” → `/servicii/{slugRo}/` (RO nu are prefix), cu `hreflang="ro"` și `lang="ro"` pe link. Fără tabel de prețuri.
3. **`/en/appointments/`:** echivalentul paginii `/programare/`, cu același buton spre `programareUrl`.
4. **`/en/faq/`:** toate întrebările din `faq/en.yaml`, cu JSON-LD `FAQPage` (`inLanguage: en`).
5. **`/en/contact/`:** echivalentul paginii de contact, din `pagini/en/contact.md`.
6. **Footer EN:** linkul spre politica de confidențialitate duce la `/confidentialitate/` și are textul „Privacy policy (in Romanian)”.
7. Completează **`routeMap`** și **`hreflang`** pentru toate perechile. Verifică comutatorul RO/EN pe toate paginile site-ului: pe paginile fără echivalent duce la `/en/`.
8. Formatul datelor și al orelor folosește `Intl` cu `en-GB` pe paginile EN (de ex. „Closed today – Christmas Day”). Motivele zilelor libere rămân în română, dacă nu există traducere. Adaugă în schema `zileLibere` un câmp opțional `motivEn` și folosește-l când există. Raportează schimbarea de schemă: e singura modificare de schemă permisă în această etapă.

## Ce NU faci

- Nu traduci paginile individuale de servicii, Recenzii, Despre sau Confidențialitate.
- Nu folosești traducere automată la runtime și niciun widget de traducere.
- Nu modifici textele din `src/content/`, în afară de câmpul nou de schemă.

## Criterii de acceptare

- Toate cele 5 pagini EN se generează, cu `lang="en"`.
- `hreflang` e corect în pereche (RO ↔ EN, plus `x-default` → RO) pe cele 5 perechi și lipsește pe paginile fără pereche.
- În sitemap apar paginile EN, cu alternatele lor.
- Niciun text de interfață în română pe paginile EN (verifică automat: caută diacritice românești în `dist/en/**/*.html`, excluzând conținutul marcat `lang="ro"` și numele proprii; raportează rezultatul).
- `npm run build`, `npm run check`, testele și axe trec.
- Capturi pe 375 și pe 1280 px pentru `/en/` și `/en/services/`.

## La final

Commit: `feat: versiunea în engleză – 5 pagini`.
