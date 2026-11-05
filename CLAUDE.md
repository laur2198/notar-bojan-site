# CLAUDE.md – Site Birou Individual Notarial Bojan Elena Luminița

Citește integral acest fișier la începutul fiecărei sesiuni. Este sursa de adevăr pentru proiect. Dacă un prompt contrazice acest fișier, oprește-te și semnalează conflictul înainte să scrii cod.

## 1. Proiectul

- **Client:** Birou Individual Notarial Bojan Elena Luminița, Brașov. Un singur notar public titular.
- **Prestator:** Green Pheonix Concept SRL (contract nr. 7 / 03.11.2026).
- **Ce construim:** site de prezentare static, mobile first, în română, cu o versiune redusă în engleză.
- **Public țintă:** clienți de toate vârstele, mulți în vârstă și nefamiliarizați cu tehnologia. Fiecare decizie de UI se judecă după întrebarea: „poate un om de 70 de ani, pe un telefon, să afle programul, să sune și să ceară o programare în sub un minut?”.

## 2. Stack (nu se schimbă fără aprobare)

- **Astro**, ultima versiune stabilă, `output: 'static'`. Content Layer API (`src/content.config.ts`, loader `glob`/`file`). Verifică documentația curentă Astro înainte de API-uri de care nu ești sigur.
- **CSS propriu** cu custom properties (design tokens) în `src/styles/`. Fără Tailwind, fără framework UI, fără jQuery.
- **JavaScript minim**, doar ca progressive enhancement (ex.: „Deschis acum / Închis”). Site-ul trebuie să funcționeze complet cu JS dezactivat.
- **Fonturi self-hosted** prin Fontsource: `@fontsource-variable/source-serif-4` (titluri) și `@fontsource-variable/source-sans-3` (text). Verifică randarea corectă a diacriticelor românești cu virgulă: ș Ș ț Ț (U+0219, U+0218, U+021B, U+021A), nu cu sedilă (ş ţ).
- **Pages CMS** (`.pages.yml` în rădăcină) pentru editarea conținutului. Documentație: https://pagescms.org/llms-full.txt
- **Găzduire:** Cloudflare (static). Fără funcții server, fără bază de date.
- **Node:** versiunea LTS curentă. Package manager: npm.

## 3. Interdicții (nu se negociază)

1. **Fără resurse externe încărcate automat:** fără Google Fonts, CDN-uri, iframe Google Maps sau Google Calendar la încărcarea paginii, fără analytics, fără pixeli. Motiv: GDPR (clientul este operator de date) și performanță. Hărțile și programarea se deschid prin link sau, dacă se cere embed, prin „click pentru încărcare” (facade) cu text de informare.
2. **Fără scroll hijacking, fullpage scroll, parallax, carusele automate, animații de intrare.** Respectă `prefers-reduced-motion`. Tranzițiile de hover/focus sunt permise (max. 200 ms).
3. **Fără calculator de onorarii** și fără cifre de onorarii inventate.
4. **Restricții deontologice ale profesiei notariale:** fără superlative („cel mai bun”, „cel mai rapid”), fără comparații cu alți notari, fără reduceri sau promoții, fără promisiuni de rezultat sau de termen garantat, fără mărturii scrise de noi. Recenziile afișate sunt exclusiv recenzii reale de pe Google, introduse de client.
5. **Nu inventa date ale biroului** (telefon, adresă, CIF, program, ani de experiență). Folosește marcajul `«DE COMPLETAT: ...»`.
6. **Nu modifica fișierele din `src/content/`** decât dacă promptul o cere explicit. Conținutul îl scrie omul, nu tu.

## 4. Accesibilitate (contractual – WCAG 2.1 AA)

