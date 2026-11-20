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
2. **Mișcare.** Interzise: scroll hijacking, înlocuirea derulării native (Lenis sau alt smooth scroll din JS), fullpage scroll, carusele automate, preloader care blochează conținutul. Permise, doar prin `src/scripts/miscare.ts` și componentele documentate în §5: dezvăluiri la scroll (`data-reveal`, `data-divider`), parallax decorativ (`data-parallax`, doar pe fotografii și forme, niciodată pe text), intrarea subsolului (`data-footer`: deplasare pe text doar cât subsolul intră în ecran; oprită, textul e fix), ieșirea hero-ului de pe Acasă (`data-parallax-iesire="40"`: blocul de jos cu rândul de sub titlu și wordmark-ul, doar cât hero-ul iese din ecran; cele două sunt singurele deplasări permise pe text; `data-parallax-iesire="8"` e și pe interiorul fotografiei din hero), intrarea hero-ului la încărcare (cu fotografia descoperită de jos în sus, clip-path 1 s, și liniile trase), frazele mari sticky (`data-fraze`, pe rosu-900: literele apar în `--c-slogan-stins-inchis` și se aprind în alb, legat de derulare; opacitatea doar 0 sau 1), sloganul care „se aprinde” (`data-aprinde`, culoarea `--c-slogan-stins` → `--c-ink`, nu opacitatea), fundalul viu (`data-fundal-viu`, `FundalViu.astro`: petele se mișcă doar cu derularea, scrub, și pe hero după cursor, gsap.quickTo, max. 30 px; nimic nu continuă după ce vizitatorul se oprește), grila de puncte cu lumina de lângă cursor (`puncte.ts`, decorativă, doar cu mouse), shutter-ul (`Shutter.astro`, decorativ; din V3b doar demo pe `/stil/`, nu pe Acasă), cursorul cu bulă (`Cursor.astro`, decorativ, doar cu mouse; cursorul nativ rămâne), tema navbar-ului după secțiune. Ancorele: `scroll-behavior: smooth` din CSS, doar fără mișcare redusă; o pagină deschisă cu `#ancoră` sare instant la secțiune (`html.ancora-initiala`) și e realiniată după fonturi și refresh-ul ScrollTrigger, dacă vizitatorul n-a derulat (teste în `scripts/e2e/ancore.test.mjs`). La `prefers-reduced-motion: reduce` și fără JS: nicio animație, tot conținutul vizibil în starea finală, petele statice. Starea inițială ascunsă se pune doar din JS, înainte de primul paint (`src/scripts/cap-pagina.js`, extern și sincron în `<head>`), cu plasă de siguranță dacă modulele nu pornesc. Textul împărțit rămâne accesibil (aria-label pe titluri, copie sr-only în rest). Tranzițiile de hover/focus: max. 200 ms, cu excepțiile din prototip: rularea literelor din `Buton.astro` (0.525 s), linia linkurilor `.sub` (0.735 s), culoarea navbar-ului la schimbarea temei (0.4 s); toate doar fără mișcare redusă (rularea și linia doar cu mouse).
3. **Fără calculator de onorarii** și fără cifre de onorarii, nici reale, nici inventate (vezi punctul 4).
4. **Restricții deontologice ale profesiei notariale:** fără superlative („cel mai bun”, „cel mai rapid”), fără comparații cu alți notari, fără reduceri sau promoții, fără promisiuni de rezultat sau de termen garantat, fără mărturii scrise de noi. Recenziile afișate sunt exclusiv recenzii reale de pe Google, introduse de client. **Fără onorarii, tarife, sume, tabele de prețuri sau calculatoare pe site (Codul deontologic, art. 15 alin. 3 lit. f și art. 17 alin. 2). Se trimite doar la Ordinul MJ 177/C/2024.** Trimiterea o fac `servicii.intro` (lead-ul de pe `/servicii/`, nota de pe `/en/services/`) și `dosar.onorariuNorme` (caseta „Pregătiți dosarul”), din i18n; câmpul `onorariu` al serviciilor rămâne text general, fără cifre.
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

