# Surse pentru semnătură

- `maini.jpg` (de adăugat): fotografia desenului cu mâinile care se strâng – linie închisă pe fond
  deschis, o singură trăsătură dacă se poate, capătul din stânga și cel din dreapta la aceeași înălțime.
  Apoi: `node scripts/vectorizeaza-maini.mjs` (opțional `--prag 40` dacă linia iese întreruptă,
  `--prag 60` dacă apar pete). Scriptul scrie `scripts/semnatura/maini.svg` și regenerează
  `src/assets/semnatura.svg` și `src/styles/semnatura-segmente.css`.

Fișierele de aici nu se servesc pe site (nu sunt importate de nicio pagină).
