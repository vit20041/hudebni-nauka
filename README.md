# Hudební nauka a harmonie

Interaktivní učebnice hudební nauky a harmonie pro studium na konzervatoři: výklad s živými ukázkami,
sluchová výchova a cvičení s odpovídáním výběrem, hrou na klaviaturu / MIDI klávesy, zápisem do osnovy
nebo zpěvem do mikrofonu.

- **Díl I – Hudební nauka** (hotovo): tón a notový zápis, rytmus a takt, posuvky, intervaly, stupnice a tóniny,
  akordy, tempo / dynamika / přednes, formy, nástroje a hlasy.
- **Díl II – Harmonie** (připravuje se): čtyřhlasá sazba s automatickou kontrolou, funkce T–S–D, kadence, …

## Spuštění

Statická stránka bez sestavování – stačí otevřít `index.html` přes webový server
(mikrofon vyžaduje `https` nebo `localhost`):

```
powershell -File tools/serve.ps1     # http://localhost:8765/
```

## Struktura

- `js/theory.js` – tóny, intervaly, stupnice, akordy, české názvosloví
- `js/staff.js` – vlastní notová sazba (SVG, font Bravura/SMuFL)
- `js/audio.js` – zvuk (vzorky Salamander Grand Piano, náhradní syntéza)
- `js/io.js` – klaviatura, klávesnice počítače, Web MIDI, detekce výšky tónu z mikrofonu
- `js/quiz.js` – rámec cvičení a ukládání pokroku (localStorage)
- `js/app.js` – navigace, laboratoř, nastavení, přehled pokroku
- `js/d1-*.js` – kapitoly Dílu I

Zdroje třetích stran: font Bravura (SIL OFL, Steinberg) přes jsDelivr; klavírní vzorky Salamander Grand Piano
(CC-BY 3.0, Alexander Holm) z tonejs.github.io. Výklad a příklady jsou vlastní.
