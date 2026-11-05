# notar-bojan-site

Site-ul static al Biroului Individual Notarial Bojan Elena Luminița (Brașov). Este construit cu Astro 7, iar conținutul se editează din Pages CMS.

Regulile proiectului sunt în [`CLAUDE.md`](./CLAUDE.md), iar prompturile pe etape în [`docs/prompturi/`](./docs/prompturi/).

## Cerințe

- **Node ≥ 22.23.4**, cerut de Astro 7. Recomandat: ultima versiune LTS. Verificați cu `node -v`.
- npm

```sh
npm install
```

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | Server local pe `http://localhost:4321` |
| `npm run build` | Build de **preview** în `dist/`: rezumatul conținutului nevalidat, apoi `astro build` |
| `npm run build:prod` | Build de **producție**: oprește build-ul dacă există conținut nevalidat (vezi mai jos) |
| `npm run preview` | Servește local ultimul build din `dist/` |
| `npm run check` | `astro check`: verifică tipurile TypeScript și schemele de conținut |
| `npm test` | Testele Vitest pentru logica pură (program, linkuri de contact, marcaje, rute) |
| `npm run verifica` | Doar verificarea conținutului (preview: rezumat; `SITE_MODE=production`: listă și cod de ieșire 1) |

Ghidul de stil intern e la `/stil/`: paleta cu contrastele calculate, tipografia, butoanele, diacriticele. Pagina e `noindex` și e exclusă din sitemap.

## Preview și producție

Modul se alege cu variabila de mediu `SITE_MODE`:

- **`preview`** (implicit): textele cu `validat: false` sau cu `«DE COMPLETAT…»` apar marcate pe site, iar paginile au `noindex`.
- **`production`**: `scripts/verifica-continut.mjs` rulează înainte de `astro build` și **oprește build-ul** (cod de ieșire 1) dacă un fișier din `src/content/` are `validat: false` sau `«DE COMPLETAT`. Afișează fișierele și liniile.

```sh
npm run build:prod
```

Scriptul folosește `cross-env`, deci merge la fel pe Windows, macOS și Linux. Cât timp biroul nu a validat tot conținutul, comanda **trebuie** să eșueze.

Alte variabile:

- `SITE_URL`: adresa publică a site-ului (canonical, sitemap). Implicit `https://notar-bojan.pages.dev`. Se poate pune într-un fișier `.env`, ignorat de git.

## Structura

```
.pages.yml              configurarea Pages CMS (meniul, câmpurile, media)
astro.config.mjs        site, i18n (ro implicit fără prefix, en sub /en/), sitemap
scripts/
  verifica-continut.mjs verificarea conținutului înainte de build
src/
  assets/media/         imaginile încărcate din CMS (optimizate de Astro)
  content/              conținutul scris de om – NU se modifică din cod
  content.config.ts     schemele Zod ale colecțiilor
  components/           componentele carcasei (Header, Footer, BaraActiuni, ProgramSaptamana,
                        StareProgram, DraftBadge, Breadcrumbs, Seo, ComutatorLimba…)
  i18n/
    ro.ts, en.ts        textele de interfață (en.ts trebuie să aibă exact cheile din ro.ts)
    index.ts            t(locale, cheie), RUTE, routeMap RO ↔ EN, comutatorul de limbă
  layouts/
    BaseLayout.astro    SkipLink → Header → <main id="continut"> → Footer → BaraActiuni
  lib/
    continut.ts         getBirou(), SITE_MODE (+ re-exportă funcțiile din marcaj.ts)
    marcaj.ts           esteDraft(), marcheazaPlaceholder() – pure, testate
    contact.ts          linkTelefon(), linkEmail() – fără tel:/mailto: din date necompletate
    program.ts          „Deschis acum / Închis acum”, pe fusul Europe/Bucharest – pur, testat
    contrast.ts         calculul contrastului WCAG
    tokens.ts           culorile din tokens.css, citite la build
  pages/
    index.astro         pagina principală RO (temporară până la etapa 3)
    en/index.astro      pagina principală EN (temporară până la etapa 6)
    stil.astro          ghidul de stil intern (/stil/)
  styles/
    tokens.css          design tokens (copie exactă din CLAUDE.md §5)
    fonturi.css         @font-face self-hosted (latin + latin-ext)
    global.css          reset, tipografie, focus, utilitare, butoane
docs/
  prompturi/            prompturile pe etape
  capturi/              capturi de ecran pentru verificări (ignorat de git)
```

## Conținut și Pages CMS

