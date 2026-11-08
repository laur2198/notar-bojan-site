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
- **Fonturi self-hosted** prin Fontsource (vezi §5 Tipografie): Geist (`@fontsource-variable/geist`) pentru text și titluri, Geist Mono (`@fontsource-variable/geist-mono`) pentru etichetele mono decorative, Funnel Display (`@fontsource-variable/funnel-display`) pentru wordmark (ales față de Geist 700: la dimensiuni mari are personalitate proprie și se distinge de textul de bază). Doar subseturile latin + latin-ext, `font-display: swap`, preload doar pentru fontul de text (latin). Verifică pentru orice font nou randarea corectă a diacriticelor românești cu virgulă: ș Ș ț Ț (U+0219, U+0218, U+021B, U+021A), nu cu sedilă (ş ţ), și ă â î. Un font fără ele nu se folosește.
- **Animații:** GSAP + ScrollTrigger, instalate prin npm (nu CDN), inițializate din `src/scripts/miscare.ts` (vezi §3.2).
- **Pages CMS** (`.pages.yml` în rădăcină) pentru editarea conținutului. Documentație: https://pagescms.org/llms-full.txt
- **Găzduire:** Cloudflare (static). Fără funcții server, fără bază de date.
- **Node:** versiunea LTS curentă. Package manager: npm.

## 3. Interdicții (nu se negociază)

1. **Fără resurse externe încărcate automat:** fără Google Fonts, CDN-uri, iframe Google Maps sau Google Calendar la încărcarea paginii, fără analytics, fără pixeli. Motiv: GDPR (clientul este operator de date) și performanță. Hărțile și programarea se deschid prin link sau, dacă se cere embed, prin „click pentru încărcare” (facade) cu text de informare.
2. **Mișcare.** Permise: dezvăluiri la scroll (opacitate, translate max. 24 px, culoare text), secțiuni sticky cu progres legat de scroll, intro-ul cu semnătura. Interzise: scroll hijacking, smooth scroll/Lenis, fullpage scroll, parallax pe fotografii, carusele automate, preloader care blochează conținutul. Orice animație: GSAP + ScrollTrigger, instalate prin npm (nu CDN). La `prefers-reduced-motion: reduce`, TOT conținutul apare direct în starea finală, fără mișcare. Conținutul e în HTML și lizibil fără JS. Tranzițiile de hover/focus sunt permise (max. 200 ms).
3. **Fără calculator de onorarii** și fără cifre de onorarii inventate.
4. **Restricții deontologice ale profesiei notariale:** fără superlative („cel mai bun”, „cel mai rapid”), fără comparații cu alți notari, fără reduceri sau promoții, fără promisiuni de rezultat sau de termen garantat, fără mărturii scrise de noi. Recenziile afișate sunt exclusiv recenzii reale de pe Google, introduse de client.
5. **Nu inventa date ale biroului** (telefon, adresă, CIF, program, ani de experiență). Folosește marcajul `«DE COMPLETAT: ...»`.
6. **Nu modifica fișierele din `src/content/`** decât dacă promptul o cere explicit. Conținutul îl scrie omul, nu tu.

## 4. Accesibilitate (contractual – WCAG 2.1 AA)

- Text de bază **18 px** (`1.125rem`), `line-height` minim 1.6, lățime de rând max. ~70 caractere.
- Sub 16 px sunt permise doar: etichetele de sub iconițele din bara de jos (14 px, 600), rândul de sus din wordmark-ul compact (12 px) și etichetele mono decorative (14 px: numerotarea 01–06, etichetele coloanelor din footer). Nicăieri altundeva.
- Contrast AA: minim 4.5:1 text normal, 3:1 text mare și elemente UI. Verifică fiecare combinație nouă de culori.
- Ținte de atingere minim **48×48 px**.
- `:focus-visible` clar pe toate elementele interactive (contur de 3 px, nu doar schimbare de culoare).
- Skip link „Sari la conținut”, landmark-uri (`header`, `nav`, `main`, `footer`), un singur `h1` pe pagină, ierarhie de titluri fără salturi.
- `lang="ro"` / `lang="en"` corect pe `<html>`; atribut `lang` pe linkul de schimbare a limbii.
- Telefonul (link `tel:`) și butonul „Programare” vizibile pe fiecare pagină: în header pe desktop, într-o **bară fixă jos** pe mobil (< 768 px).
- Formular/link-uri descriptive: fără „click aici”. Linkurile care deschid tab nou anunță asta (text vizual sau `sr-only`).
- Acordeoanele FAQ folosesc `<details>/<summary>` nativ.