- Text de bază **18 px** (`1.125rem`), `line-height` minim 1.6, lățime de rând max. ~70 caractere.
- Contrast AA: minim 4.5:1 text normal, 3:1 text mare și elemente UI. Verifică fiecare combinație nouă de culori.
- Ținte de atingere minim **48×48 px**.
- `:focus-visible` clar pe toate elementele interactive (contur de 3 px, nu doar schimbare de culoare).
- Skip link „Sari la conținut”, landmark-uri (`header`, `nav`, `main`, `footer`), un singur `h1` pe pagină, ierarhie de titluri fără salturi.
- `lang="ro"` / `lang="en"` corect pe `<html>`; atribut `lang` pe linkul de schimbare a limbii.
- Telefonul (link `tel:`) și butonul „Programare” vizibile pe fiecare pagină: în header pe desktop, într-o **bară fixă jos** pe mobil (< 768 px).
- Formular/link-uri descriptive: fără „click aici”. Linkurile care deschid tab nou anunță asta (text vizual sau `sr-only`).
- Acordeoanele FAQ folosesc `<details>/<summary>` nativ.

## 5. Design

**Direcție:** sobru, cald, de încredere. Structura homepage-ului urmează modelul notariatului Jesús Benavides (Barcelona) ales de clientă: imediat sub hero, o bandă cu informațiile practice (program, rating Google, adresă). Culoarea dominantă e **maro închis**, stabilită cu clienta. Nu se discută.

### Tokens (în `src/styles/tokens.css`)

```css
:root {
  /* Culori */
  --c-brown-900: #2B1B12;  /* text principal, fundal footer */
  --c-brown-800: #3D281C;  /* culoarea de brand: butoane primare, header */
  --c-brown-600: #6B4A36;  /* text secundar pe crem (verificat AA) */
  --c-cream-50:  #FBF8F3;  /* fundal pagină */
  --c-cream-100: #F4EDE3;  /* fundal secțiuni alternante */
  --c-sand-200:  #E6DACA;  /* borduri, separatoare */
  --c-ochre-500: #B0844A;  /* decorativ pe crem (3.2:1 – NU text); pe --c-brown-900 poate fi text (4.9:1) */
  --c-white:     #FFFFFF;
  --c-focus:     #1F5FBF;  /* contur focus pe fundaluri deschise (5.2–5.7:1) */
  --c-focus-on-dark: #F4EDE3; /* contur focus pe header/footer/butoane maro (≥13:1); #1F5FBF pică acolo (2.3:1) */
  --c-ok:        #2F6B3A;  /* „Deschis acum” */
  --c-closed:    #8A2E22;  /* „Închis” */

  /* Tipografie */
  --font-serif: 'Source Serif 4 Variable', Georgia, serif;
  --font-sans:  'Source Sans 3 Variable', system-ui, sans-serif;
  --fs-base: 1.125rem;   /* 18px */
  --fs-sm:   1rem;       /* 16px – minim absolut, doar pentru note */
  --fs-lg:   1.25rem;
  --fs-h3:   clamp(1.375rem, 1.2rem + 0.6vw, 1.625rem);
  --fs-h2:   clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem);
  --fs-h1:   clamp(2.125rem, 1.6rem + 2vw, 3.25rem);

  /* Spațiere, raze, umbre */
  --space-1: .5rem; --space-2: 1rem; --space-3: 1.5rem; --space-4: 2rem;
  --space-5: 3rem;  --space-6: 4.5rem; --space-7: 6rem;
  --radius: 6px; --radius-lg: 12px;
  --shadow: 0 1px 2px rgb(43 27 18 / .06), 0 4px 16px rgb(43 27 18 / .06);
  --container: 72rem;
  --measure: 68ch;
}
```

Verifică la implementare contrastul real al perechilor folosite (ex. alb pe `--c-brown-800`, `--c-brown-600` pe `--c-cream-100`) și ajustează valoarea, nu regula, dacă una pică AA.

