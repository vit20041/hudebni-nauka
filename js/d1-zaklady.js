/* Díl I, kapitoly 1–3: tón a notový zápis, rytmus a takt, posuvky */
'use strict';
const Wid = (title, ...kids) => h('div', { class: 'wid' }, h('div', { class: 'wt' }, title), ...kids);
const CLEF_NAME = { g: 'houslový', f: 'basový', alt: 'altový', ten: 'tenorový' };
const CLEF_RANGE = { g: [-6, 14], f: [-6, 14], alt: [-5, 13], ten: [-5, 13] };
const posToPitch = (clef, pos, alt = 0) => T.fromDia(Staff.BOTTOM[clef] + pos, alt);
const nameH = p => T.name(p, { html: true });
const uniq = arr => [...new Set(arr)];
/* všechny jiné zápisy stejně znějícího tónu */
const enharm = p => { const r = []; for (let s = 0; s < 7; s++) for (let a = -2; a <= 2; a++) for (let o = p.oct - 1; o <= p.oct + 1; o++) { const q = T.P(s, a, o); if (T.midi(q) === T.midi(p) && !T.eq(q, p)) r.push(q); } return r.sort((x, y) => T.dia(x) - T.dia(y)); };

/* ============ 1. Tón a notový zápis ============ */
Chapters.push({
  id: 'ton', part: 1, n: 1, title: 'Tón a notový zápis', short: 'vlastnosti tónu, osnova, klíče, oktávy',
  lead: 'Co je tón, jak se zapisuje do osnovy, co dělají klíče a jak se v češtině pojmenovávají oktávy.',
  quizzes: ['cteni-g', 'cteni-f', 'cteni-c', 'zapis-ton', 'oktavy'],
  render(b) {
    /* --- vlastnosti tónu --- */
    const harm = (() => {
      const base = T.P(0, 0, 2); // velké C
      const parts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      // tóny alikvotní řady na C (7. a 11. alikvot jsou nižší než temperované b¹ / fis²)
      const ps = [T.P(0, 0, 2), T.P(0, 0, 3), T.P(4, 0, 3), T.P(0, 0, 4), T.P(2, 0, 4), T.P(4, 0, 4), T.P(6, -1, 4), T.P(0, 0, 5), T.P(1, 0, 5), T.P(2, 0, 5)];
      const f0 = T.freq(T.midi(base));
      const out = h('div', { class: 'wout' }, 'Klikni na číslo alikvotu.');
      const svgw = h('div', { class: 'qstaff' });
      const draw = hl => {
        svgw.innerHTML = '';
        svgw.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], fit: true, items: ps.map((p, i) => ({ t: 'n', d: 'w', ps: [{ ...p, st: T.midi(p) >= 60 ? 0 : 1 }], lab: String(i + 1), color: hl === i ? 'var(--accent)' : null })) }));
      };
      draw(-1);
      const ctl = h('div', { class: 'wctl' }, ...parts.map(n => h('button', {
        class: 'chip', onclick: () => {
          draw(n - 1);
          const f = f0 * n; const ctx = Snd.ensure();
          // čistý sinus o přesné frekvenci alikvotu
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
          g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 1.5);
          const tm = T.midi(ps[n - 1]), ft = T.freq(tm);
          const cents = Math.round(1200 * Math.log2(f / ft));
          out.innerHTML = `${n}. alikvot: <b>${f.toFixed(1)} Hz</b> ≈ ${nameH(ps[n - 1])}${Math.abs(cents) > 3 ? ` (oproti temperovanému ladění ${cents > 0 ? '+' : ''}${cents} centů)` : ''}`;
        }
      }, String(n))), PlayBtn('Celá řada', () => { draw(-1); ps.forEach((p, i) => Snd.note(T.midi(p), i * 0.35, 0.5)); }));
      return Wid('Alikvotní řada na velkém C', svgw, ctl, out);
    })();
    b.append(Sec('vlastnosti', 'Tón a jeho vlastnosti',
      P_('<b>Tón</b> je zvuk s pravidelným (periodickým) kmitáním, takže u něj slyšíme určitou výšku. Hluk takovou výšku nemá. Tón má čtyři vlastnosti:'),
      h('ul', {},
        h('li', { html: '<b>výška</b> závisí na kmitočtu (frekvenci). Ladicí tón <b>a¹ = 440 Hz</b> se nazývá komorní a. Tón o oktávu výš má dvojnásobný kmitočet.' }),
        h('li', { html: '<b>délka</b> (trvání) se zapisuje rytmickými hodnotami (kapitola 2),' }),
        h('li', { html: '<b>síla</b> (hlasitost) závisí na rozkmitu a v notách ji vyjadřuje <i>dynamika</i> (p, f…),' }),
        h('li', { html: '<b>barva</b> závisí na zastoupení <i>alikvotních (vyšších harmonických) tónů</i>, které znějí současně se základním tónem. Proto zní a¹ jinak na housle a jinak na klarinet.' })),
      h('div', { class: 'row2' }, PlayBtn('a¹ = 440 Hz', () => Snd.note(69)), PlayBtn('a = 220 Hz', () => Snd.note(57)), PlayBtn('a² = 880 Hz', () => Snd.note(81))),
      P_('Alikvotní tóny mají kmitočty v celočíselných násobcích základního tónu (2×, 3×, 4×…). Jejich řada je základem intervalů i akordů: od 4. do 6. alikvotu tvoří durový kvintakord (c¹–e¹–g¹).'),
      harm,
      Box('pozor', '<p>7. alikvot je výrazně nižší (asi o 31 centů) než temperované b¹. Také 5. alikvot (e¹) je asi o 14 centů nižší. V ukázce zní přesné frekvence alikvotů, ne klavír.</p>')));

    /* --- osnova --- */
    const explorer = (() => {
      let clef = 'g';
      const out = h('div', { class: 'wout' }, 'Najeď myší nebo prstem do osnovy a klikni.');
      const sw = h('div', { class: 'qstaff' });
      const pw = h('div', { class: 'qpiano' });
      let pi = null;
      const pr = () => { pw.innerHTML = ''; pi = Piano.create(pw, { from: 28, to: 96 }); };
      const draw = (mark) => {
        sw.innerHTML = '';
        sw.append(Staff.draw({
          staves: [{ clef }], minWidth: 460, fit: true, scale: 1.7,
          items: mark ? [{ t: 'sp', w: 10 }, { t: 'n', d: 'w', ps: [mark] }] : [],
          interactive: {
            x: 250, hint: true,
            onClick: p => {
              Snd.note(T.midi(p)); draw(p);
              const pos = Staff.posOf(p, clef);
              const where = pos < -1 || pos > 9 ? `${Math.abs(pos < 0 ? Math.floor(pos / 2) : Math.ceil((pos - 8) / 2))}. pomocná ${pos % 2 === 0 ? 'linka' : 'mezera'} ${pos < 0 ? 'pod osnovou' : 'nad osnovou'}`
                : pos === -1 ? 'mezera pod osnovou' : pos === 9 ? 'mezera nad osnovou' : pos % 2 === 0 ? `${pos / 2 + 1}. linka` : `${(pos + 1) / 2}. mezera`;
              out.innerHTML = `<b>${nameH(p)}</b> – ${T.octName(p.oct)} oktáva · ${where} · ${T.freq(T.midi(p)).toFixed(1)} Hz`;
              pi.unmark('mark'); pi.mark(T.midi(p), 'mark');
            }
          }
        }));
      };
      const sel = h('select', { onchange: e => { clef = e.target.value; draw(null); out.textContent = 'Klikni do osnovy.'; } }, ...Object.entries(CLEF_NAME).map(([k, v]) => h('option', { value: k }, v + ' klíč')));
      draw(null); pr();
      return Wid('Průzkumník osnovy', h('div', { class: 'wctl' }, h('label', {}, 'Klíč', sel)), sw, out, pw);
    })();
    b.append(Sec('osnova', 'Notová osnova',
      P_('Výšku tónu zapisujeme do <b>notové osnovy</b>. Má pět vodorovných <b>linek</b> a mezi nimi čtyři <b>mezery</b>. Linky i mezery se počítají <b>zdola nahoru</b>. Tóny mimo osnovu zapisujeme na <b>pomocné linky</b> nad osnovou nebo pod ní.'),
      P_('Nota se skládá z <b>hlavičky</b>, u kratších hodnot také z <b>nožičky</b> (praporce, trámce). Nožička vede u not pod 3. linkou nahoru vpravo, u not od 3. linky výš dolů vlevo.'),
      explorer));

    /* --- klíče --- */
    const fourClefs = h('div', { class: 'qstaff' });
    const c1 = T.P(0, 0, 4);
    fourClefs.append(Staff.draw({ fit: true, staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps: [T.P(4, 0, 4)], lab: 'g¹ na 2. lince' }, { t: 'sp', w: 3 }, { t: 'n', d: 'w', ps: [c1], lab: 'c¹' }] }));
    const fc = h('div', { class: 'qstaff' });
    fc.append(Staff.draw({ fit: true, staves: [{ clef: 'f' }], items: [{ t: 'n', d: 'w', ps: [T.P(3, 0, 3)], lab: 'f na 4. lince' }, { t: 'sp', w: 3 }, { t: 'n', d: 'w', ps: [c1], lab: 'c¹' }] }));
    const ac = h('div', { class: 'qstaff' });
    ac.append(Staff.draw({ fit: true, staves: [{ clef: 'alt' }], items: [{ t: 'n', d: 'w', ps: [c1], lab: 'c¹ na 3. lince' }] }));
    const tc = h('div', { class: 'qstaff' });
    tc.append(Staff.draw({ fit: true, staves: [{ clef: 'ten' }], items: [{ t: 'n', d: 'w', ps: [c1], lab: 'c¹ na 4. lince' }] }));
    const grid4 = h('div', { class: 'clefgrid' },
      h('div', {}, h('h3', {}, 'Houslový (G) klíč'), fourClefs, P_('Určuje tón <b>g¹</b> na 2. lince. Používá se pro vyšší polohy: housle, flétna, pravá ruka klavíru, soprán.')),
      h('div', {}, h('h3', {}, 'Basový (F) klíč'), fc, P_('Určuje tón <b>f</b> (malé) na 4. lince, mezi dvěma tečkami. Používá se pro violoncello, kontrabas, fagot, levou ruku klavíru a bas.')),
      h('div', {}, h('h3', {}, 'Altový (C) klíč'), ac, P_('C klíč určuje <b>c¹</b>. Altový klíč ho má na 3. lince a píše se v něm viola.')),
      h('div', {}, h('h3', {}, 'Tenorový (C) klíč'), tc, P_('Tenorový klíč má c¹ na 4. lince. Používá se pro vyšší polohy violoncella, fagotu a trombonu.')));
    b.append(Sec('klice', 'Klíče',
      P_('Osnova sama výšku neurčuje. Určuje ji teprve <b>klíč</b> na začátku osnovy, který pojmenuje jednu linku a od ní se odvodí ostatní tóny. Na obrázcích je stejný tón <b>c¹</b> zapsaný ve všech čtyřech klíčích.'),
      grid4,
      Box('tip', '<p>V <b>klavírní (velké) osnově</b> se spojují houslová a basová osnova. Tón c¹ leží přesně mezi nimi, na 1. pomocné lince pod houslovou nebo na 1. pomocné lince nad basovou osnovou.</p>')));

    /* --- oktávy --- */
    const octRows = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(o => {
      const c = T.P(0, 0, o), hh = T.P(6, 0, o);
      return [T.cap(T.octName(o)), `${nameH(c)} – ${nameH(hh)}`, o === 0 ? 'na klavíru jen A₂, B₂, H₂' : o === 8 ? 'na klavíru jen c⁵' : o === 4 ? 'c¹ = střední C' : ''];
    });
    const pw = h('div', { class: 'qpiano big' });
    b.append(Sec('oktavy', 'Oktávy a jejich názvy',
      P_('Sedm kmenových tónů <b>c d e f g a h</b> se opakuje v <b>oktávách</b>. Česká hudební nauka označuje oktávy takto (v závorce je zápis):'),
      Tbl(['Oktáva', 'Tóny', 'Poznámka'], octRows),
      P_('Tóny velké, kontra a subkontra oktávy píšeme <b>velkým písmenem</b> (C, C₁, C₂), tóny malé oktávy malým písmenem (c) a čárkované oktávy malým písmenem s číslem nahoře (c¹, c², …). Hranice oktávy je vždy mezi h a c.'),
      Box('pozor', '<p>V angličtině a v MIDI se používá jiné číslování: c¹ = C4, a¹ = A4. Česky ale „C4“ znamená tón c⁴ čtyřčárkované oktávy, tedy o tři oktávy výš!</p>'),
      Fig(pw, 'Celá klaviatura (A₂ – c⁵) s vyznačenými tóny c. Klikni a poslouchej.')));
    Piano.create(pw, { from: 21, to: 108, h: 90 });

    /* --- cvičení --- */
    const readGen = (clefOpt, rng) => {
      const clef = clefOpt === 'mix' ? pick(['g', 'f']) : clefOpt === 'c' ? pick(['alt', 'ten']) : clefOpt;
      const [a, z] = rng === 'in' ? [-2, 10] : CLEF_RANGE[clef];
      const pos = a + rnd(z - a + 1);
      const p = posToPitch(clef, pos);
      const d = T.dia(p);
      const pool = uniq([T.name(T.fromDia(d + 7)), T.name(T.fromDia(d - 7)), T.name(T.fromDia(d + 2)), T.name(T.fromDia(d - 2)), T.name(T.fromDia(d + 1)), T.name(T.fromDia(d - 1))]);
      const correct = T.name(p);
      const lo = posToPitch(clef, CLEF_RANGE[clef][0]), hi = posToPitch(clef, CLEF_RANGE[clef][1]);
      return {
        html: `Jak se jmenuje tón v <b>${CLEF_NAME[clef]}m</b> klíči?`,
        staff: { staves: [{ clef }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps: [p] }], minWidth: 200 },
        choices: makeChoices(correct, pool, 4), answer: correct,
        expect: { notes: [T.midi(p)], range: [T.midi(lo), T.midi(hi)] },
        sing: { notes: [T.midi(p)] },
        explain: `${nameH(p)} (${T.octName(p.oct)} oktáva)`,
        solutionPlay: () => Snd.note(T.midi(p)),
      };
    };
    const rngOpt = { key: 'r', label: 'Rozsah', values: [['in', 'v osnově'], ['ext', 's pomocnými linkami']] };
    b.append(Sec('cviceni', 'Cvičení',
      P_('Odpovídat můžeš výběrem názvu, zahráním na klaviaturu nebo MIDI (oktáva musí sedět), nebo zpěvem (oktáva nezáleží). Způsob přepneš tlačítky nad zadáním.'),
      Ex({ id: 'cteni-g', title: 'Čtení not – houslový klíč', options: [rngOpt], gen: o => readGen('g', o.r) }),
      Ex({ id: 'cteni-f', title: 'Čtení not – basový klíč', options: [rngOpt], gen: o => readGen('f', o.r) }),
      Ex({ id: 'cteni-c', title: 'Čtení not – altový a tenorový klíč', options: [rngOpt], gen: o => readGen('c', o.r) }),
      Ex({
        id: 'zapis-ton', title: 'Zápis tónu do osnovy', desc: 'Klikni na správné místo v osnově.',
        options: [{ key: 'clef', label: 'Klíč', values: [['g', 'houslový'], ['f', 'basový'], ['mix', 'střídavě']] }],
        gen: o => {
          const clef = o.clef === 'mix' ? pick(['g', 'f']) : o.clef;
          const p = posToPitch(clef, -4 + rnd(17));
          return {
            html: `Zapiš tón <b>${nameH(p)}</b> do ${CLEF_NAME[clef].replace('ý', 'ého')} klíče.`,
            write: { clef, target: [p], items: [{ t: 'sp', w: 6 }] },
            explain: `${nameH(p)} – ${T.octName(p.oct)} oktáva`,
            solutionStaff: { staves: [{ clef }], items: [{ t: 'n', d: 'w', ps: [p] }], minWidth: 160 },
          };
        }
      }),
      Ex({
        id: 'oktavy', title: 'Ve které oktávě?', desc: 'Urči, do které oktávy tón patří.',
        gen: () => {
          const clef = pick(['g', 'f']);
          const p = posToPitch(clef, -5 + rnd(19));
          const correct = T.octName(p.oct);
          return {
            html: 'Do které oktávy patří tento tón?',
            staff: { staves: [{ clef }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps: [p] }], minWidth: 200 },
            choices: makeChoices(correct, T.OCT_NAMES.slice(1, 7), 4), answer: correct,
            explain: `${nameH(p)} – ${correct} oktáva`,
          };
        }
      })));
  }
});

