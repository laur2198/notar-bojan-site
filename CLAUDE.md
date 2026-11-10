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
- **Fonturi self-hosted** prin Fontsource (vezi §5): Geist (`@fontsource-variable/geist`) pentru text, butoane și h3–h4; Funnel Display (`@fontsource-variable/funnel-display`) pentru h1, h2, frazele mari și wordmark; Geist Mono (`@fontsource-variable/geist-mono`) pentru etichetele mono decorative. Doar subseturile latin + latin-ext, `font-display: swap`, preload doar pentru Geist latin. Verifică pentru orice font nou randarea corectă a diacriticelor românești cu virgulă: ș Ș ț Ț (U+0219, U+0218, U+021B, U+021A), nu cu sedilă (ş ţ), și ă â î. Un font fără ele nu se folosește.
- **GSAP + ScrollTrigger + SplitText** (`gsap`, din npm, niciodată din CDN), inițializate doar din `src/scripts/miscare.ts` (vezi §3.2). Fără Lenis și fără alt smooth scroll din JS.
- **Pages CMS** (`.pages.yml` în rădăcină) pentru editarea conținutului. Documentație: https://pagescms.org/llms-full.txt
- **Găzduire:** Cloudflare (static). Fără funcții server, fără bază de date.
- **Node:** versiunea LTS curentă. Package manager: npm.

## 3. Interdicții (nu se negociază)

1. **Fără resurse externe încărcate automat:** fără Google Fonts, CDN-uri, iframe Google Maps sau Google Calendar la încărcarea paginii, fără analytics, fără pixeli. Motiv: GDPR (clientul este operator de date) și performanță. Hărțile și programarea se deschid prin link sau, dacă se cere embed, prin „click pentru încărcare” (facade) cu text de informare.
2. **Mișcare.** Interzise: scroll hijacking, înlocuirea derulării native (Lenis sau alt smooth scroll din JS), fullpage scroll, carusele automate, preloader care blochează conținutul. Permise, doar prin `src/scripts/miscare.ts` și componentele documentate în §5: intro-ul cu semnătura (o dată pe sesiune, se sare cu orice clic/tastă/rotiță/atingere), dezvăluiri la scroll (`data-reveal`, `data-divider`), parallax decorativ (`data-parallax`, doar pe fotografii și forme, niciodată pe text), intrarea subsolului (`data-footer`: singura deplasare permisă pe text, doar cât subsolul intră în ecran; oprită, textul e fix), shutter-ul (`Shutter.astro`, decorativ), cursorul cu bulă (`Cursor.astro`, decorativ, doar cu mouse; cursorul nativ rămâne), tema navbar-ului după secțiune. Ancorele: `scroll-behavior: smooth` din CSS, doar fără mișcare redusă. La `prefers-reduced-motion: reduce` și fără JS: nicio animație, niciun intro, tot conținutul vizibil în starea finală. Starea inițială ascunsă se pune doar din JS, înainte de primul paint (`src/scripts/cap-pagina.js`, extern și sincron în `<head>`), cu plasă de siguranță dacă modulele nu pornesc. Textul împărțit rămâne accesibil (aria-label pe titluri, copie sr-only în rest). Tranzițiile de hover/focus: max. 200 ms, cu excepțiile din prototip: rularea literelor din `Buton.astro` (0.525 s), linia linkurilor `.sub` (0.735 s), culoarea navbar-ului la schimbarea temei (0.4 s); toate doar fără mișcare redusă (rularea și linia doar cu mouse).
3. **Fără calculator de onorarii** și fără cifre de onorarii inventate.
4. **Restricții deontologice ale profesiei notariale:** fără superlative („cel mai bun”, „cel mai rapid”), fără comparații cu alți notari, fără reduceri sau promoții, fără promisiuni de rezultat sau de termen garantat, fără mărturii scrise de noi. Recenziile afișate sunt exclusiv recenzii reale de pe Google, introduse de client.
5. **Nu inventa date ale biroului** (telefon, adresă, CIF, program, ani de experiență). Folosește marcajul `«DE COMPLETAT: ...»`.
6. **Nu modifica fișierele din `src/content/`** decât dacă promptul o cere explicit. Conținutul îl scrie omul, nu tu.

