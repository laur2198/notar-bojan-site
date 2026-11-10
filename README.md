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
| `npm run verifica:en` | După build: caută text în română (diacritice) pe paginile din `dist/en/`, fără fragmentele `lang="ro"`, marcajele «DE COMPLETAT» și numele proprii |
| `npm run verifica:seo` | După build: auditul SEO al paginilor indexabile (title, description, h1, canonical, Open Graph, JSON-LD, robots, sitemap). Ține cont de `SITE_URL`, `BASE_PATH`, `SITE_MODE` |
| `npm run linkuri` | Verifică linkurile interne din `dist/` (pagini, resurse, ancore). Respectă `BASE_PATH`; `-- --ignora /en/` raportează fără să eșueze linkurile spre o zonă încă neconstruită |

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

## Lansare pe Cloudflare Pages

Producția se publică pe Cloudflare Pages, din același repository (`main`). Checklistul complet, în ordine, e în [`docs/lansare.md`](docs/lansare.md).

### Proiectul Pages

Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → repository-ul `notar-bojan-site`, branch-ul de producție `main`.

| Setare | Valoare |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build:prod` |
| Build output directory | `dist` |
| Root directory | (gol) |

**Variabile de mediu** (Settings → Variables and Secrets), pentru mediul **Production**:

| Variabilă | Valoare |
|---|---|
| `NODE_VERSION` | `22` (versiunea LTS cerută de `engines` din `package.json`) |
| `SITE_MODE` | `production` |
| `SITE_URL` | `https://<domeniu>` (domeniul final, fără `/` la sfârșit) |

**Fără `BASE_PATH`**: pe domeniul propriu site-ul stă la rădăcină. `BASE_PATH` e doar pentru preview-ul de pe GitHub Pages.

Pentru mediul **Preview** (deploy-urile din alte branch-uri), nu setați `SITE_MODE`: rămâne `preview`, cu `noindex`, `robots.txt` cu `Disallow: /` și etichetele „Text propus”. Build command pentru preview: `npm run build`.

`npm run build:prod` face trei pași și se oprește la primul eșec:

1. `verifica-continut`: niciun fișier cu `validat: false` sau cu «DE COMPLETAT» (lista fișierelor apare în log);
2. `astro build` în modul producție: fără `noindex`, fără etichete de draft, fără ghidul `/stil/`, `robots.txt` cu `Allow: /` și sitemap;
3. `verifica-seo`: canonical, Open Graph, un singur h1, JSON-LD-ul biroului complet și fără marcaje. Titlurile peste ~60 de caractere și descrierile peste ~155 apar ca avertismente (se scurtează în CMS).

### Ce face `public/_headers`

- `/_astro/*` (JS, CSS, fonturi, imagini procesate, toate cu hash în nume): `Cache-Control: public, max-age=31536000, immutable`. HTML-ul: `max-age=0, must-revalidate`, deci modificările din CMS apar imediat după deploy.
- Antete de securitate: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (fără cameră, microfon, geolocație), `X-Frame-Options: DENY`, HSTS.
- **Content-Security-Policy strict**: doar `'self'` pentru scripturi, stiluri, fonturi și imagini, fără nimic extern. De aceea build-ul nu pune CSS sau JS inline (`build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0` în `astro.config.mjs`), iar componentele nu folosesc atributul `style`. Dacă se activează vreodată `EmbedCuConsimtamant` (calendarul Google încorporat), CSP-ul trebuie să permită `frame-src https://calendar.google.com`.

### Domeniul

1. Pages → proiectul → **Custom domains** → **Set up a custom domain** → domeniul (ex. `notar-exemplu.ro`), apoi și `www.notar-exemplu.ro`.
2. Dacă DNS-ul domeniului e la Cloudflare, înregistrările se creează automat. Altfel, la registrar: `CNAME www → <proiect>.pages.dev`; pentru domeniul fără `www`, mutați DNS-ul la Cloudflare (CNAME pe apex nu e permis la majoritatea registrarilor).
3. Certificatul HTTPS se emite automat (câteva minute). SSL/TLS → **Always Use HTTPS**: activat.
4. `www` → domeniul principal: **Rules** → **Redirect Rules** (redirect 301), ca să existe o singură adresă. Adresa `*.pages.dev` rămâne accesibilă, dar canonical-ul fiecărei pagini indică `SITE_URL`.
5. Dacă domeniul diferă de cel din `SITE_URL`, actualizați variabila și refaceți deploy-ul (**Deployments** → **Retry deployment**).

### Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → **Add property** → **Domain** → `notar-exemplu.ro`.
2. Verificare prin DNS: Google dă o înregistrare `TXT` (`google-site-verification=…`); se adaugă în Cloudflare → DNS → **Add record** → Type `TXT`, Name `@`. Verificarea durează de la câteva minute la câteva ore.
3. **Sitemaps** → `https://notar-exemplu.ro/sitemap-index.xml` → **Submit**.
4. **URL Inspection** pe pagina principală → **Request indexing**. Tot de aici, **Test live URL** arată datele structurate găsite (`Notary`, `FAQPage`, `BreadcrumbList`); alternativ, [Rich Results Test](https://search.google.com/test/rich-results).

### Zilele libere din JSON-LD

JSON-LD-ul biroului include zilele libere din următoarele 12 luni **de la data build-ului**. Orice publicare din CMS reconstruiește site-ul; dacă site-ul nu se modifică un an întreg, refaceți deploy-ul manual (Deployments → Retry deployment) după actualizarea zilelor libere.

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

Trei fonturi variabile, self-hosted din Fontsource (CLAUDE.md §2, §5): **Geist** (text, butoane, h3–h4; preload pentru subsetul latin), **Funnel Display** (h1, h2, frazele mari, wordmark-ul gigant) și **Geist Mono** (etichete mono). `src/styles/fonturi.css` declară doar subseturile **latin** și **latin-ext**, axa `wght`, stil normal. ș, ț și ă sunt în latin-ext, deci o pagină în română le încarcă pe amândouă. Paleta e caldă (V3b): alb și gri cald (`--c-paper`, `--c-paper-2`, `--c-ink`, `--c-muted`), maro închis pentru brand (`--c-brand`, `--c-brand-900`, `--c-brand-300`) și roșu bordo doar ca accent mic (`--c-accent`), în `src/styles/tokens.css`, cu o granulație statică peste pagină; ghidul `/stil/` (doar în preview) arată tokenurile, contrastele, scara tipografică, granulația și semnătura. Prototipul de referință: `docs/design-v2/prototip-acasa.html` (nu se publică). Mișcarea (CLAUDE.md §3.2): intro-ul cu semnătura (`IntroSemnatura.astro`, pornit de `src/scripts/cap-pagina.js` prin `<CapPagina />` în `<head>`) și helperii `data-reveal`, `data-divider`, `data-parallax` din `src/scripts/miscare.ts` (GSAP din npm, derulare nativă, fără Lenis); totul oprit la mișcare redusă și fără JS. Teste e2e (Playwright preinstalat, nu e dependență): `npm run build`, `npm run preview`, apoi `npm run test:e2e`.

- **Fără italic.** Niciun text din `src/content/` nu conține italic (`*…*` sau `_…_`), deci fișierele italice nu se încarcă. Dacă apare italic, se adaugă în `fonturi.css` `inter-{latin,latin-ext}-wght-italic.woff2`.

## Carcasa și pagina Acasă (etapele 2–3, calibrate după referința aleasă de clientă)

- **Calibrare doar din `tokens.css`:** spațierile și razele din componente sunt `var(--space-*)`, `var(--section-y*)`, `var(--radius*)` sau expresii derivate din ele (`calc(var(--space-1) / 2)`). Valori scrise direct rămân doar minimele de accesibilitate (48 / 52 / 56 px) și câteva lățimi (ex. lista de întrebări, max. 61.25rem).
- **Header (navbar):** fix sus, fără umbră; transparent pe desktop; sub 1.184 px, după 8 px de derulare, fundal plin în culoarea temei și linie de 1 px jos (`data-derulat`), transparent la scroll 0; textul în tema secțiunii de sub el (`data-tema`, din `src/scripts/tema-navbar.ts`; la încărcare din `temaNavbar` în BaseLayout; fără JS, fundal plin). `--header-h` 80 px pe desktop, `--header-h-sm` 72 px sub prag; `<main>` începe sub el, iar Hero și BandaTitlu urcă sub el. **Desktop de la 1.184 px (74rem)**: wordmark-ul cu denumirea oficială pe două rânduri („Birou Individual Notarial” / „Bojan Elena Luminița”) | Servicii · Programare · Întrebări · Contact | EN/RO · telefon · WhatsApp · Buton „Programare”. Pragul e măsurat cu fonturile încărcate, la textul de bază de 18 px, pentru grila `1fr auto 1fr`: RO cere ~1.151 px, EN ~1.035 px (butonul folosește eticheta scurtă, „Programare” / „Book”, iar comutatorul arată doar cealaltă limbă, ca în prototip); peste 1.440 px totul crește proporțional cu textul. Sub prag: wordmark | telefon | Programare (de la 768 px) | „Meniu” – panou pe tot ecranul (ink), linkuri mari, contacte, limbă; `<details>` nativ, plus Escape, focus ținut în panou și derulare blocată.
- **Bara de jos** (< 768 px): albă, patru acțiuni cu iconiță și etichetă de 14 px, 600 (`--fs-xs`): Sunați, WhatsApp, Programare, Locație (Google Maps). Etichetele și rândul de 12 px din wordmark sunt singurele texte sub 16 px (CLAUDE.md §4).
- **Footer:** `--c-brand-900` (temă închisă, titluri și rândul legal în `--c-brand-300`), intră „de sub conținut” (interiorul yPercent -25 → 0 și un strat #120A05 0.35 → 0, cu scrub, doar cu mișcare permisă); Navigare | Contact | Adresă | Program, din `birou.yaml`; rândul legal (© an, denumirea oficială, confidențialitate, CIF); linie și wordmark-ul gigant (62%). Componente comune noi: `Buton.astro` (text dublat), `Cursor.astro` (bulă pe `data-cursor`), `Shutter.astro` (benzi la ieșirea secțiunii; din V3b doar demo pe `/stil/`).
- **Pagina Acasă (V3b, varianta luminoasă):** hero deschis (titlu, fotografia biroului, semnătură, wordmark de 62%) → trei fraze mari sticky (gri deschis) → serviciile evidențiate (rânduri cu fotografie și etichete) → cum lucrăm (pași + slogan) → întrebările evidențiate și încheierea (WhatsApp, Programare) → subsol (maro închis). Textele: `src/content/pagini/{ro,en}/acasa.yaml` (în CMS: Hero, Frazele mari, Servicii, Cum lucrăm, Întrebări, Încheiere); fotografia din hero se încarcă în pagina română (Prima secțiune → Fotografie) și apare și pe /en/; descrierea ei e obligatorie pe fiecare limbă; întrebările de pe Acasă se aleg cu „Evidențiată pe Acasă” în `faq/{ro,en}.yaml`, etichetele serviciilor cu „Etichete”. Programul, recenziile și „Despre” au paginile lor (programul și în subsol); componentele vechi ale paginii (banda de informații, recenziile) rămân în repo până la V5.
- **Date necompletate:** `linkTelefon()`, `linkEmail()`, `linkExtern()` nu generează `tel:`, `mailto:` sau linkuri externe din texte `«DE COMPLETAT`. În preview, butoanele rămân vizibile, cu `aria-disabled="true"` și fără `href`.
- **„Deschis acum”, programul de azi și zilele libere din următoarele 14 zile** se calculează în browser (fusul Europe/Bucharest). Fără JS nu apar; programul săptămânal complet e oricum în pagină.
- **Pe fundal închis** (`.pe-inchis`: hero, CTA), linkurile preiau culoarea textului, iar focusul devine `--c-paper`.

## Servicii (etapa 4)

- **`/servicii/`:** toate serviciile, în grila de pe Acasă (`GrilaServicii`), cu onorariul din `preturi/ro.yaml` pe card; tabelul „Onorarii orientative” (pe mobil, listă de perechi) și nota de sub el.
- **`/servicii/{slug}/`:** bandă de titlu pe gri (breadcrumbs, h1, lead), apoi conținutul Markdown și caseta „Pregătiți dosarul” (pe mobil imediat după lead, cu „Trimiteți actele pe email” din primul ecran; pe desktop în dreapta, `sticky` sub header). „Alte servicii”: 3 servicii vecine după `ordine`. JSON-LD `BreadcrumbList` și `Service`, cu `provider` → `{site}{bază}#birou`.
- **Serviciu nou:** un fișier nou în `src/content/servicii/ro/` (din CMS) primește automat pagină și card. Dacă îi lipsește onorariul din `preturi/ro.yaml` (sau invers), build-ul afișează `[servicii] ATENȚIE: …`.
- **„Trimiteți actele pe email”:** `mailto:` către `emailActe`, cu subiectul `subiectEmail` și un corp precompletat (CRLF, `encodeURIComponent`). Cât `emailActe` conține `«DE COMPLETAT`, butonul e vizibil, fără `href`, cu `aria-disabled`, iar adresa apare marcată.
- **Caseta `sticky`:** cu textele actuale caseta e mai înaltă decât conținutul, deci derulează normal; se lipește singură dacă textul serviciului devine mai lung decât ea.

## Pagini (etapa 5)

Toate paginile noi încep cu banda de titlu pe gri (`BandaTitlu`) și refolosesc componentele existente.

- **`/programare/`:** cardul alb cu „Alegeți data și ora” (link spre `programareUrl`, filă nouă, anunțată vizual și pentru cititoarele de ecran), alături telefonul, starea „Deschis acum” și programul săptămânal; dedesubt restul textului din `programare.md` (primul paragraf e deja lead-ul benzii și nu se repetă). Cât `programareUrl` conține `«DE COMPLETAT`, butonul e `aria-disabled`, fără `href`, iar adresa apare marcată. Fără iframe.
- **`EmbedCuConsimtamant.astro`** (nefolosit deocamdată): fațadă „click pentru încărcare” pentru calendarul Google, cu text de informare despre cookie-urile Google și linkul alternativ spre filă nouă. Iframe-ul se creează doar la click. Se folosește numai dacă clienta cere calendarul încorporat: `<EmbedCuConsimtamant locale="ro" src={birou.programareUrl} />`.
- **`/intrebari-frecvente/`:** toate întrebările (`ListaFaq`, `<details>` nativ) și JSON-LD `FAQPage`. Întrebările sau răspunsurile cu `«DE COMPLETAT` nu intră în JSON-LD (`faqPage()` din `src/lib/jsonld.ts`).
- **`/recenzii/`:** ratingul agregat (doar dacă e completat), toate recenziile din `recenzii.yaml`, de la cea mai nouă, text integral, și „Vedeți toate recenziile pe Google”. Cu lista goală: mesaj neutru și butonul. Fără JSON-LD `Review` (recenziile sunt de pe Google, nu proprii).
- **`/despre/`:** fotografia 4:5 (placeholder până vine cea reală) și textul, cu rând limitat.
- **`/contact/`:** cele trei blocuri ale benzii de informații (`BandaInfo varianta="contact"`: adresă, program, telefon și emailuri), textul din `contact.md` și o zonă de hartă statică (fără nimic de la Google) cu „Deschideți în Google Maps”. Fără formular, fără iframe. JSON-LD-ul biroului vine în etapa 8.
- **`/confidentialitate/`:** cuprins generat din titlurile h2 (ancore din id-urile Markdown), data actualizării în bandă, tipografie de document. Nota de lucru de la început (blockquote-ul „Text propus…”) apare doar în preview; în build-ul de producție `ContinutMarcat faraNotaDeLucru` îl scoate din HTML. În practică, înainte de producție clienta oricum șterge sau validează textul.
- **404:** mesaj în română și engleză, Acasă / Servicii / Contact și telefonul.
- **Marcaje în Markdown:** corpul Markdown randat trece prin `ContinutMarcat` (`marcheazaInHtml()` din `src/lib/marcaj.ts`), care pune `«DE COMPLETAT…»` în `<mark class="todo">`. Se aplică și paginilor de serviciu (până acum marcajele din corpul lor nu erau evidențiate).

## Versiunea în engleză (etapa 6)

Cinci pagini (CLAUDE.md §6): `/en/`, `/en/services/`, `/en/appointments/`, `/en/faq/`, `/en/contact/`.

- **Aceleași componente ca RO:** Acasă, Programare, Întrebări frecvente și Contact sunt câte o componentă comună (`PaginaAcasa`, `PaginaProgramare`, `PaginaFaq`, `PaginaContact`) cu prop-ul `locale`; fișierele din `src/pages/` și `src/pages/en/` doar o apelează. Conținutul vine din `src/content/*/en`.
- **`/en/`:** aceeași ordine de secțiuni ca `/`. Cardurile de servicii (din `servicii-en/servicii.yaml`) duc la `/en/services/#{slugRo}`. „About the office” afișează nota despre limbă și interpret într-o casetă de informare (`DespreNotar caseta`). Banda de informații are `id="program"` (ținta „Hours” din bara de jos).
- **`/en/services/`:** carduri cu `id={slugRo}`, fiecare cu un singur link real, „Details in Romanian” → `/servicii/{slugRo}/`, cu `hreflang="ro"` (fără `lang="ro"`: textul linkului e în engleză, WCAG 3.1.2). Secțiunea „Fees” cu textul `fees`; fără tabel de prețuri. Build-ul se oprește dacă un `slugRo` nu are pagină RO.
- **Zile libere:** câmpul opțional `motivEn` din `birou.yaml` (schema și CMS) apare pe paginile EN („Closed today – Christmas Day”). Fără el, motivul rămâne în română și e marcat `lang="ro"`. Datele folosesc `Intl` cu `en-GB`.
- **Linkuri spre pagini doar în română** (Despre, Confidențialitate, paginile de serviciu): textul o spune („(in Romanian)”) și linkul are `hreflang="ro"`.
- **hreflang și sitemap:** perechile vin dintr-un singur loc, `src/i18n/rute.ts` (`RUTE`, `routeMap`, `alternateLimbi`). Paginile au `ro` / `en` / `x-default` → RO; sitemap-ul primește aceleași alternate prin `serialize()` în `astro.config.mjs`, inclusiv pentru perechile cu slug diferit. Paginile fără pereche nu au alternate.
- **Comutatorul RO/EN:** duce la pereche sau, pe paginile fără pereche, la `/en/` (respectiv `/`).

## SEO (etapa 8)

- **JSON-LD-ul biroului** (`JsonLdBirou`, pe toate paginile, RO și EN): un singur nod `Notary`, `@id` `{site}{bază}#birou`, construit de `notaryBirou()` din `src/lib/jsonld.ts` (testat): nume, adresă, telefon, email, program (zilele cu același interval grupate, cele închise lipsesc), zilele libere din următoarele 12 luni, `geo` doar cu ambele coordonate, `sameAs` cu profilul Google, imaginea din hero dacă există, `knowsLanguage: ["ro"]`. Orice câmp gol sau cu «DE COMPLETAT» lipsește. Fără `aggregateRating` și `review` (CLAUDE.md §9).
- **Open Graph**: `og:image` pe toate paginile. Implicit `/og/ro.png` și `/og/en.png`, 1200×630, generate la build de `src/pages/og/[limba].png.ts` cu `sharp` (vine cu Astro) și fonturile Funnel Display și Geist (TTF statice) din `src/assets/og/` (vezi README-ul de acolo). Pe Acasă, fotografia din hero, decupată 1200×630, dacă a fost încărcată. Plus `twitter:card` `summary_large_image`.
- **Titluri**: `{titlu} | Birou Individual Notarial Bojan Elena Luminița` (și în EN: denumirea nu se traduce; `{denumire}` din i18n e înlocuit în BaseLayout cu valoarea din `birou.yaml`). Cu denumirea completă, titlurile paginilor interioare trec de 60 de caractere, deci Google le poate scurta la final. În CMS, titlul Acasă are maximum 60 de caractere, iar descrierile 155.
- **robots.txt** (`src/pages/robots.txt.ts`): în preview `Disallow: /`; în producție `Allow: /` și adresa sitemap-ului. **Sitemap**: doar paginile indexabile (fără `/stil/` și 404), cu alternatele RO/EN.
- **`/stil/`** se generează doar în preview.

## WhatsApp și limba recenziilor

- **Numărul:** `whatsapp` în `setari/birou.yaml` (WhatsApp Business al biroului, nu un număr personal), același format ca `telefon` (`+40` și 9 cifre). Linkul îl face `linkWhatsapp(birou, locale)` din `src/lib/contact.ts`: `https://wa.me/40…?text=…`, cu mesajul precompletat în limba paginii („Bună ziua, aș dori informații despre…” / „Hello, I would like information about…”), codificat cu `encodeURIComponent`. Cât e «DE COMPLETAT», butoanele rămân vizibile, cu `aria-disabled`, fără `href`.
- **Unde apare:** butonul pătrat din header pe desktop (între telefon și email, glif oficial monocrom în `--c-brand`, filă nouă anunțată în `aria-label`); bara de jos pe mobil (Sunați · WhatsApp · Programare · Locație; „Program” a ieșit din bară, programul e în subsol și pe /contact/); meniul compact, /contact/ și /programare/ (RO și EN) prin `ListaContacte`: telefon, WhatsApp, email, cu nota că actele se trimit pe email, nu pe WhatsApp.
- **Confidențialitate:** WhatsApp (Meta) trebuie adăugat de birou la „Cine mai are acces la date” în `pagini/ro/confidentialitate.md` (textul nu a fost modificat).
- **Limba recenziilor:** câmpul opțional `limba` din `recenzii.yaml` (`ro` implicit; `en`, `de`, `fr`, `hu`, `it`, `es`), select în CMS. Când diferă de limba paginii, `CardRecenzie` pune `lang` pe text și pe autor, iar `verifica:en` ignoră fragmentele marcate cu altă limbă decât engleza (test în `src/lib/verifica-engleza.test.ts`).

## Note pentru etapele următoare

- `compressHTML: true` e setat explicit. Astro 7 folosește implicit `'jsx'`, care șterge spațiile dintre elementele inline.
