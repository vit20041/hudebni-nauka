/* Díl III – Hudební formy (kapitoly 1–10) */
'use strict';
const F3 = (() => {
  /* odkazy na vyhledání nahrávek (bez konkrétních videí, aby nezastaraly) */
  function listen(items) {
    const ul = h('ul', { class: 'listen' });
    items.forEach(([who, what, note]) => ul.append(h('li', {},
      h('a', { href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${who} ${what}`), target: '_blank', rel: 'noopener' }, h('b', {}, who), ': ', what),
      note ? h('span', { class: 'mut' }, ' – ' + note) : null)));
    return h('div', { class: 'box tip' }, h('p', {}, h('b', {}, 'K poslechu'), ' (odkazy vedou na vyhledávání nahrávek na YouTube):'), ul);
  }
  /* přehrávač vygenerované skladby s časovou osou */
  function player(title, makeParts, ctl = []) {
    const tl = h('div', {}); const out = h('div', { class: 'wout' });
    let cur = null;
    const gen = () => {
      cur = makeParts(); tl.innerHTML = '';
      if (!cur) { out.textContent = 'Nepodařilo se sestavit, zkus to znovu.'; return; }
      const line = FG.timeline(cur.parts); tl.append(line); tl._line = line;
      out.innerHTML = cur.text || '';
    };
    const play = () => { if (!cur) gen(); FG.play(cur.parts, cur.cd || 0.8, i => tl._line && tl._line.hl(i)); };
    setTimeout(gen);
    return Wid(title, h('div', { class: 'wctl' }, ...ctl.map(c => c(gen)), h('button', { class: 'btn sm', onclick: () => { gen(); play(); } }, 'Nová ukázka'), PlayBtn('Přehrát', play), h('button', { class: 'btn sm ghost', onclick: () => FG.stop() }, '■ Stop')), tl, out);
  }
  /* cvičení: pojmy (otázka → odpověď) */
  function terms(id, title, list, desc) {
    return {
      id, title, desc, options: [{ key: 'dir', label: 'Směr', values: [['q', 'pojem → význam'], ['a', 'význam → pojem']] }],
      gen: o => {
        const [a, c] = pick(list);
        if (o.dir === 'a') return { html: `Který pojem odpovídá popisu: <b>${c}</b>?`, choices: makeChoices(a, list.map(x => x[0]), 4), answer: a, explain: `${a} – ${c}` };
        return { html: `Co je <b>${a}</b>?`, choices: makeChoices(c, list.map(x => x[1]), 4), answer: c, explain: `${a} – ${c}` };
      }
    };
  }
  /* cvičení: otázky s pevnou odpovědí */
  function qa(id, title, list) {
    return { id, title, gen: () => { const [q, a, wrong] = pick(list); return { html: q, choices: shuffle([a, ...wrong]), answer: a, explain: a }; } };
  }
  /* cvičení: poznej formu poslechem */
  function formQuiz(id, title, forms, desc) {
    return {
      id, title, desc: desc || 'Poslechni si krátkou skladbu a urči její formu. Rozdělení na díly se ukáže až po odpovědi.',
      gen: () => {
        const f = pick(forms); const p = FG.piece(f);
        const line = FG.timeline(p.parts, true);
        // během poslechu jen ukazatel průběhu – počet dílů by prozradil odpověď
        const bar = h('i'); const wrap = h('div', { class: 'tlwrap' }, h('div', { class: 'pbar' }, bar));
        let answered = false;
        return {
          html: 'Jakou formu má tato skladba?',
          node: wrap,
          play: () => {
            const tot = FG.play(p.parts, 0.8, i => line.hl(i));
            if (answered) return;
            bar.style.transition = 'none'; bar.style.width = '0%';
            requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${tot}s linear`; bar.style.width = '100%'; }));
          },
          choices: forms.map(x => ({ label: FG.FORMS[x].n, value: x })), answer: f,
          onDone: () => { answered = true; wrap.innerHTML = ''; wrap.append(line); },
          explain: `${FG.FORMS[f].n}; hlavní tónina ${p.K.name}`,
        };
      }
    };
  }
  return { listen, player, terms, qa, formQuiz };
})();

