/* Díl I, kapitola 4: intervaly */
'use strict';
const IV_SIMPLE = ['č1', 'm2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'm6', 'v6', 'm7', 'v7', 'č8'];
const IV_EAR = ['m2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'č5', 'm6', 'v6', 'm7', 'v7', 'č8'];
const ivLabel = s => s === 'zv4' ? 'zvětšená kvarta (tritón)' : T.ivName(s);
const randBase = (acc) => { const s = rnd(7); const a = acc ? pick([-1, 0, 0, 0, 1]) : 0; return T.P(s, a, 4); };

/* definice cvičení (sdílené se stránkou Sluchová výchova) */
const IV_Q = {
  sluch: {
    id: 'iv-sluch', title: 'Poznej interval sluchem', desc: 'Odpověz výběrem, nebo oba tóny zahraj na klaviatuře.',
    options: [
      { key: 'how', label: 'Způsob', values: [['up', 'melodicky nahoru'], ['down', 'melodicky dolů'], ['harm', 'harmonicky (současně)'], ['mix', 'náhodně']] },
      { key: 'set', label: 'Intervaly', values: [['zakl', 'všechny do oktávy'], ['lehke', 'v2, v3, č4, č5, č8'], ['mv', 'malé a velké (2, 3, 6, 7)'], ['ct', 'čisté a tritón']] },
    ],
    gen: o => {
      const SETS = { zakl: IV_EAR, lehke: ['v2', 'v3', 'č4', 'č5', 'č8'], mv: ['m2', 'v2', 'm3', 'v3', 'm6', 'v6', 'm7', 'v7'], ct: ['č4', 'zv4', 'č5', 'č8'] };
      const set = SETS[o.set];
      const iv = pick(set);
      const how = o.how === 'mix' ? pick(['up', 'down', 'harm']) : o.how;
      let m1 = 52 + rnd(16);
      const semis = T.midi(T.up(T.P(0, 0, 4), iv)) - 60;
      let m2 = how === 'down' ? m1 - semis : m1 + semis;
      const play = () => how === 'harm' ? Snd.chord([m1, m2], 0, 1.8) : Snd.melody([m1, m2], 0.75, 0.7);
      return {
        html: `Jaký interval zazněl? <span class="mut">(${{ up: 'melodicky nahoru', down: 'melodicky dolů', harm: 'harmonicky' }[how]})</span>`,
        play, choices: set.map(s => ({ label: ivLabel(s), value: s })), answer: iv,
        expect: { notes: how === 'down' ? [m1, m2] : [m1, m2], seq: how !== 'harm', range: [36, 84], hint: how === 'harm' ? 'Zahraj oba tóny.' : 'Zahraj oba tóny ve správném pořadí.' },
        explain: `${ivLabel(iv)} (${semis} ${semis === 1 ? 'půltón' : semis < 5 ? 'půltóny' : 'půltónů'}): ${T.name(T.spellMidi(m1))} – ${T.name(T.spellMidi(m2))}`,
      };
    }
  },
};

Chapters.push({
  id: 'intervaly', part: 1, n: 4, title: 'Intervaly', short: 'velikost a druh, obraty, konsonance',
  lead: 'Interval je vzdálenost dvou tónů. Naučíš se ho určit ze zápisu, postavit nahoru i dolů, obrátit a poznat sluchem.',
  quizzes: ['iv-urci', 'iv-stavba', 'iv-sluch', 'iv-zpev', 'iv-obrat', 'iv-kons'],
  render(b) {
    /* --- tabulka --- */
    const c1 = T.P(0, 0, 4);
    const rows = IV_SIMPLE.map(s => {
      const p = T.up(c1, s); const semis = T.midi(p) - 60;
      return [ivLabel(s), `<b>${s}</b>`, semis, `c¹ – ${nameH(p)}`, `<button class="btn sm icon" data-a="${T.midi(p)}">▶</button>`];
    });
    const tbl = Tbl(['Interval', 'Zkratka', 'Půltónů', 'Příklad', ''], rows);
    tbl.addEventListener('click', e => { const bt = e.target.closest('[data-a]'); if (bt) Snd.melody([60, +bt.dataset.a], 0.6); });
    const allFig = h('div', { class: 'qstaff' });
    allFig.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, items: ['č1', 'm2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'č5', 'm6', 'v6', 'm7', 'v7', 'č8'].map(s => ({ t: 'n', d: 'w', ps: [c1, T.up(c1, s)], lab: s })) }));
    b.append(Sec('pojem', 'Velikost a druh intervalu',
      P_('<b>Interval</b> je výškový vztah dvou tónů. Zazní-li tóny po sobě, je interval <b>melodický</b>, zazní-li současně, je <b>harmonický</b>.'),
      P_('Interval má <b>velikost</b> (číslo) a <b>druh</b>. <b>Velikost</b> zjistíš tak, že spočítáš kmenové tóny od spodního po horní včetně obou: c–e = c, d, e = 3 = <b>tercie</b>. Názvy jsou latinské: prima (1), sekunda (2), tercie (3), kvarta (4), kvinta (5), sexta (6), septima (7), oktáva (8), nona (9), decima (10)…'),
      P_('<b>Druh</b> rozliší intervaly stejné velikosti podle počtu půltónů:'),
      h('ul', {},
        h('li', { html: 'primy, kvarty, kvinty a oktávy jsou <b>čisté (č)</b>,' }),
        h('li', { html: 'sekundy, tercie, sexty a septimy jsou <b>velké (v)</b>, nebo <b>malé (m)</b> (o půltón menší),' }),
        h('li', { html: 'když interval o půltón zvětšíme nad čistý nebo velký, je <b>zvětšený (zv)</b>; když ho o půltón zmenšíme pod čistý nebo malý, je <b>zmenšený (zm)</b>,' }),
        h('li', { html: 'vzácně se vyskytují i dvojzvětšené a dvojzmenšené intervaly.' })),
      Fig(allFig, 'Intervaly od c¹. Kliknutím na ▶ v tabulce si je pustíš.'), tbl,
      Box('tip', '<p><b>Tritón</b> je interval tří celých tónů (6 půltónů). Zapisuje se jako zvětšená kvarta (f–h) nebo zmenšená kvinta (h–f¹). Na klavíru znějí oba stejně: jsou <b>enharmonicky stejné</b>. Podobně zní zvětšená sekunda (c–dis) stejně jako malá tercie (c–es).</p>')));

    /* --- postup určování a stavitel --- */
    const builder = (() => {
      let base = T.P(0, 0, 4), iv = 'v3', dir = 1;
      const out = h('div', { class: 'wout' });
      const sw = h('div', { class: 'qstaff' });
      const ivSel = h('select', { onchange: e => { iv = e.target.value; upd(); } }, ...['m2', 'v2', 'zv2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'zv5', 'm6', 'v6', 'zm7', 'm7', 'v7', 'č8', 'm9', 'v9', 'm10', 'v10'].map(s => h('option', { value: s, selected: s === iv }, `${s} – ${T.ivName(s)}`)));
      const dirSel = h('select', { onchange: e => { dir = +e.target.value; upd(); } }, h('option', { value: 1 }, 'nahoru'), h('option', { value: -1 }, 'dolů'));
      const accBtns = h('div', { class: 'wctl' });
      let accSel = 0;
      [[-1, '♭'], [0, '♮'], [1, '♯']].forEach(([a, l]) => accBtns.append(h('button', { class: 'chip' + (a === 0 ? ' on' : ''), onclick: e => { accSel = a; $$('.chip', accBtns).forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
      function upd() {
        const t = T.build(base, T.parseIv(iv).num, T.parseIv(iv).q, dir);
        sw.innerHTML = '';
        sw.append(Staff.draw({
          staves: [{ clef: 'g' }], minWidth: 420, fit: true, scale: 1.6,
          items: t ? [{ t: 'sp', w: 4 }, { t: 'n', d: 'w', ps: [base], lab: T.name(base) }, { t: 'n', d: 'w', ps: [t], color: 'var(--accent)', lab: T.name(t) }, { t: 'n', d: 'w', ps: [base, t] }] : [{ t: 'n', d: 'w', ps: [base] }],
          interactive: { x: 60, hint: true, alt: () => accSel, onClick: p => { base = p; upd(); Snd.note(T.midi(p)); } },
        }));
        if (!t) { out.textContent = 'Tento interval by vyžadoval trojitou posuvku.'; return; }
        const semis = Math.abs(T.midi(t) - T.midi(base));
        out.innerHTML = `${T.ivName(iv)} ${dir > 0 ? 'nahoru' : 'dolů'} od ${nameH(base)} = <b>${nameH(t)}</b> · ${semis} půltónů · ${T.consonance(iv)}`;
        Snd.melody([T.midi(base), T.midi(t)], 0.55);
      }
      upd();
      return Wid('Stavitel intervalů – klikni do levé části osnovy a změň výchozí tón', h('div', { class: 'wctl' }, h('label', {}, 'Interval', ivSel), h('label', {}, 'Směr', dirSel), h('label', {}, 'Posuvka nového tónu', accBtns)), sw, out);
    })();
    b.append(Sec('urcovani', 'Jak interval určit a postavit',
      h('ol', {},
        h('li', { html: '<b>Velikost:</b> spočítej kmenové tóny (posuvky zatím nevnímej). <i>e–c²</i>: e f g a h c = 6 → sexta.' }),
        h('li', { html: '<b>Druh:</b> představ si durovou stupnici od spodního tónu. Všechny její tóny tvoří se základním tónem <b>velké nebo čisté</b> intervaly. Je-li horní tón ve stupnici, je interval velký nebo čistý.' }),
        h('li', { html: '<b>Posuvky:</b> horní tón o půltón níž než ve stupnici → velký se změní na malý, čistý na zmenšený. O půltón výš → zvětšený. E dur má cis², takže e¹–c² je <b>malá sexta</b>.' })),
      Box('pozor', '<p>Při stavbě intervalu nejdřív urči <b>kmenový tón</b> podle velikosti a teprve potom posuvku podle druhu. Malá tercie od d je <b>f</b>, ne eis, i když zní stejně. Eis–d by byla zmenšená sexta.</p>'),
      builder));

    /* --- obraty, složené, konsonance --- */
    const invW = (() => {
      const out = h('div', { class: 'wout' }); const sw = h('div', { class: 'qstaff' });
      const sel = h('select', { onchange: () => upd() }, ...IV_SIMPLE.filter(s => s !== 'č1' && s !== 'č8').map(s => h('option', { value: s }, `${s} – ${T.ivName(s)}`)));
      const upd = () => {
        const s = sel.value; const a = T.P(4, 0, 4); const t = T.up(a, s); const a8 = T.P(a.step, a.alt, a.oct + 1);
        const inv = T.invert(s);
        sw.innerHTML = '';
        sw.append(Staff.draw({ staves: [{ clef: 'g' }], fit: true, minWidth: 360, scale: 1.4, items: [{ t: 'n', d: 'w', ps: [a, t], lab: s }, { t: 'sp', w: 2 }, { t: 'b', s: '|' }, { t: 'sp', w: 2 }, { t: 'n', d: 'w', ps: [t, a8], lab: inv }] }));
        out.innerHTML = `${T.ivName(s)} + ${T.ivName(inv)} = oktáva (${s.replace(/\D/g, '')} + ${inv.replace(/\D/g, '')} = 9)`;
      };
      upd();
      return Wid('Obrat intervalu', h('div', { class: 'wctl' }, h('label', {}, 'Interval', sel), PlayBtn('Přehrát oba', () => { const s = sel.value; const a = T.P(4, 0, 4), t = T.up(a, s); Snd.chord([T.midi(a), T.midi(t)], 0, 1.2); Snd.chord([T.midi(t), T.midi(a) + 12], 1.4, 1.2); })), sw, out);
    })();
    b.append(Sec('obraty', 'Obraty a složené intervaly',
      P_('<b>Obrat</b> intervalu vznikne, když spodní tón přeneseme o oktávu výš (nebo horní o oktávu níž). Pro obrat platí:'),
      h('ul', {}, h('li', { html: 'součet velikostí intervalu a obratu je <b>9</b> (tercie ↔ sexta, sekunda ↔ septima, kvarta ↔ kvinta),' }), h('li', { html: 'velký ↔ malý, zvětšený ↔ zmenšený, čistý zůstává čistý.' })),
      invW,
      P_('Intervaly větší než oktáva jsou <b>složené</b>: nona (oktáva + sekunda), decima (+ tercie), undecima (+ kvarta), duodecima (+ kvinta), tercdecima (+ sexta), kvartdecima (+ septima), kvintdecima (dvě oktávy). Druh mají stejný jako odpovídající jednoduchý interval: velká nona = oktáva + velká sekunda.')));
    b.append(Sec('konsonance', 'Konsonance a disonance',
      Tbl(['Skupina', 'Intervaly', 'Charakter'], [
        ['dokonalé konsonance', 'č1, č8, č5', 'nejvíce splývají'],
        ['nedokonalé konsonance', 'v3, m3, v6, m6', 'libozvučné, plné'],
        ['čistá kvarta', 'č4', 'melodicky konsonance, v harmonii nad basem disonance'],
        ['disonance', 'v2, m2, v7, m7, všechny zvětšené a zmenšené', 'napětí, potřeba rozvodu'],
      ]),
      h('div', { class: 'row2' }, PlayBtn('č5', () => Snd.chord([60, 67])), PlayBtn('v3', () => Snd.chord([60, 64])), PlayBtn('m6', () => Snd.chord([64, 72])), PlayBtn('č4', () => Snd.chord([60, 65])), PlayBtn('m2', () => Snd.chord([64, 65])), PlayBtn('v7', () => Snd.chord([60, 71])), PlayBtn('zv4', () => Snd.chord([65, 71])))));

    /* --- cvičení --- */
    const qUrci = {
      id: 'iv-urci', title: 'Urči interval ze zápisu',
      options: [{ key: 'acc', label: 'Tóny', values: [[0, 'jen kmenové'], [1, 's posuvkami']] }, { key: 'shape', label: 'Zápis', values: [['h', 'harmonicky'], ['m', 'melodicky']] }],
      gen: o => {
        let a, t, s;
        do {
          a = randBase(o.acc);
          s = pick(o.acc ? ['m2', 'v2', 'zv2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'zv5', 'm6', 'v6', 'zm7', 'm7', 'v7', 'č8'] : ['m2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'm6', 'v6', 'm7', 'v7', 'č8']);
          t = T.up(a, s);
        } while (!t || (o.acc ? Math.abs(t.alt) > 1 : t.alt !== 0));
        const x = T.parseIv(s);
        const pool = uniq([...['v', 'm', 'č', 'zv', 'zm'].map(q => q + x.num), ...['v', 'm', 'č'].map(q => q + (x.num + 1)), ...['v', 'm', 'č'].map(q => q + (x.num - 1))]).filter(k => { const y = T.parseIv(k); return y && y.num >= 1 && y.num <= 8 && T.qualFromDelta !== 0 && ((T.isPerf(y.num) ? ['č', 'zv', 'zm'] : ['v', 'm', 'zv', 'zm']).includes(y.q)); });
        const ch = makeChoices(s, pool, 6);
        return {
          html: 'Jaký je to interval?',
          staff: { staves: [{ clef: 'g' }], items: o.shape === 'h' ? [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps: [a, t] }] : [{ t: 'n', d: 'w', ps: [a] }, { t: 'n', d: 'w', ps: [t] }], minWidth: 220 },
          choices: ch.map(k => ({ label: T.ivName(k), value: k })), answer: s,
          solutionPlay: () => Snd.melody([T.midi(a), T.midi(t)]),
          explain: `${nameH(a)} – ${nameH(t)} = ${T.ivName(s)} (${T.midi(t) - T.midi(a)} půltónů)`,
        };
      }
    };
    const qStavba = {
      id: 'iv-stavba', title: 'Postav interval', desc: 'Zapiš horní (nebo dolní) tón do osnovy. Na klaviatuře stačí zahrát správnou klávesu (enharmonicky stejný tón se počítá).',
      options: [{ key: 'dir', label: 'Směr', values: [[1, 'nahoru'], [-1, 'dolů'], [0, 'náhodně']] }],
      gen: o => {
        let a, t, s, dir;
        do { dir = o.dir || pick([1, -1]); a = randBase(true); a.oct = dir > 0 ? 4 : 5; s = pick(['m2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'm6', 'v6', 'm7', 'v7', 'č8']); t = T.build(a, T.parseIv(s).num, T.parseIv(s).q, dir); } while (!t || Math.abs(t.alt) > 1);
        return {
          html: `Postav <b>${T.ivAcc(s)}</b> ${dir > 0 ? 'nahoru' : 'dolů'} od tónu <b>${nameH(a)}</b>.`,
          write: { clef: 'g', target: [t], items: [{ t: 'n', d: 'w', ps: [a] }, { t: 'sp', w: 4 }] },
          expect: { notes: [T.midi(t)], range: [52, 88] },
          solutionStaff: { staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps: [a, t] }], minWidth: 160 },
          solutionPlay: () => Snd.melody([T.midi(a), T.midi(t)]),
          explain: `${nameH(a)} → ${nameH(t)}`,
        };
      }
    };
    const qZpev = {
      id: 'iv-zpev', title: 'Zazpívej interval', desc: 'Zazní výchozí tón. Zazpívej ho a potom požadovaný interval nahoru. Potřebuješ mikrofon.',
      options: [{ key: 'set', label: 'Intervaly', values: [['lehke', 'v2, v3, č4, č5, č8'], ['all', 'všechny do oktávy']] }],
      gen: o => {
        const s = pick(o.set === 'lehke' ? ['v2', 'v3', 'č4', 'č5', 'č8'] : IV_EAR.filter(x => x !== 'zv4'));
        const m1 = 55 + rnd(8); const m2 = m1 + T.midi(T.up(T.P(0, 0, 4), s)) - 60;
        return {
          html: `Zazpívej <b>${T.ivAcc(s)}</b> nahoru od zahraného tónu.`,
          play: () => Snd.note(m1, 0, 1.5),
          sing: { notes: [m1, m2], labels: ['výchozí tón', T.ivName(s)], hint: 'Zazpívej nejdřív výchozí tón, potom cílový. Každý chvíli podrž. Oktáva nezáleží.' },
          solutionPlay: () => Snd.melody([m1, m2], 0.8),
          explain: `${T.name(T.spellMidi(m1))} → ${T.name(T.spellMidi(m2))}`,
        };
      }
    };
    const qObrat = {
      id: 'iv-obrat', title: 'Obrat intervalu',
      gen: () => {
        const s = pick(['m2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'm6', 'v6', 'm7', 'v7', 'zv2', 'zm7']);
        const c = T.invert(s);
        const pool = ['m2', 'v2', 'm3', 'v3', 'č4', 'zv4', 'zm5', 'č5', 'm6', 'v6', 'm7', 'v7', 'zv2', 'zm7', 'zv5', 'zm4'];
        return { html: `Co vznikne obratem intervalu <b>${T.ivName(s)}</b>?`, choices: makeChoices(c, pool, 4).map(k => ({ label: T.ivName(k), value: k })), answer: c, explain: `${T.ivName(s)} ↔ ${T.ivName(c)}` };
      }
    };
    const qKons = {
      id: 'iv-kons', title: 'Konsonance, nebo disonance?',
      gen: () => {
        const s = pick(['č1', 'č8', 'č5', 'v3', 'm3', 'v6', 'm6', 'v2', 'm2', 'v7', 'm7', 'zv4', 'zm5', 'zv2', 'zm7']);
        const c = T.consonance(s);
        return { html: `<b>${T.ivName(s)}</b> je…`, choices: ['dokonalá konsonance', 'nedokonalá konsonance', 'disonance'], answer: c, solutionPlay: () => { const a = T.P(0, 0, 4), t = T.up(a, s); Snd.chord([T.midi(a), T.midi(t)]); }, explain: c };
      }
    };
    b.append(Sec('cviceni', 'Cvičení', Ex(qUrci), Ex(qStavba), Ex(IV_Q.sluch), Ex(qZpev), Ex(qObrat), Ex(qKons)));
    IV_Q.zpev = qZpev;
  }
});
App.EarSets.push(['Intervaly', [IV_Q.sluch]]);
