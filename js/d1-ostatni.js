/* Díl I, kapitoly 7–8: tempo, dynamika, přednes, zkratky; formy, nástroje, hlasy */
'use strict';
const TERMS = {
  tempo: [
    ['Largo', 'široce, velmi pomalu'], ['Lento', 'pomalu'], ['Adagio', 'volně, pomalu'], ['Larghetto', 'o něco rychleji než largo'], ['Andante', 'krokem, mírně'], ['Andantino', 'o něco rychleji než andante'], ['Moderato', 'mírně'], ['Allegretto', 'dosti rychle, méně než allegro'], ['Allegro', 'rychle, vesele'], ['Vivace', 'živě'], ['Presto', 'velmi rychle'], ['Prestissimo', 'co nejrychleji'],
    ['accelerando (accel.)', 'zrychlovat'], ['ritardando (rit.)', 'zpomalovat'], ['rallentando (rall.)', 'zvolňovat'], ['ritenuto (riten.)', 'náhle zdržet'], ['a tempo', 'v původním tempu'], ['tempo primo (Tempo I)', 'v tempu ze začátku'], ['rubato', 'volně, s pružným tempem'], ['l\'istesso tempo', 've stejném tempu'],
  ],
  dyn: [
    ['pianissimo (pp)', 'velmi slabě'], ['piano (p)', 'slabě'], ['mezzopiano (mp)', 'polohlasně, středně slabě'], ['mezzoforte (mf)', 'středně silně'], ['forte (f)', 'silně'], ['fortissimo (ff)', 'velmi silně'], ['crescendo (cresc.)', 'zesilovat'], ['decrescendo / diminuendo (dim.)', 'zeslabovat'], ['sforzato (sf, sfz)', 'důrazně, náhlý přízvuk'], ['fortepiano (fp)', 'silně a hned slabě'], ['subito', 'náhle'], ['morendo', 'umírajíc, vytrácet se'],
  ],
  pred: [
    ['dolce', 'sladce, něžně'], ['cantabile', 'zpěvně'], ['espressivo', 'výrazně'], ['legato', 'vázaně'], ['staccato', 'krátce, odraženě'], ['tenuto', 'podržet plnou délku'], ['marcato', 'důrazně, zřetelně'], ['con brio', 's ohněm, svěže'], ['maestoso', 'majestátně'], ['grazioso', 'půvabně'], ['leggiero', 'lehce'], ['sostenuto', 'zdrženlivě, nesouce tón'], ['agitato', 'vzrušeně'], ['animato', 'oživeně'], ['pesante', 'těžce'], ['scherzando', 'žertovně'], ['tranquillo', 'klidně'], ['sempre', 'stále'], ['poco', 'trochu'], ['poco a poco', 'pozvolna'], ['molto', 'velmi'], ['meno', 'méně'], ['più', 'více'], ['simile', 'podobně (stejně dál)'], ['con moto', 's pohybem'], ['ma non troppo', 'ale ne příliš'], ['attacca', 'navázat bez přestávky'], ['tutti', 'všichni'],
  ],
};
const DYN = [['', 'pp', 0.18], ['', 'p', 0.3], ['', 'mp', 0.45], ['', 'mf', 0.6], ['', 'f', 0.8], ['', 'ff', 1]];

