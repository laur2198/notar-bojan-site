# Fonturile single-line din acest dosar

Folosite DOAR la build, de `scripts/genereaza-semnatura.mjs`, ca să genereze `src/assets/semnatura.svg`.
Nu se servesc pe site. Sursa: pachetul npm `hersheytext` 2.0.0 (MIT), dosarul `svg_fonts/`
(fonturile SVG ale extensiei Hershey Text din Inkscape, conversie Evil Mad Scientist Laboratories).

| Fișier | Font | Licență |
|---|---|---|
| `EMSAllure.svg` | EMS Allure (Sheldon B. Michaels, derivat din Allura de Rob Leuschke, TypeSETit) | SIL Open Font License 1.1 – https://openfontlicense.org |

Fontul folosit în semnătură: **EMS Allure** (Hershey Script a fost comparat și abandonat). Mențiunile de licență sunt păstrate în metadatele fișierului.
`maini.svg` este sursa grupului din mijloc: deocamdată o linie de legătură provizorie; `scripts/vectorizeaza-maini.mjs` o înlocuiește cu mâinile vectorizate din `src/assets/surse/maini.jpg`.
`geometrie.mjs`: simplificare, netezire Catmull-Rom → Bézier, parsare de path-uri, comune celor două scripturi.
