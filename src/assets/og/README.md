# Fonturi pentru imaginea Open Graph

`Inter-Bold.otf` și `Inter-Regular.otf` sunt folosite **doar la build**, de `src/pages/og/[limba].png.ts`,
ca să deseneze textul imaginii de distribuire (1200×630). Nu se servesc pe site.

De ce `.otf` și nu fișierele `.woff2` din `@fontsource-variable/inter`: motorul de text din `sharp`
(Pango + fontconfig, venit cu Astro) nu încarcă WOFF2, iar serverul de build (Cloudflare) nu are Inter instalat.

Sunt subseturi ale Inter 4.0 (licență SIL OFL 1.1, vezi `OFL.txt`), doar latin de bază, Latin-1 și
diacriticele românești (ă â î ș ț, plus formele cu sedilă), făcute cu fontTools:

```sh
pyftsubset Inter-Bold.otf --unicodes="U+0020-007E,U+00A0-00FF,U+0102-0103,U+0218-021B,U+015E-015F,U+0162-0163,U+2013-2014,U+2018-201E,U+2022,U+2026,U+00B7" --layout-features='kern,liga,calt' --output-file=Inter-Bold.otf
```
