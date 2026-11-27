/* Díl III – Hudební formy: rozvrh dílu */
'use strict';
Chapters.push({
  id: 'formy-plan', part: 3, n: '·', title: 'Rozvrh dílu', short: 'plán kapitol, ukázek a cvičení',
  lead: 'Plán Dílu III. Kapitoly navazují na kapitolu 8 Dílu I a na harmonii z Dílu II: forma se rozebírá spolu s tóninovým plánem a kadencemi.',
  render(b) {
    const PLAN = [
      ['Stavba hudební myšlenky', 'motiv a jeho práce (opakování, sekvence, obměna, zrcadlení), fráze, věta, perioda; typy period (opakovací, kontrastní, modulující), rozšíření a zkrácení, předtaktí', 'skládání periody z motivů v editoru, poslech předvětí × závětí, určení závěru (polovičný × celý)', 'vlastní ukázky'],
      ['Malé písňové formy', 'dvoudílná a – b, třídílná a – b – a, reprízová dvoudílná; tóninový plán dílů', 'časová osa skladby s barevnými díly, rozdělení ukázky na díly poslechem', 'Dvořák: Humoreska Ges dur op. 101 č. 7; Schumann: Album pro mládež op. 68'],
      ['Velká písňová forma, menuet, scherzo', 'A – B – A se složenými díly, menuet s triem (da capo), scherzo', 'interaktivní schéma „kudy se hraje“ s triem a da capo', 'Mozart: Menuet ze Symfonie g moll KV 550; Beethoven: Symfonie č. 5, 3. věta'],
      ['Variace', 'téma a variace (figurační, charakterové), ostinátní variace (passacaglia, chaconne), variace nad basem', 'přehrání tématu a jeho variací, určení druhu proměny (melodie, rytmus, harmonie, tónorod)', 'Mozart: Sonáta A dur KV 331, 1. věta; Haydn: Symfonie č. 94 „S úderem kotle“, 2. věta; Pachelbel: Kánon D dur; Bach: Chaconne d moll BWV 1004'],
      ['Rondo', 'malé rondo A – B – A – C – A, velké rondo, sonátové rondo; refrén a epizody, tóninový plán', 'poznávání refrénu poslechem, sestavení schématu', 'Beethoven: Pro Elišku WoO 59; Mozart: Rondo alla turca z KV 331'],
      ['Sonátová forma', 'expozice (hlavní a vedlejší téma, převedení, závěrečná skupina), provedení, repríza, kóda; sonatina; tóninový plán v dur a v moll', 'interaktivní mapa sonátové formy s tóninami, určování úseků poslechem', 'Mozart: Malá noční hudba KV 525, 1. věta; Beethoven: Sonáta f moll op. 2 č. 1, 1. věta'],
      ['Polyfonní formy', 'imitace, kánon, invence, fuga (téma – dux, odpověď – comes, kontrapunkt, mezivěta, stretta), chorální předehra', 'vyznačení nástupů tématu v ukázce, kánon na vlastní melodii (posun hlasů a poslech)', 'Bach: Invence č. 1 C dur BWV 772; Bach: Dobře temperovaný klavír I, Fuga c moll BWV 847'],
      ['Cyklické formy', 'suita (allemande, courante, sarabande, gigue a vložené tance), sonátový cyklus, symfonie, koncert (ritornel, kadence sólisty), smyčcový kvartet', 'přiřazování tanců k charakteristickému rytmu a taktu, stavba cyklu', 'Bach: Suita pro violoncello č. 1 G dur BWV 1007; Dvořák: Symfonie č. 9 e moll „Z Nového světa“'],
      ['Vokální formy', 'píseň (strofická, prokomponovaná), árie, recitativ, kantáta, oratorium, mše a její části, opera', 'rozlišení strofické a prokomponované písně, části mše', 'Schubert: Pstruh D 550; Dvořák: Rusalka – „Měsíčku na nebi hlubokém“; Händel: Mesiáš; Mozart: Requiem'],
      ['Formy 19. a 20. století', 'charakteristická klavírní skladba, cykly miniatur, symfonická báseň, programní hudba, nové přístupy k formě (ostinato, variace barvy)', 'poslechové rozbory s časovou osou', 'Smetana: Vltava; Musorgskij: Obrázky z výstavy; Chopin: Preludia op. 28; Ravel: Bolero'],
    ];
    b.append(Sec('kapitoly', 'Plánované kapitoly',
      Tbl(['Kapitola', 'Obsah', 'Interaktivní část', 'Ukázky k poslechu'], PLAN.map(([a, c, d, e], i) => [`${i + 1}. ${a}`, c, d, e]))));
    b.append(Sec('pristup', 'Jak bude díl fungovat',
      h('ul', {},
        h('li', { html: '<b>Vlastní notové ukázky</b>, které si lze přehrát. U každé bude barevně vyznačená stavba (motiv, věta, díly).' }),
        h('li', { html: '<b>Poslech skutečných skladeb</b> přes odkazy na nahrávky (YouTube, Spotify). Noty se nekopírují; u skladeb bude časová osa s vyznačením úseků.' }),
        h('li', { html: '<b>Cvičení</b>: poznávání formy a úseků poslechem, sestavování schémat, přiřazování pojmů, a v návaznosti na Díl II určování kadencí a tóninového plánu.' }),
        h('li', { html: 'Navazuje na <a href="#/formy">kapitolu 8 Dílu I</a> (základní přehled forem) a na <a href="#/h-funkce">kadence v Dílu II</a>.' })),
      Box('tip', '<p>Pořadí kapitol i výběr ukázek je návrh. Pokud ve škole probíráte formy v jiném pořadí nebo na jiných skladbách, upravím to.</p>')));
  }
});