/* ============ 2. Rytmus a takt ============ */
const RH = (() => {
  // jedna doba (čtvrťová) a dvoudobé skupiny; s = délka v šestnáctinách
  const B = {
    q: [{ d: 'q', s: 4 }],
    qr: [{ r: 1, d: 'q', s: 4 }],
    '88': [{ d: '8', s: 2, beam: 'start' }, { d: '8', s: 2, beam: 'end' }],
    '8r8': [{ r: 1, d: '8', s: 2 }, { d: '8', s: 2 }],
    '16168': [{ d: '16', s: 1, beam: 'start' }, { d: '16', s: 1, beam: 'cont' }, { d: '8', s: 2, beam: 'end' }],
    '81616': [{ d: '8', s: 2, beam: 'start' }, { d: '16', s: 1, beam: 'cont' }, { d: '16', s: 1, beam: 'end' }],
    '16x4': [{ d: '16', s: 1, beam: 'start' }, { d: '16', s: 1, beam: 'cont' }, { d: '16', s: 1, beam: 'cont' }, { d: '16', s: 1, beam: 'end' }],
    '8.16': [{ d: '8', dots: 1, s: 3, beam: 'start' }, { d: '16', s: 1, beam: 'end' }],
    trip: [{ d: '8', s: 4 / 3, beam: 'start', tup: 'start' }, { d: '8', s: 4 / 3, beam: 'cont' }, { d: '8', s: 4 / 3, beam: 'end', tup: 'end' }],
  };
  const B2 = {
    h: [{ d: 'h', s: 8 }],
    hr: [{ r: 1, d: 'h', s: 8 }],
    'q.8': [{ d: 'q', dots: 1, s: 6 }, { d: '8', s: 2 }],
    '8q8': [{ d: '8', s: 2 }, { d: 'q', s: 4 }, { d: '8', s: 2 }],
  };
  const LV = {
    1: { one: ['q', 'q', 'q', '88', '88', 'qr'], two: ['h', 'h', 'hr'] },
    2: { one: ['q', '88', '88', '16168', '81616', '16x4', '8r8', 'qr'], two: ['h', 'q.8', 'q.8'] },
    3: { one: ['q', '88', '16168', '81616', '16x4', '8.16', '8.16', 'trip', '8r8'], two: ['h', 'q.8', '8q8', '8q8'] },
  };
  function gen(beats, lv) {
    const L = LV[lv]; const g = []; let left = beats;
    while (left > 0) {
      if (left >= 2 && Math.random() < 0.3) { g.push(pick(L.two)); left -= 2; }
      else { g.push(pick(L.one)); left -= 1; }
    }
    // celý takt jen z pomlk nechceme
    if (g.every(x => x === 'qr' || x === 'hr')) g[0] = 'q';
    return g;
  }
  const groupLen = k => (B[k] ? 1 : 2);
  function items(groups) {
    const out = []; let t = 0; const on = [];
    for (const k of groups) for (const e of (B[k] || B2[k])) {
      const it = e.r ? { t: 'r', d: e.d, dots: e.dots } : { t: 'n', d: e.d, dots: e.dots, beam: e.beam, tup: e.tup, ps: [T.P(6, 0, 4)] };
      if (!e.r) on.push(t);
      out.push(it); t += e.s;
    }
    return { items: out, onsets: on, len: t };
  }
  function mutate(groups, lv) {
    const g = groups.slice(); const L = LV[lv];
    for (let k = 0; k < 20; k++) {
      const i = rnd(g.length);
      const pool = groupLen(g[i]) === 1 ? L.one : L.two;
      const n = pick(pool);
      if (n !== g[i]) { g[i] = n; if (!g.every(x => x === 'qr' || x === 'hr')) return g; }
    }
    return gen(groups.reduce((a, x) => a + groupLen(x), 0), lv);
  }
  const key = g => items(g).onsets.map(x => x.toFixed(2)).join(',');
  function draw(groups, beats, opt = {}) {
    const r = items(groups);
    return Staff.draw({ staves: [{ clef: 'perc' }], time: opt.noTime ? null : [beats, 4], items: [...r.items, { t: 'b', s: '|.' }], minWidth: opt.w || 380, fit: true, spacing: opt.spacing });
  }
  /* přehrání: předtaktí (počítání) + rytmus */
  function play(groups, beats, bpm, opt = {}) {
    const r = items(groups); const sp = 60 / bpm / 4; const t0 = 0.15;
    const ci = opt.countIn !== false ? beats : 0;
    for (let i = 0; i < ci; i++) Snd.click(t0 + i * 4 * sp, i === 0);
    const st = t0 + ci * 4 * sp;
    if (opt.metro) for (let i = 0; i < beats; i++) Snd.click(st + i * 4 * sp, i === 0);
    if (!opt.silent) r.onsets.forEach(o => Snd.wood(st + o * sp));
    return { start: st, sp, r };
  }
  return { gen, items, mutate, key, draw, play, B, B2 };
})();

