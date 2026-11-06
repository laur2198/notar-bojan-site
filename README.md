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
| `npm test` | Testele Vitest pentru logica pură (program, zile libere, linkuri, marcaje, rute, plural, Markdown) |
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

## Preview pe GitHub Pages

Preview-ul se publică automat la **https://laur2198.github.io/notar-bojan-site/**, prin workflow-ul `.github/workflows/pages.yml`:

- rulează la fiecare push pe `main` și manual (tab-ul **Actions** → „Preview pe GitHub Pages” → **Run workflow**);
- face `npm ci` și `npm run build` (build de **preview**: textele nevalidate sunt marcate, paginile au `noindex`), apoi publică doar `dist/`;
- `public/.nojekyll` oprește procesarea Jekyll a GitHub Pages (altfel README-ul și CLAUDE.md ar apărea ca pagini).

**Calea de bază (`BASE_PATH`).** Un site de proiect pe GitHub Pages stă sub `/notar-bojan-site/`, nu la rădăcina domeniului. Workflow-ul construiește cu:

```sh
SITE_URL=https://laur2198.github.io BASE_PATH=/notar-bojan-site/ npm run build
```

- `BASE_PATH` ajunge în `base` din `astro.config.mjs`. Implicit e `/`, deci local (`npm run dev`, `npm run build`) și pe domeniul final site-ul rămâne la rădăcină, neschimbat.
- Toate linkurile interne trec prin helperul `url()` din `src/lib/url.ts` (care folosește `import.meta.env.BASE_URL`), direct sau prin `cale()` din `src/i18n`. **Nu scrieți căi interne direct** (`href="/servicii/"`): folosiți `cale('servicii', locale)` sau `url('/servicii/')`. Ancorele merg la fel: `` `${cale('acasa', locale)}#program` ``.
- `RUTE` și `routeMap` conțin căi fără bază; baza se adaugă la afișare. Funcțiile care primesc `Astro.url.pathname` (comutatorul de limbă, `hreflang`, `aria-current`) scot întâi baza.
- Resursele procesate de Astro (CSS, JS, fonturi, imagini) primesc baza automat; canonical, `hreflang`, Open Graph și sitemap-ul folosesc `SITE_URL` + bază.
- Pagina `404.html` e servită de GitHub Pages pentru orice adresă inexistentă de sub `/notar-bojan-site/`; are toate căile absolute (cu bază), `noindex` și fără canonical.

Pentru a testa local ca pe GitHub Pages, aceeași `BASE_PATH` trebuie dată și la build, și la preview (preview-ul citește `base` din configurație):

```sh
BASE_PATH=/notar-bojan-site/ npm run build
BASE_PATH=/notar-bojan-site/ npm run preview   # http://localhost:4321/notar-bojan-site/
```

Pe Windows (PowerShell): `$env:BASE_PATH="/notar-bojan-site/"; npm run build; npm run preview`. Înainte de lucrul obișnuit, rulați din nou `npm run build` fără variabilă.