/* ============ III.1 Stavba hudební myšlenky ============ */
Chapters.push({
  id: 'f-stavba', part: 3, n: 1, title: 'Stavba hudební myšlenky', short: 'motiv a práce s ním, fráze, věta, perioda',
  lead: 'Hudba se skládá z menších celků jako jazyk ze slov a vět. Základem je motiv. Z něj se pomocí opakování a obměn stavějí fráze, věty a periody.',
  quizzes: ['f-motiv', 'f-zaver', 'f-pojmy1'],
  render(b) {
    const mw = (() => {
      let m = FG.motif(), tr = 'seq', res = FG.TRANS[tr].f(m);
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const draw = () => {
        sw.innerHTML = '';
        sw.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 520, scale: 1.4, items: [...FG.motifItems(m), { t: 'b', s: '||' }, ...FG.motifItems(res, 'var(--accent)')] }));
        out.innerHTML = `motiv → <b>${FG.TRANS[tr].n}</b>`;
      };
      const btns = Object.entries(FG.TRANS).map(([k, t]) => h('button', { class: 'chip', onclick: () => { tr = k; res = t.f(m); draw(); const e = FG.playMotif(m); FG.playMotif(res, 100, e + 0.4); } }, t.n.split(' (')[0]));
      draw();
      return Wid('Práce s motivem – vyber obměnu', h('div', { class: 'wctl' }, ...btns, h('button', { class: 'btn sm', onclick: () => { m = FG.motif(); res = FG.TRANS[tr].f(m); draw(); } }, 'Nový motiv')), sw, out);
    })();
    b.append(Sec('motiv', 'Motiv a jeho zpracování',
      P_('<b>Motiv</b> je nejmenší výrazná hudební myšlenka, obvykle o rozsahu jedné až dvou dob nebo taktu. Má charakteristický rytmus a melodický obrys. Skladatelé motiv málokdy jen opakují. Častěji ho <b>zpracovávají</b>:'),
      Tbl(['Postup', 'Co se děje'], [
        ['opakování', 'motiv zazní znovu beze změny'], ['sekvence', 'motiv se opakuje od jiného stupně (výš nebo níž)'],
        ['inverze (zrcadlo)', 'intervaly jdou opačným směrem'], ['račí postup', 'motiv zazní pozpátku'],
        ['augmentace / diminuce', 'rytmické hodnoty se zdvojnásobí / zkrátí na polovinu'], ['obměna (variace)', 'motiv se změní rytmicky, melodicky nebo harmonicky, ale zůstane rozpoznatelný'],
      ]),
      mw));
    /* perioda */
    const per = (() => {
      const K = H.key(0, 'dur');
      const pre = ['T', 'S', 'D', 'T', 'Sp', 'D'], post = ['T', 'S', 'D', 'T', 'K64', 'D7', 'T'];
      const sp = pre.map(t => H.spec(t, K)), sq = post.map(t => H.spec(t, K));
      const A = { K, specs: sp, sol: H.solve(sp) }, B = { K, specs: sq, sol: H.solve(sq) };
      const w1 = h('div', { class: 'qstaff' }); w1.append(Satb.draw(A.sol, { K, specs: sp, scale: 1.1 }));
      const w2 = h('div', { class: 'qstaff' }); w2.append(Satb.draw(B.sol, { K, specs: sq, scale: 1.1 }));
      return Wid('Harmonický plán periody (vlastní příklad, C dur)', h('h3', {}, 'Předvětí – polovičný závěr na D'), w1, h('h3', {}, 'Závětí – celý závěr na T'), w2,
        h('div', { class: 'row2' }, PlayBtn('předvětí', () => FG.play([{ sec: A, style: 'melody' }], 0.7)), PlayBtn('závětí', () => FG.play([{ sec: B, style: 'melody' }], 0.7)), PlayBtn('celá perioda', () => FG.play([{ sec: A, style: 'melody' }, { sec: B, style: 'melody' }], 0.7))));
    })();
    b.append(Sec('perioda', 'Fráze, věta, perioda',
      P_('Motivy se spojují ve <b>frázi</b> (obvykle 2 takty) a fráze ve <b>větu</b> (obvykle 4 takty). Dvě věty, které na sebe odpovídají jako otázka a odpověď, tvoří <b>periodu</b> (8 taktů):'),
      h('ul', {},
        h('li', { html: '<b>předvětí</b> končí otevřeně, nejčastěji <b>polovičním závěrem</b> na dominantě,' }),
        h('li', { html: '<b>závětí</b> se uzavírá <b>celým (autentickým) závěrem</b> na tónice.' })),
      Tbl(['Druh periody', 'Popis'], [
        ['opakovací (a – a′)', 'závětí začíná stejně jako předvětí, liší se až závěrem'],
        ['kontrastní (a – b)', 'závětí má jiný melodický materiál'],
        ['modulující', 'závětí končí v jiné tónině, nejčastěji v dominantové'],
        ['rozšířená / zkrácená', 'věta je prodloužená (opakováním, protažením kadence) nebo zkrácená, perioda nemá 8 taktů'],
        ['dvojperioda (16 taktů)', 'dvě periody spojené jako větší předvětí a závětí'],
      ]),
      per,
      P_('Hotovou melodickou periodu najdeš v <a href="#/formy">kapitole 8 Dílu I</a>.'),
      F3.listen([['Beethoven', 'Symfonie č. 5 c moll op. 67, 1. věta', 'celá věta vyrůstá z jediného čtyřtónového motivu'], ['Mozart', 'Sonáta A dur KV 331, 1. věta – téma', 'pravidelná osmitaktová perioda']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'f-motiv', title: 'Jak byl motiv obměněn?', desc: 'Vlevo je motiv, vpravo jeho obměna.',
        gen: () => {
          for (let k = 0; k < 50; k++) {
            const m = FG.motif(); const keys = Object.keys(FG.TRANS); const t = pick(keys); const r = FG.TRANS[t].f(m);
            // obměna musí být jednoznačná (např. račí postup nesmí dát totéž)
            const sig = x => x.map(n => n.d + n.r).join();
            if (t !== 'rep' && sig(r) === sig(m)) continue;
            if (t === 'inv' && sig(FG.TRANS.ret.f(m)) === sig(r)) continue;
            return {
              html: 'Jakým způsobem je motiv zpracován?',
              staff: { staves: [{ clef: 'g' }], items: [...FG.motifItems(m), { t: 'b', s: '||' }, ...FG.motifItems(r, 'var(--accent)')], minWidth: 420, scale: 1.3 },
              play: () => { const e = FG.playMotif(m); FG.playMotif(r, 100, e + 0.4); },
              choices: keys.map(k => ({ label: FG.TRANS[k].n, value: k })), answer: t, explain: FG.TRANS[t].n,
            };
          }
        }
      }),
      Ex({
        id: 'f-zaver', title: 'Polovičný, nebo celý závěr?', desc: 'Poslechni si větu a urči, jak končí: otevřeně na dominantě, nebo uzavřeně na tónice.',
        gen: () => {
          for (let k = 0; k < 30; k++) {
            const K = H.key(pick([-2, -1, 0, 1, 2]), pick(['dur', 'dur', 'moll']));
            let toks = H.progression(3, 5, K.mode);
            const half = Math.random() < 0.5;
            if (half) toks = [...toks.slice(0, -1).map(t => t === 'D7' ? 'D' : t)];
            const sec = FG.section(K, { toks });
            if (!sec) continue;
            const ans = half ? 'polovičný závěr (na dominantě)' : 'celý závěr (na tónice)';
            return { html: `Jak věta končí? <span class="mut">(${K.name})</span>`, play: () => FG.play([{ sec, style: 'melody' }], 0.75), choices: ['celý závěr (na tónice)', 'polovičný závěr (na dominantě)'], answer: ans, explain: `${ans}: ${sec.specs.map(s => H.label(s)).join(' – ')}` };
          }
        }
      }),
      Ex(F3.terms('f-pojmy1', 'Pojmy hudební stavby', [['motiv', 'nejmenší výrazná hudební myšlenka'], ['fráze', 'spojení motivů, obvykle 2 takty'], ['věta', 'uzavřený úsek, obvykle 4 takty'], ['perioda', 'dvě věty (předvětí a závětí), obvykle 8 taktů'], ['předvětí', 'první věta periody, končí otevřeně'], ['závětí', 'druhá věta periody, končí na tónice'], ['sekvence', 'opakování motivu od jiného stupně'], ['dvojperioda', 'dvě periody spojené do 16taktového celku'], ['modulující perioda', 'závětí končí v jiné tónině']]))));
  }
});

