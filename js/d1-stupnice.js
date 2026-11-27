/* Díl I, kapitola 5: stupnice a tóniny */
'use strict';
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const stepTxt = s => ({ 1: '½', 2: '1', 3: '1½', 4: '2' }[s] || s);
const keyOf = (tonic, kind) => {
  // předznamenání durové / mollové tóniny s danou tónikou (null, pokud neexistuje do 7 posuvek)
  const mode = kind === 'dur' || ['lyd', 'mix'].includes(kind) ? 'dur' : 'moll';
  const k = T.KEYS.find(k => k.mode === mode && k.tonic.step === tonic.step && k.tonic.alt === tonic.alt);
  return k ? k.acc : null;
};
const scaleStaff = (tonic, kind, o = {}) => {
  const up = T.scale(tonic, kind);
  const dn = o.down ? T.scaleDown(tonic, kind).slice(1).map(p => { const u = up.find(q => q.step === p.step); return u && u.alt !== p.alt ? { ...p, acc: true } : p; }) : [];
  const key = o.key ? (keyOf(tonic, kind) ?? 0) : 0;
  const items = [...up, ...dn].map((p, i) => ({ t: 'n', d: 'w', ps: [{ ...p }], lab: o.labs ? (i < up.length ? ROM[i] : ROM[up.length - 2 - (i - up.length)]) : undefined, color: o.hl && o.hl.includes(i) ? 'var(--accent)' : undefined }));
  if (o.down) items.splice(up.length, 0, { t: 'b', s: '|' });
  return Staff.draw({ staves: [{ clef: o.clef || 'g' }], key, items, fit: true, minWidth: o.w || 520, scale: o.scale || 1.3, spacing: 2.9 });
};

const ST_Q = {
  sluch: {
    id: 'st-sluch', title: 'Poznej stupnici sluchem',
    options: [{ key: 'set', label: 'Stupnice', values: [['dm', 'dur a tři druhy mollu'], ['mod', 'církevní módy'], ['all', 'vše']] }],
    gen: o => {
      const SET = { dm: ['dur', 'aiol', 'harm', 'mel'], mod: ['dur', 'dor', 'fryg', 'lyd', 'mix', 'aiol', 'lokr'], all: ['dur', 'aiol', 'harm', 'mel', 'dor', 'fryg', 'lyd', 'mix', 'lokr', 'pent', 'celo'] }[o.set];
      const kind = pick(SET);
      const tonic = T.P(rnd(7), 0, 4); if (tonic.step >= 4) tonic.oct = 3;
      const up = T.scale(tonic, kind).map(T.midi);
      const play = () => Snd.melody(kind === 'mel' ? [...up, ...T.scaleDown(tonic, kind).slice(1).map(T.midi)] : up, 0.36, 0.34);
      const lab = k => k === 'dur' && o.set === 'mod' ? 'jónská (dur)' : k === 'aiol' && o.set === 'mod' ? 'aiolská (moll)' : T.SCALES[k].n;
      return { html: 'Jaká stupnice zazněla?' + (kind === 'mel' || o.set !== 'mod' ? ' <span class="mut">(nahoru, u melodické mollové i dolů)</span>' : ''), play, choices: SET.map(k => ({ label: lab(k), value: k })), answer: kind, explain: `${lab(kind)} od ${nameH(tonic)}` };
    }
  },
};

