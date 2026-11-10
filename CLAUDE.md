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
2. **Mișcare.** Interzise: scroll hijacking, înlocuirea derulării native (Lenis sau alt smooth scroll din JS), fullpage scroll, carusele automate, preloader care blochează conținutul. Permise, doar prin `src/scripts/miscare.ts` și componentele documentate în §5: intro-ul cu semnătura (o dată pe sesiune, se sare cu orice clic/tastă/rotiță/atingere), dezvăluiri la scroll (`data-reveal`, `data-divider`), parallax decorativ (`data-parallax`, doar pe fotografii și forme, niciodată pe text), intrarea subsolului (`data-footer`: deplasare pe text doar cât subsolul intră în ecran; oprită, textul e fix), ieșirea hero-ului de pe Acasă (`data-parallax-iesire="40"`: blocul de jos cu rândul de sub titlu și wordmark-ul, doar cât hero-ul iese din ecran; cele două sunt singurele deplasări permise pe text; `data-parallax-iesire="8"` e și pe interiorul fotografiei din hero), intrarea hero-ului la `intro-gata` (cu fotografia descoperită de jos în sus, clip-path 1 s), frazele mari sticky (`data-fraze`, literele apar și dispar legate de derulare), sloganul care „se aprinde” (`data-aprinde`, culoarea `--c-slogan-stins` → `--c-ink`, nu opacitatea), grila de puncte cu lumina de lângă cursor (`puncte.ts`, decorativă, doar cu mouse), shutter-ul (`Shutter.astro`, decorativ; din V3b doar demo pe `/stil/`, nu pe Acasă), cursorul cu bulă (`Cursor.astro`, decorativ, doar cu mouse; cursorul nativ rămâne), tema navbar-ului după secțiune. Ancorele: `scroll-behavior: smooth` din CSS, doar fără mișcare redusă; o pagină deschisă cu `#ancoră` sare intro-ul, sare instant la secțiune (`html.ancora-initiala`) și e realiniată după fonturi și refresh-ul ScrollTrigger, dacă vizitatorul n-a derulat (teste în `scripts/e2e/ancore.test.mjs`). La `prefers-reduced-motion: reduce` și fără JS: nicio animație, niciun intro, tot conținutul vizibil în starea finală. Starea inițială ascunsă se pune doar din JS, înainte de primul paint (`src/scripts/cap-pagina.js`, extern și sincron în `<head>`), cu plasă de siguranță dacă modulele nu pornesc. Textul împărțit rămâne accesibil (aria-label pe titluri, copie sr-only în rest). Tranzițiile de hover/focus: max. 200 ms, cu excepțiile din prototip: rularea literelor din `Buton.astro` (0.525 s), linia linkurilor `.sub` (0.735 s), culoarea navbar-ului la schimbarea temei (0.4 s); toate doar fără mișcare redusă (rularea și linia doar cu mouse).
3. **Fără calculator de onorarii** și fără cifre de onorarii inventate.
4. **Restricții deontologice ale profesiei notariale:** fără superlative („cel mai bun”, „cel mai rapid”), fără comparații cu alți notari, fără reduceri sau promoții, fără promisiuni de rezultat sau de termen garantat, fără mărturii scrise de noi. Recenziile afișate sunt exclusiv recenzii reale de pe Google, introduse de client.
5. **Nu inventa date ale biroului** (telefon, adresă, CIF, program, ani de experiență). Folosește marcajul `«DE COMPLETAT: ...»`.
6. **Nu modifica fișierele din `src/content/`** decât dacă promptul o cere explicit. Conținutul îl scrie omul, nu tu.

## 4. Accesibilitate (contractual – WCAG 2.1 AA)

- Text de bază **minim 18 px** (`--fs-base`: 18 px fix, 19 px de la 1600 px, în rem; nu crește cu lățimea ecranului), `line-height` minim 1.6, lățime de rând max. ~70 caractere.
- Sub 16 px sunt permise doar: etichetele de sub iconițele din bara de jos (14 px, 600). Nicăieri altundeva.
- Contrast AA: minim 4.5:1 text normal, 3:1 text mare și elemente UI. Verifică fiecare combinație nouă de culori.
- Ținte de atingere minim **48×48 px**.
- `:focus-visible` clar pe toate elementele interactive (contur de 3 px, nu doar schimbare de culoare).
- Skip link „Sari la conținut”, landmark-uri (`header`, `nav`, `main`, `footer`), un singur `h1` pe pagină, ierarhie de titluri fără salturi.
- `lang="ro"` / `lang="en"` corect pe `<html>`; atribut `lang` pe linkul de schimbare a limbii.
- Telefonul (link `tel:`) și butonul „Programare” vizibile pe fiecare pagină: în header de la 768 px, într-o **bară fixă jos** pe mobil (< 768 px); telefonul și în header pe mobil.
- Formular/link-uri descriptive: fără „click aici”. Linkurile care deschid tab nou anunță asta (text vizual sau `sr-only`).
- Acordeoanele FAQ folosesc `<details>/<summary>` nativ (pe Acasă cu `name` comun: un singur răspuns deschis, fără JS).