**Direcție (V3d, după feedbackul clientei: „roșul să fie o culoare vizibilă, site-ul mai colorat, fără semnătură”; maro-ul îmbătrânea site-ul):** luminoasă și colorată, minimalistă, tipografie măsurată. Alb și alb cald pentru suprafețe, ink pentru text, **roșu (`--c-rosu`) ca culoare de acțiune vizibilă** (butonul plin, cifrele, liniile, iconițele, focusul), **roșu închis (`--c-rosu-900`) ca singura suprafață închisă**, plus fundalul viu (pete difuze roșu / piersică / auriu) pe secțiunile deschise. **Maro nu mai apare nicăieri în interfață**, doar în fotografii. Fără negru pe suprafețe mari. Alte culori nu se adaugă. Singurul accent în afara paletei: galbenul marcajului «DE COMPLETAT», doar în preview. Versiunea clasică rămâne pe `main`.

**Regulile roșului:**
- Roșul NU se folosește pentru paragrafe și NU stă pe alt roșu ca text sau element de interfață (`--c-rosu` pe `--c-rosu-900`: 1.6:1, pică). Excepție decorativă: linia de 3 px de pe marginea de sus a subsolului.
- Butoane: plin = `--c-rosu` + text alb (hover `--c-rosu-hover`); contur = bordură și text `--c-ink`, hover `--c-rosu-50` cu text `--c-ink`; pe închis: plin alb cu text `--c-rosu-900` (hover `--c-rosu-50`), contur alb (hover `--c-rosu-hover`).
- Wordmark-ul, rândul „Birou Individual Notarial” și navbar-ul pe deschis: `--c-ink`.
- `theme-color` și imaginea OG: fundal `--c-rosu-900`, alb + `--c-rosu-300` pentru text și linie.
- Starea „Deschis / Închis” rămâne doar în ink / muted (pe închis alb / rosu-300) + formă, niciodată în roșu.
- Secțiunile deschise alternează `--c-paper` / `--c-paper-2`; suprafețe închise (`--c-rosu-900`) sunt doar: subsolul, meniul compact, frazele mari, CTA-ul final de pe Acasă și hero-ul fără fotografie al paginilor interioare.

**Referința: prototipul.** `docs/design-v2/prototip-acasa.html` (HTML static, publicat pentru clientă) a fost sursa valorilor de culoare până la V3b (din V3d culorile vin din tokenurile de mai jos) și rămâne sursa valorilor wordmark-urilor (blocul „Denumirea oficială”, V3c), nu cod de copiat 1:1; layout-ul hero-ului (cu fotografia) vine din promptul V3b, nu din blocul „Fotografii” al prototipului. Prototipul are fotografiile provizorii incluse (base64), deci e autonom. Din prototip: tipografia (textul de bază `clamp(18px, 1.25vw, 24px)`, mărimile titlurilor) și granulația. Prototipul încarcă GSAP, Lenis și fonturile din CDN-uri; în site rămân regulile din §3 (totul din npm sau self-hosted, fără Lenis, parallax doar decorativ). Fișierul stă în `docs/` și nu se publică (nu ajunge în `dist/`). Corecturi față de prototip, aprobate: `line-height` 1.6 (nu 1.5), focus 3 px (nu 2 px), mărimile în rem (nu px), wordmark-ul gigant doar prin CSS (nu JS), granulația statică (nu animată).

### Tokens (în `src/styles/tokens.css`)