**Atenție:** în Astro 7, `npm run preview` pornește serverul **în fundal**. Un server pornit înainte (de ex. fără `BASE_PATH`) rămâne activ și răspunde în locul celui nou; opriți-l cu `npx astro preview stop` (starea: `npx astro preview status`).

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
    url.ts              url(): căile interne cu baza site-ului (GitHub Pages) – testat
    servicii.ts         serviciile vecine, potrivirea servicii ↔ preturi – testat
    jsonld.ts           BreadcrumbList, Service, @id-ul biroului (…/#birou) – testat
  pages/
    index.astro         pagina principală RO (temporară până la etapa 3)
    en/index.astro      pagina principală EN (temporară până la etapa 6)
    servicii/index.astro    /servicii/ – toate serviciile, onorariile orientative
    servicii/[slug].astro   /servicii/{slug}/ – câte o pagină pentru fiecare fișier din src/content/servicii/ro/
    404.astro           pagina 404 (RO + EN), funcțională și sub calea de bază
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
- `image()` rezolvă calea **relativ la fișierul de conținut**, iar Pages CMS scrie în fișier `output` + numele imaginii. `../../../assets/media` e corect pentru fișierele din `src/content/pagini/{ro,en}/` și `src/content/servicii/ro/` (aceeași adâncime). Acolo sunt toate câmpurile de imagine (Acasă RO/EN, Despre, imaginea opțională a fiecărui serviciu).
- **Limitare:** un câmp de imagine adăugat într-un fișier de altă adâncime (de ex. `src/content/setari/birou.yaml`) are nevoie de altă cale. Soluția e o a doua sursă `media` cu nume propriu și `output` potrivit, aleasă din câmp cu `options.media`.
- Formate acceptate: JPG, PNG, WebP. Fișierele HEIC de pe iPhone nu sunt acceptate, pentru că Astro nu le poate procesa. Numele fișierelor încărcate sunt transformate automat în nume sigure (`rename: safe`).

## Font

Un singur font, **Inter** (variabil), self-hosted din `@fontsource-variable/inter`, pentru titluri și text. `src/styles/fonturi.css` declară doar subseturile **latin** și **latin-ext**, axa `wght`, stil normal: 2 fișiere, ~133 KB în total. ș, ț și ă sunt în latin-ext, deci o pagină în română le încarcă pe amândouă.

- **Fără italic.** Niciun text din `src/content/` nu conține italic (`*…*` sau `_…_`), deci fișierele italice nu se încarcă. Dacă apare italic, se adaugă în `fonturi.css` `inter-{latin,latin-ext}-wght-italic.woff2`.

## Carcasa și pagina Acasă (etapele 2–3, calibrate după referința aleasă de clientă)

- **Calibrare doar din `tokens.css`:** spațierile și razele din componente sunt `var(--space-*)`, `var(--section-y*)`, `var(--radius*)` sau expresii derivate din ele (`calc(var(--space-1) / 2)`). Valori scrise direct rămân doar minimele de accesibilitate (48 / 52 / 56 px) și câteva lățimi (ex. lista de întrebări, max. 61.25rem).
- **Header:** alb, fix sus (`position: sticky`), `--header-h` (80 px) pe desktop și `--header-h-sm` (64 px) pe mobil; linie gray-200 jos, umbră după scroll (JS). Desktop (≥ 1280 px, pe toată lățimea ecranului): wordmark | meniu | RO | EN | telefon | email | „Programare”. Telefonul e un singur link, iconiță + număr; numărul apare de la 1360 px (pragul măsurat: header-ul cere ~1.292 px), sub prag rămâne doar iconița (cu numărul în `aria-label`). Sub 1280 px: meniu compact (`<details>`, merge fără JS); între 768 și 1279 px, telefonul și „Programare” rămân vizibile în header.
- **Bara de jos** (< 768 px): albă, patru acțiuni cu iconiță și etichetă de 14 px, 600 (`--fs-xs`): Sunați, Programare, Program (`/#program`), Locație (Google Maps). Etichetele și rândul de 13 px din wordmark sunt singurele texte sub 16 px (CLAUDE.md §4).
- **Footer:** deschis (gray-50, linie gray-200 sus), 4 coloane: wordmark + denumirea completă | Contact | Program | Linkuri; dedesubt © și politica de confidențialitate. Focusul e cel standard (`--c-focus`).
- **Pagina Acasă:** hero (wood-900, cu subtitlu) → banda de informații (`#program`, gri) → despre (gri) → servicii (alb) → cum lucrăm (alb, separat printr-o linie) → recenzii (gri) → întrebări (alb) → CTA (wood-800) → footer (gri). Pastila și cardul cu ratingul Google apar doar dacă `rating` și `numarRecenzii` sunt completate.
- **Date necompletate:** `linkTelefon()`, `linkEmail()`, `linkExtern()` nu generează `tel:`, `mailto:` sau linkuri externe din texte `«DE COMPLETAT`. În preview, butoanele rămân vizibile, cu `aria-disabled="true"` și fără `href`.
- **„Deschis acum”, programul de azi și zilele libere din următoarele 14 zile** se calculează în browser (fusul Europe/Bucharest). Fără JS nu apar; programul săptămânal complet e oricum în pagină.
- **Pe fundal închis** (`.pe-inchis`: hero, CTA), linkurile preiau culoarea textului, iar focusul devine `--c-focus-on-dark` (wood-300).

## Servicii (etapa 4)

- **`/servicii/`:** toate serviciile, în grila de pe Acasă (`GrilaServicii`), cu onorariul din `preturi/ro.yaml` pe card; tabelul „Onorarii orientative” (pe mobil, listă de perechi) și nota de sub el.
- **`/servicii/{slug}/`:** bandă de titlu pe gri (breadcrumbs, h1, lead), apoi conținutul Markdown și caseta „Pregătiți dosarul” (pe mobil imediat după lead, cu „Trimiteți actele pe email” din primul ecran; pe desktop în dreapta, `sticky` sub header). „Alte servicii”: 3 servicii vecine după `ordine`. JSON-LD `BreadcrumbList` și `Service`, cu `provider` → `{site}{bază}#birou`.
- **Serviciu nou:** un fișier nou în `src/content/servicii/ro/` (din CMS) primește automat pagină și card. Dacă îi lipsește onorariul din `preturi/ro.yaml` (sau invers), build-ul afișează `[servicii] ATENȚIE: …`.
- **„Trimiteți actele pe email”:** `mailto:` către `emailActe`, cu subiectul `subiectEmail` și un corp precompletat (CRLF, `encodeURIComponent`). Cât `emailActe` conține `«DE COMPLETAT`, butonul e vizibil, fără `href`, cu `aria-disabled`, iar adresa apare marcată.
- **Caseta `sticky`:** cu textele actuale caseta e mai înaltă decât conținutul, deci derulează normal; se lipește singură dacă textul serviciului devine mai lung decât ea.

## Note pentru etapele următoare

- **Sitemap (etapa 6):** opțiunea `i18n` din `@astrojs/sitemap` împerechează doar căi identice (`/` ↔ `/en/`). Pentru perechile cu slug diferit (`/servicii/` ↔ `/en/services/`) e nevoie de `serialize()` cu `routeMap`. Locul e marcat cu un TODO în `astro.config.mjs`.
- **hreflang:** paginile folosesc `ro` / `en` (CLAUDE.md §6), iar sitemap-ul `ro-RO` / `en-US` (promptul etapei 1). Ar fi bine să fie aceleași coduri; de unificat în etapa 6.
- `compressHTML: true` e setat explicit. Astro 7 folosește implicit `'jsx'`, care șterge spațiile dintre elementele inline.
