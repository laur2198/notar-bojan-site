# Prompt 1 – Schelet, conținut, CMS, design tokens

Branch: `etapa-1-schelet`

--- PROMPT ---

Citește întâi integral `CLAUDE.md` și toate fișierele din `src/content/`. Apoi fă un plan pentru task-ul de mai jos și așteaptă aprobarea mea.

## Context

Repo-ul conține deja `CLAUDE.md`, `src/content/` (conținut propus, scris de om) și `docs/`. Nu există încă proiect Astro. Acesta e primul pas: fundația pe care se construiesc toate paginile.

## Ce construiești

1. **Proiect Astro** (ultima versiune stabilă, TypeScript `strict`, template minimal). Pentru că folderul nu e gol, generează proiectul într-un folder temporar și mută fișierele în rădăcină **fără să suprascrii** `CLAUDE.md`, `src/content/` sau `docs/`. Șterge folderul temporar.
2. **`astro.config.mjs`:**
   - `site` citit din `process.env.SITE_URL`, cu fallback `https://notar-bojan.pages.dev`;
   - i18n conform secțiunii 6 din `CLAUDE.md`;
   - integrarea `@astrojs/sitemap` cu i18n (`ro-RO`, `en-US`), care exclude `/stil/`.
3. **`src/content.config.ts`:** câte o colecție pentru fiecare tip de fișier din `src/content/`, cu scheme Zod **derivate din fișierele existente** și din secțiunea 7 din `CLAUDE.md`. Toate câmpurile `validat` sunt `z.boolean()` obligatorii. `rating` și `numarRecenzii` sunt opționale (`nullable`). Imaginile folosesc helperul `image()` acolo unde e posibil. Dacă un fișier existent nu respectă schema, **nu modifica fișierul**: raportează-mi diferența.
4. **`src/lib/continut.ts`** cu:
   - `getBirou()`;
   - `esteDraft(entry)`, care întoarce `true` dacă `validat === false` sau dacă orice câmp string conține `«DE COMPLETAT`;
   - `marcheazaPlaceholder(text)`, care întoarce HTML cu fiecare `«DE COMPLETAT: …»` înfășurat în `<mark class="todo">…</mark>` (escapează restul textului corect);
   - `SITE_MODE` (`preview` sau `production`), citit din `import.meta.env`.
5. **`scripts/verifica-continut.mjs`:** când rulează cu `SITE_MODE=production`, scanează `src/content/` și iese cu cod 1 dacă găsește `validat: false` sau `«DE COMPLETAT`, cu lista fișierelor și a liniilor. În preview iese cu 0 și afișează un rezumat (câte fișiere sunt nevalidate).
6. **Scripturi în `package.json`:**
   - `dev`;
   - `build`, pentru preview;
   - `build:prod` = `cross-env SITE_MODE=production` + verificarea + `astro build`;
   - `preview`;
   - `check` = `astro check`;
   - `verifica`.

   Instalează `cross-env`: utilizatorul lucrează pe Windows.
7. **Fonturi:** instalează `@fontsource-variable/source-serif-4` și `@fontsource-variable/source-sans-3`, cu subset latin + latin-ext, importate o singură dată.
8. **Stiluri:**
   - `src/styles/tokens.css`, exact valorile din secțiunea 5 din `CLAUDE.md`;
   - `src/styles/global.css`: reset modern, tipografie de bază la 18 px, `:focus-visible` (inclusiv varianta pe fundal închis, cu `--c-focus-on-dark`), `.sr-only`, `.container`, `mark.todo` (fundal galben pal, contrast AA), `prefers-reduced-motion`;
   - butoanele `.btn`, `.btn--primar`, `.btn--secundar`, cu înălțime minimă de 52 px.
9. **Pagina internă `/stil/`** (`noindex`, exclusă din sitemap). E un ghid de stil care afișează: paleta, cu raportul de contrast calculat pentru fiecare pereche text/fundal folosită; scara tipografică; butoanele în stările normal/hover/focus; un paragraf cu toate diacriticele (ăâîșțĂÂÎȘȚ); un exemplu de `mark.todo`.
10. **Configurarea `.pages.yml`** în rădăcină, pentru toate colecțiile, cu etichete în română pe înțelesul unei secretare:
    - „Setări birou”, „Pagina Acasă”, „Servicii”, „Prețuri”, „Întrebări frecvente”, „Recenzii Google”, „Pagini” și „Engleză” ca grup separat;
    - câmpul `validat` apare cu eticheta „Text verificat și aprobat de birou”;
    - câmpurile care nu trebuie atinse (`slug`, `subiectEmail`) au descriere de avertizare;
    - fișierul `src/content/recenzii/recenzii.yaml` are descrierea „Copiați aici doar recenzii reale de pe Google”;
    - folderul de media trebuie să permită optimizarea imaginilor de către Astro. Verifică documentația Pages CMS (https://pagescms.org/llms-full.txt) și explică-mi în plan ce variantă alegi pentru `media` (`input`/`output`) și de ce.
11. **`.gitignore`:** adaugă `docs/capturi/`, `.env*` și `dist/`.
12. **`README.md`** scurt: comenzile, structura de foldere, cum se rulează `build:prod`.

## Ce NU faci

- Nu construiești încă pagini publice, header, footer sau componente de layout (etapa 2).
- Nu modifici `CLAUDE.md` și nici fișierele din `src/content/`.
- Nu adaugi Tailwind, alt framework CSS sau alte dependențe decât cele numite aici și cele cerute de Astro. Dacă ai nevoie de altceva, întreabă-mă.

## Criterii de acceptare

- `npm run build` trece; `npm run check` are 0 erori.
- `npm run build:prod` **eșuează** (corect, conținutul nu e validat) și listează fișierele.
- Toate fișierele din `src/content/` trec validarea schemelor. Dacă vreunul nu trece, mi-l raportezi și nu modifici fișierul.
- `/stil/` se deschide în `npm run dev`, diacriticele ș și ț apar cu virgulă, iar toate perechile de culori afișate trec AA pentru uzul declarat.
- axe pe `/stil/`: 0 încălcări serious/critical.

## La final

Raportează ce ai creat, rezultatul fiecărei verificări și deciziile luate (mai ales la `media` în `.pages.yml`). Commit: `feat: schelet Astro, scheme conținut, Pages CMS, design tokens`.