## 5. Design

**Direcție:** minimalist, expresiv, premium. Alternanță fundal crem / fundal închis (wood-900). Tipografie mare, contrast puternic de mărime. Numele «bojan elena luminița» uriaș, cu minuscule, în hero și footer. Accent bordo foarte rar.

Pe `main` rămâne versiunea „clasică” a site-ului, ca șablon pentru alți notari; direcția de mai sus e a ramurii `redesign-premium`.

### Tokens (în `src/styles/tokens.css`)

```css
:root {
  /* Culori */
  --c-wood-900: #2A1A10;  /* titluri, fundalul hero-ului fără fotografie */
  --c-wood-800: #4A2E1E;  /* culoarea de brand: butoane primare, secțiunea CTA finală */
  --c-wood-600: #7A5236;  /* text secundar cald, iconițe (6.8:1 pe alb) */
  --c-wood-300: #C9AE94;  /* decorativ și focus pe fundal închis (5.9:1 pe wood-800) */
  --c-gray-900: #1F1E1D;  /* text principal (16.6:1 pe alb) */
  --c-gray-600: #5E5C59;  /* text secundar (6.7:1 pe alb, 6.1:1 pe gray-50) */
  --c-gray-200: #E2E1DF;  /* borduri, separatoare (doar decorativ) */
  --c-gray-50:  #F5F5F4;  /* fundal secțiuni alternante */
  --c-white:    #FFFFFF;  /* fundal pagină */
  --c-red-700:  #9B1C1C;  /* accent bordo: linii, numere de pași, iconițe, linkuri hover, „Închis” (8.2:1 pe alb, poate fi text) */
  --c-red-800:  #7A1414;  /* hover pe elementele roșii */
  --c-focus:    #4A2E1E;  /* contur focus pe fundal deschis, outline-offset 3px */
  --c-focus-on-dark: #C9AE94; /* contur focus pe wood-800/900 */
  --c-ok:       #2F6B3A;  /* „Deschis acum” */
  --c-closed:   #9B1C1C;  /* „Închis” */

  /* Redesign premium: crem + închis */
  --c-cream:    #F7EFE6;  /* fundalul paginii (în locul albului) */
  --c-cream-2:  #EFE4D8;  /* borduri și separatoare pe crem (doar decorativ) */
  --c-ink:      var(--c-wood-900); /* fundalul secțiunilor închise, textul principal pe crem */
  --c-ink-muted:   #706054; /* text secundar pe crem */
  --c-cream-muted: #A8968A; /* text „stins” pe închis */
  --granulatie: url("data:image/svg+xml,…feTurbulence…"); /* zgomot gri, opacitate 0.05 */

  /* Tipografie */
  --font-sans: 'Geist Variable', system-ui, sans-serif;          /* @fontsource-variable/geist */
  --font-mono: 'Geist Mono Variable', ui-monospace, monospace;    /* @fontsource-variable/geist-mono */
  --font-wordmark: 'Funnel Display Variable', 'Geist Variable', system-ui, sans-serif; /* @fontsource-variable/funnel-display */
  --fs-base: 1.125rem;   /* 18px */
  --fs-sm:   1rem;       /* 16px – minim pentru text; excepții doar cele din §4 */
  --fs-xs:   0.875rem;   /* 14px – doar etichetele barei de jos de pe mobil */
  --fs-lg:   1.25rem;
  --fs-h3:   clamp(1.25rem, 1.1rem + 0.4vw, 1.375rem);  /* max. 22px */
  --fs-h2:   clamp(1.5rem, 1.2rem + 0.9vw, 1.75rem);    /* max. 28px */
  --fs-h1:   clamp(2rem, 1.4rem + 1.8vw, 2.5rem);       /* max. 40px */

  /* Spațiere, raze, umbre */
  --space-1: .5rem; --space-2: 1rem; --space-3: 1.5rem; --space-4: 2rem;
  --space-5: 3rem;  --space-6: 4.5rem; --space-7: 6rem;
  --section-y:    clamp(4rem, 2rem + 6vw, 6rem);   /* padding sus/jos al secțiunilor (max. 96px) */
  --section-y-sm: clamp(3rem, 2rem + 3vw, 4rem);   /* banda de informații */
  --radius: 4px; --radius-lg: 10px; --radius-pill: 999px;
  --shadow: 0 4px 8px rgb(42 26 16 / .12);
  --container: 75rem;
  --gutter: 1.5rem;      /* padding lateral al containerului */
  --gutter-sm: 1rem;     /* sub 480px */
  --header-h: 72px;      /* header fix pe desktop */
  --header-h-sm: 64px;   /* header fix pe mobil */
  --measure: 68ch;
}
```