- Fiecare fișier din `src/content/` are câmpul `validat`, afișat în CMS ca **„Text verificat și aprobat de birou”**.
- Schemele din `src/content.config.ts` verifică formatul datelor reale: telefon `+40` și 9 cifre, email, link `https://`, ore `HH:MM`, date `AAAA-LL-ZZ`. Acceptă însă și marcajele `«DE COMPLETAT`, ca preview-ul să se genereze înainte să existe datele.
- **Comentariile din fișierele YAML se pierd** la prima salvare din CMS, pentru că Pages CMS rescrie fișierul. Indicațiile pentru birou stau de aceea în descrierile câmpurilor din `.pages.yml`. `settings.content.merge: true` păstrează cheile care nu sunt descrise în `.pages.yml`.
- Orice câmp nou se adaugă **în ambele locuri**: în `src/content.config.ts` și în `.pages.yml`.

### Imagini (`media`)

```yaml
media:
  input: src/assets/media
  output: ../../../assets/media
```

- Imaginile stau în `src/assets/media/`, nu în `public/`. Astfel trec prin `image()` și `<Image>`: AVIF/WebP, dimensiuni explicite. Imaginile din `public/` nu sunt optimizate.
- `image()` rezolvă calea **relativ la fișierul de conținut**, iar Pages CMS scrie în fișier `output` + numele imaginii. `../../../assets/media` e corect pentru fișierele din `src/content/pagini/ro/` și `src/content/pagini/en/`. Acolo sunt toate câmpurile de imagine de acum (Acasă RO/EN, Despre).
- **Limitare:** un câmp de imagine adăugat într-un fișier de altă adâncime (de ex. `src/content/setari/birou.yaml`) are nevoie de altă cale. Soluția e o a doua sursă `media` cu nume propriu și `output` potrivit, aleasă din câmp cu `options.media`.
- Formate acceptate: JPG, PNG, WebP. Fișierele HEIC de pe iPhone nu sunt acceptate, pentru că Astro nu le poate procesa. Numele fișierelor încărcate sunt transformate automat în nume sigure (`rename: safe`).

## Fonturi

Fonturile sunt self-hosted din pachetele Fontsource `@fontsource-variable/source-serif-4` (titluri) și `@fontsource-variable/source-sans-3` (text). `src/styles/fonturi.css` declară doar subseturile **latin** și **latin-ext**, axa `wght`, stil normal: 4 fișiere, aproximativ 180 KB în total. Literele ș, ț și ă sunt în latin-ext, deci o pagină în română le încarcă pe ambele.

- **Fără italic.** Niciun text din `src/content/` nu conține italic (`*…*` sau `_…_`), așa că fișierele italice nu se încarcă. Dacă apare italic în conținut, se adaugă în `fonturi.css` fișierul `source-sans-3-{latin,latin-ext}-wght-italic.woff2`. Până atunci browserul ar sintetiza italicul.
- Source Serif 4 se încarcă fără axa de dimensiune optică (`opsz`), ale cărei fișiere sunt de circa 2,4 ori mai mari.

## Carcasa (etapa 2)

- **Header:** desktop (≥ 1024 px) pe două niveluri: telefonul și comutatorul de limbă sus, meniul și butonul „Programare” jos. Sub 1024 px: wordmark, comutator (doar linkul către cealaltă limbă) și „Meniu”, un `<details>` care merge fără JS; JS adaugă închiderea la Escape și la click în afară. Între 768 și 1023 px header-ul are un rând în plus cu telefonul și „Programare”, pentru că bara de jos apare doar sub 768 px.
- **Bara de jos** (< 768 px): „Sunați” și „Programare”. `body` primește `padding-bottom` cât bara (`--inaltime-bara` în `global.css`).
- **Date necompletate:** `linkTelefon()` / `linkEmail()` nu generează `tel:` / `mailto:` din texte `«DE COMPLETAT`. În preview, textul apare marcat, iar „Sunați” din bara de jos rămâne vizibil cu `aria-disabled="true"` și fără `href`.
- **„Deschis acum”** se calculează în browser pe fusul Europe/Bucharest, din `program` și `zileLibere`, și se actualizează la fiecare minut. Fără JS nu apare; programul complet e oricum în footer.
- **Pe fundal închis** (`.pe-inchis`: header, footer), linkurile preiau culoarea textului, iar focusul devine crem.

## Note pentru etapele următoare

- **Sitemap (etapa 6):** opțiunea `i18n` din `@astrojs/sitemap` împerechează doar căi identice (`/` ↔ `/en/`). Pentru perechile cu slug diferit (`/servicii/` ↔ `/en/services/`) e nevoie de `serialize()` cu `routeMap`. Locul e marcat cu un TODO în `astro.config.mjs`.
- **hreflang:** paginile folosesc `ro` / `en` (CLAUDE.md §6), iar sitemap-ul `ro-RO` / `en-US` (promptul etapei 1). Ar fi bine să fie aceleași coduri; de unificat în etapa 6.
- `compressHTML: true` e setat explicit. Astro 7 folosește implicit `'jsx'`, care șterge spațiile dintre elementele inline.
