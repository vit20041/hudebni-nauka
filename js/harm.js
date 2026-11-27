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
  const cls = p => ({ step: p.step, alt: p.alt });
  const P4 = c => T.P(c.step, c.alt, 4);

  /* ---------- akordy podle funkcí ----------
     deg = stupeň (0 = I.), inv = obrat, sev = septakord, cad64 = kadenční kvartsextakord,
     sec = vedlejší dominanta k stupni tgt, alt = alterovaný akord (sm, N, VII7) */
  const TOK = {
    T: { fn: 'T', deg: 0, inv: 0 }, T6: { fn: 'T', deg: 0, inv: 1 },
    S: { fn: 'S', deg: 3, inv: 0 }, S6: { fn: 'S', deg: 3, inv: 1 },
    D: { fn: 'D', deg: 4, inv: 0 }, D6: { fn: 'D', deg: 4, inv: 1 },
    K64: { fn: 'D', deg: 0, inv: 2, cad64: true },
    D7: { fn: 'D', deg: 4, inv: 0, sev: true }, D65: { fn: 'D', deg: 4, inv: 1, sev: true }, D43: { fn: 'D', deg: 4, inv: 2, sev: true }, D2: { fn: 'D', deg: 4, inv: 3, sev: true },
    Tp: { fn: 'Tp', deg: 5, inv: 0 }, Sp: { fn: 'Sp', deg: 1, inv: 0 }, Sp6: { fn: 'Sp', deg: 1, inv: 1 }, Dp: { fn: 'Dp', deg: 2, inv: 0 },
    // vedlejší dominanty
    DS: { sec: true, tgt: 3, inv: 0 }, D7S: { sec: true, tgt: 3, inv: 0, sev: true }, D65S: { sec: true, tgt: 3, inv: 1, sev: true },
    DD: { sec: true, tgt: 4, inv: 0 }, D7D: { sec: true, tgt: 4, inv: 0, sev: true }, D65D: { sec: true, tgt: 4, inv: 1, sev: true },
    DSp: { sec: true, tgt: 1, inv: 0 }, D7Sp: { sec: true, tgt: 1, inv: 0, sev: true },
    DTp: { sec: true, tgt: 5, inv: 0 }, D7Tp: { sec: true, tgt: 5, inv: 0, sev: true },
    // alterované akordy
    sm: { alt: 'sm', inv: 0 }, sm6: { alt: 'sm', inv: 1 },
    N6: { alt: 'N', inv: 1 },
    VII7: { alt: 'VII7', inv: 0, sev: true },
  };
  const MINOR_FN = { T: 't', S: 's', Tp: 'tP' };
  const fromRoot = (root, ivs, roles) => ivs.map((iv, i) => ({ ...cls(T.up(P4(root), iv)), role: roles[i] }));
  function spec(tok, K, extra = {}) {
    const d = TOK[tok];
    const s = { ...d, tok, K, ...extra };
    if (d.sec) {
      const tg = K.sc[d.tgt];
      const root = cls(T.up(P4(tg), 'č5'));
      s.tn = fromRoot(root, d.sev ? ['č1', 'v3', 'č5', 'm7'] : ['č1', 'v3', 'č5'], ['1', '3', '5', '7']);
      s.dom = tg; s.deg = null; s.fn = '(D)';
    } else if (d.alt === 'sm') {
      s.tn = fromRoot(K.sc[3], ['č1', 'm3', 'č5'], ['1', '3', '5']); s.deg = 3; s.fn = 's';
    } else if (d.alt === 'N') {
      const r = { step: K.sc[1].step, alt: K.sc[1].alt - 1 };
      s.tn = fromRoot(r, ['č1', 'v3', 'č5'], ['1', '3', '5']); s.deg = 1; s.fn = 'N'; s.neap = true;
    } else if (d.alt === 'VII7') {
      s.tn = fromRoot(K.sc[6], ['č1', 'm3', 'zm5', 'zm7'], ['1', '3', '5', '7']); s.deg = 6; s.fn = 'D̸⁹'; s.dom = K.sc[0];
    } else {
      const r = s.cad64 ? 0 : s.deg;
      s.tn = [['1', 0], ['3', 2], ['5', 4]].map(([role, o]) => ({ ...K.sc[(r + o) % 7], role }));
      if (s.sev) s.tn.push({ ...K.sc[(r + 6) % 7], role: '7' });
      if (K.mode === 'moll' && MINOR_FN[s.fn]) s.fn = MINOR_FN[s.fn];
      if (s.deg === 4 && !s.cad64) s.dom = K.sc[0];
    }
    // citlivý tón: tón akordu o malou sekundu pod cílovým tónem dominanty
    if (s.dom) s.lt = s.tn.find(t => (t.step + 1) % 7 === s.dom.step && ((T.midi(P4(s.dom)) - T.midi(P4(t))) % 12 + 12) % 12 === 1) || null;
    return s;
  }
  const tones = s => s.tn;
  const bassRole = s => s.cad64 ? '5' : ['1', '3', '5', '7'][s.inv];
  function figure(s) {
    if (s.alt === 'VII7') return '';
    if (s.cad64) return '⁶₄';
    if (s.sev) return SUPF[[7, 65, 43, 2][s.inv]];
    return SUPF[['', 6, 64][s.inv]];
  }
  function fnLabel(s) {
    if (s.lab) return s.lab;
    if (s.sec) return `(D${figure(s)})`;
    return (s.cad64 ? 'D' : s.fn) + figure(s);
  }
  function degLabel(s) {
    if (s.labDeg) return s.labDeg;
    if (s.sec) return `V${figure(s)}/${ROMAN[s.tgt]}`;
    if (s.alt === 'N') return '♭II⁶';
    if (s.alt === 'VII7') return 'VII⁷';
    return (s.cad64 ? 'I' : ROMAN[s.deg]) + figure(s);
  }
  function label(s, mode) {
    mode = mode || store.get('hlab', 'fn');
    if (mode === 'deg') return degLabel(s);
    if (mode === 'both') return `${fnLabel(s)} (${degLabel(s)})`;
    return fnLabel(s);
  }
  /* durový / mollový kvintakord (podle tercie) */
  function triadKind(s) {
    const t = s.tn; const root = P4(t[0]);
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
  function chordIssues(v, s, _K, prev) {
    const out = [];
    const add = (sev, type, msg, voices) => out.push({ sev, type, msg, voices });
    const ts = s.tn, K = s.K;
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
    const idx = r => roles.map((x, i) => x === r ? i : -1).filter(i => i >= 0);
    if (!cnt('1')) add('chyba', 'chybi', 'v akordu chybí základní tón', []);
    if (!cnt('3')) add('chyba', 'chybi', 'v akordu chybí tercie', []);
    if (s.sev && !cnt('7')) add('chyba', 'chybi', 'v septakordu chybí septima', []);
    if (s.alt === 'VII7' && !cnt('5')) add('chyba', 'chybi', 'zmenšený septakord musí být úplný', []);
    else if (!cnt('5')) {
      const okAfterD7 = prev && prev.sev && prev.dom && prev.inv === 0 && same(ts[0], prev.dom) && s.inv === 0 && cnt('1') === 3;
      if (s.sev && cnt('1') === 2 && s.inv === 0) { /* neúplný D7 se zdvojeným základem je správně */ }
      else if (!okAfterD7) add('varování', 'chybi5', 'v akordu chybí kvinta' + (s.sev ? '' : ' (vynechat ji lze jen výjimečně, se ztrojeným základním tónem)'), []);
    }
    // citlivý tón tóniny i vlastní citlivý tón dominanty se nezdvojují
    for (const lt of [K.lt, s.lt].filter(Boolean)) {
      const li = v.map((p, i) => same(p, lt) ? i : -1).filter(i => i >= 0);
      if (li.length > 1) { add('chyba', 'zdvojCT', `zdvojený citlivý tón (${T.base(lt.step, lt.alt)})`, li); break; }
    }
    if (cnt('7') > 1) add('chyba', 'zdvoj7', 'zdvojená septima', idx('7'));
    if (s.inv === 2 && !s.sev && cnt('5') < 2) add('varování', 'zdvoj64', 'v kvartsextakordu se zdvojuje basový tón (kvinta)', [3]);
    if (s.neap) {
      if (cnt('3') < 2) add('varování', 'zdvojN', 'v neapolském sextakordu se zdvojuje basový tón (tercie)', [3]);
      if (cnt('1') > 1) add('varování', 'zdvojN', 'v neapolském sextakordu se nezdvojuje základní (snížený) tón', idx('1'));
    } else if (!s.sev && cnt('3') >= 2) {
      const tpOk = (s.fn === 'Tp' || s.fn === 'tP') && prev && prev.dom && same(prev.dom, K.sc[0]);
      const minor6 = s.inv === 1 && triadKind(s) === 'moll';
      if (!tpOk && !minor6) add('varování', 'zdvoj3', s.inv === 1 ? 'v durovém sextakordu se nezdvojuje tercie (basový tón)' : 'zdvojená tercie – v základním tvaru zdvojujeme základní tón', idx('3'));
    }
    return out;
  }

  /* problémy spojení dvou akordů X → Y */
  function pairIssues(X, Y, sx, sy) {
    const out = [];
    const add = (sev, type, msg, voices) => out.push({ sev, type, msg, voices });
    if (X.some(p => !p) || Y.some(p => !p)) return out;
    const tx = sx.tn;
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
    // nepravý vztah (chromatická změna tónu v jiném hlase)
    if (!sx.neap) {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (i === j || X[i].step !== Y[j].step || X[i].alt === Y[j].alt) continue;
        const inVoice = [0, 1, 2, 3].some(k => X[k].step === X[i].step && Y[k].step === X[i].step && X[k].alt !== Y[k].alt);
        if (!inVoice) { add('varování', 'nepravy', `nepravý vztah ${T.base(X[i].step, X[i].alt)} – ${T.base(Y[j].step, Y[j].alt)} (chromatická změna má zůstat v jednom hlase)`, [i, j]); i = 4; break; }
      }
    }
    // všechny hlasy stejným směrem
    const dirs = X.map((p, i) => Math.sign(T.midi(Y[i]) - T.midi(p)));
    if (dirs.every(d => d === 1) || dirs.every(d => d === -1)) add('varování', 'smer', 'všechny hlasy jdou stejným směrem', [0, 1, 2, 3]);
    // citlivý tón dominanty (hlavní i vedlejší) → cílový tón, pokud ho následující akord obsahuje
    if (sx.dom && sx.lt && !sx.cad64 && sy.tn.some(t => same(t, sx.dom))) {
      const klamny = (sy.fn === 'Tp' || sy.fn === 'tP') && same(sx.dom, sx.K.sc[0]);
      for (let i = 0; i < 4; i++) {
        if (!same(X[i], sx.lt)) continue;
        const ok = same(Y[i], sx.dom) && T.midi(Y[i]) - T.midi(X[i]) === 1;
        if (ok) continue;
        if (i === 0) add('chyba', 'ct', 'citlivý tón v sopránu se musí rozvést o půltón nahoru', [0]);
        else if (i === 3) add('chyba', 'ct', 'citlivý tón v basu se musí rozvést o půltón nahoru', [3]);
        else if (klamny) add('chyba', 'ct', `${VNAME[i]}: v klamném spoji jde citlivý tón vždy nahoru`, [i]);
        else if (sx.sev || sx.sec) add('chyba', 'ct', `${VNAME[i]}: citlivý tón ${sx.sec ? 'vedlejší dominanty' : 'dominantního septakordu'} se rozvádí o půltón nahoru`, [i]);
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
        else if (d === 0 && !(sy.cad64)) add('chyba', 'sept', `${VNAME[i]}: septima zůstala ležet, nerozvedla se dolů`, [i]);
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

  function check(cols, specs) {
    const res = [];
    cols.forEach((v, c) => chordIssues(v, specs[c], null, c ? specs[c - 1] : null).forEach(x => res.push({ ...x, col: c })));
    for (let c = 1; c < cols.length; c++) pairIssues(cols[c - 1], cols[c], specs[c - 1], specs[c]).forEach(x => res.push({ ...x, col: c, pair: true }));
    return res;
  }

  /* ---------- řešitel ---------- */
  function cands(ts, lo, hi) {
    const out = [];
    for (const t of ts) for (let o = 1; o <= 6; o++) { const p = T.P(t.step, t.alt, o); const m = T.midi(p); if (m >= lo && m <= hi) out.push(p); }
    return out.sort((a, b) => T.midi(a) - T.midi(b));
  }
  function voicings(s, _K, fix = {}, prev = null) {
    const ts = s.tn;
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
        const iss = chordIssues(v, s, null, prev);
        if (iss.some(x => x.sev === 'chyba')) continue;
        out.push({ v, cost: iss.length * 6 });
      }
    }
    return out;
  }
  /* nejlepší vedení hlasů pro řadu akordů; fixed[c] = {0: soprán, 3: bas} */
  function solve(specs, _K, fixed = []) {
    const layers = specs.map((s, c) => voicings(s, null, fixed[c] || {}, c ? specs[c - 1] : null));
    if (layers.some(l => !l.length)) return null;
    const back = [layers[0].map(x => ({ cost: x.cost + Math.abs(T.midi(x.v[0]) - 72) * 0.3, back: -1 }))];
    for (let c = 1; c < specs.length; c++) {
      const L = layers[c], P = layers[c - 1];
      const ND = L.map(() => ({ cost: Infinity, back: -1 }));
      L.forEach((y, j) => {
        P.forEach((x, i) => {
          const base = back[c - 1][i].cost; if (base === Infinity) return;
          const iss = pairIssues(x.v, y.v, specs[c - 1], specs[c]);
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
    T: ['S', 'S6', 'D', 'D6', 'D7', 'D65', 'D43', 'Sp', 'Sp6', 'Tp', 'T6', 'D7S', 'D65S', 'DD', 'D7D', 'DSp', 'D7Sp', 'DTp', 'D7Tp', 'sm', 'N6'],
    T6: ['S', 'S6', 'D', 'D7', 'D43', 'Sp', 'Sp6', 'DD', 'D7Sp', 'N6'],
    S: ['D', 'D6', 'D7', 'D65', 'D2', 'K64', 'T', 'S6', 'DD', 'D7D', 'D65D', 'sm'],
    S6: ['D', 'D7', 'D65', 'K64', 'S', 'DD', 'D7D'],
    Sp: ['D', 'D7', 'D65', 'K64', 'S', 'DD', 'D7D'], Sp6: ['D', 'D7', 'D65', 'K64', 'DD'],
    Tp: ['S', 'Sp', 'Sp6', 'S6', 'D', 'D7Sp', 'DSp', 'DD', 'N6'],
    D: ['T', 'T6', 'Tp'], D6: ['T'], D7: ['T', 'Tp'], D65: ['T'], D43: ['T', 'T6'], D2: ['T6'],
    K64: ['D', 'D7'],
    DS: ['S', 'S6'], D7S: ['S', 'S6'], D65S: ['S'],
    DD: ['D', 'K64', 'D7'], D7D: ['D', 'K64', 'D7'], D65D: ['D', 'K64'],
    DSp: ['Sp', 'Sp6'], D7Sp: ['Sp', 'Sp6'], DTp: ['Tp'], D7Tp: ['Tp'],
    sm: ['D', 'D7', 'K64'], sm6: ['D', 'D7', 'K64'], N6: ['D', 'K64', 'D7'], VII7: ['T'],
  };
  const L1 = ['T', 'S', 'D'], L2 = [...L1, 'T6', 'S6', 'D6', 'K64'], L3 = [...L2, 'D7', 'D65', 'D43', 'D2'], L4 = [...L3, 'Tp', 'Sp', 'Sp6'];
  const L5 = [...L4, 'D7S', 'D65S', 'DD', 'D7D', 'D65D', 'DSp', 'D7Sp', 'DTp', 'D7Tp'];
  const L6 = [...L5, 'sm', 'N6', 'VII7'];
  const LEVEL = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5, 6: L6 };
  const MINOR_BAN = new Set(['Sp', 'Sp6', 'Dp', 'DSp', 'D7Sp', 'sm', 'sm6']);
  // T → VII7 jen jako náhrada dominanty: přidat do následníků
  ['T', 'T6', 'S', 'S6', 'Sp', 'Tp'].forEach(k => SUCC[k].push('VII7'));
  function progression(level, n, mode = 'dur', only) {
    const avail = new Set((only || LEVEL[level]).filter(t => mode === 'dur' || !MINOR_BAN.has(t)));
    const newer = level >= 5 ? new Set((only || LEVEL[level]).filter(t => !LEVEL[level - 1].includes(t))) : null;
    for (let tries = 0; tries < 4000; tries++) {
      const seq = ['T'];
      while (seq.length < n) {
        const last = seq[seq.length - 1];
        const opts = (SUCC[last] || []).filter(t => avail.has(t) && t !== last);
        if (!opts.length) break;
        seq.push(pick(opts));
      }
      if (seq.length !== n) continue;
      const L = seq[n - 1], P2 = seq[n - 2];
      if (L !== 'T' || !['D', 'D7', 'VII7'].includes(P2)) continue;
      if (new Set(seq).size < Math.min(3, avail.size)) continue;
      // na vyšší úrovni chceme aspoň jeden nový akord dané kapitoly
      if (newer && newer.size && !seq.some(t => newer.has(t))) continue;
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
      const sol = solve(specs);
      if (sol) return { K, specs, sol, toks };
    }
    return null;
  }

  /* ---------- modulace přes společný akord ---------- */
  const tonesKey = s => s.tn.map(t => t.step * 10 + t.alt + 2).sort().join();
  const REL = {
    dur: [['dominantová tónina', 1, 'dur'], ['subdominantová tónina', -1, 'dur'], ['paralelní moll', 0, 'moll'], ['mollová tónina III. stupně', 1, 'moll'], ['mollová tónina II. stupně', -1, 'moll']],
    moll: [['paralelní dur', 0, 'dur'], ['subdominantová moll', -1, 'moll'], ['dominantová moll', 1, 'moll'], ['tónina VI. stupně (dur)', -1, 'dur']],
  };
  function modTask(o = {}) {
    for (let tries = 0; tries < 80; tries++) {
      const mode = o.mode === 'mix' || !o.mode ? pick(['dur', 'dur', 'moll']) : o.mode;
      const acc = pick([-2, -1, 0, 1, 2]);
      const A = key(acc, mode);
      const [rel, dAcc, mB] = pick(REL[mode]);
      if (Math.abs(acc + dAcc) > 5) continue;
      const B = key(acc + dAcc, mB);
      // společný akord: v A tónika nebo Tp (po dominantě), v B subdominantová, Tp nebo tónika
      const pivots = [];
      for (const ta of ['T', 'Tp']) for (const tb of ['S', 'Sp', 'Tp', 'T']) {
        if (mB === 'moll' && tb === 'Sp') continue;
        const sa = spec(ta, A), sb = spec(tb, B);
        if (tonesKey(sa) === tonesKey(sb)) pivots.push([ta, tb, sa, sb]);
      }
      if (!pivots.length) continue;
      const [ta, tb, sa, sb] = pick(pivots);
      const pre = ['T', pick(mode === 'dur' ? ['S', 'Sp', 'S6'] : ['S', 'S6']), pick(['D', 'D7'])];
      const post = tb === 'S' || tb === 'Sp' ? pick([['D7', 'T'], ['K64', 'D7', 'T'], ['D', 'T']]) : pick([['S', 'D7', 'T'], ['S', 'K64', 'D', 'T']]);
      const pv = spec(tb, B, { lab: `${fnLabel(sa)} = ${fnLabel(sb)}`, labDeg: `${degLabel(sa)} = ${degLabel(sb)}`, pivot: true });
      const specs = [...pre.map(t => spec(t, A)), pv, ...post.map(t => spec(t, B))];
      const sol = solve(specs);
      if (sol) return { K: A, K2: B, rel, specs, sol, pivotAt: pre.length };
    }
    return null;
  }

  /* hledání pravopisu pro tón z MIDI v kontextu akordu a tóniny */
  function spellIn(m, s, K) {
    const k = (s && s.K) || K;
    const pref = [...(s ? s.tn : []), ...k.sc];
    for (const t of pref) { const d = ((m - T.midi(P4(t))) % 12 + 12) % 12; if (d === 0) { const p = T.P(t.step, t.alt, 0); while (T.midi(p) < m) p.oct++; if (T.midi(p) === m) return p; } }
    return T.spellMidi(m);
  }

  return { VN, VNAME, RANGE, key, spec, tones, bassRole, label, fnLabel, degLabel, figure, check, chordIssues, pairIssues, solve, voicings, progression, task, modTask, spellIn, same, TOK, LEVEL, isP, REL };
})();