**Contrastul perechilor text/fundal (WCAG 2.1, calculat cu `src/lib/contrast.ts`).** Granulația (zgomot gri la opacitate 0.05) închide sau deschide local fundalul cu cel mult ~5%; coloana „cu granulație” e cazul cel mai defavorabil.

| Text | Fundal | Contrast | Cu granulație | Uz |
|---|---|---|---|---|
| `--c-ink` (#2A1A10) | `--c-cream` | 14.7:1 | ≥ 13:1 | text principal |
| `--c-ink-muted` (#706054) | `--c-cream` | 5.3:1 | ≥ 4.6:1 | text secundar, lead-uri |
| `--c-gray-600` (#5E5C59) | `--c-cream` | 5.9:1 | ≥ 5.1:1 | text secundar (componente vechi) |
| `--c-wood-800` (#4A2E1E) | `--c-cream` | 10.8:1 | ≥ 9.6:1 | butoane, linkuri |
| `--c-red-700` (#9B1C1C) | `--c-cream` | 7.2:1 | ≥ 6.4:1 | accent, „Închis” |
| `--c-ok` (#2F6B3A) | `--c-cream` | 5.6:1 | ≥ 5.0:1 | „Deschis acum” |
| `--c-cream` (#F7EFE6) | `--c-ink` | 14.7:1 | ≥ 12:1 | text pe secțiunile închise |
| `--c-cream-muted` (#A8968A) | `--c-ink` | 5.9:1 | ≥ 5.0:1 | text „stins” pe închis |
| `--c-wood-300` (#C9AE94) | `--c-ink` | 8.0:1 | ≥ 6.8:1 | decorativ, focus pe închis |
| alb / `--c-cream` | `--c-wood-800` | 12.4:1 / 10.8:1 | ≥ 9:1 | butonul primar, CTA |
| `--c-red-700` | `--c-ink` | 2.1:1 | – | **interzis ca text sau UI**; doar decorativ |

Valoarea propusă inițial pentru `--c-ink-muted`, #7A6A5E, trecea la limită pe crem simplu (4.55:1), dar cobora la ~4.1:1 pe pixelii cei mai închiși ai granulației; de aceea e închisă la #706054. `--c-cream-muted` #A8968A trece și cu granulație și rămâne.

Verifică la implementare contrastul real al perechilor folosite (ex. alb pe `--c-wood-800`, `--c-gray-600` pe `--c-gray-50`) și ajustează valoarea, nu regula, dacă una pică AA.

- **Tipografie:** Geist pentru text și titluri; Geist Mono doar pentru etichetele mono decorative; fontul wordmark-ului gigant e cel din tokenul `--font-wordmark`. Textul de bază rămâne 18 px. Scara (din tokeni, fără plafoanele vechi de 40/28/22 px) e în blocul de tokeni de mai sus: `--fs-lead`, `--fs-h3`, `--fs-h2`, `--fs-h1`, `--fs-statement` (frazele mari), `--fs-wordmark`, `--fs-mono`. Lead-urile de sub titluri în culoarea „muted” a fundalului.
- Fără text justify. Fără majuscule integrale pe paragrafe. Majusculele sunt permise DOAR la etichetele mono decorative (14 px) și la rândul de sus al wordmark-ului compact.
- **Wordmark:** linia de sus „Birou Individual Notarial” (exact în această ordine, e denumirea oficială), linia de jos „bojan elena luminița” (minuscule, ordinea exactă). Varianta „compact” (header: cele două linii, mici) și varianta „gigant” (doar „bojan elena luminița”, pe toată lățimea containerului, `aria-hidden`, pentru că numele apare ca text în altă parte; sub 768 px se poate rupe pe două rânduri, „bojan elena” / „luminița”, aliniat stânga, dacă pe un rând ar ieși sub 48 px). Numele de familie e „Bojan”. Denumirea legală completă, „Birou Individual Notarial Bojan Elena Luminița”, rămâne în footer, JSON-LD și confidențialitate.
- Roșul e doar accent: linii fine, numerele pașilor, iconițe, sublinierea/hover-ul linkurilor, starea „Închis”, max. 5–10% din suprafață. Nu pe butoane primare, nu ca fundal de secțiune, nu pe text lung.
- Butoanele: 16 px, 600, înălțime min. 48 px, padding 12×20. Butonul primar: fundal `--c-wood-800`, text alb. Butonul secundar: fundal `--c-gray-200`, text `--c-gray-900`, fără contur, hover un ton mai închis. Butonul inversat (pe secțiuni wood): fundal alb, text `--c-wood-800`.
- Fundaluri: alb pentru pagină și header (fix sus), `--c-gray-50` pentru secțiunile alternante și footer, `--c-wood-800` pentru secțiunea CTA finală, `--c-wood-900` sub fotografia din hero.
- Fără texturi sau imagini de lemn; „lemnul” e doar culoarea.
- `mark.todo` rămâne galben pal (`#FFF1B8` cu text `--c-gray-900`).
- `theme-color` devine `--c-wood-800`.
- Fotografii: un singur raport de aspect per secțiune, `object-fit: cover`, componenta `<Image>` din Astro (AVIF/WebP, `width`/`height` explicite). Până vin fotografiile reale, folosește blocuri placeholder cu fundal `--c-gray-50` și eticheta „Fotografie – de completat”. Fără fotografii stock.

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

**`setari/birou.yaml`:** `denumire`, `notar`, `adresa` (`strada`, `oras`, `judet`, `codPostal`), `telefon`, `telefonAfisat`, `email`, `emailActe`, `program` (listă `{ zi, deschidere, inchidere, inchis }` pentru luni–duminică, ore `HH:MM`), `zileLibere` (listă `{ data: YYYY-MM-DD, motiv }`), `googleMapsUrl`, `googleProfilUrl`, `rating` (număr sau gol), `numarRecenzii` (număr sau gol), `programareUrl` (link pagină de programări Google Calendar), `coordonate` (`lat`, `lng`, ambele `nullable`; JSON-LD include `geo` doar dacă sunt completate), `programConfirmare` și `zileLibereConfirmare` (string opționale, folosite doar ca marcaje `«DE COMPLETAT»` până la confirmarea biroului; nu se afișează pe site), `validat`.

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
- JSON-LD: un singur nod `Notary` (subtip `LegalService`/`LocalBusiness`), `@id` `{site}{bază}#birou`, pe toate paginile: adresă, telefon, email, program (`openingHoursSpecification`), zilele libere din următoarele 12 luni (`specialOpeningHoursSpecification`), `geo` doar cu coordonatele completate, `sameAs` cu profilul Google. Câmpurile goale sau cu «DE COMPLETAT» nu intră. **Fără `aggregateRating` și fără `review`**: Google nu afișează stele pentru recenziile marcate de o firmă pe propriul site, iar recenziile preluate de pe Google nu pot fi marcate ca proprii. Ratingul și recenziile apar doar vizual, cu link spre profilul Google. `FAQPage` pe paginile FAQ. `BreadcrumbList` pe paginile de serviciu.
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