## 4. Accesibilitate (contractual – WCAG 2.1 AA)

- Text de bază **minim 18 px** (`--fs-base`: 18 → 24 px, fluid, în rem), `line-height` minim 1.6, lățime de rând max. ~70 caractere.
- Sub 16 px sunt permise doar: etichetele de sub iconițele din bara de jos (14 px, 600). Nicăieri altundeva.
- Contrast AA: minim 4.5:1 text normal, 3:1 text mare și elemente UI. Verifică fiecare combinație nouă de culori.
- Ținte de atingere minim **48×48 px**.
- `:focus-visible` clar pe toate elementele interactive (contur de 3 px, nu doar schimbare de culoare).
- Skip link „Sari la conținut”, landmark-uri (`header`, `nav`, `main`, `footer`), un singur `h1` pe pagină, ierarhie de titluri fără salturi.
- `lang="ro"` / `lang="en"` corect pe `<html>`; atribut `lang` pe linkul de schimbare a limbii.
- Telefonul (link `tel:`) și butonul „Programare” vizibile pe fiecare pagină: în header de la 768 px, într-o **bară fixă jos** pe mobil (< 768 px); telefonul și în header pe mobil.
- Formular/link-uri descriptive: fără „click aici”. Linkurile care deschid tab nou anunță asta (text vizual sau `sr-only`).
- Acordeoanele FAQ folosesc `<details>/<summary>` nativ.

## 5. Design

**Direcție:** monocromă, minimalistă, tipografie mare, după prototipul paginii Acasă aprobat de client (vezi „Referința” mai jos). Paleta monocromă de mai jos înlocuiește lemnul și bordo-ul din versiunea clasică (care rămâne pe `main`). Culorile nu se discută: alte culori nu se adaugă. Un singur accent permis în afara paletei: galbenul marcajului «DE COMPLETAT», doar în preview.

**Referința: prototipul.** `docs/design-v2/prototip-acasa.html` (HTML static, publicat pentru clientă) e SURSA valorilor, nu cod de copiat 1:1: culorile din `:root`, tipografia (textul de bază `clamp(18px, 1.25vw, 24px)`, mărimile titlurilor), granulația și metoda de desen a semnăturii. Prototipul încarcă GSAP, Lenis și fonturile din CDN-uri; în site rămân regulile din §3 (totul din npm sau self-hosted, fără Lenis, parallax doar decorativ). Fișierul stă în `docs/` și nu se publică (nu ajunge în `dist/`). Corecturi față de prototip, aprobate: `line-height` 1.6 (nu 1.5), focus 3 px (nu 2 px), mărimile în rem (nu px), wordmark-ul gigant doar prin CSS (nu JS), granulația statică (nu animată).

### Tokens (în `src/styles/tokens.css`)