## 5. Design

**Direcție (V3b, după feedbackul clientei: „prea întunecat, scrisul prea mare”):** luminoasă și caldă, minimalistă, tipografie măsurată. Paletă caldă alb/gri pentru suprafețe și text, **maro închis** pentru elementele de brand (butoane, semnătură, wordmark, subsol, focus, selecție), **roșu bordo doar ca accent punctual** (numerele și săgețile serviciilor, punctul pasului activ, iconița +/− din întrebări, linia `.sub` la hover pe deschis): niciodată suprafețe mari, butoane sau text de paragraf. Fără negru pe suprafețe mari: suprafețele închise sunt `--c-brand-900`. Alte culori nu se adaugă. Singurul accent în afara paletei: galbenul marcajului «DE COMPLETAT», doar în preview. Versiunea clasică rămâne pe `main`.

**Referința: prototipul.** `docs/design-v2/prototip-acasa.html` (HTML static, publicat pentru clientă) e SURSA valorilor de culoare (blocurile „Varianta luminoasă” și „Accente: maro închis + roșu”) și a valorilor wordmark-urilor (blocul „Denumirea oficială”, V3c), nu cod de copiat 1:1; layout-ul hero-ului (cu fotografia) vine din promptul V3b, nu din blocul „Fotografii” al prototipului. Prototipul are fotografiile provizorii incluse (base64), deci e autonom. Din prototip: culorile din `:root`, tipografia (textul de bază `clamp(18px, 1.25vw, 24px)`, mărimile titlurilor), granulația și metoda de desen a semnăturii. Prototipul încarcă GSAP, Lenis și fonturile din CDN-uri; în site rămân regulile din §3 (totul din npm sau self-hosted, fără Lenis, parallax doar decorativ). Fișierul stă în `docs/` și nu se publică (nu ajunge în `dist/`). Corecturi față de prototip, aprobate: `line-height` 1.6 (nu 1.5), focus 3 px (nu 2 px), mărimile în rem (nu px), wordmark-ul gigant doar prin CSS (nu JS), granulația statică (nu animată).

### Tokens (în `src/styles/tokens.css`)