Chapters.push({
  id: 'prednes', part: 1, n: 7, title: 'Tempo, dynamika, přednes, zkratky', short: 'italské názvosloví, repetice, volty, D.C., D.S.',
  lead: 'Italská označení tempa, síly a výrazu a značky, které zkracují zápis: repetice, volty, da capo, dal segno.',
  quizzes: ['pr-tempo', 'pr-dyn', 'pr-pred', 'pr-poradi'],
  render(b) {
    /* tempo */
    const tw = (() => {
      const MEL = [60, 62, 64, 65, 67, 67, 69, 67, 65, 64, 62, 60];
      const L = [['Largo', 50], ['Adagio', 70], ['Andante', 90], ['Moderato', 112], ['Allegro', 138], ['Presto', 180]];
      return Wid('Poslech temp (orientační hodnoty)', h('div', { class: 'wctl' }, ...L.map(([n, bpm]) => PlayBtn(`${n} ♩≈${bpm}`, () => { Snd.stopAll(); Snd.melody(MEL, 60 / bpm, 60 / bpm * 0.9); }))));
    })();
    b.append(Sec('tempo', 'Tempo',
      P_('Tempo se tradičně udává <b>italsky</b>, přesně potom metronomickým údajem (♩ = 96 znamená 96 čtvrťových dob za minutu). Slovní označení neříká jen rychlost, ale i charakter. Metronomické rozsahy jednotlivých temp se v literatuře liší, proto jsou v ukázce jen orientační.'),
      h('div', { class: 'glossary' }, ...TERMS.tempo.map(([a, c]) => h('div', {}, h('b', {}, a), ' – ', c))),
      tw));

    /* dynamika */
    const dynW = Wid('Dynamika – stejný akord v různé síle', h('div', { class: 'wctl' }, ...DYN.map(([g, n, v]) => h('button', { class: 'btn', onclick: () => [60, 64, 67, 72].forEach(m => Snd.note(m, 0, 1.4, v * 0.7)), title: n }, h('span', { class: 'dyn' }, g)))),
      (() => { const NS = 'http://www.w3.org/2000/svg'; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 420 60'); s.setAttribute('class', 'hairpins'); s.innerHTML = '<path d="M10 22 L190 8 M10 22 L190 36" /><text x="100" y="56" text-anchor="middle">crescendo</text><path d="M230 8 L410 22 M230 36 L410 22" /><text x="320" y="56" text-anchor="middle">decrescendo</text>'; return s; })(),
      PlayBtn('crescendo a decrescendo', () => { for (let i = 0; i < 16; i++) { const v = i < 8 ? 0.15 + i * 0.1 : 0.15 + (15 - i) * 0.1; Snd.note(pick([60, 64, 67]), i * 0.18, 0.2, v); } }));
    b.append(Sec('dynamika', 'Dynamika',
      P_('<b>Dynamika</b> je síla (hlasitost) tónu. Označení jsou italská a píší se zkratkou pod notovou osnovu (u zpěvu nad ni).'),
      h('div', { class: 'glossary' }, ...TERMS.dyn.map(([a, c]) => h('div', {}, h('b', {}, a), ' – ', c))),
      dynW));

    /* přednes a artikulace */
    const artFig = h('div', { class: 'qstaff' });
    const svgArt = Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 480, items: [{ t: 'n', d: 'q', ps: [T.P(6, 0, 4)], lab: 'staccato' }, { t: 'sp', w: 1 }, { t: 'n', d: 'q', ps: [T.P(6, 0, 4)], lab: 'tenuto' }, { t: 'sp', w: 1 }, { t: 'n', d: 'q', ps: [T.P(6, 0, 4)], lab: 'akcent' }, { t: 'sp', w: 1 }, { t: 'n', d: 'q', ps: [T.P(6, 0, 4)], lab: 'marcato' }, { t: 'sp', w: 1 }, { t: 'n', d: 'h', ps: [T.P(6, 0, 4)], lab: 'fermata', fermata: true }] });
    // artikulační znaménka nad hlavičkami
    const art = ['', '', '', ''];
    const NS = 'http://www.w3.org/2000/svg';
    $$('g.it', svgArt).filter(g => g.querySelector('.head')).slice(0, 4).forEach((g, i) => {
      const hd = g.querySelector('.head'); const x = +hd.getAttribute('x'), y = +hd.getAttribute('y');
      const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x + 1); t.setAttribute('y', y - 16); t.setAttribute('font-family', 'Bravura'); t.setAttribute('font-size', 40); t.textContent = art[i]; g.append(t);
    });
    artFig.append(svgArt);
    b.append(Sec('prednes', 'Přednesová označení a artikulace',
      P_('Výraz skladby upřesňují přednesová označení. Většinou jsou italská, u novější hudby i v jiných jazycích. Kombinují se s příslovci: <i>poco</i>, <i>molto</i>, <i>più</i>, <i>meno</i>, <i>sempre</i>…'),
      h('div', { class: 'glossary' }, ...TERMS.pred.map(([a, c]) => h('div', {}, h('b', {}, a), ' – ', c))),
      P_('Způsob tvoření jednotlivých tónů (<b>artikulaci</b>) ukazují značky u hlavičky: <b>tečka</b> (staccato), <b>vodorovná čárka</b> (tenuto), <b>&gt;</b> (akcent), <b>^</b> (marcato). <b>Koruna (fermata)</b> nad notou znamená volné prodloužení tónu nebo pomlky.'),
      Fig(artFig)));

    /* repetice – průchod */
    const rep = (() => {
      const SC = {
        rep: { n: 'Repetice', bars: [['A'], ['B', '|:'], ['C', ':|'], ['D', '', '||']], order: [0, 1, 2, 1, 2, 3], txt: 'Úsek mezi repetičními znaménky |: :| se hraje dvakrát. Chybí-li úvodní |:, opakuje se od začátku.' },
        volty: { n: 'Volty (1. a 2. konec)', bars: [['A', '|:'], ['B'], ['C', '', '', '1.'], ['D', ':|', '', '1.'], ['E', '', '', '2.'], ['F', '', '||']], order: [0, 1, 2, 3, 0, 1, 4, 5], txt: 'Při opakování se 1. volta přeskočí a hraje se rovnou 2. volta.' },
        dc: { n: 'Da capo al Fine', bars: [['A'], ['B', '', 'Fine'], ['C'], ['D', '', 'D.C. al Fine']], order: [0, 1, 2, 3, 0, 1], txt: 'D.C. (da capo) = od začátku. Hraje se znovu od začátku až ke slovu Fine (konec).' },
        ds: { n: 'Dal segno al Coda', bars: [['A'], ['B', '𝄋'], ['C', '', 'To Coda ⊕'], ['D', '', 'D.S. al Coda'], ['E', '⊕ Coda', '||']], order: [0, 1, 2, 3, 1, 2, 4], txt: 'D.S. (dal segno) = od znaménka 𝄋. Při opakování se u „To Coda ⊕“ skočí na kódu ⊕.' },
      };
      let sc = 'rep';
      const bars = h('div', { class: 'bars' }); const out = h('div', { class: 'wout' }); const desc = h('p', { class: 'mut' });
      const CH = { A: [60, 64, 67], B: [57, 60, 65], C: [59, 62, 67], D: [60, 64, 67], E: [57, 60, 64], F: [55, 60, 64] };
      const draw = () => {
        const S = SC[sc]; bars.innerHTML = '';
        S.bars.forEach(([l, m, t, v], i) => bars.append(h('div', { class: 'bar' + (t === '||' ? ' fin' : ''), 'data-i': i }, v ? h('span', { class: 'volta' + (i > 0 && S.bars[i - 1][3] === v ? ' cont' : '') }, i > 0 && S.bars[i - 1][3] === v ? '' : v) : null, m && m !== '|:' && m !== ':|' ? h('span', { class: 'mk' }, m) : null, h('b', {}, l), t && t !== '||' ? h('span', { class: 'tx' }, t) : null, m === '|:' ? h('i', { class: 'rl' }, '𝄆') : null, m === ':|' ? h('i', { class: 'rr' }, '𝄇') : null)));
        desc.textContent = S.txt; out.innerHTML = 'Pořadí: <b>' + S.order.map(i => S.bars[i][0]).join(' → ') + '</b>';
      };
      const play = () => {
        const S = SC[sc]; Snd.stopAll();
        S.order.forEach((i, k) => {
          Snd.chord(CH[S.bars[i][0]], k * 0.7, 0.6);
          setTimeout(() => { $$('.bar', bars).forEach(x => x.classList.toggle('now', +x.dataset.i === i)); }, k * 700 + 30);
        });
        setTimeout(() => $$('.bar', bars).forEach(x => x.classList.remove('now')), S.order.length * 700 + 200);
      };
      const sel = h('select', { onchange: e => { sc = e.target.value; draw(); } }, ...Object.entries(SC).map(([k, v]) => h('option', { value: k }, v.n)));
      draw();
      return Wid('Kudy se hraje? (každé písmeno je jeden takt)', h('div', { class: 'wctl' }, h('label', {}, 'Případ', sel), PlayBtn('Projít', play)), bars, desc, out);
    })();
    b.append(Sec('zkratky', 'Repetice a další zkratky',
      h('ul', {},
        h('li', { html: '<b>repetice</b> |: … :| – opakování úseku,' }),
        h('li', { html: '<b>volty</b> 1. a 2. – různé konce při prvním a druhém průchodu,' }),
        h('li', { html: '<b>D.C. (da capo)</b> – od začátku; <b>D.C. al Fine</b> – od začátku po Fine,' }),
        h('li', { html: '<b>D.S. (dal segno)</b> – od znaménka 𝄋; <b>al Coda</b> – u značky ⊕ skočit na kódu,' }),
        h('li', { html: '<b>8va</b> nad notami – hrát o oktávu výš, <b>8vb</b> pod notami – o oktávu níž; <b>loco</b> – zase normálně,' }),
        h('li', { html: '<b>simile</b> – pokračovat stejně (např. ve stejné artikulaci).' })),
      rep,
      Box('pozor', '<p>Při D.C. a D.S. se repetice při druhém průchodu obvykle <b>neopakují</b>, pokud není výslovně napsáno <i>con repetizione</i>.</p>')));

    /* cvičení */
    const termQ = (id, title, list) => ({
      id, title, options: [{ key: 'dir', label: 'Směr', values: [['it', 'italsky → česky'], ['cz', 'česky → italsky']] }],
      gen: o => {
        const [a, c] = pick(list);
        if (o.dir === 'cz') return { html: `Které označení znamená <b>${c}</b>?`, choices: makeChoices(a, list.map(x => x[0]), 4), answer: a, explain: `${a} = ${c}` };
        return { html: `Co znamená <b><i>${a}</i></b>?`, choices: makeChoices(c, list.map(x => x[1]), 4), answer: c, explain: `${a} = ${c}` };
      }
    });
    b.append(Sec('cviceni', 'Cvičení',
      Ex(termQ('pr-tempo', 'Označení tempa', TERMS.tempo)),
      Ex(termQ('pr-dyn', 'Dynamika', TERMS.dyn)),
      Ex(termQ('pr-pred', 'Přednesová označení', TERMS.pred)),
      Ex({
        id: 'pr-poradi', title: 'Pořadí taktů', desc: 'Urči, v jakém pořadí se takty zahrají.',
        gen: () => {
          const cases = [
            ['A |: B C :| D', 'A B C B C D'], ['|: A B :| C D', 'A B A B C D'], ['|: A B | 1. C :| 2. D', 'A B C A B D'],
            ['A B (Fine) C D.C. al Fine', 'A B C A B'], ['A 𝄋 B C D.S. al Fine … Fine za C', 'A B C B C'], ['A 𝄋 B (To Coda ⊕) C D.S. al Coda ⊕ D', 'A B C B D'],
            ['|: A :| |: B :| C', 'A A B B C'], ['A |: B | 1. C :| 2. D | E', 'A B C B D E'],
          ];
          const [q, a] = pick(cases);
          const wrong = cases.map(x => x[1]).concat(['A B C D', 'A B C A B C', 'A B B C D', 'A B C D A B']).filter(x => x !== a);
          return { html: `Zápis: <b style="font-family:Fraunces,serif;font-size:20px">${q}</b><br>Jak se to zahraje?`, choices: makeChoices(a, uniq(wrong), 4), answer: a, explain: a };
        }
      })));
  }
});