```css
:root {
  /* Culori: paleta monocromă din prototip */
  --c-paper:      #FFFFFF;  /* fundal deschis (pagina, header) */
  --c-paper-2:    #F4F4F4;  /* fundal deschis alternant (secțiuni, footer) */
  --c-ink:        #0F0F0F;  /* text pe deschis (19.4:1 pe alb); fundalul secțiunilor închise; butonul primar */
  --c-ink-2:      #1A1A1A;  /* hover pe elementele ink */
  --c-muted:      #5C5C5C;  /* text secundar pe deschis (6.7:1 pe alb, 6.1:1 pe paper-2) */
  --c-muted-dark: #A3A3A3;  /* text secundar pe închis (7.9:1 pe ink) */
  --c-line:       #E3E3E3;  /* borduri, separatoare pe deschis (doar decorativ) */
  --c-line-dark:  #2C2C2C;  /* borduri, separatoare pe închis (doar decorativ) */
  --granulatie: url("data:image/svg+xml,…feTurbulence…");   /* zgomot negru, opacitate .06 */

  /* Tipografie */
  --font-sans:    'Geist Variable', system-ui, sans-serif;
  --font-display: 'Funnel Display Variable', 'Geist Variable', system-ui, sans-serif;
  --font-mono:    'Geist Mono Variable', ui-monospace, monospace;
  --fs-base: clamp(1.125rem, 1.25vw, 1.5rem);   /* 18 → 24 px */
  --fs-sm:   1rem;       /* 16 px – minim pentru text; excepții doar cele din §4 */
  --fs-xs:   0.875rem;   /* 14 px – doar etichetele barei de jos de pe mobil */
  --fs-lg:        calc(1.15 * var(--fs-base));                          /* faq__btn, nav__logo */
  --fs-h3:        var(--fs-lg);
  --fs-h2:        clamp(1.5rem, calc(2 * var(--fs-base)), 3rem);        /* slogan__text, cta__text */
  --fs-titlu:     clamp(1.75rem, calc(2.6 * var(--fs-base)), 4rem);     /* serv__titlu, pas__btn, faq__titlu */
  --fs-h1:        clamp(1.6rem, calc(2.35 * var(--fs-base)), 3.6rem);   /* hero__h1; sub 768 px: 1.6 × base */
  --fs-statement: clamp(1.75rem, calc(3.1 * var(--fs-base)), 4.6rem);   /* sticky-el */
  --lh-titlu-mare: 1.08; --lh-titlu: 1.02; --lh-h2: 1.12;
  --ls-titlu-mare: -0.035em; --ls-titlu: -0.04em; --ls-h2: -0.03em; --fw-titlu: 500;
  --ls-wordmark: -0.055em; --lh-wordmark: 0.82; --fw-wordmark: 600;
  --wordmark-k: 8.998;   /* lățimea textului wordmark-ului în em, măsurată (scripts/verifica-wordmark.mjs) */
  --ease-out: cubic-bezier(0.625, 0.05, 0, 1);

  /* Spațiere, raze, umbre: neschimbate (vezi tokens.css) */
}
```

Valorile exacte sunt în `src/styles/tokens.css`; contrastele (inclusiv cazul cel mai defavorabil cu granulația) și mărimile în px la 375/1280/1920 px se calculează la build în ghidul `/stil/`, care eșuează dacă o pereche pică AA. Verifică orice combinație nouă și ajustează valoarea, nu regula.