```css
:root {
  /* Culori: paleta caldă (V3b) */
  --c-paper:      #FFFFFF;  /* fundal deschis (pagina, header, secțiuni) */
  --c-paper-2:    #F5F5F4;  /* fundal deschis alternant (frazele mari, întrebări, banda de titlu) */
  --c-ink:        #1F1E1D;  /* text pe deschis, cald (16.6:1 pe alb) */
  --c-ink-2:      #34322F;  /* hover pe elementele ink */
  --c-muted:      #5E5C59;  /* text secundar pe deschis (6.6:1 pe alb, 6.1:1 pe paper-2) */
  --c-line:       #E2E1DF;  /* borduri, separatoare pe deschis (doar decorativ) */
  --c-brand:      #4A2E1E;  /* maro închis: buton plin, buton contur, focus și selecție pe deschis, semnătura, cursorul (12.4:1 pe alb) */
  --c-brand-900:  #2A1A10;  /* hover pe brand; suprafețele închise (subsol, meniul compact, CTA final); wordmark-ul din hero */
  --c-brand-300:  #C9AE94;  /* text secundar pe brand-900 (7.9:1); cifrele mari decorative din „Cum lucrăm” */
  --c-brand-50:   #EFE7E0;  /* hover pe butonul contur și pe butonul alb de pe închis */
  --c-line-dark:  #4A3527;  /* separatoare pe brand-900 (doar decorativ) */
  --c-accent:     #9B1C1C;  /* roșu bordo, DOAR accente mici (8.1:1 pe alb) */
  --c-slogan-stins: #6B6B6B; /* sloganul înainte să „se aprindă” (5.3:1 pe alb) */
  --granulatie: url("data:image/svg+xml,…feTurbulence…");   /* zgomot negru, opacitate .06 */

  /* Tipografie */
  --font-sans:    'Geist Variable', system-ui, sans-serif;
  --font-display: 'Funnel Display Variable', 'Geist Variable', system-ui, sans-serif;
  --font-mono:    'Geist Mono Variable', ui-monospace, monospace;
  --fs-base: 1.125rem;   /* 18 px fix; 19 px (1.1875rem) de la 1600 px */
  --fs-sm:   1rem;       /* 16 px – minim pentru text; excepții doar cele din §4 */
  --fs-xs:   0.875rem;   /* 14 px – doar etichetele barei de jos de pe mobil */
  --fs-lg:        calc(1.15 * var(--fs-base));     /* întrebările, wordmark-ul din navbar */
  --fs-h3:        var(--fs-lg);
  --fs-h2:        clamp(1.35rem, 1.9vw, 1.9rem);   /* slogan, CTA, h2 pe paginile interioare */
  --fs-titlu:     clamp(1.5rem, 2.2vw, 2.25rem);   /* titlurile serviciilor, pașii, titlul întrebărilor */
  --fs-h1:        clamp(1.55rem, 2.6vw, 2.6rem);   /* h1 din hero (max. 24em lățime) */
  --fs-statement: clamp(1.5rem, 2.9vw, 2.9rem);    /* frazele mari */
  --lh-titlu-mare: 1.15; --lh-titlu: 1.1; --lh-h2: 1.15;
  --ls-titlu-mare: -0.025em; --ls-titlu: -0.025em; --ls-h2: -0.02em; --fw-titlu: 500;
  --ls-wordmark: -0.045em; --lh-wordmark: 0.82; --fw-wordmark: 600;
  --wordmark-k: 9.199;   /* lățimea textului wordmark-ului în em, măsurată (scripts/verifica-wordmark.mjs) */
  --ease-out: cubic-bezier(0.625, 0.05, 0, 1);

  /* Spațiere, raze, umbre: neschimbate (vezi tokens.css) */
}
```

Valorile exacte sunt în `src/styles/tokens.css`; contrastele tuturor perechilor folosite (inclusiv brand, brand-300 pe brand-900, accentul pe alb și pe paper-2, cazul cel mai defavorabil cu granulația) și mărimile în px la 375/1280/1920 px se calculează la build în ghidul `/stil/`, care eșuează dacă o pereche pică AA. Verifică orice combinație nouă și ajustează valoarea, nu regula.