- Titluri în serif, text în sans. Fără text justify. Fără majuscule integrale pe paragrafe.
- Butonul primar: fundal `--c-brown-800`, text alb, înălțime min. 52 px. Butonul secundar: contur `--c-brown-800`, fundal transparent.
- Fotografii: un singur raport de aspect per secțiune, `object-fit: cover`, componenta `<Image>` din Astro (AVIF/WebP, `width`/`height` explicite). Până vin fotografiile reale, folosește blocuri placeholder cu fundal `--c-cream-100` și eticheta „Fotografie – de completat”. Fără fotografii stock.

## 6. Limbi și rute

Româna e limba implicită, la rădăcină, fără prefix. Engleza stă sub `/en/`, cu un set redus de pagini (decizie contractuală, act adițional nr. 1).

| Pagină | RO | EN |
|---|---|---|
| Acasă | `/` | `/en/` |
| Servicii și prețuri | `/servicii/` | `/en/services/` (prezentare generală, fără pagini individuale) |
| Pagină serviciu | `/servicii/[slug]/` | – |
| Programare | `/programare/` | `/en/appointments/` |
| Întrebări frecvente | `/intrebari-frecvente/` | `/en/faq/` |
| Recenzii | `/recenzii/` | – |
| Despre | `/despre/` | – |
| Contact | `/contact/` | `/en/contact/` |
| Confidențialitate | `/confidentialitate/` | – (link către varianta RO) |
| 404 | `/404` | – |

- Configurează i18n-ul nativ Astro (`defaultLocale: 'ro'`, `locales: ['ro','en']`, `prefixDefaultLocale: false`).
- Textele de interfață (meniu, butoane, etichete) stau în `src/i18n/ro.ts` și `src/i18n/en.ts`, cu helper `t(locale, key)`. Nu hardcoda texte de UI în componente.
- Comutatorul RO/EN din header: există un map `routeMap` (RO ↔ EN). Dacă o pagină RO nu are echivalent EN, linkul EN duce la `/en/`.
- `hreflang` (`ro`, `en`, `x-default` → RO) pe perechile existente.

## 7. Modelul de conținut

Tot conținutul editabil stă în `src/content/` și e expus în `.pages.yml`. Componentele nu conțin texte de conținut, doar texte de UI din `src/i18n/`.

```
src/content/
  setari/birou.yaml               # o singură intrare: datele biroului (vezi mai jos)
  pagini/ro/acasa.yaml            # textele homepage-ului RO
  pagini/en/acasa.yaml            # textele homepage-ului EN
  pagini/ro/despre.md
  pagini/ro/programare.md
  pagini/en/programare.md
  pagini/ro/contact.md
  pagini/en/contact.md
  pagini/ro/confidentialitate.md
  servicii/ro/*.md                # câte un fișier pe serviciu
  servicii-en/servicii.yaml       # listă scurtă pentru /en/services/
  preturi/ro.yaml                 # onorarii orientative pe serviciu
  faq/ro.yaml
  faq/en.yaml
  recenzii/recenzii.yaml          # recenzii Google reale, introduse manual
```

### Câmpuri obligatorii

Fiecare fișier de conținut are câmpul **`validat: boolean`**. Clientul îl bifează în CMS după ce aprobă textul.

**`setari/birou.yaml`:** `denumire`, `notar`, `adresa` (`strada`, `oras`, `judet`, `codPostal`), `telefon`, `telefonAfisat`, `email`, `emailActe`, `program` (listă `{ zi, deschidere, inchidere, inchis }` pentru luni–duminică, ore `HH:MM`), `zileLibere` (listă `{ data: YYYY-MM-DD, motiv }`), `googleMapsUrl`, `googleProfilUrl`, `rating` (număr sau gol), `numarRecenzii` (număr sau gol), `programareUrl` (link pagină de programări Google Calendar), `coordonate` (`lat`, `lng`), `validat`.

