/* Díl I, kapitola 6: akordy */
'use strict';
const TRI = ['dur', 'moll', 'zv', 'zm'];
const SEPT = ['v7', 'd7', 'm7', 'mv7', 'hz7', 'zm7', 'zv7'];
const chordOK = ps => ps.every(p => p && Math.abs(p.alt) <= 2);
const randRoot = () => { let r; do { r = T.P(rnd(7), pick([-1, 0, 0, 0, 1]), 4); } while (false); return r; };

const AK_Q = {
  sluch: {
    id: 'ak-sluch', title: 'Poznej akord sluchem', desc: 'Odpověz výběrem, nebo akord zahraj (stačí správné tóny v libovolné oktávě).',
    options: [{ key: 'set', label: 'Akordy', values: [['dm', 'dur a moll'], ['tri', 'všechny kvintakordy'], ['sept', 'septakordy'], ['all', 'kvintakordy i septakordy']] }, { key: 'how', label: 'Zahrát', values: [['h', 'současně'], ['a', 'rozloženě'], ['ha', 'rozloženě a pak současně']] }, { key: 'inv', label: 'Obraty', values: [[0, 'jen základní tvar'], [1, 'i obraty']] }],
    gen: o => {
      const set = { dm: ['dur', 'moll'], tri: TRI, sept: ['v7', 'd7', 'm7', 'hz7', 'zm7'], all: [...TRI, 'v7', 'd7', 'm7', 'hz7', 'zm7'] }[o.set];
      const k = pick(set);
      let ps; do { const r = T.P(rnd(7), pick([-1, 0, 0, 1]), 3); ps = T.chord(r, k, o.inv ? rnd(T.CHORDS[k].iv.length) : 0); } while (!chordOK(ps));
      const ms = ps.map(T.midi);
      const play = () => { if (o.how === 'h') Snd.chord(ms, 0, 1.8); else { Snd.melody(ms, 0.4, 0.9); if (o.how === 'ha') Snd.chord(ms, ms.length * 0.4 + 0.2, 1.8); } };
      return { html: 'Jaký akord zazněl?', play, choices: set.map(x => ({ label: T.CHORDS[x].n, value: x })), answer: k, expect: { notes: ms, pc: true, range: [48, 84] }, explain: `${T.CHORDS[k].n}: ${ps.map(p => T.name(p, { oct: false })).join(' – ')}` };
    }
  },
};

