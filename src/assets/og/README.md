# Fonturi pentru imaginea Open Graph

`FunnelDisplay-SemiBold.ttf` (numele notarului) și `Geist-Regular.ttf` (restul textului) sunt folosite
**doar la build**, de `src/pages/og/[limba].png.ts`, ca să deseneze imaginea de distribuire (1200×630).
Nu se servesc pe site.

De ce TTF statice și nu fișierele `.woff2` din `@fontsource-variable/*`: motorul de text din `sharp`
(Pango + fontconfig, venit cu Astro) nu încarcă WOFF2 și ar folosi instanța implicită a fontului
variabil, iar serverul de build nu are fonturile instalate.

Sunt derivate din pachetele Fontsource ale proiectului (licență SIL Open Font License 1.1, fără
„Reserved Font Name”; textele licențelor în `OFL-FunnelDisplay.txt` și `OFL-Geist.txt`), cu fontTools:
instanța statică (Funnel Display `wght` 600, Geist `wght` 400) din subseturile latin și latin-ext,
unite și reduse la latin de bază, Latin-1, diacriticele românești (ă â î ș ț, plus formele cu sedilă)
și punctuația tipografică. Familiile sunt redenumite „Funnel Display OG” și „Geist OG”, ca să nu se
confunde cu un font instalat pe sistem.

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.merge import Merger
from fontTools import subset

# pentru fiecare subset (latin, latin-ext):
f = TTFont('node_modules/@fontsource-variable/funnel-display/files/funnel-display-latin-wght-normal.woff2')
f.flavor = None
instancer.instantiateVariableFont(f, {'wght': 600}).save('funnel-latin.ttf')
# apoi Merger().merge([latin, latin-ext]), subset.Subsetter cu unicode-urile:
# U+0020-007E, U+00A0-00FF, U+0102-0103, U+0218-021B, U+015E-015F, U+0162-0163,
# U+2013-2014, U+2018-201A, U+201C-201E, U+2022, U+2026, U+00B7 (layout: kern, liga, calt)
```