Chapters.push({
  id: 'stupnice', part: 1, n: 5, title: 'Stupnice a tóniny', short: 'dur, moll, předznamenání, kvintový kruh, módy',
  lead: 'Stavba durové a mollových stupnic, předznamenání, kvintový kruh a příbuznost tónin, církevní módy a další stupnice.',
  quizzes: ['st-predzn', 'st-posuvky', 'st-zapis', 'st-sluch', 'st-pribuzne', 'st-zpev'],
  render(b) {
    /* --- stavitel stupnic --- */
    const builder = (() => {
      const TONICS = [];
      for (const k of T.KEYS) if (!TONICS.some(t => t.step === k.tonic.step && t.alt === k.tonic.alt)) TONICS.push({ step: k.tonic.step, alt: k.tonic.alt });
      TONICS.sort((a, b) => (a.step * 5 + a.alt) - (b.step * 5 + b.alt));
      let tonic = T.P(0, 0, 4), kind = 'dur', withKey = false;
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      const pw = h('div', { class: 'qpiano' }); const pi = Piano.create(pw, { from: 48, to: 84 });
      const tSel = h('select', { onchange: e => { const [s, a] = e.target.value.split(',').map(Number); tonic = T.P(s, a, s >= 5 ? 3 : 4); upd(); } }, ...TONICS.map(t => h('option', { value: `${t.step},${t.alt}`, selected: t.step === 0 && t.alt === 0 }, T.base(t.step, t.alt))));
      const kSel = h('select', { onchange: e => { kind = e.target.value; upd(); } }, ...Object.entries(T.SCALES).map(([k, s]) => h('option', { value: k }, s.n)));
      const kChk = h('label', { class: 'chk' }, h('input', { type: 'checkbox', onchange: e => { withKey = e.target.checked; upd(); } }), 'zapsat s předznamenáním');
      function upd() {
        sw.innerHTML = '';
        const s = T.scale(tonic, kind);
        if (s.some(p => !p || Math.abs(p.alt) > 2)) { out.textContent = 'Tato stupnice by potřebovala trojité posuvky.'; return; }
        const down = kind === 'mel';
        sw.append(scaleStaff(tonic, kind, { key: withKey && ['dur', 'aiol', 'harm', 'mel'].includes(kind), down, labs: true, w: down ? 760 : 520 }));
        const steps = s.slice(1).map((p, i) => stepTxt(T.midi(p) - T.midi(s[i])));
        const k = keyOf(tonic, kind);
        out.innerHTML = `${T.SCALES[kind].n} od ${T.base(tonic.step, tonic.alt)}: <b>${s.map(p => T.name(p, { oct: false })).join(' ')}</b><br><span class="mut">kroky: ${steps.join(' – ')}${['dur', 'aiol', 'harm', 'mel'].includes(kind) ? ` · tónina ${k == null ? 'v praxi nepoužívaná (víc než 7 posuvek)' : T.accText(k)}` : ''}</span>`;
        pi.unmark('mark'); s.forEach(p => pi.mark(T.midi(p), 'mark'));
      }
      upd();
      const play = () => { const s = T.scale(tonic, kind).map(T.midi); const d = kind === 'mel' ? T.scaleDown(tonic, kind).slice(1).map(T.midi) : s.slice(0, -1).reverse(); Snd.melody([...s, ...d], 0.32, 0.3); };
      return Wid('Stavitel stupnic', h('div', { class: 'wctl' }, h('label', {}, 'Základní tón', tSel), h('label', {}, 'Druh', kSel), kChk, PlayBtn('Přehrát nahoru a dolů', play)), sw, out, pw);
    })();
    b.append(Sec('dur', 'Durová stupnice',
      P_('<b>Stupnice</b> je řada tónů uspořádaná podle výšky od základního tónu (<b>tóniky</b>) k jeho oktávě. Tóny stupnice jsou její <b>stupně</b>, označované římskými číslicemi I–VII. Diatonické stupnice obsahují každý kmenový tón právě jednou.'),
      P_('<b>Durová stupnice</b> má půltóny mezi <b>III.–IV.</b> a <b>VII.–VIII.</b> stupněm, ostatní kroky jsou celé tóny: <b>1 – 1 – ½ – 1 – 1 – 1 – ½</b>. Skládá se ze dvou stejně stavěných <b>tetrachordů</b> (1 – 1 – ½) spojených celým tónem. Vzorem je C dur bez posuvek.'),
      builder,
      Box('tip', '<p>Horní tetrachord jedné durové stupnice je dolním tetrachordem durové stupnice o kvintu výš. Tak vzniká řada tónin s přibývajícími křížky: C → G → D → A …</p>')));

    /* --- moll --- */
    const minors = h('div', {});
    [['aiol', 'Aiolská (přirozená)', []], ['harm', 'Harmonická – zvýšený VII. stupeň', [6]], ['mel', 'Melodická – nahoru zvýšený VI. a VII., dolů aiolská', [5, 6]]].forEach(([k, n, hl]) => {
      const w = h('div', { class: 'qstaff' }); w.append(scaleStaff(T.P(5, 0, 3), k, { key: true, down: k === 'mel', labs: true, hl, w: k === 'mel' ? 760 : 520 }));
      minors.append(h('h3', {}, n), w, h('div', { class: 'row2' }, PlayBtn('Přehrát a moll', () => { const t = T.P(5, 0, 3); Snd.melody([...T.scale(t, k).map(T.midi), ...T.scaleDown(t, k).slice(1).map(T.midi)], 0.32, 0.3); })));
    });
    b.append(Sec('moll', 'Mollové stupnice',
      P_('Mollová stupnice má malou tercii nad tónikou. Rozlišujeme tři druhy:'),
      h('ul', {},
        h('li', { html: '<b>aiolská (přirozená)</b>: půltóny mezi II.–III. a V.–VI. stupněm, kroky 1 – ½ – 1 – 1 – ½ – 1 – 1,' }),
        h('li', { html: '<b>harmonická</b>: zvýšený VII. stupeň, který vytvoří <i>citlivý tón</i> půltón pod tónikou. Mezi VI. a VII. stupněm je <b>zvětšená sekunda</b> (1½),' }),
        h('li', { html: '<b>melodická</b>: vzestupně zvýšený VI. i VII. stupeň (odstraní zvětšenou sekundu), sestupně se vrací aiolská podoba.' })),
      minors,
      Box('pozor', '<p>Zvýšené stupně v harmonické a melodické mollové stupnici se <b>nepíšou do předznamenání</b>, píšou se jako náhodné posuvky přímo před notou (v a moll gis, fis).</p>')));

    /* --- předznamenání a kvintový kruh --- */
    const circle = (() => {
      const MAJ = ['C', 'G', 'D', 'A', 'E', 'H', 'Fis / Ges', 'Des', 'As', 'Es', 'B', 'F'];
      const MIN = ['a', 'e', 'h', 'fis', 'cis', 'gis', 'dis / es', 'b', 'f', 'c', 'g', 'd'];
      const ACC = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1];
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-210 -210 420 420');
      const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
      const arc = (r1, r2, a1, a2) => { const p = (r, a) => `${r * Math.sin(a)} ${-r * Math.cos(a)}`; return `M${p(r1, a1)}L${p(r2, a1)}A${r2} ${r2} 0 0 1 ${p(r2, a2)}L${p(r1, a2)}A${r1} ${r1} 0 0 0 ${p(r1, a1)}Z`; };
      const sw = h('div', { class: 'qstaff' }); const out = h('div', { class: 'wout' });
      let cur = 0, gesToggle = false;
      const segs = [];
      for (let i = 0; i < 12; i++) {
        const a1 = (i - 0.5) * Math.PI / 6, a2 = (i + 0.5) * Math.PI / 6, am = i * Math.PI / 6;
        const g = mk('g', { class: 'seg' });
        g.append(mk('path', { d: arc(62, 200, a1, a2) }));
        const t1 = mk('text', { x: 165 * Math.sin(am), y: -165 * Math.cos(am) + 5, 'text-anchor': 'middle' }); t1.textContent = MAJ[i];
        const t2 = mk('text', { x: 112 * Math.sin(am), y: -112 * Math.cos(am) + 5, 'text-anchor': 'middle', class: 'mi' }); t2.textContent = MIN[i];
        const t3 = mk('text', { x: 80 * Math.sin(am), y: -80 * Math.cos(am) + 4, 'text-anchor': 'middle', class: 'ac' }); t3.textContent = ACC[i] === 0 ? '0' : ACC[i] === 6 ? '6♯/6♭' : ACC[i] > 0 ? ACC[i] + '♯' : -ACC[i] + '♭';
        g.append(t1, t2, t3);
        g.addEventListener('click', () => { if (i === 6 && cur === 6) gesToggle = !gesToggle; cur = i; show(); });
        segs.push(g); svg.append(g);
      }
      const ctr = mk('text', { x: 0, y: 5, 'text-anchor': 'middle', class: 'ac' }); ctr.textContent = 'dur / moll'; svg.append(ctr);
      function show() {
        segs.forEach((g, i) => g.classList.toggle('on', i === cur));
        const acc = cur === 6 ? (gesToggle ? -6 : 6) : ACC[cur];
        const kd = T.keyByAcc(acc, 'dur'), km = T.keyByAcc(acc, 'moll');
        sw.innerHTML = '';
        const td = T.P(kd.tonic.step, kd.tonic.alt, kd.tonic.step >= 5 ? 3 : 4);
        sw.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], key: acc, items: [{ t: 'sp', w: 2 }, { t: 'n', d: 'w', ps: [{ ...td, st: 0 }], lab: kd.name }, { t: 'n', d: 'w', ps: [{ ...T.P(km.tonic.step, km.tonic.alt, km.tonic.step >= 5 ? 3 : 4), st: 0 }], lab: km.name }], fit: true, minWidth: 340, scale: 1.3 }));
        out.innerHTML = `<b>${kd.name}</b> a paralelní <b>${km.name}</b>: ${T.accText(acc)}${acc ? ' (' + T.accList(acc).join(', ') + ')' : ''}${cur === 6 ? ' · klikni znovu pro enharmonickou tóninu' : ''}`;
        Snd.chord(T.chord(td, 'dur').map(T.midi), 0, 1.2);
      }
      const box = h('div', { class: 'circle' }, svg);
      setTimeout(() => { segs[0].classList.add('on'); sw.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], items: [], fit: true, minWidth: 340, scale: 1.3 })); out.innerHTML = 'Klikni na tóninu v kruhu.'; });
      return Wid('Kvintový kruh – klikni na tóninu', h('div', { class: 'cgrid' }, box, h('div', {}, sw, out)));
    })();
    const sharpFig = h('div', { class: 'qstaff' });
    sharpFig.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], key: 7, items: [{ t: 'sp', w: 1 }], fit: true, minWidth: 260, scale: 1.2 }));
    const flatFig = h('div', { class: 'qstaff' });
    flatFig.append(Staff.draw({ staves: [{ clef: 'g' }, { clef: 'f' }], key: -7, items: [{ t: 'sp', w: 1 }], fit: true, minWidth: 260, scale: 1.2 }));
    b.append(Sec('predznamenani', 'Předznamenání a kvintový kruh',
      P_('Posuvky, které stupnice potřebuje, se píší jednou na začátek každé osnovy jako <b>předznamenání</b>. Pořadí je pevné:'),
      h('div', { class: 'clefgrid' },
        h('div', {}, h('h3', {}, 'Křížky: fis cis gis dis ais eis his'), sharpFig),
        h('div', {}, h('h3', {}, 'Béčka: b es as des ges ces fes'), flatFig)),
      h('ul', {},
        h('li', { html: '<b>Křížkové durové tóniny</b> přibývají po kvintách nahoru: G (1♯), D (2), A (3), E (4), H (5), Fis (6), Cis (7). Tónika je o <b>malou sekundu nad posledním křížkem</b>.' }),
        h('li', { html: '<b>Béčkové durové tóniny</b> přibývají po kvintách dolů: F (1♭), B (2), Es (3), As (4), Des (5), Ges (6), Ces (7). Tónika je <b>předposlední béčko</b>, jen F dur se musí pamatovat.' }),
        h('li', { html: '<b>Paralelní mollová tónina</b> má stejné předznamenání a tóniku o <b>malou tercii níž</b> (C dur – a moll, Es dur – c moll).' }),
        h('li', { html: '<b>Stejnojmenné tóniny</b> mají stejnou tóniku, ale jiné předznamenání (C dur – c moll: 3 béčka navíc).' })),
      circle,
      P_('Na dolní straně kruhu se tóniny <b>enharmonicky překrývají</b>: H dur = Ces dur, Fis dur = Ges dur, Cis dur = Des dur. Tóniny vzdálené v kruhu o jeden krok jsou <b>příbuzné v 1. stupni</b> (sdílejí 6 ze 7 tónů). Proto se mezi nimi nejsnáz moduluje.')));

    /* --- módy a další --- */
    const modeRows = [['jónský', 'dur', 'jako dur', 'c–c'], ['dórský', 'dor', 'moll se zvýšeným VI. stupněm', 'd–d'], ['frygický', 'fryg', 'moll s malou sekundou (snížený II.)', 'e–e'], ['lydický', 'lyd', 'dur se zvětšenou kvartou (zvýšený IV.)', 'f–f'], ['mixolydický', 'mix', 'dur s malou septimou (snížený VII.)', 'g–g'], ['aiolský', 'aiol', 'přirozený moll', 'a–a'], ['lokrický', 'lokr', 'moll s m2 a zm5', 'h–h']];
    const modeTbl = Tbl(['Modus', 'Charakteristika', 'Bílé klávesy', ''], modeRows.map(([n, k, c, w]) => [n, c, w, `<button class="btn sm icon" data-k="${k}" data-s="${'cdefgah'.indexOf(w[0])}">▶</button>`]));
    modeTbl.addEventListener('click', e => { const bt = e.target.closest('[data-k]'); if (!bt) return; const s = +bt.dataset.s; Snd.melody(T.scale(T.P(s, 0, s >= 5 ? 3 : 4), bt.dataset.k).map(T.midi), 0.32, 0.3); });
    b.append(Sec('mody', 'Církevní módy a další stupnice',
      P_('<b>Církevní (modální) stupnice</b> získáme, když zahrajeme bílé klávesy od jiného tónu než c. Charakter modu dává tón, kterým se liší od dur nebo moll:'),
      modeTbl,
      h('ul', {},
        h('li', { html: '<b>pentatonika</b> má pět tónů bez půltónů (c d e g a – černé klávesy tvoří pentatoniku fis gis ais cis dis),' }),
        h('li', { html: '<b>celotónová stupnice</b> má šest tónů po celých tónech (c d e fis gis ais); existují jen dvě různé,' }),
        h('li', { html: '<b>chromatická stupnice</b> má všech dvanáct půltónů. Zapisuje se obvykle nahoru s křížky a dolů s béčky, v tónině podle harmonické souvislosti.' })),
      h('div', { class: 'row2' }, PlayBtn('pentatonika', () => Snd.melody(T.scale(T.P(0, 0, 4), 'pent').map(T.midi), 0.32)), PlayBtn('celotónová', () => Snd.melody(T.scale(T.P(0, 0, 4), 'celo').map(T.midi), 0.32)), PlayBtn('chromatická', () => Snd.melody(Array.from({ length: 13 }, (_, i) => 60 + i), 0.2, 0.2)))));

    /* --- cvičení --- */
    const keysUpTo = n => T.KEYS.filter(k => Math.abs(k.acc) <= n);
    const nOpt = { key: 'n', label: 'Posuvek nejvýše', values: [[4, '4'], [7, '7']], def: 7 };
    b.append(Sec('cviceni', 'Cvičení',
      Ex({
        id: 'st-predzn', title: 'Předznamenání → tónina', desc: 'Podle předznamenání urči tóninu.', options: [nOpt, { key: 'm', label: 'Ptát se na', values: [['dur', 'dur'], ['moll', 'moll'], ['mix', 'obojí']] }],
        gen: o => {
          const mode = o.m === 'mix' ? pick(['dur', 'moll']) : o.m;
          const k = pick(keysUpTo(o.n).filter(k => k.mode === mode));
          const pool = T.KEYS.filter(x => x.mode === mode).map(x => x.name);
          return { html: `Která <b>${mode === 'dur' ? 'durová' : 'mollová'}</b> tónina má toto předznamenání?`, staff: { staves: [{ clef: 'g' }, { clef: 'f' }], key: k.acc, items: [{ t: 'sp', w: 2 }], minWidth: 200 }, choices: makeChoices(k.name, pool, 6), answer: k.name, explain: `${T.accText(k.acc)} → ${T.keyByAcc(k.acc, 'dur').name} / ${T.keyByAcc(k.acc, 'moll').name}` };
        }
      }),
      Ex({
        id: 'st-posuvky', title: 'Tónina → předznamenání', options: [nOpt],
        gen: o => {
          const k = pick(keysUpTo(o.n));
          const pool = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(T.accText);
          return { html: `Kolik a jaké posuvky má <b>${k.name}</b>?`, choices: makeChoices(T.accText(k.acc), pool, 6), answer: T.accText(k.acc), explain: `${k.name}: ${T.accText(k.acc)}${k.acc ? ' – ' + T.accList(k.acc).join(', ') : ''}`, solutionStaff: { staves: [{ clef: 'g' }], key: k.acc, items: [{ t: 'sp', w: 2 }], minWidth: 160 } };
        }
      }),
      Ex({
        id: 'st-zapis', title: 'Zapiš stupnici', desc: 'Zapiš vzestupnou stupnici od tóniky po oktávu (8 tónů) bez předznamenání, posuvky piš před noty. Na klaviatuře zahraj 8 tónů nahoru.',
        options: [{ key: 'k', label: 'Druh', values: [['dur', 'durová'], ['aiol', 'mollová aiolská'], ['harm', 'mollová harmonická'], ['mel', 'mollová melodická (nahoru)'], ['mix', 'náhodně']] }, { key: 'n', label: 'Posuvek nejvýše', values: [[3, '3'], [5, '5'], [7, '7']], def: 5 }],
        gen: o => {
          const kind = o.k === 'mix' ? pick(['dur', 'aiol', 'harm', 'mel']) : o.k;
          const mode = kind === 'dur' ? 'dur' : 'moll';
          const k = pick(keysUpTo(o.n).filter(x => x.mode === mode));
          const t = T.P(k.tonic.step, k.tonic.alt, k.tonic.step >= 5 ? 3 : 4);
          const sc = T.scale(t, kind);
          return {
            html: `Zapiš stupnici <b>${T.base(t.step, t.alt)} ${kind === 'dur' ? 'dur' : 'moll ' + { aiol: 'aiolskou', harm: 'harmonickou', mel: 'melodickou' }[kind]}</b> od tónu ${nameH(t)}.`,
            write: { clef: 'g', target: sc, hint: 'Klikej postupně zleva doprava. Posuvku vyber předem, „bez posuvky“ zapíše kmenový tón.' },
            expect: { notes: sc.map(T.midi), seq: true, pc: true, range: [48, 84], hint: 'Zahraj 8 tónů stupnice nahoru (oktáva nerozhoduje).' },
            sing: { notes: sc.map(T.midi), labels: sc.map(p => T.name(p, { oct: false })), hint: 'Zazpívej stupnici nahoru, každý tón chvíli podrž.' },
            solutionStaff: { staves: [{ clef: 'g' }], items: sc.map(p => ({ t: 'n', d: 'w', ps: [p] })), minWidth: 400 },
            solutionPlay: () => Snd.melody(sc.map(T.midi), 0.35),
            explain: sc.map(p => T.name(p, { oct: false })).join(' '),
          };
        }
      }),
      Ex(ST_Q.sluch),
      Ex({
        id: 'st-pribuzne', title: 'Paralelní a stejnojmenné tóniny',
        gen: () => {
          const k = pick(T.KEYS.filter(x => Math.abs(x.acc) <= 6));
          const what = pick(['par', 'stej']);
          let ans;
          if (what === 'par') ans = T.keyByAcc(k.acc, k.mode === 'dur' ? 'moll' : 'dur').name;
          else { const other = T.KEYS.find(x => x.mode !== k.mode && x.tonic.step === k.tonic.step && x.tonic.alt === k.tonic.alt); if (!other) return ST_Q.par(); ans = other.name; }
          const pool = T.KEYS.filter(x => x.mode !== k.mode).map(x => x.name);
          return { html: `Jaká je <b>${what === 'par' ? 'paralelní' : 'stejnojmenná'}</b> tónina k <b>${k.name}</b>?`, choices: makeChoices(ans, pool, 4), answer: ans, explain: what === 'par' ? `paralelní tónina má stejné předznamenání (${T.accText(k.acc)})` : 'stejnojmenná tónina má stejnou tóniku' };
        }
      }),
      Ex({
        id: 'st-zpev', title: 'Zazpívej durovou stupnici', desc: 'Zazní tónika. Zazpívej stupnici nahoru (potřebuješ mikrofon).',
        gen: () => {
          const m = 55 + rnd(7); const sc = [0, 2, 4, 5, 7, 9, 11, 12].map(x => m + x);
          return { html: 'Zazpívej durovou stupnici od zahraného tónu.', play: () => Snd.note(m, 0, 1.5), sing: { notes: sc, labels: ROM, hint: 'Zpívej po jednom tónu a každý chvíli podrž. Oktáva nezáleží.' }, solutionPlay: () => Snd.melody(sc, 0.4), explain: 'dobře' };
        }
      })));
    ST_Q.par = () => ALL_QUIZZES['st-pribuzne'].gen({});
  }
});
App.EarSets.push(['Stupnice', [ST_Q.sluch]]);