/* ============ III.2 Malé písňové formy ============ */
Chapters.push({
  id: 'f-pisnove', part: 3, n: 2, title: 'Malé písňové formy', short: 'dvoudílná a – b, třídílná a – b – a, barová a – a – b',
  lead: 'Nejjednodušší uzavřené formy, ze kterých se skládá většina lidových písní, tanců a drobných skladeb.',
  quizzes: ['f-forma1', 'f-schema1'],
  render(b) {
    b.append(Sec('druhy', 'Dvoudílná a třídílná forma',
      P_('Díly malých písňových forem mají obvykle rozsah periody (8 taktů). Malými písmeny je značíme proto, že jde o malé díly.'),
      Tbl(['Forma', 'Schéma', 'Popis'], [
        ['malá písňová dvoudílná', 'a – b', 'druhý díl přináší nový materiál nebo pokračování; často se oba díly opakují (||: a :||: b :||)'],
        ['reprízová dvoudílná', 'a – b a′', 'na konci druhého dílu se vrací část prvního (repríza)'],
        ['malá písňová třídílná', 'a – b – a', 'kontrastní střední díl a návrat (repríza) prvního dílu'],
        ['barová forma', 'a – a – b', 'dva shodné úseky (Stollen) a odlišný závěr (Abgesang); častá v chorálech a lidových písních'],
      ]),
      P_('Kontrast středního dílu se dosahuje jinou tóninou (dominantovou, paralelní), jiným rytmem, doprovodem nebo charakterem. Tóninový plán třídílné formy bývá T – D (nebo paralela) – T.'),
      F3.player('Vygenerované skladby v malých písňových formách', () => { const f = pick(['ab', 'aba', 'aab']); const p = FG.piece(f); return p && { ...p, text: `${FG.FORMS[f].n}, ${p.K.name}` }; }),
      F3.listen([['Dvořák', 'Humoreska Ges dur op. 101 č. 7', 'třídílná forma s kontrastním středním dílem v moll'], ['Schumann', 'Album pro mládež op. 68 – Veselý venkovan', 'drobná písňová forma']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.formQuiz('f-forma1', 'Poznej malou písňovou formu', ['ab', 'aba', 'aab'])),
      Ex(F3.qa('f-schema1', 'Schéma a název formy', [
        ['Jak se nazývá forma <b>a – b – a</b>?', 'malá písňová třídílná', ['malá písňová dvoudílná', 'barová forma', 'rondo']],
        ['Jak se nazývá forma <b>a – b</b>?', 'malá písňová dvoudílná', ['malá písňová třídílná', 'barová forma', 'variace']],
        ['Jak se nazývá forma <b>a – a – b</b>?', 'barová forma', ['malá písňová třídílná', 'rondo', 'malá písňová dvoudílná']],
        ['Jak se nazývá forma <b>a – b a′</b> (na konci druhého dílu se vrací první)?', 'reprízová dvoudílná', ['barová forma', 'rondo', 'velká písňová forma']],
        ['Jaký tóninový plán bývá v malé písňové třídílné formě v dur?', 'T – D – T', ['T – S – D', 'D – T – D', 'T – T – T']],
      ]))));
  }
});

/* ============ III.3 Velká písňová forma, menuet, scherzo ============ */
Chapters.push({
  id: 'f-velka', part: 3, n: 3, title: 'Velká písňová forma, menuet, scherzo', short: 'A – B – A ze složených dílů, menuet s triem, da capo',
  lead: 'Když jednotlivé díly třídílné formy samy mají písňovou formu, vzniká velká písňová forma. Jejím typickým příkladem je menuet s triem.',
  quizzes: ['f-menuet', 'f-pojmy3'],
  render(b) {
    const order = h('div', { class: 'bars' });
    const seq = [['a', 'M'], ['a', 'M'], ['b', 'M'], ['a', 'M'], ['b', 'M'], ['a', 'M'], ['c', 'T'], ['c', 'T'], ['d', 'T'], ['c', 'T'], ['d', 'T'], ['c', 'T'], ['a', 'M'], ['b', 'M'], ['a', 'M']];
    seq.forEach(([l, s]) => order.append(h('div', { class: 'bar ' + (s === 'T' ? 'trio' : '') }, h('b', {}, l))));
    b.append(Sec('velka', 'Velká písňová forma',
      P_('<b>Velká písňová forma</b> má schéma <b>A – B – A</b>. Každý díl je sám malou písňovou formou (A = a – b – a, B = c – d – c). Střední díl B kontrastuje tóninou, charakterem i nástrojovým obsazením.'),
      P_('<b>Menuet</b> je klasický třídobý tanec mírného tempa. Ve skladbě má podobu <b>Menuet – Trio – Menuet da capo</b>. Trio se původně hrálo jen třemi nástroji, odtud název. Při da capo se menuet hraje <b>bez repetic</b>.'),
      Wid('Pořadí dílů: Menuet ||: a :||: b a :|| – Trio ||: c :||: d c :|| – Menuet da capo', order, h('p', { class: 'mut' }, 'Menuet (bordó) – Trio (modře) – Menuet da capo bez repetic.')),
      P_('<b>Scherzo</b> (žert) nahradilo menuet v symfoniích a sonátách od Beethovena. Má stejné schéma, ale rychlé tempo, prudké akcenty a často humorný nebo dramatický charakter.'),
      F3.listen([['Mozart', 'Symfonie č. 40 g moll KV 550, 3. věta (Menuetto)', 'menuet s triem v G dur'], ['Beethoven', 'Symfonie č. 5 c moll, 3. věta', 'scherzo s triem'], ['Petzold (dříve připisováno Bachovi)', 'Menuet G dur z Knížky pro Annu Magdalenu Bachovou', 'drobný menuet']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.qa('f-menuet', 'Menuet a trio', [
        ['Menuet ||: a :||: b a :||, Trio ||: c :||: d c :||, Menuet da capo. V jakém pořadí zazní díly?', 'a a b a b a – c c d c d c – a b a', ['a b a – c d c – a b a', 'a a b a b a – c c d c d c – a a b a b a', 'a b – c d – a b']],
        ['Jak se hraje menuet po triu (da capo)?', 'bez repetic', ['s repeticemi', 'jen první díl', 'jen poslední takty']],
        ['Proč se střední díl menuetu nazývá trio?', 'původně ho hrála jen tři nástroje', ['má tři díly', 'je ve třídobém taktu', 'opakuje se třikrát']],
        ['Co nahradilo menuet v Beethovenových symfoniích?', 'scherzo', ['rondo', 'fuga', 'sarabanda']],
        ['Jaké je schéma velké písňové formy?', 'A – B – A, díly jsou samy písňovými formami', ['a – b', 'A – B – A – C – A', 'a – a – b']],
      ])),
      Ex(F3.terms('f-pojmy3', 'Pojmy', [['menuet', 'třídobý tanec mírného tempa'], ['trio', 'střední díl menuetu nebo scherza'], ['scherzo', 'rychlá věta s triem, nástupce menuetu'], ['da capo', 'od začátku'], ['velká písňová forma', 'A – B – A ze složených dílů']]))));
  }
});

/* ============ III.4 Variace ============ */
Chapters.push({
  id: 'f-variace', part: 3, n: 4, title: 'Variace', short: 'téma s variacemi, figurační, charakterové, ostinátní',
  lead: 'Téma zazní a pak se v řadě variací proměňuje: melodicky, rytmicky, harmonicky, tónorodem nebo charakterem.',
  quizzes: ['f-var', 'f-pojmy4'],
  render(b) {
    b.append(Sec('druhy', 'Druhy variací',
      Tbl(['Druh', 'Popis'], [
        ['figurační (ornamentální)', 'melodie se zdobí, doprovod se rozkládá do figur; harmonie a stavba tématu zůstávají'],
        ['charakterové', 'každá variace má jiný charakter (pochod, tanec, nokturno), mění se i tempo a tónorod'],
        ['ostinátní', 'opakuje se basová linka nebo harmonický průběh (basso ostinato) a nad ním se mění horní hlasy; patří sem passacaglia a chaconne'],
        ['volné variace', 'z tématu se zpracovávají jen motivy (19. a 20. století)'],
      ]),
      P_('Typické proměny: <b>tónorod</b> (dur → moll, tzv. minore), <b>rytmus</b> (tečkovaný, triolový), <b>figurace doprovodu</b>, <b>melodické zdobení</b> (průchodné a střídavé tóny), přesun melodie do jiného hlasu, <b>harmonie</b> (nové akordy pod stejnou melodií).'),
      F3.player('Vygenerované téma s variacemi', () => { const p = FG.piece('vari'); return p && { ...p, text: `Téma (${p.K.name}), variace: figurace doprovodu, změna tónorodu, melodické zdobení.` }; }),
      F3.listen([['Mozart', 'Sonáta A dur KV 331, 1. věta', 'téma s šesti variacemi'], ['Haydn', 'Symfonie č. 94 G dur „S úderem kotle“, 2. věta', 'figurační variace'], ['Pachelbel', 'Kánon D dur', 'variace nad ostinátním basem'], ['Bach', 'Partita d moll BWV 1004 – Chaconne', 'ostinátní variace'], ['Brahms', 'Variace na Haydnovo téma op. 56', 'charakterové variace']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'f-var', title: 'Jak je téma proměněno?', desc: 'Zazní téma a po něm jedna variace. Urči hlavní proměnu.',
        gen: () => {
          for (let k = 0; k < 30; k++) {
            const K = H.key(pick([-2, -1, 0, 1, 2]), 'dur');
            const th = FG.section(K, { level: 3, n: 6 }); if (!th) continue;
            const kind = pick(['moll', 'fig', 'rytmus', 'zdob']);
            let v;
            if (kind === 'moll') { const Km = FG.rel(K, 'same'); const s = Km && FG.section(Km, { toks: th.toks }); if (!s) continue; v = { sec: s, style: 'melody' }; }
            else v = { sec: th, style: { fig: 'alberti', rytmus: 'dotted', zdob: 'ornament' }[kind] };
            const N = { moll: 'změna tónorodu (dur → moll)', fig: 'figurace doprovodu', rytmus: 'rytmická obměna melodie', zdob: 'melodické zdobení' };
            const parts = [{ sec: th, style: 'melody', label: 'téma' }, { ...v, label: 'variace' }];
            const line = FG.timeline(parts);
            return { html: 'Co se ve variaci změnilo?', node: line, play: () => FG.play(parts, 0.75, i => line.hl(i)), choices: Object.values(N), answer: N[kind], explain: N[kind] };
          }
        }
      }),
      Ex(F3.terms('f-pojmy4', 'Pojmy', [['basso ostinato', 'stále se opakující basová linka'], ['passacaglia', 'ostinátní variace nad basem, třídobá'], ['chaconne', 'ostinátní variace nad opakovaným harmonickým průběhem'], ['minore', 'variace v mollové tónině'], ['figurační variace', 'zdobí melodii a rozkládá doprovod, stavba zůstává'], ['charakterová variace', 'mění charakter, tempo, někdy i takt']]))));
  }
});

/* ============ III.5 Rondo ============ */
Chapters.push({
  id: 'f-rondo', part: 3, n: 5, title: 'Rondo', short: 'refrén a epizody; malé, velké a sonátové rondo',
  lead: 'Rondo střídá opakující se hlavní díl (refrén) s kontrastními epizodami (kuplety).',
  quizzes: ['f-forma2', 'f-rondo-q'],
  render(b) {
    b.append(Sec('druhy', 'Druhy ronda',
      Tbl(['Druh', 'Schéma', 'Poznámka'], [
        ['malé rondo', 'A – B – A – C – A', 'refrén se vrací v hlavní tónině, epizody jsou v příbuzných tóninách'],
        ['velké rondo', 'A – B – A – C – A – B – A', 'symetrické, epizoda B se vrací'],
        ['sonátové rondo', 'A – B – A – C – A – B – A', 'B se poprvé objeví v dominantě, při návratu v tónice (jako vedlejší téma v sonátové formě); C bývá provedením'],
        ['barokní rondeau', 'A – B – A – C – A …', 'francouzský typ (Couperin), refrén s kuplety'],
      ]),
      P_('Rondo je častou formou <b>posledních vět</b> (finále) sonát, koncertů a symfonií díky živému tempu a návratům známého tématu.'),
      F3.player('Vygenerované rondo', () => { const p = FG.piece('rondo'); return p && { ...p, cd: 0.7, text: `Malé rondo v ${p.K.name.replace(' dur', ' dur')}: refrén A se vrací v hlavní tónině, epizody B a C kontrastují.` }; }),
      F3.listen([['Beethoven', 'Pro Elišku WoO 59', 'rondo A – B – A – C – A'], ['Mozart', 'Sonáta A dur KV 331, 3. věta (Rondo alla turca)', ''], ['Beethoven', 'Sonáta c moll op. 13 „Patetická“, 3. věta', 'sonátové rondo']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.formQuiz('f-forma2', 'Poznej formu – rondo, variace, písňové formy', ['ab', 'aba', 'rondo', 'vari'])),
      Ex(F3.qa('f-rondo-q', 'Rondo – otázky', [
        ['Jak se nazývá opakující se hlavní díl ronda?', 'refrén (ritornel)', ['epizoda', 'kóda', 'trio']],
        ['Jaké je schéma malého ronda?', 'A – B – A – C – A', ['A – B – A', 'A – A₁ – A₂', 'a – a – b']],
        ['Ve které větě cyklu se rondo objevuje nejčastěji?', 'v poslední (finále)', ['v první', 've druhé (pomalé)', 'v menuetu']],
        ['Čím se sonátové rondo liší od velkého ronda?', 'epizoda B se vrací v tónice jako vedlejší téma sonátové formy', ['nemá refrén', 'je pomalé', 'má jen dva díly']],
      ]))));
  }
});

/* ============ III.6 Sonátová forma ============ */
Chapters.push({
  id: 'f-sonata', part: 3, n: 6, title: 'Sonátová forma', short: 'expozice, provedení, repríza, kóda; tóninový plán',
  lead: 'Nejdůležitější forma klasicismu a romantismu. Je to dramatický příběh dvou kontrastních témat a jejich tónin.',
  quizzes: ['f-sonata-q', 'f-pojmy6'],
  render(b) {
    const map = (() => {
      let mode = 'dur';
      const PARTS = (m) => [
        ['Expozice', 'exp', [['hlavní téma', m === 'dur' ? 'T' : 't', 'hlavní téma v hlavní tónině, výrazné, často energické'], ['převedení', '→', 'modulační úsek, mění tóninu směrem k vedlejšímu tématu'], ['vedlejší téma', m === 'dur' ? 'D' : 'tP', m === 'dur' ? 'kontrastní, zpěvnější téma v dominantové tónině' : 'kontrastní téma v paralelní durové tónině'], ['závěrečná skupina', m === 'dur' ? 'D' : 'tP', 'potvrzuje novou tóninu; expozice se obvykle opakuje']]],
        ['Provedení', 'prov', [['provedení', 'mod.', 'zpracování motivů obou témat, sekvence, modulace do vzdálenějších tónin; vrcholí na dominantě před reprízou (dominantní prodleva)']]],
        ['Repríza', 'rep', [['hlavní téma', m === 'dur' ? 'T' : 't', 'návrat hlavního tématu v hlavní tónině'], ['převedení', '', 'upravené tak, aby nemodulovalo'], ['vedlejší téma', m === 'dur' ? 'T' : 't (T)', 'vedlejší téma nyní v hlavní tónině, v moll v tónice nebo stejnojmenné dur'], ['závěrečná skupina', m === 'dur' ? 'T' : 't', 'v hlavní tónině']]],
        ['Kóda', 'koda', [['kóda', m === 'dur' ? 'T' : 't', 'nepovinný závěr, potvrzuje tóninu, někdy obsahuje další provedení']]],
      ];
      const box = h('div', { class: 'smap' }); const out = h('div', { class: 'wout' }, 'Klikni na úsek.');
      const draw = () => {
        box.innerHTML = '';
        PARTS(mode).forEach(([n, cls, subs]) => {
          const g = h('div', { class: 'sgrp ' + cls }, h('div', { class: 'sgt' }, n));
          const row = h('div', { class: 'srow2' });
          subs.forEach(([sn, key, txt]) => row.append(h('button', { class: 'sblk', onclick: ev => { out.innerHTML = `<b>${n} – ${sn}</b> (${key}): ${txt}`; $$('.sblk', box).forEach(x => x.classList.remove('on')); ev.currentTarget.classList.add('on'); } }, h('span', {}, sn), h('i', {}, key))));
          g.append(row); box.append(g);
        });
      };
      draw();
      const sel = h('select', { onchange: e => { mode = e.target.value; draw(); out.textContent = 'Klikni na úsek.'; } }, h('option', { value: 'dur' }, 'skladba v dur'), h('option', { value: 'moll' }, 'skladba v moll'));
      return Wid('Mapa sonátové formy s tóninovým plánem', h('div', { class: 'wctl' }, h('label', {}, 'Tónina skladby', sel)), box, out);
    })();
    b.append(Sec('stavba', 'Stavba sonátové formy',
      P_('Sonátová forma má tři hlavní části: <b>expozici</b> (představení dvou témat ve dvou tóninách), <b>provedení</b> (zpracování a modulace) a <b>reprízu</b> (návrat témat, nyní obou v hlavní tónině). Může začínat pomalým <b>úvodem</b> a končit <b>kódou</b>.'),
      map,
      Box('def', '<p>Hlavní napětí sonátové formy je <b>tóninové</b>: vedlejší téma v expozici stojí v jiné tónině a teprve repríza ho „smíří“ s hlavní tóninou.</p>'),
      P_('<b>Sonatina</b> je menší a jednodušší sonátová forma. Provedení bývá velmi krátké nebo chybí, témata jsou prostší. Je typická pro instruktivní literaturu (Clementi, Kuhlau).'),
      F3.listen([['Mozart', 'Malá noční hudba KV 525, 1. věta', 'přehledná sonátová forma v G dur'], ['Beethoven', 'Sonáta f moll op. 2 č. 1, 1. věta', 'vedlejší téma v As dur (paralelní dur)'], ['Clementi', 'Sonatina C dur op. 36 č. 1', 'sonatina']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.qa('f-sonata-q', 'Sonátová forma – otázky', [
        ['V jaké tónině bývá vedlejší téma v expozici skladby v <b>dur</b>?', 'v dominantové tónině', ['v subdominantové tónině', 'v hlavní tónině', 've stejnojmenné moll']],
        ['V jaké tónině bývá vedlejší téma v expozici skladby v <b>moll</b>?', 'v paralelní durové tónině', ['v dominantové moll', 've stejnojmenné dur', 'v subdominantové moll']],
        ['V jaké tónině jsou obě témata v <b>repríze</b>?', 'v hlavní tónině', ['v dominantové tónině', 'každé v jiné', 'v paralelní tónině']],
        ['Která část zpracovává motivy témat a moduluje do vzdálenějších tónin?', 'provedení', ['expozice', 'repríza', 'kóda']],
        ['Jak se nazývá modulační úsek mezi hlavním a vedlejším tématem?', 'převedení', ['provedení', 'kóda', 'závěrečná skupina']],
        ['Která část se v klasické sonátové formě obvykle opakuje (repeticí)?', 'expozice', ['provedení', 'kóda', 'repríza bez provedení']],
        ['Jak se nazývá zjednodušená sonátová forma bez provedení nebo s velmi krátkým provedením?', 'sonatina', ['sonátové rondo', 'suita', 'invence']],
        ['Čím obvykle vrcholí provedení před reprízou?', 'dominantní prodlevou', ['kadencí v subdominantě', 'fugou', 'novým tématem v tónice']],
      ])),
      Ex(F3.terms('f-pojmy6', 'Pojmy', [['expozice', 'představení hlavního a vedlejšího tématu'], ['provedení', 'zpracování témat a modulace'], ['repríza', 'návrat témat, obou v hlavní tónině'], ['kóda', 'závěrečný úsek po repríze'], ['převedení', 'modulační úsek mezi tématy'], ['závěrečná skupina', 'úsek potvrzující tóninu na konci expozice']]))));
  }
});

/* ============ III.7 Polyfonní formy ============ */
const KUBO = (() => {
  // lidová píseň „Bratře Kubo“ (kánon), C dur, 4/4
  const n = (s, o, d) => ({ t: 'n', d, ps: [T.P(s, 0, o)] });
  const n8 = (s, o, beam) => ({ t: 'n', d: '8', ps: [T.P(s, 0, o)], beam });
  const m1 = [n(0, 4, 'q'), n(1, 4, 'q'), n(2, 4, 'q'), n(0, 4, 'q')];
  const m3 = [n(2, 4, 'q'), n(3, 4, 'q'), n(4, 4, 'h')];
  const m5 = [n8(4, 4, 'start'), n8(5, 4, 'end'), n8(4, 4, 'start'), n8(3, 4, 'end'), n(2, 4, 'q'), n(0, 4, 'q')];
  const m7 = [n(0, 4, 'q'), n(4, 3, 'q'), n(0, 4, 'h')];
  const bars = [m1, m1, m3, m3, m5, m5, m7, m7];
  const items = []; bars.forEach((b, i) => { items.push(...b.map(x => ({ ...x }))); items.push({ t: 'b', s: i === 7 ? '|.' : '|' }); });
  const D = { q: 1, h: 2, 8: 0.5 };
  const notes = []; let t = 0; bars.forEach(b => b.forEach(x => { notes.push({ m: T.midi(x.ps[0]), t, d: D[x.d] }); t += D[x.d]; }));
  return { items, notes, len: t };
})();
Chapters.push({
  id: 'f-polyfonie', part: 3, n: 7, title: 'Polyfonní formy', short: 'imitace, kánon, invence, fuga',
  lead: 'V polyfonii jsou všechny hlasy rovnocenné melodie. Formy jsou založené na imitaci: tentýž motiv nebo téma postupně přebírají další hlasy.',
  quizzes: ['f-pojmy7', 'f-fuga-q'],
  render(b) {
    const canon = (() => {
      let voices = 2;
      // dva řádky po čtyřech taktech
      const cut = KUBO.items.reduce((a, it, i) => (it.t === 'b' && ++a.n === 4 && a.i < 0 ? { n: a.n, i } : a), { n: 0, i: -1 }).i + 1;
      const sw = h('div', { class: 'qstaff' });
      sw.append(Staff.draw({ staves: [{ clef: 'g' }], time: [4, 4], items: KUBO.items.slice(0, cut), fit: true, minWidth: 560, scale: 1.3 }));
      sw.append(Staff.draw({ staves: [{ clef: 'g' }], items: KUBO.items.slice(cut), fit: true, minWidth: 560, scale: 1.3, indep: false }));
      const out = h('div', { class: 'wout' });
      const vb = [1, 2, 3, 4].map(v => h('button', { class: 'chip' + (v === voices ? ' on' : ''), onclick: e => { voices = v; vb.forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); } }, `${v} ${v === 1 ? 'hlas' : 'hlasy'}`));
      const play = () => {
        FG.stop(); const beat = 0.5;
        for (let k = 0; k < voices; k++) {
          const off = 8 * k; // nástup po dvou taktech
          KUBO.notes.forEach(x => Snd.note(x.m + (k % 2 ? -12 : 0), 0.1 + (x.t + off) * beat, x.d * beat * 0.92, 0.7));
        }
        out.textContent = voices > 1 ? `Hlasy nastupují po dvou taktech (sudé hlasy o oktávu níž, aby byly slyšet).` : 'Jeden hlas – melodie.';
      };
      return Wid('Kánon: Bratře Kubo (lidová)', sw, h('div', { class: 'wctl' }, ...vb, PlayBtn('Přehrát kánon', play), h('button', { class: 'btn sm ghost', onclick: () => FG.stop() }, '■ Stop')), out);
    })();
    const fugue = h('div', { class: 'fschema' },
      ...[['soprán', ['', '', 'odpověď (comes, D)', 'kontrapunkt', 'mezivěta', 'téma v příbuzné tónině', '…', 'téma (T)']],
        ['alt', ['téma (dux, T)', 'kontrapunkt', 'volný hlas', 'kontrapunkt', 'mezivěta', 'volný hlas', '…', 'volný hlas']],
        ['bas', ['', '', '', 'téma (dux, T)', 'mezivěta', 'volný hlas', '…', 'téma / prodleva']]].map(([v, cells]) => h('div', { class: 'frow' }, h('b', {}, v), ...cells.map(c => h('span', { class: c.startsWith('téma') || c.startsWith('odpověď') ? 'th' : c ? '' : 'emp' }, c)))));
    b.append(Sec('imitace', 'Imitace a kánon',
      P_('<b>Imitace</b> je napodobení motivu nebo tématu v jiném hlase, přesně nebo volněji, od stejného nebo jiného tónu. <b>Kánon</b> je nejpřísnější imitace: druhý hlas opakuje celý první hlas s časovým posunem. Lidové kánony se zpívají v kruhu.'),
      canon));
    b.append(Sec('fuga', 'Invence a fuga',
      P_('<b>Invence</b> (J. S. Bach, 15 dvouhlasých invencí) je imitační skladba, která zpracovává krátký motiv v obou hlasech.'),
      P_('<b>Fuga</b> je vrcholná polyfonní forma. Má jedno hlavní <b>téma</b>, které postupně nastupuje ve všech hlasech:'),
      h('ul', {},
        h('li', { html: '<b>expozice</b>: téma v hlavní tónině (<b>dux</b>), potom odpověď v dominantové tónině (<b>comes</b>), zatímco první hlas pokračuje <b>kontrapunktem</b>,' }),
        h('li', { html: '<b>mezivěty</b>: úseky bez úplného tématu, často sekvence z jeho motivů, modulují,' }),
        h('li', { html: '<b>provedení</b>: nástupy tématu v příbuzných tóninách, <b>stretta</b> (nástupy se překrývají), na konci návrat do hlavní tóniny.' })),
      Fig(fugue, 'Schéma začátku tříhlasé fugy (obecný model, ne konkrétní skladba).'),
      P_('Další polyfonní formy: <b>chorální předehra</b> (zpracování chorální melodie pro varhany), <b>passacaglia</b> a <b>chaconne</b> (ostinátní variace, viz kapitola 4), <b>motet</b> (vokální polyfonie).'),
      F3.listen([['Bach', 'Invence č. 1 C dur BWV 772', ''], ['Bach', 'Dobře temperovaný klavír I, Preludium a fuga c moll BWV 847', 'tříhlasá fuga'], ['Bach', 'Umění fugy BWV 1080', 'cyklus fug a kánonů na jedno téma']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.terms('f-pojmy7', 'Pojmy polyfonie', [['dux', 'téma fugy v hlavní tónině'], ['comes', 'odpověď na téma v dominantové tónině'], ['kontrapunkt', 'protihlas, který doprovází téma'], ['mezivěta', 'úsek fugy bez úplného tématu'], ['stretta', 'nástupy tématu se překrývají'], ['kánon', 'přísná imitace celého hlasu s časovým posunem'], ['invence', 'dvouhlasá imitační skladba (Bach)'], ['imitace', 'napodobení motivu v jiném hlase']])),
      Ex(F3.qa('f-fuga-q', 'Fuga – otázky', [
        ['V jaké tónině nastupuje v expozici fugy odpověď (comes)?', 'v dominantové', ['v subdominantové', 'v paralelní', 'v hlavní']],
        ['Co dělá první hlas, když nastoupí odpověď?', 'pokračuje kontrapunktem', ['pauzuje', 'opakuje téma', 'hraje prodlevu']],
        ['Jak se jmenuje úsek fugy, ve kterém nezazní celé téma?', 'mezivěta', ['expozice', 'stretta', 'kóda']],
        ['Kolik hlasů má invence J. S. Bacha?', 'dva', ['jeden', 'čtyři', 'pět']],
      ]))));
  }
});

/* ============ III.8 Cyklické formy ============ */
const DANCES = {
  menuet: { n: 'menuet', ts: [3, 4], bpm: 120, r: 'q q q | h q | q q q | h.', txt: 'mírný, elegantní, 3/4' },
  sarabanda: { n: 'sarabanda', ts: [3, 4], bpm: 56, r: 'q h | q h | q. 8 q | h.', acc: [1], txt: 'pomalá, vážná, 3/4, důraz často na 2. době' },
  gavota: { n: 'gavota', ts: [4, 4], bpm: 104, r: 'q q | h q q | h q q | h', txt: '4/4 (2/2), začíná dvěma dobami předtaktí' },
  bourree: { n: 'bourrée', ts: [2, 2], bpm: 168, r: 'q | h q q | h q q | h.', txt: 'rychlá, 2/2, začíná čtvrťovým předtaktím' },
  gigue: { n: 'gigue', ts: [6, 8], bpm: 150, r: 'q 8 q 8 | q. q. | q 8 q 8 | q.', txt: 'rychlá, 6/8 nebo 12/8, často imitační' },
  siciliana: { n: 'siciliana', ts: [6, 8], bpm: 72, r: '[8. 16 8] q 8 | [8. 16 8] q.', txt: 'klidná, 6/8, tečkovaný rytmus' },
  polonez: { n: 'polonéza', ts: [3, 4], bpm: 92, r: '[8 16 16] [8 8] [8 8] | [8 16 16] [8 8] q', txt: 'slavnostní, 3/4, typický rytmus na 1. době' },
  mazurka: { n: 'mazurka', ts: [3, 4], bpm: 132, r: '[8. 16] q q | [8. 16] q q', acc: [1, 2], txt: 'polský tanec, 3/4, přízvuky na 2. nebo 3. době' },
};
function danceItems(r) {
  const out = []; let beam = null;
  r.split(' ').forEach(tk => {
    if (tk === '|') { out.push({ t: 'b', s: '|' }); return; }
    let s = tk; let st = false, en = false;
    if (s.startsWith('[')) { st = true; s = s.slice(1); }
    if (s.endsWith(']')) { en = true; s = s.slice(0, -1); }
    const dots = s.endsWith('.') ? 1 : 0; const d = s.replace('.', '');
    const it = { t: 'n', d, dots, ps: [T.P(6, 0, 4)] };
    if (st) { it.beam = 'start'; beam = true; } else if (en) { it.beam = 'end'; beam = null; } else if (beam) it.beam = 'cont';
    out.push(it);
  });
  out.push({ t: 'b', s: '|.' });
  return out;
}
function playDance(k, reps = 2) {
  const D = DANCES[k]; const q = 60 / D.bpm * (D.ts[1] === 2 ? 0.5 : D.ts[1] === 8 ? 1 : 1);
  const barQ = D.ts[0] * 4 / D.ts[1];
  const toks = D.r.split(' ');
  const dur = s => FG.rDur(s.replace('[', '').replace(']', ''));
  // délka předtaktí
  let pre = 0; for (const t of toks) { if (t === '|') break; pre += dur(t); }
  if (pre >= barQ) pre = 0;
  const total = toks.filter(t => t !== '|').reduce((a, t) => a + dur(t), 0);
  FG.stop();
  for (let r = 0; r < reps; r++) {
    let pos = r * total; // v čtvrťových dobách
    toks.forEach(t => {
      if (t === '|') return;
      const inBar = ((pos - pre) % barQ + barQ) % barQ;
      const beatIdx = Math.round(inBar / (D.ts[1] === 8 ? 1.5 : D.ts[1] === 2 ? 2 : 1));
      const strong = Math.abs(inBar) < 1e-6 || (D.acc && D.acc.includes(beatIdx) && Math.abs(inBar - beatIdx * (D.ts[1] === 8 ? 1.5 : 1)) < 1e-6);
      Snd.wood(0.1 + pos * q, strong ? 1 : 0.55);
      pos += dur(t);
    });
  }
}
Chapters.push({
  id: 'f-cykly', part: 3, n: 8, title: 'Cyklické formy', short: 'suita, sonátový cyklus, symfonie, koncert, kvartet',
  lead: 'Cyklus spojuje několik samostatných vět do jednoho díla. Věty se střídají podle tempa a charakteru.',
  quizzes: ['f-tanec', 'f-pojmy8'],
  render(b) {
    const dw = (() => {
      let cur = 'menuet'; const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const draw = () => { const D = DANCES[cur]; sw.innerHTML = ''; sw.append(Staff.draw({ staves: [{ clef: 'perc' }], time: D.ts, items: danceItems(D.r), fit: true, minWidth: 460, scale: 1.3 })); out.innerHTML = `<b>${D.n}</b>: ${D.txt}`; };
      const sel = h('select', { onchange: e => { cur = e.target.value; draw(); playDance(cur); } }, ...Object.entries(DANCES).map(([k, D]) => h('option', { value: k }, D.n)));
      draw();
      return Wid('Charakteristické rytmy tanců', h('div', { class: 'wctl' }, h('label', {}, 'Tanec', sel), PlayBtn('Přehrát rytmus', () => playDance(cur))), sw, out);
    })();
    b.append(Sec('suita', 'Suita',
      P_('<b>Barokní suita</b> je sled stylizovaných tanců ve stejné tónině, většinou v reprízové dvoudílné formě. Jádro tvoří <b>allemande</b> (mírná, 4/4), <b>courante</b> (rychlejší, třídobá), <b>sarabanda</b> (pomalá) a <b>gigue</b> (rychlá). Mezi sarabandu a gigue se vkládají další tance: menuet, gavota, bourrée. Suitu může uvádět preludium.'),
      dw,
      F3.listen([['Bach', 'Suita pro violoncello č. 1 G dur BWV 1007', ''], ['Händel', 'Vodní hudba', 'orchestrální suity']])));
    b.append(Sec('sonata', 'Sonátový cyklus',
      P_('Klasický <b>sonátový cyklus</b> (sonáta, symfonie, koncert, smyčcový kvartet) má obvykle tři nebo čtyři věty:'),
      Tbl(['Věta', 'Tempo a charakter', 'Obvyklá forma'], [['1.', 'rychlá (Allegro), někdy s pomalým úvodem', 'sonátová forma'], ['2.', 'pomalá, zpěvná', 'písňová forma, variace nebo sonátová forma bez provedení'], ['3.', 'menuet nebo scherzo (ve čtyřvětém cyklu)', 'velká písňová forma s triem'], ['4. (finále)', 'rychlá', 'rondo, sonátové rondo nebo sonátová forma']]),
      Tbl(['Druh', 'Obsazení'], [['sonáta', 'jeden nebo dva nástroje (klavír, housle a klavír…)'], ['smyčcový kvartet', 'dvoje housle, viola, violoncello'], ['symfonie', 'orchestr'], ['koncert', 'sólový nástroj a orchestr; obvykle tři věty (bez menuetu), v 1. větě orchestrální ritornel a sólová kadence']]),
      F3.listen([['Dvořák', 'Symfonie č. 9 e moll op. 95 „Z Nového světa“', ''], ['Dvořák', 'Smyčcový kvartet F dur op. 96 „Americký“', ''], ['Mozart', 'Koncert pro klavír a orchestr č. 21 C dur KV 467', '']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'f-tanec', title: 'Poznej tanec podle rytmu', options: [{ key: 'show', label: 'Zadání', values: [[1, 'zápis i poslech'], [0, 'jen poslech']] }],
        gen: o => {
          const k = pick(Object.keys(DANCES)); const D = DANCES[k];
          return {
            html: `Který tanec má tento charakteristický rytmus? ${o.show ? '' : '<span class="mut">(takt se neprozrazuje)</span>'}`,
            staff: o.show ? { staves: [{ clef: 'perc' }], time: D.ts, items: danceItems(D.r), fit: true, minWidth: 420 } : null,
            play: () => playDance(k),
            choices: Object.values(DANCES).map(x => x.n), answer: D.n, explain: `${D.n}: ${D.txt}`,
          };
        }
      }),
      Ex(F3.terms('f-pojmy8', 'Pojmy', [['suita', 'cyklus stylizovaných tanců'], ['allemande', 'mírný čtyřdobý tanec, úvodní tanec suity'], ['courante', 'rychlejší třídobý tanec suity'], ['sarabanda', 'pomalý třídobý tanec s důrazem na 2. době'], ['gigue', 'rychlý závěrečný tanec suity, 6/8 nebo 12/8'], ['ritornel', 'opakující se orchestrální úsek v koncertu'], ['kadence (v koncertu)', 'sólový virtuózní úsek bez orchestru'], ['symfonie', 'sonátový cyklus pro orchestr'], ['smyčcový kvartet', 'dvoje housle, viola a violoncello']]))));
  }
});

/* ============ III.9 Vokální formy ============ */
Chapters.push({
  id: 'f-vokalni', part: 3, n: 9, title: 'Vokální formy', short: 'píseň, árie, recitativ, kantáta, oratorium, mše, opera',
  lead: 'Ve vokální hudbě formu spoluurčuje text: jeho sloky, děj nebo liturgický řád.',
  quizzes: ['f-pisen', 'f-mse', 'f-pojmy9'],
  render(b) {
    b.append(Sec('pisen', 'Píseň',
      Tbl(['Typ písně', 'Popis'], [['strofická', 'všechny sloky na stejnou hudbu (A – A – A); většina lidových písní'], ['variovaná strofická', 'sloky jsou podobné, ale některé se hudebně mění (často poslední)'], ['prokomponovaná', 'hudba sleduje text a průběžně se mění (A – B – C …)'], ['třídílná', 'a – b – a, střední sloka kontrastuje']]),
      F3.player('Vygenerovaná píseň – strofická, nebo prokomponovaná?', () => { const f = pick(['strof', 'prok']); const p = FG.piece(f); return p && { ...p, text: FG.FORMS[f].n }; }),
      F3.listen([['Schubert', 'Pstruh D 550', 'variovaná strofická píseň'], ['Schubert', 'Král duchů D 328', 'prokomponovaná balada']])));
    b.append(Sec('velke', 'Větší vokální formy',
      Tbl(['Forma', 'Popis'], [
        ['recitativ', 'deklamační zpěv sledující řeč; <i>secco</i> jen s doprovodem continua, <i>accompagnato</i> s orchestrem'],
        ['árie', 'lyrický zpěv sólisty s orchestrem; barokní <b>árie da capo</b> má schéma A – B – A s ozdobenou reprízou'],
        ['kantáta', 'vícedílná skladba pro sóla, sbor a nástroje (recitativy, árie, sbory, chorály)'],
        ['oratorium', 'rozsáhlé nescénické dílo pro sóla, sbor a orchestr, většinou na duchovní námět'],
        ['pašije', 'oratorium o utrpení Krista podle evangelia'],
        ['mše', 'zhudebnění ordinaria: Kyrie, Gloria, Credo, Sanctus (s Benedictus), Agnus Dei'],
        ['requiem', 'zádušní mše; má navíc části jako Introitus, Dies irae, Lacrimosa'],
        ['opera', 'scénické hudební drama: předehra, recitativy, árie, ansámbly, sbory'],
      ]),
      F3.listen([['Händel', 'Mesiáš HWV 56', 'oratorium'], ['Bach', 'Matoušovy pašije BWV 244', ''], ['Mozart', 'Requiem d moll KV 626', ''], ['Dvořák', 'Rusalka – Měsíčku na nebi hlubokém', 'árie'], ['Smetana', 'Prodaná nevěsta', 'opera']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex(F3.formQuiz('f-pisen', 'Strofická, nebo prokomponovaná píseň?', ['strof', 'prok', 'aba'], 'Poslechni si „píseň“ (tři sloky) a urči, jak je stavěná.')),
      Ex(F3.qa('f-mse', 'Části mše', [
        ['Která část ordinaria mše je <b>první</b>?', 'Kyrie', ['Gloria', 'Credo', 'Agnus Dei']],
        ['Která část následuje po <b>Kyrie</b>?', 'Gloria', ['Credo', 'Sanctus', 'Agnus Dei']],
        ['Která část následuje po <b>Gloria</b>?', 'Credo', ['Kyrie', 'Sanctus', 'Benedictus']],
        ['Ke které části patří <b>Benedictus</b>?', 'Sanctus', ['Gloria', 'Credo', 'Agnus Dei']],
        ['Která část ordinaria je <b>poslední</b>?', 'Agnus Dei', ['Sanctus', 'Credo', 'Kyrie']],
        ['Jak se nazývá zádušní mše?', 'requiem', ['oratorium', 'kantáta', 'pašije']],
      ])),
      Ex(F3.terms('f-pojmy9', 'Pojmy', [['recitativ', 'deklamační zpěv sledující řeč'], ['árie da capo', 'árie ve formě A – B – A'], ['oratorium', 'nescénické dílo pro sóla, sbor a orchestr'], ['kantáta', 'vícedílná vokálně-instrumentální skladba'], ['strofická píseň', 'všechny sloky na stejnou hudbu'], ['prokomponovaná píseň', 'hudba se průběžně mění podle textu'], ['secco', 'recitativ jen s doprovodem continua']]))));
  }
});

/* ============ III.10 Formy 19. a 20. století ============ */
const ROW = (() => {
  const make = () => shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const forms = {
    P: { n: 'základní tvar (P)', f: r => r.slice() },
    R: { n: 'račí tvar (R)', f: r => r.slice().reverse() },
    I: { n: 'inverze (I)', f: r => r.map(x => ((2 * r[0] - x) % 12 + 12) % 12) },
    RI: { n: 'račí inverze (RI)', f: r => r.map(x => ((2 * r[0] - x) % 12 + 12) % 12).reverse() },
  };
  const items = (r, color) => r.map(pc => ({ t: 'n', d: 'q', ps: [{ ...T.spellMidi(60 + pc), acc: true }], color }));
  const play = (r, t0 = 0) => { r.forEach((pc, i) => Snd.note(60 + pc, t0 + i * 0.32, 0.3, 0.7)); return t0 + r.length * 0.32; };
  return { make, forms, items, play };
})();
Chapters.push({
  id: 'f-moderni', part: 3, n: 10, title: 'Formy 19. a 20. století', short: 'charakteristická skladba, symfonická báseň, dodekafonie, minimalismus',
  lead: 'Romantismus uvolnil klasické formy a spojil hudbu s mimohudebním programem. 20. století hledalo nové principy výstavby.',
  quizzes: ['f-rada', 'f-pojmy10'],
  render(b) {
    b.append(Sec('romantismus', 'Romantismus',
      Tbl(['Forma', 'Popis'], [
        ['charakteristická skladba', 'drobná klavírní skladba s výrazným náladovým charakterem: nokturno, impromptu, píseň beze slov, balada, intermezzo'],
        ['cyklus miniatur', 'řada drobných skladeb spojených myšlenkou nebo programem'],
        ['symfonická báseň', 'jednovětá orchestrální skladba podle mimohudebního programu (příběh, krajina, obraz)'],
        ['programní hudba', 'hudba, která vyjadřuje konkrétní děj nebo představu, obvykle s titulem nebo textem'],
        ['leitmotiv (příznačný motiv)', 'motiv spojený s osobou, předmětem nebo myšlenkou; typický pro Wagnerovy opery'],
      ]),
      F3.listen([['Smetana', 'Má vlast – Vltava', 'symfonická báseň'], ['Liszt', 'Préludes', 'symfonická báseň'], ['Chopin', 'Nokturna op. 9', ''], ['Mendelssohn', 'Písně beze slov', ''], ['Musorgskij', 'Obrázky z výstavy', 'cyklus s promenádou']])));
    const rw = (() => {
      let r = ROW.make(), f = 'P';
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const draw = () => { sw.innerHTML = ''; sw.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 700, scale: 1.1, items: ROW.items(ROW.forms[f].f(r), f === 'P' ? null : 'var(--accent)') })); out.innerHTML = `<b>${ROW.forms[f].n}</b>`; };
      const btns = Object.entries(ROW.forms).map(([k, x]) => h('button', { class: 'chip', onclick: () => { f = k; draw(); ROW.play(ROW.forms[f].f(r)); } }, x.n));
      draw();
      return Wid('Dvanáctitónová řada a její tvary', h('div', { class: 'wctl' }, ...btns, h('button', { class: 'btn sm', onclick: () => { r = ROW.make(); f = 'P'; draw(); } }, 'Nová řada')), sw, out);
    })();
    b.append(Sec('20', '20. století',
      Tbl(['Směr / princip', 'Popis'], [
        ['dodekafonie', 'skladba vychází z řady dvanácti tónů, která se používá v základním tvaru, inverzi, račím tvaru a račí inverzi (Schönberg)'],
        ['neoklasicismus', 'návrat ke klasickým formám (suita, concerto grosso) v moderním jazyce (Stravinskij, Prokofjev)'],
        ['ostinato a gradace', 'forma vzniká opakováním a postupným zesilováním (Ravel: Bolero)'],
        ['aleatorika', 'prvek náhody nebo volby interpreta v uspořádání skladby'],
        ['minimalismus', 'opakování krátkých vzorců, které se pozvolna proměňují (Reich, Glass)'],
      ]),
      rw,
      F3.listen([['Schönberg', 'Suita pro klavír op. 25', 'dodekafonická skladba'], ['Ravel', 'Bolero', 'ostinato a gradace'], ['Janáček', 'Sinfonietta', ''], ['Reich', 'Music for 18 Musicians', 'minimalismus']])));
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'f-rada', title: 'Tvary dvanáctitónové řady', desc: 'Nahoře je základní tvar řady, dole jeho odvozený tvar (od stejného nebo posledního tónu). Urči, který.',
        gen: () => {
          const r = ROW.make(); const k = pick(['R', 'I', 'RI']); const x = ROW.forms[k].f(r);
          return {
            html: 'Který tvar řady je dole?',
            node: (() => { const w = h('div', {}); const a = h('div', { class: 'qstaff' }); a.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 640, items: ROW.items(r) })); const c = h('div', { class: 'qstaff' }); c.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 640, items: ROW.items(x, 'var(--accent)') })); w.append(a, c); return w; })(),
            play: () => { const e = ROW.play(r); ROW.play(x, e + 0.5); },
            choices: ['R', 'I', 'RI'].map(z => ({ label: ROW.forms[z].n, value: z })), answer: k, explain: ROW.forms[k].n + ' (tóny jsou v jedné oktávě, pravopis je enharmonicky zjednodušený)',
          };
        }
      }),
      Ex(F3.terms('f-pojmy10', 'Pojmy', [['symfonická báseň', 'jednovětá orchestrální programní skladba'], ['nokturno', 'snivá „noční“ klavírní skladba'], ['leitmotiv', 'příznačný motiv osoby nebo myšlenky'], ['dodekafonie', 'skladba z řady dvanácti tónů'], ['minimalismus', 'opakování a pozvolná proměna krátkých vzorců'], ['aleatorika', 'prvek náhody ve skladbě'], ['neoklasicismus', 'návrat ke klasickým formám v moderním jazyce']]))));
  }
});
App.EarSets.push(['Hudební formy', [F3.formQuiz('f-forma2', 'Poznej formu – rondo, variace, písňové formy', ['ab', 'aba', 'rondo', 'vari'])]]);
