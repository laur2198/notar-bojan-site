# Cum rulezi prompturile în Claude Code

## O singură dată, la început

1. Clonează repo-ul: `git clone https://github.com/laur2198/notar-bojan-site && cd notar-bojan-site`
2. Copiază în rădăcina repo-ului tot conținutul acestui pachet: `CLAUDE.md`, `src/content/`, `docs/`.
3. Commit inițial: `git add . && git commit -m "chore: context proiect și conținut propus" && git push`

## Pentru fiecare prompt

1. `git checkout main && git pull`
2. `git checkout -b etapa-N-nume` (numele e scris în capul fiecărui prompt)
3. Pornește `claude` în folderul repo-ului.
4. Apasă **Shift+Tab** până ajungi în **plan mode**.
5. Lipește promptul întreg din fișierul `0N-*.md` (doar partea de sub linia `--- PROMPT ---`).
6. Citește planul. Dacă vrea să schimbe ceva din `CLAUDE.md`, să adauge dependențe sau să modifice `src/content/` fără să-i fi cerut, respinge și explică-i.
7. Aprobă planul și lasă-l să lucreze.
8. La final verifică tu: `npm run dev`, deschizi `http://localhost:4321` pe desktop și în DevTools, pe 375 px.
9. Dacă e OK: `git push -u origin etapa-N-nume`, apoi merge în `main` (din GitHub, cu pull request, sau local).
10. `/clear` înainte de următorul prompt. Nu rula două prompturi în aceeași sesiune.

## Când ceva nu iese

- Spune-i ce vezi, concret: „pe 375 px butonul Programare acoperă textul din footer”, nu „nu arată bine”.
- Dacă după 2 încercări tot nu merge, cere-i să se oprească și să-ți explice cauza înainte să mai modifice ceva.
- Nu-l lăsa să „repare” un test sau o verificare axe dezactivând-o.

## Ordinea

| # | Fișier | Branch |
|---|---|---|
| 1 | `01-schelet.md` | `etapa-1-schelet` |
| 2 | `02-layout.md` | `etapa-2-layout` |
| 3 | `03-acasa.md` | `etapa-3-acasa` |
| 4 | `04-servicii.md` | `etapa-4-servicii` |
| 5 | `05-pagini.md` | `etapa-5-pagini` |
| 6 | `06-engleza.md` | `etapa-6-engleza` |

Prompturile 7 (programare și acte, după ce aveți domeniul și Workspace) și 8 (SEO, deploy) vin separat.
