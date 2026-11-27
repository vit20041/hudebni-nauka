/* Díl III: generátor hudebních dílů pro poznávání forem, časová osa, práce s motivem */
'use strict';
const FG = (() => {
  /* jeden hudební díl: harmonický průběh s vedením hlasů */
  function section(K, o = {}) {
    for (let k = 0; k < 30; k++) {
      const toks = o.toks || H.progression(o.level || 3, o.n || 6, K.mode);
      const specs = toks.map(t => H.spec(t, K));
      const sol = H.solve(specs);
      if (sol) return { K, toks, specs, sol };
    }
    return null;
  }
  const scaleMidis = K => { const out = []; for (let o = 2; o <= 6; o++) for (const c of K.sc) out.push(T.midi(T.P(c.step, c.alt, o))); return out.sort((a, b) => a - b); };
  /* události (tóny) jednoho dílu v daném stylu; cd = délka akordu v s */
  function events(sec, style, t0, cd) {
    const ev = []; const add = (m, t, d, v) => ev.push({ m, t: t0 + t, d, v });
    const sc = scaleMidis(sec.K);
    sec.sol.forEach((v, c) => {
      const t = c * cd; const [S, A, Tn, B] = v.map(T.midi);
      const block = vel => { [A, Tn, B].forEach(m => add(m, t, cd * 0.95, vel)); };
      switch (style) {
        case 'chorale': [S, A, Tn, B].forEach(m => add(m, t, cd * 0.95, 0.55)); break;
        case 'melody': add(S, t, cd * 0.95, 0.85); block(0.32); break;
        case 'alberti': add(S, t, cd * 0.95, 0.8); [B, Tn, A, Tn].forEach((m, i) => add(m, t + i * cd / 4, cd / 4 * 0.95, 0.36)); break;
        case 'arp': [B, Tn, A, S].forEach((m, i) => add(m, t + i * cd / 4, cd - i * cd / 4, i === 3 ? 0.8 : 0.4)); break;
        case 'dotted': add(S, t, cd * 0.7, 0.85); add(S, t + cd * 0.75, cd * 0.24, 0.7); block(0.3); break;
        case 'ornament': {
          add(S, t, cd * 0.48, 0.85);
          const nx = c < sec.sol.length - 1 ? T.midi(sec.sol[c + 1][0]) : S;
          // průchodný tón mezi melodickými tóny vzdálenými o tercii, jinak horní střídavý tón
          const between = sc.filter(m => (m > Math.min(S, nx) && m < Math.max(S, nx)));
          const orn = between.length === 1 ? between[0] : (sc.find(m => m > S) || S + 2);
          add(orn, t + cd * 0.5, cd * 0.45, 0.75);
          block(0.3); break;
        }
        case 'bass': add(B, t, cd * 0.95, 0.8); [Tn, A, S].forEach(m => add(m, t + cd / 2, cd / 2 * 0.9, 0.3)); break;
        default: [S, A, Tn, B].forEach(m => add(m, t, cd * 0.95, 0.5));
      }
    });
    return { ev, dur: sec.sol.length * cd };
  }
  /* přehrání řady dílů; parts = [{sec, style, label}], vrací celkovou délku */
  let timers = [];
  function play(parts, cd = 0.8, onPart) {
    stop();
    let t = 0.15;
    parts.forEach((p, i) => {
      const { ev, dur } = events(p.sec, p.style, t, cd);
      ev.forEach(e => Snd.note(e.m, e.t, e.d, e.v));
      if (onPart) timers.push(setTimeout(() => onPart(i), t * 1000));
      t += dur + (p.gap ?? 0.35);
    });
    if (onPart) timers.push(setTimeout(() => onPart(-1), t * 1000));
    return t;
  }
  function stop() { timers.forEach(clearTimeout); timers = []; Snd.stopAll(); }

  /* časová osa: barevné bloky dílů, zvýraznění při přehrávání */
  const COLORS = { A: 'var(--accent)', B: 'var(--accent2)', C: 'var(--good)', D: 'var(--warn)' };
  function timeline(parts, reveal = true) {
    const el = h('div', { class: 'tline' });
    const blocks = parts.map(p => {
      const L = (p.label || '?')[0].toUpperCase();
      const b = h('div', { class: 'tblk', style: `flex:${p.sec.sol.length};--c:${reveal ? (COLORS[L] || 'var(--mut)') : 'var(--mut)'}` }, h('b', {}, reveal ? p.label : '?'), p.sub && reveal ? h('small', {}, p.sub) : null);
      el.append(b); return b;
    });
    el.hl = i => blocks.forEach((b, j) => b.classList.toggle('now', i === j));
    el.reveal = () => parts.forEach((p, i) => { const L = (p.label || '?')[0].toUpperCase(); blocks[i].style.setProperty('--c', COLORS[L] || 'var(--mut)'); blocks[i].innerHTML = ''; blocks[i].append(h('b', {}, p.label), p.sub ? h('small', {}, p.sub) : null); });
    return el;
  }

  /* příbuzné tóniny pro kontrastní díly */
  function rel(K, which) {
    const k = which === 'D' ? T.keyByAcc(K.acc + 1, K.mode) : which === 'S' ? T.keyByAcc(K.acc - 1, K.mode) : which === 'par' ? T.keyByAcc(K.acc, K.mode === 'dur' ? 'moll' : 'dur') : which === 'same' ? T.KEYS.find(x => x.mode !== K.mode && x.tonic.step === K.tonic.step && x.tonic.alt === K.tonic.alt) : null;
    return k ? H.key(k.acc, k.mode) : null;
  }

  /* skladba v dané formě (plán písmen) */
  const FORMS = {
    ab: { n: 'malá písňová dvoudílná (a – b)', plan: ['a', 'b'] },
    aba: { n: 'malá písňová třídílná (a – b – a)', plan: ['a', 'b', 'a'] },
    aab: { n: 'barová forma (a – a – b)', plan: ['a', 'a', 'b'] },
    rondo: { n: 'rondo (A – B – A – C – A)', plan: ['A', 'B', 'A', 'C', 'A'] },
    vari: { n: 'téma s variacemi (A – A₁ – A₂ – A₃)', plan: ['A', 'A₁', 'A₂', 'A₃'] },
    strof: { n: 'strofická píseň (A – A – A)', plan: ['A', 'A', 'A'] },
    prok: { n: 'prokomponovaná píseň (A – B – C)', plan: ['A', 'B', 'C'] },
  };
  function piece(form, o = {}) {
    for (let k = 0; k < 20; k++) {
      const acc = pick(o.accs || [-2, -1, 0, 1, 2]);
      const K = H.key(acc, 'dur');
      const n = FORMS[form].plan.length > 3 ? 4 : 6;
      const A = section(K, { level: 3, n });
      const KB = rel(K, pick(['D', 'par'])), KC = rel(K, pick(['S', 'same']));
      if (!A || !KB || !KC) continue;
      const B = section(KB, { level: 2, n }), C = section(KC, { level: 2, n });
      if (!B || !C) continue;
      const Km = rel(K, 'same'); const Am = Km && section(Km, { toks: A.toks.map(t => t === 'Sp' || t === 'Sp6' ? 'S' : t) });
      const st = { A: 'melody', B: 'alberti', C: 'arp' };
      const parts = FORMS[form].plan.map((L, i) => {
        if (L === 'A₁') return { sec: A, style: 'alberti', label: 'A₁', sub: 'figurace' };
        if (L === 'A₂') return Am ? { sec: Am, style: 'melody', label: 'A₂', sub: 'moll' } : { sec: A, style: 'dotted', label: 'A₂', sub: 'rytmus' };
        if (L === 'A₃') return { sec: A, style: 'ornament', label: 'A₃', sub: 'zdobení' };
        const U = L.toUpperCase();
        const sec = U === 'A' ? A : U === 'B' ? B : C;
        return { sec, style: st[U], label: L, sub: sec.K.name };
      });
      return { K, parts, form };
    }
    return null;
  }

  /* ---------- práce s motivem ---------- */
  const DUR = { 8: 0.5, q: 1, 'q.': 1.5, h: 2, w: 4, 16: 0.25 };
  const RHY = [['q', '8', '8', 'q'], ['8', '8', 'q', 'q'], ['q.', '8', 'q', 'q'], ['q', 'q', 'h'], ['8', '8', '8', '8', 'q']];
  function motif() {
    for (let k = 0; k < 100; k++) {
      const r = pick(RHY); let d = 28 + rnd(5); // c¹..g¹ diatonicky
      const ns = r.map((x, i) => { if (i) d += pick([-2, -1, -1, 1, 1, 2, 3, -3]); return { d, r: x }; });
      if (ns.some(n => n.d < 26 || n.d > 37)) continue;
      if (new Set(ns.map(n => n.d)).size < 3) continue;
      return ns;
    }
  }
  const TRANS = {
    rep: { n: 'opakování', f: m => m.map(x => ({ ...x })) },
    seq: { n: 'sekvence (posun o stupeň)', f: m => { const s = pick([1, 2, -1, -2]); return m.map(x => ({ ...x, d: x.d + s })); } },
    inv: { n: 'inverze (zrcadlo)', f: m => m.map(x => ({ ...x, d: 2 * m[0].d - x.d })) },
    ret: { n: 'račí postup (pozpátku)', f: m => m.slice().reverse().map(x => ({ ...x })) },
    aug: { n: 'augmentace (dvojnásobné hodnoty)', f: m => m.map(x => ({ ...x, r: { 8: 'q', q: 'h', 'q.': 'h.', h: 'w' }[x.r] })) },
    dim: { n: 'diminuce (poloviční hodnoty)', f: m => m.map(x => ({ ...x, r: { q: '8', 8: '16', 'q.': '8.', h: 'q' }[x.r] })) },
  };
  const rDur = r => ({ 16: 0.25, 8: 0.5, '8.': 0.75, q: 1, 'q.': 1.5, h: 2, 'h.': 3, w: 4 }[r]);
  function motifItems(m, color) {
    return m.map(x => {
      const dots = x.r.endsWith('.') ? 1 : 0; const d = x.r.replace('.', '');
      return { t: 'n', d, dots, ps: [T.fromDia(x.d)], color };
    });
  }
  function playMotif(ms, bpm = 100, t0 = 0) {
    const b = 60 / bpm; let t = t0;
    ms.forEach(x => { Snd.note(T.midi(T.fromDia(x.d)), t, rDur(x.r) * b * 0.92, 0.8); t += rDur(x.r) * b; });
    return t;
  }
  return { section, events, play, stop, timeline, rel, FORMS, piece, motif, TRANS, motifItems, playMotif, rDur };
})();