- **Denumirea oficială** (cerință a clientei, V3c): biroul apare peste tot ca „Birou Individual Notarial Bojan Elena Luminița” (`birou.denumire`), niciodată doar numele persoanei sau o formă prescurtată („Notar Bojan”, „bojan elena luminița”), și netradusă în EN: navbar, wordmark-ul gigant, titluri (`{titlu} | {denumire}`, înlocuit în BaseLayout), descrieri, OG, JSON-LD, subsol, CMS. Numele persoanei (`birou.notar`) apare singur doar când textul vorbește despre notar ca persoană (ex. „Despre”). Pe două rânduri, împărțirea o face `imparteDenumirea()` (`src/lib/denumire.ts`): sus forma juridică, jos numele.
- **Tipografie:** textul de bază e fix, 18 px (19 px de la 1600 px), în rem. Titlurile cresc cu lățimea între plafoane în rem (scara de mai sus; max ≤ 2.5 × min, ca zoom-ul să ajungă la 200%); paginile interioare nu au titluri mai mari decât Acasă. h1 și h2 în Funnel Display 500, cu spațiere negativă; h3 și h4 în Geist 500/600. `line-height` minim 1.6 pentru text. Fără text justify. Fără majuscule integrale pe paragrafe.
- **Wordmark-ul gigant** (`WordmarkGigant.astro`): în hero și în subsol, deasupra lui rândul „Birou Individual Notarial” (Funnel Display 500, `clamp(1.1rem, 1.6vw, 1.6rem)`, culoarea blocului: brand-900 pe deschis, alb pe închis), iar blocul e `role="img"` cu `aria-label` = denumirea completă; în hero rândul apare odată cu wordmark-ul, după `intro-gata`. Numele notarului pe un rând, Funnel Display 600, `-0.045em`, `line-height .82`, pe toată lățimea cutiei lui, doar prin CSS (`100cqi / --wordmark-k`); în hero și în subsol (`latime="62"`) cutia e 62% din container de la 768 px, pe mobil toată lățimea. În hero `--c-brand-900`, în subsol alb. Decorativ (`aria-hidden`). Abaterea față de lățimea cutiei: max. 1% la 1280 și 1440 px, cu fontul încărcat, pe `/stil/` și pe Acasă (`node scripts/verifica-wordmark.mjs`). La schimbarea fontului sau a spațierii se remăsoară k.
- **Granulația:** zgomotul `feTurbulence` din prototip, opacitate .06, strat fix peste pagină (`body::after`), `pointer-events: none`. **Statică**: fără animație, la nicio setare (WCAG 2.2.2). Nu apare la tipărire și în `forced-colors`.
- **Semnătura** „Notar 🤝 Bojan” (`Semnatura.astro`, `src/assets/semnatura.svg` pus de birou: nu se regenerează și nu i se modifică geometria; licențe în `docs/licente.md`): literele (Imperial Script, contururi) și mâinile (Vecteezy 79569313, contururi) sunt forme umplute cu `currentColor`, descoperite de trei măști (`#m-notar`, `#m-maini`, `#m-bojan`) ale căror path-uri `.rev` (`data-word`, `data-len`, `pathLength="100"`) se desenează. SVG inline (`?raw`), id-urile măștilor cu sufix per instanță (intro + hero), `aria-hidden` (numele biroului rămâne în h1). Culoarea din prop-ul `ton`: `--c-brand` pe deschis (hero, intro), alb pe închis. Desenul (`src/lib/semnatura.ts`, `src/scripts/desen-semnatura.ts`, fără librărie): un progres P 0 → 1, `cubic-bezier(0.77, 0, 0.175, 1)`, 3.5 s în hero, 1.8 s la intro, pornit de IntersectionObserver; fiecare `.rev` are intervalul [a, b] proporțional cu `data-len`, în ordinea notar → maini → bojan; dashoffset = 100 · (1 − clamp((P − a)/(b − a))) (101 cât nu a început, ca să nu rămână punctul capătului rotunjit). Sub 640 px: doar mâinile (viewBox decupat pe ele, animate), fără litere. Starea din HTML e cea desenată (dashoffset 0); la `prefers-reduced-motion: reduce` și fără JS nu se animă. Mâinile: licența Vecteezy Pro Standard, fără atribuire pe site.
- **Intro-ul** (`IntroSemnatura.astro`, `src/scripts/intro-semnatura.ts`, pornit de `src/scripts/cap-pagina.js` prin `<CapPagina />` în `<head>`): ecran complet `--c-paper`, semnătura în `--c-brand`, `min(78vw, 640px)`; desen 1.8 s, pauză 0.4 s, ecranul urcă (`translateY(-101%)`, 1 s, `cubic-bezier(0.85, 0, 0.15, 1)`); la jumătatea urcării se emite `intro-gata` pe `document` (fără intro, la încărcare). O dată pe sesiune, pe orice pagină de intrare (montat în `BaseLayout`; `intro="manual"` pe `/stil/`); nu rulează la intrarea cu `#ancoră`; `aria-hidden` și `inert`; derularea e blocată cât e activ.
- **Mișcarea la scroll** (`src/scripts/miscare.ts`): `[data-reveal]` (rânduri din mască, yPercent 110 → 0, 0.8 s, stagger 0.08, expo.out, la `top 80%`, o dată), `[data-divider]` (scaleX 0 → 1, 1.1 s, power2.inOut, la `top 90%`), `[data-parallax="N"]` (yPercent N → −N cât e vizibil). `[data-tema-sectiune="light|dark"]` + `[data-navbar]`: tema navbar-ului (`src/scripts/tema-navbar.ts`, fără GSAP).
- **Starea „Deschis / Închis”** se transmite prin text și formă (disc plin / cerc gol), în ink / muted. Culoarea nu poartă informația.
- **Butoanele** (`Buton.astro`, butonul cu text dublat din prototip): textul de bază (18–24 px), 500, înălțime min. max(48 px, 2.6em), rază 4 px, săgeata în dreapta (opțională). Variante: plin (pe deschis fundal `--c-brand`, text alb, hover `--c-brand-900`; pe închis fundal alb, text `--c-brand-900`, hover `--c-brand-50`) și contur (1 px în culoarea textului: `--c-brand` pe deschis, hover `--c-brand-50`; alb pe închis, hover `--c-brand`). Culorile vin din tema celui mai apropiat `[data-tema-sectiune]` / `.pe-inchis` / `[data-tema]` (variabilele `--buton-*` din global.css). Literele se împart la build; numele accesibil e textul întreg. Fără `href` e `<button>`. Clasele vechi `.btn` rămân doar în interiorul paginilor, până la V4.
- **Navbar-ul** (`Header.astro`): fix sus, fără umbră; culoarea textului din `data-tema`, pusă de `tema-navbar.ts` după secțiunea de sub el (tema de la încărcare o dă pagina: `temaNavbar` în BaseLayout). Desktop (≥ 74rem): **transparent** mereu, fără linie. Sub 74rem: transparent doar sus; derulat peste 8 px (`data-derulat`, din `tema-navbar.ts`, aplicat fără tranziție la încărcare), primește fundal plin în culoarea temei (`--c-paper` / `--c-brand-900`) și o linie de 1 px jos (`--c-line` / `--c-line-dark`), cu tranziția culorii (0.4 s; instant la mișcare redusă); la scroll 0 revine transparent; cu meniul compact deschis, fundalul îl dă panoul. Textul paginii nu trece niciodată vizibil pe sub navbar sub prag. Fără JS, fundal plin. Wordmark-ul (`Wordmark.astro`): denumirea pe două rânduri, sus „Birou Individual Notarial” (Geist 500, 0.78em, min. 16 px, opacitate .8), jos „Bojan Elena Luminița” (Funnel Display 600); numele accesibil al linkului e denumirea completă. Pe mobil (< 30rem) „Meniu” își păstrează cuvântul, fără iconiță, ca denumirea să încapă: fiecare rând pe o singură linie de la ~360 px, sub 358 px rândul de sus se poate rupe, sub 336 px ambele rânduri au 16 px (verificat 320–1920 px, RO și EN). Desktop de la 74rem (1184 px, prag măsurat): wordmark | Servicii · Programare · Întrebări · Contact (linia `.sub`, trasă permanent pe pagina curentă) | EN/RO · telefon · WhatsApp · Buton „Programare”. Sub prag: wordmark | telefon | (Programare de la 768 px) | „Meniu” (`<details>`, panou pe tot ecranul, `--c-brand-900`, linkuri mari, contacte, limbă; Escape, focus ținut în panou, derulare blocată). Iconița WhatsApp e `--c-brand` pe tema deschisă. Orice secțiune închisă își declară `data-tema-sectiune="dark"`; `<main>` e `light`, `<footer>` e `dark`.
- **Pagina Acasă** (`PaginaAcasa.astro`, secțiunile în `src/components/acasa/`, textele din `pagini/{limba}/acasa.yaml`), toată luminoasă (V3b): hero deschis pe tot ecranul (pete radiale calde **statice**; de la 992 px pe 2 coloane: stânga h1 = titlu + subtitlu în muted, max. ~50%, și sub el semnătura `min(24vw, 21rem)`, aliniată stânga; dreapta fotografia biroului `hero.imagine`, 4:5, colțuri 0.25em, înălțimea limitată ca wordmark-ul să fie vizibil complet la 1280×720 și 1440×900; sub 992 px: h1 → fotografia 4:3 → semnătura; jos, pe toată lățimea: `hero.linie` + adresa, linia, wordmark-ul 62%; fără butoane. Fotografia: `<Picture>` AVIF/WebP, srcset, `fetchpriority="high"`, fără lazy (e LCP); aceeași pe /en/, cu `hero.imagineAlt` obligatoriu pe fiecare limbă; până la fotografia reală, placeholder cald #EDE6E0 → #D9CFC6 cu „Fotografie birou – urmează”) → frazele mari (`--c-paper-2`, `light`, exact 3 în CMS, ~300vh sticky, grila de puncte maro rgba(74,46,30, .14 → .9 lângă cursor); fără JS și la mișcare redusă, una sub alta) → servicii (`--c-paper`; evidențiate, în ordinea din CMS; rânduri cu fotografie, număr mono și săgeată în `--c-accent`, titlu cu link al cărui `::after` acoperă rândul, rezumat, `etichete`; bula „Vezi serviciul”) → cum lucrăm (`--c-paper`; pași-butoane cu `aria-expanded`, inactivi la opacitate .6, punctul pasului activ în `--c-accent`, imaginea pasului activ cu cifra mare `--c-brand-300`; acordeon doar sub `html.miscare`; sloganul) → întrebări (`--c-paper-2`; cele cu `evidentiat`, max. `faq.numarAfisat`; iconița +/− în `--c-accent`; `cta`: WhatsApp contur + Programare plin) → subsol. Fără shutter.
- **Subsolul** (`Footer.astro`): fundal `--c-brand-900`, temă `dark` (`.pe-inchis`); titlurile coloanelor și rândul legal în `--c-brand-300`, linkurile albe; Navigare | Contact | Adresă | Program, din `birou.yaml`; rândul legal (© an + denumirea oficială, confidențialitate, CIF din `birou.yaml`); linie bej și wordmark-ul gigant alb, 62%. Intră de sub conținut cu un strat #120A05, opacitate 0.35 → 0.
- **Fundaluri:** `--c-paper` pentru pagină, `--c-paper-2` pentru secțiunile alternante și banda de titlu, `--c-brand-900` pentru suprafețele închise (subsolul, meniul compact, CTA-ul final și hero-ul fără fotografie de pe paginile interioare). Pe închis, containerul primește `.pe-inchis` (focus `--c-paper`). Focusul pe deschis e `--c-brand`; `::selection` fundal `--c-brand`, text alb.
- **Linkuri:** în text, subliniate în `--c-ink`, iar la hover sublinierea se îngroașă; în navbar și subsol, linia `.sub` care se trage la hover (pe deschis în `--c-accent`, pe închis în culoarea textului; pagina curentă: linia permanentă în culoarea textului).
- `mark.todo` rămâne galben pal (`#FFF1B8` cu text `--c-ink`), doar în preview.
- `theme-color` este `--c-brand-900`. Imaginea OG implicită: fundal `--c-brand-900`, textul alb și bej, fără negru.
- Fotografii: un singur raport de aspect per secțiune, `object-fit: cover`, componenta `<Image>` din Astro (AVIF/WebP, `width`/`height` explicite). Până vin fotografiile reale, folosește blocuri placeholder cu fundal `--c-paper-2` și eticheta „Fotografie – de completat”. Fără fotografii stock pe site-ul public. **Excepție, doar în preview:** fotografiile provizorii din `src/assets/fotografii-provizorii/` (Unsplash, surse în `docs/licente.md`), legate în CMS cu `fotoProvizorie: true` și texte alternative marcate «DE VALIDAT»; în preview poartă eticheta vizibilă „Fotografie provizorie” (`FotoProvizorie.astro`), iar `scripts/verifica-continut.mjs` oprește build-ul de producție cât timp există vreo `fotoProvizorie: true` sau vreun «DE VALIDAT». Se înlocuiesc cu fotografii reale ale biroului.

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

**`servicii/ro/*.md` (frontmatter):** `titlu`, `slug`, `ordine` (număr), `evidentiat` (boolean, apare pe Acasă), `rezumat` (max. 160 caractere, folosit și ca meta description), `pentruCine`, `durata` (text, ex. „aprox. 1 oră”), `onorariu` (text), `acteNecesare` (listă de string-uri), `subiectEmail`, `validat`; opțional `etichete`, `imagine`, `imagineAlt`, `fotoProvizorie`. Corpul Markdown are secțiunile `## Ce este`, `## Cum decurge`, `## Bine de știut`.

**`recenzii/recenzii.yaml`:** listă `{ autor, data: YYYY-MM-DD, nota: 1–5, text, sursa: 'Google' }`. Lista poate fi goală. Când e goală, secțiunea Recenzii afișează doar linkul „Vedeți recenziile pe Google” și ratingul, dacă există. **Nu genera niciodată recenzii, nici ca placeholder.**

### Moduri de build: preview vs. producție

- Variabila de mediu `SITE_MODE` = `preview` (implicit) sau `production`.
- În **preview**, conținutul cu `validat: false`, `«DE COMPLETAT`, `«DE VALIDAT` sau o fotografie provizorie apare cu eticheta vizibilă „Text propus – în curs de validare” (componentă `DraftBadge`), iar marcajele `«DE COMPLETAT: …»` se evidențiază cu fundal galben pal. `«DE VALIDAT: …»` marchează texte propuse de noi (ex. textele alternative ale fotografiilor provizorii), de aprobat de birou; din atributele `alt` marcajele se scot (`textAlt`).
- În **producție**, scriptul `scripts/verifica-continut.mjs` rulează înainte de build și **eșuează** (exit 1) dacă găsește `validat: false`, `«DE COMPLETAT`, `«DE VALIDAT` sau `fotoProvizorie: true` în `src/content/`, listând fișierele.
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
