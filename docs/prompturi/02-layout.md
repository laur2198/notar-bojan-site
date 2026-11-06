# Prompt 2 – Layout, header, footer, bara de acțiuni pe mobil

Branch: `etapa-2-layout`

--- PROMPT ---

Citește `CLAUDE.md` (mai ales secțiunile 4, 5, 6 și 8) și codul existent din etapa 1. Fă un plan și așteaptă aprobarea mea.

## Context

Schelet-ul, schemele de conținut și tokens-urile există deja. Acum construiești carcasa comună a tuturor paginilor. Prioritatea e un om în vârstă, pe telefon, care trebuie să poată suna sau cere o programare de pe orice pagină.

## Ce construiești

1. **Texte de interfață** în `src/i18n/ro.ts` și `src/i18n/en.ts`, cu helperul `t(locale, key)` și `routeMap` RO↔EN (secțiunea 6). Include etichetele de meniu, butoanele („Programare” / „Book an appointment”, „Sunați” / „Call us”), „Sari la conținut”, zilele săptămânii, „Deschis acum”, „Închis acum”, „Închis astăzi – {motiv}”.
2. **`src/layouts/BaseLayout.astro`** (props: `locale`, `title`, `description`, `draft?`, `breadcrumbs?`):
   - `<html lang>`, meta viewport, `theme-color` (`--c-wood-800`), favicon placeholder (SVG simplu cu inițiala „B” pe maro);
   - componenta `Seo.astro`: title, description, canonical, Open Graph, `hreflang` pentru perechile din `routeMap`, plus `noindex` în modul preview;
   - SkipLink → Header → `<main id="continut">` → Footer → BaraActiuni.
3. **`Header.astro`:**
   - în stânga, wordmark-ul text pe două rânduri: „Bojan Elena Luminița” (serif) / „Notar public · Brașov”. E logo text, logo-ul grafic vine mai târziu;
   - pe desktop (≥ 1024 px): meniu (RO: Servicii, Programare, Întrebări frecvente, Despre, Contact; EN: Services, Appointments, FAQ, Contact), telefonul vizibil ca link `tel:` cu iconiță, butonul primar „Programare” și comutatorul RO | EN;
   - sub 1024 px: wordmark, comutator și butonul „Meniu”. Meniul mobil folosește `<details>/<summary>` sau `<dialog>`, ca să funcționeze **fără JS**. Linkurile din el au cel puțin 48 px înălțime, iar meniul se închide la Escape (enhancement cu JS);
   - pagina curentă e marcată cu `aria-current="page"`.
4. **`BaraActiuni.astro`**, doar sub 768 px: bară fixă jos, cu două butoane egale, „Sunați” (`tel:`) și „Programare” (`/programare/` sau `/en/appointments/`). Respectă `env(safe-area-inset-bottom)`. `body` primește `padding-bottom` cât înălțimea barei, ca să nu acopere footer-ul.
5. **`Footer.astro`**, pe fundal `--c-wood-900`:
   - denumirea completă a biroului, adresa, telefonul, emailul;
   - programul săptămânal (`ProgramSaptamana.astro`);
   - linkuri: Servicii, Recenzii, Întrebări frecvente, Contact, Politica de confidențialitate;
   - „© {an} Birou Individual Notarial Bojan Elena Luminița”.

   Focusul pe footer folosește `--c-focus-on-dark`.
6. **`ProgramSaptamana.astro`:** tabel semantic, cu `caption` vizibil sau `sr-only`, din `birou.program`. Ziua curentă e evidențiată prin JS (enhancement). Fără JS, tabelul e complet și corect.
7. **`StareProgram.astro`:** afișează „Deschis acum · până la 17:00”, „Închis acum · deschidem luni la 09:00” sau „Închis astăzi – Crăciunul”, calculat în browser pe `Europe/Bucharest` din `program` și `zileLibere`. Fără JS nu afișează nimic. Pune logica într-o funcție pură, în `src/lib/program.ts`, și **scrie teste** pentru ea (Vitest): zi lucrătoare în program, după program, weekend, zi liberă, vineri cu program redus.
8. **`DraftBadge.astro`:** eticheta „Text propus – în curs de validare”, afișată doar în preview, când `esteDraft()` e adevărat. Folosește `mark.todo` prin `marcheazaPlaceholder()` pentru câmpurile text.
9. **`Breadcrumbs.astro`** (`nav aria-label`, listă ordonată, ultimul element cu `aria-current="page"`).
10. **Pagini temporare** `src/pages/index.astro` și `src/pages/en/index.astro`, care folosesc layout-ul și afișează doar un `h1` cu titlul din `acasa.yaml`, ca să poți verifica carcasa. Etapa 3 le înlocuiește.

## Ce NU faci

- Nu construiești conținutul paginii Acasă (etapa 3) și nici alte pagini.
- Nu încarci nicio resursă externă.
- Nu folosești JS pentru funcții de bază: navigarea, telefonul și programarea merg fără JS.

## Criterii de acceptare

- Cu JS dezactivat, pe 375 px: meniul se deschide, „Sunați” și „Programare” sunt vizibile și funcționale, programul apare complet.
- Navigarea doar cu tastatura: skip link vizibil la primul Tab, ordine logică, focus vizibil pe toate fundalurile, meniul mobil operabil.
- Bara de jos nu acoperă niciun conținut la finalul paginii.
- Comutatorul RO/EN duce la pagina corespondentă sau la `/en/`.
- `npm run build` și `npm run check` trec, testele Vitest trec, axe dă 0 încălcări serious/critical pe `/` și pe `/en/`.
- Capturi pe 375 px (meniu închis și deschis) și pe 1280 px.

## La final

Raportează verificările și ce a rămas deschis. Commit: `feat: layout, header, footer, bara de acțiuni mobil`.