/* ============ 8. Formy, nástroje, hlasy ============ */
const INSTR = [
  ['housle', 'smyčcové', 'g – d¹ – a¹ – e²', 'houslový', 'nezní transponovaně'],
  ['viola', 'smyčcové', 'c – g – d¹ – a¹', 'altový (výšky houslový)', 'nezní transponovaně'],
  ['violoncello', 'smyčcové', 'C – G – d – a', 'basový (výšky tenorový, houslový)', 'nezní transponovaně'],
  ['kontrabas', 'smyčcové', 'E₁ – A₁ – D – G (znějí)', 'basový', 'zní o oktávu níž'],
  ['flétna', 'dřevěné dechové', '–', 'houslový', 'nezní transponovaně'],
  ['pikola', 'dřevěné dechové', '–', 'houslový', 'zní o oktávu výš'],
  ['hoboj', 'dřevěné dechové', '–', 'houslový', 'nezní transponovaně'],
  ['anglický roh', 'dřevěné dechové', '–', 'houslový', 'in F, zní o čistou kvintu níž'],
  ['klarinet in B', 'dřevěné dechové', '–', 'houslový', 'zní o velkou sekundu níž'],
  ['klarinet in A', 'dřevěné dechové', '–', 'houslový', 'zní o malou tercii níž'],
  ['fagot', 'dřevěné dechové', '–', 'basový (výšky tenorový)', 'nezní transponovaně'],
  ['altový saxofon', 'dřevěné dechové', '–', 'houslový', 'in Es, zní o velkou sextu níž'],
  ['lesní roh in F', 'žesťové', '–', 'houslový (hluboké tóny basový)', 'zní o čistou kvintu níž'],
  ['trubka in B', 'žesťové', '–', 'houslový', 'zní o velkou sekundu níž'],
  ['trombon', 'žesťové', '–', 'basový a tenorový', 'nezní transponovaně'],
  ['tuba', 'žesťové', '–', 'basový', 'nezní transponovaně'],
  ['tympány', 'bicí (s určitou výškou)', 'ladí se na konkrétní tóny', 'basový', 'nezní transponovaně'],
  ['harfa', 'drnkací', '47 strun, pedály pro posuvky', 'velká osnova', 'nezní transponovaně'],
  ['kytara', 'drnkací', 'E – A – d – g – h – e¹ (znějí)', 'houslový', 'zní o oktávu níž'],
];
const TRANSP = [['klarinet in B', 'v2', -1], ['trubka in B', 'v2', -1], ['klarinet in A', 'm3', -1], ['lesní roh in F', 'č5', -1], ['anglický roh in F', 'č5', -1], ['altový saxofon in Es', 'v6', -1], ['tenorový saxofon in B', 'v9', -1], ['kontrabas', 'č8', -1], ['kytara', 'č8', -1], ['pikola', 'č8', 1]];