Chapters.push({
  id: 'rytmus', part: 1, n: 2, title: 'Rytmus a takt', short: 'hodnoty not, tečka, takty, trioly, synkopa',
  lead: 'Délky not a pomlk, takt a taktové označení, nepravidelné rytmické skupiny. Rytmy si můžeš pustit i vyťukat.',
  quizzes: ['rt-hodnoty', 'rt-doplnit', 'rt-diktat', 'rt-tap'],
  render(b) {
    /* --- hodnoty --- */
    const rowsDef = [
      ['celá', [{ t: 'n', d: 'w', ps: [T.P(6, 0, 4)] }], [16]],
      ['půlové', [0, 1].map(() => ({ t: 'n', d: 'h', ps: [T.P(6, 0, 4)] })), [8, 8]],
      ['čtvrťové', [0, 1, 2, 3].map(() => ({ t: 'n', d: 'q', ps: [T.P(6, 0, 4)] })), [4, 4, 4, 4]],
      ['osminové', [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: 'n', d: '8', ps: [T.P(6, 0, 4)], beam: i % 2 ? 'end' : 'start' })), Array(8).fill(2)],
      ['šestnáctinové', Array.from({ length: 16 }, (_, i) => ({ t: 'n', d: '16', ps: [T.P(6, 0, 4)], beam: i % 4 === 0 ? 'start' : i % 4 === 3 ? 'end' : 'cont' })), Array(16).fill(1)],
    ];
    const tree = h('div', { class: 'vtree' });
    let bpmV = 72;
    rowsDef.forEach(([n, its, durs]) => {
      const w = h('div', { class: 'qstaff' });
      w.append(Staff.draw({ staves: [{ clef: 'perc' }], clef: false, items: its, minWidth: 620, fit: true }));
      tree.append(h('div', { class: 'vrow' }, h('div', { class: 'vlab' }, h('b', {}, n), PlayBtn('', () => {
        const sp = 60 / bpmV / 4; let t = 0.1;
        for (let i = 0; i < 4; i++) Snd.click(0.1 + i * 4 * sp, i === 0);
        durs.forEach(d => { Snd.wood(t); t += d * sp; });
      }, 'icon')), w));
    });
    const rests = h('div', { class: 'qstaff' });
    rests.append(Staff.draw({ staves: [{ clef: 'g' }], clef: false, items: [{ t: 'r', d: 'w', lab: 'celá' }, { t: 'sp', w: 2 }, { t: 'r', d: 'h', lab: 'půlová' }, { t: 'sp', w: 2 }, { t: 'r', d: 'q', lab: 'čtvrťová' }, { t: 'sp', w: 2 }, { t: 'r', d: '8', lab: 'osminová' }, { t: 'sp', w: 2 }, { t: 'r', d: '16', lab: 'šestnáctinová' }], minWidth: 520, fit: true }));
    b.append(Sec('hodnoty', 'Rytmické hodnoty not a pomlk',
      P_('Délku tónu určuje <b>rytmická hodnota</b>. Každá hodnota trvá polovinu předchozí: celá nota = 2 půlové = 4 čtvrťové = 8 osminových = 16 šestnáctinových. Existují i dvaatřicetinové a čtyřiašedesátinové hodnoty a naopak dvojcelá nota (brevis).'),
      Wid('Dělení celé noty (s počítáním doby)', tree),
      P_('Osminové a kratší noty mají <b>praporec</b>. Když jich jde několik za sebou, spojují se <b>trámcem</b> tak, aby bylo vidět rozdělení na doby.'),
      P_('Každé hodnotě noty odpovídá <b>pomlka</b> stejné délky. Celá pomlka visí pod 4. linkou, půlová leží na 3. lince. Celá pomlka se navíc píše pro <i>celý takt ticha</i> v jakémkoli taktu.'),
      Fig(rests, 'Pomlky: celá, půlová, čtvrťová, osminová, šestnáctinová.')));

    /* --- tečka a ligatura --- */
    const dotFig = h('div', { class: 'qstaff' });
    dotFig.append(Staff.draw({ staves: [{ clef: 'g' }], clef: false, items: [
      { t: 'n', d: 'h', dots: 1, ps: [T.P(0, 0, 5)], lab: '= 3 čtvrtě' }, { t: 'sp', w: 3 },
      { t: 'n', d: 'q', dots: 1, ps: [T.P(0, 0, 5)], lab: '= 3 osminy' }, { t: 'sp', w: 3 },
      { t: 'n', d: 'q', dots: 2, ps: [T.P(0, 0, 5)], lab: '= 7 šestnáctin' }, { t: 'sp', w: 3 },
      { t: 'n', d: 'h', ps: [T.P(4, 0, 4)], tie: true }, { t: 'n', d: 'q', ps: [T.P(4, 0, 4)], lab: '(ligatura) = 3 doby' },
    ], minWidth: 620, fit: true }));
    b.append(Sec('tecka', 'Tečka, dvojtečka, ligatura',
      P_('<b>Tečka</b> za notou prodlužuje její hodnotu o polovinu: půlová s tečkou = půlová + čtvrťová. <b>Dvojtečka</b> přidá ještě polovinu první tečky, tedy celkem tři čtvrtiny původní hodnoty: čtvrťová se dvěma tečkami = čtvrťová + osminová + šestnáctinová.'),
      P_('<b>Ligatura</b> (oblouček) spojuje dvě noty <i>stejné výšky</i>, které se zahrají jako jeden tón se součtem délek. Používá se hlavně přes taktovou čáru. Oblouček mezi notami <i>různé</i> výšky není ligatura, ale <b>legato</b> (vázaně).'),
      Fig(dotFig),
      Tbl(['Hodnota', 'Trvání v šestnáctinách', 'S tečkou', 'Se dvěma tečkami'], [
        ['celá', 16, 24, 28], ['půlová', 8, 12, 14], ['čtvrťová', 4, 6, 7], ['osminová', 2, 3, '3½'], ['šestnáctinová', 1, '1½', '1¾']])));

    /* --- takt --- */
    const metro = (() => {
      const TS = { '2/4': [2, [1, 0]], '3/4': [3, [1, 0, 0]], '4/4': [4, [1, 0, 2, 0]], '3/8': [3, [1, 0, 0]], '6/8': [6, [1, 0, 0, 2, 0, 0]], '9/8': [9, [1, 0, 0, 2, 0, 0, 2, 0, 0]], '12/8': [12, [1, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0]], '2/2': [2, [1, 0]], '5/4': [5, [1, 0, 0, 2, 0]] };
      let ts = '4/4', bpm = 80, timer = 0, beat = 0, nextT = 0;
      const dots = h('div', { class: 'meter' });
      const info = h('p', { class: 'mut' });
      const INFO = {
        '2/4': 'jednoduchý dvoudobý takt: těžká – lehká', '3/4': 'jednoduchý třídobý takt (valčík, menuet)', '4/4': 'čtyřdobý takt: 1. doba těžká, 3. doba polotěžká', '3/8': 'třídobý takt s osminovou dobou, v rychlém tempu se cítí na jednu', '6/8': 'složený takt (2 × 3/8): dvě skupiny po třech osminách, těžká 1. a polotěžká 4. osmina', '9/8': 'složený takt (3 × 3/8)', '12/8': 'složený takt (4 × 3/8)', '2/2': 'alla breve: dvě půlové doby, zapisuje se také ¢', '5/4': 'nepravidelný takt (zde 3 + 2)',
      };
      const render = () => {
        const [n, acc] = TS[ts]; dots.innerHTML = '';
        for (let i = 0; i < n; i++) dots.append(h('span', { class: acc[i] ? 'acc' : '' }, String(i + 1)));
        info.textContent = INFO[ts];
      };
      const tick = () => {
        const ctx = Snd.ensure();
        const [n, acc] = TS[ts];
        const sub = ts.endsWith('/8') ? 2 : ts === '2/2' ? 0.5 : 1;
        const dt = 60 / bpm / sub;
        while (nextT < ctx.currentTime + 0.12) {
          const i = beat % n; const a = acc[i];
          Snd.click(nextT - ctx.currentTime, a === 1);
          const ms = Math.max(0, (nextT - ctx.currentTime) * 1000);
          setTimeout(() => { $$('span', dots).forEach((s, j) => s.classList.toggle('now', j === i)); }, ms);
          nextT += dt; beat++;
        }
      };
      const btn = h('button', { class: 'btn primary', onclick: () => {
        if (timer) { clearInterval(timer); timer = 0; btn.textContent = '▶ Spustit'; $$('span', dots).forEach(s => s.classList.remove('now')); return; }
        const ctx = Snd.ensure(); beat = 0; nextT = ctx.currentTime + 0.1; timer = setInterval(() => { if (!btn.isConnected) { clearInterval(timer); timer = 0; return; } tick(); }, 25); btn.textContent = '■ Zastavit';
      } }, '▶ Spustit');
      const sel = h('select', { onchange: e => { ts = e.target.value; beat = 0; render(); } }, ...Object.keys(TS).map(k => h('option', { value: k, selected: k === ts }, k)));
      const bo = h('b', {}, String(bpm));
      const sl = h('input', { type: 'range', min: 40, max: 200, value: bpm, oninput: e => { bpm = +e.target.value; bo.textContent = bpm; } });
      render();
      return Wid('Metronom s přízvuky', h('div', { class: 'wctl' }, h('label', {}, 'Takt', sel), h('label', {}, h('span', {}, 'Tempo ', bo, ' dob/min'), sl), btn), dots, info);
    })();
    b.append(Sec('takt', 'Takt a taktové označení',
      P_('Pravidelné střídání přízvučných (<b>těžkých</b>) a nepřízvučných (<b>lehkých</b>) dob vytváří <b>takt</b>. V notách ho oddělujeme <b>taktovými čarami</b>. Skladbu končí <b>dvojitá závěrečná čára</b>.'),
      P_('<b>Taktové označení</b> je na začátku skladby za klíčem a předznamenáním. Horní číslo udává počet dob v taktu, dolní hodnotu jedné doby (4 = čtvrťová, 8 = osminová, 2 = půlová). Značka 𝄴 (C) znamená 4/4, přeškrtnuté C znamená 2/2 (alla breve).'),
      h('ul', {},
        h('li', { html: '<b>jednoduché takty</b> mají jednu těžkou dobu: 2/4, 3/4, 3/8, 2/2,' }),
        h('li', { html: '<b>složené takty</b> vznikají spojením jednoduchých: 4/4 (2 × 2/4), 6/8 (2 × 3/8), 9/8, 12/8. Mají kromě těžké doby i <i>polotěžké</i> doby,' }),
        h('li', { html: '<b>nepravidelné (smíšené) takty</b> spojují nestejné skupiny: 5/4 (3+2 nebo 2+3), 7/8 …' })),
      metro,
      P_('Skladba nemusí začínat celým taktem. Neúplný první takt se nazývá <b>předtaktí</b> (začátek „na lehkou dobu“). Poslední takt bývá o hodnotu předtaktí kratší.')));

    /* --- nepravidelné skupiny, synkopa --- */
    const ex = (g, lab) => { const w = h('div', { class: 'rx' }); w.append(RH.draw(g, 4, { w: 340 })); return h('div', {}, w, h('div', { class: 'row2' }, PlayBtn(lab, () => RH.play(g, 4, 76, { metro: true })))); };
    b.append(Sec('skupiny', 'Trioly, synkopa, tempo',
      P_('<b>Triola</b> jsou tři noty hrané v čase dvou stejných hodnot. Osminová triola tedy vyplní jednu čtvrťovou dobu. Podobně <b>duola</b> jsou dvě noty v čase tří (v taktech na 3/8 a 6/8) a <b>kvintola</b> pět not v čase čtyř.'),
      P_('<b>Synkopa</b> vznikne, když přízvuk padne na lehkou dobu nebo její lehkou část. Nota začne na lehké části a trvá přes následující těžkou. Typická synkopa je osminová – čtvrťová – osminová.'),
      h('div', { class: 'rgrid' }, ex(['q', 'trip', 'q', 'trip'], 'trioly'), ex(['8q8', '8q8'], 'synkopy'), ex(['q.8', 'q.8'], 'čtvrťová s tečkou'), ex(['8.16', '8.16', '16x4', 'q'], 'tečkovaný rytmus')),
      P_('<b>Tempo</b> se udává italskými slovy (kapitola 7) nebo metronomicky, například ♩ = 80 znamená 80 čtvrťových dob za minutu.')));

    /* --- cvičení --- */
    const VAL = [['celá', 16], ['půlová s tečkou', 12], ['půlová', 8], ['čtvrťová s tečkou', 6], ['čtvrťová', 4], ['osminová s tečkou', 3], ['osminová', 2], ['šestnáctinová', 1]];
    const VALI = { 16: { d: 'w' }, 12: { d: 'h', dots: 1 }, 8: { d: 'h' }, 6: { d: 'q', dots: 1 }, 4: { d: 'q' }, 3: { d: '8', dots: 1 }, 2: { d: '8' }, 1: { d: '16' } };
    const lvOpt = { key: 'lv', label: 'Obtížnost', values: [[1, 'lehká'], [2, 'střední'], [3, 'těžká (tečky, trioly, synkopy)']] };
    const tsOpt = { key: 'ts', label: 'Takt', values: [[4, '4/4'], [3, '3/4'], [2, '2/4']] };
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'rt-hodnoty', title: 'Počítání hodnot', desc: 'Kolik kratších hodnot se vejde do delší?',
        gen: () => {
          let a, c, n;
          do { a = pick(VAL); c = pick(VAL); n = a[1] / c[1]; } while (!(Number.isInteger(n) && n >= 2 && n <= 16));
          const pl = w => w.replace('celá', 'celých').replace('půlová', 'půlových').replace('čtvrťová', 'čtvrťových').replace('osminová', 'osminových').replace('šestnáctinová', 'šestnáctinových');
          return { html: `Kolik <b>${pl(c[0])}</b> not trvá stejně dlouho jako jedna <b>${a[0]}</b>?`, choices: makeChoices(n, [2, 3, 4, 6, 8, 12, 16].concat([n * 2, n / 2]).filter(Number.isInteger), 4), answer: n, explain: `${a[0]} = ${a[1]} šestnáctin, ${c[0]} = ${c[1]} → ${n}` };
        }
      }),
      Ex({
        id: 'rt-doplnit', title: 'Doplň takt', desc: 'Jakou jedinou hodnotou noty doplníš neúplný takt?',
        gen: () => {
          const tsList = [[2, 4, 8], [3, 4, 12], [4, 4, 16], [3, 8, 6], [6, 8, 12]];
          const [n, d, tot] = pick(tsList);
          const missOpts = VAL.filter(v => v[1] < tot && v[1] !== 16);
          const miss = pick(missOpts);
          let left = tot - miss[1]; const its = [];
          const sizes = [8, 4, 2, 6, 1, 12].filter(s => s <= left);
          while (left > 0) { const cands = [8, 6, 4, 2, 1, 12].filter(s => s <= left && (d === 8 ? s <= 6 : true)); const s = pick(cands.length ? cands : [1]); its.push({ t: 'n', ps: [T.P(6, 0, 4)], ...VALI[s] }); left -= s; }
          const pos = rnd(its.length + 1);
          its.splice(pos, 0, { t: 'sp', w: 3, lab: '?' });
          return {
            html: `Takt <b>${n}/${d}</b>: na místě otazníku chybí jedna nota. Jaká?`,
            staff: { staves: [{ clef: 'perc' }], time: [n, d], items: [...its, { t: 'b', s: '|' }], minWidth: 360, fit: true },
            choices: makeChoices(miss[0], VAL.map(v => v[0]).filter(x => x !== 'celá'), 4), answer: miss[0],
            explain: `takt ${n}/${d} má ${tot} šestnáctin, chybí ${miss[1]} → ${miss[0]}`,
          };
        }
      }),
      Ex({
        id: 'rt-diktat', title: 'Rytmický diktát', desc: 'Po jednom taktu počítání zazní rytmus. Vyber, který zápis mu odpovídá.',
        options: [lvOpt, tsOpt, { key: 'bpm', label: 'Tempo', values: [[60, '60'], [76, '76'], [92, '92'], [108, '108']], def: 76 }],
        gen: o => {
          const g = RH.gen(o.ts, o.lv);
          const keys = new Set([RH.key(g)]); const alts = [];
          let guard = 0;
          while (alts.length < 3 && guard++ < 60) { const m = RH.mutate(g, o.lv); const k = RH.key(m); if (!keys.has(k)) { keys.add(k); alts.push(m); } }
          const opts = shuffle([g, ...alts]);
          return {
            html: 'Který rytmus zazněl?',
            play: () => RH.play(g, o.ts, o.bpm),
            choices: opts.map((x, i) => ({ label: RH.draw(x, o.ts, { w: 300, noTime: true }).outerHTML, value: i })), answer: opts.indexOf(g),
            explain: 'správný zápis je zvýrazněn zeleně',
          };
        }
      }),
      Ex({
        id: 'rt-tap', title: 'Vyťukej rytmus', desc: 'Po stisknutí Start zazní jeden takt počítání, pak ťukej rytmus mezerníkem, kliknutím do pole nebo libovolnou klávesou MIDI. Metronom hraje dál.',
        options: [lvOpt, tsOpt, { key: 'bpm', label: 'Tempo', values: [[60, '60'], [72, '72'], [88, '88'], [100, '100']], def: 72 }],
        gen: o => {
          const g = RH.gen(o.ts, o.lv);
          const r = RH.items(g);
          return {
            html: 'Vyťukej tento rytmus:',
            node: (() => { const w = h('div', { class: 'qstaff' }); w.append(RH.draw(g, o.ts)); return w; })(),
            solutionPlay: () => RH.play(g, o.ts, o.bpm, { metro: true }),
            custom: (host, finish, onClean) => {
              const zone = h('div', { class: 'tapzone', tabindex: 0 }, 'Stiskni Start');
              const res = h('div', { class: 'tapres' });
              let taps = null, t0 = 0, endT = 0, timer = 0;
              const sp = 60 / o.bpm / 4 * 1000;
              const start = h('button', { class: 'btn primary', onclick: () => {
                const ctx = Snd.ensure();
                const p = RH.play(g, o.ts, o.bpm, { metro: true, silent: true });
                const lat = ((ctx.outputLatency || 0) + (ctx.baseLatency || 0)) * 1000;
                t0 = performance.now() + p.start * 1000 + lat; endT = t0 + o.ts * 4 * sp;
                taps = []; res.innerHTML = ''; zone.textContent = 'Počítej… a ťukej';
                start.disabled = true;
                timer = setTimeout(evaluate, endT - performance.now() + 500);
              } }, 'Start');
              const tap = () => {
                if (!taps) return;
                const t = performance.now();
                if (t < t0 - sp * 2) return;
                taps.push(t - t0);
                zone.classList.add('hit'); setTimeout(() => zone.classList.remove('hit'), 80);
              };
              const evaluate = () => {
                const exp = r.onsets.map(x => x * sp);
                const gaps = exp.slice(1).map((x, i) => x - exp[i]);
                const tol = Math.min(110, 0.45 * Math.min(...gaps, 4 * sp));
                const used = new Set(); let good = 0;
                res.innerHTML = '';
                exp.forEach(e => {
                  let bi = -1, bd = 1e9;
                  taps.forEach((t, i) => { if (!used.has(i) && Math.abs(t - e) < bd) { bd = Math.abs(t - e); bi = i; } });
                  const ok = bi >= 0 && bd <= tol;
                  if (ok) { used.add(bi); good++; }
                  const dev = bi >= 0 ? Math.round(taps[bi] - e) : null;
                  res.append(h('span', { class: ok ? 'g' : 'b' }, dev == null ? 'chybí' : (dev > 0 ? '+' : '') + dev + ' ms'));
                });
                const extra = taps.length - used.size;
                if (extra > 0) res.append(h('span', { class: 'b' }, `${extra}× navíc`));
                zone.textContent = `${good}/${exp.length} úderů v toleranci ±${Math.round(tol)} ms`;
                taps = null;
                finish(good === exp.length && extra === 0);
              };
              const key = e => { if (e.code === 'Space' && taps) { e.preventDefault(); tap(); } };
              zone.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
              addEventListener('keydown', key);
              const offB = Bus.on('on', tap);
              onClean(() => { removeEventListener('keydown', key); offB(); clearTimeout(timer); });
              host.append(h('div', { class: 'row2' }, start, h('span', { class: 'hint' }, 'Mezerník = úder. Odchylky se zobrazí v milisekundách.')), zone, res);
            },
            explain: 'kladná odchylka = pozdě, záporná = brzy',
          };
        }
      })));
  }
});