```css
:root {
  /* Culori: paleta V3d (contrastele fără granulație; cazul cu granulație e în tokens.test.ts și /stil/) */
  --c-paper:       #FFFFFF;  /* fundal deschis (pagina, header, secțiuni) */
  --c-paper-2:     #FBF8F6;  /* alb cald, secțiunile alternante (ink 15.7:1, muted 6.3:1, roșu 6.2:1) */
  --c-ink:         #1F1E1D;  /* text pe deschis, wordmark, navbar, butonul contur (16.6:1 pe alb) */
  --c-ink-2:       #34322F;  /* hover pe elementele ink */
  --c-muted:       #5E5C59;  /* text secundar pe deschis (6.7:1 pe alb, 6.3:1 pe paper-2) */
  --c-line:        #E2E1DF;  /* borduri, separatoare pe deschis (doar decorativ) */
  --c-rosu:        #B42318;  /* culoarea de acțiune: butonul plin (alb pe el 6.6:1), cifrele, liniile, iconițele, .sub la hover, focusul pe deschis (6.6:1 pe alb) */
  --c-rosu-hover:  #8F1D14;  /* hover pe butonul plin (alb 8.9:1) */
  --c-rosu-50:     #FBEDEA;  /* hover pe butonul contur, fundaluri mici (roșu 5.8:1, ink 14.6:1) */
  --c-rosu-900:    #7A1414;  /* SINGURA suprafață închisă (alb 10.8:1) */
  --c-rosu-300:    #E8C9C4;  /* text secundar pe rosu-900 (7.0:1) */
  --c-linie-inchis: #9A2A22; /* borduri pe rosu-900 (doar decorativ) */
  --c-slogan-stins: #62605D; /* sloganul înainte să „se aprindă” (6.3:1 pe alb, ≥ 4.5:1 peste fundalul viu discret) */
  --c-slogan-stins-inchis: #DEA7A0; /* frazele mari înainte să „se aprindă”, pe rosu-900 (5.2:1) */
  --viu-culoare-rosu: #B42318; --viu-culoare-piersica: #F2A38F; --viu-culoare-auriu: #E9B872;
  --viu-puternic-rosu: 0.1;  --viu-puternic-piersica: 0.26; --viu-puternic-auriu: 0.32;  /* hero, capul paginilor */
  --viu-discret-rosu: 0.06;  --viu-discret-piersica: 0.17;  --viu-discret-auriu: 0.2;    /* secțiunile cu text */
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

Valorile exacte sunt în `src/styles/tokens.css`; contrastele tuturor perechilor folosite (inclusiv roșul pe alb și pe paper-2, rosu-300 și nuanța stinsă pe rosu-900, textul peste punctul cel mai saturat al fundalului viu, cazul cel mai defavorabil cu granulația) se verifică în `src/lib/tokens.test.ts` și și mărimile în px la 375/1280/1920 px se calculează la build în ghidul `/stil/`, care eșuează dacă o pereche pică AA. Verifică orice combinație nouă și ajustează valoarea, nu regula.

- **Denumirea oficială** (cerință a clientei, V3c): biroul apare peste tot ca „Birou Individual Notarial Bojan Elena Luminița” (`birou.denumire`), niciodată doar numele persoanei sau o formă prescurtată („Notar Bojan”, „bojan elena luminița”), și netradusă în EN: navbar, wordmark-ul gigant, titluri (`{titlu} | {denumire}`, înlocuit în BaseLayout), descrieri, OG, JSON-LD, subsol, CMS. Numele persoanei (`birou.notar`) apare singur doar când textul vorbește despre notar ca persoană (ex. „Despre”). Pe două rânduri, împărțirea o face `imparteDenumirea()` (`src/lib/denumire.ts`): sus forma juridică, jos numele.
- **Tipografie:** textul de bază e fix, 18 px (19 px de la 1600 px), în rem. Titlurile cresc cu lățimea între plafoane în rem (scara de mai sus; max ≤ 2.5 × min, ca zoom-ul să ajungă la 200%); paginile interioare nu au titluri mai mari decât Acasă. h1 și h2 în Funnel Display 500, cu spațiere negativă; h3 și h4 în Geist 500/600. `line-height` minim 1.6 pentru text. Fără text justify. Fără majuscule integrale pe paragrafe.
- **Wordmark-ul gigant** (`WordmarkGigant.astro`): în hero și în subsol, deasupra lui rândul „Birou Individual Notarial” (Funnel Display 500, `clamp(1.1rem, 1.6vw, 1.6rem)`, culoarea blocului: ink pe deschis, alb pe închis), iar blocul e `role="img"` cu `aria-label` = denumirea completă; în hero rândul apare odată cu wordmark-ul, la intrarea hero-ului. Numele notarului pe un rând, Funnel Display 600, `-0.045em`, `line-height .82`, pe toată lățimea cutiei lui, doar prin CSS (`100cqi / --wordmark-k`); în hero și în subsol (`latime="62"`) cutia e 62% din container de la 768 px, pe mobil toată lățimea. În hero `--c-ink`, în subsol alb. Decorativ (`aria-hidden`). Abaterea față de lățimea cutiei: max. 1% la 1280 și 1440 px, cu fontul încărcat, pe `/stil/` și pe Acasă (`node scripts/verifica-wordmark.mjs`). La schimbarea fontului sau a spațierii se remăsoară k.
- **Granulația:** zgomotul `feTurbulence` din prototip, opacitate .06, strat fix peste pagină (`body::after`), `pointer-events: none`. **Statică**: fără animație, la nicio setare (WCAG 2.2.2). Nu apare la tipărire și în `forced-colors`.
- **Fundalul viu** (`FundalViu.astro`, `src/lib/fundal-viu.ts`): pe secțiunile deschise de pe Acasă (hero `intensitate="puternic"` cu `cursor`; servicii, „Cum lucrăm”, întrebări `discret`) și pe capul paginilor interioare. 3 pete pe instanță, câte una din fiecare culoare (`--viu-culoare-*`), fiecare un `radial-gradient(closest-side, culoarea la opacitatea --viu-{intensitate}-{culoare}, transparent 70%)`. Geometria per `seed` (1–4) e în tabelul `SEED` (centrul în % din secțiune, mărimea 42–50vw, 58–66vw sub 768 px, plafonată la 32–38rem) și e copiată exact în CSS-ul componentei (CSP-ul nu permite `style=""`; testul compară). Fără `filter: blur()` și fără `mix-blend-mode`. Absolut, `inset: 0`, `overflow: hidden`, z-index sub conținut, `pointer-events: none`, `aria-hidden`; nu apare la tipărire și în `forced-colors`. Mișcarea (§3.2): ScrollTrigger cu `scrub: true` (±10–15%, scara 0.9–1.15), `will-change` doar cât secțiunea e în ecran; cu `cursor` și pointer fin, gsap.quickTo după cursor (max. 30 px). **Garanția de contrast are două părți:** (1) geometria: zonele colorate a două pete nu se ating niciodată, la nicio lățime 320–3840 px, în niciun moment al derulării, la nicio poziție a cursorului și la nicio înălțime a secțiunii ≥ `inaltimeMinima(seed)` (hero: lățimea sub 992 px, 0.4 × lățimea peste; restul 500 px) – `distantaMinima` în `fundal-viu.test.ts`, iar e2e verifică înălțimea reală a secțiunilor și, în randarea reală, că niciun pixel nu e mai închis decât centrul unei singure pete; (2) contrastul: în centrul fiecărei pete, pe `--c-paper` și `--c-paper-2`, cu granulația și cu 3/255 toleranță de randare, `--c-ink`, `--c-muted`, `--c-rosu` ≥ 4.5:1 (`tokens.test.ts`, `/stil/`). Un seed nou sau o secțiune mai scundă decât minimul cere verificarea geometriei. Opacitățile nu se cresc fără să treacă testele. Textul stins (`--c-slogan-stins`) nu se pune peste fundalul viu puternic.
- **Semnătura a fost scoasă la cererea clientei (V3d); fișierul e în `docs/arhiva/`.** Odată cu ea au ieșit intro-ul de la încărcare și atribuirea Vecteezy din subsol (licențe: `docs/licente.md`, „Nefolosite pe site (arhivă)”).
- **Mișcarea la scroll** (`src/scripts/miscare.ts`): `[data-reveal]` (rânduri din mască, yPercent 110 → 0, 0.8 s, stagger 0.08, expo.out, la `top 80%`, o dată), `[data-divider]` (scaleX 0 → 1, 1.1 s, power2.inOut, la `top 90%`), `[data-parallax="N"]` (yPercent N → −N cât e vizibil). `[data-tema-sectiune="light|dark"]` + `[data-navbar]`: tema navbar-ului (`src/scripts/tema-navbar.ts`, fără GSAP).
- **Starea „Deschis / Închis”** se transmite prin text și formă (disc plin / cerc gol), în ink / muted. Culoarea nu poartă informația.
- **Butoanele** (`Buton.astro`, butonul cu text dublat din prototip): textul de bază (18–24 px), 500, înălțime min. max(48 px, 2.6em), rază 4 px, săgeata în dreapta (opțională). Variante (V3d): plin (pe deschis fundal `--c-rosu`, text alb, hover `--c-rosu-hover`; pe închis fundal alb, text `--c-rosu-900`, hover `--c-rosu-50`) și contur (1 px în culoarea textului: `--c-ink` pe deschis, hover `--c-rosu-50`; alb pe închis, hover `--c-rosu-hover`). Culorile vin din tema celui mai apropiat `[data-tema-sectiune]` / `.pe-inchis` / `[data-tema]` (variabilele `--buton-*` din global.css). Literele se împart la build; numele accesibil e textul întreg. Fără `href` e `<button>`. Clasele vechi `.btn` rămân doar în interiorul paginilor, până la V4.
- **Navbar-ul** (`Header.astro`): fix sus, fără umbră; culoarea textului din `data-tema`, pusă de `tema-navbar.ts` după secțiunea de sub el (tema de la încărcare o dă pagina: `temaNavbar` în BaseLayout). Desktop (≥ 74rem): **transparent** mereu, fără linie. Sub 74rem: transparent doar sus; derulat peste 8 px (`data-derulat`, din `tema-navbar.ts`, aplicat fără tranziție la încărcare), primește fundal plin în culoarea temei (`--c-paper` / `--c-rosu-900`) și o linie de 1 px jos (`--c-line` / `--c-linie-inchis`), cu tranziția culorii (0.4 s; instant la mișcare redusă); la scroll 0 revine transparent; cu meniul compact deschis, fundalul îl dă panoul. Textul paginii nu trece niciodată vizibil pe sub navbar sub prag. Fără JS, fundal plin. Wordmark-ul (`Wordmark.astro`): denumirea pe două rânduri, sus „Birou Individual Notarial” (Geist 500, 0.78em, min. 16 px, opacitate .8), jos „Bojan Elena Luminița” (Funnel Display 600); numele accesibil al linkului e denumirea completă. Pe mobil (< 30rem) „Meniu” își păstrează cuvântul, fără iconiță, ca denumirea să încapă: fiecare rând pe o singură linie de la ~360 px, sub 358 px rândul de sus se poate rupe, sub 336 px ambele rânduri au 16 px (verificat 320–1920 px, RO și EN). Desktop de la 74rem (1184 px, prag măsurat): wordmark | Servicii · Programare · Întrebări · Contact (linia `.sub`, trasă permanent pe pagina curentă) | EN/RO · telefon · WhatsApp · Buton „Programare”. Sub prag: wordmark | telefon | (Programare de la 768 px) | „Meniu” (`<details>`, panou pe tot ecranul, `--c-rosu-900`, linkuri mari, contacte, limbă; Escape, focus ținut în panou, derulare blocată). Pe deschis: „Programare” plin `--c-rosu`, telefonul și „Meniu” pe contur ink, iconița WhatsApp `--c-rosu`. Orice secțiune închisă își declară `data-tema-sectiune="dark"`; `<main>` e `light`, `<footer>` e `dark`.
- **Pagina Acasă** (`PaginaAcasa.astro`, secțiunile în `src/components/acasa/`, textele din `pagini/{limba}/acasa.yaml`), V3d: hero deschis pe tot ecranul (`--c-paper`, fundal viu puternic, seed 1, cu cursor; de la 992 px pe 2 coloane: stânga blocul de titlu, max. ~50%, centrat vertical față de fotografie: `<h1>` doar cu titlul și, imediat după el, subtitlul `<p class="hero__subtitlu">` în muted, amândouă `display: inline` (arată ca un singur paragraf în două tonuri; subtitlul nu se pune în h1), sub ele linia roșie scurtă (`.hero__accent`, 4.5rem × 3 px, `--c-rosu`); dreapta fotografia biroului `hero.imagine`, 4:5, colțuri 0.25em, înălțimea limitată ca wordmark-ul să fie vizibil complet la 1280×720 și 1440×900; sub 992 px: h1 → linia roșie → fotografia 4:3; jos, pe toată lățimea: `hero.linie` + adresa, dividerul `--c-rosu`, wordmark-ul 62% în ink; fără butoane. Fotografia: `<Picture>` AVIF/WebP, srcset, `fetchpriority="high"`, fără lazy (e LCP); aceeași pe /en/, cu `hero.imagineAlt` obligatoriu pe fiecare limbă; până la fotografia reală, placeholder cald #F8EBE7 → #ECD3CC cu „Fotografie birou – urmează”) → frazele mari (ÎNCHISE: `--c-rosu-900`, `dark`, `.pe-inchis`, text alb, exact 3 în CMS, ~300vh sticky, grila de puncte `--c-rosu-300` .16 → .7 lângă cursor, decorativă; fără JS și la mișcare redusă, una sub alta) → servicii (`--c-paper`, fundal viu discret, seed 2; evidențiate, în ordinea din CMS; rânduri cu fotografie, număr mono și săgeată în `--c-rosu`, titlu cu link al cărui `::after` acoperă rândul, rezumat, `etichete`; bula „Vezi serviciul”) → cum lucrăm (`--c-paper-2`, fundal viu discret, seed 3; pași-butoane cu `aria-expanded`, inactivi la opacitate .6, punctul pasului activ în `--c-rosu`, imaginea pasului activ cu cifra mare `--c-rosu`, decorativă; acordeon doar sub `html.miscare`; sloganul) → întrebări (`--c-paper`, fundal viu discret, seed 4; cele cu `evidentiat`, max. `faq.numarAfisat`; iconița +/− în `--c-rosu`) → CTA-ul final (bandă `--c-rosu-900`, `dark`; `cta`: titlu alb, subtitlu `--c-rosu-300`, WhatsApp contur + Programare plin, varianta pe închis) → subsol. Fără shutter.
- **Subsolul** (`Footer.astro`): fundal `--c-rosu-900`, cu o linie de 3 px `--c-rosu` pe marginea de sus (decorativă), temă `dark` (`.pe-inchis`); titlurile coloanelor și rândul legal în `--c-rosu-300`, linkurile albe; Navigare | Contact | Adresă | Program, din `birou.yaml`; rândul legal (© an + denumirea oficială, confidențialitate, CIF din `birou.yaml`); linie `--c-rosu-300` și wordmark-ul gigant alb, 62%. Intră de sub conținut cu un strat #3D0A0A, opacitate 0.35 → 0.
- **Fundaluri:** `--c-paper` pentru pagină, `--c-paper-2` pentru secțiunile alternante și banda de titlu, fundalul viu peste secțiunile deschise de pe Acasă, `--c-rosu-900` pentru suprafețele închise (subsolul, meniul compact, frazele mari, CTA-ul final și hero-ul fără fotografie de pe paginile interioare). Pe închis, containerul primește `.pe-inchis` (focus `--c-paper`). Focusul pe deschis e `--c-rosu`; `::selection` fundal `--c-rosu`, text alb.
- **Linkuri:** în text, subliniate în `--c-ink`, iar la hover sublinierea se îngroașă; în navbar și subsol, linia `.sub` care se trage la hover (pe deschis în `--c-rosu`, pe închis în culoarea textului; pagina curentă: linia permanentă în culoarea textului).
- `mark.todo` rămâne galben pal (`#FFF1B8` cu text `--c-ink`), doar în preview.
- `theme-color` este `--c-rosu-900`. Imaginea OG implicită: fundal `--c-rosu-900`, textul alb și `--c-rosu-300`, linia `--c-rosu-300`, fără negru.
- Fotografii: un singur raport de aspect per secțiune, `object-fit: cover`, componenta `<Image>` din Astro (AVIF/WebP, `width`/`height` explicite). Până vin fotografiile reale, folosește blocuri placeholder cu fundal `--c-paper-2` și eticheta „Fotografie – de completat”. Fără fotografii stock pe site-ul public. **Excepție, doar în preview:** fotografiile provizorii din `src/assets/fotografii-provizorii/` (Unsplash, surse în `docs/licente.md`), legate în CMS cu `fotoProvizorie: true` și texte alternative marcate «DE VALIDAT»; în preview poartă eticheta vizibilă „Fotografie provizorie” (`FotoProvizorie.astro`), iar `scripts/verifica-continut.mjs` oprește build-ul de producție cât timp există vreo `fotoProvizorie: true` sau vreun «DE VALIDAT». Se înlocuiesc cu fotografii reale ale biroului.