Chapters.push({
  id: 'akordy', part: 1, n: 6, title: 'Akordy', short: 'kvintakordy, obraty, septakordy, akordy na stupních',
  lead: 'Souzvuky tří a více tónů stavěné po terciích: čtyři druhy kvintakordů, jejich obraty, septakordy a akordy na stupních stupnice. Tady začíná harmonie.',
  quizzes: ['ak-druh', 'ak-obrat', 'ak-stavba', 'ak-hraj', 'ak-sluch', 'ak-sept'],
  render(b) {
    /* --- stavitel akordů --- */
    const builder = (() => {
      let root = T.P(0, 0, 4), kind = 'dur', inv = 0;
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const pw = h('div', { class: 'qpiano' }); const pi = Piano.create(pw, { from: 48, to: 84 });
      const roots = []; for (let s = 0; s < 7; s++) for (const a of [-1, 0, 1]) roots.push([s, a]);
      const rSel = h('select', { onchange: e => { const [s, a] = e.target.value.split(',').map(Number); root = T.P(s, a, 4); upd(); } }, ...roots.map(([s, a]) => h('option', { value: `${s},${a}`, selected: s === 0 && a === 0 }, T.base(s, a))));
      const kSel = h('select', { onchange: e => { kind = e.target.value; inv = Math.min(inv, T.CHORDS[kind].iv.length - 1); fillInv(); upd(); } }, ...Object.entries(T.CHORDS).map(([k, c]) => h('option', { value: k }, c.n)));
      const iSel = h('select', { onchange: e => { inv = +e.target.value; upd(); } });
      const fillInv = () => { iSel.innerHTML = ''; const n = T.CHORDS[kind].iv.length; const L = n === 3 ? T.INV3 : n === 4 ? T.INV4 : ['základní tvar']; L.forEach((l, i) => iSel.append(h('option', { value: i, selected: i === inv }, l))); };
      fillInv();
      function upd() {
        const ps = T.chord(root, kind, inv);
        sw.innerHTML = '';
        if (!chordOK(ps)) { out.textContent = 'Tento akord by potřeboval trojité posuvky – zvol jiný základní tón.'; return; }
        sw.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 380, scale: 1.5, items: [{ t: 'n', d: 'w', ps }, { t: 'sp', w: 2 }, ...ps.map(p => ({ t: 'n', d: 'q', ps: [p], lab: T.name(p, { oct: false }) }))] }));
        const ivs = ps.slice(1).map((p, i) => T.interval(ps[i], p).abbr);
        const fromBass = ps.slice(1).map(p => T.interval(ps[0], p).abbr);
        const n = ps.length;
        out.innerHTML = `<b>${T.base(root.step, root.alt)} – ${T.CHORDS[kind].n}</b>${T.CHORDS[kind].alt ? ` (${T.CHORDS[kind].alt})` : ''}, ${(n === 3 ? T.INV3 : n === 4 ? T.INV4 : ['základní tvar'])[inv]}<br><span class="mut">tóny: ${ps.map(p => T.name(p, { oct: false })).join(' – ')} · stavba zdola: ${ivs.join(' + ')} · intervaly od basu: ${fromBass.join(', ')}</span>`;
        pi.unmark('mark'); ps.forEach(p => pi.mark(T.midi(p), 'mark'));
        Snd.chord(ps.map(T.midi));
      }
      upd();
      return Wid('Stavitel akordů', h('div', { class: 'wctl' }, h('label', {}, 'Základní tón', rSel), h('label', {}, 'Druh', kSel), h('label', {}, 'Tvar', iSel), PlayBtn('Současně', () => Snd.chord(T.chord(root, kind, inv).map(T.midi))), PlayBtn('Rozloženě', () => Snd.melody(T.chord(root, kind, inv).map(T.midi), 0.35, 0.8))), sw, out, pw);
    })();
    const triFig = h('div', { class: 'qstaff' });
    const c = T.P(0, 0, 4);
    triFig.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 460, items: TRI.map(k => ({ t: 'n', d: 'w', ps: T.chord(c, k), lab: { dur: 'durový', moll: 'mollový', zv: 'zvětšený', zm: 'zmenšený' }[k] })).flatMap(x => [x, { t: 'sp', w: 2 }]) }));
    b.append(Sec('kvintakordy', 'Kvintakordy',
      P_('<b>Akord</b> je souzvuk nejméně tří různých tónů. V tradiční harmonii se akordy stavějí <b>po terciích</b>. Nejjednodušší je <b>kvintakord</b> (trojzvuk): základní tón, tercie a kvinta. Podle druhu tercií jsou čtyři druhy:'),
      Tbl(['Kvintakord', 'Stavba zdola', 'Krajní interval', 'Příklad od c'], [
        ['durový', 'v3 + m3', 'č5', 'c – e – g'], ['mollový', 'm3 + v3', 'č5', 'c – es – g'], ['zvětšený', 'v3 + v3', 'zv5', 'c – e – gis'], ['zmenšený', 'm3 + m3', 'zm5', 'c – es – ges']]),
      Fig(triFig, 'Čtyři druhy kvintakordů od c¹.'),
      h('div', { class: 'row2' }, ...TRI.map(k => PlayBtn({ dur: 'durový', moll: 'mollový', zv: 'zvětšený', zm: 'zmenšený' }[k], () => Snd.chord(T.chord(c, k).map(T.midi))))),
      P_('Durový a mollový kvintakord jsou <b>konsonantní</b> (obsahují jen konsonance). Zvětšený a zmenšený jsou <b>disonantní</b> (zvětšená, resp. zmenšená kvinta).'),
      builder));

    const invFig = h('div', { class: 'qstaff' });
    invFig.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 420, items: [0, 1, 2].flatMap(i => [{ t: 'n', d: 'w', ps: T.chord(c, 'dur', i), lab: ['5 (základní)', '6 (sextakord)', '6/4 (kvartsextakord)'][i] }, { t: 'sp', w: 3 }]) }));
    b.append(Sec('obraty', 'Obraty kvintakordu',
      P_('Když se základní tón přenese o oktávu výš, vznikne <b>obrat</b>. Rozhoduje, který tón akordu je <b>v basu</b> (nejníž):'),
      Tbl(['Tvar', 'V basu', 'Intervaly od basu', 'Značka'], [['kvintakord (základní tvar)', 'základní tón', '3, 5', '5 (nepíše se)'], ['sextakord – 1. obrat', 'tercie', '3, 6', '6'], ['kvartsextakord – 2. obrat', 'kvinta', '4, 6', '6/4']]),
      Fig(invFig, 'C dur kvintakord a jeho obraty.'),
      Box('tip', '<p>Názvy obratů vycházejí z intervalů od basu: sextakord má nad basem sextu, kvartsextakord kvartu a sextu. Podle stejného principu se později čte <b>generálbas</b> (číslovaný bas).</p>')));

    /* --- akordy na stupních --- */
    const degW = (() => {
      let acc = 0, mode = 'dur';
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const kSel = h('select', { onchange: e => { const [a, m] = e.target.value.split(','); acc = +a; mode = m; upd(); } }, ...T.KEYS.filter(k => Math.abs(k.acc) <= 5).map(k => h('option', { value: `${k.acc},${k.mode}`, selected: k.acc === 0 && k.mode === 'dur' }, k.name)));
      const upd = () => {
        const k = T.keyByAcc(acc, mode);
        const t = T.P(k.tonic.step, k.tonic.alt, k.tonic.step >= 4 ? 3 : 4);
        const sc = T.scale(t, mode === 'dur' ? 'dur' : 'harm');
        const items = []; const names = [];
        for (let i = 0; i < 7; i++) {
          const r = sc[i]; const ps = [r, sc[(i + 2) % 7 + (i + 2 >= 7 ? 0 : 0)], sc[(i + 4) % 7]].map((p, j) => { const q = { ...p }; while (T.dia(q) < T.dia(r) + j * 2) q.oct++; return q; });
          const ty = T.identify(ps.map(T.midi)); const kk = Object.entries(T.CHORDS).find(([kx, cx]) => kx === (ty && ty.kind));
          const short = { dur: 'dur', moll: 'moll', zv: 'zv.', zm: 'zm.' }[ty && ty.kind] || '?';
          const rn = ty && ty.kind === 'moll' ? ROM[i].toLowerCase() : ty && ty.kind === 'zm' ? ROM[i].toLowerCase() + '°' : ty && ty.kind === 'zv' ? ROM[i] + '+' : ROM[i];
          items.push({ t: 'n', d: 'w', ps, lab: `${ROM[i]} ${short}` }); names.push(rn);
        }
        sw.innerHTML = '';
        sw.append(Staff.draw({ staves: [{ clef: 'g' }], key: acc, fit: true, minWidth: 600, scale: 1.3, spacing: 4, items }));
        out.innerHTML = mode === 'dur' ? 'V dur: <b>I, IV, V</b> durové · <b>II, III, VI</b> mollové · <b>VII</b> zmenšený' : 'V moll harmonické: <b>I, IV</b> mollové · <b>V, VI</b> durové · <b>II, VII</b> zmenšené · <b>III</b> zvětšený';
        sw._play = () => items.forEach((it, i) => Snd.chord(it.ps.map(T.midi), i * 0.8, 0.75));
      };
      upd();
      return Wid('Kvintakordy na stupních', h('div', { class: 'wctl' }, h('label', {}, 'Tónina', kSel), PlayBtn('Přehrát I–VII', () => sw._play())), sw, out);
    })();
    b.append(Sec('stupne', 'Kvintakordy na stupních stupnice',
      P_('Na každém stupni stupnice můžeme postavit kvintakord jen z tónů dané stupnice. V dur tak vzniknou tři durové, tři mollové a jeden zmenšený kvintakord. Nejdůležitější jsou akordy na <b>I., IV. a V. stupni</b>, tedy <b>tónika (T)</b>, <b>subdominanta (S)</b> a <b>dominanta (D)</b>. Na nich stojí funkční harmonie (Díl II).'),
      degW,
      Box('def', '<p>V moll se pro harmonii používá <b>harmonická</b> mollová stupnice, protože jen se zvýšeným VII. stupněm (citlivým tónem) je dominanta durová a vede přesvědčivě do tóniky.</p>')));

    /* --- septakordy --- */
    const sFig = h('div', { class: 'qstaff' });
    sFig.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 640, spacing: 4.2, items: SEPT.map(k => ({ t: 'n', d: 'w', ps: T.chord(c, k), lab: k })) }));
    const sRows = SEPT.map(k => { const ch = T.CHORDS[k]; const ps = T.chord(c, k); return [ch.n + (ch.alt ? ` <span class="mut">(${ch.alt})</span>` : ''), ps.slice(1).map((p, i) => T.interval(ps[i], p).abbr).join(' + '), ch.iv.slice(1).join(', '), ps.map(p => T.name(p, { oct: false })).join(' – '), `<button class="btn sm icon" data-k="${k}">▶</button>`]; });
    const sTbl = Tbl(['Septakord', 'Stavba', 'Od základu', 'Od c', ''], sRows);
    sTbl.addEventListener('click', e => { const bt = e.target.closest('[data-k]'); if (bt) Snd.chord(T.chord(c, bt.dataset.k).map(T.midi)); });
    const d7inv = h('div', { class: 'qstaff' });
    const g = T.P(4, 0, 3);
    d7inv.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 460, items: [0, 1, 2, 3].flatMap(i => [{ t: 'n', d: 'w', ps: T.chord(T.P(4, 0, 4), 'd7', i), lab: T.INVSIG4[i] }, { t: 'sp', w: 2 }]) }));
    b.append(Sec('septakordy', 'Septakordy a nónové akordy',
      P_('Přidáním další tercie nad kvintakord vznikne <b>septakord</b>: čtyři tóny, mezi krajními je septima. Druh septakordu určuje kvintakord ve spodní části a druh septimy:'),
      Fig(sFig), sTbl,
      P_('Nejdůležitější je <b>dominantní septakord (D7)</b> na V. stupni dur i moll (harmonické): durový kvintakord + malá septima. V C dur je to g – h – d – f.'),
      Tbl(['Tvar', 'V basu', 'Intervaly od basu', 'Značka'], [['septakord (základní)', 'základní tón', '3, 5, 7', '7'], ['kvintsextakord – 1. obrat', 'tercie', '3, 5, 6', '6/5'], ['terckvartakord – 2. obrat', 'kvinta', '3, 4, 6', '4/3'], ['sekundakord – 3. obrat', 'septima', '2, 4, 6', '2']]),
      Fig(d7inv, 'Dominantní septakord v G dur (g – h – d – f) a jeho obraty.'),
      P_('<b>Nónový akord</b> má navíc nonu (pět tónů). V harmonii se používá hlavně dominantní nónový akord, velký (s velkou nonou, v dur) a malý (s malou nonou, typicky v moll).'),
      h('div', { class: 'row2' }, PlayBtn('D9 velký (g)', () => Snd.chord(T.chord(g, 'd9v').map(T.midi))), PlayBtn('D9 malý (g)', () => Snd.chord(T.chord(g, 'd9m').map(T.midi))))));

    /* --- cvičení --- */
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'ak-druh', title: 'Urči druh kvintakordu', options: [{ key: 'inv', label: 'Tvar', values: [[0, 'základní tvar'], [1, 'i obraty']] }],
        gen: o => {
          let ps, k; do { k = pick(TRI); ps = T.chord(randRoot(), k, o.inv ? rnd(3) : 0); } while (!chordOK(ps) || ps.some(p => Math.abs(p.alt) > 1 && k !== 'zm'));
          return { html: 'Jaký je to kvintakord?', staff: { staves: [{ clef: 'g' }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps }], minWidth: 200 }, choices: TRI.map(x => ({ label: T.CHORDS[x].n, value: x })), answer: k, solutionPlay: () => Snd.chord(ps.map(T.midi)), explain: `${ps.map(p => T.name(p, { oct: false })).join(' – ')}: ${T.CHORDS[k].n}` };
        }
      }),
      Ex({
        id: 'ak-obrat', title: 'Základní tvar, nebo obrat?', options: [{ key: 's', label: 'Akordy', values: [[3, 'kvintakordy'], [4, 'septakordy (D7)'], [0, 'obojí']] }],
        gen: o => {
          const n = o.s || pick([3, 4]);
          let ps, inv; do { inv = rnd(n); ps = T.chord(randRoot(), n === 3 ? pick(['dur', 'moll']) : 'd7', inv); } while (!chordOK(ps) || ps.some(p => Math.abs(p.alt) > 1));
          const L = n === 3 ? T.INV3 : T.INV4;
          return { html: 'Jaký je tvar akordu?', staff: { staves: [{ clef: 'g' }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps }], minWidth: 200 }, choices: L, answer: L[inv], solutionPlay: () => Snd.chord(ps.map(T.midi)), explain: `v basu je ${T.name(ps[0], { oct: false })}, intervaly od basu: ${ps.slice(1).map(p => T.interval(ps[0], p).num).join(', ')}` };
        }
      }),
      Ex({
        id: 'ak-stavba', title: 'Postav kvintakord', desc: 'Zapiš akord v základním tvaru v těsné poloze nad daným tónem.',
        options: [{ key: 's', label: 'Druhy', values: [['dm', 'dur a moll'], ['all', 'všechny čtyři']] }],
        gen: o => {
          let r, k, ps; do { r = randRoot(); k = pick(o.s === 'dm' ? ['dur', 'moll'] : TRI); ps = T.chord(r, k); } while (!chordOK(ps) || ps.some(p => Math.abs(p.alt) > 1 && k !== 'zm'));
          return { html: `Postav <b>${T.CHORDS[k].n}</b> od tónu <b>${nameH(r)}</b>.`, write: { clef: 'g', chord: true, target: ps, items: [], hint: 'Klikni postupně tři tóny (první může být základní tón).' }, expect: { notes: ps.map(T.midi), pc: true, range: [52, 84] }, solutionStaff: { staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps }], minWidth: 140 }, solutionPlay: () => Snd.chord(ps.map(T.midi)), explain: ps.map(p => T.name(p, { oct: false })).join(' – ') };
        }
      }),
      Ex({
        id: 'ak-hraj', title: 'Zahraj akord', desc: 'Zahraj akord na klaviatuře nebo MIDI klávesách (oktáva ani obrat nerozhoduje).',
        options: [{ key: 's', label: 'Akordy', values: [['dm', 'durové a mollové kvintakordy'], ['tri', 'všechny kvintakordy'], ['d7', 'dominantní septakordy']] }],
        gen: o => {
          let r, k, ps; do { r = randRoot(); k = o.s === 'd7' ? 'd7' : pick(o.s === 'dm' ? ['dur', 'moll'] : TRI); ps = T.chord(r, k); } while (!chordOK(ps) || ps.some(p => Math.abs(p.alt) > 1));
          const nm = k === 'dur' ? T.cap(T.base(r.step, r.alt)) + ' dur' : k === 'moll' ? T.base(r.step, r.alt) + ' moll' : `${T.base(r.step, r.alt)} – ${T.CHORDS[k].n}`;
          return { html: `Zahraj <b>${nm}</b>${k === 'dur' || k === 'moll' ? ' kvintakord' : ''}.`, expect: { notes: ps.map(T.midi), pc: true, range: [48, 84] }, solutionStaff: { staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps }], minWidth: 140 }, solutionPlay: () => Snd.chord(ps.map(T.midi)), explain: ps.map(p => T.name(p, { oct: false })).join(' – ') };
        }
      }),
      Ex(AK_Q.sluch),
      Ex({
        id: 'ak-sept', title: 'Urči druh septakordu',
        gen: () => {
          let ps, k; do { k = pick(['v7', 'd7', 'm7', 'hz7', 'zm7']); ps = T.chord(randRoot(), k); } while (!chordOK(ps) || ps.filter(p => Math.abs(p.alt) > 1).length > 1);
          return { html: 'Jaký je to septakord?', staff: { staves: [{ clef: 'g' }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps }], minWidth: 200 }, choices: ['v7', 'd7', 'm7', 'hz7', 'zm7'].map(x => ({ label: T.CHORDS[x].n, value: x })), answer: k, solutionPlay: () => Snd.chord(ps.map(T.midi)), explain: `${ps.map(p => T.name(p, { oct: false })).join(' – ')}: ${T.CHORDS[k].n}` };
        }
      })));
  }
});
App.EarSets.push(['Akordy', [AK_Q.sluch]]);