Chapters.push({
  id: 'formy', part: 1, n: 8, title: 'Hudební formy, nástroje a hlasy', short: 'motiv, perioda, písňová forma, rondo, sonáta; orchestr',
  lead: 'Jak se z motivů skládají věty a periody, jaké jsou základní formy a jak je uspořádán orchestr a pěvecké hlasy.',
  quizzes: ['fo-pojmy', 'fo-nastroje', 'fo-transp'],
  render(b) {
    /* perioda – vlastní ukázka */
    const Q = 'q', Hh = 'h', W = 'w';
    const n = (s, o, d, extra = {}) => ({ t: 'n', d, ps: [T.P(s, 0, o)], ...extra });
    const pre = [n(0, 4, Q), n(1, 4, Q), n(2, 4, Q), n(0, 4, Q), { t: 'b', s: '|' }, n(2, 4, Q), n(3, 4, Q), n(4, 4, Hh), { t: 'b', s: '|' }, n(5, 4, Q), n(4, 4, Q), n(3, 4, Q), n(2, 4, Q), { t: 'b', s: '|' }, n(1, 4, W), { t: 'b', s: '||' }];
    const post = [n(0, 4, Q), n(1, 4, Q), n(2, 4, Q), n(0, 4, Q), { t: 'b', s: '|' }, n(2, 4, Q), n(3, 4, Q), n(4, 4, Hh), { t: 'b', s: '|' }, n(5, 4, Q), n(4, 4, Q), n(3, 4, Q), n(1, 4, Q), { t: 'b', s: '|' }, n(0, 4, W), { t: 'b', s: '|.' }];
    const playLine = (its, t0 = 0) => { let t = t0; const D = { q: 0.45, h: 0.9, w: 1.8 }; its.filter(x => x.t === 'n').forEach(x => { Snd.note(T.midi(x.ps[0]), t, D[x.d] * 0.95); t += D[x.d]; }); return t; };
    const pf = h('div', { class: 'qstaff' }); pf.append(Staff.draw({ staves: [{ clef: 'g' }], time: [4, 4], items: pre, fit: true, minWidth: 640 }));
    const qf = h('div', { class: 'qstaff' }); qf.append(Staff.draw({ staves: [{ clef: 'g' }], time: [4, 4], items: post, fit: true, minWidth: 640 }));
    b.append(Sec('stavba', 'Stavba hudební myšlenky',
      P_('Nejmenší výraznou hudební myšlenkou je <b>motiv</b> (obvykle 1–2 takty). Z motivů vzniká <b>fráze</b> a z frází <b>věta</b> (obvykle 4 takty). Dvě věty, které na sebe odpovídají, tvoří <b>periodu</b> (8 taktů):'),
      h('ul', {}, h('li', { html: '<b>předvětí</b> končí otevřeně, nejčastěji na dominantě (<i>polovičním závěrem</i>),' }), h('li', { html: '<b>závětí</b> začíná podobně, ale uzavře se na tónice (<i>celým závěrem</i>).' })),
      Wid('Ukázka periody v C dur (vlastní příklad)', h('h3', {}, 'Předvětí – končí na d¹ (V. stupeň)'), pf, h('h3', {}, 'Závětí – končí na c¹ (tónika)'), qf, h('div', { class: 'row2' }, PlayBtn('předvětí', () => playLine(pre)), PlayBtn('závětí', () => playLine(post)), PlayBtn('celá perioda', () => { const t = playLine(pre); playLine(post, t + 0.2); })))));

    b.append(Sec('formy', 'Základní hudební formy',
      Tbl(['Forma', 'Schéma', 'Popis'], [
        ['malá písňová dvoudílná', 'a – b', 'dvě periody, druhá kontrastuje nebo pokračuje'],
        ['malá písňová třídílná', 'a – b – a', 'návrat prvního dílu (reprízu) po kontrastu'],
        ['velká písňová forma', 'A – B – A', 'díly samy mají písňovou formu (menuet s triem)'],
        ['rondo', 'A – B – A – C – A …', 'opakující se refrén (ritornel) se střídá s epizodami'],
        ['variace', 'A – A₁ – A₂ – A₃ …', 'téma a jeho obměny (melodické, rytmické, harmonické)'],
        ['sonátová forma', 'expozice – provedení – repríza (– kóda)', 'expozice: hlavní téma v tónice, vedlejší v dominantě (v moll v paralelní dur); provedení zpracovává témata; repríza vrací obě témata v tónice'],
        ['fuga', 'expozice – mezivěty – provedení', 'polyfonní forma: téma (dux) a odpověď (comes) postupně ve všech hlasech'],
      ]),
      P_('Formy se spojují do <b>cyklů</b>: <b>suita</b> (sled tanců – allemande, courante, sarabande, gigue…), <b>sonátový cyklus</b> (sonáta, smyčcový kvartet, <b>symfonie</b>, <b>koncert</b> pro sólový nástroj a orchestr) se zpravidla třemi až čtyřmi větami, z nichž první bývá v sonátové formě.')));

    /* nástroje */
    const tw = (() => {
      let ins = 0; const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      let written = T.P(0, 0, 5);
      const sel = h('select', { onchange: e => { ins = +e.target.value; upd(); } }, ...TRANSP.map(([n], i) => h('option', { value: i }, n)));
      const upd = () => {
        const [nm, iv, dir] = TRANSP[ins];
        const x = T.parseIv(iv); const snd = T.build(written, x.num, x.q, dir);
        sw.innerHTML = '';
        sw.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], fit: true, minWidth: 420, scale: 1.4, items: [{ t: 'sp', w: 3 }, { t: 'n', d: 'w', ps: [{ ...written, st: 0 }], lab: 'zápis' }, { t: 'sp', w: 3 }, { t: 'n', d: 'w', ps: [{ ...snd, st: T.midi(snd) >= 60 ? 0 : 1 }], color: 'var(--accent)', lab: 'zní' }], interactive: { staff: 0, x: 75, hint: true, onClick: p => { written = p; upd(); } } }));
        out.innerHTML = `${nm}: zapsané <b>${nameH(written)}</b> zní jako <b>${nameH(snd)}</b> (${T.ivName(iv)} ${dir < 0 ? 'níž' : 'výš'})`;
        Snd.note(T.midi(snd));
      };
      upd();
      return Wid('Transpozice – klikni do houslové osnovy na zapsaný tón', h('div', { class: 'wctl' }, h('label', {}, 'Nástroj', sel)), sw, out);
    })();
    b.append(Sec('nastroje', 'Nástroje symfonického orchestru',
      P_('Orchestr se dělí na skupiny <b>smyčcových</b>, <b>dřevěných dechových</b>, <b>žesťových</b> a <b>bicích</b> nástrojů, k nimž přistupuje harfa, klavír či celesta. V partituře se píší shora: dřeva, žestě, bicí, (harfa), smyčce.'),
      Tbl(['Nástroj', 'Skupina', 'Ladění strun', 'Klíč', 'Zápis'], INSTR),
      P_('<b>Transponující nástroje</b> zní jinak, než jsou zapsány. Označení „in B“ znamená, že zapsané c zní jako b. Hráč tak může používat stejné hmaty na nástrojích různé velikosti.'),
      tw));

    /* hlasy */
    const vf = h('div', { class: 'qstaff' });
    const R = [['soprán', T.P(0, 0, 4), T.P(4, 0, 5)], ['alt', T.P(4, 0, 3), T.P(1, 0, 5)], ['tenor', T.P(0, 0, 3), T.P(4, 0, 4)], ['bas', T.P(3, 0, 2), T.P(1, 0, 4)]];
    vf.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], fit: true, minWidth: 560, items: R.flatMap(([nm, lo, hi]) => [{ t: 'n', d: 'w', ps: [{ ...lo, st: T.midi(lo) >= 60 ? 0 : 1 }, { ...hi, st: T.midi(hi) >= 60 ? 0 : 1 }], lab: nm }, { t: 'sp', w: 2 }]) }));
    b.append(Sec('hlasy', 'Lidské hlasy',
      P_('Ženské hlasy: <b>soprán</b> (vysoký), <b>mezzosoprán</b>, <b>alt</b> (hluboký). Mužské hlasy: <b>tenor</b> (vysoký), <b>baryton</b>, <b>bas</b> (hluboký). Dětský hlas odpovídá rozsahem zhruba sopránu a altu.'),
      Fig(vf, 'Orientační rozsahy pro čtyřhlasou sazbu: soprán c¹–g², alt g–d², tenor c–g¹, bas F–d¹. Tyto meze budou platit v Dílu II.'),
      Box('tip', '<p>Tenorový part se ve sborové literatuře často píše do houslového klíče s osmičkou dole. Zní pak o oktávu níž, než je zapsán. V harmonických cvičeních se tenor píše do basové osnovy spolu s basem.</p>')));

    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'fo-pojmy', title: 'Formy a pojmy',
        gen: () => {
          const L = [['perioda', 'osmitaktová stavba z předvětí a závětí'], ['předvětí', 'první věta periody, končí otevřeně (často na dominantě)'], ['motiv', 'nejmenší výrazná hudební myšlenka'], ['rondo', 'forma s opakujícím se refrénem A – B – A – C – A'], ['variace', 'téma a jeho obměny'], ['sonátová forma', 'expozice – provedení – repríza'], ['malá písňová třídílná forma', 'a – b – a'], ['fuga', 'polyfonní forma s tématem postupně ve všech hlasech'], ['suita', 'cyklus stylizovaných tanců'], ['koncert', 'cyklická skladba pro sólový nástroj a orchestr'], ['repríza', 'návrat úvodního dílu']];
          const [a, c] = pick(L);
          return { html: `Co je <b>${a}</b>?`, choices: makeChoices(c, L.map(x => x[1]), 4), answer: c, explain: `${a}: ${c}` };
        }
      }),
      Ex({
        id: 'fo-nastroje', title: 'Do které skupiny patří nástroj?',
        gen: () => { const [n, g] = pick(INSTR); return { html: `<b>${n}</b>`, choices: uniq(INSTR.map(x => x[1])), answer: g, explain: `${n}: ${g}` }; }
      }),
      Ex({
        id: 'fo-transp', title: 'Transponující nástroje', desc: 'Jak zní zapsaný tón?',
        gen: () => {
          const [nm, iv, dir] = pick(TRANSP);
          const w = T.P(rnd(7), 0, 5); const x = T.parseIv(iv); const s = T.build(w, x.num, x.q, dir);
          const wrong = TRANSP.map(([, i2, d2]) => { const y = T.parseIv(i2); const q = T.build(w, y.num, y.q, d2); return q ? T.name(q) : null; }).filter(Boolean).concat([T.name(w)]);
          return { html: `<b>${nm}</b> má zapsaný tón <b>${nameH(w)}</b>. Jak skutečně zní?`, choices: makeChoices(T.name(s), uniq(wrong), 4), answer: T.name(s), explain: `zní o ${T.ivName(iv)} ${dir < 0 ? 'níž' : 'výš'}: ${nameH(s)}` };
        }
      })));
  }
});