## 6. Limbi și rute

Româna e limba implicită, la rădăcină, fără prefix. Engleza stă sub `/en/`, cu un set redus de pagini (decizie contractuală, act adițional nr. 1).

| Pagină | RO | EN |
|---|---|---|
| Acasă | `/` | `/en/` |
| Servicii | `/servicii/` | `/en/services/` (prezentare generală, fără pagini individuale) |
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
  faq/ro.yaml
  faq/en.yaml
  recenzii/recenzii.yaml          # recenzii Google reale, introduse manual
```

### Câmpuri obligatorii

Fiecare fișier de conținut are câmpul **`validat: boolean`**. Clientul îl bifează în CMS după ce aprobă textul.

**`setari/birou.yaml`:** `denumire`, `notar`, `adresa` (`strada`, `oras`, `judet`, `codPostal`), `telefon`, `telefonAfisat`, `email`, `emailActe`, `program` (listă `{ zi, deschidere, inchidere, inchis }` pentru luni–duminică, ore `HH:MM`), `zileLibere` (listă `{ data: YYYY-MM-DD, motiv }`), `googleMapsUrl`, `googleProfilUrl`, `rating` (număr sau gol), `numarRecenzii` (număr sau gol), `programareUrl` (link pagină de programări Google Calendar), `coordonate` (`lat`, `lng`, ambele `nullable`; JSON-LD include `geo` doar dacă sunt completate), `programConfirmare` și `zileLibereConfirmare` (string opționale, folosite doar ca marcaje `«DE COMPLETAT»` până la confirmarea biroului; nu se afișează pe site), `validat`.

**`servicii/ro/*.md` (frontmatter):** `titlu`, `slug`, `ordine` (număr), `evidentiat` (boolean, apare pe Acasă), `rezumat` (max. 160 caractere, folosit și ca meta description), `pentruCine`, `durata` (text, ex. „aprox. 1 oră”), `onorariu` (text general, fără sume: §3.4), `acteNecesare` (listă de string-uri), `subiectEmail`, `validat`; opțional `etichete`, `imagine`, `imagineAlt`, `fotoProvizorie`. Corpul Markdown are secțiunile `## Ce este`, `## Cum decurge`, `## Bine de știut`.

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