- **Tipografie:** textul de bază crește fluid de la 18 la 24 px (`--fs-base`, în rem; max ≤ 2.5 × min, ca zoom-ul să ajungă la 200%). Titlurile sunt multipli ai lui (scara de mai sus). h1 și h2 în Funnel Display 500, cu spațiere negativă; h3 și h4 în Geist 500/600. `line-height` minim 1.6 pentru text. Fără text justify. Fără majuscule integrale pe paragrafe.
- **Wordmark-ul gigant** (`WordmarkGigant.astro`): numele notarului pe un rând, Funnel Display 600, `-0.055em`, `line-height .82`, pe toată lățimea containerului, doar prin CSS (`100cqi / --wordmark-k`). Decorativ (`aria-hidden`). Abaterea față de lățimea containerului: max. 1% la 1280 și 1440 px, cu fontul încărcat (`node scripts/verifica-wordmark.mjs`). La schimbarea fontului sau a spațierii se remăsoară k.
- **Granulația:** zgomotul `feTurbulence` din prototip, opacitate .06, strat fix peste pagină (`body::after`), `pointer-events: none`. **Statică**: fără animație, la nicio setare (WCAG 2.2.2). Nu apare la tipărire și în `forced-colors`.
- **Semnătura** (`Semnatura.astro`, `src/assets/semnatura.svg`, licențe în `docs/licente.md`): o linie cu stroke, `currentColor`. Desenul: metoda din prototip (stroke-dashoffset, `pathLength="100"`, intervale proporționale cu lungimea, un singur progres pe tot gestul, `src/scripts/desen-semnatura.ts`). Starea din HTML e cea desenată; la `prefers-reduced-motion: reduce` și fără JS nu se animă.
- **Intro-ul** (`IntroSemnatura.astro`, `src/scripts/intro-semnatura.ts`, pornit de `src/scripts/cap-pagina.js` prin `<CapPagina />` în `<head>`): ecran complet `--c-ink`, semnătura în `--c-paper`, `min(78vw, 640px)`; desen 1.8 s, pauză 0.4 s, ecranul urcă (`translateY(-101%)`, 1 s, `cubic-bezier(0.85, 0, 0.15, 1)`); la jumătatea urcării se emite `intro-gata` pe `document` (fără intro, la încărcare). O dată pe sesiune; `aria-hidden` și `inert`; derularea e blocată cât e activ. Se montează în layout în V3.
- **Mișcarea la scroll** (`src/scripts/miscare.ts`): `[data-reveal]` (rânduri din mască, yPercent 110 → 0, 0.8 s, stagger 0.08, expo.out, la `top 80%`, o dată), `[data-divider]` (scaleX 0 → 1, 1.1 s, power2.inOut, la `top 90%`), `[data-parallax="N"]` (yPercent N → −N cât e vizibil). `[data-tema-sectiune="light|dark"]` + `[data-navbar]`: tema navbar-ului (`src/scripts/tema-navbar.ts`, fără GSAP).
- **Starea „Deschis / Închis”** se transmite prin text și formă (disc plin / cerc gol), în ink / muted. Culoarea nu poartă informația.
- **Butoanele** (`Buton.astro`, butonul cu text dublat din prototip): textul de bază (18–24 px), 500, înălțime min. max(48 px, 2.6em), rază 4 px, săgeata în dreapta (opțională). Variante: plin (ink pe deschis / paper pe închis; hover `--c-ink-hover` / `--c-paper-hover`) și contur (1 px în culoarea textului; hover `--c-paper-2` / `--c-ink-3`). Culorile vin din tema celui mai apropiat `[data-tema-sectiune]` / `.pe-inchis` / `[data-tema]` (variabilele `--buton-*` din global.css). Literele se împart la build; numele accesibil e textul întreg. Fără `href` e `<button>`. Clasele vechi `.btn` rămân doar în interiorul paginilor, până la V4.
- **Navbar-ul** (`Header.astro`): fix sus, fără umbră; culoarea textului din `data-tema`, pusă de `tema-navbar.ts` după secțiunea de sub el (tema de la încărcare o dă pagina: `temaNavbar` în BaseLayout). Desktop (≥ 74rem): **transparent** mereu, fără linie. Sub 74rem: transparent doar sus; derulat peste 8 px (`data-derulat`, din `tema-navbar.ts`, aplicat fără tranziție la încărcare), primește fundal plin în culoarea temei (`--c-paper` / `--c-ink`) și o linie de 1 px jos (`--c-line` / `--c-line-dark`), cu tranziția culorii (0.4 s; instant la mișcare redusă); la scroll 0 revine transparent; cu meniul compact deschis, fundalul îl dă panoul. Textul paginii nu trece niciodată vizibil pe sub navbar sub prag. Fără JS, fundal plin. Desktop de la 74rem (1184 px, prag măsurat): wordmark | Servicii · Programare · Întrebări · Contact (linia `.sub`, trasă permanent pe pagina curentă) | EN/RO · telefon · WhatsApp · Buton „Programare”. Sub prag: wordmark | telefon | (Programare de la 768 px) | „Meniu” (`<details>`, panou pe tot ecranul, ink, linkuri mari, contacte, limbă; Escape, focus ținut în panou, derulare blocată). Orice secțiune închisă își declară `data-tema-sectiune="dark"`; `<main>` și `<footer>` sunt `light`.
- **Subsolul** (`Footer.astro`): fundal `--c-paper`; Navigare | Contact | Adresă | Program, din `birou.yaml`; rândul legal (© an + denumirea oficială, confidențialitate, CIF din `birou.yaml`); linie și wordmark-ul gigant.
- **Fundaluri:** `--c-paper` pentru pagină și subsol, `--c-paper-2` pentru secțiunile alternante și banda de titlu, `--c-ink` pentru secțiunile închise (CTA final, hero fără fotografie, meniul compact). Pe închis, containerul primește `.pe-inchis` (focus `--c-paper`).
- **Linkuri:** în text, subliniate în `--c-ink`, iar la hover sublinierea se îngroașă; în navbar și subsol, linia `.sub` care se trage la hover.
- `mark.todo` rămâne galben pal (`#FFF1B8` cu text `--c-ink`), doar în preview.
- `theme-color` este `--c-ink`.
- Fotografii: un singur raport de aspect per secțiune, `object-fit: cover`, componenta `<Image>` din Astro (AVIF/WebP, `width`/`height` explicite). Până vin fotografiile reale, folosește blocuri placeholder cu fundal `--c-paper-2` și eticheta „Fotografie – de completat”. Fără fotografii stock.

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
