/* Harmonie: funkce, čtyřhlasá sazba, kontrola hlasového vedení, řešitel, generátor zadání */
'use strict';
const H = (() => {
  const VN = ['S', 'A', 'T', 'B'];
  const VNAME = ['soprán', 'alt', 'tenor', 'bas'];
  // orientační rozsahy hlasů pro čtyřhlasou sazbu (MIDI): S c¹–g², A g–d², T c–g¹, B F–d¹
  const RANGE = [[60, 79], [55, 74], [48, 67], [41, 62]];
  const SUPF = { '': '', 6: '⁶', 64: '⁶₄', 7: '⁷', 65: '⁶₅', 43: '⁴₃', 2: '²' };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  /* ---------- tónina ---------- */
  function key(acc, mode) {
    const k = T.keyByAcc(acc, mode);
    const tonic = T.P(k.tonic.step, k.tonic.alt, 4);
    const sc = T.scale(tonic, mode === 'dur' ? 'dur' : 'harm').slice(0, 7).map(p => ({ step: p.step, alt: p.alt }));
    return { acc, mode, name: k.name, tonic, sc, lt: sc[6] };
  }
  const same = (a, b) => a && b && a.step === b.step && a.alt === b.alt;

  /* ---------- akordy podle funkcí ---------- */
  // token → specifikace; deg = stupeň (0 = I.), inv = obrat, sev = septakord, cad64 = kadenční kvartsextakord
  const TOK = {
    T: { fn: 'T', deg: 0, inv: 0 }, T6: { fn: 'T', deg: 0, inv: 1 },
    S: { fn: 'S', deg: 3, inv: 0 }, S6: { fn: 'S', deg: 3, inv: 1 },
    D: { fn: 'D', deg: 4, inv: 0 }, D6: { fn: 'D', deg: 4, inv: 1 },
    K64: { fn: 'D', deg: 0, inv: 2, cad64: true },
    D7: { fn: 'D', deg: 4, inv: 0, sev: true }, D65: { fn: 'D', deg: 4, inv: 1, sev: true }, D43: { fn: 'D', deg: 4, inv: 2, sev: true }, D2: { fn: 'D', deg: 4, inv: 3, sev: true },
    Tp: { fn: 'Tp', deg: 5, inv: 0 }, Sp: { fn: 'Sp', deg: 1, inv: 0 }, Sp6: { fn: 'Sp', deg: 1, inv: 1 }, Dp: { fn: 'Dp', deg: 2, inv: 0 },
  };
  const MINOR_FN = { T: 't', S: 's', Tp: 'tP' };
  function spec(tok, K) {
    const s = { ...TOK[tok], tok };
    if (K.mode === 'moll' && MINOR_FN[s.fn]) s.fn = MINOR_FN[s.fn];
    return s;
  }
  /* tóny akordu jako třídy {step, alt, role} */
  function tones(s, K) {
    const r = s.cad64 ? 0 : s.deg;
    const out = [['1', 0], ['3', 2], ['5', 4]].map(([role, o]) => ({ ...K.sc[(r + o) % 7], role }));
    if (s.sev) out.push({ ...K.sc[(r + 6) % 7], role: '7' });
    return out;
  }
  const bassRole = s => s.cad64 ? '5' : ['1', '3', '5', '7'][s.inv];
  function figure(s) {
    if (s.cad64) return '⁶₄';
    if (s.sev) return SUPF[[7, 65, 43, 2][s.inv]];
    return SUPF[['', 6, 64][s.inv]];
  }
  const fnLabel = s => (s.cad64 ? (s.fnLabel || 'D') : s.fn) + figure(s);
  const degLabel = s => (s.cad64 ? 'I' : ROMAN[s.deg]) + figure(s);
  function label(s, mode) {
    mode = mode || store.get('hlab', 'fn');
    if (mode === 'deg') return degLabel(s);
    if (mode === 'both') return `${fnLabel(s)} (${degLabel(s)})`;
    return fnLabel(s);
  }
  /* durový / mollový / zmenšený / zvětšený kvintakord */
  function triadKind(s, K) {
    const t = tones(s, K); const root = T.P(t[0].step, t[0].alt, 4);
    const third = T.interval(root, T.P(t[1].step, t[1].alt, t[1].step < t[0].step ? 5 : 4)).abbr;
    return third === 'v3' ? 'dur' : 'moll';
  }
  const roleOf = (p, ts) => { const t = ts.find(x => same(x, p)); return t ? t.role : null; };

  /* ---------- kontrola ---------- */
  const isP = (a, b) => {
    // čistá kvinta / oktáva (i složená) mezi dvěma tóny bez ohledu na pořadí
    let d = T.dia(a) - T.dia(b), s = T.midi(a) - T.midi(b);
    if (d < 0 || (d === 0 && s < 0)) { d = -d; s = -s; }
    if (d % 7 === 4 && ((s % 12) + 12) % 12 === 7) return 5;
    if (d % 7 === 0 && ((s % 12) + 12) % 12 === 0) return 8;
    return 0;
  };
  const pn = p => T.name(p);

  /* problémy jednoho akordu: v = [S,A,T,B] (null = nevyplněno) */
  function chordIssues(v, s, K, prev) {
    const out = [];
    const add = (sev, type, msg, voices) => out.push({ sev, type, msg, voices });
    const ts = tones(s, K);
    if (v.some(p => !p)) { add('chyba', 'neuplny', 'akord není vyplněný ve všech hlasech', v.map((p, i) => p ? -1 : i).filter(i => i >= 0)); return out; }
    const roles = v.map(p => roleOf(p, ts));
    roles.forEach((r, i) => { if (!r) add('chyba', 'cizi', `tón ${pn(v[i])} (${VNAME[i]}) nepatří do akordu`, [i]); });
    v.forEach((p, i) => { const m = T.midi(p); if (m < RANGE[i][0] || m > RANGE[i][1]) add('chyba', 'rozsah', `${VNAME[i]} je mimo rozsah (${pn(p)})`, [i]); });
    for (let i = 0; i < 3; i++) if (T.midi(v[i]) < T.midi(v[i + 1])) add('chyba', 'krizeni', `překřížení hlasů ${VNAME[i]} a ${VNAME[i + 1]}`, [i, i + 1]);
    if (T.midi(v[0]) - T.midi(v[1]) > 12) add('chyba', 'rozestup', 'rozestup sopránu a altu je větší než oktáva', [0, 1]);
    if (T.midi(v[1]) - T.midi(v[2]) > 12) add('chyba', 'rozestup', 'rozestup altu a tenoru je větší než oktáva', [1, 2]);
    if (T.midi(v[2]) - T.midi(v[3]) > 19) add('varování', 'rozestup', 'rozestup tenoru a basu je větší než duodecima', [2, 3]);
    if (roles.some(r => !r)) return out;
    if (roles[3] !== bassRole(s)) add('chyba', 'bas', `v basu má být ${{ 1: 'základní tón', 3: 'tercie', 5: 'kvinta', 7: 'septima' }[bassRole(s)]} akordu`, [3]);
    const cnt = r => roles.filter(x => x === r).length;
    if (!cnt('1')) add('chyba', 'chybi', 'v akordu chybí základní tón', []);
    if (!cnt('3')) add('chyba', 'chybi', 'v akordu chybí tercie', []);
    if (s.sev && !cnt('7')) add('chyba', 'chybi', 'v septakordu chybí septima', []);
    if (!cnt('5')) {
      const okAfterD7 = prev && prev.sev && prev.inv === 0 && s.deg === 0 && s.inv === 0 && cnt('1') === 3;
      if (s.sev && cnt('1') === 2 && s.inv === 0) { /* neúplný D7 se zdvojeným základem je správně */ }
      else if (!okAfterD7) add('varování', 'chybi5', 'v akordu chybí kvinta' + (s.sev ? '' : ' (vynechat ji lze jen výjimečně, se ztrojeným základním tónem)'), []);
    }
    const ltIdx = v.map((p, i) => same(p, K.lt) ? i : -1).filter(i => i >= 0);
    if (ltIdx.length > 1) add('chyba', 'zdvojCT', 'zdvojený citlivý tón', ltIdx);
    if (cnt('7') > 1) add('chyba', 'zdvoj7', 'zdvojená septima', roles.map((r, i) => r === '7' ? i : -1).filter(i => i >= 0));
    if (s.inv === 2 && !s.sev && cnt('5') < 2) add('varování', 'zdvoj64', 'v kvartsextakordu se zdvojuje basový tón (kvinta)', [3]);
    if (!s.sev && cnt('3') >= 2) {
      const tpOk = (s.fn === 'Tp' || s.fn === 'tP') && prev && prev.deg === 4 && !prev.cad64;
      const minor6 = s.inv === 1 && triadKind(s, K) === 'moll';
      if (!tpOk && !minor6) add('varování', 'zdvoj3', s.inv === 1 ? 'v durovém sextakordu se nezdvojuje tercie (basový tón)' : 'zdvojená tercie – v základním tvaru zdvojujeme základní tón', roles.map((r, i) => r === '3' ? i : -1).filter(i => i >= 0));
    }
    return out;
  }

  /* problémy spojení dvou akordů X → Y */
  function pairIssues(X, Y, sx, sy, K) {
    const out = [];
    const add = (sev, type, msg, voices) => out.push({ sev, type, msg, voices });
    if (X.some(p => !p) || Y.some(p => !p)) return out;
    const tx = tones(sx, K);
    // paralely
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const a = isP(X[i], X[j]), b = isP(Y[i], Y[j]);
      const moved = !T.eq(X[i], Y[i]) && !T.eq(X[j], Y[j]);
      if (a && a === b && moved) add('chyba', a === 5 ? 'par5' : 'par8', `paralelní ${a === 5 ? 'kvinty' : 'oktávy'} (${VN[i]}–${VN[j]})`, [i, j]);
    }
    // skryté kvinty a oktávy mezi krajními hlasy
    const dS = T.midi(Y[0]) - T.midi(X[0]), dB = T.midi(Y[3]) - T.midi(X[3]);
    const py = isP(Y[0], Y[3]);
    if (py && isP(X[0], X[3]) !== py && dS && dB && Math.sign(dS) === Math.sign(dB) && Math.abs(dS) > 2)
      add('varování', 'skryte', `skrytá ${py === 5 ? 'kvinta' : 'oktáva'} mezi krajními hlasy (soprán jde skokem)`, [0, 3]);
    // překročení hlasů
    for (let i = 0; i < 3; i++) {
      if (T.midi(Y[i + 1]) > T.midi(X[i]) || T.midi(Y[i]) < T.midi(X[i + 1])) add('varování', 'prekroceni', `překročení hlasů ${VNAME[i]} a ${VNAME[i + 1]}`, [i, i + 1]);
    }
    // melodické kroky
    for (let i = 0; i < 4; i++) {
      if (T.eq(X[i], Y[i])) continue;
      const iv = T.interval(X[i], Y[i]);
      const s = Math.abs(T.midi(Y[i]) - T.midi(X[i]));
      if ((iv.q === 'zv' || iv.q === 'dzv') && iv.num > 1) add('chyba', 'zvkrok', `${VNAME[i]}: melodický krok o ${T.ivName(iv.abbr)} (zvětšený interval)`, [i]);
      else if (s > 12) add('chyba', 'skok', `${VNAME[i]}: skok větší než oktáva`, [i]);
      else if (i < 3 && (iv.num === 7)) add('varování', 'skok7', `${VNAME[i]}: skok o septimu`, [i]);
      else if (i > 0 && i < 3 && s > 9 && iv.num !== 8) add('varování', 'skokS', `${VNAME[i]}: velký skok ve středním hlase`, [i]);
    }
    // všechny hlasy stejným směrem
    const dirs = X.map((p, i) => Math.sign(T.midi(Y[i]) - T.midi(p)));
    if (dirs.every(d => d === 1) || dirs.every(d => d === -1)) add('varování', 'smer', 'všechny hlasy jdou stejným směrem', [0, 1, 2, 3]);
    // citlivý tón
    const dGroup = sx.deg === 4 && !sx.cad64;
    if (dGroup && (sy.deg === 0 || sy.deg === 5) && !sy.cad64) {
      for (let i = 0; i < 4; i++) {
        if (!same(X[i], K.lt)) continue;
        const ok = same(Y[i], K.sc[0]) && T.midi(Y[i]) - T.midi(X[i]) === 1;
        if (ok) continue;
        if (i === 0) add('chyba', 'ct', 'citlivý tón v sopránu se musí rozvést o půltón nahoru do tóniky', [0]);
        else if (i === 3) { /* bas v D6 → T musí jít do tóniky: */ if (sx.inv === 1) add('chyba', 'ct', 'citlivý tón v basu se musí rozvést do tóniky', [3]); }
        else if (sy.deg === 5) add('chyba', 'ct', `${VNAME[i]}: v klamném spoji jde citlivý tón vždy do tóniky`, [i]);
        else if (sx.sev) add('chyba', 'ct', `${VNAME[i]}: citlivý tón dominantního septakordu se rozvádí do tóniky`, [i]);
        else add('varování', 'ctvolny', `${VNAME[i]}: citlivý tón nevede do tóniky (ve středním hlase jen výjimečně, kvůli úplné tónice)`, [i]);
      }
    }
    // septima
    if (sx.sev) {
      for (let i = 0; i < 4; i++) {
        if (roleOf(X[i], tx) !== '7') continue;
        const d = T.midi(Y[i]) - T.midi(X[i]);
        const ok = (d === -1 || d === -2) || (sx.inv === 2 && sy.inv === 1 && (d === 1 || d === 2) && i !== 3);
        if (!ok && d !== 0) add('chyba', 'sept', `${VNAME[i]}: septima se musí rozvést o stupeň dolů`, [i]);
        else if (d === 0) add('chyba', 'sept', `${VNAME[i]}: septima zůstala ležet, nerozvedla se dolů`, [i]);
      }
    }
    // kadenční kvartsextakord: 6 → 5 a 4 → 3
    if (sx.cad64 && sy.deg === 4) {
      for (let i = 0; i < 3; i++) {
        const r = roleOf(X[i], tx);
        if (r !== '1' && r !== '3') continue;
        const d = T.midi(Y[i]) - T.midi(X[i]);
        if (!(d === -1 || d === -2)) add('varování', 'k64', `${VNAME[i]}: v kadenčním kvartsextakordu má ${r === '3' ? 'sexta' : 'kvarta'} nad basem klesnout o stupeň`, [i]);
      }
    }
    return out;
  }

  function check(cols, specs, K) {
    const res = [];
    cols.forEach((v, c) => chordIssues(v, specs[c], K, c ? specs[c - 1] : null).forEach(x => res.push({ ...x, col: c })));
    for (let c = 1; c < cols.length; c++) pairIssues(cols[c - 1], cols[c], specs[c - 1], specs[c], K).forEach(x => res.push({ ...x, col: c, pair: true }));
    return res;
  }

  /* ---------- řešitel ---------- */
  function cands(ts, lo, hi) {
    const out = [];
    for (const t of ts) for (let o = 1; o <= 6; o++) { const p = T.P(t.step, t.alt, o); const m = T.midi(p); if (m >= lo && m <= hi) out.push(p); }
    return out.sort((a, b) => T.midi(a) - T.midi(b));
  }
  function voicings(s, K, fix = {}, prev = null) {
    const ts = tones(s, K);
    const br = bassRole(s);
    const Bs = fix[3] ? [fix[3]] : cands(ts.filter(t => t.role === br), ...RANGE[3]);
    const Ss = fix[0] ? [fix[0]] : cands(ts, ...RANGE[0]);
    const As = cands(ts, ...RANGE[1]), Ts = cands(ts, ...RANGE[2]);
    const out = [];
    for (const B of Bs) for (const S of Ss) for (const A of As) {
      const mS = T.midi(S), mA = T.midi(A), mB = T.midi(B);
      if (mA >= mS || mS - mA > 12) continue;
      for (const Tn of Ts) {
        const mT = T.midi(Tn);
        if (mT >= mA || mA - mT > 12 || mT <= mB || mT - mB > 19) continue;
        const v = [S, A, Tn, B];
        const iss = chordIssues(v, s, K, prev);
        if (iss.some(x => x.sev === 'chyba')) continue;
        out.push({ v, cost: iss.length * 6 });
      }
    }
    return out;
  }
  /* nejlepší vedení hlasů pro řadu akordů; fixed[c] = {0: soprán, 3: bas} */
  function solve(specs, K, fixed = []) {
    const layers = specs.map((s, c) => voicings(s, K, fixed[c] || {}, c ? specs[c - 1] : null));
    if (layers.some(l => !l.length)) return null;
    let D = layers[0].map(x => ({ cost: x.cost + Math.abs(T.midi(x.v[0]) - 72) * 0.3, back: -1 }));
    const back = [D];
    for (let c = 1; c < specs.length; c++) {
      const L = layers[c], P = layers[c - 1];
      const ND = L.map(() => ({ cost: Infinity, back: -1 }));
      L.forEach((y, j) => {
        P.forEach((x, i) => {
          const base = back[c - 1][i].cost; if (base === Infinity) return;
          const iss = pairIssues(x.v, y.v, specs[c - 1], specs[c], K);
          if (iss.some(z => z.sev === 'chyba')) return;
          let mv = 0;
          for (let k = 0; k < 4; k++) { const d = Math.abs(T.midi(y.v[k]) - T.midi(x.v[k])); mv += k === 3 ? d * 0.4 : k === 0 ? d * 1.2 : d; }
          const cost = base + y.cost + mv + iss.length * 8;
          if (cost < ND[j].cost) ND[j] = { cost, back: i };
        });
      });
      back.push(ND);
    }
    const last = back[back.length - 1];
    let bi = -1, bc = Infinity; last.forEach((x, i) => { if (x.cost < bc) { bc = x.cost; bi = i; } });
    if (bi < 0) return null;
    const res = [];
    for (let c = specs.length - 1; c >= 0; c--) { res.unshift(layers[c][bi].v); bi = back[c][bi].back; }
    return res;
  }

  /* ---------- generátor průběhů ---------- */
  const SUCC = {
    T: ['S', 'S6', 'D', 'D6', 'D7', 'D65', 'D43', 'Sp', 'Sp6', 'Tp', 'T6'],
    T6: ['S', 'S6', 'D', 'D7', 'D43', 'Sp', 'Sp6'],
    S: ['D', 'D6', 'D7', 'D65', 'D2', 'K64', 'T', 'S6'],
    S6: ['D', 'D7', 'D65', 'K64', 'S'],
    Sp: ['D', 'D7', 'D65', 'K64', 'S'], Sp6: ['D', 'D7', 'D65', 'K64'],
    Tp: ['S', 'Sp', 'Sp6', 'S6', 'D'],
    D: ['T', 'T6', 'Tp'], D6: ['T'], D7: ['T', 'Tp'], D65: ['T'], D43: ['T', 'T6'], D2: ['T6'],
    K64: ['D', 'D7'],
  };
  const LEVEL = { 1: ['T', 'S', 'D'], 2: ['T', 'S', 'D', 'T6', 'S6', 'D6', 'K64'], 3: ['T', 'S', 'D', 'T6', 'S6', 'D6', 'K64', 'D7', 'D65', 'D43', 'D2'], 4: ['T', 'S', 'D', 'T6', 'S6', 'D6', 'K64', 'D7', 'D65', 'D43', 'D2', 'Tp', 'Sp', 'Sp6'] };
  const MINOR_OK = new Set(['T', 'S', 'D', 'T6', 'S6', 'D6', 'K64', 'D7', 'D65', 'D43', 'D2', 'Tp']);
  function progression(level, n, mode = 'dur', only) {
    const avail = new Set((only || LEVEL[level]).filter(t => mode === 'dur' || MINOR_OK.has(t)));
    for (let tries = 0; tries < 3000; tries++) {
      const seq = ['T'];
      while (seq.length < n) {
        const last = seq[seq.length - 1];
        const opts = (SUCC[last] || []).filter(t => avail.has(t) && t !== last);
        if (!opts.length) break;
        seq.push(pick(opts));
      }
      if (seq.length !== n) continue;
      const L = seq[n - 1], P2 = seq[n - 2];
      if (L !== 'T' || !['D', 'D7'].includes(P2)) continue;
      // rozmanitost: aspoň 3 různé akordy
      if (new Set(seq).size < Math.min(3, avail.size)) continue;
      return seq;
    }
    return ['T', 'S', 'D', 'T'];
  }
  /* kompletní zadání: tónina, akordy, vzorové řešení */
  function task(o) {
    for (let k = 0; k < 40; k++) {
      const mode = o.mode === 'mix' ? pick(['dur', 'moll']) : (o.mode || 'dur');
      const acc = pick((o.accs || [-3, -2, -1, 0, 1, 2, 3]));
      const K = key(acc, mode);
      const toks = o.toks || progression(o.level, o.n || 6, mode, o.only);
      const specs = toks.map(t => spec(t, K));
      const sol = solve(specs, K);
      if (sol) return { K, specs, sol, toks };
    }
    return null;
  }

  /* hledání pravopisu pro tón z MIDI v kontextu akordu a tóniny */
  function spellIn(m, s, K) {
    const pref = [...(s ? tones(s, K) : []), ...K.sc];
    for (const t of pref) { const base = T.P(t.step, t.alt, 4); const d = ((m - T.midi(base)) % 12 + 12) % 12; if (d === 0) { const p = T.P(t.step, t.alt, 0); while (T.midi(p) < m) p.oct++; if (T.midi(p) === m) return p; } }
    return T.spellMidi(m);
  }

  return { VN, VNAME, RANGE, key, spec, tones, bassRole, label, fnLabel, degLabel, figure, check, chordIssues, pairIssues, solve, voicings, progression, task, spellIn, same, TOK, isP };
})();