/* ============ 3. Posuvky a enharmonie ============ */
Chapters.push({
  id: 'posuvky', part: 1, n: 3, title: 'Posuvky, enharmonie, půltóny', short: 'křížek, béčko, odrážka, enharmonická záměna',
  lead: 'Jak se zvyšují a snižují tóny, jak se odvozené tóny česky jmenují a proč může mít jedna klávesa víc názvů.',
  quizzes: ['pos-nazev', 'pos-zapis', 'pos-enh', 'pos-pulton'],
  render(b) {
    const accFig = h('div', { class: 'qstaff' });
    accFig.append(Staff.draw({ staves: [{ clef: 'g' }], items: [
      { t: 'n', d: 'w', ps: [T.P(3, 1, 4)], lab: 'fis' }, { t: 'n', d: 'w', ps: [T.P(3, 2, 4)], lab: 'fisis' }, { t: 'n', d: 'w', ps: [T.P(6, -1, 4)], lab: 'b' }, { t: 'n', d: 'w', ps: [T.P(6, -2, 4)], lab: 'heses' }, { t: 'n', d: 'w', ps: [{ ...T.P(6, 0, 4), acc: true }], lab: 'h (odrážka)' }], minWidth: 520, fit: true }));
    const rows = T.STEPS.map((s, i) => [-2, -1, 0, 1, 2].map(a => (a === 0 ? '<b>' : '') + T.base(i, a) + (a === 0 ? '</b>' : '')));
    b.append(Sec('posuvky', 'Posuvky',
      P_('Mezi kmenovými tóny je vzdálenost celého tónu, jen mezi <b>e–f</b> a <b>h–c</b> je půltón (na klaviatuře mezi nimi chybí černá klávesa). <b>Posuvky</b> mění výšku kmenového tónu o půltón nebo o celý tón:'),
      h('ul', {},
        h('li', { html: '<b>křížek ♯</b> zvyšuje o půltón, k názvu se přidá <b>-is</b>: c → cis, f → fis,' }),
        h('li', { html: '<b>béčko ♭</b> snižuje o půltón, přidá se <b>-es</b>: d → des, g → ges. Výjimky jsou <b>e → es</b>, <b>a → as</b> a <b>h → b</b>,' }),
        h('li', { html: '<b>dvojkřížek 𝄪</b> zvyšuje o dva půltóny (cisis, fisis), <b>dvojbéčko 𝄫</b> snižuje o dva (deses, eses, asas, <b>heses</b>),' }),
        h('li', { html: '<b>odrážka ♮</b> ruší platnost posuvky a vrací kmenový tón.' })),
      Fig(accFig),
      Tbl(['dvojbéčko', 'béčko', 'kmenový', 'křížek', 'dvojkřížek'], rows),
      Box('pozor', '<p>Posuvka napsaná přímo před notou (<b>náhodná posuvka</b>) platí do konce taktu pro tón ve stejné výšce (stejné oktávě). Posuvky v <b>předznamenání</b> za klíčem platí po celou skladbu pro všechny oktávy, dokud je nezmění odrážka nebo nové předznamenání.</p>'),
      Box('tip', '<p>Česká a německá praxe: <b>h</b> je kmenový tón, <b>b</b> je h snížené. V angličtině je naopak „B“ náš tón h a „B♭“ naše b.</p>')));

    /* enharmonie – průzkumník */
    const enh = (() => {
      const out = h('div', { class: 'wout' }, 'Klikni na klávesu.');
      const sw = h('div', { class: 'qstaff' });
      const pw = h('div', { class: 'qpiano' });
      Piano.create(pw, { from: 60, to: 83 });
      const off = Bus.on('on', ({ m }) => {
        if (!pw.isConnected) { off(); return; }
        const sp = [];
        for (let s = 0; s < 7; s++) for (let a = -2; a <= 2; a++) {
          for (const o of [3, 4, 5]) { const p = T.P(s, a, o); if (T.midi(p) === m) sp.push(p); }
        }
        sp.sort((x, y) => T.dia(x) - T.dia(y));
        sw.innerHTML = '';
        sw.append(Staff.draw({ staves: [{ clef: 'g' }], items: sp.map(p => ({ t: 'n', d: 'w', ps: [{ ...p, acc: p.alt === 0 ? false : true }], lab: T.name(p) })), minWidth: 300, fit: true }));
        out.innerHTML = `Stejně znějící (enharmonické) názvy: <b>${sp.map(nameH).join(' = ')}</b>`;
      });
      return Wid('Enharmonický průzkumník', pw, out, sw);
    })();
    b.append(Sec('enharmonie', 'Enharmonická záměna',
      P_('V temperovaném ladění je oktáva rozdělena na 12 stejných půltónů. Jedna klávesa proto může mít několik názvů: <b>cis = des</b>, <b>e = fes = disis</b>, <b>h = ces = aisis</b>. Takovým tónům říkáme <b>enharmonicky stejné</b>. Záměna jednoho názvu za druhý je <b>enharmonická záměna</b>.'),
      P_('Který název je správný, záleží na souvislosti (tónině, akordu, směru melodie). V D dur píšeme fis, ne ges, protože každý kmenový tón má ve stupnici zastoupení právě jednou.'),
      enh));

    b.append(Sec('pultony', 'Chromatický a diatonický půltón',
      P_('Půltón může být dvojí:'),
      h('ul', {},
        h('li', { html: '<b>chromatický půltón</b> – mezi tóny se <i>stejným</i> kmenovým názvem: c–cis, e–es, h–b (je to zvětšená prima),' }),
        h('li', { html: '<b>diatonický půltón</b> – mezi <i>sousedními</i> kmenovými tóny: c–des, e–f, h–c (je to malá sekunda).' })),
      h('div', { class: 'row2' }, PlayBtn('c¹–cis¹ (chromatický)', () => Snd.melody([60, 61])), PlayBtn('c¹–des¹ (diatonický)', () => Snd.melody([60, 61])), PlayBtn('celý tón c¹–d¹', () => Snd.melody([60, 62]))),
      P_('Na klavíru znějí oba půltóny stejně. Rozdíl je v zápisu a v hudební funkci: chromatický půltón „zabarvuje“ tentýž stupeň, diatonický vede k sousednímu stupni.')));

    /* cvičení */
    const altPool = () => { const s = rnd(7); let a = pick([-2, -1, -1, 1, 1, 2]); return T.P(s, a, 4 + (s < 2 ? 1 : 0)); };
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'pos-nazev', title: 'Pojmenuj tón s posuvkou',
        gen: () => {
          const p = altPool();
          const correct = T.name(p);
          const pool = uniq([-2, -1, 0, 1, 2].filter(a => a !== p.alt).map(a => T.name(T.P(p.step, a, p.oct))).concat([T.name(T.P((p.step + 1) % 7, p.alt, p.oct + (p.step === 6 ? 1 : 0)))]));
          return {
            html: 'Jak se tón jmenuje?', staff: { staves: [{ clef: 'g' }], items: [{ t: 'sp', w: 1 }, { t: 'n', d: 'w', ps: [p] }], minWidth: 200 },
            choices: makeChoices(correct, pool, 4), answer: correct,
            expect: { notes: [T.midi(p)], range: [55, 89] }, sing: { notes: [T.midi(p)] },
            explain: `${nameH(p)} – zní stejně jako ${enharm(p).map(nameH).join(', ')}`,
          };
        }
      }),
      Ex({
        id: 'pos-zapis', title: 'Zapiš tón s posuvkou', desc: 'Nejprve zvol posuvku, potom klikni do osnovy.',
        gen: () => {
          const p = altPool();
          return { html: `Zapiš tón <b>${nameH(p)}</b>.`, write: { clef: 'g', target: [p], items: [{ t: 'sp', w: 6 }] }, explain: nameH(p), solutionStaff: { staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps: [p] }], minWidth: 160 } };
        }
      }),
      Ex({
        id: 'pos-enh', title: 'Enharmonická záměna', desc: 'Vyber tón, který zní stejně.',
        gen: () => {
          let p, eqs;
          do {
            p = T.P(rnd(7), pick([-1, 0, 1, -1, 1, 2, -2]), 4);
            eqs = [];
            for (let s = 0; s < 7; s++) for (let a = -2; a <= 2; a++) for (const o of [3, 4, 5]) { const q = T.P(s, a, o); if (T.midi(q) === T.midi(p) && q.step !== p.step) eqs.push(q); }
          } while (!eqs.length);
          const c = pick(eqs);
          const wrong = [];
          for (let s = 0; s < 7; s++) for (let a = -2; a <= 2; a++) { const q = T.P(s, a, 4); const d = Math.abs(T.midi(q) - T.midi(p)) % 12; if (d === 1 || d === 2 || d === 11) wrong.push(T.name(q, { oct: false })); }
          const correct = T.name(c, { oct: false });
          return { html: `Který tón zní stejně jako <b>${T.name(p, { oct: false })}</b>?`, choices: makeChoices(correct, uniq(wrong).filter(x => !eqs.map(q => T.name(q, { oct: false })).includes(x)), 4), answer: correct, explain: `${T.name(p, { oct: false })} = ${uniq(eqs.map(q => T.name(q, { oct: false }))).join(' = ')}` };
        }
      }),
      Ex({
        id: 'pos-pulton', title: 'Půltón chromatický, nebo diatonický?',
        gen: () => {
          const p = T.P(rnd(7), pick([-1, 0, 0, 1]), 4);
          const kind = pick(['ch', 'dia', 'cel']);
          const q = kind === 'ch' ? T.up(p, 'zv1') : kind === 'dia' ? T.up(p, 'm2') : T.up(p, 'v2');
          const ans = { ch: 'chromatický půltón', dia: 'diatonický půltón', cel: 'celý tón' }[kind];
          return {
            html: `Co je mezi tóny <b>${nameH(p)}</b> a <b>${nameH(q)}</b>?`,
            staff: { staves: [{ clef: 'g' }], items: [{ t: 'n', d: 'w', ps: [p] }, { t: 'n', d: 'w', ps: [{ ...q, acc: q.alt !== 0 || p.step === q.step ? true : undefined }] }], minWidth: 240 },
            choices: ['chromatický půltón', 'diatonický půltón', 'celý tón'], answer: ans,
            play: null, solutionPlay: () => Snd.melody([T.midi(p), T.midi(q)]),
            explain: kind === 'ch' ? 'stejný kmenový tón → chromatický (zvětšená prima)' : kind === 'dia' ? 'sousední kmenové tóny, vzdálenost 1 půltón → diatonický (malá sekunda)' : 'sousední kmenové tóny, 2 půltóny → velká sekunda',
          };
        }
      })));
  }
});