**`servicii/ro/*.md` (frontmatter):** `titlu`, `slug`, `ordine` (număr), `evidentiat` (boolean, apare pe Acasă), `rezumat` (max. 160 caractere, folosit și ca meta description), `pentruCine`, `durata` (text, ex. „aprox. 1 oră”), `onorariu` (text), `acteNecesare` (listă de string-uri), `subiectEmail`, `validat`. Corpul Markdown are secțiunile `## Ce este`, `## Cum decurge`, `## Bine de știut`.

**`recenzii/recenzii.yaml`:** listă `{ autor, data: YYYY-MM-DD, nota: 1–5, text, sursa: 'Google' }`. Lista poate fi goală. Când e goală, secțiunea Recenzii afișează doar linkul „Vedeți recenziile pe Google” și ratingul, dacă există. **Nu genera niciodată recenzii, nici ca placeholder.**

### Moduri de build: preview vs. producție

- Variabila de mediu `SITE_MODE` = `preview` (implicit) sau `production`.
- În **preview**, conținutul cu `validat: false` sau cu `«DE COMPLETAT` apare cu eticheta vizibilă „Text propus – în curs de validare” (componentă `DraftBadge`), iar marcajele `«DE COMPLETAT: …»` se evidențiază cu fundal galben pal.
- În **producție**, scriptul `scripts/verifica-continut.mjs` rulează înainte de build și **eșuează** (exit 1) dacă găsește `validat: false` sau `«DE COMPLETAT` în `src/content/`, listând fișierele.
- Preview-urile au `<meta name="robots" content="noindex">`.

## 8. Funcții

- **Programare:** pagina `/programare/` explică fluxul (solicitare → biroul confirmă) și are buton spre `programareUrl` (pagina de programări Google Calendar), deschis în tab nou. Fără iframe la încărcare.
- **Trimiterea actelor:** pe fiecare pagină de serviciu, butonul „Trimiteți actele” = link `mailto:` către `emailActe`, cu `subject` = `subiectEmail` și un `body` precompletat (nume, telefon, data dorită, lista actelor atașate), codificat corect cu `encodeURIComponent`. Sub buton: lista `acteNecesare` și nota „Lista finală v-o confirmăm după verificarea actelor. Limita unui email este de 25 MB.”
- **„Deschis acum”:** calculat în browser, pe fusul `Europe/Bucharest`, din `program` + `zileLibere`. Fără JS se afișează programul complet al săptămânii.
- **Hartă:** link „Deschide în Google Maps” (`googleMapsUrl`). Opțional: facade cu imagine statică și click-to-load, cu text de informare despre cookie-urile Google.

## 9. SEO

- `title` și `meta description` unice pe pagină, canonical, Open Graph.
- JSON-LD: `Notary` (subtip `LegalService`/`LocalBusiness`) cu adresă, telefon, program (`openingHoursSpecification`), `geo`, `aggregateRating` **doar** dacă `rating` și `numarRecenzii` sunt completate. `FAQPage` pe paginile FAQ. `BreadcrumbList` pe paginile de serviciu.
- `@astrojs/sitemap` cu i18n; `robots.txt`.

## 10. Convenții de lucru

- Un prompt = o sesiune = un branch = un commit sau câteva commituri mici, cu mesaje în română (`feat: pagina Acasă`, `fix: contrast buton`).
- Înainte să declari un task gata, rulează obligatoriu:
  1. `npm run build` – zero erori și zero warning-uri de tip;
  2. `npx astro check` – zero erori;
  3. verificare de accesibilitate pe paginile atinse (`npx @axe-core/cli` pe `npm run preview` sau Playwright + axe), zero încălcări serious/critical;
  4. o captură de ecran pe 375 px și una pe 1280 px a paginilor atinse, salvate în `docs/capturi/` (nu se comit, sunt în `.gitignore`).
- Raportează la final: ce ai făcut, ce ai verificat, ce a rămas deschis. Nu declara „gata” ceva neverificat.
- Componente în `src/components/`, câte un fișier per componentă, cu props tipizate. Layout-uri în `src/layouts/`.
- Nu adăuga dependențe noi fără să explici de ce. Preferă soluțiile native.
